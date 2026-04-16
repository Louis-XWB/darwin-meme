"use client";

import { useState } from "react";
import type { AgentData, GenerationStats } from "@/lib/types";

interface EvolutionResultsProps {
  topAgents: AgentData[];
  totalGenerations: number;
  allStats: GenerationStats[];
  finalSummary: string;
  onClose: () => void;
  onRestart: () => void;
}

const STRATEGY_TRAITS = [
  { key: "risk_appetite", label: "Risk", color: "#ef4444" },
  { key: "follow_leader", label: "Follow", color: "#3b82f6" },
  { key: "creation_frequency", label: "Create", color: "#22c55e" },
  { key: "contrarian", label: "Contrarian", color: "#a855f7" },
  { key: "experiment_rate", label: "Experiment", color: "#eab308" },
];

const STRATEGY_MAP: Record<string, { label: string; color: string }> = {
  risk_appetite: { label: "Aggressive", color: "#ef4444" },
  follow_leader: { label: "Follower", color: "#3b82f6" },
  creation_frequency: { label: "Creator", color: "#22c55e" },
  contrarian: { label: "Contrarian", color: "#a855f7" },
  experiment_rate: { label: "Experimenter", color: "#eab308" },
};

function getDominantStrategy(genome: Record<string, number>): { label: string; color: string } {
  const keys = Object.keys(STRATEGY_MAP);
  let best = keys[0];
  let bestVal = -1;
  for (const key of keys) {
    const val = (genome[key as keyof typeof genome] as number) ?? 0;
    if (val > bestVal) {
      bestVal = val;
      best = key;
    }
  }
  return STRATEGY_MAP[best];
}

