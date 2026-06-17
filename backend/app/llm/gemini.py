from __future__ import annotations

import base64
from typing import Iterator, Type

from pydantic import BaseModel

from ..config import get_settings
from .base import LLMProvider


def _is_quota_error(e: Exception) -> bool:
    """Worth falling back to another model: quota (429) or transient overload (503)."""
    s = str(e)
    return any(
        k in s
        for k in ("RESOURCE_EXHAUSTED", "UNAVAILABLE", "'code': 429", "'code': 503", "429 ", "503 ")
    )


class GeminiProvider(LLMProvider):
    """Default, free provider via google-genai.

    - Tries a primary model and falls back through `models[1:]` on per-model 429 quota.
    - `thinking_budget=0` disables the 2.5 "thinking" phase (a big latency cut for codegen).
      Set `thinking_budget=None` to leave the model default (e.g. for the premium Pro path).
    """

    name = "gemini"

    def __init__(self, models: list[str] | None = None, thinking_budget: int | None = 0):
        from google import genai  # lazy import so the app boots without the dep

        settings = get_settings()
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not set (see backend/.env).")
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.models = models or ([settings.gemini_model] + settings.gemini_fallbacks)
        self.thinking_budget = thinking_budget

    @property
    def model(self) -> str:
        return self.models[0]

    def _cfg(self, model: str, system: str, max_tokens: int, schema: Type[BaseModel] | None = None):
        from google.genai import types

        kw: dict = {"system_instruction": system, "max_output_tokens": max_tokens}
        if schema is not None:
            kw["response_mime_type"] = "application/json"
            kw["response_schema"] = schema
        # Only 2.5 models accept a thinking budget; 2.0 isn't a thinking model.
        if self.thinking_budget is not None and "2.5" in model:
            kw["thinking_config"] = types.ThinkingConfig(thinking_budget=self.thinking_budget)
        return types.GenerateContentConfig(**kw)

    def generate_stream(self, system, user, *, max_tokens=8192) -> Iterator[str]:
        last: Exception | None = None
        for model in self.models:
            yielded = False
            try:
                cfg = self._cfg(model, system, max_tokens)
                for chunk in self.client.models.generate_content_stream(
                    model=model, contents=user, config=cfg
                ):
                    if getattr(chunk, "text", None):
                        yielded = True
                        yield chunk.text
                return
            except Exception as e:  # noqa: BLE001
                if not yielded and _is_quota_error(e):
                    last = e
                    continue
                raise
        if last:
            raise last

    def generate_structured(self, system, user, schema: Type[BaseModel]):
        last: Exception | None = None
        for model in self.models:
            try:
                cfg = self._cfg(model, system, 4096, schema=schema)
                resp = self.client.models.generate_content(model=model, contents=user, config=cfg)
                parsed = getattr(resp, "parsed", None)
                if isinstance(parsed, schema):
                    return parsed
                return schema.model_validate_json(resp.text)
            except Exception as e:  # noqa: BLE001
                if _is_quota_error(e):
                    last = e
                    continue
                raise
        if last:
            raise last

    def generate_vision(self, system, user, image_png_b64, *, max_tokens=4096):
        from google.genai import types

        img = types.Part.from_bytes(data=base64.b64decode(image_png_b64), mime_type="image/png")
        last: Exception | None = None
        for model in self.models:
            try:
                cfg = self._cfg(model, system, max_tokens)
                resp = self.client.models.generate_content(
                    model=model, contents=[img, user], config=cfg
                )
                return resp.text or ""
            except Exception as e:  # noqa: BLE001
                if _is_quota_error(e):
                    last = e
                    continue
                raise
        if last:
            raise last
        return ""
