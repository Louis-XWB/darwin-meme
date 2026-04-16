"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AgentData } from "@/lib/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface LiveAnalysisProps {
  agent: AgentData;
  totalGenerations: number;
  onClose: () => void;
}

interface TokenAnalysis {
  token: string;
  signal: string;
  confidence: number;
  reasoning: string;
  position_pct?: number;
}

interface MarketToken {
  name: string;
  symbol: string;
  price: number;
  volume_24h: number;
  holders: number;
  progress: number;
  trend: string;
  increase?: number;
  cap?: number;
  address?: string;
}

interface AnalysisResult {
  tokens: MarketToken[];
  result: {
    analysis: TokenAnalysis[];
    overall_strategy: string;
  };
  agent_name: string;
}

const SIGNAL_STYLES: Record<
  string,
  { bg: string; text: string; border: string; label: string; icon: string }
> = {
  BUY: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/40", label: "BUY", icon: "✅" },
  SELL: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/40", label: "SELL", icon: "🔴" },
  WAIT: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/40", label: "WAIT", icon: "⚠️" },
  SKIP: { bg: "bg-gray-500/15", text: "text-gray-400", border: "border-gray-500/40", label: "SKIP", icon: "❌" },
};

const STRATEGY_MAP: Record<string, { label: string; color: string }> = {
  risk_appetite: { label: "Aggressive", color: "#ef4444" },
  follow_leader: { label: "Follower", color: "#3b82f6" },
  creation_frequency: { label: "Creator", color: "#22c55e" },
  contrarian: { label: "Contrarian", color: "#a855f7" },
  experiment_rate: { label: "Experimenter", color: "#eab308" },
};

function getDominantStrategy(genome: Record<string, unknown>): { label: string; color: string } {
  const keys = Object.keys(STRATEGY_MAP);
  let best = keys[0];
  let bestVal = -1;
  for (const key of keys) {
    const val = (genome[key] as number) ?? 0;
    if (val > bestVal) { bestVal = val; best = key; }
  }
  return STRATEGY_MAP[best];
}

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toExponential(2)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(2)}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

interface TradeResult {
  status: string;
  action?: string;
  token_name?: string;
  token_address?: string;
  amount_bnb?: number;
  agent_name?: string;
  reasoning?: string;
  timestamp?: string;
  message?: string;
  bscscan_url?: string;
}

