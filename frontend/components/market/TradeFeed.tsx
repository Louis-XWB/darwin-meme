import type { TradeData } from "@/lib/types";

const typeColors: Record<string, string> = {
  buy: "text-emerald-400",
  sell: "text-red-400",
  create: "text-blue-400",
};

export function TradeFeed({ trades }: { trades: TradeData[] }) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Recent Trades
      </h3>
      {trades.length === 0 && (
        <p className="text-xs text-gray-600">No trades yet</p>
      )}
      {trades.slice(-15).reverse().map((trade, i) => (
        <div key={i} className="flex items-center gap-2 text-xs font-mono">
          <span className={typeColors[trade.type] || "text-gray-400"}>
            {trade.type.toUpperCase()}
          </span>
          <span className="text-gray-500">{trade.agent_name}</span>
          {trade.token_name && <span className="text-gray-300">{trade.token_name}</span>}
          {trade.amount > 0 && (
            <span className="text-gray-600">{trade.amount.toLocaleString()}</span>
          )}
          {trade.cost > 0 && (
            <span className="text-yellow-400/70">{trade.cost.toFixed(4)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
