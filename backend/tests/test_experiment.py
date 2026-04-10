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
