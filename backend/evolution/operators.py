from __future__ import annotations

import copy
import random

from agent.genome import Genome


def tournament_select(
    fitness: dict[str, float], k: int = 3,
) -> str:
    candidates = random.sample(list(fitness.keys()), min(k, len(fitness)))
    return max(candidates, key=lambda aid: fitness[aid])


def crossover(parent1: Genome, parent2: Genome) -> Genome:
    v1 = parent1.to_vector()
    v2 = parent2.to_vector()
    point = random.randint(1, len(v1) - 1)
    child_vec = v1[:point] + v2[point:]
    child = Genome.from_vector(child_vec)
    child.clamp()
    return child


def mutate(genome: Genome, rate: float, std: float) -> Genome:
    g = copy.deepcopy(genome)
    vec = g.to_vector()
    mutated = []
    for v in vec:
        if random.random() < rate:
            mutated.append(v + random.gauss(0, std))
        else:
            mutated.append(v)
    result = Genome.from_vector(mutated)
    result.clamp()
    return result
