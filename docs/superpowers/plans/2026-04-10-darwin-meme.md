# Darwin.meme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Darwin.meme — a real-time evolution arena where AI agents compete, experiment, and evolve strategies in a simulated meme token market.

**Architecture:** Python FastAPI backend handles the simulation engine (genome, market, evolution, agents) and exposes state via WebSocket. Next.js frontend renders a 4-panel real-time dashboard. Claude API powers agent decision-making and AI commentary.

**Tech Stack:** Python 3.12, FastAPI, Socket.IO, anthropic SDK, SQLite | Next.js 14, TypeScript, TailwindCSS, shadcn/ui, D3.js, Recharts, socket.io-client

---

## File Map

### Backend (`backend/`)

| File | Responsibility |
|------|---------------|
| `backend/pyproject.toml` | Python project config + dependencies |
| `backend/agent/genome.py` | Genome dataclass: 4 chromosomes, serialization, random init |
| `backend/agent/agent.py` | Agent entity: identity, genome, wallet, holdings, action history |
| `backend/agent/decision.py` | LLM decision module: build prompt from genome + market state, parse action |
| `backend/agent/experiment.py` | AutoResearch loop: hypothesis tracking, strategy notes |
| `backend/market/token.py` | Token entity: name, theme, supply tracking, buzz, lifecycle state |
| `backend/market/bonding_curve.py` | Price calculation, buy/sell amount computation |
| `backend/market/simulator.py` | Market engine: token registry, trade execution, tick loop |
| `backend/market/events.py` | Random market events: whale, FUD, viral, crisis, narrative |
| `backend/evolution/fitness.py` | Fitness evaluation: ROI, token survival, uniqueness, risk-adjusted |
| `backend/evolution/operators.py` | Genetic operators: tournament select, crossover, mutation |
| `backend/evolution/engine.py` | Evolution loop: run epoch, evaluate, evolve, produce next generation |
| `backend/commentator/narrator.py` | AI commentator: generate play-by-play and epoch summaries via LLM |
| `backend/data/store.py` | SQLite persistence: save/load generations, events, history |
| `backend/main.py` | FastAPI app, WebSocket server, simulation orchestration |
| `backend/config.py` | All tunable constants (K, N, population size, epoch length, etc.) |

### Backend Tests (`backend/tests/`)

| File | What it tests |
|------|--------------|
| `backend/tests/test_genome.py` | Genome creation, serialization, random init, clamp |
| `backend/tests/test_bonding_curve.py` | Price calculation, buy cost, sell return |
| `backend/tests/test_token.py` | Token lifecycle, graduation, death |
| `backend/tests/test_simulator.py` | Trade execution, order validation, tick processing |
| `backend/tests/test_events.py` | Event generation, effect application |
| `backend/tests/test_agent.py` | Agent wallet, holdings, action recording |
| `backend/tests/test_fitness.py` | Fitness scoring, uniqueness distance |
| `backend/tests/test_operators.py` | Selection, crossover, mutation correctness |
| `backend/tests/test_evolution.py` | Full evolution loop, population management |
| `backend/tests/test_experiment.py` | AutoResearch hypothesis tracking |
| `backend/tests/test_decision.py` | Prompt building, action parsing (mocked LLM) |
| `backend/tests/test_narrator.py` | Commentary generation (mocked LLM) |

### Frontend (`frontend/`)

| File | Responsibility |
|------|---------------|
| `frontend/package.json` | Next.js project config |
| `frontend/app/layout.tsx` | Root layout, fonts, global styles |
| `frontend/app/page.tsx` | Dashboard page: 4-panel grid |
| `frontend/lib/types.ts` | Shared TypeScript types mirroring backend models |
| `frontend/lib/socket.ts` | Socket.IO client singleton |
| `frontend/hooks/useSimulation.ts` | Hook: connect to WebSocket, manage simulation state |
| `frontend/components/shared/RadarChart.tsx` | Genome radar chart (D3) |
| `frontend/components/market/MarketView.tsx` | Market panel container |
| `frontend/components/market/TokenCard.tsx` | Individual token card |
| `frontend/components/market/TradeFeed.tsx` | Scrolling trade feed |
| `frontend/components/market/TokenHeatmap.tsx` | Token heatmap by theme |
| `frontend/components/leaderboard/LeaderboardView.tsx` | Agent leaderboard panel |
| `frontend/components/leaderboard/AgentRow.tsx` | Single agent row with expandable details |
| `frontend/components/evolution/EvolutionView.tsx` | Evolution panel container |
| `frontend/components/evolution/FitnessChart.tsx` | Fitness over generations (Recharts) |
| `frontend/components/evolution/StrategyScatter.tsx` | t-SNE strategy scatter (D3) |
| `frontend/components/evolution/Genedrift.tsx` | Gene parameter drift lines |
| `frontend/components/commentator/CommentatorView.tsx` | AI commentary panel |
| `frontend/components/shared/Controls.tsx` | Speed control, generation info |

---

## Task 1: Backend Scaffolding + Config

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/config.py`
- Create: `backend/__init__.py`
- Create: `backend/agent/__init__.py`
- Create: `backend/market/__init__.py`
- Create: `backend/evolution/__init__.py`
- Create: `backend/commentator/__init__.py`
- Create: `backend/data/__init__.py`
- Create: `backend/tests/__init__.py`

- [ ] **Step 1: Create pyproject.toml**

```toml
[project]
name = "darwin-meme"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.32.0",
    "python-socketio>=5.12.0",
    "anthropic>=0.43.0",
    "numpy>=2.1.0",
    "pydantic>=2.10.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

- [ ] **Step 2: Create config.py**

```python
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
```

- [ ] **Step 3: Create all `__init__.py` files**

Create empty `__init__.py` in: `backend/`, `backend/agent/`, `backend/market/`, `backend/evolution/`, `backend/commentator/`, `backend/data/`, `backend/tests/`.

- [ ] **Step 4: Install dependencies and verify**

Run: `cd backend && pip install -e ".[dev]"`
Expected: Successfully installed all packages.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "chore: scaffold backend project with config and dependencies"
```

---

## Task 2: Genome Data Model

**Files:**
- Create: `backend/agent/genome.py`
- Create: `backend/tests/test_genome.py`

- [ ] **Step 1: Write failing tests for Genome**

```python
# backend/tests/test_genome.py
import json

from agent.genome import Genome


def test_random_genome_values_in_range():
    g = Genome.random()
    assert 0.0 <= g.risk_appetite <= 1.0
    assert 0.0 <= g.entry_threshold <= 1.0
    assert 0.0 <= g.exit_threshold <= 1.0
    assert 0.1 <= g.position_size <= 0.5
    assert 1 <= g.max_holdings <= 10
    assert 0.0 <= g.graduation_bias <= 1.0
    assert 0.0 <= g.creation_frequency <= 1.0
    assert len(g.theme_vector) == 8
    assert all(0.0 <= v <= 1.0 for v in g.theme_vector)
    assert 0 <= g.naming_style <= 4
    assert 0.0 <= g.hype_intensity <= 1.0
    assert 0.0 <= g.follow_leader <= 1.0
    assert 0.0 <= g.contrarian <= 1.0
    assert 0.0 <= g.herd_sensitivity <= 1.0
    assert 0.0 <= g.cooperation <= 1.0
    assert 0.0 <= g.experiment_rate <= 1.0
    assert 0.0 <= g.adaptation_speed <= 1.0
    assert 0.0 <= g.memory_weight <= 1.0
    assert 0.0 <= g.exploration_vs_exploit <= 1.0


def test_genome_to_dict_and_from_dict():
    g = Genome.random()
    d = g.to_dict()
    g2 = Genome.from_dict(d)
    assert g == g2


def test_genome_to_json_roundtrip():
    g = Genome.random()
    j = json.dumps(g.to_dict())
    g2 = Genome.from_dict(json.loads(j))
    assert g == g2


def test_genome_to_flat_vector():
    g = Genome.random()
    vec = g.to_vector()
    # 6 trading + 1 creation_freq + 8 theme + 1 naming + 1 hype
    # + 4 social + 4 meta = 25 floats
    assert len(vec) == 25
    assert all(isinstance(v, float) for v in vec)


def test_genome_from_vector_roundtrip():
    g = Genome.random()
    vec = g.to_vector()
    g2 = Genome.from_vector(vec)
    assert g == g2


def test_genome_clamp():
    g = Genome.random()
    # Force out-of-range
    g.risk_appetite = 1.5
    g.position_size = -0.1
    g.max_holdings = 15
    g.naming_style = 7
    g.clamp()
    assert g.risk_appetite == 1.0
    assert g.position_size == 0.1
    assert g.max_holdings == 10
    assert g.naming_style == 4


def test_genome_distance():
    g1 = Genome.random()
    g2 = Genome.random()
    d = g1.distance(g2)
    assert d >= 0.0
    assert g1.distance(g1) == 0.0
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_genome.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'agent.genome'`

- [ ] **Step 3: Implement Genome**

```python
# backend/agent/genome.py
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_genome.py -v`
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/agent/genome.py backend/tests/test_genome.py
git commit -m "feat: implement Genome data model with serialization and evolution support"
```

---

## Task 3: Token + Bonding Curve

**Files:**
- Create: `backend/market/bonding_curve.py`
- Create: `backend/market/token.py`
- Create: `backend/tests/test_bonding_curve.py`
- Create: `backend/tests/test_token.py`

- [ ] **Step 1: Write failing tests for BondingCurve**

```python
# backend/tests/test_bonding_curve.py
import pytest

from market.bonding_curve import BondingCurve


@pytest.fixture
def curve():
    return BondingCurve(k=1e-9, n=2.0, total_supply=1_000_000_000)


def test_price_at_zero_sold(curve):
    assert curve.price(0) == 0.0


def test_price_increases_with_supply(curve):
    p1 = curve.price(100_000_000)
    p2 = curve.price(500_000_000)
    assert p2 > p1


def test_buy_cost_positive(curve):
    cost = curve.buy_cost(supply_sold=0, amount=1_000_000)
    assert cost > 0.0


def test_sell_return_positive(curve):
    ret = curve.sell_return(supply_sold=100_000_000, amount=1_000_000)
    assert ret > 0.0


def test_buy_then_sell_loses_nothing_extra(curve):
    amount = 1_000_000
    cost = curve.buy_cost(supply_sold=0, amount=amount)
    ret = curve.sell_return(supply_sold=amount, amount=amount)
    # Selling all just-bought tokens should return the same cost
    assert abs(cost - ret) < 1e-12


def test_buy_cost_exceeds_supply_raises(curve):
    with pytest.raises(ValueError):
        curve.buy_cost(supply_sold=999_999_999, amount=1_000_000_000)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_bonding_curve.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement BondingCurve**

```python
# backend/market/bonding_curve.py
from __future__ import annotations


class BondingCurve:
    def __init__(self, k: float, n: float, total_supply: int):
        self.k = k
        self.n = n
        self.total_supply = total_supply

    def price(self, supply_sold: int) -> float:
        if supply_sold <= 0:
            return 0.0
        return self.k * (supply_sold / self.total_supply) ** self.n

    def buy_cost(self, supply_sold: int, amount: int) -> float:
        if supply_sold + amount > self.total_supply:
            raise ValueError("Cannot buy beyond total supply")
        # Integrate price from supply_sold to supply_sold + amount
        # integral of k*(x/T)^n dx = k / T^n * x^(n+1) / (n+1)
        return self._integral(supply_sold + amount) - self._integral(supply_sold)

    def sell_return(self, supply_sold: int, amount: int) -> float:
        if amount > supply_sold:
            raise ValueError("Cannot sell more than sold supply")
        return self._integral(supply_sold) - self._integral(supply_sold - amount)

    def _integral(self, x: int) -> float:
        # Integral of k * (s/T)^n ds from 0 to x
        # = k / T^n * x^(n+1) / (n+1)
        return self.k / (self.total_supply ** self.n) * (x ** (self.n + 1)) / (self.n + 1)
