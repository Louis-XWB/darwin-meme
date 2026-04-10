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
    assert "a1" not in t.holders


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
