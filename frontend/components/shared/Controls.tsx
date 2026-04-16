"use client";

import { useState } from "react";

interface SettingsData {
  population_size: number;
  ticks_per_epoch: number;
  max_generations: number;
  mutation_rate: number;
  llm_model: string;
}

interface ControlsProps {
  running: boolean;
  connected: boolean;
  generation: number;
  tick: number;
  speed: number;
  view: "data" | "game" | "lab";
  settings: SettingsData;
  onStart: (speed: number) => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
  onViewChange: (view: "data" | "game" | "lab") => void;
  onSettingsChange: (settings: SettingsData) => void;
}

const SPEEDS = [
  { label: "1x", value: 1.0 },
  { label: "5x", value: 0.2 },
  { label: "Max", value: 0.01 },
];

export function Controls({
  running, connected, generation, tick, speed, view, settings,
  onStart, onStop, onSpeedChange, onViewChange, onSettingsChange,
}: ControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState<SettingsData>(settings);

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-gray-900 border-b border-gray-800 z-50 relative">
      <h1 className="text-xl font-bold tracking-tight">
        <span className="text-emerald-400">Darwin</span>
        <span className="text-gray-500">.meme</span>
      </h1>

      <div className="flex items-center gap-2 ml-4">
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
        <span className="text-xs text-gray-500">{connected ? "Connected" : "Disconnected"}</span>
      </div>

      <div className="flex items-center gap-2 ml-4 font-mono text-sm">
        <span className="text-gray-500">Gen:</span>
        <span className="text-emerald-400 font-bold">{generation}</span>
        <span className="text-gray-600 mx-1">|</span>
        <span className="text-gray-500">Tick:</span>
        <span className="text-blue-400">{tick}/50</span>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 ml-4 border border-gray-700 rounded p-0.5">
        <button
          onClick={() => onViewChange("data")}
          className={`px-2 py-1 text-xs rounded ${
            view === "data"
              ? "bg-gray-700 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Data
        </button>
        <button
          onClick={() => onViewChange("game")}
          className={`px-2 py-1 text-xs rounded ${
            view === "game"
              ? "bg-emerald-600 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Terminal
        </button>
        <button
          onClick={() => onViewChange("lab")}
          className={`px-2 py-1 text-xs rounded ${
            view === "lab"
              ? "bg-cyan-600 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Genome Lab
        </button>
      </div>

      {/* Speed controls */}
      <div className="flex items-center gap-1 ml-2">
        {SPEEDS.map((s) => (
          <button
            key={s.label}
            onClick={() => onSpeedChange(s.value)}
            className={`px-2 py-1 text-xs rounded ${
              speed === s.value
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Settings gear button */}
      <button
        onClick={() => { setLocalSettings(settings); setShowSettings(true); }}
        className="px-2 py-1.5 text-sm text-gray-400 hover:text-white rounded hover:bg-gray-800"
        title="Settings"
      >
        ⚙️
      </button>

      <div className="ml-auto">
        {running ? (
          <button
            onClick={onStop}
            className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded font-medium"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={() => onStart(speed)}
            disabled={!connected}
            className={`px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded font-medium ${
              connected && !running ? "animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" : ""
            }`}
          >
            Start Evolution
          </button>
        )}
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[420px] max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Evolution Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              {[
                { key: "population_size", label: "Population Size", type: "number", min: 4, max: 50, step: undefined },
                { key: "ticks_per_epoch", label: "Ticks per Epoch", type: "number", min: 10, max: 200, step: undefined },
                { key: "max_generations", label: "Max Generations", type: "number", min: 5, max: 500, step: undefined },
                { key: "mutation_rate", label: "Mutation Rate", type: "number", min: 0.01, max: 1, step: 0.01 },
                { key: "llm_model", label: "LLM Model", type: "text", min: undefined, max: undefined, step: undefined },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={(localSettings as unknown as Record<string, string | number>)[field.key]}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onChange={(e) => setLocalSettings({ ...localSettings, [field.key]: field.type === "number" ? parseFloat(e.target.value) : e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { onSettingsChange(localSettings); setShowSettings(false); }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded py-2 text-sm font-medium"
              >
                Apply
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
