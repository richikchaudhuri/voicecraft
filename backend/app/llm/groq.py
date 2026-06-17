from __future__ import annotations

import json
from typing import Iterator, Type

from pydantic import BaseModel

from ..config import get_settings
from .base import LLMProvider


def _retryable(e: Exception) -> bool:
    """Fall back to the next model on transient errors (429 / 5xx / timeout / connection) or
    model-level issues (a decommissioned/unknown model, an unsupported parameter). Auth and
    permission failures (401/403) are NOT retryable: the key is shared across every model, so
    retrying just burns the whole fallback chain and hides the real error from the user."""
    status = getattr(e, "status_code", None) or getattr(getattr(e, "response", None), "status_code", None)
    if status in (401, 403):
        return False
    if status in (404, 408, 409, 429, 500, 502, 503, 504):
        return True
    s = str(e).lower()
    if "api key" in s or "api_key" in s or "authentication" in s or "permission" in s:
        return False
    # model/param-level problems a different model may not have -> try the next one
    model_param = (
        "decommission", "no longer", "does not exist", "not found", "unknown model",
        "unsupported", "parameter", "model_not_found",
    )
    if any(k in s for k in model_param):
        return True
    # transient signals when no HTTP status is exposed (e.g. raw connection errors)
    transient = ("429", "rate limit", "rate_limit", "503", "overload", "unavailable", "timeout", "connection")
    return any(k in s for k in transient)


class GroqProvider(LLMProvider):
    """Free + fast provider via the Groq SDK. Prefers reasoning models (gpt-oss / qwen3) for
    design quality, with reasoning hidden from the streamed output so only the final code streams."""

    name = "groq"

    def __init__(self, models: list[str] | None = None):
        from groq import Groq

        settings = get_settings()
        if not settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not set (free key at https://console.groq.com).")
        self.client = Groq(api_key=settings.groq_api_key)
        self.models = models or ([settings.groq_model] + settings.groq_fallbacks)

    @property
    def model(self) -> str:
        return self.models[0]

    @staticmethod
    def _messages(system: str, user: str) -> list[dict]:
        return [{"role": "system", "content": system}, {"role": "user", "content": user}]

    @staticmethod
    def _reasoning_kwargs(model: str) -> dict:
        # Hide reasoning tokens so only the final answer (code) streams. Give reasoning models
        # enough budget for thinking + the component.
        if "gpt-oss" in model:
            return {"reasoning_effort": "medium", "reasoning_format": "hidden", "max_tokens": 16384}
        if "qwen3" in model:
            return {"reasoning_format": "hidden", "max_tokens": 16384}
        return {}

    def generate_stream(self, system, user, *, max_tokens=8192) -> Iterator[str]:
        last: Exception | None = None
        for model in self.models:
            yielded = False
            try:
                kwargs = dict(
                    model=model,
                    messages=self._messages(system, user),
                    max_tokens=max_tokens,
                    temperature=0.7,
                    stream=True,
                )
                kwargs.update(self._reasoning_kwargs(model))
                stream = self.client.chat.completions.create(**kwargs)
                for chunk in stream:
                    delta = chunk.choices[0].delta.content if chunk.choices else None
                    if delta:
                        yielded = True
                        yield delta
                return
            except Exception as e:  # noqa: BLE001
                if not yielded and _retryable(e):
                    last = e
                    continue
                raise
        if last:
            raise last

    def generate_structured(self, system, user, schema: Type[BaseModel]):
        sys2 = (
            system
            + "\n\nReturn ONLY a JSON object matching this JSON Schema:\n"
            + json.dumps(schema.model_json_schema())
        )
        last: Exception | None = None
        for model in self.models:
            try:
                resp = self.client.chat.completions.create(
                    model=model,
                    messages=self._messages(sys2, user),
                    max_tokens=4096,
                    temperature=0.3,
                    response_format={"type": "json_object"},
                )
                text = resp.choices[0].message.content or "{}"
                return schema.model_validate_json(text)
            except Exception as e:  # noqa: BLE001
                if _retryable(e):
                    last = e
                    continue
                raise
        if last:
            raise last

    def generate_vision(self, system, user, image_png_b64, *, max_tokens=4096):
        raise RuntimeError("Groq vision is not enabled — vision requests route to Gemini.")
