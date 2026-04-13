"use client";

interface ControlsProps {
  running: boolean;
  connected: boolean;
  generation: number;
  tick: number;
  speed: number;
  view: "data" | "game";
  onStart: (speed: number) => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
  onViewChange: (view: "data" | "game") => void;
}

const SPEEDS = [
  { label: "1x", value: 1.0 },
  { label: "5x", value: 0.2 },
  { label: "Max", value: 0.01 },
];

export function Controls({
  running, connected, generation, tick, speed, view,
  onStart, onStop, onSpeedChange, onViewChange,
}: ControlsProps) {
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
          Game
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
            className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded font-medium"
          >
            Start Evolution
          </button>
        )}
      </div>
    </div>
  );
}
