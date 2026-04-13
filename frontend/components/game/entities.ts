// frontend/components/game/entities.ts — Pixel Town Style

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

const SKIN_TONES = ["#ffcc99", "#ffe0bd", "#f5d5c8", "#deb887", "#c68642"];
const STRATEGY_KEYS = Object.keys(STRATEGY_COLORS);
const GRASS_COLORS = ["#2d5a27", "#306b2e", "#287a28", "#2d6b30", "#358236"];

// --- Helpers ---

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, t);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function darken(hex: string, pct: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.max(0, r - pct)},${Math.max(0, g - pct)},${Math.max(0, b - pct)})`;
}

function lighten(hex: string, pct: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.min(255, r + pct)},${Math.min(255, g + pct)},${Math.min(255, b + pct)})`;
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

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// --- Draw Grass Background ---

export function drawGrassBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const TILE = 40;
  const cols = Math.ceil(w / TILE) + 1;
  const rows = Math.ceil(h / TILE) + 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ci = (r * 7 + c * 13) % GRASS_COLORS.length;
      ctx.fillStyle = GRASS_COLORS[ci];
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      // Grass detail
      if ((r + c) % 3 === 0) {
        ctx.fillStyle = "rgba(0,0,0,0.06)";
        ctx.fillRect(c * TILE + 5, r * TILE + 5, 2, 8);
        ctx.fillRect(c * TILE + 22, r * TILE + 18, 2, 6);
      }
      if ((r + c) % 5 === 0) {
        ctx.fillStyle = "rgba(100,200,80,0.15)";
        ctx.fillRect(c * TILE + 15, r * TILE + 10, 3, 5);
      }
    }
  }

  // Dirt path across middle
  const pathY = Math.floor(rows / 2) * TILE;
  for (let c = 0; c < cols; c++) {
    ctx.fillStyle = c % 2 === 0 ? "#8B7355" : "#9B8365";
    ctx.fillRect(c * TILE, pathY, TILE, TILE * 2);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(c * TILE + 3, pathY + 4, 4, 4);
    ctx.fillRect(c * TILE + 22, pathY + TILE + 12, 3, 3);
  }

  // Path borders
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(0, pathY, w, 2);
  ctx.fillRect(0, pathY + TILE * 2 - 2, w, 2);
}

