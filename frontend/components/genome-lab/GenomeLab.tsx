"use client";

import { useState } from "react";

/* ── Genome shape (all 25 dimensions) ── */
interface DistilledGenome {
  risk_appetite: number;
  entry_threshold: number;
  exit_threshold: number;
  position_size: number;
  max_holdings: number;
  graduation_bias: number;
  creation_frequency: number;
  theme_vector: number[];
  naming_style: number;
  hype_intensity: number;
  follow_leader: number;
  contrarian: number;
  herd_sensitivity: number;
  cooperation: number;
  experiment_rate: number;
  adaptation_speed: number;
  memory_weight: number;
  exploration_vs_exploit: number;
}

interface KOL {
  name: string;
  title: string;
  avatar: string;
  strategy: string;
  description: string;
  genome: DistilledGenome;
}

/* ── 6 famous KOL archetypes with full 25-field genomes ── */
const KOLS: KOL[] = [
  {
    name: "Diamond Hands Dave",
    title: "BSC OG Holder",
    avatar: "\u{1F48E}",
    strategy: "Contrarian",
    description:
      "Never sells. Buys every dip. Has held through 10 rug pulls and still profits overall.",
    genome: {
      risk_appetite: 0.9,
      entry_threshold: 0.15,
      exit_threshold: 0.95,
      position_size: 0.45,
      max_holdings: 8,
      graduation_bias: 0.3,
      creation_frequency: 0.05,
      theme_vector: [0.7, 0.3, 0.5, 0.2, 0.8, 0.1, 0.4, 0.6],
      naming_style: 1,
      hype_intensity: 0.1,
      follow_leader: 0.1,
      contrarian: 0.95,
      herd_sensitivity: 0.05,
      cooperation: 0.3,
      experiment_rate: 0.2,
      adaptation_speed: 0.15,
      memory_weight: 0.9,
      exploration_vs_exploit: 0.25,
    },
  },
  {
    name: "Sniper Sarah",
    title: "Early Entry Queen",
    avatar: "\u{1F3AF}",
    strategy: "Aggressive",
    description:
      "Finds tokens within seconds of launch. Buys in the first 10 blocks, sells within hours.",
    genome: {
      risk_appetite: 0.95,
      entry_threshold: 0.05,
      exit_threshold: 0.3,
      position_size: 0.4,
      max_holdings: 3,
      graduation_bias: 0.15,
      creation_frequency: 0.0,
      theme_vector: [0.9, 0.8, 0.2, 0.1, 0.3, 0.95, 0.1, 0.5],
      naming_style: 0,
      hype_intensity: 0.35,
      follow_leader: 0.3,
      contrarian: 0.2,
      herd_sensitivity: 0.4,
      cooperation: 0.15,
      experiment_rate: 0.5,
      adaptation_speed: 0.9,
      memory_weight: 0.4,
      exploration_vs_exploit: 0.7,
    },
  },
  {
    name: "Creator Chen",
    title: "Token Factory",
    avatar: "\u{1F3ED}",
    strategy: "Creator",
    description:
      "Launches 5+ tokens per day. Master of narrative and hype. Creates the trends others follow.",
    genome: {
      risk_appetite: 0.6,
      entry_threshold: 0.4,
      exit_threshold: 0.5,
      position_size: 0.2,
      max_holdings: 5,
      graduation_bias: 0.7,
      creation_frequency: 0.95,
      theme_vector: [0.5, 0.6, 0.9, 0.8, 0.7, 0.4, 0.6, 0.85],
      naming_style: 4,
      hype_intensity: 0.9,
      follow_leader: 0.1,
      contrarian: 0.4,
      herd_sensitivity: 0.6,
      cooperation: 0.5,
      experiment_rate: 0.7,
      adaptation_speed: 0.8,
      memory_weight: 0.3,
      exploration_vs_exploit: 0.65,
    },
  },
  {
    name: "Copy Cat King",
    title: "Smart Money Tracker",
    avatar: "\u{1F431}",
    strategy: "Follower",
    description:
      "Tracks whale wallets and copies their trades within minutes. Never leads, always follows profit.",
    genome: {
      risk_appetite: 0.4,
      entry_threshold: 0.55,
      exit_threshold: 0.45,
      position_size: 0.3,
      max_holdings: 6,
      graduation_bias: 0.5,
      creation_frequency: 0.02,
      theme_vector: [0.3, 0.4, 0.3, 0.5, 0.2, 0.6, 0.3, 0.4],
      naming_style: 2,
      hype_intensity: 0.25,
      follow_leader: 0.95,
      contrarian: 0.05,
      herd_sensitivity: 0.9,
      cooperation: 0.7,
      experiment_rate: 0.1,
      adaptation_speed: 0.85,
      memory_weight: 0.7,
      exploration_vs_exploit: 0.15,
    },
  },
  {
    name: "Mad Scientist",
    title: "DeFi Experimenter",
    avatar: "\u{1F9EA}",
    strategy: "Experimenter",
    description:
      "Tests wild strategies nobody else tries. 80% fail, but the 20% that work are legendary.",
    genome: {
      risk_appetite: 0.7,
      entry_threshold: 0.35,
      exit_threshold: 0.55,
      position_size: 0.25,
      max_holdings: 7,
      graduation_bias: 0.35,
      creation_frequency: 0.4,
      theme_vector: [0.6, 0.5, 0.7, 0.9, 0.95, 0.3, 0.8, 0.7],
      naming_style: 3,
      hype_intensity: 0.5,
      follow_leader: 0.15,
      contrarian: 0.6,
      herd_sensitivity: 0.2,
      cooperation: 0.45,
      experiment_rate: 0.95,
      adaptation_speed: 0.6,
      memory_weight: 0.5,
      exploration_vs_exploit: 0.9,
    },
  },
  {
    name: "Whale Watcher",
    title: "Graduation Hunter",
    avatar: "\u{1F40B}",
    strategy: "Graduation Hunter",
    description:
      "Only buys tokens above 70% bonding progress. Rides the graduation pump for quick 2-3x gains.",
    genome: {
      risk_appetite: 0.5,
      entry_threshold: 0.7,
      exit_threshold: 0.4,
      position_size: 0.35,
      max_holdings: 4,
      graduation_bias: 0.95,
      creation_frequency: 0.0,
      theme_vector: [0.4, 0.5, 0.3, 0.3, 0.2, 0.7, 0.5, 0.3],
      naming_style: 1,
      hype_intensity: 0.2,
      follow_leader: 0.6,
      contrarian: 0.15,
      herd_sensitivity: 0.65,
      cooperation: 0.4,
      experiment_rate: 0.15,
      adaptation_speed: 0.55,
      memory_weight: 0.8,
      exploration_vs_exploit: 0.2,
    },
  },
];

