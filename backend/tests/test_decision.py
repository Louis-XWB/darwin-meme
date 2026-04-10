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
