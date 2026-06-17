from __future__ import annotations

from functools import lru_cache

from ..config import get_settings
from .base import LLMProvider

# Provider router. Default to FREE providers:
#   - codegen / intent -> Groq (fast) when a key is set, else Gemini
#   - vision           -> Gemini (best free image understanding)
#   - premium tier     -> Claude (when a key is set)


@lru_cache
def _groq() -> LLMProvider:
    from .groq import GroqProvider

    return GroqProvider()


@lru_cache
def _gemini_free() -> LLMProvider:
    from .gemini import GeminiProvider

    return GeminiProvider()  # flash-lite primary + fallbacks, thinking off


@lru_cache
def _gemini_pro() -> LLMProvider:
    from .gemini import GeminiProvider

    return GeminiProvider(models=[get_settings().gemini_pro], thinking_budget=None)


@lru_cache
def _claude_sonnet() -> LLMProvider:
    from .claude import ClaudeProvider

    return ClaudeProvider(model=get_settings().claude_sonnet)


def get_provider(step: str = "codegen", tier: str = "free") -> LLMProvider:
    """step: 'codegen' | 'intent' | 'vision'. tier: 'free' | 'pro' | 'premium'."""
    s = get_settings()

    # Premium tier -> Claude (if configured).
    if tier in ("pro", "premium") and s.anthropic_api_key:
        return _claude_sonnet()

    # Vision -> Gemini (best free image understanding). Raises a clear error if no Gemini key.
    if step == "vision":
        return _gemini_free()

    # Codegen / intent (free): prefer Groq for speed, else Gemini.
    if s.groq_api_key:
        return _groq()
    return _gemini_free()
