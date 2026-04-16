"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AgentData } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
  address?: string;
  increase?: number;
  cap?: number;
}

interface TradeResult {
  status: string;
  message?: string;
  token_name?: string;
  amount_bnb?: number;
  timestamp?: string;
  bscscan_url?: string;
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
  BUY:  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/40", label: "BUY",  icon: "✅" },
  SELL: { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/40",     label: "SELL", icon: "🔴" },
  WAIT: { bg: "bg-yellow-500/15",  text: "text-yellow-400",  border: "border-yellow-500/40",  label: "WAIT", icon: "⏳" },
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
  let best = keys[0], bestVal = -1;
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

// Fuzzy match analysis token name to our token
function findAnalysis(analyses: TokenAnalysis[], token: MarketToken): TokenAnalysis | undefined {
  return analyses.find((a) => {
    const aName = a.token.toLowerCase();
    const tName = token.name.toLowerCase();
    const tSymbol = token.symbol.toLowerCase();
    return aName.includes(tName) || tName.includes(aName) || aName.includes(tSymbol) || tSymbol.includes(aName);
  });
}

export function LiveAnalysis({ agent, totalGenerations, onClose }: LiveAnalysisProps) {
  // Token list state (loads fast)
  const [tokens, setTokens] = useState<MarketToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);

  // AI analysis state (loads slow)
  const [analyses, setAnalyses] = useState<TokenAnalysis[]>([]);
  const [overallStrategy, setOverallStrategy] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [sortType, setSortType] = useState("HOT");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);