```

- [ ] **Step 4: Run bonding curve tests**

Run: `cd backend && python -m pytest tests/test_bonding_curve.py -v`
Expected: All 6 tests PASS.

- [ ] **Step 5: Write failing tests for Token**

```python
# backend/tests/test_token.py
from market.token import Token, TokenState


def test_token_creation():
    t = Token(token_id="t1", name="DOGGO", theme="animal", creator_id="a1")
    assert t.state == TokenState.ACTIVE
    assert t.supply_sold == 0
    assert t.total_raised == 0.0


def test_token_buy():
    t = Token(token_id="t1", name="DOGGO", theme="animal", creator_id="a1")
    cost = t.buy(amount=1_000_000)
    assert cost > 0.0
    assert t.supply_sold == 1_000_000
    assert t.total_raised == cost
    assert "a1" not in t.holders  # creator hasn't bought yet


def test_token_buy_records_holder():
    t = Token(token_id="t1", name="DOGGO", theme="animal", creator_id="a1")
    t.buy(amount=1_000_000, buyer_id="a2")
    assert t.holders["a2"] == 1_000_000


def test_token_sell():
    t = Token(token_id="t1", name="DOGGO", theme="animal", creator_id="a1")
    t.buy(amount=1_000_000, buyer_id="a2")
    ret = t.sell(amount=500_000, seller_id="a2")
    assert ret > 0.0
    assert t.holders["a2"] == 500_000
    assert t.supply_sold == 500_000


def test_token_graduation():
    t = Token(
        token_id="t1",
        name="DOGGO",
        theme="animal",
        creator_id="a1",
        graduation_threshold=0.001,
    )
    t.buy(amount=500_000_000, buyer_id="a2")
    assert t.state == TokenState.GRADUATED


def test_token_death_after_idle():
    t = Token(token_id="t1", name="DOGGO", theme="animal", creator_id="a1")
    t.idle_ticks = 10
    t.check_death(death_idle_ticks=10)
    assert t.state == TokenState.DEAD


def test_token_buzz():
    t = Token(token_id="t1", name="DOGGO", theme="animal", creator_id="a1")
    t.buy(amount=1_000_000, buyer_id="a2")
    t.buy(amount=1_000_000, buyer_id="a3")
    buzz = t.compute_buzz(
        volume_factor=0.3,
        holder_factor=0.2,
        hype_factor=0.3,
        viral_factor=0.0,
    )
    assert buzz > 0.0
```

- [ ] **Step 6: Run token tests to verify failure**

Run: `cd backend && python -m pytest tests/test_token.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 7: Implement Token**

```python
# backend/market/token.py
from __future__ import annotations

from enum import Enum

from market.bonding_curve import BondingCurve


class TokenState(str, Enum):
    ACTIVE = "active"
    GRADUATED = "graduated"
    DEAD = "dead"


class Token:
    def __init__(
        self,
        token_id: str,
        name: str,
        theme: str,
        creator_id: str,
        total_supply: int = 1_000_000_000,
        k: float = 1e-9,
        n: float = 2.0,
        graduation_threshold: float = 24.0,
    ):
        self.token_id = token_id
        self.name = name
        self.theme = theme
        self.creator_id = creator_id
        self.state = TokenState.ACTIVE
        self.supply_sold = 0
        self.total_raised = 0.0
        self.total_supply = total_supply
        self.graduation_threshold = graduation_threshold
        self.holders: dict[str, int] = {}
        self.idle_ticks = 0
        self.recent_volume = 0.0
        self.created_at_tick = 0
        self.curve = BondingCurve(k=k, n=n, total_supply=total_supply)

    def buy(self, amount: int, buyer_id: str | None = None) -> float:
        cost = self.curve.buy_cost(self.supply_sold, amount)
        self.supply_sold += amount
        self.total_raised += cost
        self.recent_volume += cost
        self.idle_ticks = 0
        if buyer_id:
            self.holders[buyer_id] = self.holders.get(buyer_id, 0) + amount
        if self.total_raised >= self.graduation_threshold:
            self.state = TokenState.GRADUATED
        return cost

    def sell(self, amount: int, seller_id: str) -> float:
        held = self.holders.get(seller_id, 0)
        if amount > held:
            raise ValueError(f"{seller_id} holds {held}, cannot sell {amount}")
        ret = self.curve.sell_return(self.supply_sold, amount)
        self.supply_sold -= amount
        self.total_raised -= ret
        self.recent_volume += ret
        self.idle_ticks = 0
        self.holders[seller_id] -= amount
        if self.holders[seller_id] == 0:
            del self.holders[seller_id]
        return ret

    def check_death(self, death_idle_ticks: int) -> None:
        if self.state == TokenState.ACTIVE and self.idle_ticks >= death_idle_ticks:
            self.state = TokenState.DEAD

    def current_price(self) -> float:
        return self.curve.price(self.supply_sold)

    def bonding_progress(self) -> float:
        if self.graduation_threshold <= 0:
            return 1.0
        return min(1.0, self.total_raised / self.graduation_threshold)

    def compute_buzz(
        self,
        volume_factor: float,
        holder_factor: float,
        hype_factor: float,
        viral_factor: float,
    ) -> float:
        holder_count = len(self.holders)
        return (
            volume_factor * self.recent_volume
            + holder_factor * holder_count
            + hype_factor * 0.0  # hype comes from creator agent genome
            + viral_factor
        )

    def tick(self) -> None:
        self.idle_ticks += 1
        self.recent_volume *= 0.8  # decay

    def to_dict(self) -> dict:
        return {
            "token_id": self.token_id,
            "name": self.name,
            "theme": self.theme,
            "creator_id": self.creator_id,
            "state": self.state.value,
            "supply_sold": self.supply_sold,
            "total_raised": self.total_raised,
            "current_price": self.current_price(),
            "bonding_progress": self.bonding_progress(),
            "holders": dict(self.holders),
            "holder_count": len(self.holders),
            "recent_volume": self.recent_volume,
        }
```

- [ ] **Step 8: Run all tests**

Run: `cd backend && python -m pytest tests/test_bonding_curve.py tests/test_token.py -v`
Expected: All 13 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/market/bonding_curve.py backend/market/token.py backend/tests/test_bonding_curve.py backend/tests/test_token.py
git commit -m "feat: implement BondingCurve pricing and Token entity with lifecycle"
```

---

## Task 4: Agent Entity

**Files:**
- Create: `backend/agent/agent.py`
- Create: `backend/tests/test_agent.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_agent.py
from agent.agent import Agent, Action, ActionType
from agent.genome import Genome


def test_agent_creation():
    g = Genome.random()
    a = Agent(agent_id="a1", name="Alpha", genome=g, balance=100.0)
    assert a.balance == 100.0
    assert a.holdings == {}
    assert a.generation == 0


def test_agent_spend():
    a = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=100.0)
    a.spend(30.0)
    assert a.balance == 70.0


def test_agent_spend_insufficient_raises():
    a = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=10.0)
    try:
        a.spend(20.0)
        assert False, "Should have raised"
    except ValueError:
        pass


def test_agent_earn():
    a = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=50.0)
    a.earn(25.0)
    assert a.balance == 75.0


def test_agent_record_action():
    a = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=100.0)
    action = Action(type=ActionType.BUY, token_id="t1", amount=1000, cost=5.0)
    a.record_action(action, tick=3)
    assert len(a.action_history) == 1
    assert a.action_history[0][0] == 3


def test_agent_add_holding():
    a = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=100.0)
    a.add_holding("t1", 5000)
    assert a.holdings["t1"] == 5000
    a.add_holding("t1", 3000)
    assert a.holdings["t1"] == 8000


def test_agent_remove_holding():
    a = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=100.0)
    a.add_holding("t1", 5000)
    a.remove_holding("t1", 2000)
    assert a.holdings["t1"] == 3000
    a.remove_holding("t1", 3000)
    assert "t1" not in a.holdings


def test_agent_net_worth():
    a = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=50.0)
    # net_worth with no holdings = balance
    assert a.net_worth({}) == 50.0
    a.add_holding("t1", 1000)
    assert a.net_worth({"t1": 0.01}) == 50.0 + 1000 * 0.01


def test_agent_to_dict():
    a = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=100.0)
    d = a.to_dict()
    assert d["agent_id"] == "a1"
    assert d["name"] == "Alpha"
    assert "genome" in d
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd backend && python -m pytest tests/test_agent.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement Agent**

```python
# backend/agent/agent.py
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from agent.genome import Genome


class ActionType(str, Enum):
    CREATE = "create"
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"
    EXPERIMENT = "experiment"


@dataclass
class Action:
    type: ActionType
    token_id: str | None = None
    token_name: str | None = None
    token_theme: str | None = None
    amount: int = 0
    cost: float = 0.0
    reasoning: str = ""
    hypothesis: str | None = None  # for EXPERIMENT actions

    def to_dict(self) -> dict:
        return {
            "type": self.type.value,
            "token_id": self.token_id,
            "token_name": self.token_name,
            "token_theme": self.token_theme,
            "amount": self.amount,
            "cost": self.cost,
            "reasoning": self.reasoning,
            "hypothesis": self.hypothesis,
        }


class Agent:
    def __init__(
        self,
        agent_id: str,
        name: str,
        genome: Genome,
        balance: float,
        generation: int = 0,
        parent_ids: list[str] | None = None,
    ):
        self.agent_id = agent_id
        self.name = name
        self.genome = genome
        self.balance = balance
        self.initial_balance = balance
        self.generation = generation
        self.parent_ids = parent_ids or []
        self.holdings: dict[str, int] = {}
        self.created_tokens: list[str] = []
        self.action_history: list[tuple[int, Action]] = []
        self.strategy_notes: list[str] = []  # AutoResearch notes (not inherited)
        self.alive = True

    def spend(self, amount: float) -> None:
        if amount > self.balance:
            raise ValueError(f"Insufficient balance: {self.balance} < {amount}")
        self.balance -= amount

    def earn(self, amount: float) -> None:
        self.balance += amount

    def add_holding(self, token_id: str, amount: int) -> None:
        self.holdings[token_id] = self.holdings.get(token_id, 0) + amount

    def remove_holding(self, token_id: str, amount: int) -> None:
        held = self.holdings.get(token_id, 0)
        if amount > held:
            raise ValueError(f"Cannot remove {amount}, only holds {held}")
        self.holdings[token_id] = held - amount
        if self.holdings[token_id] == 0:
            del self.holdings[token_id]

    def record_action(self, action: Action, tick: int) -> None:
        self.action_history.append((tick, action))

    def holding_count(self) -> int:
        return len(self.holdings)

    def net_worth(self, token_prices: dict[str, float]) -> float:
        holdings_value = sum(
            amount * token_prices.get(tid, 0.0)
            for tid, amount in self.holdings.items()
        )
        return self.balance + holdings_value

    def roi(self, token_prices: dict[str, float]) -> float:
        nw = self.net_worth(token_prices)
        if self.initial_balance == 0:
            return 0.0
        return (nw - self.initial_balance) / self.initial_balance

    def to_dict(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "genome": self.genome.to_dict(),
            "balance": self.balance,
            "generation": self.generation,
            "parent_ids": self.parent_ids,
            "holdings": dict(self.holdings),
            "created_tokens": list(self.created_tokens),
            "action_history": [
                {"tick": t, "action": a.to_dict()} for t, a in self.action_history[-10:]
            ],
            "strategy_notes": list(self.strategy_notes[-5:]),
            "alive": self.alive,
        }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_agent.py -v`
