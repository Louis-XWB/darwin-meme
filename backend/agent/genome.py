from __future__ import annotations

import math
import random
from dataclasses import dataclass, field


def _rand01() -> float:
    return random.random()


def _rand_range(lo: float, hi: float) -> float:
    return lo + random.random() * (hi - lo)


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


@dataclass
class Genome:
    # Trading chromosome
    risk_appetite: float = 0.5
    entry_threshold: float = 0.5
    exit_threshold: float = 0.5
    position_size: float = 0.3
    max_holdings: int = 5
    graduation_bias: float = 0.5

    # Creation chromosome
    creation_frequency: float = 0.5
    theme_vector: list[float] = field(default_factory=lambda: [0.125] * 8)
    naming_style: int = 0
    hype_intensity: float = 0.5

    # Social chromosome
    follow_leader: float = 0.5
    contrarian: float = 0.5
    herd_sensitivity: float = 0.5
    cooperation: float = 0.5

    # Meta chromosome
    experiment_rate: float = 0.5
    adaptation_speed: float = 0.5
    memory_weight: float = 0.5
    exploration_vs_exploit: float = 0.5

    @classmethod
    def random(cls) -> Genome:
        return cls(
            risk_appetite=_rand01(),
            entry_threshold=_rand01(),
            exit_threshold=_rand01(),
            position_size=_rand_range(0.1, 0.5),
            max_holdings=random.randint(1, 10),
            graduation_bias=_rand01(),
            creation_frequency=_rand01(),
            theme_vector=[_rand01() for _ in range(8)],
            naming_style=random.randint(0, 4),
            hype_intensity=_rand01(),
            follow_leader=_rand01(),
            contrarian=_rand01(),
            herd_sensitivity=_rand01(),
            cooperation=_rand01(),
            experiment_rate=_rand01(),
            adaptation_speed=_rand01(),
            memory_weight=_rand01(),
            exploration_vs_exploit=_rand01(),
        )

    def clamp(self) -> None:
        self.risk_appetite = _clamp(self.risk_appetite, 0.0, 1.0)
        self.entry_threshold = _clamp(self.entry_threshold, 0.0, 1.0)
        self.exit_threshold = _clamp(self.exit_threshold, 0.0, 1.0)
        self.position_size = _clamp(self.position_size, 0.1, 0.5)
        self.max_holdings = int(_clamp(self.max_holdings, 1, 10))
        self.graduation_bias = _clamp(self.graduation_bias, 0.0, 1.0)
        self.creation_frequency = _clamp(self.creation_frequency, 0.0, 1.0)
        self.theme_vector = [_clamp(v, 0.0, 1.0) for v in self.theme_vector]
        self.naming_style = int(_clamp(self.naming_style, 0, 4))
        self.hype_intensity = _clamp(self.hype_intensity, 0.0, 1.0)
        self.follow_leader = _clamp(self.follow_leader, 0.0, 1.0)
        self.contrarian = _clamp(self.contrarian, 0.0, 1.0)
        self.herd_sensitivity = _clamp(self.herd_sensitivity, 0.0, 1.0)
        self.cooperation = _clamp(self.cooperation, 0.0, 1.0)
        self.experiment_rate = _clamp(self.experiment_rate, 0.0, 1.0)
        self.adaptation_speed = _clamp(self.adaptation_speed, 0.0, 1.0)
        self.memory_weight = _clamp(self.memory_weight, 0.0, 1.0)
        self.exploration_vs_exploit = _clamp(self.exploration_vs_exploit, 0.0, 1.0)

    def to_vector(self) -> list[float]:
        return [
            self.risk_appetite,
            self.entry_threshold,
            self.exit_threshold,
            self.position_size,
            float(self.max_holdings),
            self.graduation_bias,
            self.creation_frequency,
            *self.theme_vector,
            float(self.naming_style),
            self.hype_intensity,
            self.follow_leader,
            self.contrarian,
            self.herd_sensitivity,
            self.cooperation,
            self.experiment_rate,
            self.adaptation_speed,
            self.memory_weight,
            self.exploration_vs_exploit,
        ]

    @classmethod
    def from_vector(cls, vec: list[float]) -> Genome:
        g = cls(
            risk_appetite=vec[0],
            entry_threshold=vec[1],
            exit_threshold=vec[2],
            position_size=vec[3],
            max_holdings=int(round(vec[4])),
            graduation_bias=vec[5],
            creation_frequency=vec[6],
            theme_vector=list(vec[7:15]),
            naming_style=int(round(vec[15])),
            hype_intensity=vec[16],
            follow_leader=vec[17],
            contrarian=vec[18],
            herd_sensitivity=vec[19],
            cooperation=vec[20],
            experiment_rate=vec[21],
            adaptation_speed=vec[22],
            memory_weight=vec[23],
            exploration_vs_exploit=vec[24],
        )
        g.clamp()
        return g

    def to_dict(self) -> dict:
        return {
            "risk_appetite": self.risk_appetite,
            "entry_threshold": self.entry_threshold,
            "exit_threshold": self.exit_threshold,
            "position_size": self.position_size,
            "max_holdings": self.max_holdings,
            "graduation_bias": self.graduation_bias,
            "creation_frequency": self.creation_frequency,
            "theme_vector": list(self.theme_vector),
            "naming_style": self.naming_style,
            "hype_intensity": self.hype_intensity,
            "follow_leader": self.follow_leader,
            "contrarian": self.contrarian,
            "herd_sensitivity": self.herd_sensitivity,
            "cooperation": self.cooperation,
            "experiment_rate": self.experiment_rate,
            "adaptation_speed": self.adaptation_speed,
            "memory_weight": self.memory_weight,
            "exploration_vs_exploit": self.exploration_vs_exploit,
        }

    @classmethod
    def from_dict(cls, d: dict) -> Genome:
        return cls(**d)

    def distance(self, other: Genome) -> float:
        v1 = self.to_vector()
        v2 = other.to_vector()
        return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))
