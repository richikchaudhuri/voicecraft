// Thin wrapper over the browser Web Speech API (Chromium-only). A text fallback
// in the UI covers every other browser.

type Handlers = {
  onInterim?: (text: string) => void
  onFinal: (text: string) => void
  onError?: (msg: string) => void
  onStart?: () => void
  onEnd?: () => void
}

export function speechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
}

// Map raw Web Speech error codes to something a person can act on.
function friendly(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone blocked — allow mic access in your browser, then try again.'
    case 'no-speech':
      return "Didn't catch that — tap the mic and speak, or use the text box."
    case 'audio-capture':
      return 'No microphone found — plug one in or use the text box.'
    case 'network':
      return 'Speech service is offline right now — use the text box.'
    case 'aborted':
      return '' // user-initiated stop; not an error worth showing
    default:
      return 'Speech recognition hiccuped — try again or use the text box.'
  }
}

export class SpeechController {
  private rec: any = null
  private handlers: Handlers
  listening = false

  constructor(handlers: Handlers) {
    this.handlers = handlers
  }

  start() {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!Ctor) {
      this.handlers.onError?.('Speech recognition is not supported here — use the text box.')
      return
    }
    // Tear down any prior instance so a fast double-tap can't throw "already started".
    if (this.rec) {
      try {
        this.rec.onend = null
        this.rec.abort()
      } catch {
        /* noop */
      }
      this.rec = null
    }

    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.onstart = () => {
      this.listening = true
      this.handlers.onStart?.()
    }
    rec.onresult = (e: any) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      if (interim) this.handlers.onInterim?.(interim)
      if (final.trim()) this.handlers.onFinal(final.trim())
    }
    rec.onerror = (e: any) => {
      this.listening = false
      const msg = friendly(e?.error || '')
      if (msg) this.handlers.onError?.(msg)
      else this.handlers.onEnd?.()
    }
    rec.onend = () => {
      this.listening = false
      this.handlers.onEnd?.()
    }
    this.rec = rec

    // start() can throw synchronously (permission state, re-entrancy) — never let it
    // escape into the React click handler, or the mic appears dead with a console error.
    try {
      rec.start()
    } catch {
      this.listening = false
      this.handlers.onError?.('Could not start the mic — check permissions, then try again.')
    }
  }

  stop() {
    try {
      this.rec?.stop()
    } catch {
      /* noop */
    }
    this.listening = false
  }
}
