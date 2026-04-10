import type { TokenData } from "@/lib/types";

const stateColors: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/5",
  graduated: "border-yellow-500/30 bg-yellow-500/5",
  dead: "border-red-500/30 bg-red-500/5 opacity-50",
};

const stateBadge: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  graduated: "bg-yellow-500/20 text-yellow-400",
  dead: "bg-red-500/20 text-red-400",
};

export function TokenCard({ token }: { token: TokenData }) {
  return (
    <div className={`border rounded-lg p-3 ${stateColors[token.state] || ""}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm">{token.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${stateBadge[token.state] || ""}`}>
          {token.state}
        </span>
      </div>
      <div className="text-xs text-gray-400 mb-2">{token.theme}</div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">Price</span>
        <span className="font-mono text-emerald-400">{token.current_price.toExponential(2)}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-1">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(token.bonding_progress * 100).toFixed(1)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{(token.bonding_progress * 100).toFixed(1)}% to graduation</span>
        <span>{token.holder_count} holders</span>
      </div>
    </div>
  );
}
