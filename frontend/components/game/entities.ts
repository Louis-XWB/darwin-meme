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
    this.maxLife = 0.5 + Math.random() * 0.5;
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
    this.opacity = 0;
    this.dying = false;
    this.spawning = true;
  }

  syncFromData(
    balance: number,
    genome: Record<string, unknown>,
    rank: number,
    recentAction: string | null,
  ): void {
    this.targetRadius = 15 + Math.min(45, (balance / 200) * 45);
    const trait = dominantTrait(genome);
    this.targetColor = STRATEGY_COLORS[trait] || "#22c55e";
    this.glowIntensity = rank <= 2 ? 25 : rank <= 4 ? 15 : 8;
    this.pulseSpeed = recentAction && recentAction !== "hold" ? 4.0 : 1.5;
  }

  update(dt: number, canvasW: number, canvasH: number): void {
    if (this.spawning) {
      this.opacity = Math.min(1, this.opacity + dt * 2);
      if (this.opacity >= 1) this.spawning = false;
    }
    if (this.dying) {
      this.opacity -= dt * 2;
      this.targetRadius = 0;
    }
    this.radius = lerp(this.radius, this.targetRadius, dt * 3);
    this.color = this.targetColor;
    this.x += this.vx;
    this.y += this.vy;
    this.vx += (Math.random() - 0.5) * 0.05;
    this.vy += (Math.random() - 0.5) * 0.05;
    this.vx *= 0.99;
    this.vy *= 0.99;
    const margin = this.radius + 10;
    if (this.x < margin) { this.x = margin; this.vx = Math.abs(this.vx); }
    if (this.x > canvasW - margin) { this.x = canvasW - margin; this.vx = -Math.abs(this.vx); }
    if (this.y < margin) { this.y = margin; this.vy = Math.abs(this.vy); }
    if (this.y > canvasH - margin) { this.y = canvasH - margin; this.vy = -Math.abs(this.vy); }
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
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.glowIntensity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.7)`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,0.4)`;
    ctx.fill();
    ctx.shadowBlur = 0;
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
    const wx = -100 + progress * (canvasW + 200);
    const wy = canvasH - 80;
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#3b82f6";
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
    ctx.globalAlpha = 0.15 * (1 - progress);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (effect.type === "viral") {
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
    if (effect.targetX != null && effect.targetY != null) {
      ctx.globalAlpha = 0.2 * (1 - progress);
      ctx.fillStyle = "#6b7280";
      ctx.beginPath();
      ctx.arc(effect.targetX, effect.targetY, progress * 100, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (effect.type === "narrative") {
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
