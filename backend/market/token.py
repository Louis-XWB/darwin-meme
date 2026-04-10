from __future__ import annotations

from enum import Enum

from market.bonding_curve import BondingCurve


class TokenState(str, Enum):
    ACTIVE = "active"
    GRADUATED = "graduated"
    DEAD = "dead"


class Token:
    def __init__(
        self,
        token_id: str,
        name: str,
        theme: str,
        creator_id: str,
        total_supply: int = 1_000_000_000,
        k: float = 1e-9,
        n: float = 2.0,
        graduation_threshold: float = 24.0,
    ):
        self.token_id = token_id
        self.name = name
        self.theme = theme
        self.creator_id = creator_id
        self.state = TokenState.ACTIVE
        self.supply_sold = 0
        self.total_raised = 0.0
        self.total_supply = total_supply
        self.graduation_threshold = graduation_threshold
        self.holders: dict[str, int] = {}
        self.idle_ticks = 0
        self.recent_volume = 0.0
        self.created_at_tick = 0
        self.curve = BondingCurve(k=k, n=n, total_supply=total_supply)

    def buy(self, amount: int, buyer_id: str | None = None) -> float:
        cost = self.curve.buy_cost(self.supply_sold, amount)
        self.supply_sold += amount
        self.total_raised += cost
        self.recent_volume += cost
        self.idle_ticks = 0
        if buyer_id:
            self.holders[buyer_id] = self.holders.get(buyer_id, 0) + amount
        if self.total_raised >= self.graduation_threshold:
            self.state = TokenState.GRADUATED
        return cost

    def sell(self, amount: int, seller_id: str) -> float:
        held = self.holders.get(seller_id, 0)
        if amount > held:
            raise ValueError(f"{seller_id} holds {held}, cannot sell {amount}")
        ret = self.curve.sell_return(self.supply_sold, amount)
        self.supply_sold -= amount
        self.total_raised -= ret
        self.recent_volume += ret
        self.idle_ticks = 0
        self.holders[seller_id] -= amount
        if self.holders[seller_id] == 0:
            del self.holders[seller_id]
        return ret

    def check_death(self, death_idle_ticks: int) -> None:
        if self.state == TokenState.ACTIVE and self.idle_ticks >= death_idle_ticks:
            self.state = TokenState.DEAD

    def current_price(self) -> float:
        return self.curve.price(self.supply_sold)

    def bonding_progress(self) -> float:
        if self.graduation_threshold <= 0:
            return 1.0
        return min(1.0, self.total_raised / self.graduation_threshold)

    def compute_buzz(
        self,
        volume_factor: float,
        holder_factor: float,
        hype_factor: float,
        viral_factor: float,
    ) -> float:
        holder_count = len(self.holders)
        return (
            volume_factor * self.recent_volume
            + holder_factor * holder_count
            + hype_factor * 0.0
            + viral_factor
        )

    def tick(self) -> None:
        self.idle_ticks += 1
        self.recent_volume *= 0.8

    def to_dict(self) -> dict:
        return {
            "token_id": self.token_id,
            "name": self.name,
            "theme": self.theme,
            "creator_id": self.creator_id,
            "state": self.state.value,
            "supply_sold": self.supply_sold,
            "total_raised": self.total_raised,
            "current_price": self.current_price(),
            "bonding_progress": self.bonding_progress(),
            "holders": dict(self.holders),
            "holder_count": len(self.holders),
            "recent_volume": self.recent_volume,
        }
