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
        <div className="text-center text-gray-600 py-8 text-sm">
          Start simulation to see agents...
        </div>
      )}
    </div>
  );
}
