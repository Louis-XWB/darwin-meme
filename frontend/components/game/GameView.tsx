"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type {
  AgentData,
  TokenData,
  TradeData,
  EventData,
  GenerationStats,
} from "@/lib/types";

/* ── Strategy mapping ──────────────────────────────────────── */
const STRATEGY_MAP: Record<string, { label: string; color: string }> = {
  risk_appetite: { label: "激进 RISK", color: "#ff2255" },
  follow_leader: { label: "跟风 FOLLOW", color: "#3b82f6" },
  creation_frequency: { label: "创造 CREATE", color: "#00ff88" },
  contrarian: { label: "反向 CONTRA", color: "#a855f7" },
  experiment_rate: { label: "实验 EXPERIMENT", color: "#facc15" },
};

const STRATEGY_KEYS = Object.keys(STRATEGY_MAP);

function getDominantStrategy(genome: Record<string, unknown>): {
  key: string;
  label: string;
  color: string;
} {
  let best = STRATEGY_KEYS[0];
  let bestVal = -1;
  for (const key of STRATEGY_KEYS) {
    const val = (genome[key] as number) ?? 0;
    if (val > bestVal) {
      bestVal = val;
      best = key;
    }
  }
  const info = STRATEGY_MAP[best];
  return { key: best, ...info };
}

/* ── Trade-log entry ───────────────────────────────────────── */
interface TradeLogEntry {
  text: string;
  color: string;
  time: number;
  agentId: string;
  tokenId?: string;
  type: string;
}

/* ── Event banner mapping ──────────────────────────────────── */
const EVENT_LABELS: Record<string, { icon: string; text: string; color: string }> = {
  whale: { icon: "⚠", text: "WHALE ALERT — MASSIVE POSITION DETECTED", color: "#ff2255" },
  fud: { icon: "⚡", text: "FUD WAVE — PANIC SELLING DETECTED", color: "#ff2255" },
  viral: { icon: "🔥", text: "VIRAL EVENT — TOKEN TRENDING", color: "#00ff88" },
  crisis: { icon: "💀", text: "MARKET CRISIS — HIGH VOLATILITY", color: "#ff2255" },
  narrative: { icon: "📢", text: "NARRATIVE SHIFT — NEW TREND EMERGING", color: "#facc15" },
};

/* ── Props ─────────────────────────────────────────────────── */
interface GameViewProps {
  agents: AgentData[];
  tokens: TokenData[];
  trades: TradeData[];
  events: EventData[];
  generation: number;
  tick: number;
  commentary: string[];
  prevGeneration: number;
  allStats?: GenerationStats[];
}

