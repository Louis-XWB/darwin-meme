"use client";

import type { AgentData, TokenData, EventData } from "@/lib/types";

interface GameHudProps {
  agents: AgentData[];
  tokens: TokenData[];
  events: EventData[];
  generation: number;
  tick: number;
  commentary: string[];
}

const EVENT_ICONS: Record<string, string> = {
  whale: "\uD83D\uDC0B",
  fud: "\uD83D\uDE28",
  viral: "\uD83D\uDD25",
  crisis: "\uD83D\uDCA0",
  narrative: "\uD83D\uDCE2",
};

export function GameHud({
  agents,
  tokens,
  events,
  generation,
  tick,
  commentary,
}: GameHudProps) {
  const sorted = [...agents].sort((a, b) => b.balance - a.balance);
  const top3 = sorted.slice(0, 3);
  const activeCount = tokens.filter((t) => t.state === "active").length;
  const gradCount = tokens.filter((t) => t.state === "graduated").length;
  const latestComment = commentary.length > 0 ? commentary[commentary.length - 1] : "";
  const medals = ["\uD83C\uDFC6", "\uD83E\uDD48", "\uD83E\uDD49"];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top-left: Gen + Tick */}
      <div className="absolute top-4 left-4 font-mono text-sm">
        <span className="text-gray-500">Gen </span>
        <span className="text-emerald-400 font-bold text-lg">{generation}</span>
        <span className="text-gray-600 mx-2">|</span>
        <span className="text-gray-500">Tick </span>
        <span className="text-blue-400">{tick}</span>
        <span className="text-gray-600">/50</span>
      </div>

      {/* Bottom-left: Top 3 */}
      <div className="absolute bottom-16 left-4 space-y-1">
        {top3.map((agent, i) => (
          <div key={agent.agent_id} className="flex items-center gap-2 text-sm">
            <span>{medals[i]}</span>
            <span className="text-white font-medium">{agent.name}</span>
            <span className="text-emerald-400 font-mono">{agent.balance.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Bottom-center: Token stats + event icons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-gray-500">
        <span>
          <span className="text-emerald-400">{activeCount}</span> active
        </span>
        <span>
          <span className="text-yellow-400">{gradCount}</span> graduated
        </span>
        {events.length > 0 && (
          <span className="flex gap-1">
            {events.map((e, i) => (
              <span key={i} className="text-base">{EVENT_ICONS[e.type] || ""}</span>
            ))}
          </span>
        )}
      </div>

      {/* Bottom-right: Latest commentary */}
      {latestComment && (
        <div className="absolute bottom-4 right-4 max-w-xs text-xs text-gray-400 bg-gray-900/60 rounded px-3 py-2 backdrop-blur-sm">
          <span className="text-gray-600">AI: </span>
          {latestComment}
        </div>
      )}
    </div>
  );
}
