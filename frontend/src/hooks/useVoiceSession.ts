import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Target } from '../lib/types'
import { streamGenerate } from '../lib/api'
import { SpeechController, speechSupported } from '../lib/speech'
import { buildSrcDoc } from '../lib/sandbox'

export type Status = 'idle' | 'designing' | 'ready' | 'error'

function newSessionId() {
  return 'sess-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useVoiceSession() {
  const [sessionId] = useState(newSessionId)
  const [target, setTarget] = useState<Target>('website')
  const [finalText, setFinalText] = useState('')
  const [interim, setInterim] = useState('')
  const [listening, setListening] = useState(false)
  const [code, setCode] = useState('')
  const [srcDoc, setSrcDoc] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const supported = useMemo(() => speechSupported(), [])
  const speechRef = useRef<SpeechController | null>(null)
  const inFlightRef = useRef(false)
  const targetRef = useRef(target)
  useEffect(() => {
    targetRef.current = target
  }, [target])

  const submit = useCallback(
    async (text: string) => {
      const prompt = text.trim()
      if (!prompt || inFlightRef.current) return // ignore re-entrant submits (e.g. voice onFinal mid-generation)
      inFlightRef.current = true
      setError(null)
      setFinalText(prompt)
      setInterim('')
      setStatus('designing')
      setCode('')
      let acc = ''
      let errored = false
      try {
        // One call: transcript -> streamed code (no separate intent round-trip).
        await streamGenerate(sessionId, prompt, targetRef.current, 'free', {
          onChunk: (t) => {
            acc += t
            setCode(acc)
          },
          onError: (msg) => {
            errored = true
            setError(msg)
            setStatus('error')
          },
          onDone: () => {
            // A mid-stream error frame already set status=error — don't clobber it with
            // "ready" and render truncated/broken code as if it succeeded.
            if (errored) return
            if (acc.trim()) {
              setSrcDoc(buildSrcDoc(acc)) // render-on-complete (not token-by-token)
              setStatus('ready')
            } else {
              setError('No code was generated.')
              setStatus('error')
            }
          },
        })
      } catch (e: any) {
        setError(String(e?.message || e))
        setStatus('error')
      } finally {
        inFlightRef.current = false
      }
    },
    [sessionId],
  )

  useEffect(() => {
    speechRef.current = new SpeechController({
      onInterim: (t) => setInterim(t),
      onFinal: (t) => {
        setListening(false)
        void submit(t)
      },
      // listening is driven by the real recognition lifecycle (below) so it can never
      // desync from the actual mic state.
      onStart: () => setListening(true),
      onError: (msg) => {
        setListening(false)
        setError(msg)
      },
      onEnd: () => setListening(false),
    })
    return () => speechRef.current?.stop()
  }, [submit])

  const toggleListening = useCallback(() => {
    const c = speechRef.current
    if (!c) return
    if (listening) {
      c.stop()
      setListening(false)
    } else {
      // Don't optimistically flip to "listening" — start() may throw or be denied.
      // onStart sets it true once the mic is actually live; onError/onEnd reset it.
      setError(null)
      setInterim('')
      c.start()
    }
  }, [listening])

  return {
    sessionId,
    target,
    setTarget,
    finalText,
    interim,
    listening,
    supported,
    code,
    srcDoc,
    status,
    error,
    submit,
    toggleListening,
  }
}
