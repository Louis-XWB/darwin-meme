from dataclasses import dataclass


@dataclass(frozen=True)
class SimConfig:
    # Population
    population_size: int = 20
    survivors: int = 8
    offspring: int = 8
    newcomers: int = 4

    # Epoch
    ticks_per_epoch: int = 50
    max_generations: int = 100

    # Agent
    initial_balance: float = 100.0

    # Token / Bonding Curve
    total_supply: int = 1_000_000_000
    bonding_k: float = 1e-9
    bonding_n: float = 2.0
    graduation_threshold: float = 24.0
    death_idle_ticks: int = 10

    # Market events
    whale_prob: float = 0.03
    fud_prob: float = 0.02
    viral_prob: float = 0.05
    crisis_prob: float = 0.01
    narrative_prob: float = 0.03

    # Buzz
    buzz_volume_factor: float = 0.3
    buzz_holder_factor: float = 0.2
    buzz_hype_factor: float = 0.3
    buzz_viral_factor: float = 0.2

    # Fitness weights
    fitness_roi_weight: float = 0.4
    fitness_token_survival_weight: float = 0.3
    fitness_uniqueness_weight: float = 0.2
    fitness_risk_weight: float = 0.1

    # Mutation
    mutation_rate: float = 0.1
    mutation_std: float = 0.1

    # LLM
    llm_model: str = "claude-sonnet-4-6"


CONFIG = SimConfig()
