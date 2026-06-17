from __future__ import annotations

from typing import Iterator

from .design_state import DesignState, Target
from .llm.base import LLMProvider
from .prompts import SYSTEM_CODEGEN


def stream_from_prompt(
    provider: LLMProvider,
    transcript: str,
    target: Target,
    *,
    prior_code: str | None = None,
    max_tokens: int = 8192,
) -> Iterator[str]:
    """One-shot: transcript -> streamed component. No separate intent round-trip.

    For edits, the prior component is passed back in so the model amends it.
    """
    if prior_code:
        user = (
            "Here is the current component:\n```jsx\n"
            + prior_code
            + "\n```\n\n"
            + f'Apply this change and return the FULL updated `function App()` component for target "{target}":\n'
            + f'"{transcript}"'
        )
    else:
        user = (
            f'Build a UI for target "{target}". The user said:\n"{transcript}"\n\n'
            "Generate the single `function App()` component now."
        )
    yield from provider.generate_stream(SYSTEM_CODEGEN, user, max_tokens=max_tokens)


# Kept for the optional structured design-state path (/intent), off the critical path.
def stream_component(provider: LLMProvider, state: DesignState, *, max_tokens: int = 8192) -> Iterator[str]:
    user = (
        f"DESIGN STATE (JSON):\n{state.model_dump_json(indent=2)}\n\n"
        f"Generate the single `function App()` component for target '{state.target}' now."
    )
    yield from provider.generate_stream(SYSTEM_CODEGEN, user, max_tokens=max_tokens)
