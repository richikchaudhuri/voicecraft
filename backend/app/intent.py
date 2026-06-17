from __future__ import annotations

from .design_state import DesignState, Target
from .llm.base import LLMProvider
from .prompts import SYSTEM_INTENT


def update_design_state(
    provider: LLMProvider, current: DesignState, transcript: str, target: Target
) -> DesignState:
    user = (
        f"CURRENT DESIGN STATE (JSON):\n{current.model_dump_json(indent=2)}\n\n"
        f"TARGET PLATFORM: {target}\n"
        f'USER INSTRUCTION: "{transcript}"\n\n'
        "Return the full updated design state."
    )
    new_state = provider.generate_structured(SYSTEM_INTENT, user, DesignState)
    assert isinstance(new_state, DesignState)
    new_state.target = target  # always honor the explicitly selected target
    return new_state