// --- Particle (Gold Coins) ---

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
  gravity: boolean;

  constructor(x: number, y: number, color: string, speed: number = 2, gravity: boolean = true) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed * (0.5 + Math.random());
    this.vy = Math.sin(angle) * speed * (0.5 + Math.random()) - (gravity ? 2 : 0);
    this.life = 1.0;
    this.maxLife = 0.6 + Math.random() * 0.4;
    this.color = color;
    this.radius = 2 + Math.random() * 3;
    this.gravity = gravity;
  }

  update(dt: number): void {
    this.x += this.vx;
    this.y += this.vy;
    if (this.gravity) this.vy += 3 * dt; // gravity for coins
    this.vx *= 0.98;
    this.life -= dt / this.maxLife;
  }

  get dead(): boolean {
    return this.life <= 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = Math.max(0, this.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- AgentEntity (Pixel Character) ---

export class AgentEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  targetColor: string;
  skinColor: string;
  balance: number;
  targetBalance: number;
  frame: number;
  opacity: number;
  dying: boolean;
  spawning: boolean;
  // Action label
  actionLabel: string;
  actionLabelTimer: number;
  actionLabelColor: string;
  // Speech bubble
  speechText: string;
  speechTimer: number;

  constructor(id: string, name: string, canvasW: number, canvasH: number) {
    this.id = id;
    this.name = name;
    this.x = 80 + Math.random() * (canvasW - 160);
    this.y = 120 + Math.random() * (canvasH - 200);
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.color = "#22c55e";
    this.targetColor = "#22c55e";
    this.skinColor = SKIN_TONES[hashStr(id) % SKIN_TONES.length];
    this.balance = 100;
    this.targetBalance = 100;
    this.frame = Math.random() * 100;
    this.opacity = 0;
    this.dying = false;
    this.spawning = true;
    this.actionLabel = "";
    this.actionLabelTimer = 0;
    this.actionLabelColor = "#22c55e";
    this.speechText = "";
    this.speechTimer = 0;
  }

  syncFromData(
    balance: number,
    genome: Record<string, unknown>,
    _rank: number,
    recentAction: string | null,
  ): void {
    this.targetBalance = balance;
    const trait = dominantTrait(genome);
    this.targetColor = STRATEGY_COLORS[trait] || "#22c55e";
  }

  showAction(label: string, color: string): void {
    this.actionLabel = label;
    this.actionLabelTimer = 60;
    this.actionLabelColor = color;
  }

  showSpeech(text: string): void {
    this.speechText = text;
    this.speechTimer = 90;
  }

  update(dt: number, canvasW: number, canvasH: number): void {
    if (this.spawning) {
      this.opacity = Math.min(1, this.opacity + dt * 2);
      if (this.opacity >= 1) this.spawning = false;
    }
    if (this.dying) {
      this.opacity -= dt * 2;
    }

    this.balance = lerp(this.balance, this.targetBalance, dt * 3);
    this.color = this.targetColor;

    this.x += this.vx;
    this.y += this.vy;
    this.vx += (Math.random() - 0.5) * 0.03;
    this.vy += (Math.random() - 0.5) * 0.03;
    this.vx *= 0.98;
    this.vy *= 0.98;

    const margin = 50;
    if (this.x < margin) { this.x = margin; this.vx = Math.abs(this.vx); }
    if (this.x > canvasW - margin) { this.x = canvasW - margin; this.vx = -Math.abs(this.vx); }
    if (this.y < margin + 40) { this.y = margin + 40; this.vy = Math.abs(this.vy); }
    if (this.y > canvasH - margin) { this.y = canvasH - margin; this.vy = -Math.abs(this.vy); }

    this.frame++;
    if (this.actionLabelTimer > 0) this.actionLabelTimer--;
    if (this.speechTimer > 0) this.speechTimer--;
  }

  dashToward(tx: number, ty: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / dist) * 2;
    this.vy = (dy / dist) * 2;
  }

  pushAway(tx: number, ty: number): void {
    const dx = this.x - tx;
    const dy = this.y - ty;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx += (dx / dist) * 1.5;
    this.vy += (dy / dist) * 1.5;
  }

  get dead(): boolean {
    return this.dying && this.opacity <= 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.opacity <= 0) return;
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const p = 3; // pixel block size
    const bobY = Math.floor(Math.sin(this.frame * 0.1) * 2);
    const dy = y + bobY;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = darken(this.color, 50);
    ctx.fillRect(x - p * 2, dy - p * 5.5, p * 4, p * 1.8);

    // Head
    ctx.fillStyle = this.skinColor;
    ctx.fillRect(x - p * 1.5, dy - p * 4, p * 3, p * 3);

    // Eyes
    ctx.fillStyle = "#111";
    ctx.fillRect(x - p * 0.8, dy - p * 2.8, p * 0.6, p * 0.7);
    ctx.fillRect(x + p * 0.4, dy - p * 2.8, p * 0.6, p * 0.7);
    // Eye shine
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - p * 0.7, dy - p * 2.7, p * 0.3, p * 0.3);
    ctx.fillRect(x + p * 0.5, dy - p * 2.7, p * 0.3, p * 0.3);

    // Body (shirt)
    ctx.fillStyle = this.color;
    ctx.fillRect(x - p * 2, dy - p * 0.8, p * 4, p * 3);
    // Shirt shading
    ctx.fillStyle = darken(this.color, 25);
    ctx.fillRect(x - p * 2, dy - p * 0.8, p * 1, p * 3);

    // Arms
    ctx.fillStyle = this.skinColor;
    ctx.fillRect(x - p * 2.8, dy - p * 0.5, p * 0.8, p * 2.5);
    ctx.fillRect(x + p * 2, dy - p * 0.5, p * 0.8, p * 2.5);

    // Legs
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(x - p * 1.2, dy + p * 2.2, p * 1, p * 2);
    ctx.fillRect(x + p * 0.2, dy + p * 2.2, p * 1, p * 2);

    // Shoes
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(x - p * 1.5, dy + p * 4.2, p * 1.5, p * 0.8);
    ctx.fillRect(x, dy + p * 4.2, p * 1.5, p * 0.8);

    // Strategy accessory
    const trait = this.color;
    if (trait === "#ef4444") {
      // Red = headband
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(x - p * 2, dy - p * 4, p * 4, p * 0.7);
      ctx.fillRect(x + p * 1.5, dy - p * 4.5, p * 0.5, p * 2);
    } else if (trait === "#3b82f6") {
      // Blue = cap
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(x - p * 2, dy - p * 5.5, p * 4.5, p * 1);
      ctx.fillRect(x + p * 1, dy - p * 5, p * 2, p * 0.7);
    } else if (trait === "#22c55e") {
      // Green = beret
      ctx.fillStyle = "#1a5c2a";
      ctx.beginPath();
      ctx.ellipse(x - 1, dy - p * 5.5, p * 2.5, p * 1, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (trait === "#a855f7") {
      // Purple = devil horns
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(x - p * 2, dy - p * 6.5, p * 0.8, p * 1.5);
      ctx.fillRect(x + p * 1.2, dy - p * 6.5, p * 0.8, p * 1.5);
    } else if (trait === "#eab308") {
      // Yellow = goggles
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x - p * 0.5, dy - p * 2.5, p * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + p * 0.7, dy - p * 2.5, p * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - p * 0.5 + p * 0.9, dy - p * 2.5);
      ctx.lineTo(x + p * 0.7 - p * 0.9, dy - p * 2.5);
      ctx.stroke();
    }

    // Name tag background
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = "bold 9px monospace";
    const nameW = ctx.measureText(this.name).width;
    ctx.fillRect(x - nameW / 2 - 3, dy - p * 7.5, nameW + 6, 12);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(this.name, x, dy - p * 6);

    // Balance
    ctx.fillStyle = "#34d399";
    ctx.font = "8px monospace";
    ctx.fillText("$" + Math.floor(this.balance), x, dy - p * 7.5 + 22);

    // Health bar
    const barW = p * 5;
    const barH = 3;
    const barY = dy + p * 5.5;
    const healthPct = Math.min(1, this.balance / 200);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x - barW / 2, barY, barW, barH);
    const hColor = healthPct > 0.5 ? "#22c55e" : healthPct > 0.25 ? "#eab308" : "#ef4444";
    ctx.fillStyle = hColor;
    ctx.fillRect(x - barW / 2, barY, barW * healthPct, barH);

    ctx.restore();

    // Floating action label (drawn outside save/restore for full opacity)
    if (this.actionLabelTimer > 0) {
      const alpha = Math.min(1, this.actionLabelTimer / 30);
      const floatY = dy - p * 9 - (60 - this.actionLabelTimer) * 0.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.actionLabelColor;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.shadowColor = this.actionLabelColor;
      ctx.shadowBlur = 8;
      ctx.fillText(this.actionLabel, x, floatY);
      ctx.restore();
    }

    // Speech bubble
    if (this.speechTimer > 0 && this.speechText) {
      const alpha = Math.min(1, this.speechTimer / 30);
      const bx = x;
      const by = dy - p * 11;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "8px monospace";
      const tw = ctx.measureText(this.speechText).width;
      // Bubble
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      roundRect(ctx, bx - tw / 2 - 6, by - 10, tw + 12, 16, 5);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(bx - 4, by + 6);
      ctx.lineTo(bx, by + 14);
      ctx.lineTo(bx + 4, by + 6);
      ctx.fill();
      // Text
      ctx.fillStyle = "#111";
      ctx.textAlign = "center";
      ctx.fillText(this.speechText, bx, by + 2);
      ctx.restore();
    }
  }
}