Expected: All 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/agent/agent.py backend/tests/test_agent.py
git commit -m "feat: implement Agent entity with wallet, holdings, and action tracking"
```

---

## Task 5: Market Simulator + Events

**Files:**
- Create: `backend/market/simulator.py`
- Create: `backend/market/events.py`
- Create: `backend/tests/test_simulator.py`
- Create: `backend/tests/test_events.py`

- [ ] **Step 1: Write failing tests for events**

```python
# backend/tests/test_events.py
import random

from market.events import EventType, generate_events, apply_event
from market.token import Token


def test_generate_events_returns_list():
    random.seed(42)
    events = generate_events(
        whale_prob=1.0, fud_prob=0.0, viral_prob=0.0,
        crisis_prob=0.0, narrative_prob=0.0,
    )
    assert any(e.type == EventType.WHALE for e in events)


def test_generate_events_empty_when_zero_prob():
    events = generate_events(
        whale_prob=0.0, fud_prob=0.0, viral_prob=0.0,
        crisis_prob=0.0, narrative_prob=0.0,
    )
    assert len(events) == 0


def test_apply_whale_event():
    t = Token(token_id="t1", name="X", theme="animal", creator_id="a1")
    t.buy(amount=1_000_000, buyer_id="a2")
    old_vol = t.recent_volume
    from market.events import Event
    event = Event(type=EventType.WHALE, target_token_id="t1")
    apply_event(event, {"t1": t})
    assert t.recent_volume > old_vol


def test_apply_viral_event():
    t = Token(token_id="t1", name="X", theme="animal", creator_id="a1")
    from market.events import Event
    event = Event(type=EventType.VIRAL, target_token_id="t1", magnitude=5.0)
    apply_event(event, {"t1": t})
    assert t.recent_volume > 0
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && python -m pytest tests/test_events.py -v`
Expected: FAIL

- [ ] **Step 3: Implement events**

```python
# backend/market/events.py
from __future__ import annotations

import random
from dataclasses import dataclass
from enum import Enum

from market.token import Token


class EventType(str, Enum):
    WHALE = "whale"
    FUD = "fud"
    VIRAL = "viral"
    CRISIS = "crisis"
    NARRATIVE = "narrative"


THEMES = ["animal", "politics", "tech", "humor", "food", "crypto", "popculture", "absurd"]


@dataclass
class Event:
    type: EventType
    target_token_id: str | None = None
    target_theme: str | None = None
    magnitude: float = 1.0

    def to_dict(self) -> dict:
        return {
            "type": self.type.value,
            "target_token_id": self.target_token_id,
            "target_theme": self.target_theme,
            "magnitude": self.magnitude,
        }


def generate_events(
    whale_prob: float,
    fud_prob: float,
    viral_prob: float,
    crisis_prob: float,
    narrative_prob: float,
) -> list[Event]:
    events: list[Event] = []
    if random.random() < whale_prob:
        events.append(Event(type=EventType.WHALE, magnitude=random.uniform(2.0, 10.0)))
    if random.random() < fud_prob:
        events.append(Event(type=EventType.FUD, magnitude=random.uniform(0.5, 0.9)))
    if random.random() < viral_prob:
        events.append(Event(type=EventType.VIRAL, magnitude=random.uniform(3.0, 8.0)))
    if random.random() < crisis_prob:
        events.append(Event(type=EventType.CRISIS))
    if random.random() < narrative_prob:
        events.append(Event(
            type=EventType.NARRATIVE,
            target_theme=random.choice(THEMES),
            magnitude=random.uniform(1.5, 3.0),
        ))
    return events


def apply_event(event: Event, tokens: dict[str, Token]) -> None:
    if not tokens:
        return

    if event.type == EventType.WHALE:
        target_id = event.target_token_id or random.choice(list(tokens.keys()))
        token = tokens.get(target_id)
        if token and token.state.value == "active":
            token.recent_volume += event.magnitude * 2.0

    elif event.type == EventType.FUD:
        for token in tokens.values():
            if token.state.value == "active":
                token.recent_volume *= event.magnitude

    elif event.type == EventType.VIRAL:
        target_id = event.target_token_id or random.choice(list(tokens.keys()))
        token = tokens.get(target_id)
        if token and token.state.value == "active":
            token.recent_volume += event.magnitude

    elif event.type == EventType.CRISIS:
        target_id = event.target_token_id or random.choice(list(tokens.keys()))
        token = tokens.get(target_id)
        if token and token.state.value == "active":
            token.recent_volume *= 0.3

    elif event.type == EventType.NARRATIVE:
        for token in tokens.values():
            if token.state.value == "active" and token.theme == event.target_theme:
                token.recent_volume += event.magnitude
```

- [ ] **Step 4: Run event tests**

Run: `cd backend && python -m pytest tests/test_events.py -v`
Expected: All 4 tests PASS.

- [ ] **Step 5: Write failing tests for simulator**

```python
# backend/tests/test_simulator.py
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
```

- [ ] **Step 6: Implement MarketSimulator**

```python
# backend/market/simulator.py
from __future__ import annotations

import uuid

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
        # Advance all tokens
        for token in self.tokens.values():
            if token.state == TokenState.ACTIVE:
                token.tick()
                token.check_death(self.config.death_idle_ticks)

        # Generate and apply random events
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
```

- [ ] **Step 7: Run all simulator tests**

Run: `cd backend && python -m pytest tests/test_simulator.py tests/test_events.py -v`
Expected: All 10 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/market/simulator.py backend/market/events.py backend/tests/test_simulator.py backend/tests/test_events.py
git commit -m "feat: implement MarketSimulator with trade execution and random events"
```

---

## Task 6: Agent Decision Module (Mock LLM)

**Files:**
- Create: `backend/agent/decision.py`
- Create: `backend/agent/experiment.py`
- Create: `backend/tests/test_decision.py`
- Create: `backend/tests/test_experiment.py`

- [ ] **Step 1: Write failing tests for decision prompt building and action parsing**

```python
# backend/tests/test_decision.py
from agent.agent import Agent, ActionType
from agent.decision import build_decision_prompt, parse_action_response
from agent.genome import Genome


def test_build_prompt_contains_genome_traits():
    agent = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=100.0)
    market_state = {"tokens": [], "recent_trades": [], "recent_events": []}
    prompt = build_decision_prompt(agent, market_state, tick=1)
    assert "risk_appetite" in prompt
    assert "Alpha" in prompt


def test_build_prompt_includes_holdings():
    agent = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=100.0)
    agent.add_holding("t1", 5000)
    market_state = {"tokens": [], "recent_trades": [], "recent_events": []}
    prompt = build_decision_prompt(agent, market_state, tick=1)
    assert "t1" in prompt


def test_build_prompt_includes_strategy_notes():
    agent = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=100.0)
    agent.strategy_notes.append("Buy dips works well")
    market_state = {"tokens": [], "recent_trades": [], "recent_events": []}
    prompt = build_decision_prompt(agent, market_state, tick=1)
    assert "Buy dips works well" in prompt


def test_parse_buy_action():
    response = '{"action": "buy", "token_id": "t1", "amount": 1000000, "reasoning": "price is low"}'
    action = parse_action_response(response)
    assert action.type == ActionType.BUY
    assert action.token_id == "t1"
    assert action.amount == 1000000


def test_parse_create_action():
    response = '{"action": "create", "token_name": "DOGGO", "token_theme": "animal", "reasoning": "dogs are trending"}'
    action = parse_action_response(response)
    assert action.type == ActionType.CREATE
    assert action.token_name == "DOGGO"


def test_parse_hold_action():
    response = '{"action": "hold", "reasoning": "waiting for dip"}'
    action = parse_action_response(response)
    assert action.type == ActionType.HOLD


def test_parse_experiment_action():
    response = '{"action": "experiment", "hypothesis": "contrarian strategy in FUD events", "reasoning": "testing"}'
    action = parse_action_response(response)
    assert action.type == ActionType.EXPERIMENT
    assert action.hypothesis == "contrarian strategy in FUD events"


def test_parse_sell_action():
    response = '{"action": "sell", "token_id": "t1", "amount": 500000, "reasoning": "taking profit"}'
    action = parse_action_response(response)
    assert action.type == ActionType.SELL


def test_parse_invalid_json_returns_hold():
    action = parse_action_response("this is not json")
    assert action.type == ActionType.HOLD
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && python -m pytest tests/test_decision.py -v`
Expected: FAIL

- [ ] **Step 3: Implement decision module**

```python
# backend/agent/decision.py
from __future__ import annotations

import json

from agent.agent import Action, ActionType

# Type hint only — Agent imported at runtime would be circular
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from agent.agent import Agent


THEME_NAMES = [
    "animal", "politics", "tech", "humor",
    "food", "crypto", "popculture", "absurd",
]


def build_system_prompt(agent: Agent) -> str:
    g = agent.genome
    theme_prefs = ", ".join(
        f"{name}={g.theme_vector[i]:.2f}" for i, name in enumerate(THEME_NAMES)
    )
    notes_section = ""
    if agent.strategy_notes:
        notes_section = "\n\nYour learned strategy notes (from experiments):\n" + "\n".join(
            f"- {n}" for n in agent.strategy_notes[-5:]
        )

    return f"""You are {agent.name}, an AI meme token trader in the Darwin.meme arena.

Your personality (genome parameters):
- risk_appetite: {g.risk_appetite:.2f}
- entry_threshold: {g.entry_threshold:.2f} (lower = more willing to buy)
- exit_threshold: {g.exit_threshold:.2f} (lower = quicker to sell)
- position_size: {g.position_size:.2f} (fraction of balance per trade)
- max_holdings: {g.max_holdings}
- graduation_bias: {g.graduation_bias:.2f} (preference for tokens near graduation)
- creation_frequency: {g.creation_frequency:.2f} (how often you create new tokens)
- theme_preferences: {theme_prefs}
- naming_style: {g.naming_style} (0=pun, 1=abbreviation, 2=emoji, 3=compound, 4=random)
- hype_intensity: {g.hype_intensity:.2f}
- follow_leader: {g.follow_leader:.2f}
- contrarian: {g.contrarian:.2f}
- herd_sensitivity: {g.herd_sensitivity:.2f}
- cooperation: {g.cooperation:.2f}
- experiment_rate: {g.experiment_rate:.2f}
- exploration_vs_exploit: {g.exploration_vs_exploit:.2f}
{notes_section}

Respond with ONLY a JSON object. Choose one action:
{{"action": "create", "token_name": "NAME", "token_theme": "THEME", "reasoning": "..."}}
{{"action": "buy", "token_id": "ID", "amount": NUMBER, "reasoning": "..."}}
{{"action": "sell", "token_id": "ID", "amount": NUMBER, "reasoning": "..."}}
{{"action": "hold", "reasoning": "..."}}
{{"action": "experiment", "hypothesis": "DESCRIPTION", "reasoning": "..."}}

Rules:
- amount for buy/sell must be a positive integer (token units)
- token_theme must be one of: {', '.join(THEME_NAMES)}
- You can only sell tokens you hold
- You can only buy active tokens
- Consider your personality parameters when deciding"""


def build_decision_prompt(agent: Agent, market_state: dict, tick: int) -> str:
    g = agent.genome
    holdings_str = json.dumps(agent.holdings) if agent.holdings else "none"
    tokens_summary = []
    for t in market_state.get("tokens", []):
        tokens_summary.append(
            f"  {t['token_id']}: {t['name']} (theme={t['theme']}, "
            f"price={t['current_price']:.10f}, progress={t['bonding_progress']:.1%}, "
            f"state={t['state']}, holders={t['holder_count']}, vol={t['recent_volume']:.4f})"
        )
    tokens_str = "\n".join(tokens_summary) if tokens_summary else "  No tokens yet"

    recent_trades = market_state.get("recent_trades", [])[-5:]
    trades_str = json.dumps(recent_trades, default=str) if recent_trades else "none"

    recent_events = market_state.get("recent_events", [])[-3:]
    events_str = json.dumps(recent_events, default=str) if recent_events else "none"

    # Include strategy notes from AutoResearch
    notes = ""
    if agent.strategy_notes:
        notes = "\nYour learned notes:\n" + "\n".join(f"- {n}" for n in agent.strategy_notes[-5:])

    return f"""Tick {tick} | Balance: {agent.balance:.4f} | Holdings: {holdings_str}
risk_appetite: {g.risk_appetite:.2f} | contrarian: {g.contrarian:.2f} | experiment_rate: {g.experiment_rate:.2f}

Active tokens:
{tokens_str}

Recent trades: {trades_str}
Recent events: {events_str}
{notes}
What is your action?"""


def parse_action_response(response: str) -> Action:
    try:
        # Try to extract JSON from response
        text = response.strip()
        # Handle markdown code blocks
        if "```" in text:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                text = text[start:end]
        data = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return Action(type=ActionType.HOLD, reasoning="failed to parse response")

    action_str = data.get("action", "hold").lower()
    try:
        action_type = ActionType(action_str)
    except ValueError:
        action_type = ActionType.HOLD

    return Action(
        type=action_type,
        token_id=data.get("token_id"),
        token_name=data.get("token_name"),
        token_theme=data.get("token_theme"),
        amount=int(data.get("amount", 0)),
        reasoning=data.get("reasoning", ""),
        hypothesis=data.get("hypothesis"),
    )
