from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # API keys (stripped — pasted keys often carry stray whitespace/newlines)
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "").strip()
    default_provider: str = os.getenv("DEFAULT_PROVIDER", "gemini")

    # Model IDs — free default is flash-lite (most generous free-tier quota).
    # On a 429 (per-model daily quota) the provider falls back through GEMINI_FALLBACKS in order.
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    gemini_fallbacks: list[str] = [
        m.strip()
        for m in os.getenv("GEMINI_FALLBACKS", "gemini-2.5-flash,gemini-2.0-flash").split(",")
        if m.strip()
    ]
    gemini_pro: str = os.getenv("GEMINI_PRO", "gemini-2.5-pro")

    # Groq — free + very fast (open models). Preferred for codegen when a key is set.
    groq_api_key: str = os.getenv("GROQ_API_KEY", "").strip()
    # Default to gpt-oss-120b — a reasoning model => the best free design quality. It has the tightest
    # free rate limit, so on a 429 we fall back to qwen3-32b (also reasons) then llama-3.3-70b. This
    # trades a little reliability for a real jump in design quality (the user's explicit choice).
    groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    groq_fallbacks: list[str] = [
        m.strip()
        for m in os.getenv("GROQ_FALLBACKS", "qwen/qwen3-32b,llama-3.3-70b-versatile").split(",")
        if m.strip()
    ]

    claude_haiku: str = "claude-haiku-4-5"
    claude_sonnet: str = "claude-sonnet-4-6"
    claude_opus: str = "claude-opus-4-8"

    # CORS (Vite dev server)
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
