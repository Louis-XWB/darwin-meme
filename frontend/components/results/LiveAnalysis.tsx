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
  { bg: string; text: string; border: string; label: string }
> = {
  BUY: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    label: "BUY",
  },
  SELL: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/40",
    label: "SELL",
  },
  WAIT: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    border: "border-yellow-500/40",
    label: "WAIT",
  },
  SKIP: {
    bg: "bg-gray-500/15",
    text: "text-gray-400",
    border: "border-gray-500/40",
    label: "SKIP",
  },
};

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toExponential(2)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up")
    return <span className="text-emerald-400 text-xs font-mono">▲</span>;
  if (trend === "down")
    return <span className="text-red-400 text-xs font-mono">▼</span>;
  return <span className="text-gray-500 text-xs font-mono">—</span>;
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const filled = Math.round(clamped / 10);
  const empty = 10 - filled;
  const color =
    clamped >= 80
      ? "text-emerald-400"
      : clamped >= 50
        ? "text-yellow-400"
        : "text-gray-500";
  return (
    <span className={`font-mono text-xs ${color}`}>
      {"█".repeat(filled)}
      {"░".repeat(empty)} {clamped}%
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 70
      ? "bg-emerald-500"
      : value >= 40
        ? "bg-yellow-500"
        : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-gray-400 font-mono text-xs">{value}%</span>
    </div>
  );
}

