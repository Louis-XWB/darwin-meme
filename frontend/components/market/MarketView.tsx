import type { TokenData, TradeData, EventData } from "@/lib/types";
import { TokenCard } from "./TokenCard";
import { TradeFeed } from "./TradeFeed";

interface MarketViewProps {
  tokens: TokenData[];
  trades: TradeData[];
  events: EventData[];
}

export function MarketView({ tokens, trades, events }: MarketViewProps) {
  const activeTokens = tokens.filter((t) => t.state === "active");
  const graduatedTokens = tokens.filter((t) => t.state === "graduated");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
          Market
        </h2>
        <div className="flex gap-2 text-[10px]">
          <span className="text-emerald-400">{activeTokens.length} active</span>
          <span className="text-yellow-400">{graduatedTokens.length} graduated</span>
        </div>
      </div>

      {events.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {events.map((e, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300"
            >
              {e.type} {e.target_theme || ""}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {tokens.slice(0, 8).map((token) => (
          <TokenCard key={token.token_id} token={token} />
        ))}
      </div>

      {tokens.length === 0 && (
        <div className="text-center text-gray-600 py-8 text-sm">
          Waiting for agents to create tokens...
        </div>
      )}

      <TradeFeed trades={trades} />
    </div>
  );
}