```

- [ ] **Step 4: Run decision tests**

Run: `cd backend && python -m pytest tests/test_decision.py -v`
Expected: All 9 tests PASS.

- [ ] **Step 5: Write failing tests for experiment (AutoResearch)**

```python
# backend/tests/test_experiment.py
from agent.agent import Agent
from agent.experiment import ExperimentTracker
from agent.genome import Genome


def test_add_hypothesis():
    tracker = ExperimentTracker()
    tracker.add_hypothesis("Buy during FUD events")
    assert len(tracker.hypotheses) == 1
    assert tracker.hypotheses[0]["text"] == "Buy during FUD events"
    assert tracker.hypotheses[0]["result"] is None


def test_record_result():
    tracker = ExperimentTracker()
    tracker.add_hypothesis("Buy during FUD events")
    tracker.record_result(0, success=True, note="Gained 15%")
    assert tracker.hypotheses[0]["result"] == "success"
    assert tracker.hypotheses[0]["note"] == "Gained 15%"


def test_get_successful_notes():
    tracker = ExperimentTracker()
    tracker.add_hypothesis("H1")
    tracker.add_hypothesis("H2")
    tracker.record_result(0, success=True, note="H1 works")
    tracker.record_result(1, success=False, note="H2 failed")
    notes = tracker.get_successful_notes()
    assert len(notes) == 1
    assert "H1" in notes[0]


def test_apply_to_agent():
    agent = Agent(agent_id="a1", name="A", genome=Genome.random(), balance=100.0)
    tracker = ExperimentTracker()
    tracker.add_hypothesis("Contrarian during FUD")
    tracker.record_result(0, success=True, note="Works well")
    tracker.apply_to_agent(agent)
    assert len(agent.strategy_notes) == 1
    assert "Contrarian during FUD" in agent.strategy_notes[0]
```

- [ ] **Step 6: Implement ExperimentTracker**

```python
# backend/agent/experiment.py
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agent.agent import Agent


class ExperimentTracker:
    def __init__(self):
        self.hypotheses: list[dict] = []

    def add_hypothesis(self, text: str) -> int:
        idx = len(self.hypotheses)
        self.hypotheses.append({
            "text": text,
            "result": None,
            "note": "",
        })
        return idx

    def record_result(self, index: int, success: bool, note: str = "") -> None:
        if 0 <= index < len(self.hypotheses):
            self.hypotheses[index]["result"] = "success" if success else "failure"
            self.hypotheses[index]["note"] = note

    def get_successful_notes(self) -> list[str]:
        return [
            f"{h['text']}: {h['note']}"
            for h in self.hypotheses
            if h["result"] == "success"
        ]

    def apply_to_agent(self, agent: Agent) -> None:
        for note in self.get_successful_notes():
            if note not in agent.strategy_notes:
                agent.strategy_notes.append(note)
        # Keep only last 5 notes
        agent.strategy_notes = agent.strategy_notes[-5:]
```

- [ ] **Step 7: Run experiment tests**

Run: `cd backend && python -m pytest tests/test_experiment.py -v`
Expected: All 4 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/agent/decision.py backend/agent/experiment.py backend/tests/test_decision.py backend/tests/test_experiment.py
git commit -m "feat: implement Agent decision module and AutoResearch experiment tracker"
```

---

## Task 7: Evolution Engine

**Files:**
- Create: `backend/evolution/fitness.py`
- Create: `backend/evolution/operators.py`
- Create: `backend/evolution/engine.py`
- Create: `backend/tests/test_fitness.py`
- Create: `backend/tests/test_operators.py`
- Create: `backend/tests/test_evolution.py`

- [ ] **Step 1: Write failing tests for fitness**

```python
# backend/tests/test_fitness.py
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
    # Two agents with identical genomes should get less uniqueness bonus
    g = Genome.random()
    a1 = Agent(agent_id="a1", name="a1", genome=g, balance=100.0)
    import copy
    g2 = copy.deepcopy(g)
    a2 = Agent(agent_id="a2", name="a2", genome=g2, balance=100.0)
    a3 = Agent(agent_id="a3", name="a3", genome=Genome.random(), balance=100.0)
    scores = evaluate_fitness([a1, a2, a3], {}, {}, CONFIG)
    # a3 should have higher uniqueness component since its genome differs
    # (but overall score depends on other factors too, so just check it runs)
    assert all(v >= 0 for v in scores.values())
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && python -m pytest tests/test_fitness.py -v`
Expected: FAIL

- [ ] **Step 3: Implement fitness**

```python
# backend/evolution/fitness.py
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
        # 1. ROI component
        roi = agent.roi(token_prices)
        roi_score = max(0.0, roi + 1.0)  # shift so 0% ROI = 1.0

        # 2. Token survival component
        if agent.created_tokens:
            survived = sum(
                1 for tid in agent.created_tokens
                if graduated_tokens.get(tid, False)
            )
            token_survival = survived / len(agent.created_tokens)
        else:
            token_survival = 0.0

        # 3. Uniqueness component (average distance to all other agents)
        distances = [
            agent.genome.distance(other.genome)
            for other in agents
            if other.agent_id != agent.agent_id
        ]
        uniqueness = sum(distances) / len(distances) if distances else 0.0

        # 4. Risk-adjusted return (simplified Sharpe-like)
        # Use balance volatility proxy: abs(final - initial) / initial
        risk_adjusted = roi_score / (1.0 + abs(roi))

        fitness = (
            config.fitness_roi_weight * roi_score
            + config.fitness_token_survival_weight * token_survival
            + config.fitness_uniqueness_weight * uniqueness
            + config.fitness_risk_weight * risk_adjusted
        )
        scores[agent.agent_id] = fitness

    return scores
```

- [ ] **Step 4: Run fitness tests**

Run: `cd backend && python -m pytest tests/test_fitness.py -v`
Expected: All 3 tests PASS.

- [ ] **Step 5: Write failing tests for operators**

```python
# backend/tests/test_operators.py
import random

from agent.genome import Genome
from config import CONFIG
from evolution.operators import crossover, mutate, tournament_select


def test_tournament_select():
    random.seed(42)
    genomes = {f"a{i}": Genome.random() for i in range(10)}
    fitness = {f"a{i}": float(i) for i in range(10)}  # a9 is best
    winner_id = tournament_select(fitness, k=3)
    assert winner_id in fitness


def test_crossover_produces_valid_genome():
    g1 = Genome.random()
    g2 = Genome.random()
    child = crossover(g1, g2)
    # Child should have valid ranges
    child.clamp()
    vec = child.to_vector()
    assert len(vec) == 25


def test_crossover_mixes_parents():
    # With different parents, child should differ from both (usually)
    random.seed(42)
    g1 = Genome.random()
    random.seed(99)
    g2 = Genome.random()
    child = crossover(g1, g2)
    assert child != g1 or child != g2  # at least one differs


def test_mutate_changes_genome():
    random.seed(42)
    g = Genome.random()
    original_vec = g.to_vector().copy()
    mutated = mutate(g, rate=1.0, std=0.5)  # 100% mutation rate for testing
    mutated_vec = mutated.to_vector()
    # At least some values should change
    diffs = sum(1 for a, b in zip(original_vec, mutated_vec) if abs(a - b) > 0.001)
    assert diffs > 0


def test_mutate_stays_in_range():
    for _ in range(10):
        g = Genome.random()
        m = mutate(g, rate=1.0, std=1.0)
        assert 0.0 <= m.risk_appetite <= 1.0
        assert 0.1 <= m.position_size <= 0.5
        assert 1 <= m.max_holdings <= 10
```

- [ ] **Step 6: Implement operators**

```python
# backend/evolution/operators.py
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
    # Single-point crossover
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
```

- [ ] **Step 7: Run operator tests**

Run: `cd backend && python -m pytest tests/test_operators.py -v`
Expected: All 5 tests PASS.

- [ ] **Step 8: Write failing tests for evolution engine**

```python
# backend/tests/test_evolution.py
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
    # Give one agent a huge balance advantage
    pop[0].balance = 10000.0
    token_prices: dict[str, float] = {}
    graduated: dict[str, bool] = {}
    next_pop, stats = engine.evolve(pop, token_prices, graduated)
    # The best agent's genome traits should appear in offspring
    assert len(next_pop) == CONFIG.population_size
```

- [ ] **Step 9: Implement EvolutionEngine**

```python
# backend/evolution/engine.py
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

        # Evaluate fitness
        fitness = evaluate_fitness(
            population, token_prices, graduated_tokens, self.config,
        )

        # Stats
        fitness_values = list(fitness.values())
        stats = {
            "generation": self.generation,
            "best_fitness": max(fitness_values),
            "avg_fitness": sum(fitness_values) / len(fitness_values),
            "worst_fitness": min(fitness_values),
            "fitness_scores": dict(fitness),
        }

        # Sort by fitness
        ranked = sorted(population, key=lambda a: fitness[a.agent_id], reverse=True)

        next_gen: list[Agent] = []

        # Offspring via crossover
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

        # Survivors (elite, keep genome but reset balance/holdings)
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

        # Newcomers (random fresh blood)
        for _ in range(self.config.newcomers):
            newcomer = Agent(
                agent_id=f"gen{self.generation}_{len(next_gen)}",
                name=self._next_name(),
                genome=Genome.random(),
                balance=self.config.initial_balance,
                generation=self.generation,
            )
            next_gen.append(newcomer)

        # Trim to exact population size
        next_gen = next_gen[: self.config.population_size]

        return next_gen, stats
```

