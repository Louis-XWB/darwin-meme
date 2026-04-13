"use client";

import type { AgentData, TokenData, TradeData, EventData } from "@/lib/types";
import { EcosystemCanvas } from "./EcosystemCanvas";
import { GameHud } from "./GameHud";

interface GameViewProps {
  agents: AgentData[];
  tokens: TokenData[];
  trades: TradeData[];
  events: EventData[];
  generation: number;
  tick: number;
  commentary: string[];
  prevGeneration: number;
}

export function GameView({
  agents,
  tokens,
  trades,
  events,
  generation,
  tick,
  commentary,
  prevGeneration,
}: GameViewProps) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <EcosystemCanvas
        agents={agents}
        tokens={tokens}
        trades={trades}
        events={events}
        generation={generation}
        tick={tick}
        prevGeneration={prevGeneration}
      />
      <GameHud
        agents={agents}
        tokens={tokens}
        events={events}
        generation={generation}
        tick={tick}
        commentary={commentary}
      />
    </div>
  );
}