export function LiveAnalysis({
  agent,
  totalGenerations,
  onClose,
}: LiveAnalysisProps) {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genome: agent.genome,
          agent_name: agent.name,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: AnalysisResult = await res.json();
      setData(result);
      setLastUpdate(new Date());
      setCountdown(30);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch analysis");
    } finally {
      setLoading(false);
    }
  }, [agent]);

  // Fetch on mount
  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Auto-refresh every 30s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      fetchAnalysis();
    }, 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAnalysis]);

  // Countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1_000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Find the top pick (highest confidence BUY)
  const topPick = data?.result.analysis
    ?.filter((a) => a.signal === "BUY")
    .sort((a, b) => b.confidence - a.confidence)[0];

  // Build a map of token data by name for cross-referencing
  const tokenMap = new Map<string, MarketToken>();
  data?.tokens.forEach((t) => tokenMap.set(t.name, t));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 max-w-4xl w-full max-h-[92vh] overflow-y-auto rounded-2xl border"
        style={{
          borderColor: "rgba(239,68,68,0.3)",
          background: "rgba(5,8,12,0.98)",
          boxShadow:
            "0 0 80px rgba(239,68,68,0.08), 0 0 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 pt-5 pb-4"
          style={{
            background: "rgba(5,8,12,0.98)",
            borderBottom: "1px solid rgba(239,68,68,0.15)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  style={{ boxShadow: "0 0 8px rgba(239,68,68,0.8)" }}
                />
                <span className="text-red-400 font-mono text-xs tracking-widest uppercase font-bold">
                  Live Analysis
                </span>
                <span className="text-gray-600 font-mono text-xs">
                  Champion &ldquo;{agent.name}&rdquo;
                </span>
              </div>
              <h1
                className="text-white font-mono text-xl font-bold"
                style={{ textShadow: "0 0 20px rgba(239,68,68,0.3)" }}
              >
                FOUR.MEME MARKET SCAN
              </h1>
              <p className="text-gray-500 font-mono text-xs mt-1">
                Evolved through {totalGenerations} generation
                {totalGenerations !== 1 ? "s" : ""} | Scanning Four.meme market
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAnalysis}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-xs font-bold hover:bg-red-500/20 transition-colors disabled:opacity-40"
              >
                {loading ? "Scanning..." : "Refresh"}
              </button>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-300 font-mono text-xl leading-none transition-colors px-1"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Error state */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-4">
              <p className="text-red-400 font-mono text-xs">
                Analysis error: {error}
              </p>
              <button
                onClick={fetchAnalysis}
                className="mt-2 text-red-400 font-mono text-xs underline hover:text-red-300"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && !data && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-red-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-500 animate-spin" />
              </div>
              <p className="text-gray-500 font-mono text-xs animate-pulse">
                {agent.name} is analyzing the market...
              </p>
            </div>
          )}

          {/* Results */}
          {data && (
            <>
              {/* Token table */}
              <div className="overflow-x-auto mb-5">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-gray-600 font-mono text-xs uppercase tracking-wider py-2 px-2">
                        Token
                      </th>
                      <th className="text-right text-gray-600 font-mono text-xs uppercase tracking-wider py-2 px-2">
                        Price
                      </th>
                      <th className="text-right text-gray-600 font-mono text-xs uppercase tracking-wider py-2 px-2">
                        Vol 24H
                      </th>
                      <th className="text-center text-gray-600 font-mono text-xs uppercase tracking-wider py-2 px-2">
                        Progress
                      </th>
                      <th className="text-center text-gray-600 font-mono text-xs uppercase tracking-wider py-2 px-2">
                        Signal
                      </th>
                      <th className="text-center text-gray-600 font-mono text-xs uppercase tracking-wider py-2 px-2">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tokens.map((token) => {
                      const analysis = data.result.analysis?.find(
                        (a) =>
                          a.token === token.name || a.token === token.symbol
                      );
                      const signal = analysis?.signal?.toUpperCase() || "SKIP";
                      const style = SIGNAL_STYLES[signal] || SIGNAL_STYLES.SKIP;
                      const isExpanded = expandedToken === token.name;

                      return (
                        <tr
                          key={token.symbol}
                          className="border-b border-gray-800/50 hover:bg-white/[0.02] cursor-pointer transition-colors"
                          onClick={() =>
                            setExpandedToken(isExpanded ? null : token.name)
                          }
                        >
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <TrendIcon trend={token.trend} />
                              <div>
                                <div className="text-white font-mono text-sm font-bold">
                                  {token.name}
                                </div>
                                <div className="text-gray-600 font-mono text-xs">
                                  {token.symbol}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-2.5 px-2">
                            <span className="text-gray-300 font-mono text-xs">
                              {formatPrice(token.price)}
                            </span>
                          </td>
                          <td className="text-right py-2.5 px-2">
                            <span className="text-gray-400 font-mono text-xs">
                              {formatVolume(token.volume_24h)}
                            </span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <ProgressBar value={token.progress} />
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded border font-mono text-xs font-bold ${style.bg} ${style.text} ${style.border}`}
                            >
                              {style.label}
                            </span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            {analysis ? (
                              <ConfidenceBar value={analysis.confidence} />
                            ) : (
                              <span className="text-gray-600 font-mono text-xs">
                                --
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Expanded reasoning */}
              {expandedToken && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 mb-5">
                  <div className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-2">
                    AI Reasoning for {expandedToken}
                  </div>
                  <p className="text-gray-300 font-mono text-xs leading-relaxed">
                    {data.result.analysis?.find(
                      (a) =>
                        a.token === expandedToken ||
                        a.token ===
                          data.tokens.find((t) => t.name === expandedToken)
                            ?.symbol
                    )?.reasoning || "No analysis available for this token."}
                  </p>
                </div>
              )}

              {/* Top pick callout */}
              {topPick && (
                <div
                  className="rounded-xl border border-emerald-500/25 p-4 mb-5"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-500 font-mono text-xs font-bold uppercase tracking-wider">
                      Top Pick
                    </span>
                    <span className="text-emerald-400 font-mono text-sm font-bold">
                      {topPick.token}
                    </span>
                    <span className="text-emerald-600 font-mono text-xs">
                      {topPick.confidence}% confidence
                    </span>
                    {topPick.position_pct != null && (
                      <span className="text-emerald-700 font-mono text-xs ml-auto">
                        Position: {(topPick.position_pct * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 font-mono text-xs leading-relaxed italic">
                    &ldquo;{topPick.reasoning}&rdquo;
                  </p>
                </div>
              )}

              {/* Strategy summary */}
              {data.result.overall_strategy && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 mb-5">
                  <div className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-2">
                    Strategy Summary
                  </div>
                  <p className="text-gray-300 font-mono text-xs leading-relaxed italic">
                    &ldquo;{data.result.overall_strategy}&rdquo;
                  </p>
                </div>
              )}

              {/* Footer status */}
              <div className="flex items-center justify-between text-gray-600 font-mono text-xs">
                <span>
                  Last updated:{" "}
                  {lastUpdate
                    ? lastUpdate.toLocaleTimeString()
                    : "--:--:--"}
                </span>
                <span>
                  Auto-refresh in {countdown}s
                  {loading && (
                    <span className="ml-2 text-red-400 animate-pulse">
                      Scanning...
                    </span>
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