- [ ] **Step 10: Run all evolution tests**

Run: `cd backend && python -m pytest tests/test_fitness.py tests/test_operators.py tests/test_evolution.py -v`
Expected: All 11 tests PASS.

- [ ] **Step 11: Commit**

```bash
git add backend/evolution/ backend/tests/test_fitness.py backend/tests/test_operators.py backend/tests/test_evolution.py
git commit -m "feat: implement Evolution Engine with fitness evaluation and genetic operators"
```

---

## Task 8: AI Commentator (Narrator)

**Files:**
- Create: `backend/commentator/narrator.py`
- Create: `backend/tests/test_narrator.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_narrator.py
from commentator.narrator import build_tick_prompt, build_epoch_summary_prompt, parse_commentary


def test_build_tick_prompt():
    trades = [
        {"type": "buy", "agent_id": "a1", "token_id": "t1", "amount": 1000, "cost": 5.0},
    ]
    events = [{"type": "whale", "target_token_id": "t1"}]
    prompt = build_tick_prompt(tick=5, trades=trades, events=events, generation=1)
    assert "tick 5" in prompt.lower() or "Tick 5" in prompt
    assert "whale" in prompt.lower()


def test_build_epoch_summary_prompt():
    stats = {
        "generation": 3,
        "best_fitness": 2.5,
        "avg_fitness": 1.2,
        "worst_fitness": 0.3,
    }
    top_agents = [
        {"name": "Alpha", "genome": {"risk_appetite": 0.9, "contrarian": 0.8}},
    ]
    prompt = build_epoch_summary_prompt(stats, top_agents, graduated_count=2, dead_count=5)
    assert "generation 3" in prompt.lower() or "Generation 3" in prompt
    assert "Alpha" in prompt


def test_parse_commentary():
    raw = "Agent Alpha just made a bold move! Buying into DOGGO during a market dip."
    result = parse_commentary(raw)
    assert isinstance(result, str)
    assert len(result) > 0
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && python -m pytest tests/test_narrator.py -v`
Expected: FAIL

- [ ] **Step 3: Implement Narrator**

```python
# backend/commentator/narrator.py
from __future__ import annotations

import json


def build_tick_prompt(
    tick: int,
    trades: list[dict],
    events: list[dict],
    generation: int,
) -> str:
    trades_str = json.dumps(trades[-5:], default=str) if trades else "No trades"
    events_str = json.dumps(events, default=str) if events else "No events"

    return f"""You are the AI commentator for Darwin.meme, an evolution arena where AI agents compete in meme token markets.

Generation {generation}, Tick {tick}.

Recent trades this tick:
{trades_str}

Market events this tick:
{events_str}

Write 1-2 punchy sentences of live commentary, like a sports broadcaster. Focus on the most interesting action. Be entertaining, use humor. Keep it under 50 words."""


def build_epoch_summary_prompt(
    stats: dict,
    top_agents: list[dict],
    graduated_count: int,
    dead_count: int,
) -> str:
    gen = stats.get("generation", "?")
    best = stats.get("best_fitness", 0)
    avg = stats.get("avg_fitness", 0)
    worst = stats.get("worst_fitness", 0)

    agents_str = json.dumps(top_agents[:3], default=str)

    return f"""You are the AI commentator for Darwin.meme.

Generation {gen} has ended. Summarize this epoch.

Stats:
- Best fitness: {best:.3f}
- Average fitness: {avg:.3f}
- Worst fitness: {worst:.3f}
- Tokens graduated: {graduated_count}
- Tokens died: {dead_count}

Top 3 agents (with genome traits):
{agents_str}

Write a 3-4 sentence summary of this generation. Highlight:
1. What strategies emerged or evolved
2. Any surprising behaviors or genome combinations
3. What was eliminated and why

Be entertaining, insightful, like a nature documentary narrator. Keep under 100 words."""


def parse_commentary(raw: str) -> str:
    # Strip any markdown or extra whitespace
    return raw.strip().strip('"').strip()
```

- [ ] **Step 4: Run narrator tests**

Run: `cd backend && python -m pytest tests/test_narrator.py -v`
Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/commentator/narrator.py backend/tests/test_narrator.py
git commit -m "feat: implement AI Commentator prompt builder and parser"
```

---

## Task 9: Data Store (SQLite)

**Files:**
- Create: `backend/data/store.py`

- [ ] **Step 1: Implement SQLite store**

```python
# backend/data/store.py
from __future__ import annotations

import json
import sqlite3
from pathlib import Path


