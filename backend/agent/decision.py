from __future__ import annotations

import json

from agent.agent import Action, ActionType

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

    notes = ""
    if agent.strategy_notes:
        notes = "\nYour learned notes:\n" + "\n".join(f"- {n}" for n in agent.strategy_notes[-5:])

    return f"""{agent.name} - Tick {tick} | Balance: {agent.balance:.4f} | Holdings: {holdings_str}
risk_appetite: {g.risk_appetite:.2f} | contrarian: {g.contrarian:.2f} | experiment_rate: {g.experiment_rate:.2f}

Active tokens:
{tokens_str}

Recent trades: {trades_str}
Recent events: {events_str}
{notes}
What is your action?"""


def parse_action_response(response: str) -> Action:
    try:
        text = response.strip()
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
