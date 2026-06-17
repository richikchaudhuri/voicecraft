# VoiceCraft 🎙️

Speak (or type) a UI and watch an AI design it live. Pick a target — **Website / Mobile / Tablet** —
and a model generates a working React + Tailwind UI that renders in a sandboxed preview as you talk.

A non-profit, **free-by-default** product: the default provider is Google's free Gemini tier (with Groq's
free, fast open models for codegen), and Claude (or Gemini Pro) available as a premium/BYOK toggle behind
one provider interface. No lock-in.

> Roadmap is in the **Status** section below.

## Architecture

```
Browser (Vite + React + TS + Tailwind)        Backend (FastAPI)            LLM provider
  mic → Web Speech API (+ text fallback)   →   /intent  (LLM: Flash)   →   design-state JSON
  CodePanel ← streamed code (SSE)          ←   /generate (LLM: Flash)  ←   streamed component
  PreviewSandbox: sandboxed <iframe>            llm/ provider router         Groq / Gemini (free) /
  (Babel transpile + vendored React/Tailwind +  sessions (design-state)      Claude (premium) /
   ErrorBoundary, render-on-complete)                                        BYOK
```

- **One codegen engine, three device frames** — the same component reflows into phone/tablet/desktop frames.
- **Render-on-complete** — code streams into the panel live; the preview swaps in atomically (no broken DOM).
- **Sandbox safety** — generated code runs in `sandbox="allow-scripts"` (no parent access).

## Prerequisites

- Python 3.11+ and Node 18+
- A **free** Groq key (fast; used for codegen) → https://console.groq.com/keys
- A **free** Google AI Studio key (used for vision / fallback) → https://aistudio.google.com/apikey
  (optional premium: an Anthropic key — note a Claude.ai subscription does **not** include API usage)

## Run it

**1. Backend**
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env          # then paste your GROQ_API_KEY (and/or GEMINI_API_KEY) into .env
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

**2. Frontend** (new terminal)
```powershell
cd frontend
npm install
npm run dev                      # http://localhost:5173  (or 5186)
```

Open the frontend, choose a target, hit **Speak** (Chrome/Edge) or type a prompt, and watch it build.

## Status

- ✅ Phase 0 — backend (FastAPI) + provider abstraction (Gemini default, Claude premium) + frontend scaffold
- ✅ Phase 1 — core loop: voice/text → design-state → streamed codegen → sandboxed live preview
- ⏳ Phase 2–4 — device-frame reflow, conversational editing, vision self-critique
- ⏳ Phase 5–6 — caching/polish/deploy, then public hardening (auth, quotas, tiering, spend caps)

## Project layout
- `backend/app/llm/` — provider router (`base`, `gemini`, `claude`)
- `backend/app/{intent,codegen,design_state,prompts,sessions}.py` — the pipeline
- `frontend/src/{lib,hooks,components}/` — speech, SSE client, sandbox builder, UI