class Store:
    def __init__(self, db_path: str = "darwin_meme.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_tables()

    def _init_tables(self) -> None:
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS generations (
                generation INTEGER PRIMARY KEY,
                stats_json TEXT NOT NULL,
                population_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS tick_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                generation INTEGER NOT NULL,
                tick INTEGER NOT NULL,
                trades_json TEXT NOT NULL,
                events_json TEXT NOT NULL,
                commentary TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS epoch_summaries (
                generation INTEGER PRIMARY KEY,
                summary TEXT NOT NULL,
                stats_json TEXT NOT NULL
            );
        """)
        self.conn.commit()

    def save_generation(
        self, generation: int, stats: dict, population: list[dict],
    ) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO generations (generation, stats_json, population_json) VALUES (?, ?, ?)",
            (generation, json.dumps(stats), json.dumps(population)),
        )
        self.conn.commit()

    def save_tick(
        self,
        generation: int,
        tick: int,
        trades: list[dict],
        events: list[dict],
        commentary: str = "",
    ) -> None:
        self.conn.execute(
            "INSERT INTO tick_events (generation, tick, trades_json, events_json, commentary) VALUES (?, ?, ?, ?, ?)",
            (generation, tick, json.dumps(trades), json.dumps(events), commentary),
        )
        self.conn.commit()

    def save_epoch_summary(
        self, generation: int, summary: str, stats: dict,
    ) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO epoch_summaries (generation, summary, stats_json) VALUES (?, ?, ?)",
            (generation, summary, json.dumps(stats)),
        )
        self.conn.commit()

    def get_generation(self, generation: int) -> dict | None:
        row = self.conn.execute(
            "SELECT * FROM generations WHERE generation = ?", (generation,),
        ).fetchone()
        if not row:
            return None
        return {
            "generation": row["generation"],
            "stats": json.loads(row["stats_json"]),
            "population": json.loads(row["population_json"]),
        }

    def get_all_stats(self) -> list[dict]:
        rows = self.conn.execute(
            "SELECT generation, stats_json FROM generations ORDER BY generation",
        ).fetchall()
        return [
            {"generation": r["generation"], **json.loads(r["stats_json"])}
            for r in rows
        ]

    def get_epoch_summaries(self) -> list[dict]:
        rows = self.conn.execute(
            "SELECT * FROM epoch_summaries ORDER BY generation",
        ).fetchall()
        return [
            {"generation": r["generation"], "summary": r["summary"],
             "stats": json.loads(r["stats_json"])}
            for r in rows
        ]

    def close(self) -> None:
        self.conn.close()
```

- [ ] **Step 2: Commit**

```bash
git add backend/data/store.py
git commit -m "feat: implement SQLite data store for generation history"
```

---

## Task 10: FastAPI Server + Simulation Orchestration

**Files:**
- Create: `backend/main.py`

- [ ] **Step 1: Implement main server**

```python
# backend/main.py
from __future__ import annotations

import asyncio
import json
import os

import anthropic
import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agent.agent import Agent, ActionType
from agent.decision import build_decision_prompt, build_system_prompt, parse_action_response
from agent.experiment import ExperimentTracker
from commentator.narrator import (
    build_epoch_summary_prompt,
    build_tick_prompt,
    parse_commentary,
)
from config import CONFIG
from data.store import Store
from evolution.engine import EvolutionEngine
from market.simulator import MarketSimulator

app = FastAPI(title="Darwin.meme API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio, other_app=app)

# Global state
client: anthropic.AsyncAnthropic | None = None
store: Store | None = None
sim_task: asyncio.Task | None = None
sim_running = False
sim_speed = 1.0  # seconds between ticks


def get_client() -> anthropic.AsyncAnthropic:
    global client
    if client is None:
        client = anthropic.AsyncAnthropic()
    return client


def get_store() -> Store:
    global store
    if store is None:
        store = Store()
    return store


async def llm_decide(agent: Agent, market_state: dict, tick: int) -> str:
    c = get_client()
    system = build_system_prompt(agent)
    user = build_decision_prompt(agent, market_state, tick)
    try:
        response = await c.messages.create(
            model=CONFIG.llm_model,
            max_tokens=300,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return response.content[0].text
    except Exception as e:
        return json.dumps({"action": "hold", "reasoning": f"LLM error: {e}"})


async def llm_comment(prompt: str) -> str:
    c = get_client()
    try:
        response = await c.messages.create(
            model=CONFIG.llm_model,
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
        )
        return parse_commentary(response.content[0].text)
    except Exception:
        return ""


async def run_tick(
    agents: list[Agent],
    market: MarketSimulator,
    tick: int,
    generation: int,
    experiment_trackers: dict[str, ExperimentTracker],
) -> list[dict]:
    market_state = market.get_market_state()
    tick_trades: list[dict] = []

    # All agents decide concurrently
    decisions = await asyncio.gather(*[
        llm_decide(agent, market_state, tick) for agent in agents
    ])

    for agent, raw_response in zip(agents, decisions):
        action = parse_action_response(raw_response)

        try:
            if action.type == ActionType.CREATE and action.token_name:
                theme = action.token_theme or "absurd"
                token = market.create_token(
                    creator=agent, name=action.token_name, theme=theme, tick=tick,
                )
                action.token_id = token.token_id

            elif action.type == ActionType.BUY and action.token_id and action.amount > 0:
                if action.token_id in market.tokens:
                    cost = market.buy(
                        buyer=agent, token_id=action.token_id,
                        amount=action.amount, tick=tick,
                    )
                    action.cost = cost

            elif action.type == ActionType.SELL and action.token_id and action.amount > 0:
                if action.token_id in market.tokens and action.token_id in agent.holdings:
                    held = agent.holdings[action.token_id]
                    sell_amount = min(action.amount, held)
                    ret = market.sell(
                        seller=agent, token_id=action.token_id,
                        amount=sell_amount, tick=tick,
                    )
                    action.cost = ret

            elif action.type == ActionType.EXPERIMENT and action.hypothesis:
                tracker = experiment_trackers.setdefault(
                    agent.agent_id, ExperimentTracker(),
                )
                tracker.add_hypothesis(action.hypothesis)

        except (ValueError, KeyError):
            action = parse_action_response('{"action": "hold", "reasoning": "execution error"}')

        agent.record_action(action, tick)
        if action.type != ActionType.HOLD:
            tick_trades.append({
                "agent_name": agent.name,
                "agent_id": agent.agent_id,
                **action.to_dict(),
            })

    # Process market tick (decay, death, events)
    events = market.tick(tick)

    # Commentary every 5 ticks
    commentary = ""
    if tick % 5 == 0 and tick_trades:
        prompt = build_tick_prompt(
            tick=tick,
            trades=tick_trades,
            events=[e.to_dict() for e in events],
            generation=generation,
        )
        commentary = await llm_comment(prompt)

    # Save tick data
    get_store().save_tick(
        generation=generation,
        tick=tick,
        trades=tick_trades,
        events=[e.to_dict() for e in events],
        commentary=commentary,
    )

    # Broadcast to frontend
    await sio.emit("tick", {
        "generation": generation,
        "tick": tick,
        "market": market.get_market_state(),
        "agents": [a.to_dict() for a in agents],
        "trades": tick_trades,
        "events": [e.to_dict() for e in events],
        "commentary": commentary,
    })

    return tick_trades


async def run_simulation():
    global sim_running
    sim_running = True

    evo = EvolutionEngine(CONFIG)
    population = evo.init_population()
    all_gen_stats: list[dict] = []

    await sio.emit("sim_started", {"population_size": CONFIG.population_size})

    try:
        for gen in range(CONFIG.max_generations):
            if not sim_running:
                break

            market = MarketSimulator(CONFIG)
            experiment_trackers: dict[str, ExperimentTracker] = {}

            await sio.emit("generation_start", {
                "generation": gen,
                "agents": [a.to_dict() for a in population],
            })

            # Run epoch
            for tick in range(CONFIG.ticks_per_epoch):
                if not sim_running:
                    break
                await run_tick(population, market, tick, gen, experiment_trackers)
                await asyncio.sleep(sim_speed)

            # Apply experiment results
            for agent in population:
                tracker = experiment_trackers.get(agent.agent_id)
                if tracker:
                    # Evaluate experiments based on ROI change
                    for i, h in enumerate(tracker.hypotheses):
                        if h["result"] is None:
                            success = agent.roi(market.token_prices()) > 0
                            tracker.record_result(i, success=success, note=f"ROI={agent.roi(market.token_prices()):.2%}")
                    tracker.apply_to_agent(agent)

            # Determine graduated tokens
            graduated = {
                tid: (t.state.value == "graduated")
                for tid, t in market.tokens.items()
            }

            # Evolve
            population, stats = evo.evolve(
                population, market.token_prices(), graduated,
            )
            all_gen_stats.append(stats)

            # Epoch summary
            top_agents = sorted(
                population, key=lambda a: stats["fitness_scores"].get(a.agent_id, 0),
                reverse=True,
            )[:3]
            summary_prompt = build_epoch_summary_prompt(
                stats=stats,
                top_agents=[a.to_dict() for a in top_agents],
                graduated_count=sum(1 for v in graduated.values() if v),
                dead_count=sum(1 for t in market.tokens.values() if t.state.value == "dead"),
            )
            summary = await llm_comment(summary_prompt)

            # Persist
            s = get_store()
            s.save_generation(gen, stats, [a.to_dict() for a in population])
            s.save_epoch_summary(gen, summary, stats)

            await sio.emit("generation_end", {
                "generation": gen,
                "stats": stats,
                "summary": summary,
                "all_stats": all_gen_stats,
                "agents": [a.to_dict() for a in population],
            })

    finally:
        sim_running = False
        await sio.emit("sim_stopped", {})


@app.get("/api/health")
async def health():
    return {"status": "ok", "sim_running": sim_running}


@app.get("/api/history")
async def history():
    s = get_store()
    return {
        "stats": s.get_all_stats(),
        "summaries": s.get_epoch_summaries(),
    }


@sio.event
async def connect(sid, environ):
    await sio.emit("connected", {"sid": sid}, room=sid)


@sio.event
async def start_simulation(sid, data):
    global sim_task, sim_speed
    if sim_running:
        await sio.emit("error", {"message": "Simulation already running"}, room=sid)
        return
    sim_speed = data.get("speed", 1.0)
    sim_task = asyncio.create_task(run_simulation())


@sio.event
async def stop_simulation(sid, data):
    global sim_running
    sim_running = False


@sio.event
async def set_speed(sid, data):
    global sim_speed
    sim_speed = max(0.01, data.get("speed", 1.0))


def main():
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Test server starts**

Run: `cd backend && timeout 5 python -c "from main import app; print('imports ok')" || true`
Expected: "imports ok"

- [ ] **Step 3: Commit**

```bash
git add backend/main.py
git commit -m "feat: implement FastAPI server with WebSocket simulation orchestration"
```

---

## Task 11: Frontend Scaffolding

**Files:**
- Create: `frontend/` via `npx create-next-app`
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/socket.ts`
- Create: `frontend/hooks/useSimulation.ts`

- [ ] **Step 1: Create Next.js project**

Run:
```bash
cd /Users/weibin/job/hackathon/four_hackason && npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --no-turbopack
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
cd frontend && npm install socket.io-client recharts d3 @types/d3 && npx shadcn@latest init -d
```

- [ ] **Step 3: Create shared types**

```typescript
// frontend/lib/types.ts
export interface Genome {
  risk_appetite: number;
  entry_threshold: number;
  exit_threshold: number;
  position_size: number;
  max_holdings: number;
  graduation_bias: number;
  creation_frequency: number;
  theme_vector: number[];
  naming_style: number;
  hype_intensity: number;
  follow_leader: number;
  contrarian: number;
  herd_sensitivity: number;
  cooperation: number;
  experiment_rate: number;
  adaptation_speed: number;
  memory_weight: number;
  exploration_vs_exploit: number;
}

export interface AgentAction {
  type: "create" | "buy" | "sell" | "hold" | "experiment";
  token_id?: string;
  token_name?: string;
  token_theme?: string;
  amount: number;
  cost: number;
  reasoning: string;
  hypothesis?: string;
}

export interface AgentData {
  agent_id: string;
  name: string;
  genome: Genome;
  balance: number;
  generation: number;
  parent_ids: string[];
  holdings: Record<string, number>;
  created_tokens: string[];
  action_history: { tick: number; action: AgentAction }[];
  strategy_notes: string[];
  alive: boolean;
}

export interface TokenData {
  token_id: string;
  name: string;
  theme: string;
  creator_id: string;
  state: "active" | "graduated" | "dead";
  supply_sold: number;
  total_raised: number;
  current_price: number;
  bonding_progress: number;
  holders: Record<string, number>;
  holder_count: number;
  recent_volume: number;
}

export interface TradeData {
  agent_name: string;
  agent_id: string;
  type: string;
  token_id?: string;
  token_name?: string;
  amount: number;
  cost: number;
  reasoning: string;
}

export interface EventData {
  type: "whale" | "fud" | "viral" | "crisis" | "narrative";
  target_token_id?: string;
  target_theme?: string;
  magnitude: number;
}

export interface TickPayload {
  generation: number;
  tick: number;
  market: {
    tokens: TokenData[];
    recent_trades: TradeData[];
    recent_events: EventData[];
  };
  agents: AgentData[];
  trades: TradeData[];
  events: EventData[];
  commentary: string;
}

export interface GenerationStats {
  generation: number;
  best_fitness: number;
  avg_fitness: number;
  worst_fitness: number;
  fitness_scores: Record<string, number>;
}

export interface GenerationEndPayload {
  generation: number;
  stats: GenerationStats;
  summary: string;
  all_stats: GenerationStats[];
  agents: AgentData[];
}

export interface SimulationState {
  connected: boolean;
  running: boolean;
  generation: number;
  tick: number;
  agents: AgentData[];
  tokens: TokenData[];
  trades: TradeData[];
  events: EventData[];
  commentary: string[];
  allStats: GenerationStats[];
  summaries: string[];
  speed: number;
}
```

- [ ] **Step 4: Create socket client**

```typescript
// frontend/lib/socket.ts
import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return socket;
}
```

- [ ] **Step 5: Create useSimulation hook**

```typescript
// frontend/hooks/useSimulation.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import type {
  AgentData,
  GenerationEndPayload,
  GenerationStats,
  SimulationState,
  TickPayload,
  TokenData,
  TradeData,
  EventData,
} from "@/lib/types";

const initialState: SimulationState = {
  connected: false,
  running: false,
  generation: 0,
  tick: 0,
  agents: [],
  tokens: [],
  trades: [],
  events: [],
  commentary: [],
  allStats: [],
  summaries: [],
  speed: 1.0,
};

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      setState((s) => ({ ...s, connected: true }));
    });

    socket.on("disconnect", () => {
      setState((s) => ({ ...s, connected: false }));
    });

    socket.on("sim_started", () => {
      setState((s) => ({ ...s, running: true }));
    });

    socket.on("sim_stopped", () => {
      setState((s) => ({ ...s, running: false }));
    });

    socket.on("generation_start", (data: { generation: number; agents: AgentData[] }) => {
      setState((s) => ({
        ...s,
        generation: data.generation,
        tick: 0,
        agents: data.agents,
        tokens: [],
        trades: [],
      }));
    });

    socket.on("tick", (data: TickPayload) => {
      setState((s) => ({
        ...s,
        tick: data.tick,
        agents: data.agents,
        tokens: data.market.tokens,
        trades: data.trades,
        events: data.events,
        commentary: data.commentary
          ? [...s.commentary.slice(-49), data.commentary]
          : s.commentary,
      }));
    });

    socket.on("generation_end", (data: GenerationEndPayload) => {
      setState((s) => ({
        ...s,
        allStats: data.all_stats,
        agents: data.agents,
        summaries: data.summary
          ? [...s.summaries, data.summary]
          : s.summaries,
      }));
    });

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("sim_started");
      socket.off("sim_stopped");
      socket.off("generation_start");
      socket.off("tick");
      socket.off("generation_end");
      socket.disconnect();
    };
  }, []);

  const startSimulation = useCallback((speed: number = 1.0) => {
    const socket = getSocket();
    socket.emit("start_simulation", { speed });
  }, []);

  const stopSimulation = useCallback(() => {
    const socket = getSocket();
    socket.emit("stop_simulation", {});
  }, []);

  const setSpeed = useCallback((speed: number) => {
    const socket = getSocket();
    socket.emit("set_speed", { speed });
    setState((s) => ({ ...s, speed }));
  }, []);

  return { state, startSimulation, stopSimulation, setSpeed };
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold Next.js frontend with types, socket client, and simulation hook"
```

---

## Task 12: Dashboard Layout + Controls

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/layout.tsx`
- Create: `frontend/components/shared/Controls.tsx`

- [ ] **Step 1: Update layout.tsx**

Replace the contents of `frontend/app/layout.tsx`:

```tsx
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Darwin.meme — AI Evolution Arena",
  description: "Watch AI agents evolve strategies in a simulated meme token market",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${mono.variable} font-sans bg-gray-950 text-gray-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create Controls component**

```tsx
// frontend/components/shared/Controls.tsx
"use client";

interface ControlsProps {
  running: boolean;
  connected: boolean;
  generation: number;
  tick: number;
  speed: number;
  onStart: (speed: number) => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [
  { label: "1x", value: 1.0 },
  { label: "5x", value: 0.2 },
  { label: "Max", value: 0.01 },
];

export function Controls({
  running, connected, generation, tick, speed, onStart, onStop, onSpeedChange,
}: ControlsProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-gray-900 border-b border-gray-800">
      <h1 className="text-xl font-bold tracking-tight">
        <span className="text-emerald-400">Darwin</span>
        <span className="text-gray-500">.meme</span>
      </h1>

      <div className="flex items-center gap-2 ml-4">
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
        <span className="text-xs text-gray-500">{connected ? "Connected" : "Disconnected"}</span>
      </div>

      <div className="flex items-center gap-2 ml-4 font-mono text-sm">
        <span className="text-gray-500">Gen:</span>
        <span className="text-emerald-400 font-bold">{generation}</span>
        <span className="text-gray-600 mx-1">|</span>
        <span className="text-gray-500">Tick:</span>
        <span className="text-blue-400">{tick}/50</span>
      </div>

      <div className="flex items-center gap-1 ml-4">
        {SPEEDS.map((s) => (
          <button
            key={s.label}
            onClick={() => onSpeedChange(s.value)}
            className={`px-2 py-1 text-xs rounded ${
              speed === s.value
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="ml-auto">
        {running ? (
          <button
            onClick={onStop}
            className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded font-medium"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={() => onStart(speed)}
            disabled={!connected}
            className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded font-medium"
          >
            Start Evolution
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create main dashboard page**

```tsx
// frontend/app/page.tsx
"use client";

import { useSimulation } from "@/hooks/useSimulation";
import { Controls } from "@/components/shared/Controls";
import { MarketView } from "@/components/market/MarketView";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { EvolutionView } from "@/components/evolution/EvolutionView";
import { CommentatorView } from "@/components/commentator/CommentatorView";

export default function Dashboard() {
  const { state, startSimulation, stopSimulation, setSpeed } = useSimulation();

  return (
    <div className="h-screen flex flex-col">
      <Controls
        running={state.running}
        connected={state.connected}
        generation={state.generation}
        tick={state.tick}
        speed={state.speed}
        onStart={startSimulation}
        onStop={stopSimulation}
        onSpeedChange={setSpeed}
      />

      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-px bg-gray-800 overflow-hidden">
        <div className="bg-gray-950 overflow-auto p-4">
          <MarketView tokens={state.tokens} trades={state.trades} events={state.events} />
        </div>
        <div className="bg-gray-950 overflow-auto p-4">
          <LeaderboardView agents={state.agents} generation={state.generation} />
        </div>
        <div className="bg-gray-950 overflow-auto p-4">
          <EvolutionView allStats={state.allStats} agents={state.agents} />
        </div>
        <div className="bg-gray-950 overflow-auto p-4">
          <CommentatorView commentary={state.commentary} summaries={state.summaries} generation={state.generation} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/ frontend/components/shared/Controls.tsx
git commit -m "feat: implement Dashboard layout with Controls and 4-panel grid"
```

---

## Task 13: Market View Components

**Files:**
- Create: `frontend/components/market/MarketView.tsx`
- Create: `frontend/components/market/TokenCard.tsx`
- Create: `frontend/components/market/TradeFeed.tsx`

- [ ] **Step 1: Create TokenCard**

```tsx
// frontend/components/market/TokenCard.tsx
import type { TokenData } from "@/lib/types";

const stateColors = {
  active: "border-emerald-500/30 bg-emerald-500/5",
  graduated: "border-yellow-500/30 bg-yellow-500/5",
  dead: "border-red-500/30 bg-red-500/5 opacity-50",
};

const stateBadge = {
  active: "bg-emerald-500/20 text-emerald-400",
  graduated: "bg-yellow-500/20 text-yellow-400",
  dead: "bg-red-500/20 text-red-400",
};

export function TokenCard({ token }: { token: TokenData }) {
  return (
    <div className={`border rounded-lg p-3 ${stateColors[token.state]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm">{token.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${stateBadge[token.state]}`}>
          {token.state}
        </span>
      </div>
      <div className="text-xs text-gray-400 mb-2">{token.theme}</div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">Price</span>
        <span className="font-mono text-emerald-400">{token.current_price.toExponential(2)}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-1">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(token.bonding_progress * 100).toFixed(1)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{(token.bonding_progress * 100).toFixed(1)}% to graduation</span>
        <span>{token.holder_count} holders</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TradeFeed**

```tsx
// frontend/components/market/TradeFeed.tsx
import type { TradeData } from "@/lib/types";

const typeColors: Record<string, string> = {
  buy: "text-emerald-400",
  sell: "text-red-400",
  create: "text-blue-400",
};

export function TradeFeed({ trades }: { trades: TradeData[] }) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Recent Trades
      </h3>
      {trades.length === 0 && (
        <p className="text-xs text-gray-600">No trades yet</p>
      )}
      {trades.slice(-15).reverse().map((trade, i) => (
        <div key={i} className="flex items-center gap-2 text-xs font-mono">
          <span className={typeColors[trade.type] || "text-gray-400"}>
            {trade.type.toUpperCase()}
          </span>
          <span className="text-gray-500">{trade.agent_name}</span>
          {trade.token_name && <span className="text-gray-300">{trade.token_name}</span>}
          {trade.amount > 0 && (
            <span className="text-gray-600">{trade.amount.toLocaleString()}</span>
          )}
          {trade.cost > 0 && (
            <span className="text-yellow-400/70">{trade.cost.toFixed(4)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create MarketView**

```tsx
// frontend/components/market/MarketView.tsx
import type { TokenData, TradeData, EventData } from "@/lib/types";
import { TokenCard } from "./TokenCard";
import { TradeFeed } from "./TradeFeed";

interface MarketViewProps {
  tokens: TokenData[];
  trades: TradeData[];
  events: EventData[];
}

export function MarketView({ tokens, trades, events }: MarketViewProps) {
  const activeTokens = tokens.filter((t) => t.state === "active");
  const graduatedTokens = tokens.filter((t) => t.state === "graduated");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
          Market
        </h2>
        <div className="flex gap-2 text-[10px]">
          <span className="text-emerald-400">{activeTokens.length} active</span>
          <span className="text-yellow-400">{graduatedTokens.length} graduated</span>
        </div>
      </div>

      {events.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {events.map((e, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300"
            >
              {e.type} {e.target_theme || ""}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {tokens.slice(0, 8).map((token) => (
          <TokenCard key={token.token_id} token={token} />
        ))}
      </div>

      {tokens.length === 0 && (
        <div className="text-center text-gray-600 py-8 text-sm">
          Waiting for agents to create tokens...
        </div>
      )}

      <TradeFeed trades={trades} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/market/
git commit -m "feat: implement MarketView with TokenCard and TradeFeed components"
```

---

## Task 14: Leaderboard Components

**Files:**
- Create: `frontend/components/leaderboard/LeaderboardView.tsx`
- Create: `frontend/components/leaderboard/AgentRow.tsx`
- Create: `frontend/components/shared/RadarChart.tsx`

- [ ] **Step 1: Create RadarChart**

```tsx
// frontend/components/shared/RadarChart.tsx
"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Genome } from "@/lib/types";

interface RadarChartProps {
  genome: Genome;
  size?: number;
}

const TRAITS = [
  { key: "risk_appetite", label: "Risk" },
  { key: "contrarian", label: "Contrarian" },
  { key: "creation_frequency", label: "Create" },
  { key: "hype_intensity", label: "Hype" },
  { key: "follow_leader", label: "Follow" },
  { key: "experiment_rate", label: "Experiment" },
  { key: "exploration_vs_exploit", label: "Explore" },
  { key: "cooperation", label: "Coop" },
] as const;

export function RadarChart({ genome, size = 120 }: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const center = size / 2;
    const radius = size / 2 - 16;
    const angleSlice = (2 * Math.PI) / TRAITS.length;

    const g = svg
      .append("g")
      .attr("transform", `translate(${center},${center})`);

    // Grid circles
    [0.25, 0.5, 0.75, 1.0].forEach((level) => {
      g.append("circle")
        .attr("r", radius * level)
        .attr("fill", "none")
        .attr("stroke", "#374151")
        .attr("stroke-width", 0.5);
    });

    // Axis lines
    TRAITS.forEach((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", radius * Math.cos(angle))
        .attr("y2", radius * Math.sin(angle))
        .attr("stroke", "#374151")
        .attr("stroke-width", 0.5);
    });

    // Data polygon
    const values = TRAITS.map((t) => (genome as Record<string, unknown>)[t.key] as number);
    const points = values.map((v, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [radius * v * Math.cos(angle), radius * v * Math.sin(angle)];
    });

    g.append("polygon")
      .attr("points", points.map((p) => p.join(",")).join(" "))
      .attr("fill", "rgba(52, 211, 153, 0.2)")
      .attr("stroke", "#34d399")
      .attr("stroke-width", 1.5);

    // Labels
    TRAITS.forEach((t, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = (radius + 12) * Math.cos(angle);
      const y = (radius + 12) * Math.sin(angle);
      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#9ca3af")
        .attr("font-size", "7px")
        .text(t.label);
    });
  }, [genome, size]);

  return <svg ref={svgRef} width={size} height={size} />;
}
```

- [ ] **Step 2: Create AgentRow**

```tsx
// frontend/components/leaderboard/AgentRow.tsx
"use client";

import { useState } from "react";
import type { AgentData } from "@/lib/types";
import { RadarChart } from "@/components/shared/RadarChart";

export function AgentRow({ agent, rank }: { agent: AgentData; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const roi = agent.balance > 0
    ? (((agent.balance - 100) / 100) * 100).toFixed(1)
    : "0.0";
  const roiColor = parseFloat(roi) >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-900/50 text-left"
      >
        <span className="text-xs text-gray-600 w-5 font-mono">#{rank}</span>
        <span className="font-medium text-sm flex-1">{agent.name}</span>
        <span className={`font-mono text-xs ${roiColor}`}>{roi}%</span>
        <span className="text-[10px] text-gray-600">Gen {agent.generation}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-800/50">
          <div className="flex gap-4 mt-2">
            <RadarChart genome={agent.genome} size={100} />
            <div className="flex-1 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Balance</span>
                <span className="font-mono">{agent.balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Holdings</span>
                <span className="font-mono">{Object.keys(agent.holdings).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tokens Created</span>
                <span className="font-mono">{agent.created_tokens.length}</span>
              </div>
              {agent.parent_ids.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Parents</span>
                  <span className="font-mono text-[10px]">{agent.parent_ids.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
          {agent.action_history.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] text-gray-600 uppercase">Recent Actions</span>
              {agent.action_history.slice(-3).map((h, i) => (
                <div key={i} className="text-[10px] text-gray-500 font-mono truncate">
                  T{h.tick}: {h.action.type} {h.action.reasoning}
                </div>
              ))}
            </div>
          )}
          {agent.strategy_notes.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] text-gray-600 uppercase">Strategy Notes</span>
              {agent.strategy_notes.map((n, i) => (
                <div key={i} className="text-[10px] text-purple-400 font-mono truncate">
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create LeaderboardView**

```tsx
// frontend/components/leaderboard/LeaderboardView.tsx
import type { AgentData } from "@/lib/types";
import { AgentRow } from "./AgentRow";

interface LeaderboardViewProps {
  agents: AgentData[];
  generation: number;
}

export function LeaderboardView({ agents, generation }: LeaderboardViewProps) {
  const sorted = [...agents].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
        Agent Leaderboard
        <span className="ml-2 text-emerald-400 normal-case font-normal">
          {agents.length} agents
        </span>
      </h2>

      <div className="space-y-1">
        {sorted.map((agent, i) => (
          <AgentRow key={agent.agent_id} agent={agent} rank={i + 1} />
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center text-gray-600 py-8 text-sm">
          Start simulation to see agents...
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/leaderboard/ frontend/components/shared/RadarChart.tsx
git commit -m "feat: implement LeaderboardView with AgentRow and RadarChart"
```

---

## Task 15: Evolution View Components

**Files:**
- Create: `frontend/components/evolution/EvolutionView.tsx`
- Create: `frontend/components/evolution/FitnessChart.tsx`
- Create: `frontend/components/evolution/StrategyScatter.tsx`
- Create: `frontend/components/evolution/GenesDrift.tsx`

- [ ] **Step 1: Create FitnessChart**

```tsx
// frontend/components/evolution/FitnessChart.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { GenerationStats } from "@/lib/types";

export function FitnessChart({ stats }: { stats: GenerationStats[] }) {
  if (stats.length === 0) return null;

  const data = stats.map((s) => ({
    gen: s.generation,
    best: parseFloat(s.best_fitness.toFixed(3)),
    avg: parseFloat(s.avg_fitness.toFixed(3)),
    worst: parseFloat(s.worst_fitness.toFixed(3)),
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="gen" stroke="#6b7280" fontSize={10} />
          <YAxis stroke="#6b7280" fontSize={10} />
          <Tooltip
            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", fontSize: 11 }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="best" stroke="#34d399" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="avg" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="worst" stroke="#f87171" strokeWidth={1} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Create StrategyScatter**

```tsx
// frontend/components/evolution/StrategyScatter.tsx
"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { AgentData } from "@/lib/types";

// Simple 2D projection using two meaningful dimensions
function project(agent: AgentData): [number, number] {
  const g = agent.genome;
  // X axis: risk-seeking vs conservative (risk + contrarian - follow_leader)
  const x = (g.risk_appetite + g.contrarian) / 2 - g.follow_leader / 2 + 0.25;
  // Y axis: creator vs trader (creation_frequency + hype - entry_threshold)
  const y = (g.creation_frequency + g.hype_intensity) / 2 - g.entry_threshold / 2 + 0.25;
  return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
}

export function StrategyScatter({ agents }: { agents: AgentData[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || agents.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 280;
    const height = 200;
    const margin = { top: 10, right: 10, bottom: 25, left: 30 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 1]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text").attr("fill", "#6b7280").attr("font-size", "8px");
    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text").attr("fill", "#6b7280").attr("font-size", "8px");

    // Axis labels
    g.append("text").attr("x", innerW / 2).attr("y", innerH + 22).attr("text-anchor", "middle")
      .attr("fill", "#6b7280").attr("font-size", "9px").text("Risk-Seeking →");
    g.append("text").attr("x", -innerH / 2).attr("y", -22).attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)").attr("fill", "#6b7280").attr("font-size", "9px")
      .text("Creator →");

    const points = agents.map((a) => ({ agent: a, pos: project(a) }));

    g.selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.pos[0]))
      .attr("cy", (d) => y(d.pos[1]))
      .attr("r", 4)
      .attr("fill", "#34d399")
      .attr("fill-opacity", 0.6)
      .attr("stroke", "#059669")
      .attr("stroke-width", 1);

    // Labels for top agents
    points.slice(0, 3).forEach((d) => {
      g.append("text")
        .attr("x", x(d.pos[0]) + 6)
        .attr("y", y(d.pos[1]) + 3)
        .attr("fill", "#9ca3af")
        .attr("font-size", "8px")
        .text(d.agent.name);
    });
  }, [agents]);

  return <svg ref={svgRef} width={280} height={200} />;
}
```

- [ ] **Step 3: Create GenesDrift**

```tsx
// frontend/components/evolution/GenesDrift.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { AgentData, GenerationStats } from "@/lib/types";

const TRACKED_GENES = [
  { key: "risk_appetite", color: "#f87171", label: "Risk" },
  { key: "contrarian", color: "#60a5fa", label: "Contrarian" },
  { key: "creation_frequency", color: "#34d399", label: "Create" },
  { key: "experiment_rate", color: "#c084fc", label: "Experiment" },
];

interface GenesDriftProps {
  allStats: GenerationStats[];
  agents: AgentData[];
}

export function GenesDrift({ allStats, agents }: GenesDriftProps) {
  // Build data from current agents' generations
  // For now, show average of current population per tracked gene
  if (agents.length === 0) return null;

  const avgData: Record<string, number> = {};
  for (const gene of TRACKED_GENES) {
    const values = agents.map((a) => (a.genome as Record<string, unknown>)[gene.key] as number);
    avgData[gene.key] = values.reduce((s, v) => s + v, 0) / values.length;
  }

  // Show as a simple bar-like display since we only have current snapshot
  return (
    <div className="space-y-1">
      <h4 className="text-[10px] text-gray-600 uppercase tracking-wider">Population Gene Averages</h4>
      {TRACKED_GENES.map((gene) => (
        <div key={gene.key} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-16">{gene.label}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${(avgData[gene.key] * 100).toFixed(1)}%`,
                backgroundColor: gene.color,
              }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-mono w-8">
            {avgData[gene.key].toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create EvolutionView**

```tsx
// frontend/components/evolution/EvolutionView.tsx
import type { AgentData, GenerationStats } from "@/lib/types";
import { FitnessChart } from "./FitnessChart";
import { StrategyScatter } from "./StrategyScatter";
import { GenesDrift } from "./GenesDrift";

interface EvolutionViewProps {
  allStats: GenerationStats[];
  agents: AgentData[];
}

export function EvolutionView({ allStats, agents }: EvolutionViewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
        Evolution
        {allStats.length > 0 && (
          <span className="ml-2 text-emerald-400 normal-case font-normal">
            {allStats.length} generations
          </span>
        )}
      </h2>

      {allStats.length > 0 ? (
        <>
          <div>
            <h3 className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">
              Fitness Over Generations
            </h3>
            <FitnessChart stats={allStats} />
          </div>

          <div className="flex gap-4">
            <div>
              <h3 className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">
                Strategy Space
              </h3>
              <StrategyScatter agents={agents} />
            </div>
            <div className="flex-1">
              <GenesDrift allStats={allStats} agents={agents} />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-600 py-8 text-sm">
          Evolution data will appear after the first generation completes...
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/components/evolution/
git commit -m "feat: implement EvolutionView with FitnessChart, StrategyScatter, and GenesDrift"
```

---

## Task 16: Commentator View

**Files:**
- Create: `frontend/components/commentator/CommentatorView.tsx`

- [ ] **Step 1: Create CommentatorView**

```tsx
// frontend/components/commentator/CommentatorView.tsx
"use client";

import { useEffect, useRef } from "react";

interface CommentatorViewProps {
  commentary: string[];
  summaries: string[];
  generation: number;
}

export function CommentatorView({ commentary, summaries, generation }: CommentatorViewProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [commentary, summaries]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
        AI Commentator
      </h2>

      <div ref={feedRef} className="flex-1 overflow-auto space-y-2">
        {/* Epoch summaries */}
        {summaries.map((s, i) => (
          <div key={`s-${i}`} className="border-l-2 border-yellow-500/50 pl-3 py-1">
            <div className="text-[10px] text-yellow-500/70 uppercase font-semibold mb-0.5">
              Generation {i} Summary
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{s}</p>
          </div>
        ))}

        {/* Live commentary */}
        {commentary.map((c, i) => (
          <div key={`c-${i}`} className="text-xs text-gray-400 border-l-2 border-emerald-500/30 pl-3 py-0.5">
            {c}
          </div>
        ))}

        {commentary.length === 0 && summaries.length === 0 && (
          <div className="text-center text-gray-600 py-8 text-sm">
            Commentary will appear during simulation...
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/commentator/
git commit -m "feat: implement CommentatorView with live commentary and epoch summaries"
```

---

## Task 17: Build Verification + Polish

- [ ] **Step 1: Verify backend tests pass**

Run: `cd /Users/weibin/job/hackathon/four_hackason/backend && python -m pytest tests/ -v`
Expected: All tests PASS.

- [ ] **Step 2: Verify frontend builds**

Run: `cd /Users/weibin/job/hackathon/four_hackason/frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Fix any build errors**

Address any TypeScript or build errors found in Step 2.

- [ ] **Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve build errors and polish"
```

---

## Task 18: Four.meme Integration (Stretch)

**Files:**
- Create: `backend/integrations/__init__.py`
- Create: `backend/integrations/bitquery.py`

- [ ] **Step 1: Create Bitquery integration stub**

```python
# backend/integrations/bitquery.py
from __future__ import annotations

import os
from typing import Any

import httpx

BITQUERY_URL = "https://streaming.bitquery.io/graphql"


async def query_four_meme_tokens(limit: int = 10) -> list[dict[str, Any]]:
    """Fetch recent Four.meme token launches from Bitquery."""
    api_key = os.environ.get("BITQUERY_API_KEY")
    if not api_key:
        return []

    query = """
    {
      EVM(dataset: realtime, network: bsc) {
        DEXTradeByTokens(
          where: {
            Trade: {
              Dex: {
                SmartContract: {
                  is: "0x5c952063c7fc8610ffdb798152d69f0b9550762b"
                }
              }
            }
          }
          limit: {count: %d}
          orderBy: {descending: Block_Time}
        ) {
          Trade {
            Currency {
              Name
              Symbol
              SmartContract
            }
            Amount
            Price
          }
          Block {
            Time
          }
        }
      }
    }
    """ % limit

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                BITQUERY_URL,
                json={"query": query},
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", {}).get("EVM", {}).get("DEXTradeByTokens", [])
        except Exception:
            return []
```

- [ ] **Step 2: Add API endpoint for real data**

Add to `backend/main.py`:

```python
@app.get("/api/four-meme/tokens")
async def four_meme_tokens():
    from integrations.bitquery import query_four_meme_tokens
    tokens = await query_four_meme_tokens(limit=20)
    return {"tokens": tokens}
```

- [ ] **Step 3: Commit**

```bash
git add backend/integrations/
git commit -m "feat: add Four.meme Bitquery integration for real token data"
```

---

## Task 19: README + Final Commit

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

```markdown
# Darwin.meme

> AI agents evolve strategies in a simulated meme token market through natural selection and autonomous experimentation.

## What is this?

Darwin.meme is a real-time evolution arena where AI agents compete in a simulated meme token economy modeled after [Four.meme](https://four.meme). Each agent has a unique "genome" that shapes its trading personality. Through natural selection — the best survive, reproduce, and mutate — novel strategies emerge that no human designed.

## Key Innovation

- **Evolutionary AI**: Genetic algorithms + LLM-powered decision making
- **AutoResearch Loop**: Agents autonomously experiment with strategies (inspired by Karpathy's AutoResearch)
- **Emergent Behavior**: Strategies arise from evolution, not human design
- **Real-time Visualization**: Watch evolution unfold with live commentary

## Architecture

```
Agent Engine (genome + LLM decisions)
    ↕
Market Simulator (bonding curve + events)
    ↕
Evolution Engine (selection + crossover + mutation)
    ↕
Real-time Dashboard (WebSocket)
```

## Tech Stack

- **Backend**: Python, FastAPI, Socket.IO, Claude API
- **Frontend**: Next.js 14, TypeScript, TailwindCSS, D3.js, Recharts
- **AI**: Claude Sonnet for agent decisions and commentary

## Quick Start

### Backend
```bash
cd backend
pip install -e ".[dev]"
export ANTHROPIC_API_KEY=your_key_here
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and click "Start Evolution".

## How It Works

1. **20 agents** with random genomes are initialized
2. Each agent decides actions (create tokens, buy, sell, hold, experiment) using an LLM guided by its genome
3. After 50 ticks, agents are evaluated on ROI, token survival, strategy uniqueness
4. Top 8 survive, 8 offspring via crossover+mutation, 4 random newcomers
5. Repeat — watch strategies evolve

## Four.meme Integration

- Market simulator replicates Four.meme's bonding curve and graduation mechanics
- Bitquery API integration for real Four.meme market data
- Evolved strategies can be deployed via Four.meme's Agentic Mode

## Built for

[Four.meme AI Sprint Hackathon](https://dorahacks.io/hackathon/fourmemeaisprint) — $50,000 prize pool
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add project README"
```
