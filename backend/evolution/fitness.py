from __future__ import annotations

import math

from agent.agent import Agent
from config import SimConfig


def evaluate_fitness(
    agents: list[Agent],
    token_prices: dict[str, float],
    graduated_tokens: dict[str, bool],
    config: SimConfig,
) -> dict[str, float]:
    scores: dict[str, float] = {}

    for agent in agents:
        nw = agent.net_worth(token_prices)
        baseline = config.initial_balance
        roi = (nw - baseline) / baseline if baseline > 0 else 0.0
        roi_score = max(0.0, roi + 1.0)

        if agent.created_tokens:
            survived = sum(
                1 for tid in agent.created_tokens
                if graduated_tokens.get(tid, False)
            )
            token_survival = survived / len(agent.created_tokens)
        else:
            token_survival = 0.0

        distances = [
            agent.genome.distance(other.genome)
            for other in agents
            if other.agent_id != agent.agent_id
        ]
        uniqueness = sum(distances) / len(distances) if distances else 0.0

        risk_adjusted = roi_score / (1.0 + abs(roi))

        fitness = (
            config.fitness_roi_weight * roi_score
            + config.fitness_token_survival_weight * token_survival
            + config.fitness_uniqueness_weight * uniqueness
            + config.fitness_risk_weight * risk_adjusted
        )
        scores[agent.agent_id] = fitness

    return scores
