import type { ReactNode } from 'react'
import type { Target } from '../lib/types'

// Device frames that glow on the dark aurora canvas. Switching target reflows live.
export default function DeviceFrame({ target, children }: { target: Target; children: ReactNode }) {
  if (target === 'website') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="vc-fade-in flex h-full max-h-[740px] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_30px_120px_-30px_rgba(124,92,255,0.55)] ring-1 ring-white/10">
          <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#f6f6f8] px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <div className="mx-auto flex items-center gap-1.5 rounded-md bg-black/[0.05] px-3 py-1 text-[11px] text-gray-400">
              <span>🔒</span> voicecraft.app
            </div>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </div>
      </div>
    )
  }

  const isMobile = target === 'mobile'
  const w = isMobile ? 380 : 760
  const h = isMobile ? 760 : 980
  const pad = isMobile ? 12 : 14
  const radius = isMobile ? 52 : 38

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto">
      <div
        className="vc-fade-in relative shrink-0 bg-[#0b0b0d] shadow-[0_30px_120px_-30px_rgba(124,92,255,0.6)] ring-1 ring-white/10"
        style={{ width: w + pad * 2, borderRadius: radius, padding: pad }}
      >
        {isMobile && (
          <div className="absolute left-1/2 top-[16px] z-10 h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-black" />
        )}
        <div
          className="overflow-hidden bg-white"
          style={{ width: w, height: h, borderRadius: radius - pad }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
