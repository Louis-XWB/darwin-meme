"use client";

import { useRef, useState } from "react";
import { useSimulation } from "@/hooks/useSimulation";
import { Controls } from "@/components/shared/Controls";
import { MarketView } from "@/components/market/MarketView";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { EvolutionView } from "@/components/evolution/EvolutionView";
import { CommentatorView } from "@/components/commentator/CommentatorView";
import { GameView } from "@/components/game/GameView";

export default function Dashboard() {
  const { state, startSimulation, stopSimulation, setSpeed } = useSimulation();
  const [view, setView] = useState<"data" | "game">("game");
  const prevGeneration = useRef(0);

  if (state.generation !== prevGeneration.current && state.generation > 0) {
    prevGeneration.current = state.generation;
  }

  return (
    <div className="h-screen flex flex-col">
      <Controls
        running={state.running}
        connected={state.connected}
        generation={state.generation}
        tick={state.tick}
        speed={state.speed}
        view={view}
        onStart={startSimulation}
        onStop={stopSimulation}
        onSpeedChange={setSpeed}
        onViewChange={setView}
      />

      {view === "data" ? (
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
      ) : (
        <div className="flex-1">
          <GameView
            agents={state.agents}
            tokens={state.tokens}
            trades={state.trades}
            events={state.events}
            generation={state.generation}
            tick={state.tick}
            commentary={state.commentary}
            prevGeneration={prevGeneration.current}
          />
        </div>
      )}
    </div>
  );
}
