"use client";

import type { AgentData, GenerationStats } from "@/lib/types";

const TRACKED_GENES = [
  { key: "risk_appetite", color: "#f87171", label: "Risk" },
  { key: "contrarian", color: "#60a5fa", label: "Contrarian" },
  { key: "creation_frequency", color: "#34d399", label: "Create" },
  { key: "experiment_rate", color: "#c084fc", label: "Experiment" },
];

interface GenesDriftProps {
  allStats: GenerationStats[];
  agents: AgentData[];
}

export function GenesDrift({ allStats, agents }: GenesDriftProps) {
  if (agents.length === 0) return null;

  const avgData: Record<string, number> = {};
  for (const gene of TRACKED_GENES) {
    const values = agents.map((a) => (a.genome as unknown as Record<string, number>)[gene.key]);
    avgData[gene.key] = values.reduce((s, v) => s + v, 0) / values.length;
  }

  return (
    <div className="space-y-1">
      <h4 className="text-[10px] text-gray-600 uppercase tracking-wider">Population Gene Averages</h4>
      {TRACKED_GENES.map((gene) => (
        <div key={gene.key} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-16">{gene.label}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${(avgData[gene.key] * 100).toFixed(1)}%`,
                backgroundColor: gene.color,
              }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-mono w-8">
            {avgData[gene.key].toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
