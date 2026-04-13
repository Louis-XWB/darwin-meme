# Ecosystem Game View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen animated 2D ecosystem view where AI agents appear as glowing organisms competing in a visual meme token world, switchable from the existing data Dashboard.

**Architecture:** Pure frontend addition. New `components/game/` directory with 4 files: entity classes (physics/rendering), Canvas renderer (animation loop), HUD overlay (HTML), and container component. Page.tsx gets a view toggle. All data comes from the existing `useSimulation` hook — zero backend changes.

**Tech Stack:** HTML5 Canvas 2D, requestAnimationFrame, React refs, existing TypeScript types

---

## File Map

| File | Responsibility |
|------|---------------|
| `frontend/components/game/entities.ts` | AgentEntity, TokenEntity, Particle classes — position, velocity, physics, color, rendering methods |
| `frontend/components/game/EcosystemCanvas.tsx` | Canvas component — animation loop, entity management, data sync, event effects |
| `frontend/components/game/GameHud.tsx` | HTML overlay — top 3 leaderboard, commentary, token stats, event icons |
| `frontend/components/game/GameView.tsx` | Container — positions Canvas + HUD together |
| `frontend/app/page.tsx` | Modified — add view toggle state, conditionally render Dashboard or GameView |
| `frontend/components/shared/Controls.tsx` | Modified — add view toggle buttons |

---

## Task 1: Entity Classes

**Files:**
- Create: `frontend/components/game/entities.ts`

- [ ] **Step 1: Create entities.ts with all entity classes**

