import { useState } from 'react'
import { useVoiceSession } from './hooks/useVoiceSession'
import TargetSelector from './components/TargetSelector'
import MicButton from './components/MicButton'
import CodePanel from './components/CodePanel'
import DeviceFrame from './components/DeviceFrame'
import PreviewSandbox from './components/PreviewSandbox'

const CHIPS = ['A calculator', 'Coffee shop landing page', 'A to-do app', 'Pricing page']

const STATUS: Record<string, { label: string; dot: string }> = {
  idle: { label: 'Ready', dot: 'bg-white/30' },
  designing: { label: 'Designing…', dot: 'bg-blue-400 animate-pulse' },
  ready: { label: 'Done', dot: 'bg-emerald-400' },
  error: { label: 'Error', dot: 'bg-red-400' },
}

export default function App() {
  const s = useVoiceSession()
  const [draft, setDraft] = useState('')
  const [showCode, setShowCode] = useState(false)
  const busy = s.status === 'designing'
  const st = STATUS[s.status] ?? STATUS.idle

  const send = (text?: string) => {
    const t = (text ?? draft).trim()
    if (!t || busy) return
    setDraft('')
    void s.submit(t)
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#070810] text-white">
      {/* Aurora wash */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="vc-blob vc-blob-a" style={{ background: 'radial-gradient(circle, #2563eb, transparent 70%)', width: '55vw', height: '55vw', top: '-18%', left: '-12%' }} />
        <div className="vc-blob vc-blob-b" style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)', width: '50vw', height: '50vw', top: '4%', right: '-14%' }} />
        <div className="vc-blob vc-blob-c" style={{ background: 'radial-gradient(circle, #db2777, transparent 70%)', width: '46vw', height: '46vw', bottom: '-22%', left: '24%' }} />
        <div className="absolute inset-0 bg-[#070810]/50" />
      </div>

      {/* Top bar */}
      <header className="vc-enter relative z-20 flex h-12 shrink-0 items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b82f6] via-[#7c3aed] to-[#ec4899] text-sm shadow-[0_4px_14px_rgba(124,58,237,0.5)]">
            🎙️
          </div>
          <span className="text-[15px] font-semibold tracking-tight">VoiceCraft</span>
          <span className="hidden text-[11px] font-medium text-white/40 sm:inline">AI UI Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
            <span className="text-[11px] text-white/50">{st.label}</span>
          </div>
          <button
            onClick={() => setShowCode((v) => !v)}
            className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/70 backdrop-blur transition hover:bg-white/[0.12]"
          >
            {showCode ? 'Hide code' : '⟨⟩ Code'}
          </button>
        </div>
      </header>

      {/* Full-bleed preview hero */}
      <main className="relative z-10 min-h-0 flex-1 px-6 pb-40 pt-2">
        <DeviceFrame target={s.target}>
          <PreviewSandbox
            srcDoc={s.srcDoc}
            designing={busy}
            streamingCode={s.code}
            errored={s.status === 'error'}
            errorMessage={s.error}
          />
        </DeviceFrame>
      </main>

      {/* Floating command bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-4 pb-6">
        {!s.srcDoc && !busy && !s.error && (
          <div className="vc-enter pointer-events-auto flex flex-wrap justify-center gap-2" style={{ animationDelay: '140ms' }}>
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => send(c)}
                className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-[12.5px] text-white/70 backdrop-blur transition hover:border-white/25 hover:text-white"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {(s.interim || s.finalText || s.error) && (
          <div
            className={`pointer-events-auto max-w-[760px] truncate rounded-full border px-4 py-1.5 text-[12.5px] backdrop-blur ${
              s.error ? 'border-red-400/30 bg-red-500/15 text-red-200' : 'border-white/10 bg-white/[0.07] text-white/75'
            }`}
          >
            {s.error ? s.error : `${s.finalText}${s.interim ? ` ${s.interim}` : ''}`}
          </div>
        )}

        <div
          className="vc-enter pointer-events-auto flex w-full max-w-[760px] items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.07] p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
          style={{ animationDelay: '80ms' }}
        >
          <TargetSelector value={s.target} onChange={s.setTarget} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Describe a UI — or tap the mic…"
            className="min-w-0 flex-1 bg-transparent px-2 text-[14px] text-white outline-none placeholder:text-white/35"
          />
          <MicButton listening={s.listening} supported={s.supported} busy={busy} onToggle={s.toggleListening} />
          <button
            onClick={() => send()}
            disabled={!draft.trim() || busy}
            aria-label="Generate"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-lg text-[#070810] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30"
          >
            ↑
          </button>
        </div>
      </div>

      {/* Code slide-over */}
      {showCode && (
        <aside className="vc-fade-in absolute bottom-0 right-0 top-12 z-40 w-[420px] overflow-hidden border-l border-white/10 bg-[#0b0d12]/95 backdrop-blur-xl">
          <CodePanel code={s.code} status={st.label} />
        </aside>
      )}
    </div>
  )
}
