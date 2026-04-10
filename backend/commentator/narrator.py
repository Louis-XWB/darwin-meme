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
    return raw.strip().strip('"').strip()
