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

  const syncAgents = useCallback((canvasW: number, canvasH: number) => {
    const currentIds = new Set(agents.map((a) => a.agent_id));
    const entityMap = agentEntities.current;

    for (const [id, entity] of entityMap) {
      if (!currentIds.has(id) && !entity.dying) {
        entity.dying = true;
        for (let i = 0; i < 12; i++) {
          particles.current.push(new Particle(entity.x, entity.y, "#ef4444", 3));
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
        for (let i = 0; i < 20; i++) {
          particles.current.push(new Particle(entity.x, entity.y, "#eab308", 4));
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
    for (const trade of trades) {
      const agentEntity = agentEntities.current.get(trade.agent_id);
      if (!agentEntity) continue;

      const tokenId = trade.token_id;
      if (!tokenId) continue;
      const tokenEntity = tokenEntities.current.get(tokenId);
      if (!tokenEntity) continue;

      if (trade.type === "buy") {
        agentEntity.dashToward(tokenEntity.x, tokenEntity.y);
        particles.current.push(new Particle(tokenEntity.x, tokenEntity.y, "#22c55e", 2));
      } else if (trade.type === "sell") {
        agentEntity.pushAway(tokenEntity.x, tokenEntity.y);
        particles.current.push(new Particle(agentEntity.x, agentEntity.y, "#ef4444", 2));
      } else if (trade.type === "create") {
        for (let i = 0; i < 8; i++) {
          particles.current.push(new Particle(agentEntity.x, agentEntity.y, "#3b82f6", 2));
        }
      }
    }
  }, [trades]);

  const processEvents = useCallback(() => {
    for (const event of events) {
      let tx: number | undefined;
      let ty: number | undefined;

      if (event.target_token_id) {
        const te = tokenEntities.current.get(event.target_token_id);
        if (te) { tx = te.x; ty = te.y; }
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
        duration: 3,
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

      const fudEffect = activeEffects.current.find(
        (e) => e.type === "fud" && e.timer < e.duration,
      );

      ctx.save();
      if (fudEffect) {
        const shake = (1 - fudEffect.timer / fudEffect.duration) * 4;
        ctx.translate(
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake,
        );
      }

      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(55, 65, 81, 0.15)";
      ctx.lineWidth = 0.5;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      for (const entity of tokenEntities.current.values()) {
        entity.update(dt);
        entity.draw(ctx);
      }

      for (const entity of agentEntities.current.values()) {
        entity.update(dt, w, h);
        entity.draw(ctx);
      }

      particles.current = particles.current.filter((p) => {
        p.update(dt);
        if (p.dead) return false;
        p.draw(ctx);
        return true;
      });
      if (particles.current.length > 200) {
        particles.current = particles.current.slice(-200);
      }

      activeEffects.current = activeEffects.current.filter((effect) => {
        effect.timer += dt;
        if (effect.timer > effect.duration) return false;
        drawEventEffect(ctx, effect, w, h);
        return true;
      });

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
      style={{ background: "#030712" }}
    />
  );
}
