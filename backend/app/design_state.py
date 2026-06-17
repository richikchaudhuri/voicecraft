from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Target = Literal["website", "mobile", "tablet"]


class DesignTokens(BaseModel):
    primary: str = "#2563eb"
    background: str = "#ffffff"
    text: str = "#111827"
    accent: str = "#f59e0b"
    font_family: str = "sans-serif"
    radius: str = "lg"


class ComponentSpec(BaseModel):
    name: str = Field(description="short id, e.g. 'navbar', 'hero', 'pricing', 'footer'")
    description: str = Field(description="what this section contains and how it should look/behave")


class DesignState(BaseModel):
    """The living spec. Survives across turns; voice/text follow-ups patch it."""

    target: Target = "website"
    title: str = "Untitled"
    intent: str = Field(default="", description="concise running summary of the overall product")
    components: list[ComponentSpec] = Field(default_factory=list)
    tokens: DesignTokens = Field(default_factory=DesignTokens)
    notes: list[str] = Field(default_factory=list)
