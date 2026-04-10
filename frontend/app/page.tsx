"use client";

import { useSimulation } from "@/hooks/useSimulation";
import { Controls } from "@/components/shared/Controls";
import { MarketView } from "@/components/market/MarketView";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { EvolutionView } from "@/components/evolution/EvolutionView";
import { CommentatorView } from "@/components/commentator/CommentatorView";

export default function Dashboard() {
  const { state, startSimulation, stopSimulation, setSpeed } = useSimulation();

  return (
    <div className="h-screen flex flex-col">
      <Controls
        running={state.running}
        connected={state.connected}
        generation={state.generation}
        tick={state.tick}
        speed={state.speed}
        onStart={startSimulation}
        onStop={stopSimulation}
        onSpeedChange={setSpeed}
      />

      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-px bg-gray-800 overflow-hidden">
        <div className="bg-gray-950 overflow-auto p-4">
          <MarketView tokens={state.tokens} trades={state.trades} events={state.events} />
        </div>
        <div className="bg-gray-950 overflow-auto p-4">
          <LeaderboardView agents={state.agents} generation={state.generation} />
        </div>
        <div className="bg-gray-950 overflow-auto p-4">
          <EvolutionView allStats={state.allStats} agents={state.agents} />
        </div>
        <div className="bg-gray-950 overflow-auto p-4">
          <CommentatorView commentary={state.commentary} summaries={state.summaries} generation={state.generation} />
        </div>
      </div>
    </div>
  );
}
