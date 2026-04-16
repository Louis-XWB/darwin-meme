import type { AgentData } from "@/lib/types";
import { AgentRow } from "./AgentRow";

interface LeaderboardViewProps {
  agents: AgentData[];
  generation: number;
}

export function LeaderboardView({ agents, generation }: LeaderboardViewProps) {
  const sorted = [...agents].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
        Agent Leaderboard
        <span className="ml-2 text-emerald-400 normal-case font-normal">
          {agents.length} agents
        </span>
      </h2>

      <div className="space-y-1">
        {sorted.map((agent, i) => (
          <AgentRow key={agent.agent_id} agent={agent} rank={i + 1} />
        ))}
      </div>

      {agents.length === 0 && (
        <div className="space-y-2">
          <div className="text-center py-3">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-sm text-gray-400 font-medium mb-1">Agent Rankings</div>
            <div className="text-xs text-gray-600">20 AI agents competing for survival</div>
          </div>
          {["Alpha", "Beta", "Gamma", "Delta", "Epsilon"].map((name, i) => (
            <div key={name} className="border border-gray-800/50 rounded-lg px-3 py-2 opacity-30 flex items-center gap-3">
              <span className="text-xs text-gray-600 w-5 font-mono">#{i + 1}</span>
              <span className="text-sm text-gray-500 flex-1">{name}</span>
              <span className="font-mono text-xs text-gray-600">$100.0</span>
            </div>
          ))}
          <div className="text-[10px] text-gray-700 text-center mt-2">Rankings update in real-time</div>
        </div>
      )}
    </div>
  );
}
