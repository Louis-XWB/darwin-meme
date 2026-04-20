"use client";

import { useEffect, useState } from "react";
import type { AgentData, Genome } from "@/lib/types";
import { LiveAnalysis } from "@/components/results/LiveAnalysis";

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
    name: "0xSun",
    title: "链上狙击之王",
    avatar: "\u{2600}\u{FE0F}",
    strategy: "Aggressive",
    description:
      "全网最知名的链上狙击手。TRUMP 币赚了 2400 万美金。所有交易链上可查，速度极快，专打新币前 10 个区块。",
    genome: {
      risk_appetite: 0.95,
      entry_threshold: 0.05,
      exit_threshold: 0.25,
      position_size: 0.45,
      max_holdings: 3,
      graduation_bias: 0.1,
      creation_frequency: 0.0,
      theme_vector: [0.9, 0.8, 0.2, 0.1, 0.3, 0.95, 0.1, 0.5],
      naming_style: 0,
      hype_intensity: 0.2,
      follow_leader: 0.15,
      contrarian: 0.3,
      herd_sensitivity: 0.4,
      cooperation: 0.1,
      experiment_rate: 0.6,
      adaptation_speed: 0.95,
      memory_weight: 0.3,
      exploration_vs_exploit: 0.8,
    },
  },
  {
    name: "王小二",
    title: "BSC 老炮",
    avatar: "\u{1F3AF}",
    strategy: "Creator",
    description:
      "BSC 圈老玩家，擅长造梗、建社群、操盘叙事。自己发币、自己推，一张图能带飞一个项目。玩的是情绪和节奏。",
    genome: {
      risk_appetite: 0.6,
      entry_threshold: 0.5,
      exit_threshold: 0.7,
      position_size: 0.15,
      max_holdings: 10,
      graduation_bias: 0.8,
      creation_frequency: 0.85,
      theme_vector: [0.5, 0.3, 0.9, 0.7, 0.4, 0.95, 0.8, 0.6],
      naming_style: 4,
      hype_intensity: 0.95,
      follow_leader: 0.05,
      contrarian: 0.5,
      herd_sensitivity: 0.3,
      cooperation: 0.7,
      experiment_rate: 0.7,
      adaptation_speed: 0.6,
      memory_weight: 0.8,
      exploration_vs_exploit: 0.5,
    },
  },
  {
    name: "D 哥",
    title: "Alpha 信息差玩家",
    avatar: "\u{1F52C}",
    strategy: "Experimenter",
    description:
      "专门挖掘早期项目的 Alpha 信息。在别人还没注意到之前就入场，靠信息差赚钱。80% 的项目会归零，但 20% 能翻百倍。",
    genome: {
      risk_appetite: 0.75,
      entry_threshold: 0.2,
      exit_threshold: 0.5,
      position_size: 0.2,
      max_holdings: 8,
      graduation_bias: 0.15,
      creation_frequency: 0.1,
      theme_vector: [0.6, 0.5, 0.8, 0.9, 0.3, 0.7, 0.5, 0.85],
      naming_style: 3,
      hype_intensity: 0.3,
      follow_leader: 0.1,
      contrarian: 0.7,
      herd_sensitivity: 0.15,
      cooperation: 0.35,
      experiment_rate: 0.95,
      adaptation_speed: 0.7,
      memory_weight: 0.5,
      exploration_vs_exploit: 0.9,
    },
  },
  {
    name: "枯坐",
    title: "聪明钱跟单者",
    avatar: "\u{1F575}\u{FE0F}",
    strategy: "Follower",
    description:
      "用 GMGN 和 Ave.ai 盯 BSC 鲸鱼钱包，大户买什么他跟什么。从不自己判断，只跟最赚钱的地址。胜率稳定 60%+。",
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
      hype_intensity: 0.15,
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
    name: "奶牛",
    title: "逆向抄底王",
    avatar: "\u{1F48E}",
    strategy: "Contrarian",
    description:
      "币圈老韭菜，从不追高。别人恐慌他抄底，别人 FOMO 他不动。经历了 10 次 rug pull 还在盈利。信仰是他最大的武器。",
    genome: {
      risk_appetite: 0.85,
      entry_threshold: 0.15,
      exit_threshold: 0.95,
      position_size: 0.4,
      max_holdings: 8,
      graduation_bias: 0.25,
      creation_frequency: 0.05,
      theme_vector: [0.7, 0.3, 0.4, 0.2, 0.8, 0.5, 0.4, 0.6],
      naming_style: 1,
      hype_intensity: 0.1,
      follow_leader: 0.1,
      contrarian: 0.95,
      herd_sensitivity: 0.05,
      cooperation: 0.3,
      experiment_rate: 0.2,
      adaptation_speed: 0.15,
      memory_weight: 0.9,
      exploration_vs_exploit: 0.2,
    },
  },
  {
    name: "阿峰",
    title: "毕业盘玩家",
    avatar: "\u{1F393}",
    strategy: "Graduation Hunter",
    description:
      "Four.meme 毕业盘专家。只买进度 70%+ 的 token，等毕业上 PancakeSwap 的那一波拉升。快进快出，单笔 2-3 倍收益。纪律性极强。",
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
function KOLCard({
  kol,
  onUse,
  onRemove,
}: {
  kol: KOL;
  onUse: (kol: KOL) => void;
  onRemove?: () => void;
}) {
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
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-600 hover:text-red-400 text-xs px-1"
            title="Remove from lab"
          >
            ✕
          </button>
        )}
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
        onClick={() => onUse(kol)}
        className="mt-auto pt-3 w-full py-1.5 text-xs font-mono rounded border border-emerald-500/30
                      text-emerald-400 hover:bg-emerald-500/10 transition-colors"
      >
        Use This Genome →
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

