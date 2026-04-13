# Ecosystem Game View Design Spec

> A full-screen 2D animated ecosystem terrarium view for Darwin.meme, where AI agents are living organisms competing in a visual meme token world.

## 1. Overview

Add an "Ecosystem View" as an alternative visualization to the existing data Dashboard. Users switch between `📊 Data` and `🎮 Game` views via a toggle button. Both views share the same real-time WebSocket data from `useSimulation`.

**Goal**: Make evolution *feel* alive — users should understand what's happening without reading a single number.

**Technical approach**: HTML5 Canvas 2D + requestAnimationFrame. No new dependencies. Pure frontend addition, zero backend changes.

## 2. Agent Organisms

Each Agent renders as a glowing circular organism with pulsing animation.

### Visual Mapping

| Property | Maps to | Range |
|----------|---------|-------|
| Size (radius) | `balance` | 15px (broke) ~ 60px (rich) |
| Color | Dominant genome trait | See color table below |
| Glow intensity | Fitness rank | Top 3 glow brighter |
| Pulse speed | Activity | Recent trades = faster pulse |
| Label | Agent name | Displayed above organism |

### Color by Strategy

| Dominant Trait | Color | Hex |
|---------------|-------|-----|
| High `risk_appetite` | Red | `#ef4444` |
| High `follow_leader` | Blue | `#3b82f6` |
| High `creation_frequency` | Green | `#22c55e` |
| High `contrarian` | Purple | `#a855f7` |
| High `experiment_rate` | Yellow | `#eab308` |

Dominant = whichever of these 5 traits has the highest value in the genome.

### Movement Behaviors

- **Idle**: Slow random drift (Brownian motion + wall bounce)
- **BUY**: Quick dash toward the target Token resource
- **SELL**: Push away from the Token
- **CREATE**: Stay in place, emit a new resource point outward
- **HOLD**: Slow rotation in place
- **EXPERIMENT**: Brief spiral pattern
- **Eliminated**: Shrink + fade out with red particle burst

## 3. Token Resources

Tokens are rendered as small geometric shapes floating in the ecosystem.

| Property | Maps to |
|----------|---------|
| Shape | Hexagon |
| Size | `bonding_progress` (bigger = closer to graduation) |
| Color | Theme-based (8 themes = 8 hue variants) |
| Graduated | Explode with golden particles, then disappear |
| Dead | Turn gray, crack/fragment animation, fade out |

Theme color mapping:
- animal = `#f59e0b`, politics = `#ef4444`, tech = `#3b82f6`, humor = `#22c55e`
- food = `#f97316`, crypto = `#a855f7`, popculture = `#ec4899`, absurd = `#6366f1`

## 4. Market Event Effects

| Event | Visual Effect | Duration |
|-------|--------------|----------|
| Whale | Large translucent whale silhouette swims across bottom; target token pulses | 2s |
| FUD | Screen tints dark red, slight shake; organisms scatter briefly | 1s |
| Viral | Expanding ring of light from target token; nearby organisms attracted | 1.5s |
| Crisis | Target token flickers gray; nearby organisms repelled | 1s |
| Narrative | All tokens of matching theme pulse simultaneously; theme text floats across top | 2s |

## 5. Evolution Transition Animation

When an epoch ends and a new generation begins (triggered by `generation_end` WebSocket event):

1. **Dim** (0.5s): Screen brightness fades to 40%
2. **Eliminate** (1s): Eliminated agents shrink and dissolve into red particles
3. **Celebrate** (0.5s): Surviving agents emit a golden pulse
4. **Reproduce** (1.5s): Parent pairs drift toward each other, a light beam connects them, a new smaller organism splits off from the midpoint
5. **Newcomers** (0.5s): New random agents fade in from screen edges
6. **Resume** (0.5s): Screen brightness restores, generation counter updates
7. **Banner**: "Generation N → N+1" text fades in/out at screen center

Total transition: ~4.5 seconds

## 6. HUD (Heads-Up Display)

HTML overlay on top of Canvas (not drawn in Canvas), non-obstructive:

```
┌──────────────────────────────────────────────────┐
│ Gen: 15  Tick: 32/50          [📊 Data] [🎮 Game]│
│                                                  │
│                                                  │
│           （Ecosystem Canvas）                    │
│                                                  │
│                                                  │
│ 🏆 #1 Alpha  💰52.3                              │
│ 🥈 #2 Gamma  💰48.1       💬 "Alpha just bought  │
│ 🥉 #3 Omega  💰45.7          the DOGE2.0 dip!"  │
│ Tokens: 5 active | 2 grad | Events: 🐋          │
└──────────────────────────────────────────────────┘
```

- **Top-left**: Generation + Tick progress
- **Top-right**: View toggle buttons (shared with Dashboard)
- **Bottom-left**: Top 3 agents with balance
- **Bottom-right**: Latest AI commentary (1 line)
- **Bottom-center**: Token stats + active event icons

## 7. Architecture

### New Files

| File | Responsibility |
|------|---------------|
| `frontend/components/game/GameView.tsx` | Main container: Canvas + HUD overlay |
| `frontend/components/game/EcosystemCanvas.tsx` | Canvas rendering engine, animation loop |
| `frontend/components/game/GameHud.tsx` | HTML HUD overlay |
| `frontend/components/game/entities.ts` | AgentEntity, TokenEntity, Particle classes with physics |

### Modified Files

| File | Change |
|------|--------|
| `frontend/app/page.tsx` | Add view toggle state, conditionally render Dashboard or GameView |

### Data Flow

```
useSimulation hook (existing, no changes)
    │
    ├── view === "data"  → Dashboard (existing)
    │
    └── view === "game"  → GameView (new)
                            ├── EcosystemCanvas
                            │   ├── AgentEntity[] (position, velocity, animation state)
                            │   ├── TokenEntity[] (position, state)
                            │   ├── Particle[] (effect pool)
                            │   └── EventEffect[] (full-screen effect queue)
                            └── GameHud (HTML overlay)
```

### Rendering Loop (60fps)

```
Each frame:
1. Update physics (position += velocity, wall bounce, friction)
2. If new tick data arrived:
   - Sync AgentEntity properties (size, color) via lerp
   - Trigger trade animations (dash/repel)
   - Queue event effects
3. If generation_end arrived:
   - Queue evolution transition sequence
4. Update particles (fade, remove expired)
5. Draw background (dark + faint grid)
6. Draw Token resources
7. Draw Agent organisms (with glow via shadowBlur)
8. Draw particles and full-screen effects
9. Draw name labels
```

### Entity-Data Sync

Canvas entities are **loosely coupled** to WebSocket data:
- Entities maintain their own physics state (position, velocity) updated every frame
- When `tick` data arrives, target properties (size, color) are updated and entities lerp toward them
- When `generation_end` arrives, the evolution transition animation sequence is triggered
- New agents spawn new entities; eliminated agents play death animation then get removed

## 8. Performance

- **Target**: 60fps with 20 agents + ~10 tokens + particles
- **Canvas size**: Full viewport (`window.innerWidth x window.innerHeight`)
- **Particle pool**: Max 200 particles, oldest removed when exceeded
- **Glow effect**: Use `ctx.shadowBlur` (GPU accelerated on most browsers)
- **No off-screen rendering needed** at this scale
