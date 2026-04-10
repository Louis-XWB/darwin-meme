from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from agent.genome import Genome


class ActionType(str, Enum):
    CREATE = "create"
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"
    EXPERIMENT = "experiment"


@dataclass
class Action:
    type: ActionType
    token_id: str | None = None
    token_name: str | None = None
    token_theme: str | None = None
    amount: int = 0
    cost: float = 0.0
    reasoning: str = ""
    hypothesis: str | None = None

    def to_dict(self) -> dict:
        return {
            "type": self.type.value,
            "token_id": self.token_id,
            "token_name": self.token_name,
            "token_theme": self.token_theme,
            "amount": self.amount,
            "cost": self.cost,
            "reasoning": self.reasoning,
            "hypothesis": self.hypothesis,
        }


class Agent:
    def __init__(
        self,
        agent_id: str,
        name: str,
        genome: Genome,
        balance: float,
        generation: int = 0,
        parent_ids: list[str] | None = None,
    ):
        self.agent_id = agent_id
        self.name = name
        self.genome = genome
        self.balance = balance
        self.initial_balance = balance
        self.generation = generation
        self.parent_ids = parent_ids or []
        self.holdings: dict[str, int] = {}
        self.created_tokens: list[str] = []
        self.action_history: list[tuple[int, Action]] = []
        self.strategy_notes: list[str] = []
        self.alive = True

    def spend(self, amount: float) -> None:
        if amount > self.balance:
            raise ValueError(f"Insufficient balance: {self.balance} < {amount}")
        self.balance -= amount

    def earn(self, amount: float) -> None:
        self.balance += amount

    def add_holding(self, token_id: str, amount: int) -> None:
        self.holdings[token_id] = self.holdings.get(token_id, 0) + amount

    def remove_holding(self, token_id: str, amount: int) -> None:
        held = self.holdings.get(token_id, 0)
        if amount > held:
            raise ValueError(f"Cannot remove {amount}, only holds {held}")
        self.holdings[token_id] = held - amount
        if self.holdings[token_id] == 0:
            del self.holdings[token_id]

    def record_action(self, action: Action, tick: int) -> None:
        self.action_history.append((tick, action))

    def holding_count(self) -> int:
        return len(self.holdings)

    def net_worth(self, token_prices: dict[str, float]) -> float:
        holdings_value = sum(
            amount * token_prices.get(tid, 0.0)
            for tid, amount in self.holdings.items()
        )
        return self.balance + holdings_value

    def roi(self, token_prices: dict[str, float]) -> float:
        nw = self.net_worth(token_prices)
        if self.initial_balance == 0:
            return 0.0
        return (nw - self.initial_balance) / self.initial_balance

    def to_dict(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "genome": self.genome.to_dict(),
            "balance": self.balance,
            "generation": self.generation,
            "parent_ids": self.parent_ids,
            "holdings": dict(self.holdings),
            "created_tokens": list(self.created_tokens),
            "action_history": [
                {"tick": t, "action": a.to_dict()} for t, a in self.action_history[-10:]
            ],
            "strategy_notes": list(self.strategy_notes[-5:]),
            "alive": self.alive,
        }
