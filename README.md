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
