"use client";

import { useRef, useState } from "react";
import { useSimulation } from "@/hooks/useSimulation";
import { Controls } from "@/components/shared/Controls";
import { MarketView } from "@/components/market/MarketView";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { EvolutionView } from "@/components/evolution/EvolutionView";
import { CommentatorView } from "@/components/commentator/CommentatorView";
import { GameView } from "@/components/game/GameView";

/* ── Particles ── */
function Particles() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 12 + 10,
    delay: Math.random() * 15,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `rgba(16, 185, 129, ${p.opacity})`,
            animation: `float ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Stats Card ── */
function StatCard({
  value,
  label,
  desc,
  delay,
}: {
  value: string;
  label: string;
  desc: string;
  delay: number;
}) {
  return (
    <div
      className="animate-fade-in-up group relative flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.06]"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 animate-shimmer" />
      <span className="font-mono text-3xl font-bold text-emerald-400">{value}</span>
      <span className="text-sm font-semibold text-gray-200">{label}</span>
      <span className="text-xs text-gray-500">{desc}</span>
    </div>
  );
}

/* ── Feature Card ── */
function FeatureCard({
  icon,
  title,
  desc,
  delay,
}: {
  icon: string;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <div
      className="animate-fade-in-up group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.06]"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 animate-shimmer" />
      <div className="relative z-10">
        <span className="text-2xl">{icon}</span>
        <h3 className="mt-3 text-base font-semibold text-gray-100">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">{desc}</p>
      </div>
    </div>
  );
}

/* ── Landing Page ── */
function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden" style={{ background: "#030712" }}>
      {/* Aurora background */}
      <div
        className="absolute inset-0 animate-aurora"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(16, 185, 129, 0.10) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(168, 85, 247, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(16, 185, 129, 0.04) 0%, transparent 40%),
            #030712
          `,
        }}
      />

      {/* Floating particles */}
      <Particles />

      {/* Grid overlay for sci-fi feel */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-5xl mx-auto">
        {/* DNA Icon */}
        <div className="animate-fade-in-up animate-dna text-5xl" style={{ animationDelay: "0s" }}>
          🧬
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="animate-title-in font-mono text-6xl font-black tracking-wide md:text-7xl lg:text-8xl">
            <span className="text-emerald-400" style={{ textShadow: "0 0 40px rgba(16,185,129,0.4), 0 0 80px rgba(16,185,129,0.15)" }}>
              DARWIN
            </span>
            <span className="text-gray-500">.MEME</span>
          </h1>
        </div>

        {/* Tagline */}
        <div className="flex justify-center w-full">
          <p className="animate-typewriter font-mono text-lg text-gray-400 md:text-xl max-w-2xl text-center">
            What happens when AI evolves in a meme token economy for 100 generations?
          </p>
        </div>

        {/* Stats Row */}
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 w-full max-w-3xl">
          <StatCard value="20" label="Agents" desc="competing in real-time" delay={1.8} />
          <StatCard value="25-D" label="Genome" desc="shaping AI personality" delay={2.0} />
          <StatCard value="100" label="Generations" desc="of natural selection" delay={2.2} />
          <StatCard value="66" label="Tests" desc="production-grade code" delay={2.4} />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 w-full max-w-3xl">
          <FeatureCard
            icon="🧬"
            title="Evolutionary AI"
            desc="Genetic algorithms + LLM-powered decisions. Evolution changes personality, not rules."
            delay={2.6}
          />
          <FeatureCard
            icon="🔬"
            title="AutoResearch Loop"
            desc="Agents autonomously experiment with strategies. Two-tier learning: individual + population."
            delay={2.8}
          />
          <FeatureCard
            icon="📊"
            title="Real-time Dashboard"
            desc="Watch evolution unfold. Data view + sci-fi terminal. AI commentary."
            delay={3.0}
          />
        </div>

        {/* Launch Button */}
        <div className="animate-fade-in-up mt-2" style={{ animationDelay: "3.2s" }}>
          <button
            onClick={onLaunch}
            className="animate-pulse-glow group relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-10 py-4 font-mono text-lg font-bold text-white transition-all duration-300 hover:scale-105 hover:from-emerald-500 hover:to-emerald-400 active:scale-100"
            style={{
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              🚀 LAUNCH EVOLUTION
            </span>
            {/* Hover shimmer */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </button>
        </div>

        {/* Footer */}
        <p
          className="animate-fade-in-up mt-1 font-mono text-xs text-gray-600"
          style={{ animationDelay: "3.5s" }}
        >
          Built for Four.meme AI Sprint Hackathon &bull; $50,000 Prize Pool
        </p>
      </div>
    </div>
  );
}

/* ── Dashboard (existing) ── */
export default function Dashboard() {
  const [launched, setLaunched] = useState(false);
  const { state, startSimulation, stopSimulation, setSpeed } = useSimulation();
  const [view, setView] = useState<"data" | "game">("data");
  const prevGeneration = useRef(0);

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
            allStats={state.allStats}
          />
        </div>
      )}
    </div>
  );
}