```typescript
// frontend/components/game/entities.ts

// --- Constants ---

const STRATEGY_COLORS: Record<string, string> = {
  risk_appetite: "#ef4444",
  follow_leader: "#3b82f6",
  creation_frequency: "#22c55e",
  contrarian: "#a855f7",
  experiment_rate: "#eab308",
};

const THEME_COLORS: Record<string, string> = {
  animal: "#f59e0b",
  politics: "#ef4444",
  tech: "#3b82f6",
  humor: "#22c55e",
  food: "#f97316",
  crypto: "#a855f7",
  popculture: "#ec4899",
  absurd: "#6366f1",
};

const STRATEGY_KEYS = Object.keys(STRATEGY_COLORS);

// --- Helpers ---

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, t);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function dominantTrait(genome: Record<string, unknown>): string {
  let best = STRATEGY_KEYS[0];
  let bestVal = -1;
  for (const key of STRATEGY_KEYS) {
    const val = (genome[key] as number) ?? 0;
    if (val > bestVal) {
      bestVal = val;
      best = key;
    }
  }
  return best;
}

// --- Particle ---

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;

  constructor(x: number, y: number, color: string, speed: number = 2) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed * (0.5 + Math.random());
    this.vy = Math.sin(angle) * speed * (0.5 + Math.random());
    this.life = 1.0;
    this.maxLife = 0.5 + Math.random() * 0.5; // 0.5 ~ 1.0 seconds
    this.color = color;
    this.radius = 2 + Math.random() * 3;
  }

  update(dt: number): void {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= dt / this.maxLife;
  }

  get dead(): boolean {
    return this.life <= 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = Math.max(0, this.life);
    const { r, g, b } = hexToRgb(this.color);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fill();
  }
}

// --- AgentEntity ---

export class AgentEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
  color: string;
  targetColor: string;
  glowIntensity: number;
  pulsePhase: number;
  pulseSpeed: number;
  opacity: number;
  dying: boolean;
  spawning: boolean;

  constructor(id: string, name: string, canvasW: number, canvasH: number) {
    this.id = id;
    this.name = name;
    this.x = 100 + Math.random() * (canvasW - 200);
    this.y = 100 + Math.random() * (canvasH - 200);
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = 20;
    this.targetRadius = 20;
    this.color = "#22c55e";
    this.targetColor = "#22c55e";
    this.glowIntensity = 10;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = 1.5;
    this.opacity = 0; // starts transparent for spawn-in
    this.dying = false;
    this.spawning = true;
  }

  syncFromData(
    balance: number,
    genome: Record<string, unknown>,
    rank: number,
    recentAction: string | null,
  ): void {
    // Size from balance (15 ~ 60)
    this.targetRadius = 15 + Math.min(45, (balance / 200) * 45);

    // Color from dominant trait
    const trait = dominantTrait(genome);
    this.targetColor = STRATEGY_COLORS[trait] || "#22c55e";

    // Glow from rank
    this.glowIntensity = rank <= 2 ? 25 : rank <= 4 ? 15 : 8;

    // Pulse speed from activity
    this.pulseSpeed = recentAction && recentAction !== "hold" ? 4.0 : 1.5;
  }

  update(dt: number, canvasW: number, canvasH: number): void {
    // Spawn-in fade
    if (this.spawning) {
      this.opacity = Math.min(1, this.opacity + dt * 2);
      if (this.opacity >= 1) this.spawning = false;
    }

    // Death shrink
    if (this.dying) {
      this.opacity -= dt * 2;
      this.targetRadius = 0;
    }

    // Lerp radius and color
    this.radius = lerp(this.radius, this.targetRadius, dt * 3);
    this.color = this.targetColor; // instant color switch is fine

    // Physics: drift
    this.x += this.vx;
    this.y += this.vy;

    // Brownian jitter
    this.vx += (Math.random() - 0.5) * 0.05;
    this.vy += (Math.random() - 0.5) * 0.05;

    // Friction
    this.vx *= 0.99;
    this.vy *= 0.99;

    // Wall bounce
    const margin = this.radius + 10;
    if (this.x < margin) { this.x = margin; this.vx = Math.abs(this.vx); }
    if (this.x > canvasW - margin) { this.x = canvasW - margin; this.vx = -Math.abs(this.vx); }
    if (this.y < margin) { this.y = margin; this.vy = Math.abs(this.vy); }
    if (this.y > canvasH - margin) { this.y = canvasH - margin; this.vy = -Math.abs(this.vy); }

    // Pulse
    this.pulsePhase += dt * this.pulseSpeed;
  }

  dashToward(tx: number, ty: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx += (dx / dist) * 3;
    this.vy += (dy / dist) * 3;
  }

  pushAway(tx: number, ty: number): void {
    const dx = this.x - tx;
    const dy = this.y - ty;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx += (dx / dist) * 2;
    this.vy += (dy / dist) * 2;
  }

  get dead(): boolean {
    return this.dying && this.opacity <= 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.opacity <= 0) return;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
    const r = this.radius * pulse;
    const { r: cr, g: cg, b: cb } = hexToRgb(this.color);

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.glowIntensity;

    // Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.7)`;
    ctx.fill();

    // Inner bright core
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,0.4)`;
    ctx.fill();

    ctx.shadowBlur = 0;

    // Name label
    ctx.fillStyle = `rgba(255,255,255,${this.opacity * 0.8})`;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(this.name, this.x, this.y - r - 6);

    ctx.restore();
  }
}

// --- TokenEntity ---

export class TokenEntity {
  id: string;
  name: string;
  theme: string;
  x: number;
  y: number;
  radius: number;
  targetRadius: number;
  color: string;
  state: "active" | "graduated" | "dead";
  opacity: number;
  pulsePhase: number;
  dying: boolean;
  graduating: boolean;

  constructor(id: string, name: string, theme: string, canvasW: number, canvasH: number) {
    this.id = id;
    this.name = name;
    this.theme = theme;
    this.x = 80 + Math.random() * (canvasW - 160);
    this.y = 80 + Math.random() * (canvasH - 160);
    this.radius = 8;
    this.targetRadius = 8;
    this.color = THEME_COLORS[theme] || "#6366f1";
    this.state = "active";
    this.opacity = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.dying = false;
    this.graduating = false;
  }

  syncFromData(bondingProgress: number, state: "active" | "graduated" | "dead"): void {
    this.targetRadius = 8 + bondingProgress * 20;
    if (state !== this.state) {
      if (state === "graduated") this.graduating = true;
      if (state === "dead") this.dying = true;
      this.state = state;
    }
  }

  update(dt: number): void {
    this.radius = lerp(this.radius, this.targetRadius, dt * 3);
    this.pulsePhase += dt * 2;

    if (this.dying) {
      this.opacity -= dt * 1.5;
    } else if (this.graduating) {
      this.opacity -= dt * 0.8;
    } else {
      this.opacity = Math.min(1, this.opacity + dt * 2);
    }
  }

  get dead(): boolean {
    return (this.dying || this.graduating) && this.opacity <= 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.opacity <= 0) return;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.08;
    const r = this.radius * pulse;
    const { r: cr, g: cg, b: cb } = hexToRgb(this.color);

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;

    // Hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = this.x + r * Math.cos(angle);
      const py = this.y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.5)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.9)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Name
    ctx.fillStyle = `rgba(255,255,255,${this.opacity * 0.6})`;
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(this.name, this.x, this.y + r + 12);

    ctx.restore();
  }
}

// --- EventEffect ---

export interface EventEffect {
  type: "whale" | "fud" | "viral" | "crisis" | "narrative";
  timer: number;
  duration: number;
  targetX?: number;
  targetY?: number;
  theme?: string;
}

export function createEventEffect(
  type: EventEffect["type"],
  targetX?: number,
  targetY?: number,
  theme?: string,
): EventEffect {
  const durations: Record<string, number> = {
    whale: 2, fud: 1, viral: 1.5, crisis: 1, narrative: 2,
  };
  return { type, timer: 0, duration: durations[type] || 1.5, targetX, targetY, theme };
}

export function drawEventEffect(
  ctx: CanvasRenderingContext2D,
  effect: EventEffect,
  canvasW: number,
  canvasH: number,
): void {
  const progress = effect.timer / effect.duration;
  if (progress > 1) return;

  ctx.save();

  if (effect.type === "whale") {
    // Whale silhouette swimming across bottom
    const wx = -100 + progress * (canvasW + 200);
    const wy = canvasH - 80;
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#3b82f6";
    // Simple whale shape: ellipse body + tail
    ctx.beginPath();
    ctx.ellipse(wx, wy, 80, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(wx + 70, wy);
    ctx.lineTo(wx + 100, wy - 25);
    ctx.lineTo(wx + 100, wy + 25);
    ctx.closePath();
    ctx.fill();
  } else if (effect.type === "fud") {
    // Red tint overlay + shake handled in canvas transform
    ctx.globalAlpha = 0.15 * (1 - progress);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (effect.type === "viral") {
    // Expanding ring from target
    if (effect.targetX != null && effect.targetY != null) {
      const ringRadius = progress * 200;
      ctx.globalAlpha = 0.3 * (1 - progress);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.targetX, effect.targetY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (effect.type === "crisis") {
    // Gray pulse from target
    if (effect.targetX != null && effect.targetY != null) {
      ctx.globalAlpha = 0.2 * (1 - progress);
      ctx.fillStyle = "#6b7280";
      ctx.beginPath();
      ctx.arc(effect.targetX, effect.targetY, progress * 100, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (effect.type === "narrative") {
    // Theme text floating across top
    ctx.globalAlpha = 0.6 * (1 - progress);
    ctx.fillStyle = "#eab308";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      `${effect.theme?.toUpperCase() || "NARRATIVE"} WAVE`,
      canvasW / 2,
      40 + progress * 20,
    );
  }

  ctx.restore();
}

// --- Evolution Banner ---

export interface EvoBanner {
  text: string;
  timer: number;
  duration: number;
}

export function drawEvoBanner(
  ctx: CanvasRenderingContext2D,
  banner: EvoBanner,
  canvasW: number,
  canvasH: number,
): void {
  const progress = banner.timer / banner.duration;
  if (progress > 1) return;

  // Fade in first half, fade out second half
  const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.shadowColor = "#34d399";
  ctx.shadowBlur = 20;
  ctx.fillText(banner.text, canvasW / 2, canvasH / 2);
  ctx.restore();
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/weibin/job/hackathon/four_hackason/frontend && npx tsc --noEmit components/game/entities.ts 2>&1 || echo "check manually"`

