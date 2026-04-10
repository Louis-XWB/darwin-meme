from __future__ import annotations


class BondingCurve:
    def __init__(self, k: float, n: float, total_supply: int):
        self.k = k
        self.n = n
        self.total_supply = total_supply

    def price(self, supply_sold: int) -> float:
        if supply_sold <= 0:
            return 0.0
        return self.k * (supply_sold / self.total_supply) ** self.n

    def buy_cost(self, supply_sold: int, amount: int) -> float:
        if supply_sold + amount > self.total_supply:
            raise ValueError("Cannot buy beyond total supply")
        return self._integral(supply_sold + amount) - self._integral(supply_sold)

    def sell_return(self, supply_sold: int, amount: int) -> float:
        if amount > supply_sold:
            raise ValueError("Cannot sell more than sold supply")
        return self._integral(supply_sold) - self._integral(supply_sold - amount)

    def _integral(self, x: int) -> float:
        return self.k / (self.total_supply ** self.n) * (x ** (self.n + 1)) / (self.n + 1)
