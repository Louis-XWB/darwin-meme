"use client";

import { useRef, useState } from "react";
import { useSimulation } from "@/hooks/useSimulation";
import { Controls } from "@/components/shared/Controls";
import { MarketView } from "@/components/market/MarketView";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { EvolutionView } from "@/components/evolution/EvolutionView";
import { CommentatorView } from "@/components/commentator/CommentatorView";
import { GameView } from "@/components/game/GameView";
import { LandingPage } from "@/components/landing/LandingPage";

/* ── Dashboard (existing) ── */
export default function Dashboard() {
  const [launched, setLaunched] = useState(false);
  const { state, startSimulation, stopSimulation, setSpeed, updateSettings } = useSimulation();
  const [view, setView] = useState<"data" | "game">("data");
  const prevGeneration = useRef(0);
  const [settings, setSettings] = useState({
    population_size: 20,
    ticks_per_epoch: 50,
    max_generations: 100,
    mutation_rate: 0.1,
    llm_model: "glm-4-flash",
  });

  if (state.generation !== prevGeneration.current && state.generation > 0) {
    prevGeneration.current = state.generation;
  }

  if (!launched) {
    return <LandingPage onLaunch={() => setLaunched(true)} />;
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
        settings={settings}
        onStart={startSimulation}
        onStop={stopSimulation}
        onSpeedChange={setSpeed}
        onViewChange={setView}
        onSettingsChange={(s) => { setSettings(s); updateSettings(s); }}
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
            allStats={state.allStats}
          />
        </div>
      )}
    </div>
  );
}
