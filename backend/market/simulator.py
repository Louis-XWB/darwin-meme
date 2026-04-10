from __future__ import annotations

from agent.agent import Agent
from config import SimConfig
from market.events import Event, apply_event, generate_events
from market.token import Token, TokenState


class MarketSimulator:
    def __init__(self, config: SimConfig):
        self.config = config
        self.tokens: dict[str, Token] = {}
        self.trade_log: list[dict] = []
        self.event_log: list[dict] = []
        self._token_counter = 0

    def create_token(
        self, creator: Agent, name: str, theme: str, tick: int,
    ) -> Token:
        self._token_counter += 1
        token_id = f"tok_{self._token_counter}"
        token = Token(
            token_id=token_id,
            name=name,
            theme=theme,
            creator_id=creator.agent_id,
            total_supply=self.config.total_supply,
            k=self.config.bonding_k,
            n=self.config.bonding_n,
            graduation_threshold=self.config.graduation_threshold,
        )
        token.created_at_tick = tick
        self.tokens[token_id] = token
        creator.created_tokens.append(token_id)
        self.trade_log.append({
            "tick": tick,
            "type": "create",
            "agent_id": creator.agent_id,
            "token_id": token_id,
            "token_name": name,
        })
        return token

    def buy(
        self, buyer: Agent, token_id: str, amount: int, tick: int,
    ) -> float:
        token = self.tokens[token_id]
        if token.state != TokenState.ACTIVE:
            raise ValueError(f"Token {token_id} is {token.state.value}")
        cost = token.buy(amount=amount, buyer_id=buyer.agent_id)
        buyer.spend(cost)
        buyer.add_holding(token_id, amount)
        self.trade_log.append({
            "tick": tick,
            "type": "buy",
            "agent_id": buyer.agent_id,
            "token_id": token_id,
            "amount": amount,
            "cost": cost,
        })
        return cost

    def sell(
        self, seller: Agent, token_id: str, amount: int, tick: int,
    ) -> float:
        token = self.tokens[token_id]
        ret = token.sell(amount=amount, seller_id=seller.agent_id)
        seller.earn(ret)
        seller.remove_holding(token_id, amount)
        self.trade_log.append({
            "tick": tick,
            "type": "sell",
            "agent_id": seller.agent_id,
            "token_id": token_id,
            "amount": amount,
            "return": ret,
        })
        return ret

    def tick(self, tick_num: int) -> list[Event]:
        for token in self.tokens.values():
            if token.state == TokenState.ACTIVE:
                token.tick()
                token.check_death(self.config.death_idle_ticks)

        events = generate_events(
            whale_prob=self.config.whale_prob,
            fud_prob=self.config.fud_prob,
            viral_prob=self.config.viral_prob,
            crisis_prob=self.config.crisis_prob,
            narrative_prob=self.config.narrative_prob,
        )
        active_tokens = {
            tid: t for tid, t in self.tokens.items()
            if t.state == TokenState.ACTIVE
        }
        for event in events:
            apply_event(event, active_tokens)
            self.event_log.append({"tick": tick_num, **event.to_dict()})

        return events

    def token_prices(self) -> dict[str, float]:
        return {
            tid: t.current_price()
            for tid, t in self.tokens.items()
        }

    def active_tokens(self) -> list[Token]:
        return [t for t in self.tokens.values() if t.state == TokenState.ACTIVE]

    def get_market_state(self) -> dict:
        return {
            "tokens": [t.to_dict() for t in self.tokens.values()],
            "recent_trades": self.trade_log[-20:],
            "recent_events": self.event_log[-10:],
        }

    def clear_for_new_epoch(self) -> None:
        self.tokens.clear()
        self.trade_log.clear()
        self.event_log.clear()
        self._token_counter = 0
