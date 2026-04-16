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
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm text-gray-400 font-medium mb-1">Token Market</div>
            <div className="text-xs text-gray-600">Meme tokens created by AI agents will appear here</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["DOGGO", "MOONCAT", "PEPE2.0", "WOJAK"].map((name) => (
              <div key={name} className="border border-gray-800/50 rounded-lg p-3 opacity-30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-gray-500">{name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-600">preview</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                  <div className="bg-gray-700 h-1.5 rounded-full" style={{ width: `${(name.length * 13 + 10) % 60 + 10}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-gray-700 text-center">Start evolution to see live trading</div>
        </div>
      )}

      <TradeFeed trades={trades} />
    </div>
  );
}
