# Darwin.meme

### What happens when you let AI evolve in a meme token economy for 100 generations?

**Darwin.meme** is the world's first **AI evolution arena** for meme token markets. Instead of hand-coding trading strategies, we let natural selection discover them. 20 AI agents — each with a unique genetic "personality" — compete, trade, create tokens, and experiment in a simulated [Four.meme](https://four.meme) economy. The weak are eliminated. The strong reproduce. Novel strategies emerge that no human ever designed.

> "The most powerful force in the universe is compound interest."
> "The second most powerful? Compound evolution."

---

## The Problem

Meme token markets are chaotic, irrational, and unpredictable. No single strategy works. Human traders rely on gut feeling. Algorithmic bots use rigid rules that break when the market shifts.

**What if we stopped trying to design the perfect strategy — and let evolution find it?**

## The Innovation

Darwin.meme combines three breakthroughs into something entirely new:

### 1. Evolutionary Personality Engineering

Each agent has a **25-dimensional genome** encoding its trading personality — risk appetite, contrarian tendency, creation frequency, hype intensity, and more. But here's the twist: **the genome doesn't dictate actions directly.** It's injected into the LLM as a personality prompt. The same market situation produces completely different decisions from different genomes.

Evolution changes *who the agent is*, not *what rules it follows.*

### 2. AutoResearch: Agents That Experiment on Themselves