- [ ] **Step 3: Commit**

```bash
git add frontend/components/game/entities.ts
git commit -m "feat: add game entity classes (AgentEntity, TokenEntity, Particle, effects)"
```

---

## Task 2: EcosystemCanvas Component

**Files:**
- Create: `frontend/components/game/EcosystemCanvas.tsx`

- [ ] **Step 1: Create EcosystemCanvas.tsx**

```tsx
// frontend/components/game/EcosystemCanvas.tsx
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
  const banner = useRef<EvoBanner | null>(null);
  const lastTime = useRef<number>(0);
  const animFrameId = useRef<number>(0);

  // Sync agent data to entities
  const syncAgents = useCallback((canvasW: number, canvasH: number) => {
    const currentIds = new Set(agents.map((a) => a.agent_id));
    const entityMap = agentEntities.current;

    // Remove dead agents
    for (const [id, entity] of entityMap) {
      if (!currentIds.has(id) && !entity.dying) {
        entity.dying = true;
        // Death particles
        for (let i = 0; i < 12; i++) {
          particles.current.push(new Particle(entity.x, entity.y, "#ef4444", 3));
        }
      }
    }

    // Sort by balance for rank
    const sorted = [...agents].sort((a, b) => b.balance - a.balance);

    // Add/update agents
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

    // Clean up fully dead entities
    for (const [id, entity] of entityMap) {
      if (entity.dead) entityMap.delete(id);
    }
  }, [agents]);

  // Sync token data to entities
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

      // Graduation particles
      if (entity.graduating && entity.opacity > 0.5) {
        for (let i = 0; i < 20; i++) {
          particles.current.push(new Particle(entity.x, entity.y, "#eab308", 4));
        }
        entity.graduating = false;
        entity.dying = true; // fade out after particles
      }
    }

    for (const [id, entity] of entityMap) {
      if (entity.dead) entityMap.delete(id);
    }
  }, [tokens]);

  // Process trade animations
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

  // Process market events
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

  // Generation transition banner
  useEffect(() => {
    if (generation > prevGeneration && prevGeneration >= 0) {
      banner.current = {
        text: `Generation ${prevGeneration} → ${generation}`,
        timer: 0,
        duration: 3,
      };
    }
  }, [generation, prevGeneration]);

  // Main animation loop
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

      // Sync data
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
        const shake = (1 - fudEffect.timer / fudEffect.duration) * 4;
        ctx.translate(
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake,
        );
      }

      // Clear
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      // Background grid
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

      // Update and draw tokens
      for (const entity of tokenEntities.current.values()) {
        entity.update(dt);
        entity.draw(ctx);
      }

      // Update and draw agents
      for (const entity of agentEntities.current.values()) {
        entity.update(dt, w, h);
        entity.draw(ctx);
      }

      // Update and draw particles
      particles.current = particles.current.filter((p) => {
        p.update(dt);
        if (p.dead) return false;
        p.draw(ctx);
        return true;
      });
      // Cap particles
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
      if (banner.current) {
        banner.current.timer += dt;
        drawEvoBanner(ctx, banner.current, w, h);
        if (banner.current.timer > banner.current.duration) {
          banner.current = null;
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/game/EcosystemCanvas.tsx
git commit -m "feat: implement EcosystemCanvas with animation loop, entity sync, and effects"
```