export function LiveAnalysis({ agent, totalGenerations, onClose }: LiveAnalysisProps) {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [sortType, setSortType] = useState("HOT");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);
  const [tradeAmount, setTradeAmount] = useState("0.001");
  const [tradeHistory, setTradeHistory] = useState<TradeResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const strategy = getDominantStrategy(agent.genome as unknown as Record<string, unknown>);
  const roi = ((agent.balance - 100) / 100 * 100).toFixed(1);

  const SORT_OPTIONS = [
    { value: "HOT", label: "Hot" },
    { value: "NEW", label: "New" },
    { value: "VOL", label: "Volume" },
    { value: "PROGRESS", label: "Near Grad" },
    { value: "CAP", label: "Market Cap" },
    { value: "LAST", label: "Recent" },
  ];

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genome: agent.genome, agent_name: agent.name, sort_type: sortType }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: AnalysisResult = await res.json();
      setData(result);
      setLastUpdate(new Date());
      setCountdown(30);
      // Auto select first token
      if (result.tokens.length > 0 && !selectedToken) {
        setSelectedToken(result.tokens[0].name);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [agent, selectedToken, sortType]);

  useEffect(() => { fetchAnalysis(); }, [sortType]);
  useEffect(() => {
    timerRef.current = setInterval(fetchAnalysis, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAnalysis]);
  useEffect(() => {
    countdownRef.current = setInterval(() => setCountdown((p) => p <= 1 ? 30 : p - 1), 1_000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const handleExecuteTrade = async () => {
    if (!selectedTokenData || !selectedAnalysis) return;
    setTradeLoading(true);
    setTradeResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buy",
          token_address: selectedTokenData.address || "",
          token_name: selectedTokenData.name,
          amount_bnb: parseFloat(tradeAmount),
          agent_name: agent.name,
          reasoning: selectedAnalysis.reasoning,
        }),
      });
      const result: TradeResult = await res.json();
      setTradeResult(result);
      setTradeHistory((prev) => [result, ...prev].slice(0, 10));
    } catch (e) {
      const errResult: TradeResult = { status: "error", message: e instanceof Error ? e.message : "Failed" };
      setTradeResult(errResult);
    } finally {
      setTradeLoading(false);
    }
  };

  const selectedAnalysis = data?.result.analysis?.find(
    (a) => a.token === selectedToken || a.token === data?.tokens.find((t) => t.name === selectedToken)?.symbol
  );
  const selectedTokenData = data?.tokens.find((t) => t.name === selectedToken);
  const topPick = data?.result.analysis?.filter((a) => a.signal === "BUY").sort((a, b) => b.confidence - a.confidence)[0];

  return (
    <div className="fixed inset-0 z-[70] bg-[#050810]">
      {/* Top bar */}
      <div className="h-14 border-b border-red-500/20 bg-[#080c14] flex items-center px-6 gap-4">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: "0 0 8px rgba(239,68,68,0.8)" }} />
        <span className="text-red-400 font-mono text-sm font-bold tracking-wider">LIVE ANALYSIS</span>
        <span className="text-gray-600 font-mono text-xs">|</span>
        <span className="text-white font-mono text-sm font-bold">{agent.name}</span>
        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold" style={{ color: strategy.color, background: `${strategy.color}15`, border: `1px solid ${strategy.color}40` }}>
          {strategy.label}
        </span>
        <span className="text-gray-600 font-mono text-xs">ROI: <span className={parseFloat(roi) >= 0 ? "text-emerald-400" : "text-red-400"}>{roi}%</span></span>
        <span className="text-gray-700 font-mono text-xs">| Evolved through {totalGenerations} gen</span>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-gray-600 font-mono text-xs">
            {lastUpdate ? lastUpdate.toLocaleTimeString() : "--:--"} | Refresh in {countdown}s
          </span>
          <button
            onClick={fetchAnalysis}
            disabled={loading}
            className="px-3 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-xs font-bold hover:bg-red-500/20 disabled:opacity-40"
          >
            {loading ? "Scanning..." : "Refresh"}
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-white font-mono text-lg transition-colors">✕</button>
        </div>
      </div>

      {/* Main content: left tokens + right analysis */}
      <div className="flex h-[calc(100vh-56px)]">

        {/* LEFT: Token list */}
        <div className="w-[420px] border-r border-gray-800/50 overflow-y-auto bg-[#060a12]">
          <div className="px-4 py-3 border-b border-gray-800/50">
            <div className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-2">Four.meme Live Tokens</div>
            <div className="flex flex-wrap gap-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortType(opt.value); setSelectedToken(null); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                    sortType === opt.value
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading && !data && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            </div>
          )}

          {data?.tokens.map((token) => {
            const analysis = data.result.analysis?.find(
              (a) => a.token === token.name || a.token === token.symbol
            );
            const signal = analysis?.signal?.toUpperCase() || "SKIP";
            const style = SIGNAL_STYLES[signal] || SIGNAL_STYLES.SKIP;
            const isSelected = selectedToken === token.name;

            return (
              <div
                key={token.symbol}
                onClick={() => setSelectedToken(token.name)}
                className={`px-4 py-3 border-b border-gray-800/30 cursor-pointer transition-all ${
                  isSelected ? "bg-white/[0.04] border-l-2 border-l-red-500" : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={token.trend === "up" ? "text-emerald-400" : token.trend === "down" ? "text-red-400" : "text-gray-500"}>
                      {token.trend === "up" ? "▲" : token.trend === "down" ? "▼" : "—"}
                    </span>
                    <span className="text-white font-mono text-sm font-bold">{token.name}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${style.bg} ${style.text} ${style.border} border`}>
                    {style.icon} {style.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-gray-300">{formatPrice(token.price)}</span>
                  <span className="text-gray-500">Vol: {formatVolume(token.volume_24h)}</span>
                  <span className="text-gray-500">{token.holders} holders</span>
                </div>

                {/* Progress bar */}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, token.progress)}%`,
                        background: token.progress >= 80 ? "#22c55e" : token.progress >= 50 ? "#eab308" : "#6b7280",
                      }}
                    />
                  </div>
                  <span className="text-gray-500 font-mono text-[10px] w-10 text-right">{typeof token.progress === 'number' ? token.progress.toFixed(1) : token.progress}%</span>
                </div>

                {/* Confidence */}
                {analysis && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-gray-600 font-mono text-[10px]">Confidence:</span>
                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${analysis.confidence}%`,
                          background: analysis.confidence >= 70 ? "#22c55e" : analysis.confidence >= 40 ? "#eab308" : "#ef4444",
                        }}
                      />
                    </div>
                    <span className="text-gray-500 font-mono text-[10px] w-8 text-right">{analysis.confidence}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Analysis detail */}
        <div className="flex-1 overflow-y-auto bg-[#050810] p-6">
          {!data && !loading && (
            <div className="flex items-center justify-center h-full text-gray-600 font-mono text-sm">
              Click Refresh to scan the market
            </div>
          )}

          {data && !selectedToken && (
            <div className="flex items-center justify-center h-full text-gray-600 font-mono text-sm">
              Select a token from the left to see analysis
            </div>
          )}

          {data && selectedToken && (
            <div className="space-y-6">
              {/* Token header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-white font-mono text-2xl font-bold">{selectedTokenData?.name}</h2>
                  <span className="text-gray-500 font-mono text-sm">{selectedTokenData?.symbol}</span>
                  {selectedAnalysis && (
                    <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${SIGNAL_STYLES[selectedAnalysis.signal?.toUpperCase() || "SKIP"]?.bg} ${SIGNAL_STYLES[selectedAnalysis.signal?.toUpperCase() || "SKIP"]?.text} ${SIGNAL_STYLES[selectedAnalysis.signal?.toUpperCase() || "SKIP"]?.border} border`}>
                      {SIGNAL_STYLES[selectedAnalysis.signal?.toUpperCase() || "SKIP"]?.icon} {selectedAnalysis.signal?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Token stats grid */}
              {selectedTokenData && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">
                    <div className="text-gray-500 font-mono text-[10px] uppercase mb-1">Price</div>
                    <div className="text-white font-mono text-lg font-bold">{formatPrice(selectedTokenData.price)}</div>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">
                    <div className="text-gray-500 font-mono text-[10px] uppercase mb-1">Volume 24H</div>
                    <div className="text-white font-mono text-lg font-bold">{formatVolume(selectedTokenData.volume_24h)}</div>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">
                    <div className="text-gray-500 font-mono text-[10px] uppercase mb-1">Holders</div>
                    <div className="text-white font-mono text-lg font-bold">{selectedTokenData.holders}</div>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">
                    <div className="text-gray-500 font-mono text-[10px] uppercase mb-1">Bonding Progress</div>
                    <div className="text-white font-mono text-lg font-bold">{typeof selectedTokenData.progress === 'number' ? selectedTokenData.progress.toFixed(1) : selectedTokenData.progress}%</div>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {selectedAnalysis && (
                <>
                  <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-400 font-mono text-xs uppercase tracking-wider font-bold">AI Reasoning</span>
                      <span className="text-gray-600 font-mono text-xs">by {agent.name} ({strategy.label})</span>
                    </div>
                    <p className="text-gray-200 font-mono text-sm leading-relaxed">
                      {selectedAnalysis.reasoning}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                      <div className="text-gray-500 font-mono text-[10px] uppercase mb-2">Confidence Level</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${selectedAnalysis.confidence}%`,
                              background: selectedAnalysis.confidence >= 70 ? "linear-gradient(90deg, #059669, #22c55e)" : selectedAnalysis.confidence >= 40 ? "linear-gradient(90deg, #d97706, #eab308)" : "linear-gradient(90deg, #dc2626, #ef4444)",
                            }}
                          />
                        </div>
                        <span className="text-white font-mono text-xl font-bold">{selectedAnalysis.confidence}%</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                      <div className="text-gray-500 font-mono text-[10px] uppercase mb-2">Recommended Position</div>
                      <div className="text-white font-mono text-xl font-bold">
                        {selectedAnalysis.position_pct != null ? `${(selectedAnalysis.position_pct * 100).toFixed(0)}% of balance` : "N/A"}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Execute Trade section - only show for BUY signals */}
              {selectedAnalysis && selectedAnalysis.signal?.toUpperCase() === "BUY" && selectedTokenData && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-emerald-400 font-mono text-xs uppercase tracking-wider font-bold mb-1">Execute Trade</div>
                      <div className="text-gray-500 font-mono text-[10px]">
                        {agent.name} recommends buying {selectedTokenData.name}
                      </div>
                    </div>
                    <button
                      onClick={handleExecuteTrade}
                      disabled={tradeLoading}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {tradeLoading ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>🟢 Execute BUY</>
                      )}
                    </button>
                  </div>

                  {/* Trade amount input */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-gray-500 font-mono text-xs">Amount:</span>
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      className="w-32 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                      step="0.001"
                      min="0.001"
                    />
                    <span className="text-gray-500 font-mono text-xs">BNB</span>
                  </div>

                  {/* Trade result */}
                  {tradeResult && (
                    <div className={`rounded-lg p-3 font-mono text-xs ${
                      tradeResult.status === "no_wallet" ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400" :
                      tradeResult.status === "error" ? "bg-red-500/10 border border-red-500/30 text-red-400" :
                      "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    }`}>
                      <div className="font-bold mb-1">
                        {tradeResult.status === "no_wallet" ? "⚠️ Wallet Not Configured" :
                         tradeResult.status === "error" ? "❌ Trade Failed" :
                         tradeResult.status === "attempted" ? "✅ Trade Submitted" :
                         "📋 Trade Pending"}
                      </div>
                      <div className="text-gray-400">{tradeResult.message}</div>
                      {tradeResult.bscscan_url && (
                        <a href={tradeResult.bscscan_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline mt-1 block">
                          View on BscScan →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Top pick highlight */}
              {topPick && topPick.token !== selectedToken && (
                <div className="rounded-xl border border-emerald-500/25 p-4" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-500 font-mono text-xs font-bold uppercase">Top Pick</span>
                    <span className="text-emerald-400 font-mono text-sm font-bold">{topPick.token}</span>
                    <span className="text-emerald-600 font-mono text-xs">{topPick.confidence}% confidence</span>
                  </div>
                  <p className="text-gray-400 font-mono text-xs italic">{topPick.reasoning}</p>
                </div>
              )}

              {/* Strategy summary */}
              {data.result.overall_strategy && !data.result.overall_strategy.startsWith("{") && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-4">
                  <div className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-2">Overall Strategy</div>
                  <p className="text-gray-300 font-mono text-xs leading-relaxed italic">
                    &ldquo;{data.result.overall_strategy}&rdquo;
                  </p>
                </div>
              )}

              {/* Champion genome key traits */}
              <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-4">
                <div className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-3">Champion Genome Traits</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "risk_appetite", label: "Risk" },
                    { key: "contrarian", label: "Contrarian" },
                    { key: "follow_leader", label: "Follow" },
                    { key: "graduation_bias", label: "Grad Bias" },
                    { key: "entry_threshold", label: "Entry" },
                    { key: "experiment_rate", label: "Experiment" },
                  ].map(({ key, label }) => {
                    const val = (agent.genome as unknown as Record<string, number>)[key] ?? 0;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-gray-600 font-mono text-[10px] w-16 shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${val * 100}%` }} />
                        </div>
                        <span className="text-gray-500 font-mono text-[10px] w-8 text-right">{(val * 100).toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trade history */}
              {tradeHistory.length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-4">
                  <div className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-3">Trade History</div>
                  <div className="space-y-2">
                    {tradeHistory.map((trade, idx) => (
                      <div key={idx} className={`rounded-lg p-2 font-mono text-[10px] flex items-center justify-between ${
                        trade.status === "no_wallet" ? "bg-yellow-500/5 border border-yellow-500/20" :
                        trade.status === "error" ? "bg-red-500/5 border border-red-500/20" :
                        "bg-emerald-500/5 border border-emerald-500/20"
                      }`}>
                        <div>
                          <span className={`font-bold mr-2 ${
                            trade.status === "no_wallet" ? "text-yellow-400" :
                            trade.status === "error" ? "text-red-400" :
                            "text-emerald-400"
                          }`}>
                            {trade.status === "no_wallet" ? "⚠️" : trade.status === "error" ? "❌" : "✅"}
                            {" "}{trade.action?.toUpperCase()} {trade.token_name}
                          </span>
                          <span className="text-gray-600">{trade.amount_bnb} BNB</span>
                        </div>
                        <span className="text-gray-700">
                          {trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString() : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-red-400 font-mono text-xs">Error: {error}</p>
              <button onClick={fetchAnalysis} className="mt-2 text-red-400 font-mono text-xs underline">Retry</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
