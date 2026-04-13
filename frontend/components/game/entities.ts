// frontend/components/game/entities.ts — Pixel Town Style (Enhanced with Ninja Adventure Sprites)

// --- Constants ---

const STRATEGY_COLORS: Record<string, string> = {
  risk_appetite: "#ef4444",
  follow_leader: "#3b82f6",
  creation_frequency: "#22c55e",
  contrarian: "#a855f7",
  experiment_rate: "#eab308",
};

export const STRATEGY_LABELS: Record<string, string> = {
  risk_appetite: "激进",
  follow_leader: "跟风",
  creation_frequency: "创造",
  contrarian: "反向",
  experiment_rate: "实验",
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

// --- Sprite Key Mapping (Strategy -> Ninja Adventure Character) ---

export const SPRITE_KEYS: Record<string, string> = {
  risk_appetite: "FighterRed",
  follow_leader: "Villager",
  creation_frequency: "SorcererOrange",
  contrarian: "NinjaDark",
  experiment_rate: "Inspector",
};

// Sprite paths for preloading
export const SPRITE_PATHS: Record<string, string> = {
  // Characters (SpriteSheet.png: 64x112, 4 columns x 7 rows, each frame 16x16)
  FighterRed: "/assets/Ninja Adventure/Actor/Character/FighterRed/SpriteSheet.png",
  Villager: "/assets/Ninja Adventure/Actor/Character/Villager/SpriteSheet.png",
  SorcererOrange: "/assets/Ninja Adventure/Actor/Character/SorcererOrange/SpriteSheet.png",
  NinjaDark: "/assets/Ninja Adventure/Actor/Character/NinjaDark/SpriteSheet.png",
  Inspector: "/assets/Ninja Adventure/Actor/Character/Inspector/SpriteSheet.png",
  // Tilesets
  field: "/assets/Ninja Adventure/Backgrounds/Tilesets/TilesetField.png",
  nature: "/assets/Ninja Adventure/Backgrounds/Tilesets/TilesetNature.png",
  house: "/assets/Ninja Adventure/Backgrounds/Tilesets/TilesetHouse.png",
};

// Sprite sheet constants
const SPRITE_FRAME_SIZE = 16;
const SPRITE_SCALE = 3;
const SPRITE_RENDER_SIZE = SPRITE_FRAME_SIZE * SPRITE_SCALE; // 48px
const SPRITE_ANIM_SPEED = 8; // change frame every 8 game ticks

// Nature decoration definitions (fixed positions, using tiles from TilesetNature.png)
// TilesetNature.png is 384x336 = 24 cols x 21 rows of 16x16 tiles
// Tree top-left is approximately at col 0, row 0 area; flowers at various positions
interface Decoration {
  // source tile coordinates (in tile units, not pixels)
  srcCol: number;
  srcRow: number;
  // how many tiles wide/tall this decoration is
  srcW: number;
  srcH: number;
  // position on screen (will be computed relative to canvas)
  xFrac: number; // fraction of canvas width
  yFrac: number; // fraction of canvas height
}

const DECORATIONS: Decoration[] = [
  // Trees (using 3x3 tile blocks from nature tileset, approximate positions)
  // Large tree at col 0, row 4 (3 tiles wide, 3 tiles tall)
  { srcCol: 0, srcRow: 4, srcW: 3, srcH: 3, xFrac: 0.05, yFrac: 0.15 },
  { srcCol: 0, srcRow: 4, srcW: 3, srcH: 3, xFrac: 0.92, yFrac: 0.10 },
  { srcCol: 0, srcRow: 4, srcW: 3, srcH: 3, xFrac: 0.85, yFrac: 0.75 },
  { srcCol: 0, srcRow: 4, srcW: 3, srcH: 3, xFrac: 0.08, yFrac: 0.80 },
  // Pine tree at col 3, row 4
  { srcCol: 3, srcRow: 4, srcW: 3, srcH: 3, xFrac: 0.25, yFrac: 0.08 },
  { srcCol: 3, srcRow: 4, srcW: 3, srcH: 3, xFrac: 0.70, yFrac: 0.85 },
  // Small flowers/bushes at col 6, row 6 (2x1)
  { srcCol: 6, srcRow: 6, srcW: 2, srcH: 1, xFrac: 0.15, yFrac: 0.35 },
  { srcCol: 6, srcRow: 6, srcW: 2, srcH: 1, xFrac: 0.80, yFrac: 0.40 },
  { srcCol: 6, srcRow: 6, srcW: 2, srcH: 1, xFrac: 0.50, yFrac: 0.90 },
  // Flowers at col 8, row 6 (2x1)
  { srcCol: 8, srcRow: 6, srcW: 2, srcH: 1, xFrac: 0.35, yFrac: 0.12 },
  { srcCol: 8, srcRow: 6, srcW: 2, srcH: 1, xFrac: 0.60, yFrac: 0.88 },
  // Rocks at col 12, row 6 (1x1)
  { srcCol: 12, srcRow: 6, srcW: 1, srcH: 1, xFrac: 0.40, yFrac: 0.05 },
  { srcCol: 12, srcRow: 6, srcW: 1, srcH: 1, xFrac: 0.55, yFrac: 0.92 },
];

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

// --- Draw Grass Background (Tileset version) ---

export function drawGrassBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sprites?: Map<string, HTMLImageElement>,
): void {
  const fieldImg = sprites?.get("field");

  if (fieldImg && fieldImg.complete && fieldImg.naturalWidth > 0) {
    // Use tileset for background
    // TilesetField.png is 80x240 = 5 cols x 15 rows of 16x16 tiles
    // Use a few different grass tiles for variety
    const tileSize = 16;
    const scale = SPRITE_SCALE;
    const renderSize = tileSize * scale;

    // Grass tile positions in the field tileset (col, row)
    const grassTiles = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
    ];

    const cols = Math.ceil(w / renderSize) + 1;
    const rows = Math.ceil(h / renderSize) + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Pick a grass tile based on position for variety
        const tileIdx = (r * 7 + c * 13) % grassTiles.length;
        const tile = grassTiles[tileIdx];
        ctx.drawImage(
          fieldImg,
          tile.col * tileSize, tile.row * tileSize,
          tileSize, tileSize,
          c * renderSize, r * renderSize,
          renderSize, renderSize,
        );
      }
    }

    // Draw a dirt path across the middle using dirt tiles from row 2
    const pathY = Math.floor(rows / 2);
    const dirtTiles = [
      { col: 0, row: 2 },
      { col: 1, row: 2 },
      { col: 2, row: 2 },
    ];
    for (let c = 0; c < cols; c++) {
      for (let pr = 0; pr < 2; pr++) {
        const dirtIdx = (c + pr) % dirtTiles.length;
        const tile = dirtTiles[dirtIdx];
        ctx.drawImage(
          fieldImg,
          tile.col * tileSize, tile.row * tileSize,
          tileSize, tileSize,
          c * renderSize, (pathY + pr) * renderSize,
          renderSize, renderSize,
        );
      }
    }
  } else {
    // Fallback: programmatic grass
    const TILE = 40;
    const cols = Math.ceil(w / TILE) + 1;
    const rows = Math.ceil(h / TILE) + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ci = (r * 7 + c * 13) % GRASS_COLORS.length;
        ctx.fillStyle = GRASS_COLORS[ci];
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
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
}