  // Trade state
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);
  const [tradeAmount, setTradeAmount] = useState("0.001");
  const [tradeHistory, setTradeHistory] = useState<TradeResult[]>([]);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Step 1: Fetch tokens (fast)
  const fetchTokens = useCallback(async (sort: string) => {
    setTokensLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_type: sort }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setTokens(data.tokens || []);
      if (data.tokens?.length > 0 && !selectedToken) {
        setSelectedToken(data.tokens[0].name);
      }
    } catch {}
    setTokensLoading(false);
  }, [selectedToken]);

  // Step 2: Fetch AI analysis (slow)
  const fetchAnalysis = useCallback(async (sort: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genome: agent.genome, agent_name: agent.name, sort_type: sort }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setAnalyses(data.result?.analysis || []);
      const strat = data.result?.overall_strategy || "";
      setOverallStrategy(strat.startsWith("{") ? "" : strat);
      setLastUpdate(new Date());
      setCountdown(30);
    } catch {}
    setAnalyzing(false);
  }, [agent]);

  // Load on mount and sort change
  useEffect(() => {
    setSelectedToken(null);
    setAnalyses([]);
    fetchTokens(sortType);
    fetchAnalysis(sortType);
  }, [sortType]);

  // Auto-refresh
  useEffect(() => {
    refreshRef.current = setInterval(() => {
      fetchTokens(sortType);
      fetchAnalysis(sortType);
    }, 30_000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [sortType, fetchTokens, fetchAnalysis]);

  // Countdown
  useEffect(() => {
    countdownRef.current = setInterval(() => setCountdown((p) => p <= 1 ? 30 : p - 1), 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const selectedTokenData = tokens.find((t) => t.name === selectedToken);
  const selectedAnalysis = selectedTokenData ? findAnalysis(analyses, selectedTokenData) : undefined;

  const handleExecuteTrade = async () => {
    if (!selectedTokenData) return;
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
          reasoning: selectedAnalysis?.reasoning || "",
        }),
      });
      const result = await res.json();
      setTradeResult(result);
      setTradeHistory((h) => [result, ...h].slice(0, 10));
    } catch (e) {
      const result = { status: "error", message: e instanceof Error ? e.message : "Failed" };
      setTradeResult(result);
    }
    setTradeLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#050810]">
      {/* Top bar */}
      <div className="h-14 border-b border-red-500/20 bg-[#080c14] flex items-center px-6 gap-4">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: "0 0 8px rgba(239,68,68,0.8)" }} />
        <span className="text-red-400 font-mono text-sm font-bold tracking-wider">LIVE ANALYSIS</span>
        <span className="text-gray-600">|</span>
        <span className="text-white font-mono text-sm font-bold">{agent.name}</span>
        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold" style={{ color: strategy.color, background: `${strategy.color}15`, border: `1px solid ${strategy.color}40` }}>
          {strategy.label}
        </span>
        <span className="text-gray-600 font-mono text-xs">ROI: <span className={parseFloat(roi) >= 0 ? "text-emerald-400" : "text-red-400"}>{roi}%</span></span>
        <span className="text-gray-700 font-mono text-xs">| {totalGenerations} gen evolved</span>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-gray-600 font-mono text-xs">
            {lastUpdate ? lastUpdate.toLocaleTimeString() : "--:--"} | {countdown}s
          </span>
          <button
            onClick={() => { fetchTokens(sortType); fetchAnalysis(sortType); }}
            disabled={analyzing}
            className="px-3 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-xs font-bold hover:bg-red-500/20 disabled:opacity-40"
          >
            {analyzing ? "Analyzing..." : "Refresh"}
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-white font-mono text-lg">✕</button>
        </div>
      </div>

      {/* Main split */}
      <div className="flex h-[calc(100vh-56px)]">

        {/* LEFT: Token list */}
        <div className="w-[400px] border-r border-gray-800/50 overflow-y-auto bg-[#060a12]">
          {/* Sort filters */}
          <div className="px-4 py-3 border-b border-gray-800/50">
            <div className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-2">Four.meme Tokens</div>
            <div className="flex flex-wrap gap-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortType(opt.value)}
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

          {/* Loading */}
          {tokensLoading && tokens.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Token items */}
          {tokens.map((token) => {
            const analysis = findAnalysis(analyses, token);
            const signal = analysis?.signal?.toUpperCase() || "";
            const style = SIGNAL_STYLES[signal];
            const isSelected = selectedToken === token.name;

            return (
              <div
                key={token.name}
                onClick={() => setSelectedToken(token.name)}
                className={`px-4 py-3 border-b border-gray-800/30 cursor-pointer transition-all ${
                  isSelected ? "bg-white/[0.04] border-l-2 border-l-red-500" : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={token.trend === "up" ? "text-emerald-400 text-xs" : token.trend === "down" ? "text-red-400 text-xs" : "text-gray-500 text-xs"}>
                      {token.trend === "up" ? "▲" : token.trend === "down" ? "▼" : "—"}
                    </span>
                    <span className="text-white font-mono text-sm font-bold truncate max-w-[200px]">{token.name}</span>
                  </div>
                  {style ? (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${style.bg} ${style.text} ${style.border} border`}>
                      {style.icon} {style.label}
                    </span>
                  ) : analyzing ? (
                    <span className="text-gray-600 text-[10px] font-mono animate-pulse">analyzing...</span>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-gray-300">{formatPrice(token.price)}</span>
                  <span className="text-gray-500">Vol: {formatVolume(token.volume_24h)}</span>
                  <span className="text-gray-500">{token.holders}h</span>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min(100, typeof token.progress === 'number' ? token.progress : parseFloat(String(token.progress)) || 0)}%`,
                      background: (typeof token.progress === 'number' ? token.progress : 0) >= 80 ? "#22c55e" : (typeof token.progress === 'number' ? token.progress : 0) >= 50 ? "#eab308" : "#6b7280",
                    }} />
                  </div>
                  <span className="text-gray-500 font-mono text-[10px] w-10 text-right">
                    {typeof token.progress === 'number' ? token.progress.toFixed(1) : token.progress}%
                  </span>
                </div>

                {analysis && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-gray-600 font-mono text-[10px]">Conf:</span>
                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${analysis.confidence}%`,
                        background: analysis.confidence >= 70 ? "#22c55e" : analysis.confidence >= 40 ? "#eab308" : "#ef4444",
                      }} />
                    </div>
                    <span className="text-gray-500 font-mono text-[10px] w-7 text-right">{analysis.confidence}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Detail + Trade */}
        <div className="flex-1 overflow-y-auto bg-[#050810] p-6">
          {!selectedToken && (
            <div className="flex items-center justify-center h-full text-gray-600 font-mono text-sm">
              Select a token to see analysis
            </div>
          )}

          {selectedToken && selectedTokenData && (
            <div className="space-y-5">
              {/* Token header */}
              <div className="flex items-center gap-3">
                <h2 className="text-white font-mono text-2xl font-bold">{selectedTokenData.name}</h2>
                <span className="text-gray-500 font-mono text-sm">{selectedTokenData.symbol}</span>
                {selectedAnalysis && (
                  <span className={`px-2 py-1 rounded text-xs font-mono font-bold border ${
                    SIGNAL_STYLES[selectedAnalysis.signal?.toUpperCase() || "WAIT"]?.bg || ""
                  } ${SIGNAL_STYLES[selectedAnalysis.signal?.toUpperCase() || "WAIT"]?.text || ""} ${
                    SIGNAL_STYLES[selectedAnalysis.signal?.toUpperCase() || "WAIT"]?.border || ""
                  }`}>
                    {SIGNAL_STYLES[selectedAnalysis.signal?.toUpperCase() || "WAIT"]?.icon} {selectedAnalysis.signal?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Price", value: formatPrice(selectedTokenData.price) },
                  { label: "Volume 24H", value: formatVolume(selectedTokenData.volume_24h) },
                  { label: "Holders", value: String(selectedTokenData.holders) },
                  { label: "Bonding", value: `${typeof selectedTokenData.progress === 'number' ? selectedTokenData.progress.toFixed(1) : selectedTokenData.progress}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">
                    <div className="text-gray-500 font-mono text-[10px] uppercase mb-1">{label}</div>
                    <div className="text-white font-mono text-lg font-bold">{value}</div>
                  </div>
                ))}
              </div>

              {/* AI Analysis */}
              {analyzing && !selectedAnalysis && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-5 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-gray-400 font-mono text-sm">{agent.name} is analyzing this token...</span>
                </div>
              )}

              {selectedAnalysis && (
                <>
                  <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-400 font-mono text-xs uppercase tracking-wider font-bold">AI Reasoning</span>
                      <span className="text-gray-600 font-mono text-xs">by {agent.name}</span>
                    </div>
                    <p className="text-gray-200 font-mono text-sm leading-relaxed">{selectedAnalysis.reasoning}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                      <div className="text-gray-500 font-mono text-[10px] uppercase mb-2">Confidence</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${selectedAnalysis.confidence}%`,
                            background: selectedAnalysis.confidence >= 70 ? "linear-gradient(90deg, #059669, #22c55e)" : selectedAnalysis.confidence >= 40 ? "linear-gradient(90deg, #d97706, #eab308)" : "linear-gradient(90deg, #dc2626, #ef4444)",
                          }} />
                        </div>
                        <span className="text-white font-mono text-xl font-bold">{selectedAnalysis.confidence}%</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                      <div className="text-gray-500 font-mono text-[10px] uppercase mb-2">Position Size</div>
                      <div className="text-white font-mono text-xl font-bold">
                        {selectedAnalysis.position_pct != null ? `${(selectedAnalysis.position_pct * 100).toFixed(0)}%` : "—"}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Execute Trade - always show */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-emerald-400 font-mono text-xs uppercase tracking-wider font-bold mb-1">Execute Trade</div>
                    <div className="text-gray-500 font-mono text-[10px]">
                      Trade {selectedTokenData.name} on Four.meme (BNB Chain)
                    </div>
                  </div>
                </div>

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
                  <button
                    onClick={handleExecuteTrade}
                    disabled={tradeLoading}
                    className="ml-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {tradeLoading ? (
                      <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Executing...</>
                    ) : (
                      <>🟢 Execute BUY</>
                    )}
                  </button>
                </div>

                {tradeResult && (
                  <div className={`rounded-lg p-3 font-mono text-xs ${
                    tradeResult.status === "no_wallet" ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400" :
                    tradeResult.status === "error" ? "bg-red-500/10 border border-red-500/30 text-red-400" :
                    "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  }`}>
                    <div className="font-bold mb-1">
                      {tradeResult.status === "no_wallet" ? "⚠️ Wallet Not Configured" :
                       tradeResult.status === "error" ? "❌ Trade Failed" :
                       "✅ Trade Submitted"}
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

              {/* Strategy summary */}
              {overallStrategy && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-4">
                  <div className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-2">Overall Strategy</div>
                  <p className="text-gray-300 font-mono text-xs leading-relaxed italic">&ldquo;{overallStrategy}&rdquo;</p>
                </div>
              )}

              {/* Genome traits */}
              <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-4">
                <div className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-3">Champion Genome</div>
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
                        <span className="text-gray-600 font-mono text-[10px] w-14 shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${val * 100}%` }} />
                        </div>
                        <span className="text-gray-500 font-mono text-[10px] w-7 text-right">{(val * 100).toFixed(0)}%</span>
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
                    {tradeHistory.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono">
                        <span>{t.status === "no_wallet" ? "⚠️" : t.status === "error" ? "❌" : "✅"}</span>
                        <span className="text-gray-400">{t.token_name}</span>
                        <span className="text-gray-600">{t.amount_bnb} BNB</span>
                        <span className="text-gray-700 ml-auto">{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
