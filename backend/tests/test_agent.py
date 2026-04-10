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
    assert a.net_worth({}) == 50.0
    a.add_holding("t1", 1000)
    assert a.net_worth({"t1": 0.01}) == 50.0 + 1000 * 0.01


def test_agent_to_dict():
    a = Agent(agent_id="a1", name="Alpha", genome=Genome.random(), balance=100.0)
    d = a.to_dict()
    assert d["agent_id"] == "a1"
    assert d["name"] == "Alpha"
    assert "genome" in d
