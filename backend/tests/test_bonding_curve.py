import pytest

from market.bonding_curve import BondingCurve


@pytest.fixture
def curve():
    return BondingCurve(k=1e-9, n=2.0, total_supply=1_000_000_000)


def test_price_at_zero_sold(curve):
    assert curve.price(0) == 0.0


def test_price_increases_with_supply(curve):
    p1 = curve.price(100_000_000)
    p2 = curve.price(500_000_000)
    assert p2 > p1


def test_buy_cost_positive(curve):
    cost = curve.buy_cost(supply_sold=0, amount=1_000_000)
    assert cost > 0.0


def test_sell_return_positive(curve):
    ret = curve.sell_return(supply_sold=100_000_000, amount=1_000_000)
    assert ret > 0.0


def test_buy_then_sell_loses_nothing_extra(curve):
    amount = 1_000_000
    cost = curve.buy_cost(supply_sold=0, amount=amount)
    ret = curve.sell_return(supply_sold=amount, amount=amount)
    assert abs(cost - ret) < 1e-12


def test_buy_cost_exceeds_supply_raises(curve):
    with pytest.raises(ValueError):
        curve.buy_cost(supply_sold=999_999_999, amount=1_000_000_000)
