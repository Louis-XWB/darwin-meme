"use client";

interface ControlsProps {
  running: boolean;
  connected: boolean;
  generation: number;
  tick: number;
  speed: number;
  onStart: (speed: number) => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [
  { label: "1x", value: 1.0 },
  { label: "5x", value: 0.2 },
  { label: "Max", value: 0.01 },
];

export function Controls({
  running, connected, generation, tick, speed, onStart, onStop, onSpeedChange,
}: ControlsProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-gray-900 border-b border-gray-800">
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

      <div className="flex items-center gap-1 ml-4">
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
