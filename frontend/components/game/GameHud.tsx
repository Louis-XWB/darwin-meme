"use client";

import type { AgentData, TokenData, EventData, GenerationStats } from "@/lib/types";
import { STRATEGY_LABELS } from "./entities";

interface GameHudProps {
  agents: AgentData[];
  tokens: TokenData[];
  events: EventData[];
  generation: number;
  tick: number;
  commentary: string[];
  allStats: GenerationStats[];
  prevGeneration: number;
}

const EVENT_ICONS: Record<string, string> = {
  whale: "\uD83D\uDC0B",
  fud: "\uD83D\uDE28",
  viral: "\uD83D\uDD25",
  crisis: "\uD83D\uDCA0",
  narrative: "\uD83D\uDCE2",
};

const STRATEGY_KEYS = Object.keys(STRATEGY_LABELS);

function getPhaseLabel(tick: number, generation: number, prevGeneration: number): string {
  if (generation > prevGeneration && prevGeneration >= 0) return "EVOLUTION";
  if (tick >= 45) return "EVALUATION";
  return "TRADING";
}

function getPhaseDescription(phase: string): string {
  switch (phase) {
    case "TRADING": return "Agents are actively trading meme tokens on the bonding curve market.";
    case "EVALUATION": return "Evaluating agent fitness based on portfolio performance...";
    case "EVOLUTION": return "Natural selection: eliminating weak agents, reproducing strong ones.";
    default: return "";
  }
}

function dominantTraitFromGenome(genome: Record<string, number>): string {
  let best = STRATEGY_KEYS[0];
  let bestVal = -1;
  for (const key of STRATEGY_KEYS) {
    const val = genome[key as keyof typeof genome] ?? 0;
    if (val > bestVal) {
      bestVal = val;
      best = key;
    }
  }
  return best;
}

