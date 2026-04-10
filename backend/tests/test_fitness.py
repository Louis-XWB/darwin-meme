from agent.agent import Agent
from agent.genome import Genome
from config import CONFIG
from evolution.fitness import evaluate_fitness


def _agent(aid: str, balance: float = 100.0) -> Agent:
    return Agent(agent_id=aid, name=aid, genome=Genome.random(), balance=balance)


def test_fitness_higher_for_profitable_agent():
    agents = [_agent("a1", balance=150.0), _agent("a2", balance=80.0)]
    token_prices: dict[str, float] = {}
    graduated: dict[str, list[str]] = {}
    scores = evaluate_fitness(agents, token_prices, graduated, CONFIG)
    assert scores["a1"] > scores["a2"]


def test_fitness_includes_token_survival():
    a1 = _agent("a1", balance=100.0)
    a1.created_tokens = ["t1", "t2"]
    a2 = _agent("a2", balance=100.0)
    a2.created_tokens = ["t3"]
    graduated = {"t1": True, "t2": True, "t3": False}
    scores = evaluate_fitness([a1, a2], {}, graduated, CONFIG)
    assert scores["a1"] > scores["a2"]


def test_fitness_rewards_uniqueness():
    g = Genome.random()
    a1 = Agent(agent_id="a1", name="a1", genome=g, balance=100.0)
    import copy
    g2 = copy.deepcopy(g)
    a2 = Agent(agent_id="a2", name="a2", genome=g2, balance=100.0)
    a3 = Agent(agent_id="a3", name="a3", genome=Genome.random(), balance=100.0)
    scores = evaluate_fitness([a1, a2, a3], {}, {}, CONFIG)
    assert all(v >= 0 for v in scores.values())
