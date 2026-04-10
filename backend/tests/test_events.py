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