/* ═══════════════════════════════════════════════════════════ */
export function GameView({
  agents,
  tokens,
  trades,
  events,
  generation,
  tick,
  commentary: _commentary,
  prevGeneration: _prevGeneration,
  allStats = [],
}: GameViewProps) {
  /* ── Trade log accumulation ───────────────────────────────── */
  const tradeLogRef = useRef<TradeLogEntry[]>([]);
  const lastTickRef = useRef(-1);
  const [tradeLog, setTradeLog] = useState<TradeLogEntry[]>([]);

  /* ── Active-card highlights (agentId -> "buy"|"sell"|"create") */
  const [activeAgents, setActiveAgents] = useState<Record<string, string>>({});
  const [activeTokens, setActiveTokens] = useState<Record<string, string>>({});

  /* ── Event banner ─────────────────────────────────────────── */
  const [banner, setBanner] = useState<{ icon: string; text: string; color: string } | null>(null);

  /* Process new trades each tick */
  useEffect(() => {
    if (tick === lastTickRef.current) return;
    lastTickRef.current = tick;

    if (trades.length === 0) return;

    const newAgentHighlights: Record<string, string> = {};
    const newTokenHighlights: Record<string, string> = {};

    for (const trade of trades) {
      let text = "";
      let color = "#00f5ff";
      const type = trade.type;

      if (type === "buy") {
        text = `${trade.agent_name} bought ${trade.token_name || "?"} ($${trade.cost.toFixed(1)})`;
        color = "#00ff88";
      } else if (type === "sell") {
        text = `${trade.agent_name} sold ${trade.token_name || "?"} ($${trade.cost.toFixed(1)})`;
        color = "#ff2255";
      } else if (type === "create") {
        text = `${trade.agent_name} created ${trade.token_name || "?"}`;
        color = "#3b82f6";
      } else {
        text = `${trade.agent_name} ${type} ${trade.token_name || ""}`;
        color = "#00f5ff";
      }

      tradeLogRef.current.push({
        text,
        color,
        time: Date.now(),
        agentId: trade.agent_id,
        tokenId: trade.token_id,
        type,
      });

      newAgentHighlights[trade.agent_id] = type;
      if (trade.token_id) newTokenHighlights[trade.token_id] = type;
    }

    // Trim
    if (tradeLogRef.current.length > 50) {
      tradeLogRef.current = tradeLogRef.current.slice(-50);
    }

    setTradeLog([...tradeLogRef.current]);
    setActiveAgents(newAgentHighlights);
    setActiveTokens(newTokenHighlights);

    // Clear highlights after 1.5s
    const timeout = setTimeout(() => {
      setActiveAgents({});
      setActiveTokens({});
    }, 1500);
    return () => clearTimeout(timeout);
  }, [trades, tick]);

  /* Process events -> banners */
  useEffect(() => {
    if (events.length === 0) return;
    const ev = events[events.length - 1];
    const info = EVENT_LABELS[ev.type];
    if (info) {
      setBanner(info);
      const timeout = setTimeout(() => setBanner(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [events]);

  /* ── Sorted agents (by balance, descending) ──────────────── */
  const sortedAgents = useMemo(
    () => [...agents].sort((a, b) => b.balance - a.balance),
    [agents],
  );

  /* ── Stats ───────────────────────────────────────────────── */
  const activeTokenCount = tokens.filter((t) => t.state === "active").length;
  const totalVolume = useMemo(
    () => tradeLogRef.current.reduce((sum, t) => sum + (t.type === "buy" || t.type === "sell" ? 1 : 0), 0),
    [tradeLog],
  );
  const avgBalance =
    agents.length > 0
      ? (agents.reduce((s, a) => s + a.balance, 0) / agents.length).toFixed(1)
      : "0.0";
  const topAgent = sortedAgents.length > 0 ? sortedAgents[0].name : "—";

  /* ── Ticker entries (last 20, reversed for scroll) ───────── */
  const tickerEntries = useMemo(() => tradeLog.slice(-20).reverse(), [tradeLog]);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="terminal-root">
      {/* Inline styles for sci-fi effects */}
      <style jsx>{`
        /* ── Reset & Variables ───────────────────────────────── */
        .terminal-root {
          --bg: #0a0a0f;
          --cyan: #00f5ff;
          --cyan-dim: #00c4cc;
          --green: #00ff88;
          --red: #ff2255;
          --gold: #ffcc00;
          --purple: #a855f7;
          --blue: #3b82f6;
          --yellow: #facc15;
          --panel-bg: rgba(0, 20, 35, 0.72);
          --border: rgba(0, 245, 255, 0.18);
          --glow-c: 0 0 8px rgba(0, 245, 255, 0.6), 0 0 20px rgba(0, 245, 255, 0.25);
          --glow-g: 0 0 8px rgba(0, 255, 136, 0.6), 0 0 20px rgba(0, 255, 136, 0.25);
          --glow-r: 0 0 8px rgba(255, 34, 85, 0.7), 0 0 20px rgba(255, 34, 85, 0.3);
          --ff: 'Courier New', Courier, monospace;

          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: var(--bg);
          font-family: var(--ff);
          color: var(--cyan);
          display: grid;
          grid-template-rows: 54px 1fr 190px 44px;
          grid-template-areas:
            'header'
            'market'
            'agents'
            'footer';
          gap: 3px;
          padding: 5px;
        }

        /* Grid bg */
        .terminal-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: linear-gradient(
              rgba(0, 245, 255, 0.03) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(0, 245, 255, 0.03) 1px,
              transparent 1px
            );
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        /* Scan lines */
        .terminal-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.08) 2px,
            rgba(0, 0, 0, 0.08) 4px
          );
          pointer-events: none;
          z-index: 1;
          animation: scanline 8s linear infinite;
        }

        @keyframes scanline {
          0% { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }
        @keyframes glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes borderGlow {
          0%, 100% {
            box-shadow: 0 0 6px rgba(0, 245, 255, 0.4),
              inset 0 0 6px rgba(0, 245, 255, 0.05);
          }
          50% {
            box-shadow: 0 0 14px rgba(0, 245, 255, 0.8),
              inset 0 0 12px rgba(0, 245, 255, 0.1);
          }
        }
        @keyframes flicker {
          0%,100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.4; }
          94% { opacity: 1; }
          96% { opacity: 0.6; }
          97% { opacity: 1; }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes barPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes rankGold {
          0%, 100% { box-shadow: 0 0 8px rgba(255,204,0,0.6), 0 0 20px rgba(255,204,0,0.2); }
          50% { box-shadow: 0 0 16px rgba(255,204,0,0.9), 0 0 30px rgba(255,204,0,0.4); }
        }
        @keyframes rankSilver {
          0%, 100% { box-shadow: 0 0 8px rgba(180,180,200,0.5); }
          50% { box-shadow: 0 0 14px rgba(180,180,200,0.8); }
        }
        @keyframes rankBronze {
          0%, 100% { box-shadow: 0 0 8px rgba(200,120,50,0.5); }
          50% { box-shadow: 0 0 14px rgba(200,120,50,0.8); }
        }
        @keyframes whaleBanner {
          0% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.95); }
          10% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          85% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.98); }
        }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* ── Header ──────────────────────────────────────────── */
        .t-header {
          grid-area: header;
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 10, 20, 0.9);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 0 16px;
          animation: borderGlow 3s ease-in-out infinite;
          backdrop-filter: blur(12px);
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        .logo {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 3px;
          color: var(--cyan);
          text-shadow: var(--glow-c);
          animation: glow 2.5s ease-in-out infinite;
        }
        .logo-dot { color: rgba(0, 245, 255, 0.4); }
        .logo-sub {
          font-size: 9px;
          letter-spacing: 4px;
          color: rgba(0, 245, 255, 0.5);
          text-transform: uppercase;
        }

        .header-center {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: rgba(0, 245, 255, 0.7);
        }
        .stat-pill .label {
          letter-spacing: 1px;
          opacity: 0.6;
        }
        .stat-pill .value {
          color: var(--cyan);
          font-weight: 700;
          font-size: 13px;
          text-shadow: var(--glow-c);
        }

        .tick-bar {
          width: 80px;
          height: 6px;
          background: rgba(0, 245, 255, 0.1);
          border-radius: 3px;
          border: 1px solid rgba(0, 245, 255, 0.2);
          overflow: hidden;
        }
        .tick-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--cyan), #00ff88);
          border-radius: 3px;
          transition: width 0.8s ease;
          box-shadow: 0 0 6px var(--cyan);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sys-label {
          font-size: 9px;
          letter-spacing: 2px;
          color: rgba(0, 245, 255, 0.4);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: dotBlink 1.5s ease-in-out infinite;
        }
        .status-dot.green {
          background: var(--green);
          box-shadow: var(--glow-g);
        }
        .status-dot.cyan {
          background: var(--cyan);
          box-shadow: var(--glow-c);
          animation-delay: 0.4s;
        }
        .status-dot.purple {
          background: var(--purple);
          box-shadow: 0 0 8px rgba(168, 85, 247, 0.8);
          animation-delay: 0.8s;
        }

        /* ── Market area ─────────────────────────────────────── */
        .t-market {
          grid-area: market;
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow: hidden;
        }
        .section-label {
          font-size: 8px;
          letter-spacing: 3px;
          color: rgba(0, 245, 255, 0.35);
          padding: 4px 6px 3px;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .token-row {
          flex: 1;
          display: flex;
          gap: 4px;
          padding: 2px 2px 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .token-row::-webkit-scrollbar { display: none; }

        .token-card {
          flex: 0 0 calc((100% - 5 * 4px) / 6);
          min-width: 155px;
          background: var(--panel-bg);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 10px 10px 8px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          backdrop-filter: blur(14px);
          position: relative;
          overflow: hidden;
          animation: borderGlow 4s ease-in-out infinite;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .token-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at 50% 0%,
            rgba(0, 245, 255, 0.07) 0%,
            transparent 70%
          );
          pointer-events: none;
        }
        .token-card.highlight-buy {
          border-color: rgba(0, 255, 136, 0.7);
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.4),
            inset 0 0 8px rgba(0, 255, 136, 0.06);
        }
        .token-card.highlight-sell {
          border-color: rgba(255, 34, 85, 0.7);
          box-shadow: 0 0 10px rgba(255, 34, 85, 0.4),
            inset 0 0 8px rgba(255, 34, 85, 0.06);
        }

        .token-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .token-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--cyan);
          letter-spacing: 1px;
          text-shadow: var(--glow-c);
          animation: glow 3s ease-in-out infinite;
        }
        .token-symbol {
          font-size: 8px;
          color: rgba(0, 245, 255, 0.4);
          letter-spacing: 2px;
          margin-top: 1px;
        }
        .status-badge {
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 2px 5px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .status-badge.active {
          background: rgba(0, 255, 136, 0.12);
          color: var(--green);
          border: 1px solid rgba(0, 255, 136, 0.3);
          box-shadow: var(--glow-g);
        }
        .status-badge.graduated {
          background: rgba(255, 204, 0, 0.12);
          color: var(--gold);
          border: 1px solid rgba(255, 204, 0, 0.3);
        }
        .status-badge.dead {
          background: rgba(255, 34, 85, 0.12);
          color: var(--red);
          border: 1px solid rgba(255, 34, 85, 0.3);
        }

        .token-price {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 1px;
          animation: flicker 7s ease-in-out infinite;
        }
        .price-int { color: #fff; }
        .price-dec { color: var(--cyan); font-size: 14px; }

        .token-stats {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .token-stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          color: rgba(0, 245, 255, 0.5);
          letter-spacing: 0.5px;
        }
        .token-stat-row span:last-child {
          color: var(--cyan);
          font-weight: 600;
        }

        .bond-label {
          display: flex;
          justify-content: space-between;
          font-size: 7px;
          color: rgba(0, 245, 255, 0.4);
          letter-spacing: 1px;
          margin-bottom: 2px;
        }
        .bond-bar {
          height: 4px;
          background: rgba(0, 245, 255, 0.08);
          border-radius: 3px;
          border: 1px solid rgba(0, 245, 255, 0.12);
          overflow: hidden;
        }
        .bond-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #00c4cc, #00ff88);
          box-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
          animation: barPulse 2.5s ease-in-out infinite;
          transition: width 1s ease;
        }

        .corner-tl, .corner-tr, .corner-bl, .corner-br {
          position: absolute;
          width: 7px;
          height: 7px;
          border-color: var(--cyan);
          border-style: solid;
          opacity: 0.35;
        }
        .corner-tl { top: 3px; left: 3px; border-width: 1px 0 0 1px; }
        .corner-tr { top: 3px; right: 3px; border-width: 1px 1px 0 0; }
        .corner-bl { bottom: 3px; left: 3px; border-width: 0 0 1px 1px; }
        .corner-br { bottom: 3px; right: 3px; border-width: 0 1px 1px 0; }

        /* ── Agent grid ──────────────────────────────────────── */
        .t-agents {
          grid-area: agents;
          position: relative;
          z-index: 2;
          background: rgba(0, 10, 20, 0.6);
          border: 1px solid var(--border);
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        .agents-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 10px 3px;
          border-bottom: 1px solid rgba(0, 245, 255, 0.08);
          flex-shrink: 0;
        }
        .agents-header-title {
          font-size: 8px;
          letter-spacing: 3px;
          color: rgba(0, 245, 255, 0.4);
        }
        .agents-header-stats {
          display: flex;
          gap: 14px;
          font-size: 8px;
          color: rgba(0, 245, 255, 0.4);
        }
        .agents-header-stats .val { color: var(--cyan); }

        .agent-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 3px;
          padding: 4px 5px;
          overflow: hidden;
        }

        .agent-card {
          background: rgba(0, 15, 28, 0.85);
          border: 1px solid rgba(0, 245, 255, 0.14);
          border-radius: 5px;
          padding: 5px 7px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s, box-shadow 0.3s;
          cursor: default;
          min-width: 0;
        }
        .agent-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 5px;
          background: linear-gradient(
            135deg,
            rgba(0, 245, 255, 0.04) 0%,
            transparent 60%
          );
          pointer-events: none;
        }
        .agent-card.active-buy {
          border-color: rgba(0, 255, 136, 0.7);
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.4),
            inset 0 0 8px rgba(0, 255, 136, 0.06);
        }
        .agent-card.active-sell {
          border-color: rgba(255, 34, 85, 0.7);
          box-shadow: 0 0 10px rgba(255, 34, 85, 0.4),
            inset 0 0 8px rgba(255, 34, 85, 0.06);
        }
        .agent-card.rank-1 {
          border-color: rgba(255, 204, 0, 0.6);
          animation: rankGold 2s ease-in-out infinite;
        }
        .agent-card.rank-2 {
          border-color: rgba(180, 180, 200, 0.5);
          animation: rankSilver 2.5s ease-in-out infinite;
        }
        .agent-card.rank-3 {
          border-color: rgba(200, 120, 50, 0.5);
          animation: rankBronze 3s ease-in-out infinite;
        }

        .card-stripe {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1.5px;
          border-radius: 0 0 5px 5px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--cyan),
            transparent
          );
          opacity: 0.5;
          animation: glow 2s ease-in-out infinite;
        }

        .card-row1 {
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
        }
        .strat-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 4px currentColor;
        }
        .agent-name {
          font-size: 10px;
          font-weight: 700;
          color: var(--cyan);
          letter-spacing: 0.5px;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .agent-balance {
          font-size: 9px;
          font-weight: 700;
          flex-shrink: 0;
          animation: flicker 8s ease-in-out infinite;
        }
        .agent-balance.profit {
          color: var(--green);
          text-shadow: 0 0 5px rgba(0, 255, 136, 0.5);
        }
        .agent-balance.loss {
          color: var(--red);
          text-shadow: 0 0 5px rgba(255, 34, 85, 0.4);
        }

        .card-row2 {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .strat-label {
          font-size: 7px;
          letter-spacing: 0.5px;
          opacity: 0.55;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rank-badge {
          font-size: 6px;
          font-weight: 700;
          padding: 1px 3px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .rank-badge.gold {
          color: var(--gold);
          background: rgba(255, 204, 0, 0.12);
          border: 1px solid rgba(255, 204, 0, 0.3);
        }
        .rank-badge.silver {
          color: #bbc0cc;
          background: rgba(180, 180, 200, 0.1);
          border: 1px solid rgba(180, 180, 200, 0.25);
        }
        .rank-badge.bronze {
          color: #c87832;
          background: rgba(200, 120, 50, 0.1);
          border: 1px solid rgba(200, 120, 50, 0.25);
        }

        .card-row3 {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .action-tag {
          display: inline-block;
          padding: 1px 4px;
          border-radius: 2px;
          font-size: 6px;
          font-weight: 700;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }
        .action-tag.buy {
          background: rgba(0, 255, 136, 0.12);
          color: var(--green);
          border: 1px solid rgba(0, 255, 136, 0.25);
        }
        .action-tag.sell {
          background: rgba(255, 34, 85, 0.12);
          color: var(--red);
          border: 1px solid rgba(255, 34, 85, 0.25);
        }
        .action-tag.hold {
          background: rgba(0, 245, 255, 0.08);
          color: var(--cyan);
          border: 1px solid rgba(0, 245, 255, 0.18);
        }
        .action-tag.create {
          background: rgba(59, 130, 246, 0.12);
          color: var(--blue);
          border: 1px solid rgba(59, 130, 246, 0.25);
        }
        .last-token {
          font-size: 7px;
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }

        /* ── Footer ticker ───────────────────────────────────── */
        .t-footer {
          grid-area: footer;
          position: relative;
          z-index: 2;
          background: rgba(0, 8, 18, 0.92);
          border: 1px solid var(--border);
          border-radius: 4px;
          display: flex;
          align-items: center;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        .ticker-label {
          flex-shrink: 0;
          padding: 0 12px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 3px;
          color: rgba(0, 245, 255, 0.7);
          border-right: 1px solid var(--border);
          height: 100%;
          display: flex;
          align-items: center;
          background: rgba(0, 245, 255, 0.04);
          z-index: 2;
        }
        .ticker-wrap {
          flex: 1;
          overflow: hidden;
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
        }
        .ticker-inner {
          display: flex;
          align-items: center;
          gap: 0;
          white-space: nowrap;
          animation: tickerScroll 30s linear infinite;
        }
        .tick-entry {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          padding: 0 16px;
          border-right: 1px solid rgba(0, 245, 255, 0.08);
        }
        .tick-agent { color: var(--cyan); font-weight: 700; }
        .tick-action-buy { color: var(--green); font-weight: 700; }
        .tick-action-sell { color: var(--red); font-weight: 700; }
        .tick-action-create { color: var(--blue); font-weight: 700; }
        .tick-token { color: rgba(255, 255, 255, 0.8); }
        .tick-amount { color: var(--gold); font-weight: 700; }
        .tick-sep { color: rgba(0, 245, 255, 0.15); }

        /* ── Event banner ────────────────────────────────────── */
        .whale-banner {
          position: absolute;
          top: 64px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 4px;
          padding: 7px 26px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 3px;
          z-index: 100;
          animation: whaleBanner 4s ease-in-out forwards;
          backdrop-filter: blur(10px);
        }

        /* empty state */
        .empty-market {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(0, 245, 255, 0.25);
          font-size: 12px;
          letter-spacing: 2px;
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="t-header">
        <div className="header-left">
          <div>
            <div className="logo">
              DARWIN<span className="logo-dot">.</span>MEME
            </div>
            <div className="logo-sub">Evolution Terminal</div>
          </div>
        </div>

        <div className="header-center">
          <div className="stat-pill">
            <span className="label">GEN</span>
            <span className="value">{generation}</span>
          </div>
          <div className="stat-pill" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="label">TICK</span>
            <span className="value">{tick}/50</span>
            <div className="tick-bar">
              <div
                className="tick-fill"
                style={{ width: `${(tick / 50) * 100}%` }}
              />
            </div>
          </div>
          <div className="stat-pill">
            <span className="label">AGENTS</span>
            <span className="value">{agents.length}</span>
          </div>
          <div className="stat-pill">
            <span className="label">TOKENS</span>
            <span className="value">{activeTokenCount}</span>
          </div>
          <div className="stat-pill">
            <span className="label">TRADES</span>
            <span className="value">{totalVolume}</span>
          </div>
        </div>

        <div className="header-right">
          <span className="sys-label">SYS</span>
          <div className="status-dot green" />
          <div className="status-dot cyan" />
          <div className="status-dot purple" />
        </div>
      </header>

      {/* ── Market: token cards ─────────────────────────────── */}
      <div className="t-market">
        <div className="section-label">
          {"\u25B8"} TOKEN MARKET — LIVE BONDING CURVES
        </div>
        {tokens.length > 0 ? (
          <div className="token-row">
            {tokens.map((token) => {
              const priceStr = token.current_price.toFixed(4);
              const dotIdx = priceStr.indexOf(".");
              const priceInt = priceStr.slice(0, dotIdx);
              const priceDec = priceStr.slice(dotIdx);
              const bondPct = Math.min(100, Math.max(0, (token.bonding_progress ?? 0) * 100));
              const highlight = activeTokens[token.token_id];
              const highlightClass = highlight === "buy"
                ? "highlight-buy"
                : highlight === "sell"
                  ? "highlight-sell"
                  : "";

              return (
                <div
                  key={token.token_id}
                  className={`token-card ${highlightClass}`}
                >
                  <div className="corner-tl" />
                  <div className="corner-tr" />
                  <div className="corner-bl" />
                  <div className="corner-br" />

                  <div className="token-header">
                    <div>
                      <div className="token-name">{token.name}</div>
                      <div className="token-symbol">${token.name}</div>
                    </div>
                    <span className={`status-badge ${token.state}`}>
                      {token.state.toUpperCase()}
                    </span>
                  </div>

                  <div className="token-price">
                    <span className="price-int">{priceInt}</span>
                    <span className="price-dec">{priceDec}</span>
                  </div>

                  <div className="token-stats">
                    <div className="token-stat-row">
                      <span>HOLDERS</span>
                      <span>{token.holder_count}</span>
                    </div>
                    <div className="token-stat-row">
                      <span>SUPPLY</span>
                      <span>{token.supply_sold.toFixed(1)}</span>
                    </div>
                    <div className="token-stat-row">
                      <span>RAISED</span>
                      <span>${token.total_raised.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="bond-label">
                      <span>BONDING</span>
                      <span>{bondPct.toFixed(0)}%</span>
                    </div>
                    <div className="bond-bar">
                      <div
                        className="bond-fill"
                        style={{ width: `${bondPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-market">
            AWAITING TOKEN CREATION...
          </div>
        )}
      </div>

      {/* ── Agent Grid ──────────────────────────────────────── */}
      <div className="t-agents">
        <div className="agents-header">
          <div className="agents-header-title">
            {"\u25B8"} AGENT POPULATION — {agents.length} ACTIVE TRADERS
          </div>
          <div className="agents-header-stats">
            <span>
              RANKED BY BALANCE &nbsp;|&nbsp; TOP:{" "}
              <span className="val">{topAgent}</span>
            </span>
            <span>
              AVG: <span className="val">${avgBalance}</span>
            </span>
          </div>
        </div>
        <div className="agent-grid">
          {sortedAgents.map((agent, idx) => {
            const rank = idx + 1;
            const strat = getDominantStrategy(
              agent.genome as unknown as Record<string, unknown>,
            );
            const isProfit = agent.balance >= 100;
            const lastAction =
              agent.action_history.length > 0
                ? agent.action_history[agent.action_history.length - 1].action
                : null;
            const highlight = activeAgents[agent.agent_id];

            let cardClass = "agent-card";
            if (highlight === "buy") cardClass += " active-buy";
            else if (highlight === "sell") cardClass += " active-sell";
            if (rank === 1) cardClass += " rank-1";
            else if (rank === 2) cardClass += " rank-2";
            else if (rank === 3) cardClass += " rank-3";

            return (
              <div key={agent.agent_id} className={cardClass}>
                <div className="card-stripe" />
                {/* Row 1: dot + name + balance */}
                <div className="card-row1">
                  <div
                    className="strat-dot"
                    style={{ background: strat.color, color: strat.color }}
                  />
                  <span className="agent-name">{agent.name}</span>
                  <span
                    className={`agent-balance ${isProfit ? "profit" : "loss"}`}
                  >
                    ${agent.balance.toFixed(1)}
                  </span>
                </div>
                {/* Row 2: strategy label + rank badge */}
                <div className="card-row2">
                  <span className="strat-label" style={{ color: strat.color }}>
                    {strat.label}
                  </span>
                  {rank <= 3 && (
                    <span
                      className={`rank-badge ${
                        rank === 1 ? "gold" : rank === 2 ? "silver" : "bronze"
                      }`}
                    >
                      #{rank}
                    </span>
                  )}
                </div>
                {/* Row 3: last action */}
                {lastAction && (
                  <div className="card-row3">
                    <span
                      className={`action-tag ${lastAction.type}`}
                    >
                      {lastAction.type.toUpperCase()}
                    </span>
                    <span className="last-token">
                      {lastAction.token_name || ""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer Ticker ───────────────────────────────────── */}
      <footer className="t-footer">
        <div className="ticker-label">{"\u25B6"} LIVE TRADES</div>
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {tickerEntries.length > 0 ? (
              <>
                {/* Duplicate for seamless scroll */}
                {[...tickerEntries, ...tickerEntries].map((entry, i) => (
                  <span key={i} className="tick-entry">
                    <span
                      className={
                        entry.type === "buy"
                          ? "tick-action-buy"
                          : entry.type === "sell"
                            ? "tick-action-sell"
                            : "tick-action-create"
                      }
                    >
                      {entry.type.toUpperCase()}
                    </span>
                    <span className="tick-token">{entry.text}</span>
                    <span className="tick-sep">|</span>
                  </span>
                ))}
              </>
            ) : (
              <span className="tick-entry" style={{ color: "rgba(0,245,255,0.25)" }}>
                WAITING FOR TRADES...
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* ── Event Banner ────────────────────────────────────── */}
      {banner && (
        <div
          className="whale-banner"
          key={Date.now()}
          style={{
            background: `${banner.color}18`,
            border: `1px solid ${banner.color}80`,
            color: banner.color,
            textShadow: `0 0 8px ${banner.color}B3, 0 0 20px ${banner.color}4D`,
            boxShadow: `0 0 8px ${banner.color}B3, 0 0 20px ${banner.color}4D`,
          }}
        >
          {banner.icon}&nbsp; {banner.text}
        </div>
      )}
    </div>
  );
}