Inspired by [Karpathy's AutoResearch](https://github.com/karpathy/autoresearch), each agent can propose hypotheses ("buy during FUD events"), test them in real-time, and internalize successful strategies. This creates **two layers of learning**:

| Layer | Scope | Mechanism | Analogy |
|-------|-------|-----------|---------|
| **Individual** | Within 1 epoch | AutoResearch loop | A trader learning from experience |
| **Population** | Across epochs | Natural selection | Species adapting over millennia |

Individual learning doesn't inherit (Darwin, not Lamarck) — but agents that *learn faster* survive more, so evolution selects for learnability itself.

### 3. Complete Meme Economy Simulation

Not a toy model — a faithful reproduction of Four.meme's mechanics:

- **Bonding curve pricing**: `price = K * (supply/total)^N` — early buyers get better prices
- **Graduation**: Tokens that raise enough liquidity "graduate" to secondary markets
- **Token death**: Abandoned tokens die after idle periods
- **Market events**: Whale entries, FUD panics, viral moments, liquidity crises, narrative waves — all with tunable probabilities
- **Social buzz**: Volume, holder count, and creator hype drive token visibility

---

## How It Works

```
                    ┌─────────────────────┐
                    │   Generation 0      │
                    │   20 Random Agents   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Run 50 Ticks      │
                    │                     │
                    │  Each tick:         │
                    │  • Agents observe   │
                    │  • LLM decides      │
                    │  • Market executes  │
                    │  • Events fire      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Evaluate Fitness   │
                    │                     │
                    │  40% ROI            │
                    │  30% Token survival │
                    │  20% Uniqueness     │
                    │  10% Risk-adjusted  │
                    └──────────┬──────────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
      ┌────────▼───────┐ ┌────▼────┐ ┌────────▼───────┐
      │  8 Survivors   │ │8 Offspring│ │  4 Newcomers   │
      │  (Top elite)   │ │(Crossover │ │  (Random DNA)  │
      │                │ │+ Mutation)│ │                │
      └────────┬───────┘ └────┬────┘ └────────┬───────┘
               │               │               │
               └───────────────┼───────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Generation N+1    │
                    │   20 Evolved Agents  │
                    └──────────┬──────────┘
                               │
                           Repeat...
```

### Agent Genome: The DNA of a Trader

```
Trading Chromosome          Creation Chromosome
├── risk_appetite    0~1    ├── creation_frequency  0~1
├── entry_threshold  0~1    ├── theme_vector     [8 dims]
├── exit_threshold   0~1    ├── naming_style       0~4
├── position_size  0.1~0.5  └── hype_intensity     0~1
├── max_holdings    1~10
└── graduation_bias  0~1    Meta Chromosome
                            ├── experiment_rate    0~1
Social Chromosome           ├── adaptation_speed   0~1
├── follow_leader    0~1    ├── memory_weight      0~1
├── contrarian       0~1    └── explore_vs_exploit 0~1
├── herd_sensitivity 0~1
└── cooperation      0~1
```

### What Emerges?

After 20+ generations, we've observed strategies that **no human designed**:

| Emergent Strategy | Genome Signature | Behavior |
|-------------------|-----------------|----------|
| "Panic Hunter" | High contrarian + high risk | Buys during FUD crashes, sells on recovery |
| "Token Factory" | High creation + high hype | Mass-creates tokens, profits from volume |
| "Shadow Follower" | High follow_leader + zero creation | Never creates, copies the top performer |
| "Mad Scientist" | High experiment_rate + high adaptation | Constantly tests new hypotheses, adapts fastest |
| "Contrarian Leader" | High contrarian + high cooperation | Buys when others panic, attracts followers to push price up |

These aren't pre-programmed archetypes. They *emerge* from evolution. That's the point.

---

## Real-Time Dashboard

A 4-panel live visualization of evolution in action:

```
┌─────────────────────┬──────────────────────────┐
│                     │                          │
│   Market View       │   Agent Leaderboard      │
│                     │                          │
│   • Token cards     │   • Rankings by ROI      │
│   • Bonding curves  │   • Genome radar charts  │
│   • Live trade feed │   • Decision logs        │
│   • Market events   │   • Strategy notes       │
│                     │                          │
├─────────────────────┼──────────────────────────┤
│                     │                          │
│   Evolution View    │   AI Commentator         │
│                     │                          │
│   • Fitness curves  │   • Live play-by-play    │
│   • Strategy space  │   • Generation summaries │
│   • Gene drift bars │   • Emergent highlights  │
│                     │                          │
└─────────────────────┴──────────────────────────┘
```

- **Speed controls**: 1x (real-time) / 5x / Max (instant)
- **Agent details**: Click any agent to see its genome, holdings, and reasoning
- **AI Commentary**: An LLM commentator narrates the action like a nature documentary

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  Darwin.meme                      │
│                                                   │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐│
│  │   Agent    │  │   Market   │  │  Evolution  ││
│  │   Engine   │◄─┤  Simulator │──┤   Engine    ││
│  │            │  │            │  │             ││
│  │ • Genome   │  │ • Bonding  │  │ • Fitness   ││
│  │ • LLM AI   │  │   Curve   │  │ • Selection ││
│  │ • AutoRes  │  │ • Events  │  │ • Crossover ││
│  │   Loop    │  │ • Tokens  │  │ • Mutation  ││
│  └──────┬─────┘  └──────┬─────┘  └──────┬──────┘│
│         │               │               │        │
│  ┌──────▼───────────────▼───────────────▼──────┐ │
│  │         WebSocket (Socket.IO)               │ │
│  └──────────────────┬──────────────────────────┘ │
│                     │                            │
│  ┌──────────────────▼──────────────────────────┐ │
│  │       Real-time Dashboard (Next.js)         │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │       Four.meme Integration (Bitquery)      │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Python + FastAPI | Best for AI/ML, async support |
| Real-time | Socket.IO (WebSocket) | Low-latency state streaming |
| AI | LLM API | Agent decisions + commentary |
| Evolution | NumPy + custom GA | Fast genetic algorithm operations |
| Frontend | Next.js 14 + TypeScript | SSR, type safety, ecosystem |
| Visualization | D3.js + Recharts | Complex charts + standard charts |
| Styling | TailwindCSS + shadcn/ui | Dark-themed, responsive |
| Storage | SQLite | Zero-config, portable history |
| Integration | Bitquery GraphQL | Real Four.meme market data |

### Test Coverage

**66 unit tests** across all backend modules:

```
tests/test_genome.py       7 tests   Genome creation, serialization, evolution
tests/test_bonding_curve.py 6 tests   Price calculation, buy/sell mechanics
tests/test_token.py        7 tests   Token lifecycle, graduation, death
tests/test_agent.py        9 tests   Wallet, holdings, action tracking
tests/test_simulator.py    6 tests   Trade execution, market state
tests/test_events.py       4 tests   Random event generation and effects
tests/test_decision.py     9 tests   Prompt building, action parsing
tests/test_experiment.py   4 tests   AutoResearch hypothesis tracking
tests/test_fitness.py      3 tests   Fitness scoring, uniqueness
tests/test_operators.py    5 tests   Selection, crossover, mutation
tests/test_evolution.py    3 tests   Population management, generation flow
tests/test_narrator.py     3 tests   AI commentary generation
```

---

## Quick Start

### Backend

```bash
cd backend
pip install -e ".[dev]"

# Option A — OpenAI
export OPENAI_API_KEY=sk-...

# Option B — Zhipu (GLM, OpenAI-compatible)
export OPENAI_BASE_URL="https://open.bigmodel.cn/api/paas/v4"
export OPENAI_API_KEY=your_zhipu_key

python main.py
# Server running at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:3000
```

Open http://localhost:3000 and click **"Start Evolution"** to begin.

### Run Tests

```bash
cd backend && python -m pytest tests/ -v
# 66 passed in 0.04s
```

---

## Feature Highlights

### 🧬 Genome Lab — Distill any BSC wallet into a trading personality
A dedicated page that (1) showcases 6 famous Chinese meme traders (**0xSun, 王小二, D哥, 枯坐, 奶牛, 阿峰**) as pre-distilled genomes, and (2) lets you paste any BSC wallet address and watch the AI distill its on-chain trading history into a 25-dimension genome you can save, name, and use for market analysis.

### 🔴 Live Analysis — Let your champion trade live on Four.meme
One-click drop the winning genome (or any KOL) into a Bloomberg-style terminal that pulls **real tokens from the Four.meme public API** (Hot / New / Volume / Near-Grad / Market Cap / Recent), asks the LLM to score each one from that personality's perspective, and surfaces BUY / WAIT / SELL signals with confidence and reasoning. Optional `Execute Trade` button wired to the Four.meme trading endpoint (no-op if no wallet configured).

### 🏆 Evolution Results — Export the winner
When the experiment concludes, the champion's genome can be exported as:
- **Raw JSON** — the 25 parameters for programmatic use
- **Trading Skill (`.md`)** — a ready-to-use LLM system prompt describing the agent's personality, entry/exit rules, creation preferences, and provenance in natural language

Both formats are designed to drop directly into Four.meme's Agentic Mode.

---

## Four.meme Integration

Darwin.meme is purpose-built for the Four.meme ecosystem:

| Feature | Implementation |
|---------|---------------|
| **Bonding Curve** | Exact replication of Four.meme's pricing formula |
| **Graduation** | Tokens "graduate" at 24 unit threshold (= 24 BNB) |
| **Live Market Data** | Direct `/meme-api/v1/public/token/search` — no middleman, no API key |
| **Agentic Mode** | Evolved strategies exportable as JSON + trading skill markdown |
| **Trade Execution** | `/api/trade` endpoint that wraps Four.meme's trade API |
| **Wallet Distillation** | BSCScan + LLM pipeline that reverse-engineers a genome from transaction history |
| **Smart Contract** | Targets `0x5c952063c7fc8610ffdb798152d69f0b9550762b` |

### Strategy Export

The ultimate output: a JSON genome that encodes an evolved trading personality, ready for deployment on Four.meme's Agentic Mode.

```json
{
  "risk_appetite": 0.85,
  "contrarian": 0.88,
  "creation_frequency": 0.12,
  "experiment_rate": 0.70,
  "follow_leader": 0.15,
  "...": "25 evolved parameters"
}
```

---

## Why Darwin.meme Wins

| Judging Criteria | Our Strength |
|-----------------|-------------|
| **Innovation (30%)** | First-ever: evolutionary computation + LLM personality + meme economy. Three-domain crossover never attempted before. |
| **Technical (30%)** | 66 tests, clean architecture, real-time WebSocket, D3 visualizations, multi-agent LLM orchestration |
| **Practical Value (20%)** | Exportable strategies for real Four.meme deployment. Strategy discovery engine with actual utility. |
| **Presentation (20%)** | Live evolution demo with AI commentary. Visual impact: watch strategies emerge in real-time. |
| **Community (30%)** | It's AI Hunger Games for meme tokens. Entertaining, shareable, spectator-friendly. |

---

## Project Structure

```
darwin-meme/
├── backend/
│   ├── agent/           # Genome, Agent, LLM Decision, AutoResearch
│   ├── market/          # BondingCurve, Token, Simulator, Events
│   ├── evolution/       # Fitness, Operators, Engine
│   ├── commentator/     # AI Narrator
│   ├── integrations/    # Four.meme API client
│   ├── data/            # SQLite Store
│   ├── tests/           # 66 unit tests
│   ├── config.py        # All tunable parameters
│   └── main.py          # FastAPI + WebSocket server + /api/analyze, /api/trade, /api/distill-wallet
├── frontend/
│   ├── app/             # Next.js pages (landing + dashboard + lab + terminal)
│   ├── components/
│   │   ├── landing/     # 3D Three.js hero
│   │   ├── market/      # Token cards + trade feed
│   │   ├── leaderboard/ # Agent ranking + radar chart
│   │   ├── evolution/   # Fitness chart, strategy scatter, gene drift
│   │   ├── commentator/ # AI commentary feed
│   │   ├── game/        # Terminal view (Bloomberg-style)
│   │   ├── genome-lab/  # KOL genomes + wallet distiller
│   │   ├── results/     # Evolution results + Live Analysis
│   │   └── shared/      # Controls bar + reusable UI
│   ├── hooks/           # useSimulation (WebSocket state)
│   └── lib/             # Types, socket client
└── docs/
    └── superpowers/     # Design spec + implementation plan
```

---

## License

MIT

---

<p align="center">
  <b>Darwin.meme</b> — Let evolution discover what humans can't design.<br/>
  Built for <a href="https://dorahacks.io/hackathon/fourmemeaisprint">Four.meme AI Sprint Hackathon</a> | $50,000 Prize Pool
</p>
