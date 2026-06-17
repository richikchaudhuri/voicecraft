import { useEffect, useRef } from 'react'

export default function PreviewSandbox({
  srcDoc,
  designing,
  streamingCode,
  errored,
  errorMessage,
}: {
  srcDoc: string
  designing: boolean
  streamingCode?: string
  errored?: boolean
  errorMessage?: string | null
}) {
  const codeRef = useRef<HTMLPreElement>(null)
  useEffect(() => {
    if (designing && codeRef.current) codeRef.current.scrollTop = codeRef.current.scrollHeight
  }, [streamingCode, designing])

  // While generating, show the code streaming live so the wait feels active.
  if (designing) {
    return (
      <div className="flex h-full w-full flex-col bg-[#0b0d12]">
        <div className="vc-shimmer relative flex items-center gap-2.5 overflow-hidden border-b border-white/[0.08] px-4 py-3">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
          <span className="text-[12px] font-medium text-blue-300">Designing…</span>
          <span className="ml-auto text-[11px] tabular-nums text-gray-500">
            {streamingCode ? `${streamingCode.length.toLocaleString()} chars` : ''}
          </span>
        </div>
        <pre
          ref={codeRef}
          className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-200/80"
        >
          <code>{streamingCode || '// thinking about the design…'}</code>
        </pre>
      </div>
    )
  }

  // Keep the last good design on screen even if a retry fails.
  if (srcDoc) {
    return (
      <iframe
        title="preview"
        className="vc-fade-in h-full w-full border-0"
        // allow-scripts only (no allow-same-origin): generated code can't touch the parent app.
        sandbox="allow-scripts"
        srcDoc={srcDoc}
      />
    )
  }

  // Graceful failure (the state most likely on a free, rate-limited tier).
  if (errored) {
    return (
      <div className="vc-fade-in flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-white to-[#f5f5f7] p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">⚠️</div>
        <p className="text-[15px] font-semibold text-gray-800">Couldn't generate that</p>
        <p className="max-w-sm text-[13px] leading-relaxed text-gray-500">
          {errorMessage || 'Something went wrong. Please try again.'}
        </p>
        <p className="mt-1 text-[12px] text-gray-400">
          Tip: wait ~30–60s (free-tier limit) or try a simpler prompt.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-white to-[#f5f5f7] p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#0a84ff] to-[#0066d6] text-2xl shadow-[0_8px_24px_rgba(10,132,255,0.35)]">
        🎙️
      </div>
      <div>
        <p className="text-[15px] font-semibold text-gray-800">Speak or type to begin</p>
        <p className="mt-1 max-w-xs text-[13px] text-gray-400">
          Describe what you want to build and watch it come to life, live.
        </p>
      </div>
    </div>
  )
}