// --- Draw Nature Decorations ---

export function drawDecorations(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sprites?: Map<string, HTMLImageElement>,
): void {
  const natureImg = sprites?.get("nature");
  if (!natureImg || !natureImg.complete || natureImg.naturalWidth === 0) return;

  const tileSize = 16;
  const scale = SPRITE_SCALE;

  ctx.save();
  for (const deco of DECORATIONS) {
    const dx = deco.xFrac * w;
    const dy = deco.yFrac * h;
    const dw = deco.srcW * tileSize * scale;
    const dh = deco.srcH * tileSize * scale;

    ctx.drawImage(
      natureImg,
      deco.srcCol * tileSize, deco.srcRow * tileSize,
      deco.srcW * tileSize, deco.srcH * tileSize,
      dx - dw / 2, dy - dh / 2,
      dw, dh,
    );
  }
  ctx.restore();
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

// --- AgentEntity (Pixel Character with Sprite Sheet support) ---

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
  // Strategy label
  strategyLabel: string;
  // Rank
  rank: number;
  // Elimination animation
  eliminationPhase: "falling" | "grayed" | "dissolving" | null;
  eliminationTimer: number;
  // Sprite animation
  spriteKey: string;
  animFrame: number; // 0-3
  animRow: number; // 0=down, 1=up, 2=left, 3=right
  animTimer: number;
  dominantTraitKey: string;

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
    this.strategyLabel = "";
    this.rank = -1;
    this.eliminationPhase = null;
    this.eliminationTimer = 0;
    // Sprite defaults
    this.spriteKey = "Villager";
    this.animFrame = 0;
    this.animRow = 0;
    this.animTimer = 0;
    this.dominantTraitKey = "follow_leader";
  }

  syncFromData(
    balance: number,
    genome: Record<string, unknown>,
    rank: number,
    recentAction: string | null,
  ): void {
    this.targetBalance = balance;
    const trait = dominantTrait(genome);
    this.targetColor = STRATEGY_COLORS[trait] || "#22c55e";
    this.rank = rank;
    this.strategyLabel = STRATEGY_LABELS[trait] || "";
    this.dominantTraitKey = trait;
    this.spriteKey = SPRITE_KEYS[trait] || "Villager";
    void recentAction; // consumed by caller
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
    // Elimination animation
    if (this.eliminationPhase) {
      this.eliminationTimer += dt;
      if (this.eliminationPhase === "falling") {
        this.vy += 8 * dt;
        this.y += this.vy;
        if (this.eliminationTimer > 0.8) {
          this.eliminationPhase = "grayed";
          this.eliminationTimer = 0;
          this.vy = 0;
        }
      } else if (this.eliminationPhase === "grayed") {
        if (this.eliminationTimer > 1.0) {
          this.eliminationPhase = "dissolving";
          this.eliminationTimer = 0;
        }
      } else if (this.eliminationPhase === "dissolving") {
        this.opacity -= dt * 2;
        if (this.opacity <= 0) {
          this.dying = true;
        }
      }
      return;
    }

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

    // Update sprite animation
    this.animTimer++;
    if (this.animTimer >= SPRITE_ANIM_SPEED) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Determine animation row based on velocity (direction)
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 0.15) {
      // Moving: pick direction row
      if (Math.abs(this.vx) > Math.abs(this.vy)) {
        // Horizontal movement dominates
        this.animRow = this.vx > 0 ? 3 : 2; // right : left
      } else {
        // Vertical movement dominates
        this.animRow = this.vy > 0 ? 0 : 1; // down : up
      }
    } else {
      // Idle: use row 0 frame 0 (standing facing down)
      this.animFrame = 0;
      this.animRow = 0;
      this.animTimer = 0;
    }
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

  draw(ctx: CanvasRenderingContext2D, sprites?: Map<string, HTMLImageElement>): void {
    if (this.opacity <= 0) return;
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Grayscale filter for eliminated agents
    if (this.eliminationPhase === "grayed" || this.eliminationPhase === "dissolving") {
      ctx.filter = "grayscale(100%)";
    }

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x, y + SPRITE_RENDER_SIZE / 2 - 2, SPRITE_RENDER_SIZE / 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Try to draw sprite from sprite sheet
    const spriteImg = sprites?.get(this.spriteKey);
    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      // Draw from SpriteSheet.png
      const sx = this.animFrame * SPRITE_FRAME_SIZE;
      const sy = this.animRow * SPRITE_FRAME_SIZE;

      ctx.drawImage(
        spriteImg,
        sx, sy, SPRITE_FRAME_SIZE, SPRITE_FRAME_SIZE,
        x - SPRITE_RENDER_SIZE / 2, y - SPRITE_RENDER_SIZE / 2,
        SPRITE_RENDER_SIZE, SPRITE_RENDER_SIZE,
      );
    } else {
      // Fallback: programmatic pixel character
      this.drawFallbackCharacter(ctx, x, y);
    }

    // Reset filter
    ctx.filter = "none";

    // Elimination X mark
    if (this.eliminationPhase === "grayed") {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 12);
      ctx.lineTo(x + 12, y + 12);
      ctx.moveTo(x + 12, y - 12);
      ctx.lineTo(x - 12, y + 12);
      ctx.stroke();
    }

    // --- Overlays (name, balance, health bar, strategy, rank) ---
    const overlayBaseY = y - SPRITE_RENDER_SIZE / 2;

    // Rank badge next to name
    let namePrefix = "";
    let nameBgColor = "rgba(0,0,0,0.55)";
    if (this.rank === 0) {
      namePrefix = "\uD83D\uDC51 "; // crown
      nameBgColor = "rgba(255,215,0,0.35)";
    } else if (this.rank === 1) {
      nameBgColor = "rgba(192,192,192,0.3)";
    } else if (this.rank === 2) {
      nameBgColor = "rgba(205,127,50,0.3)";
    }

    // Name tag background
    ctx.font = "bold 9px monospace";
    const displayName = namePrefix + this.name;
    const nameW = ctx.measureText(displayName).width;
    ctx.fillStyle = nameBgColor;
    ctx.fillRect(x - nameW / 2 - 3, overlayBaseY - 18, nameW + 6, 12);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(displayName, x, overlayBaseY - 9);

    // Rank number for top 3
    if (this.rank >= 0 && this.rank < 3) {
      const rankColors = ["#ffd700", "#c0c0c0", "#cd7f32"];
      ctx.fillStyle = rankColors[this.rank];
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`#${this.rank + 1}`, x + nameW / 2 + 5, overlayBaseY - 9);
    }

    // Balance
    ctx.fillStyle = "#34d399";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("$" + Math.floor(this.balance), x, overlayBaseY - 4);

    // Health bar
    const barW = SPRITE_RENDER_SIZE;
    const barH = 3;
    const barY = y + SPRITE_RENDER_SIZE / 2 + 2;
    const healthPct = Math.min(1, this.balance / 200);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x - barW / 2, barY, barW, barH);
    const hColor = healthPct > 0.5 ? "#22c55e" : healthPct > 0.25 ? "#eab308" : "#ef4444";
    ctx.fillStyle = hColor;
    ctx.fillRect(x - barW / 2, barY, barW * healthPct, barH);

    // Strategy label below health bar
    if (this.strategyLabel) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.font = "bold 8px sans-serif";
      const labelW = ctx.measureText(this.strategyLabel).width;
      ctx.fillRect(x - labelW / 2 - 2, barY + barH + 1, labelW + 4, 11);
      ctx.fillStyle = this.color;
      ctx.textAlign = "center";
      ctx.fillText(this.strategyLabel, x, barY + barH + 10);
    }

    ctx.restore();

    // Floating action label (drawn outside save/restore for full opacity)
    if (this.actionLabelTimer > 0) {
      const alpha = Math.min(1, this.actionLabelTimer / 30);
      const floatY = overlayBaseY - 22 - (60 - this.actionLabelTimer) * 0.6;
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
      const by = overlayBaseY - 34;
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

  // Fallback programmatic character drawing (used when sprites not loaded)
  private drawFallbackCharacter(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const p = 4;
    const bobY = this.eliminationPhase ? 0 : Math.floor(Math.sin(this.frame * 0.1) * 2);
    const dy = y + bobY;

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
    // Mouth
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(x - p * 0.3, dy - p * 1.5, p * 0.6, p * 0.3);

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
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(x - p * 2, dy - p * 4, p * 4, p * 0.7);
      ctx.fillRect(x + p * 1.5, dy - p * 4.5, p * 0.5, p * 2);
    } else if (trait === "#3b82f6") {
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(x - p * 2, dy - p * 5.5, p * 4.5, p * 1);
      ctx.fillRect(x + p * 1, dy - p * 5, p * 2, p * 0.7);
    } else if (trait === "#22c55e") {
      ctx.fillStyle = "#1a5c2a";
      ctx.beginPath();
      ctx.ellipse(x - 1, dy - p * 5.5, p * 2.5, p * 1, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (trait === "#a855f7") {
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(x - p * 2, dy - p * 6.5, p * 0.8, p * 1.5);
      ctx.fillRect(x + p * 1.2, dy - p * 6.5, p * 0.8, p * 1.5);
    } else if (trait === "#eab308") {
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
  holderCount: number;

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
    this.holderCount = 0;
  }

  syncFromData(bondingProgress: number, state: "active" | "graduated" | "dead", holderCount?: number): void {
    this.targetProgress = bondingProgress;
    if (holderCount !== undefined) {
      this.holderCount = holderCount;
    }
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

    // Fire icons for popular stalls (holderCount > 2)
    if (this.holderCount > 2 && this.state === "active") {
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      const fireCount = Math.min(3, this.holderCount - 2);
      let fireStr = "";
      for (let i = 0; i < fireCount; i++) fireStr += "\uD83D\uDD25";
      ctx.fillText(fireStr, x + 30, y - 36);

      // Holder count badge
      ctx.fillStyle = "rgba(239,68,68,0.8)";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${this.holderCount} holders`, x + 30, barY + 13);
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
    const wx = -150 + progress * (canvasW + 300);
    const wy = canvasH - 100;
    ctx.globalAlpha = 0.12 * (1 - Math.abs(progress - 0.5) * 2);
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.ellipse(wx, wy, 100, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(wx + 85, wy);
    ctx.lineTo(wx + 120, wy - 30);
    ctx.lineTo(wx + 120, wy + 30);
    ctx.closePath();
    ctx.fill();
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

// --- Evolution Banner (Enhanced) ---

export interface EvoBanner {
  text: string;
  subText?: string;
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

  const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Full-width dark overlay
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, canvasH / 2 - 60, canvasW, 120);

  // Top decorative line
  ctx.fillStyle = "#ffd700";
  ctx.fillRect(canvasW / 2 - 150, canvasH / 2 - 60, 300, 2);
  ctx.fillRect(canvasW / 2 - 150, canvasH / 2 + 58, 300, 2);

  // Main text
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 36px monospace";
  ctx.textAlign = "center";
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 20;
  ctx.fillText(banner.text, canvasW / 2, canvasH / 2);

  // Subtitle
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "14px monospace";
  const sub = banner.subText || "Natural Selection in Progress...";
  ctx.fillText(sub, canvasW / 2, canvasH / 2 + 28);

  // Decorative DNA helix dots
  const helixPhase = progress * Math.PI * 4;
  for (let i = 0; i < 8; i++) {
    const hx = canvasW / 2 - 180 + i * 50;
    const hy1 = canvasH / 2 - 40 + Math.sin(helixPhase + i * 0.8) * 12;
    const hy2 = canvasH / 2 - 40 - Math.sin(helixPhase + i * 0.8) * 12;
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(hx, hy1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.arc(hx, hy2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// --- Trade Line Drawing ---

export function drawTradeLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashOffset: number,
): void {
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.lineDashOffset = -dashOffset;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Traveling dot along the line
  const t = (dashOffset % 60) / 60;
  const dotX = x1 + (x2 - x1) * t;
  const dotY = y1 + (y2 - y1) * t;
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// --- Phase Indicator (Top Banner) ---

export type SimPhase = "trading" | "evaluating" | "evolving";

export function drawPhaseIndicator(
  ctx: CanvasRenderingContext2D,
  phase: SimPhase,
  tick: number,
  maxTick: number,
  generation: number,
  canvasW: number,
): void {
  const barH = 32;
  ctx.save();

  // Background bar
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvasW, barH);

  // Phase sections
  const phases: { key: SimPhase; label: string; icon: string }[] = [
    { key: "trading", label: "TRADING", icon: "\uD83D\uDCB0" },
    { key: "evaluating", label: "EVALUATION", icon: "\uD83C\uDFC6" },
    { key: "evolving", label: "EVOLUTION", icon: "\uD83E\uDDEC" },
  ];

  const sectionW = 160;
  const startX = canvasW / 2 - (sectionW * 3) / 2;

  phases.forEach((p, i) => {
    const sx = startX + i * sectionW;
    const isActive = p.key === phase;

    // Active phase highlight
    if (isActive) {
      ctx.fillStyle = phase === "trading" ? "rgba(34,197,94,0.3)" :
                      phase === "evaluating" ? "rgba(234,179,8,0.3)" :
                      "rgba(168,85,247,0.3)";
      ctx.fillRect(sx, 0, sectionW, barH);
      // Bottom accent line
      ctx.fillStyle = phase === "trading" ? "#22c55e" :
                      phase === "evaluating" ? "#eab308" :
                      "#a855f7";
      ctx.fillRect(sx, barH - 3, sectionW, 3);
    }

    // Arrow between phases
    if (i < 2) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("\u2192", sx + sectionW + 0, barH / 2 + 5);
    }

    // Phase text
    ctx.fillStyle = isActive ? "#fff" : "rgba(255,255,255,0.35)";
    ctx.font = isActive ? "bold 12px monospace" : "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${p.icon} ${p.label}`, sx + sectionW / 2, barH / 2 + 4);
  });

  // Generation + tick info on the left
  ctx.fillStyle = "#aaa";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Gen ${generation}`, 10, 14);
  ctx.fillStyle = "#666";
  ctx.fillText(`Tick ${tick}/${maxTick}`, 10, 26);

  // Tick progress bar on the right
  const progBarW = 100;
  const progBarX = canvasW - progBarW - 10;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(progBarX, 10, progBarW, 12);
  const pct = maxTick > 0 ? tick / maxTick : 0;
  ctx.fillStyle = phase === "trading" ? "#22c55e" :
                  phase === "evaluating" ? "#eab308" :
                  "#a855f7";
  ctx.fillRect(progBarX, 10, progBarW * pct, 12);
  ctx.fillStyle = "#fff";
  ctx.font = "8px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.floor(pct * 100)}%`, progBarX + progBarW / 2, 19);

  ctx.restore();
}

// --- Trade Log (Bottom) ---

export interface TradeLogEntry {
  text: string;
  color: string;
  time: number;
}

export function drawTradeLog(
  ctx: CanvasRenderingContext2D,
  entries: TradeLogEntry[],
  canvasW: number,
  canvasH: number,
): void {
  if (entries.length === 0) return;

  const maxShow = 5;
  const recent = entries.slice(-maxShow);
  const logH = recent.length * 16 + 10;
  const logY = canvasH - logH - 8;

  ctx.save();

  // Background
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  roundRect(ctx, 8, logY, 320, logH, 6);
  ctx.fill();

  // Title
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "left";
  ctx.fillText("TRADE LOG", 14, logY + 10);

  // Entries
  recent.forEach((entry, i) => {
    const ey = logY + 20 + i * 16;
    const age = (Date.now() - entry.time) / 1000;
    const alpha = Math.max(0.3, 1 - age / 30);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = entry.color;
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(entry.text, 14, ey);
  });

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
