import type { AgentData, GenerationStats } from "@/lib/types";
import { FitnessChart } from "./FitnessChart";
import { StrategyScatter } from "./StrategyScatter";
import { GenesDrift } from "./GenesDrift";

interface EvolutionViewProps {
  allStats: GenerationStats[];
  agents: AgentData[];
}

export function EvolutionView({ allStats, agents }: EvolutionViewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
        Evolution
        {allStats.length > 0 && (
          <span className="ml-2 text-emerald-400 normal-case font-normal">
            {allStats.length} generations
          </span>
        )}
      </h2>

      {allStats.length > 0 ? (
        <>
          <div>
            <h3 className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">
              Fitness Over Generations
            </h3>
            <FitnessChart stats={allStats} />
          </div>

          <div className="flex gap-4">
            <div>
              <h3 className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">
                Strategy Space
              </h3>
              <StrategyScatter agents={agents} />
            </div>
            <div className="flex-1">
              <GenesDrift allStats={allStats} agents={agents} />
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-3">
            <div className="text-2xl mb-2">🧬</div>
            <div className="text-sm text-gray-400 font-medium mb-1">Evolution Tracker</div>
            <div className="text-xs text-gray-600">Fitness curves and strategy emergence over generations</div>
          </div>
          <div className="border border-gray-800/50 rounded-lg p-4 opacity-30">
            <div className="h-32 flex items-end gap-1">
              {[20, 35, 30, 45, 55, 50, 65, 70, 68, 80, 85, 90].map((h, i) => (
                <div key={i} className="flex-1 bg-emerald-900/50 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="text-[10px] text-gray-600 mt-2 text-center">Fitness over generations</div>
          </div>
          <div className="text-[10px] text-gray-700 text-center">Evolution data appears after first generation</div>
        </div>
      )}
    </div>
  );
}