/* ── Convert KOL to AgentData for LiveAnalysis ── */
function kolToAgent(kol: KOL): AgentData {
  return {
    agent_id: `kol_${kol.name}`,
    name: kol.name,
    genome: kol.genome as unknown as Genome,
    balance: 100,
    generation: 0,
    parent_ids: [],
    holdings: {},
    created_tokens: [],
    action_history: [],
    strategy_notes: [],
    alive: true,
  };
}

const CUSTOM_KOLS_KEY = "darwin_meme_custom_kols";

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
  const [customKols, setCustomKols] = useState<KOL[]>([]);
  const [aliasName, setAliasName] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [activeAgent, setActiveAgent] = useState<AgentData | null>(null);

  // Load custom KOLs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_KOLS_KEY);
      if (stored) setCustomKols(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist custom KOLs to localStorage
  const persistCustomKols = (kols: KOL[]) => {
    setCustomKols(kols);
    try {
      localStorage.setItem(CUSTOM_KOLS_KEY, JSON.stringify(kols));
    } catch {}
  };

  const distill = async () => {
    const addr = wallet.trim();
    if (!addr) return;
    setLoading(true);
    setError("");
    setResult(null);
    setAddSuccess("");
    setAliasName("");

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";
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

  const addToLab = () => {
    if (!result || !result.result) return;
    const fallback = `${result.wallet.slice(0, 6)}...${result.wallet.slice(-4)}`;
    const name = aliasName.trim() || fallback;
    const newKol: KOL = {
      name,
      title: `${fallback} · ${result.trade_count} txns`,
      avatar: "\u{1F9EC}",
      strategy: result.result.strategy_label,
      description: result.result.description,
      genome: result.result.genome,
    };
    persistCustomKols([newKol, ...customKols.filter((k) => k.name !== name)]);
    setAddSuccess(`Added "${name}" to lab`);
    setTimeout(() => setAddSuccess(""), 2500);
  };

  const removeCustom = (name: string) => {
    persistCustomKols(customKols.filter((k) => k.name !== name));
  };

  const handleUse = (kol: KOL) => {
    setActiveAgent(kolToAgent(kol));
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
              <KOLCard key={kol.name} kol={kol} onUse={handleUse} />
            ))}
          </div>
        </div>

        {/* ── My Distilled Genomes ── */}
        {customKols.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gray-800" />
              <h2 className="text-xs text-cyan-500 uppercase tracking-widest">
                My Distilled Genomes ({customKols.length})
              </h2>
              <div className="h-px flex-1 bg-gray-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customKols.map((kol) => (
                <KOLCard
                  key={kol.name}
                  kol={kol}
                  onUse={handleUse}
                  onRemove={() => removeCustom(kol.name)}
                />
              ))}
            </div>
          </div>
        )}

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

              {/* Add to Lab panel */}
              <div className="mt-4 border border-cyan-500/30 rounded-lg bg-gray-900/80 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">
                      Save to Lab
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Give it a name so you can find it later.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value)}
                    placeholder={`Alias (default: ${result.wallet.slice(0, 6)}...${result.wallet.slice(-4)})`}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white
                               font-mono placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && addToLab()}
                  />
                  <button
                    onClick={addToLab}
                    className="px-4 py-2 text-xs font-mono font-bold rounded bg-cyan-600 hover:bg-cyan-500
                               text-white transition-colors"
                  >
                    + Add to Lab
                  </button>
                  <button
                    onClick={() => handleUse({
                      name: aliasName.trim() || `${result.wallet.slice(0, 6)}...${result.wallet.slice(-4)}`,
                      title: "Distilled",
                      avatar: "\u{1F9EC}",
                      strategy: result.result.strategy_label,
                      description: result.result.description,
                      genome: result.result.genome,
                    })}
                    className="px-4 py-2 text-xs font-mono font-bold rounded border border-emerald-500/40
                               text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    Use Now →
                  </button>
                </div>
                {addSuccess && (
                  <p className="text-[11px] text-cyan-400 font-mono mt-2">
                    ✓ {addSuccess}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer spacer */}
        <div className="h-12" />
      </div>

      {/* Live Analysis overlay */}
      {activeAgent && (
        <LiveAnalysis
          agent={activeAgent}
          totalGenerations={0}
          onClose={() => setActiveAgent(null)}
        />
      )}
    </div>
  );
}
