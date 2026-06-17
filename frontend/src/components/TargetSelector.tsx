import type { Target } from '../lib/types'

const TARGETS: { id: Target; icon: string; label: string }[] = [
  { id: 'website', icon: '🖥️', label: 'Website' },
  { id: 'mobile', icon: '📱', label: 'Mobile' },
  { id: 'tablet', icon: '📲', label: 'Tablet' },
]

// Compact dark segmented control (icon-only) with a sliding thumb, for the command bar.
export default function TargetSelector({
  value,
  onChange,
}: {
  value: Target
  onChange: (t: Target) => void
}) {
  const idx = Math.max(0, TARGETS.findIndex((t) => t.id === value))
  return (
    <div className="relative flex shrink-0 rounded-xl bg-white/[0.06] p-1">
      <div
        className="absolute bottom-1 left-1 top-1 rounded-lg bg-white/[0.16] transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: `calc((100% - 0.5rem) / ${TARGETS.length})`, transform: `translateX(${idx * 100}%)` }}
      />
      {TARGETS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          title={t.label}
          aria-label={t.label}
          aria-pressed={value === t.id}
          className={`relative z-10 px-3 py-1.5 text-[15px] transition-opacity duration-200 ${
            value === t.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'
          }`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
