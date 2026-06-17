from __future__ import annotations

from .design_state import DesignState, Target

# In-memory session store for the MVP (single process). Phase 6 swaps this for Redis/Postgres
# and adds per-user quota counters.
_SESSIONS: dict[str, DesignState] = {}
_CODE: dict[str, str] = {}  # last generated component per session (for edits)


def get_state(session_id: str, target: Target = "website") -> DesignState:
    state = _SESSIONS.get(session_id)
    if state is None:
        state = DesignState(target=target)
        _SESSIONS[session_id] = state
    return state


def set_state(session_id: str, state: DesignState) -> None:
    _SESSIONS[session_id] = state


def get_code(session_id: str) -> str | None:
    return _CODE.get(session_id)


def set_code(session_id: str, code: str) -> None:
    _CODE[session_id] = code


def reset(session_id: str) -> None:
    _SESSIONS.pop(session_id, None)
    _CODE.pop(session_id, None)
