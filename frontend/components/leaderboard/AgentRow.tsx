"use client";

import { useState } from "react";
import type { AgentData } from "@/lib/types";
import { RadarChart } from "@/components/shared/RadarChart";

export function AgentRow({ agent, rank }: { agent: AgentData; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const roi = agent.balance > 0
    ? (((agent.balance - 100) / 100) * 100).toFixed(1)
    : "0.0";
  const roiColor = parseFloat(roi) >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-900/50 text-left"
      >
        <span className="text-xs text-gray-600 w-5 font-mono">#{rank}</span>
        <span className="font-medium text-sm flex-1">{agent.name}</span>
        <span className={`font-mono text-xs ${roiColor}`}>{roi}%</span>
        <span className="text-[10px] text-gray-600">Gen {agent.generation}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-800/50">
          <div className="flex gap-4 mt-2">
            <RadarChart genome={agent.genome} size={100} />
            <div className="flex-1 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Balance</span>
                <span className="font-mono">{agent.balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Holdings</span>
                <span className="font-mono">{Object.keys(agent.holdings).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tokens Created</span>
                <span className="font-mono">{agent.created_tokens.length}</span>
              </div>
              {agent.parent_ids.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Parents</span>
                  <span className="font-mono text-[10px]">{agent.parent_ids.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
          {agent.action_history.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] text-gray-600 uppercase">Recent Actions</span>
              {agent.action_history.slice(-3).map((h, i) => (
                <div key={i} className="text-[10px] text-gray-500 font-mono truncate">
                  T{h.tick}: {h.action.type} {h.action.reasoning}
                </div>
              ))}
            </div>
          )}
          {agent.strategy_notes.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] text-gray-600 uppercase">Strategy Notes</span>
              {agent.strategy_notes.map((n, i) => (
                <div key={i} className="text-[10px] text-purple-400 font-mono truncate">
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
