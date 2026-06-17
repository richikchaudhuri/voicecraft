from __future__ import annotations

import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from . import codegen, intent, sessions
from .config import get_settings
from .design_state import Target
from .llm.router import get_provider

settings = get_settings()
app = FastAPI(title="VoiceCraft API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only; Phase 6 locks this to the deployed frontend origin
    allow_methods=["*"],
    allow_headers=["*"],
)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _friendly_error(e: Exception) -> tuple[int, str]:
    """Map raw provider exceptions to a clean, provider-agnostic (status, message) for the UI."""
    s = str(e)
    low = s.lower()
    if "RESOURCE_EXHAUSTED" in s or "'code': 429" in s or "429 " in s or "rate limit" in low or "rate_limit" in low:
        return 429, (
            "The free model is rate-limited or out of quota right now. Wait ~30-60 seconds and try again, "
            "switch GROQ_MODEL / GEMINI_MODEL in backend/.env, or use a paid key for dedicated capacity."
        )
    if "UNAVAILABLE" in s or "'code': 503" in s or "503 " in s or "overload" in low:
        return 503, "The model is briefly overloaded — try again in a few seconds."
    if "api_key_invalid" in low or "api key" in low or "invalid api key" in low:
        return 401, (
            "An API key looks invalid or expired. Check GROQ_API_KEY / GEMINI_API_KEY in backend/.env "
            "and restart the backend."
        )
    return 502, f"LLM error: {s[:300]}"


@app.get("/health")
def health():
    codegen = "groq" if settings.groq_api_key else ("gemini" if settings.gemini_api_key else "none")
    return {
        "ok": True,
        "codegen_provider": codegen,
        "groq_key": bool(settings.groq_api_key),
        "gemini_key": bool(settings.gemini_api_key),
        "claude_key": bool(settings.anthropic_api_key),
        "groq_model": settings.groq_model,
        "gemini_models": [settings.gemini_model, *settings.gemini_fallbacks],
    }


@app.get("/hello")
def hello(prompt: str = "Say hi from VoiceCraft in one short sentence."):
    """Smoke test: proves the default (free Gemini) provider streams."""

    def gen():
        try:
            provider = get_provider("codegen", "free")
            for chunk in provider.generate_stream("You are concise and friendly.", prompt, max_tokens=256):
                yield _sse({"text": chunk})
        except Exception as e:  # noqa: BLE001
            _, msg = _friendly_error(e)
            yield _sse({"error": msg})
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


class GenerateReq(BaseModel):
    session_id: str
    transcript: str
    target: Target = "website"
    tier: str = "free"


@app.post("/generate")
def post_generate(req: GenerateReq):
    """Transcript -> streamed React component, in ONE call (no separate intent round-trip).
    The last component is stored per session so follow-up requests can amend it."""

    def gen():
        acc: list[str] = []
        errored = False
        try:
            # Resolve the provider INSIDE the generator: constructing it can raise (e.g. a missing
            # key) and lru_cache does not cache exceptions, so doing it here turns that into a clean
            # SSE error frame instead of a raw 500 with no body.
            provider = get_provider("codegen", req.tier)
            prior = sessions.get_code(req.session_id)
            for chunk in codegen.stream_from_prompt(provider, req.transcript, req.target, prior_code=prior):
                acc.append(chunk)
                yield _sse({"text": chunk})
        except Exception as e:  # noqa: BLE001 — surface a clean message so the UI degrades gracefully
            errored = True
            _, msg = _friendly_error(e)
            yield _sse({"error": msg})
        if not errored:
            full = "".join(acc)
            if full.strip():
                sessions.set_code(req.session_id, full)
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


@app.post("/reset/{session_id}")
def reset(session_id: str):
    sessions.reset(session_id)
    return {"ok": True}


# --- Optional: structured design-state endpoint, kept off the critical path for future
# conversational-editing / analytics work (Phase 3). The live UI does not call this. ---
class IntentReq(BaseModel):
    session_id: str
    transcript: str
    target: Target = "website"
    tier: str = "free"


@app.post("/intent")
def post_intent(req: IntentReq):
    provider = get_provider("intent", req.tier)
    current = sessions.get_state(req.session_id, req.target)
    try:
        new_state = intent.update_design_state(provider, current, req.transcript, req.target)
    except Exception as e:  # noqa: BLE001
        code, msg = _friendly_error(e)
        return JSONResponse(status_code=code, content={"error": msg})
    sessions.set_state(req.session_id, new_state)
    return new_state