// --- TokenEntity (Market Stall) ---

export class TokenEntity {
  id: string;
  name: string;
  theme: string;
  x: number;
  y: number;
  color: string;
  roofColor: string;
  progress: number;
  targetProgress: number;
  state: "active" | "graduated" | "dead";
  opacity: number;
  dying: boolean;
  graduating: boolean;
  pulsePhase: number;

  constructor(id: string, name: string, theme: string, canvasW: number, canvasH: number) {
    this.id = id;
    this.name = name;
    this.theme = theme;
    this.x = 60 + Math.random() * (canvasW - 120);
    this.y = 60 + Math.random() * (canvasH - 200);
    this.color = THEME_COLORS[theme] || "#6366f1";
    this.roofColor = darken(this.color, 40);
    this.progress = 0;
    this.targetProgress = 0;
    this.state = "active";
    this.opacity = 0;
    this.dying = false;
    this.graduating = false;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  syncFromData(bondingProgress: number, state: "active" | "graduated" | "dead"): void {
    this.targetProgress = bondingProgress;
    if (state !== this.state) {
      if (state === "graduated") this.graduating = true;
      if (state === "dead") this.dying = true;
      this.state = state;
    }
  }

  update(dt: number): void {
    this.progress = lerp(this.progress, this.targetProgress, dt * 3);
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
    const x = this.x;
    const y = this.y;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(x + 30, y + 52, 35, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stall stand (wooden)
    ctx.fillStyle = "#5c3d2e";
    ctx.fillRect(x, y + 20, 60, 30);
    ctx.fillStyle = "#4a3020";
    ctx.fillRect(x + 2, y + 22, 2, 26);
    ctx.fillRect(x + 56, y + 22, 2, 26);

    // Counter top
    ctx.fillStyle = "#8B6914";
    ctx.fillRect(x - 5, y + 15, 70, 8);
    ctx.fillStyle = "#A07818";
    ctx.fillRect(x - 5, y + 15, 70, 3);

    // Roof
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 15);
    ctx.lineTo(x + 30, y - 18);
    ctx.lineTo(x + 70, y + 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.roofColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Awning stripes
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(x, y + 15); ctx.lineTo(x + 15, y); ctx.lineTo(x + 25, y); ctx.lineTo(x + 10, y + 15);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 22, y + 15); ctx.lineTo(x + 37, y); ctx.lineTo(x + 47, y); ctx.lineTo(x + 32, y + 15);
    ctx.fill();

    // Items on counter (glowing)
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    const itemPulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
    ctx.globalAlpha = this.opacity * itemPulse;
    ctx.fillStyle = lighten(this.color, 40);
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + 8 + i * 18, y + 7, 10, 8);
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = this.opacity;

    // Progress bar (bonding progress)
    const barW = 60;
    const barH = 4;
    const barY = y + 55;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x, barY, barW, barH);
    ctx.fillStyle = this.color;
    ctx.fillRect(x, barY, barW * this.progress, barH);

