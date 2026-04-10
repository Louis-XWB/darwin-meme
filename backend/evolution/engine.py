from __future__ import annotations

from agent.agent import Agent
from agent.genome import Genome
from config import SimConfig
from evolution.fitness import evaluate_fitness
from evolution.operators import crossover, mutate, tournament_select

_AGENT_NAMES = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta",
    "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi",
    "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega",
    "Nova", "Pulsar", "Quasar", "Nebula", "Comet", "Vortex",
]


class EvolutionEngine:
    def __init__(self, config: SimConfig):
        self.config = config
        self.generation = 0
        self._name_counter = 0

    def _next_name(self) -> str:
        name = _AGENT_NAMES[self._name_counter % len(_AGENT_NAMES)]
        gen_suffix = self._name_counter // len(_AGENT_NAMES)
        self._name_counter += 1
        if gen_suffix > 0:
            return f"{name}-{gen_suffix}"
        return name

    def init_population(self) -> list[Agent]:
        self.generation = 0
        self._name_counter = 0
        return [
            Agent(
                agent_id=f"gen0_{i}",
                name=self._next_name(),
                genome=Genome.random(),
                balance=self.config.initial_balance,
                generation=0,
            )
            for i in range(self.config.population_size)
        ]

    def evolve(
        self,
        population: list[Agent],
        token_prices: dict[str, float],
        graduated_tokens: dict[str, bool],
    ) -> tuple[list[Agent], dict]:
        self.generation += 1

        fitness = evaluate_fitness(
            population, token_prices, graduated_tokens, self.config,
        )

        fitness_values = list(fitness.values())
        stats = {
            "generation": self.generation,
            "best_fitness": max(fitness_values),
            "avg_fitness": sum(fitness_values) / len(fitness_values),
            "worst_fitness": min(fitness_values),
            "fitness_scores": dict(fitness),
        }

        ranked = sorted(population, key=lambda a: fitness[a.agent_id], reverse=True)

        next_gen: list[Agent] = []

        for _ in range(self.config.offspring):
            p1_id = tournament_select(fitness, k=3)
            p2_id = tournament_select(fitness, k=3)
            p1 = next(a for a in population if a.agent_id == p1_id)
            p2 = next(a for a in population if a.agent_id == p2_id)
            child_genome = crossover(p1.genome, p2.genome)
            child_genome = mutate(child_genome, self.config.mutation_rate, self.config.mutation_std)
            child = Agent(
                agent_id=f"gen{self.generation}_{len(next_gen)}",
                name=self._next_name(),
                genome=child_genome,
                balance=self.config.initial_balance,
                generation=self.generation,
                parent_ids=[p1.agent_id, p2.agent_id],
            )
            next_gen.append(child)

        for elite in ranked[: self.config.survivors]:
            survivor = Agent(
                agent_id=f"gen{self.generation}_{len(next_gen)}",
                name=elite.name,
                genome=elite.genome,
                balance=self.config.initial_balance,
                generation=self.generation,
                parent_ids=[elite.agent_id],
            )
            next_gen.append(survivor)

        for _ in range(self.config.newcomers):
            newcomer = Agent(
                agent_id=f"gen{self.generation}_{len(next_gen)}",
                name=self._next_name(),
                genome=Genome.random(),
                balance=self.config.initial_balance,
                generation=self.generation,
            )
            next_gen.append(newcomer)

        next_gen = next_gen[: self.config.population_size]

        return next_gen, stats