/* ── Key traits to display as mini bars ── */
const KEY_TRAITS: { key: keyof DistilledGenome; label: string }[] = [
  { key: "risk_appetite", label: "Risk" },
  { key: "follow_leader", label: "Follow" },
  { key: "contrarian", label: "Contrarian" },
  { key: "creation_frequency", label: "Create" },
  { key: "experiment_rate", label: "Experiment" },
  { key: "graduation_bias", label: "Grad Bias" },
];

const STRATEGY_COLORS: Record<string, string> = {
  Contrarian: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  Aggressive: "text-red-400 border-red-500/40 bg-red-500/10",
  Creator: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  Follower: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  Experimenter: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  "Graduation Hunter": "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
};

/* ── Genome bar component ── */
function GenomeBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-16 text-gray-500 font-mono truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-gray-600 font-mono">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

/* ── Full genome breakdown (all fields) ── */
function FullGenomePanel({ genome }: { genome: DistilledGenome }) {
  const fields: { key: keyof DistilledGenome; label: string }[] = [
    { key: "risk_appetite", label: "Risk Appetite" },
    { key: "entry_threshold", label: "Entry Threshold" },
    { key: "exit_threshold", label: "Exit Threshold" },
    { key: "position_size", label: "Position Size" },
    { key: "max_holdings", label: "Max Holdings" },
    { key: "graduation_bias", label: "Graduation Bias" },
    { key: "creation_frequency", label: "Create Frequency" },
    { key: "naming_style", label: "Naming Style" },
    { key: "hype_intensity", label: "Hype Intensity" },
    { key: "follow_leader", label: "Follow Leader" },
    { key: "contrarian", label: "Contrarian" },
    { key: "herd_sensitivity", label: "Herd Sensitivity" },
    { key: "cooperation", label: "Cooperation" },
    { key: "experiment_rate", label: "Experiment Rate" },
    { key: "adaptation_speed", label: "Adaptation Speed" },
    { key: "memory_weight", label: "Memory Weight" },
    { key: "exploration_vs_exploit", label: "Explore vs Exploit" },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
      {fields.map((f) => {
        const raw = genome[f.key];
        const val = typeof raw === "number" ? raw : 0;
        // Normalize max_holdings (1-10) and naming_style (0-4) to 0-1
        const normalized =
          f.key === "max_holdings"
            ? val / 10
            : f.key === "naming_style"
            ? val / 4
            : val;
        return <GenomeBar key={f.key} label={f.label} value={normalized} />;
      })}
    </div>
  );
}

