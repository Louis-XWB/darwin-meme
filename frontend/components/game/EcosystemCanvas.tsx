"use client";

import { useEffect, useRef, useCallback } from "react";
import type { AgentData, TokenData, TradeData, EventData } from "@/lib/types";
import {
  AgentEntity,
  TokenEntity,
  Particle,
  EventEffect,
  EvoBanner,
  createEventEffect,
  drawEventEffect,
  drawEvoBanner,
  drawGrassBackground,
} from "./entities";

interface EcosystemCanvasProps {
  agents: AgentData[];
  tokens: TokenData[];
  trades: TradeData[];
  events: EventData[];
  generation: number;
  tick: number;
  prevGeneration: number;
}

export function EcosystemCanvas({
  agents,
  tokens,
  trades,
  events,
  generation,
  tick,
  prevGeneration,
}: EcosystemCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentEntities = useRef<Map<string, AgentEntity>>(new Map());
  const tokenEntities = useRef<Map<string, TokenEntity>>(new Map());
  const particles = useRef<Particle[]>([]);
  const activeEffects = useRef<EventEffect[]>([]);
  const bannerRef = useRef<EvoBanner | null>(null);
  const lastTime = useRef<number>(0);
  const animFrameId = useRef<number>(0);
  const processedTick = useRef<number>(-1);

  const syncAgents = useCallback((canvasW: number, canvasH: number) => {
    const currentIds = new Set(agents.map((a) => a.agent_id));
    const entityMap = agentEntities.current;

    for (const [id, entity] of entityMap) {
      if (!currentIds.has(id) && !entity.dying) {
        entity.dying = true;
        // Death particles (red poof)
        for (let i = 0; i < 10; i++) {
          particles.current.push(new Particle(entity.x, entity.y, "#ef4444", 2, false));
        }
      }
    }

    const sorted = [...agents].sort((a, b) => b.balance - a.balance);

    sorted.forEach((agent, rank) => {
      let entity = entityMap.get(agent.agent_id);
      if (!entity) {
        entity = new AgentEntity(agent.agent_id, agent.name, canvasW, canvasH);
        entityMap.set(agent.agent_id, entity);
      }

      const lastAction = agent.action_history.length > 0
        ? agent.action_history[agent.action_history.length - 1].action.type
        : null;

      entity.syncFromData(
        agent.balance,
        agent.genome as unknown as Record<string, unknown>,
        rank,
        lastAction,
      );
    });

    for (const [id, entity] of entityMap) {
      if (entity.dead) entityMap.delete(id);
    }
  }, [agents]);

  const syncTokens = useCallback((canvasW: number, canvasH: number) => {
    const currentIds = new Set(tokens.map((t) => t.token_id));
    const entityMap = tokenEntities.current;

    for (const [id, entity] of entityMap) {
      if (!currentIds.has(id) && !entity.dying && !entity.graduating) {
        entity.dying = true;
      }
    }

    for (const token of tokens) {
      let entity = entityMap.get(token.token_id);
      if (!entity) {
        entity = new TokenEntity(token.token_id, token.name, token.theme, canvasW, canvasH);
        entityMap.set(token.token_id, entity);
      }
      entity.syncFromData(token.bonding_progress, token.state);

      if (entity.graduating && entity.opacity > 0.5) {
        // Graduation = gold coin explosion!
        for (let i = 0; i < 25; i++) {
          particles.current.push(new Particle(entity.x + 30, entity.y, "#ffd700", 4, true));
        }
        entity.graduating = false;
        entity.dying = true;
      }
    }

    for (const [id, entity] of entityMap) {
      if (entity.dead) entityMap.delete(id);
    }
  }, [tokens]);

  const processTrades = useCallback(() => {
    // Only process trades once per tick
    if (tick === processedTick.current) return;
    processedTick.current = tick;

    for (const trade of trades) {
      const agentEntity = agentEntities.current.get(trade.agent_id);
      if (!agentEntity) continue;

      const tokenId = trade.token_id;
      const tokenEntity = tokenId ? tokenEntities.current.get(tokenId) : null;

      if (trade.type === "buy" && tokenEntity) {
        agentEntity.dashToward(tokenEntity.x + 30, tokenEntity.y + 25);
        agentEntity.showAction("+BUY " + (trade.token_name || ""), "#22c55e");
        // Gold coins
        for (let i = 0; i < 5; i++) {
          particles.current.push(new Particle(tokenEntity.x + 30, tokenEntity.y, "#ffd700", 2, true));
        }
      } else if (trade.type === "sell" && tokenEntity) {
        agentEntity.pushAway(tokenEntity.x + 30, tokenEntity.y + 25);
        agentEntity.showAction("-SELL " + (trade.token_name || ""), "#ef4444");
        for (let i = 0; i < 3; i++) {
          particles.current.push(new Particle(agentEntity.x, agentEntity.y, "#ef4444", 1.5, true));
        }
      } else if (trade.type === "create") {
        agentEntity.showAction("NEW: " + (trade.token_name || ""), "#3b82f6");
        agentEntity.showSpeech("Opening shop!");
        for (let i = 0; i < 8; i++) {
          particles.current.push(new Particle(agentEntity.x, agentEntity.y, "#3b82f6", 2, false));
        }
      }
    }
  }, [trades, tick]);

  const processEvents = useCallback(() => {
    for (const event of events) {
      let tx: number | undefined;
      let ty: number | undefined;

      if (event.target_token_id) {
        const te = tokenEntities.current.get(event.target_token_id);
        if (te) { tx = te.x + 30; ty = te.y + 20; }
      }

      activeEffects.current.push(
        createEventEffect(event.type, tx, ty, event.target_theme || undefined),
      );
    }
  }, [events]);

  useEffect(() => {
    if (generation > prevGeneration && prevGeneration >= 0) {
      bannerRef.current = {
        text: `Generation ${prevGeneration} \u2192 ${generation}`,
        timer: 0,
        duration: 3.5,
      };
    }
  }, [generation, prevGeneration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    lastTime.current = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime.current) / 1000);
      lastTime.current = now;

      const w = canvas.width;
      const h = canvas.height;

      syncAgents(w, h);
      syncTokens(w, h);
      processTrades();
      processEvents();

      // FUD shake
      const fudEffect = activeEffects.current.find(
        (e) => e.type === "fud" && e.timer < e.duration,
      );

      ctx.save();
      if (fudEffect) {
        const shake = (1 - fudEffect.timer / fudEffect.duration) * 5;
        ctx.translate(
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake,
        );
      }

      // Draw grass background
      drawGrassBackground(ctx, w, h);

      // Draw tokens (market stalls) — behind agents
      for (const entity of tokenEntities.current.values()) {
        entity.update(dt);
        entity.draw(ctx);
      }

      // Draw agents (pixel characters) — sorted by Y for depth
      const sortedAgents = [...agentEntities.current.values()].sort((a, b) => a.y - b.y);
      for (const entity of sortedAgents) {
        entity.update(dt, w, h);
        entity.draw(ctx);
      }

      // Draw particles (coins, effects)
      particles.current = particles.current.filter((p) => {
        p.update(dt);
        if (p.dead) return false;
        p.draw(ctx);
        return true;
      });
      if (particles.current.length > 200) {
        particles.current = particles.current.slice(-200);
      }

      // Draw event effects
      activeEffects.current = activeEffects.current.filter((effect) => {
        effect.timer += dt;
        if (effect.timer > effect.duration) return false;
        drawEventEffect(ctx, effect, w, h);
        return true;
      });

      // Draw banner
      if (bannerRef.current) {
        bannerRef.current.timer += dt;
        drawEvoBanner(ctx, bannerRef.current, w, h);
        if (bannerRef.current.timer > bannerRef.current.duration) {
          bannerRef.current = null;
        }
      }

      ctx.restore();

      animFrameId.current = requestAnimationFrame(frame);
    };

    animFrameId.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      window.removeEventListener("resize", resize);
    };
  }, [syncAgents, syncTokens, processTrades, processEvents]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}
