import random

from agent.genome import Genome
from config import CONFIG
from evolution.operators import crossover, mutate, tournament_select


def test_tournament_select():
    random.seed(42)
    genomes = {f"a{i}": Genome.random() for i in range(10)}
    fitness = {f"a{i}": float(i) for i in range(10)}
    winner_id = tournament_select(fitness, k=3)
    assert winner_id in fitness


def test_crossover_produces_valid_genome():
    g1 = Genome.random()
    g2 = Genome.random()
    child = crossover(g1, g2)
    child.clamp()
    vec = child.to_vector()
    assert len(vec) == 25


def test_crossover_mixes_parents():
    random.seed(42)
    g1 = Genome.random()
    random.seed(99)
    g2 = Genome.random()
    child = crossover(g1, g2)
    assert child != g1 or child != g2


def test_mutate_changes_genome():
    random.seed(42)
    g = Genome.random()
    original_vec = g.to_vector().copy()
    mutated = mutate(g, rate=1.0, std=0.5)
    mutated_vec = mutated.to_vector()
    diffs = sum(1 for a, b in zip(original_vec, mutated_vec) if abs(a - b) > 0.001)
    assert diffs > 0


def test_mutate_stays_in_range():
    for _ in range(10):
        g = Genome.random()
        m = mutate(g, rate=1.0, std=1.0)
        assert 0.0 <= m.risk_appetite <= 1.0
        assert 0.1 <= m.position_size <= 0.5
        assert 1 <= m.max_holdings <= 10
