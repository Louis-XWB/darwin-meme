from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agent.agent import Agent


class ExperimentTracker:
    def __init__(self):
        self.hypotheses: list[dict] = []

    def add_hypothesis(self, text: str) -> int:
        idx = len(self.hypotheses)
        self.hypotheses.append({
            "text": text,
            "result": None,
            "note": "",
        })
        return idx

    def record_result(self, index: int, success: bool, note: str = "") -> None:
        if 0 <= index < len(self.hypotheses):
            self.hypotheses[index]["result"] = "success" if success else "failure"
            self.hypotheses[index]["note"] = note

    def get_successful_notes(self) -> list[str]:
        return [
            f"{h['text']}: {h['note']}"
            for h in self.hypotheses
            if h["result"] == "success"
        ]

    def apply_to_agent(self, agent: Agent) -> None:
        for note in self.get_successful_notes():
            if note not in agent.strategy_notes:
                agent.strategy_notes.append(note)
        agent.strategy_notes = agent.strategy_notes[-5:]
