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
        <div className="text-center text-gray-600 py-8 text-sm">
          Evolution data will appear after the first generation completes...
        </div>
      )}
    </div>
  );
}