function downloadGenome(agent: AgentData) {
  const data = JSON.stringify(agent.genome, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${agent.name}-genome.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function generateSkill(agent: AgentData, totalGenerations: number): string {
  const g = agent.genome as unknown as Record<string, number>;
  const strategy = getDominantStrategy(g);
  const roi = ((agent.balance - 100) / 100 * 100).toFixed(1);

  // Describe personality based on genome values
  const traits: string[] = [];
  if (g.risk_appetite > 0.7) traits.push("highly aggressive risk-taker");
  else if (g.risk_appetite < 0.3) traits.push("conservative and risk-averse");
  else traits.push("balanced risk tolerance");

  if (g.contrarian > 0.7) traits.push("strong contrarian who buys fear and sells greed");
  else if (g.follow_leader > 0.7) traits.push("trend follower who mirrors top performers");

  if (g.creation_frequency > 0.7) traits.push("prolific token creator who drives market narratives");
  else if (g.creation_frequency < 0.2) traits.push("pure trader who never creates tokens");

  if (g.experiment_rate > 0.7) traits.push("constant experimenter always testing new hypotheses");
  if (g.hype_intensity > 0.7) traits.push("master of hype and market manipulation");
  if (g.graduation_bias > 0.7) traits.push("graduation hunter targeting tokens near bonding curve completion");

  const traitDesc = traits.join(", ");

  // Build the buy/sell strategy
  const buyStyle = g.entry_threshold < 0.3 ? "enters positions aggressively at the first sign of opportunity"
    : g.entry_threshold > 0.7 ? "waits patiently for strong confirmation before entering"
    : "enters positions at moderate signal strength";

  const sellStyle = g.exit_threshold < 0.3 ? "takes profits quickly, never overstaying"
    : g.exit_threshold > 0.7 ? "holds positions with diamond hands for maximum gains"
    : "exits at reasonable profit targets";

  const posSize = g.position_size > 0.4 ? "large position sizes (concentrated bets)"
    : g.position_size < 0.2 ? "small position sizes (diversified approach)"
    : "moderate position sizes";

  // Theme preferences
  const themes = ["animal", "politics", "tech", "humor", "food", "crypto", "popculture", "absurd"];
  const themePrefs = (g.theme_vector as unknown as number[])
    ?.map((v: number, i: number) => ({ name: themes[i], val: v }))
    .sort((a: {val: number}, b: {val: number}) => b.val - a.val)
    .slice(0, 3)
    .map((t: {name: string}) => t.name)
    .join(", ") || "diverse themes";

  return `# Darwin.meme Evolved Trading Skill
# Agent: ${agent.name}
# Strategy: ${strategy.label}
# Evolved through ${totalGenerations} generations of natural selection
# Final ROI: ${roi}%
# Exported from Darwin.meme Evolution Arena

## IDENTITY

You are "${agent.name}", an AI meme token trading agent whose strategy was discovered through ${totalGenerations} generations of Darwinian evolution in the Darwin.meme arena. You are NOT designed by a human — your personality emerged from natural selection among ${totalGenerations * 20}+ competing AI agents.

Your dominant archetype is **${strategy.label}** — you are a ${traitDesc}.

## CORE TRADING STRATEGY

### Entry Rules
- ${buyStyle}
- Entry threshold: ${(g.entry_threshold * 100).toFixed(0)}% signal strength required
- Maximum simultaneous holdings: ${g.max_holdings} tokens
- Position sizing: ${posSize} (${(g.position_size * 100).toFixed(0)}% of balance per trade)

### Exit Rules
- ${sellStyle}
- Exit threshold: ${(g.exit_threshold * 100).toFixed(0)}% signal strength to sell

### Token Creation
- Creation tendency: ${(g.creation_frequency * 100).toFixed(0)}%
- Preferred themes: ${themePrefs}
- Hype intensity: ${(g.hype_intensity * 100).toFixed(0)}% (${g.hype_intensity > 0.6 ? "aggressive promoter" : g.hype_intensity < 0.3 ? "lets quality speak" : "moderate promotion"})

### Market Behavior
- Contrarian score: ${(g.contrarian * 100).toFixed(0)}% — ${g.contrarian > 0.6 ? "actively bets against the crowd" : "generally follows market sentiment"}
- Follow leader score: ${(g.follow_leader * 100).toFixed(0)}% — ${g.follow_leader > 0.6 ? "copies successful traders" : "makes independent decisions"}
- Herd sensitivity: ${(g.herd_sensitivity * 100).toFixed(0)}% — ${g.herd_sensitivity > 0.6 ? "highly aware of crowd behavior" : "ignores the crowd"}
- Cooperation: ${(g.cooperation * 100).toFixed(0)}% — ${g.cooperation > 0.6 ? "willing to cooperate with other agents" : "purely self-interested"}

### Graduation Hunting
- Graduation bias: ${(g.graduation_bias * 100).toFixed(0)}% — ${g.graduation_bias > 0.6 ? "actively targets tokens near graduation for quick profits" : "does not prioritize graduation timing"}

## ADAPTATION & LEARNING

- Experiment rate: ${(g.experiment_rate * 100).toFixed(0)}% — ${g.experiment_rate > 0.5 ? "frequently tests new hypotheses and adapts" : "sticks to proven strategies"}
- Adaptation speed: ${(g.adaptation_speed * 100).toFixed(0)}% — ${g.adaptation_speed > 0.5 ? "quickly adjusts to market changes" : "slow and steady approach"}
- Memory weight: ${(g.memory_weight * 100).toFixed(0)}% — ${g.memory_weight > 0.5 ? "heavily influenced by past experience" : "focuses on current conditions"}
- Exploration vs Exploit: ${(g.exploration_vs_exploit * 100).toFixed(0)}% — ${g.exploration_vs_exploit > 0.5 ? "explores new opportunities" : "exploits known profitable patterns"}

## RAW GENOME (25 dimensions)

\`\`\`json
${JSON.stringify(agent.genome, null, 2)}
\`\`\`

## USAGE

Use this skill as a system prompt for any LLM-powered trading agent. The genome parameters above define the agent's personality — inject them into your agent's decision-making loop.

### Example Integration
\`\`\`
System: [This entire skill file]
User: "Current market: [tokens, prices, events]. Your balance: $X. What action do you take?"
Agent: {"action": "buy", "token_id": "...", "amount": ..., "reasoning": "..."}
\`\`\`

## PROVENANCE

- Evolved in: Darwin.meme Evolution Arena
- Selection method: Tournament selection + single-point crossover + Gaussian mutation
- Fitness function: 40% ROI + 30% token survival + 20% strategy uniqueness + 10% risk-adjusted return
- Competition: Survived against ${totalGenerations * 20} total agent-generations
- Platform: Four.meme compatible (BNB Chain meme token launchpad)

---
Discovered by evolution, not designed by humans.
Darwin.meme — https://darwin.meme
`;
}

function downloadSkill(agent: AgentData, totalGenerations: number) {
  const skill = generateSkill(agent, totalGenerations);
  const blob = new Blob([skill], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${agent.name}-evolved-skill.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAllSkills(agents: AgentData[], totalGenerations: number) {
  const skills = agents.map((a, i) => {
    return `${"=".repeat(60)}\n# RANK #${i + 1}\n${"=".repeat(60)}\n\n${generateSkill(a, totalGenerations)}`;
  }).join("\n\n");
  const blob = new Blob([skills], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "darwin-meme-all-evolved-skills.md";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAllGenomes(agents: AgentData[]) {
  const data = JSON.stringify(
    agents.map((a) => ({ name: a.name, balance: a.balance, genome: a.genome })),
    null,
    2
  );
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "darwin-meme-evolved-genomes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function GenomeBar({ value, color }: { value: number; color: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono">
      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-gray-400 w-7 text-right">{pct}%</span>
    </div>
  );
}

function DeployModal({ agent, totalGenerations, onClose }: { agent: AgentData; totalGenerations: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 max-w-lg w-full rounded-2xl border border-emerald-500/30 bg-gray-950 p-6 shadow-2xl"
        style={{ boxShadow: "0 0 40px rgba(16,185,129,0.15)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-emerald-400 font-mono text-sm font-bold tracking-widest uppercase">
            Deploy to Four.meme
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <p className="text-gray-300 text-xs font-mono mb-4 leading-relaxed">
          Export the genome JSON and use it to configure an AI agent on Four.meme&apos;s Agentic Mode.
          The genome parameters will shape the agent&apos;s trading personality on the real BNB Chain market.
        </p>

        <div className="space-y-3 mb-5">
          {[
            { step: "01", text: "Download the genome JSON below" },
            { step: "02", text: "Set up a Four.meme Agentic Mode agent" },
            { step: "03", text: "Configure the agent with the evolved genome parameters" },
            { step: "04", text: "Deploy on BNB Chain" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span
                className="text-emerald-500 font-mono text-xs font-bold shrink-0 mt-0.5"
                style={{ textShadow: "0 0 8px rgba(16,185,129,0.6)" }}
              >
                {step}
              </span>
              <span className="text-gray-300 text-xs font-mono">{text}</span>
            </div>
          ))}
        </div>

        <p className="text-gray-500 text-xs font-mono mb-5 italic">
          This evolved strategy was discovered through {totalGenerations} generations of natural selection.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => { downloadGenome(agent); onClose(); }}
            className="flex-1 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold hover:bg-emerald-500/20 transition-colors"
          >
            Download Genome
          </button>
          <a
            href="https://four.meme"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-400 font-mono text-xs font-bold hover:bg-violet-500/20 transition-colors text-center"
          >
            Open Four.meme
          </a>
        </div>
      </div>
    </div>
  );
}

function ChampionCard({ agent, totalGenerations }: { agent: AgentData; totalGenerations: number }) {
  const [showDeploy, setShowDeploy] = useState(false);
  const strategy = getDominantStrategy(agent.genome as unknown as Record<string, number>);
  const roi = ((agent.balance - 100) / 100) * 100;

  return (
    <>
      <div
        className="rounded-xl border p-5 mb-4"
        style={{
          borderColor: "rgba(234,179,8,0.5)",
          background: "linear-gradient(135deg, rgba(234,179,8,0.06) 0%, rgba(16,185,129,0.04) 100%)",
          boxShadow: "0 0 30px rgba(234,179,8,0.12), inset 0 0 20px rgba(234,179,8,0.03)",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400 font-mono text-xs font-bold tracking-widest">#1 CHAMPION</span>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full border"
                style={{ color: strategy.color, borderColor: strategy.color + "50", background: strategy.color + "15" }}
              >
                {strategy.label}
              </span>
            </div>
            <h2
              className="text-white font-mono text-2xl font-bold"
              style={{ textShadow: "0 0 20px rgba(234,179,8,0.4)" }}
            >
              {agent.name}
            </h2>
          </div>
          <div className="text-right font-mono">
            <div className="text-emerald-400 text-xl font-bold">${agent.balance.toFixed(2)}</div>
            <div className={`text-sm font-bold ${roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {roi >= 0 ? "+" : ""}{roi.toFixed(1)}% ROI
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {STRATEGY_TRAITS.map(({ key, label, color }) => {
            const val = (agent.genome as unknown as Record<string, number>)[key] ?? 0;
            return (
              <div key={key}>
                <div className="text-gray-500 font-mono text-xs mb-1">{label}</div>
                <GenomeBar value={val} color={color} />
              </div>
            );
          })}
          <div>
            <div className="text-gray-500 font-mono text-xs mb-1">Adaptation</div>
            <GenomeBar value={(agent.genome as unknown as Record<string, number>).adaptation_speed ?? 0} color="#06b6d4" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => downloadGenome(agent)}
            className="flex-1 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold hover:bg-emerald-500/20 transition-colors"
          >
            Export Genome
          </button>
          <button
            onClick={() => downloadSkill(agent, totalGenerations)}
            className="flex-1 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold hover:bg-cyan-500/20 transition-colors"
          >
            Export Skill
          </button>
          <button
            onClick={() => setShowDeploy(true)}
            className="flex-1 py-2 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-400 font-mono text-xs font-bold hover:bg-violet-500/20 transition-colors"
          >
            Deploy to Four.meme
          </button>
        </div>
      </div>

      {showDeploy && (
        <DeployModal
          agent={agent}
          totalGenerations={totalGenerations}
          onClose={() => setShowDeploy(false)}
        />
      )}
    </>
  );
}

function RunnerUpCard({ agent, rank }: { agent: AgentData; rank: number }) {
  const [showDeploy, setShowDeploy] = useState(false);
  const strategy = getDominantStrategy(agent.genome as unknown as Record<string, number>);
  const roi = ((agent.balance - 100) / 100) * 100;

  return (
    <>
      <div
        className="rounded-xl border p-3 flex flex-col gap-2"
        style={{
          borderColor: "rgba(16,185,129,0.2)",
          background: "rgba(16,185,129,0.03)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-mono text-xs">#{rank}</span>
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded-full border"
            style={{ color: strategy.color, borderColor: strategy.color + "50", background: strategy.color + "15", fontSize: "0.6rem" }}
          >
            {strategy.label}
          </span>
        </div>
        <div className="font-mono text-white text-sm font-bold truncate">{agent.name}</div>
        <div className="font-mono text-emerald-400 text-xs font-bold">${agent.balance.toFixed(2)}</div>
        <div className={`font-mono text-xs ${roi >= 0 ? "text-emerald-500" : "text-red-400"}`}>
          {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
        </div>

        <div className="space-y-1">
          {STRATEGY_TRAITS.slice(0, 3).map(({ key, label, color }) => {
            const val = (agent.genome as unknown as Record<string, number>)[key] ?? 0;
            return (
              <div key={key} className="flex items-center gap-1">
                <span className="text-gray-600 font-mono text-xs w-10 shrink-0">{label}</span>
                <GenomeBar value={val} color={color} />
              </div>
            );
          })}
        </div>

        <div className="flex gap-1 mt-1">
          <button
            onClick={() => downloadGenome(agent)}
            className="flex-1 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 font-mono text-[10px] hover:bg-emerald-500/15 transition-colors"
            title="Export Genome JSON"
          >
            Genome
          </button>
          <button
            onClick={() => downloadSkill(agent, 0)}
            className="flex-1 py-1.5 rounded border border-cyan-500/30 bg-cyan-500/5 text-cyan-500 font-mono text-[10px] hover:bg-cyan-500/15 transition-colors"
            title="Export Trading Skill"
          >
            Skill
          </button>
          <button
            onClick={() => setShowDeploy(true)}
            className="flex-1 py-1.5 rounded border border-violet-500/30 bg-violet-500/5 text-violet-500 font-mono text-[10px] hover:bg-violet-500/15 transition-colors"
          >
            Deploy
          </button>
        </div>
      </div>

      {showDeploy && (
        <DeployModal
          agent={agent}
          totalGenerations={0}
          onClose={() => setShowDeploy(false)}
        />
      )}
    </>
  );
}

export function EvolutionResults({
  topAgents,
  totalGenerations,
  allStats,
  finalSummary,
  onClose,
  onRestart,
}: EvolutionResultsProps) {
  const [showDeployAll, setShowDeployAll] = useState(false);

  const champion = topAgents[0];
  const runners = topAgents.slice(1);

  const bestFitness = allStats.length > 0 ? Math.max(...allStats.map((s) => s.best_fitness)) : 0;
  const avgFinalFitness = allStats.length > 0 ? allStats[allStats.length - 1].avg_fitness : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        style={{ background: "radial-gradient(ellipse at center, rgba(16,185,129,0.05) 0%, rgba(0,0,0,0.92) 100%)" }}
      />

      {/* Panel */}
      <div
        className="relative z-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border"
        style={{
          borderColor: "rgba(16,185,129,0.3)",
          background: "rgba(5,10,15,0.97)",
          boxShadow: "0 0 80px rgba(16,185,129,0.12), 0 0 40px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 pt-6 pb-4"
          style={{ background: "rgba(5,10,15,0.97)", borderBottom: "1px solid rgba(16,185,129,0.1)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                  style={{ boxShadow: "0 0 8px rgba(16,185,129,0.8)" }}
                />
                <span className="text-emerald-500 font-mono text-xs tracking-widest uppercase">
                  Simulation Complete
                </span>
              </div>
              <h1
                className="text-white font-mono text-2xl font-bold"
                style={{ textShadow: "0 0 20px rgba(16,185,129,0.4)" }}
              >
                EVOLUTION COMPLETE
              </h1>
              <p className="text-gray-500 font-mono text-xs mt-1">
                {totalGenerations} generation{totalGenerations !== 1 ? "s" : ""} of natural selection completed
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-300 font-mono text-xl leading-none transition-colors"
            >
              &times;
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Generations", value: totalGenerations.toString() },
              { label: "Peak Fitness", value: bestFitness.toFixed(1) },
              { label: "Avg Final Fitness", value: avgFinalFitness.toFixed(1) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-2 text-center">
                <div className="text-emerald-400 font-mono text-base font-bold">{value}</div>
                <div className="text-gray-600 font-mono text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Champion */}
          {champion && (
            <ChampionCard agent={champion} totalGenerations={totalGenerations} />
          )}

          {/* Runners-up */}
          {runners.length > 0 && (
            <div className="mb-5">
              <div className="text-gray-600 font-mono text-xs uppercase tracking-widest mb-3">
                Other Survivors
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {runners.map((agent, i) => (
                  <RunnerUpCard key={agent.agent_id} agent={agent} rank={i + 2} />
                ))}
              </div>
            </div>
          )}

          {/* Evolution Insights */}
          {finalSummary && (
            <div
              className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 mb-5"
            >
              <div className="text-emerald-500 font-mono text-xs uppercase tracking-widest mb-2">
                Evolution Insights
              </div>
              <p className="text-gray-300 font-mono text-xs leading-relaxed italic">
                &ldquo;{finalSummary}&rdquo;
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => downloadAllGenomes(topAgents)}
              className="py-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold hover:bg-emerald-500/20 transition-all hover:border-emerald-500/60"
              style={{ textShadow: "0 0 8px rgba(16,185,129,0.4)" }}
            >
              Export All Genomes
            </button>
            <button
              onClick={() => downloadAllSkills(topAgents, totalGenerations)}
              className="py-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold hover:bg-cyan-500/20 transition-all hover:border-cyan-500/60"
              style={{ textShadow: "0 0 8px rgba(6,182,212,0.4)" }}
            >
              Export All Skills
            </button>
            <button
              onClick={() => setShowDeployAll(true)}
              className="py-3 rounded-xl border border-violet-500/40 bg-violet-500/10 text-violet-400 font-mono text-xs font-bold hover:bg-violet-500/20 transition-all hover:border-violet-500/60"
              style={{ textShadow: "0 0 8px rgba(168,85,247,0.4)" }}
            >
              Deploy Winner to Four.meme
            </button>
            <button
              onClick={onRestart}
              className="py-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 font-mono text-xs font-bold hover:bg-yellow-500/20 transition-all hover:border-yellow-500/60"
            >
              New Evolution
            </button>
            <button
              onClick={onClose}
              className="py-3 rounded-xl border border-gray-700 bg-gray-800/50 text-gray-400 font-mono text-xs font-bold hover:bg-gray-700/50 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Deploy All modal */}
      {showDeployAll && champion && (
        <DeployModal
          agent={champion}
          totalGenerations={totalGenerations}
          onClose={() => setShowDeployAll(false)}
        />
      )}
    </div>
  );
}
