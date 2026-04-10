from __future__ import annotations

import random
from dataclasses import dataclass
from enum import Enum

from market.token import Token


class EventType(str, Enum):
    WHALE = "whale"
    FUD = "fud"
    VIRAL = "viral"
    CRISIS = "crisis"
    NARRATIVE = "narrative"


THEMES = ["animal", "politics", "tech", "humor", "food", "crypto", "popculture", "absurd"]


@dataclass
class Event:
    type: EventType
    target_token_id: str | None = None
    target_theme: str | None = None
    magnitude: float = 1.0

    def to_dict(self) -> dict:
        return {
            "type": self.type.value,
            "target_token_id": self.target_token_id,
            "target_theme": self.target_theme,
            "magnitude": self.magnitude,
        }


def generate_events(
    whale_prob: float,
    fud_prob: float,
    viral_prob: float,
    crisis_prob: float,
    narrative_prob: float,
) -> list[Event]:
    events: list[Event] = []
    if random.random() < whale_prob:
        events.append(Event(type=EventType.WHALE, magnitude=random.uniform(2.0, 10.0)))
    if random.random() < fud_prob:
        events.append(Event(type=EventType.FUD, magnitude=random.uniform(0.5, 0.9)))
    if random.random() < viral_prob:
        events.append(Event(type=EventType.VIRAL, magnitude=random.uniform(3.0, 8.0)))
    if random.random() < crisis_prob:
        events.append(Event(type=EventType.CRISIS))
    if random.random() < narrative_prob:
        events.append(Event(
            type=EventType.NARRATIVE,
            target_theme=random.choice(THEMES),
            magnitude=random.uniform(1.5, 3.0),
        ))
    return events


def apply_event(event: Event, tokens: dict[str, Token]) -> None:
    if not tokens:
        return

    if event.type == EventType.WHALE:
        target_id = event.target_token_id or random.choice(list(tokens.keys()))
        token = tokens.get(target_id)
        if token and token.state.value == "active":
            token.recent_volume += event.magnitude * 2.0

    elif event.type == EventType.FUD:
        for token in tokens.values():
            if token.state.value == "active":
                token.recent_volume *= event.magnitude

    elif event.type == EventType.VIRAL:
        target_id = event.target_token_id or random.choice(list(tokens.keys()))
        token = tokens.get(target_id)
        if token and token.state.value == "active":
            token.recent_volume += event.magnitude

    elif event.type == EventType.CRISIS:
        target_id = event.target_token_id or random.choice(list(tokens.keys()))
        token = tokens.get(target_id)
        if token and token.state.value == "active":
            token.recent_volume *= 0.3

    elif event.type == EventType.NARRATIVE:
        for token in tokens.values():
            if token.state.value == "active" and token.theme == event.target_theme:
                token.recent_volume += event.magnitude
