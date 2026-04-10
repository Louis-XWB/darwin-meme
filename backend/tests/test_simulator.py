from agent.agent import Agent
from agent.genome import Genome
from config import CONFIG
from market.simulator import MarketSimulator


def _make_agent(agent_id: str = "a1") -> Agent:
    return Agent(
        agent_id=agent_id,
        name=f"Agent-{agent_id}",
        genome=Genome.random(),
        balance=CONFIG.initial_balance,
    )


def test_simulator_create_token():
    sim = MarketSimulator(CONFIG)
    agent = _make_agent()
    token = sim.create_token(
        creator=agent, name="DOGGO", theme="animal", tick=0,
    )
    assert token.token_id in sim.tokens
    assert token.creator_id == "a1"


def test_simulator_buy():
    sim = MarketSimulator(CONFIG)
    buyer = _make_agent("buyer")
    sim.create_token(
        creator=_make_agent("creator"), name="DOGGO", theme="animal", tick=0,
    )
    token_id = list(sim.tokens.keys())[0]
    cost = sim.buy(buyer=buyer, token_id=token_id, amount=1_000_000, tick=1)
    assert cost > 0
    assert buyer.holdings[token_id] == 1_000_000


def test_simulator_sell():
    sim = MarketSimulator(CONFIG)
    agent = _make_agent()
    sim.create_token(creator=_make_agent("c"), name="X", theme="tech", tick=0)
    token_id = list(sim.tokens.keys())[0]
    sim.buy(buyer=agent, token_id=token_id, amount=1_000_000, tick=1)
    ret = sim.sell(seller=agent, token_id=token_id, amount=500_000, tick=2)
    assert ret > 0
    assert agent.holdings[token_id] == 500_000


def test_simulator_tick_increments():
    sim = MarketSimulator(CONFIG)
    sim.create_token(creator=_make_agent(), name="X", theme="tech", tick=0)
    sim.tick(1)
    token = list(sim.tokens.values())[0]
    assert token.idle_ticks == 1


def test_simulator_get_market_state():
    sim = MarketSimulator(CONFIG)
    sim.create_token(creator=_make_agent(), name="X", theme="tech", tick=0)
    state = sim.get_market_state()
    assert "tokens" in state
    assert len(state["tokens"]) == 1


def test_simulator_token_prices():
    sim = MarketSimulator(CONFIG)
    sim.create_token(creator=_make_agent(), name="X", theme="tech", tick=0)
    token_id = list(sim.tokens.keys())[0]
    sim.buy(buyer=_make_agent("b"), token_id=token_id, amount=1_000, tick=1)
    prices = sim.token_prices()
    assert token_id in prices
    assert prices[token_id] > 0