---

## Task 3: GameHud Component

**Files:**
- Create: `frontend/components/game/GameHud.tsx`

- [ ] **Step 1: Create GameHud.tsx**

```tsx
// frontend/components/game/GameHud.tsx
"use client";

import type { AgentData, TokenData, EventData } from "@/lib/types";

interface GameHudProps {
  agents: AgentData[];
  tokens: TokenData[];
  events: EventData[];
  generation: number;
  tick: number;
  commentary: string[];
}

const EVENT_ICONS: Record<string, string> = {
  whale: "\uD83D\uDC0B",
  fud: "\uD83D\uDE28",
  viral: "\uD83D\uDD25",
  crisis: "\uD83D\uDCA0",
  narrative: "\uD83D\uDCE2",
};

export function GameHud({
  agents,
  tokens,
  events,
  generation,
  tick,
  commentary,
}: GameHudProps) {
  const sorted = [...agents].sort((a, b) => b.balance - a.balance);
  const top3 = sorted.slice(0, 3);
  const activeCount = tokens.filter((t) => t.state === "active").length;
  const gradCount = tokens.filter((t) => t.state === "graduated").length;
  const latestComment = commentary.length > 0 ? commentary[commentary.length - 1] : "";
  const medals = ["\uD83C\uDFC6", "\uD83E\uDD48", "\uD83E\uDD49"];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top-left: Gen + Tick */}
      <div className="absolute top-4 left-4 font-mono text-sm">
        <span className="text-gray-500">Gen </span>
        <span className="text-emerald-400 font-bold text-lg">{generation}</span>
        <span className="text-gray-600 mx-2">|</span>
        <span className="text-gray-500">Tick </span>
        <span className="text-blue-400">{tick}</span>
        <span className="text-gray-600">/50</span>
      </div>

      {/* Bottom-left: Top 3 */}
      <div className="absolute bottom-16 left-4 space-y-1">
        {top3.map((agent, i) => (
          <div key={agent.agent_id} className="flex items-center gap-2 text-sm">
            <span>{medals[i]}</span>
            <span className="text-white font-medium">{agent.name}</span>
            <span className="text-emerald-400 font-mono">{agent.balance.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Bottom-center: Token stats + event icons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-gray-500">
        <span>
          <span className="text-emerald-400">{activeCount}</span> active
        </span>
        <span>
          <span className="text-yellow-400">{gradCount}</span> graduated
        </span>
        {events.length > 0 && (
          <span className="flex gap-1">
            {events.map((e, i) => (
              <span key={i} className="text-base">{EVENT_ICONS[e.type] || ""}</span>
            ))}
          </span>
        )}
      </div>

      {/* Bottom-right: Latest commentary */}
      {latestComment && (
        <div className="absolute bottom-4 right-4 max-w-xs text-xs text-gray-400 bg-gray-900/60 rounded px-3 py-2 backdrop-blur-sm">
          <span className="text-gray-600">AI: </span>
          {latestComment}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/game/GameHud.tsx
git commit -m "feat: implement GameHud overlay with leaderboard, stats, and commentary"
```

