# VoiceCraft 🎙️

> I talk, it builds. No workshop full of robots required, just a laptop and some questionable confidence.

Talk (or type, if you're shy) and watch an AI build a working UI live. Pick a target, **Website**, **Mobile**, or **Tablet**, describe what you want, and a model writes real React + Tailwind code that renders in a sandboxed preview while you're still mid-sentence. Think JARVIS for frontend, minus the British accent and the multi-billion-dollar suit budget.

Built solo, on a student laptop, for the grand total of $0. It's a non-profit, **free-by-default** product: it runs on free models out of the box (Groq's fast open models for codegen, Google's Gemini free tier for the rest), with Claude or Gemini Pro waiting behind a premium/BYOK switch for when you're feeling fancy. One provider interface, no lock-in, nobody holding your project hostage.

## How it actually works

Not magic. Just good engineering wearing a cape.

```
Browser (Vite + React + TS + Tailwind)        Backend (FastAPI)            LLM provider
  mic -> Web Speech API (+ text fallback)  ->  /generate (SSE)         ->  the router picks a model
  CodePanel <- streamed code (SSE)         <-  llm/ provider router     <- streamed component
  PreviewSandbox: sandboxed <iframe>           sessions (design-state)      Groq / Gemini (free) /
  (Babel transpile + vendored React/Tailwind,                               Claude (premium) / BYOK
   ErrorBoundary, render-on-complete)
```

- **One engine, three device frames.** The same component reflows into phone, tablet, and desktop. Write once, flex everywhere.
- **Render-on-complete.** Code streams into the panel live, but the preview only swaps in once the component is whole. No half-built DOM flickering at you like a glitchy hologram.
- **Sandbox safety.** Generated code runs in `sandbox="allow-scripts"` with zero access to the parent page. I let an AI write code and run it in my app. Reckless, sure. Careless, never.

## What you'll need

- Python 3.11+ and Node 18+ (the boring but non-negotiable part)
- A **free** Groq key for codegen: https://console.groq.com/keys
- A **free** Google AI Studio key for vision and fallback: https://aistudio.google.com/apikey
- Optional flex: an Anthropic key for the premium tier. (Reminder: a Claude.ai subscription is not the same as API credits. Different wallet.)

## Fire it up

**1. Backend**
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env          # then drop your GROQ_API_KEY (and/or GEMINI_API_KEY) into .env
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

**2. Frontend** (new terminal)
```powershell
cd frontend
npm install
npm run dev                      # http://localhost:5173 (or 5186)
```

Open it, pick a target, hit **Speak** (Chrome or Edge) or just type, then watch it build. Try not to look too smug.

## Status (a.k.a. the suit is still in development)

- ✅ Phase 0: backend (FastAPI) + provider abstraction + frontend scaffold. Arc reactor online.
- ✅ Phase 1: the core loop. Voice/text to design-state to streamed codegen to a live sandboxed preview. It flies.
- ⏳ Phase 2 to 4: device-frame reflow, conversational editing, and a vision self-critique loop (it screenshots its own work and roasts itself into something better).
- ⏳ Phase 5 to 6: caching, polish, deploy, then the grown-up stuff before going public (auth, quotas, tiering, spend caps). Pepper would insist.

## Where things live

- `backend/app/llm/` : the provider router (`base`, `gemini`, `groq`, `claude`)
- `backend/app/{intent,codegen,design_state,prompts,sessions}.py` : the pipeline
- `frontend/src/{lib,hooks,components}/` : speech, SSE client, sandbox builder, and the UI

---

Built by Richik Chaudhuri. MIT licensed, so go build something. I already did.