export function GameHud({
  agents,
  tokens,
  events,
  generation,
  tick,
  commentary,
  allStats,
  prevGeneration,
}: GameHudProps) {
  const sorted = [...agents].sort((a, b) => b.balance - a.balance);
  const top5 = sorted.slice(0, 5);
  const activeCount = tokens.filter((t) => t.state === "active").length;
  const gradCount = tokens.filter((t) => t.state === "graduated").length;
  const latestComment = commentary.length > 0 ? commentary[commentary.length - 1] : "";
  const medals = ["\uD83C\uDFC6", "\uD83E\uDD48", "\uD83E\uDD49", "4.", "5."];

  const currentPhase = getPhaseLabel(tick, generation, prevGeneration);
  const phaseDesc = getPhaseDescription(currentPhase);

  // Strategy breakdown
  const strategyCounts: Record<string, number> = {};
  for (const key of STRATEGY_KEYS) {
    strategyCounts[key] = 0;
  }
  for (const agent of agents) {
    const genome = agent.genome as unknown as Record<string, number>;
    const trait = dominantTraitFromGenome(genome);
    strategyCounts[trait] = (strategyCounts[trait] || 0) + 1;
  }

  // Latest generation stats
  const latestStats = allStats.length > 0 ? allStats[allStats.length - 1] : null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side data panel */}
      <div
        className="absolute top-10 right-3 w-56 pointer-events-none"
        style={{
          fontFamily: "monospace",
        }}
      >
        {/* Panel container with pixel-game border */}
        <div
          className="rounded-sm overflow-hidden"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "2px solid rgba(255,255,255,0.15)",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.5), 0 0 10px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header */}
          <div
            className="px-3 py-1.5 text-center text-xs font-bold tracking-wider"
            style={{
              background: "rgba(255,255,255,0.08)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              color: "#ffd700",
            }}
          >
            DARWIN.MEME
          </div>

          {/* Generation Stats */}
          <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Generation Stats</div>
            {latestStats ? (
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">Gen {latestStats.generation}</span>
                  <span className="text-emerald-400">Best {latestStats.best_fitness.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">Avg {latestStats.avg_fitness.toFixed(1)}</span>
                  <span className="text-red-400">Worst {latestStats.worst_fitness.toFixed(1)}</span>
                </div>
                {/* Mini fitness history */}
                {allStats.length > 1 && (
                  <div className="flex items-end gap-px mt-1 h-4">
                    {allStats.slice(-12).map((s, i) => {
                      const maxFit = Math.max(...allStats.slice(-12).map(x => x.best_fitness), 1);
                      const h = Math.max(2, (s.best_fitness / maxFit) * 16);
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{
                            height: `${h}px`,
                            background: i === allStats.slice(-12).length - 1 ? "#22c55e" : "rgba(34,197,94,0.4)",
                            minWidth: "3px",
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-gray-600">Waiting for data...</div>
            )}
          </div>

          {/* Phase description */}
          <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Phase</div>
            <div
              className="text-[11px] font-bold mb-0.5"
              style={{
                color: currentPhase === "TRADING" ? "#22c55e" :
                       currentPhase === "EVALUATION" ? "#eab308" :
                       "#a855f7",
              }}
            >
              {currentPhase}
            </div>
            <div className="text-[10px] text-gray-500 leading-tight">{phaseDesc}</div>
          </div>

          {/* Top 5 Rankings */}
          <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Rankings</div>
            <div className="space-y-0.5">
              {top5.map((agent, i) => {
                const prevBalance = agent.action_history.length > 0 ? 100 : agent.balance;
                const delta = agent.balance - prevBalance;
                return (
                  <div key={agent.agent_id} className="flex items-center gap-1 text-[11px]">
                    <span className="w-4 text-center">{medals[i]}</span>
                    <span className="text-white flex-1 truncate">{agent.name}</span>
                    <span className="text-emerald-400 tabular-nums">{agent.balance.toFixed(0)}</span>
                    {delta !== 0 && (
                      <span
                        className="text-[9px] tabular-nums"
                        style={{ color: delta > 0 ? "#22c55e" : "#ef4444" }}
                      >
                        {delta > 0 ? "\u2191" : "\u2193"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategy Breakdown */}
          <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Strategies</div>
            <div className="space-y-0.5">
              {STRATEGY_KEYS.map((key) => {
                const colors: Record<string, string> = {
                  risk_appetite: "#ef4444",
                  follow_leader: "#3b82f6",
                  creation_frequency: "#22c55e",
                  contrarian: "#a855f7",
                  experiment_rate: "#eab308",
                };
                const count = strategyCounts[key] || 0;
                const pct = agents.length > 0 ? count / agents.length : 0;
                return (
                  <div key={key} className="flex items-center gap-1 text-[10px]">
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ background: colors[key] || "#666" }}
                    />
                    <span className="text-gray-400">{STRATEGY_LABELS[key]}</span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden mx-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct * 100}%`,
                          background: colors[key] || "#666",
                        }}
                      />
                    </div>
                    <span className="text-gray-500 tabular-nums w-3 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Token stats */}
          <div className="px-3 py-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">
                Active <span className="text-emerald-400">{activeCount}</span>
              </span>
              <span className="text-gray-500">
                Graduated <span className="text-yellow-400">{gradCount}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-center: Event icons */}
      {events.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm">
          {events.map((e, i) => (
            <span
              key={i}
              className="text-lg px-2 py-1 rounded"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {EVENT_ICONS[e.type] || ""}
            </span>
          ))}
        </div>
      )}

      {/* Bottom-right: Latest commentary */}
      {latestComment && (
        <div
          className="absolute bottom-4 right-4 max-w-xs text-xs px-3 py-2"
          style={{
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            color: "#9ca3af",
          }}
        >
          <span style={{ color: "#4b5563" }}>AI: </span>
          {latestComment}
        </div>
      )}
    </div>
  );
}
