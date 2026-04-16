"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import type {
  AgentData,
  GenerationEndPayload,
  GenerationStats,
  SimCompletePayload,
  SimulationState,
  TickPayload,
  TokenData,
  TradeData,
  EventData,
} from "@/lib/types";

const initialState: SimulationState = {
  connected: false,
  running: false,
  generation: 0,
  tick: 0,
  agents: [],
  tokens: [],
  trades: [],
  events: [],
  commentary: [],
  allStats: [],
  summaries: [],
  speed: 1.0,
  completed: false,
  topAgents: [],
  totalGenerations: 0,
  finalSummary: "",
};

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      setState((s) => ({ ...s, connected: true }));
    });

    socket.on("disconnect", () => {
      setState((s) => ({ ...s, connected: false }));
    });

    socket.on("sim_started", () => {
      setState((s) => ({ ...s, running: true }));
    });

    socket.on("sim_stopped", () => {
      setState((s) => ({ ...s, running: false }));
    });

    socket.on("generation_start", (data: { generation: number; agents: AgentData[] }) => {
      setState((s) => ({
        ...s,
        generation: data.generation,
        tick: 0,
        agents: data.agents,
        tokens: [],
        trades: [],
      }));
    });

    socket.on("tick", (data: TickPayload) => {
      setState((s) => ({
        ...s,
        tick: data.tick,
        agents: data.agents,
        tokens: data.market.tokens,
        trades: data.trades,
        events: data.events,
        commentary: data.commentary
          ? [...s.commentary.slice(-49), data.commentary]
          : s.commentary,
      }));
    });

    socket.on("generation_end", (data: GenerationEndPayload) => {
      setState((s) => ({
        ...s,
        allStats: data.all_stats,
        agents: data.agents,
        summaries: data.summary
          ? [...s.summaries, data.summary]
          : s.summaries,
      }));
    });

    socket.on("sim_complete", (data: SimCompletePayload) => {
      setState((s) => ({
        ...s,
        running: false,
        completed: true,
        topAgents: data.top_agents,
        totalGenerations: data.total_generations,
        allStats: data.all_stats,
        finalSummary: data.final_summary,
      }));
    });

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("sim_started");
      socket.off("sim_stopped");
      socket.off("generation_start");
      socket.off("tick");
      socket.off("generation_end");
      socket.off("sim_complete");
      socket.disconnect();
    };
  }, []);

  const startSimulation = useCallback((speed: number = 1.0) => {
    const socket = getSocket();
    socket.emit("start_simulation", { speed });
  }, []);

  const stopSimulation = useCallback(() => {
    const socket = getSocket();
    socket.emit("stop_simulation", {});
  }, []);

  const setSpeed = useCallback((speed: number) => {
    const socket = getSocket();
    socket.emit("set_speed", { speed });
    setState((s) => ({ ...s, speed }));
  }, []);

  const updateSettings = useCallback((settings: {
    population_size: number;
    ticks_per_epoch: number;
    max_generations: number;
    mutation_rate: number;
    llm_model: string;
  }) => {
    const socket = getSocket();
    socket.emit("update_settings", settings);
  }, []);

  const dismissResults = useCallback(() => {
    setState((s) => ({ ...s, completed: false }));
  }, []);

  const restartSimulation = useCallback((speed: number = 1.0) => {
    setState((s) => ({
      ...s,
      completed: false,
      topAgents: [],
      totalGenerations: 0,
      finalSummary: "",
      allStats: [],
      summaries: [],
      generation: 0,
      tick: 0,
      agents: [],
      tokens: [],
      trades: [],
      events: [],
      commentary: [],
    }));
    const socket = getSocket();
    socket.emit("start_simulation", { speed });
  }, []);

  return { state, startSimulation, stopSimulation, setSpeed, updateSettings, dismissResults, restartSimulation };
}
