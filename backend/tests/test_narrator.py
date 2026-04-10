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
