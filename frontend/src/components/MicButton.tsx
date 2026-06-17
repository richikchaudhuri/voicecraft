export default function MicButton({
  listening,
  supported,
  busy = false,
  onToggle,
}: {
  listening: boolean
  supported: boolean
  busy?: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      disabled={!supported || busy}
      aria-label={listening ? 'Stop listening' : 'Speak'}
      aria-pressed={listening}
      title={
        !supported
          ? 'Speech needs Chrome/Edge — use the text box'
          : busy
            ? 'Designing… one moment'
            : 'Tap, then speak'
      }
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
        listening
          ? 'bg-gradient-to-br from-[#ff5f57] to-[#e0443e]'
          : 'bg-gradient-to-br from-[#3b82f6] via-[#7c3aed] to-[#ec4899] hover:brightness-110'
      }`}
    >
      {listening && <span className="vc-pulse-ring pointer-events-none absolute inset-0 rounded-full" />}
      <span className="relative text-lg">{listening ? '⏺' : '🎙️'}</span>
    </button>
  )
}