/* ── KOL Card ── */
function KOLCard({ kol }: { kol: KOL }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass =
    STRATEGY_COLORS[kol.strategy] ||
    "text-gray-400 border-gray-500/40 bg-gray-500/10";

  return (
    <div
      className="border border-gray-800 rounded-lg bg-gray-900/60 backdrop-blur-sm p-4
                    hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]
                    transition-all duration-300 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{kol.avatar}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{kol.name}</h3>
          <p className="text-[10px] text-gray-500 font-mono">{kol.title}</p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-mono rounded border ${colorClass}`}
          >
            {kol.strategy}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 leading-relaxed mb-3">
        {kol.description}
      </p>

      {/* Key trait bars */}
      <div className="space-y-1 mb-3">
        {KEY_TRAITS.map((t) => {
          const raw = kol.genome[t.key];
          const val = typeof raw === "number" ? raw : 0;
          return <GenomeBar key={t.key} label={t.label} value={val} />;
        })}
      </div>

      {/* Expand / collapse full genome */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-emerald-500 hover:text-emerald-400 font-mono mb-2 text-left"
      >
        {expanded ? "[-] Hide full genome" : "[+] Show full genome"}
      </button>
      {expanded && <FullGenomePanel genome={kol.genome} />}

      {/* Use genome button */}
      <button
        className="mt-auto pt-3 w-full py-1.5 text-xs font-mono rounded border border-emerald-500/30
                      text-emerald-400 hover:bg-emerald-500/10 transition-colors"
      >
        Use This Genome
      </button>
    </div>
  );
}

/* ── Wallet distill result display ── */
interface DistillResult {
  genome: DistilledGenome;
  strategy_label: string;
  description: string;
  traits: string[];
}

function DistillResultPanel({
  result,
  wallet,
  tradeCount,
}: {
  result: DistillResult;
  wallet: string;
  tradeCount: number;
}) {
  const colorClass =
    STRATEGY_COLORS[result.strategy_label] ||
    "text-gray-400 border-gray-500/40 bg-gray-500/10";

  return (
    <div className="border border-emerald-500/20 rounded-lg bg-gray-900/80 backdrop-blur-sm p-6 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-mono">
            Genome Distilled
          </h3>
          <p className="text-xs text-gray-500 font-mono mt-1">
            {wallet.slice(0, 6)}...{wallet.slice(-4)} | {tradeCount} txns
            analyzed
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-mono rounded border ${colorClass}`}
        >
          {result.strategy_label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 leading-relaxed mb-4">
        {result.description}
      </p>

      {/* Traits */}
      <div className="flex flex-wrap gap-2 mb-4">
        {result.traits.map((trait, i) => (
          <span
            key={i}
            className="px-2 py-0.5 text-[10px] font-mono rounded bg-gray-800 text-cyan-400 border border-cyan-500/20"
          >
            {trait}
          </span>
        ))}
      </div>

      {/* Full genome */}
      <FullGenomePanel genome={result.genome} />
    </div>
  );
}

/* ── Main GenomeLab component ── */
export function GenomeLab() {
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    wallet: string;
    result: DistillResult;
    trade_count: number;
  } | null>(null);
  const [error, setError] = useState("");

  const distill = async () => {
    const addr = wallet.trim();
    if (!addr) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const resp = await fetch(`${apiBase}/api/distill-wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      const data = await resp.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-full p-6 font-mono"
      style={{ background: "#050810" }}
    >
      {/* Page header */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            <span className="text-emerald-400">GENOME</span>{" "}
            <span className="text-gray-500">LAB</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Distill trading DNA from on-chain behavior
          </p>
        </div>

        {/* ── Famous Traders Section ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gray-800" />
            <h2 className="text-xs text-gray-500 uppercase tracking-widest">
              Famous Traders
            </h2>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KOLS.map((kol) => (
              <KOLCard key={kol.name} kol={kol} />
            ))}
          </div>
        </div>

        {/* ── Wallet Genome Distiller Section ── */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gray-800" />
            <h2 className="text-xs text-gray-500 uppercase tracking-widest">
              Wallet Genome Distiller
            </h2>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* Input row */}
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x... BSC wallet address"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white
                         font-mono placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none
                         focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
              onKeyDown={(e) => e.key === "Enter" && distill()}
            />
            <button
              onClick={distill}
              disabled={loading || !wallet.trim()}
              className="px-5 py-3 text-sm font-mono font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500
                         text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all
                         hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {loading ? "Scanning..." : "Distill"}
            </button>
          </div>

          {/* Loading animation */}
          {loading && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-lg border border-emerald-500/20 bg-gray-900/60">
                {/* Pulsing scanner effect */}
                <div className="relative w-6 h-6">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
                  <div className="absolute inset-1 rounded-full border border-emerald-400 animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-emerald-500/50" />
                </div>
                <span className="text-sm text-emerald-400 animate-pulse">
                  Analyzing on-chain transactions...
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 max-w-2xl mx-auto text-center">
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </p>
            </div>
          )}

          {/* Result */}
          {result && result.result && (
            <div className="max-w-2xl mx-auto">
              <DistillResultPanel
                result={result.result}
                wallet={result.wallet}
                tradeCount={result.trade_count}
              />
            </div>
          )}
        </div>

        {/* Footer spacer */}
        <div className="h-12" />
      </div>
    </div>
  );
}
