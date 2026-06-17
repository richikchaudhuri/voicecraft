from __future__ import annotations

from typing import Iterator, Type

from pydantic import BaseModel


class LLMProvider:
    """Provider-agnostic interface. Every step in the pipeline talks to the LLM only through this,
    so Gemini (free) / Claude (premium) / a local model are swappable without touching the pipeline."""

    name: str = "base"

    def generate_stream(self, system: str, user: str, *, max_tokens: int = 4096) -> Iterator[str]:
        """Yield text chunks (for streaming code generation)."""
        raise NotImplementedError

    def generate_structured(self, system: str, user: str, schema: Type[BaseModel]) -> BaseModel:
        """Return a validated instance of `schema` (for the design-state)."""
        raise NotImplementedError

    def generate_vision(self, system: str, user: str, image_png_b64: str, *, max_tokens: int = 4096) -> str:
        """Return text given an image + prompt (for the screenshot critique)."""
        raise NotImplementedError