    // Sign with name
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.font = "bold 10px monospace";
    const nameW = ctx.measureText(this.name).width;
    ctx.fillRect(x + 30 - nameW / 2 - 4, y - 28, nameW + 8, 14);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(this.name, x + 30, y - 18);

    // State badge
    if (this.state === "graduated") {
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 8px monospace";
      ctx.fillText("GRADUATED!", x + 30, y - 32);
    } else if (this.state === "dead") {
      ctx.fillStyle = "#666";
      ctx.font = "bold 8px monospace";
      ctx.fillText("CLOSED", x + 30, y - 32);
    }

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
    whale: 2.5, fud: 1.2, viral: 2, crisis: 1.5, narrative: 2.5,
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
    // Big shadow moving across the ground
    const wx = -150 + progress * (canvasW + 300);
    const wy = canvasH - 100;
    ctx.globalAlpha = 0.12 * (1 - Math.abs(progress - 0.5) * 2);
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.ellipse(wx, wy, 100, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(wx + 85, wy);
    ctx.lineTo(wx + 120, wy - 30);
    ctx.lineTo(wx + 120, wy + 30);
    ctx.closePath();
    ctx.fill();
    // Label
    ctx.globalAlpha = 0.6 * (1 - progress);
    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText("WHALE ALERT!", canvasW / 2, 50);
  } else if (effect.type === "fud") {
    ctx.globalAlpha = 0.12 * (1 - progress);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.globalAlpha = 0.7 * (1 - progress);
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("FUD!", canvasW / 2, canvasH / 2);
  } else if (effect.type === "viral") {
    if (effect.targetX != null && effect.targetY != null) {
      const ringRadius = progress * 250;
      ctx.globalAlpha = 0.25 * (1 - progress);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.targetX, effect.targetY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.6 * (1 - progress);
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("VIRAL!", canvasW / 2, 50);
  } else if (effect.type === "crisis") {
    if (effect.targetX != null && effect.targetY != null) {
      ctx.globalAlpha = 0.15 * (1 - progress);
      ctx.fillStyle = "#6b7280";
      ctx.beginPath();
      ctx.arc(effect.targetX, effect.targetY, progress * 120, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (effect.type === "narrative") {
    ctx.globalAlpha = 0.7 * (1 - progress);
    ctx.fillStyle = "#eab308";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      `${effect.theme?.toUpperCase() || "NARRATIVE"} WAVE!`,
      canvasW / 2,
      45,
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

  const alpha = progress < 0.3 ? progress / 0.3 : progress > 0.7 ? (1 - progress) / 0.3 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Dark overlay
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, canvasH / 2 - 40, canvasW, 80);

  // Text
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 15;
  ctx.fillText(banner.text, canvasW / 2, canvasH / 2 + 5);

  // Subtitle
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "12px monospace";
  ctx.fillText("Natural selection in progress...", canvasW / 2, canvasH / 2 + 25);

  ctx.restore();
}

// --- Helpers ---

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
