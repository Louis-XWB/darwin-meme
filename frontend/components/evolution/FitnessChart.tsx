"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { GenerationStats } from "@/lib/types";

export function FitnessChart({ stats }: { stats: GenerationStats[] }) {
  if (stats.length === 0) return null;

  const data = stats.map((s) => ({
    gen: s.generation,
    best: parseFloat(s.best_fitness.toFixed(3)),
    avg: parseFloat(s.avg_fitness.toFixed(3)),
    worst: parseFloat(s.worst_fitness.toFixed(3)),
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="gen" stroke="#6b7280" fontSize={10} />
          <YAxis stroke="#6b7280" fontSize={10} />
          <Tooltip
            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", fontSize: 11 }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="best" stroke="#34d399" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="avg" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="worst" stroke="#f87171" strokeWidth={1} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
