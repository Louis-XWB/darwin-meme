from agent.agent import Agent
from agent.genome import Genome
from config import CONFIG
from evolution.engine import EvolutionEngine


def test_init_population():
    engine = EvolutionEngine(CONFIG)
    pop = engine.init_population()
    assert len(pop) == CONFIG.population_size
    assert all(isinstance(a, Agent) for a in pop)
    assert all(a.generation == 0 for a in pop)


def test_evolve_produces_next_generation():
    engine = EvolutionEngine(CONFIG)
    pop = engine.init_population()
    token_prices: dict[str, float] = {}
    graduated: dict[str, bool] = {}
    next_pop, stats = engine.evolve(pop, token_prices, graduated)
    assert len(next_pop) == CONFIG.population_size
    assert all(a.generation == 1 for a in next_pop)
    assert "best_fitness" in stats
    assert "avg_fitness" in stats
    assert "worst_fitness" in stats


def test_evolve_preserves_elites():
    engine = EvolutionEngine(CONFIG)
    pop = engine.init_population()
    pop[0].balance = 10000.0
    token_prices: dict[str, float] = {}
    graduated: dict[str, bool] = {}
    next_pop, stats = engine.evolve(pop, token_prices, graduated)
    assert len(next_pop) == CONFIG.population_size