---

## Task 4: GameView Container

**Files:**
- Create: `frontend/components/game/GameView.tsx`

- [ ] **Step 1: Create GameView.tsx**

```tsx
// frontend/components/game/GameView.tsx
"use client";

import { useRef } from "react";
import type { AgentData, TokenData, TradeData, EventData } from "@/lib/types";
import { EcosystemCanvas } from "./EcosystemCanvas";
import { GameHud } from "./GameHud";

interface GameViewProps {
  agents: AgentData[];
  tokens: TokenData[];
  trades: TradeData[];
  events: EventData[];
  generation: number;
  tick: number;
  commentary: string[];
  prevGeneration: number;
}

export function GameView({
  agents,
  tokens,
  trades,
  events,
  generation,
  tick,
  commentary,
  prevGeneration,
}: GameViewProps) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <EcosystemCanvas
        agents={agents}
        tokens={tokens}
        trades={trades}
        events={events}
        generation={generation}
        tick={tick}
        prevGeneration={prevGeneration}
      />
      <GameHud
        agents={agents}
        tokens={tokens}
        events={events}
        generation={generation}
        tick={tick}
        commentary={commentary}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/game/GameView.tsx
git commit -m "feat: implement GameView container combining Canvas and HUD"
```

---

## Task 5: Integrate View Toggle into Page + Controls

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/components/shared/Controls.tsx`

- [ ] **Step 1: Update Controls.tsx to add view toggle**

Add `view` and `onViewChange` props to the Controls component. Add toggle buttons before the speed controls.

Replace the entire file `frontend/components/shared/Controls.tsx` with:

```tsx
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
```

- [ ] **Step 2: Update page.tsx with view toggle and GameView**

Replace the entire file `frontend/app/page.tsx` with:

```tsx
"use client";

import { useRef, useState } from "react";
import { useSimulation } from "@/hooks/useSimulation";
import { Controls } from "@/components/shared/Controls";
import { MarketView } from "@/components/market/MarketView";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { EvolutionView } from "@/components/evolution/EvolutionView";
import { CommentatorView } from "@/components/commentator/CommentatorView";
import { GameView } from "@/components/game/GameView";

export default function Dashboard() {
  const { state, startSimulation, stopSimulation, setSpeed } = useSimulation();
  const [view, setView] = useState<"data" | "game">("game");
  const prevGeneration = useRef(0);

  // Track previous generation for evolution banner
  if (state.generation !== prevGeneration.current && state.generation > 0) {
    // Update after render cycle
    const prev = prevGeneration.current;
    prevGeneration.current = state.generation;
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
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/weibin/job/hackathon/four_hackason/frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Fix any build errors**

Address TypeScript or build errors if any.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/page.tsx frontend/components/shared/Controls.tsx
git commit -m "feat: integrate Game view toggle into Dashboard with Data/Game switch"
```

---

## Task 6: Build Verification + Polish

- [ ] **Step 1: Full build check**

Run: `cd /Users/weibin/job/hackathon/four_hackason/frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Backend tests still pass**

Run: `cd /Users/weibin/job/hackathon/four_hackason/backend && python -m pytest tests/ -v`
Expected: All 66 tests PASS.

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: resolve build issues for game view integration"
```
