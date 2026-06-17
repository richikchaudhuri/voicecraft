import type { Target } from './types'

// Same-origin proxy path (see vite.config.ts) so it works through tunnels / LAN / other devices.
const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api'

async function errorMessage(res: Response): Promise<string> {
  let msg = `Request failed (${res.status})`
  try {
    const j = await res.json()
    if (j?.error) msg = j.error
  } catch {
    /* non-JSON error body */
  }
  return msg
}

export interface StreamHandlers {
  onChunk: (text: string) => void
  onError?: (msg: string) => void
  onDone?: () => void
}

/** One call: transcript -> streamed component code (SSE). No separate intent round-trip. */
export async function streamGenerate(
  sessionId: string,
  transcript: string,
  target: Target,
  tier: string,
  h: StreamHandlers,
): Promise<void> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, transcript, target, tier }),
  })
  if (!res.ok || !res.body) throw new Error(await errorMessage(res))

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (data === '[DONE]') {
        h.onDone?.()
        return
      }
      try {
        const obj = JSON.parse(data)
        if (obj.error) h.onError?.(obj.error)
        else if (obj.text) h.onChunk(obj.text)
      } catch {
        /* ignore partial frames */
      }
    }
  }
  h.onDone?.()
}
