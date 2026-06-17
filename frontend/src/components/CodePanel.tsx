export default function CodePanel({ code, status }: { code: string; status: string }) {
  return (
    <div className="flex h-full flex-col bg-[#0b0d12]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          Generated code
        </span>
        <span className="text-[11px] text-gray-500">{status}</span>
      </div>
      <pre className="flex-1 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed text-emerald-200/90">
        <code>{code || '// your component will appear here as it is written'}</code>
      </pre>
    </div>
  )
}
