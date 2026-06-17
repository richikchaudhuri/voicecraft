# VoiceCraft — Frontend

The Vite + React + TypeScript + Tailwind UI for VoiceCraft. It captures speech
(the browser Web Speech API, with an always-available text fallback), streams
generated React code from the backend over SSE, and renders it live inside a
sandboxed `<iframe>` across **Website / Mobile / Tablet** device frames.

See the [root README](../README.md) for the full project overview, architecture, and setup.

## Develop

```bash
npm install
npm run dev   # http://localhost:5173 (or 5186)
```

Requires the backend running on port 8000 (see [`../backend`](../backend)). Browser
calls to `/api/*` are proxied to the backend in `vite.config.ts`, so the preview
works the same over localhost, LAN, or a tunnel.

## Layout

- `src/lib/` — `speech` (Web Speech wrapper), `api` (SSE client), `sandbox` (iframe srcdoc builder)
- `src/hooks/useVoiceSession.ts` — orchestrates mic → backend → live preview
- `src/components/` — `MicButton`, `TargetSelector`, `DeviceFrame`, `PreviewSandbox`, `CodePanel`
- `public/vendor/` — locally-served React / ReactDOM / Babel / Tailwind for the sandboxed preview (no CDN)
