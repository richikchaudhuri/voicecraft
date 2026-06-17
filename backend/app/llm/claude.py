from __future__ import annotations

from typing import Type

from pydantic import BaseModel

from ..config import get_settings
from .base import LLMProvider


class ClaudeProvider(LLMProvider):
    """Premium provider via the anthropic SDK. Prompt-caches the (frozen) system prompt."""

    name = "claude"

    def __init__(self, model: str | None = None):
        import anthropic

        settings = get_settings()
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set (premium tier).")
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = model or settings.claude_sonnet

    def _system(self, system: str):
        return [{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}]

    def generate_stream(self, system, user, *, max_tokens=4096):
        with self.client.messages.stream(
            model=self.model,
            max_tokens=max_tokens,
            system=self._system(system),
            messages=[{"role": "user", "content": user}],
        ) as stream:
            for text in stream.text_stream:
                yield text

    def generate_structured(self, system, user, schema: Type[BaseModel]):
        resp = self.client.messages.parse(
            model=self.model,
            max_tokens=4096,
            system=self._system(system),
            messages=[{"role": "user", "content": user}],
            output_format=schema,
        )
        return resp.parsed_output

    def generate_vision(self, system, user, image_png_b64, *, max_tokens=4096):
        resp = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=self._system(system),
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": image_png_b64,
                            },
                        },
                        {"type": "text", "text": user},
                    ],
                }
            ],
        )
        return "".join(b.text for b in resp.content if b.type == "text")
