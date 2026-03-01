# DIG DOWN - 3D Arcade Digging Game

## Overview
"DIG DOWN" is an endless vertical digging arcade game built with React Three Fiber. The player continuously digs downward through procedurally generated terrain, avoiding hard blocks, collecting gems, and using powerups. The environment changes as the player descends through four distinct depth layers.

## Tech Stack
- **Frontend**: React 18 + TypeScript + React Three Fiber
- **3D**: Three.js via @react-three/fiber, @react-three/drei, @react-three/postprocessing
- **State**: Zustand for UI state, module-level shared state for game loop data
- **Styling**: Tailwind CSS + inline styles for game UI
- **Server**: Express.js (serves the Vite app)
- **Build**: Vite + esbuild

## Architecture

### Game Files (`client/src/game/`)
- `constants.ts` - Game constants, types, layer color configs, helper functions
- `gameState.ts` - Shared mutable game state (block grid, player state, particles, camera shake, events) - NOT React state, used for per-frame game loop data
- `useGameStore.ts` - Zustand store for UI-reactive state (phase, depth, gems, powerups, events)
- `worldGen.ts` - Procedural row generation with difficulty scaling
- `Player.tsx` - Player component with movement, collision, squash/stretch effects
- `World.tsx` - World rendering with InstancedMesh, chunk generation/cleanup, event system, wall rendering
- `FollowCamera.tsx` - Smooth follow camera with shake
- `Particles.tsx` - InstancedMesh particle system for block breaking
- `Lighting.tsx` - Dynamic depth-based lighting, fog, and background color
- `GameScene.tsx` - Main 3D scene composition with post-processing (Bloom, Vignette)
- `GameHUD.tsx` - In-game HUD overlay (depth, gems, powerups, mute toggle)
- `MenuScreen.tsx` - Title/start screen
- `GameOverScreen.tsx` - Game over screen with stats

### Existing Files
- `client/src/lib/stores/useAudio.tsx` - Audio management (background, hit, success sounds)
- `client/src/lib/stores/useGame.tsx` - Original game store (not used by DIG DOWN)
- `client/src/App.tsx` - Root component wiring Canvas, KeyboardControls, and UI screens

### Server (minimal)
- `server/index.ts` - Express server
- `server/routes.ts` - API routes (none used by game)
- `server/vite.ts` - Vite dev middleware
- `server/static.ts` - Production static file serving

## Game Design

### Controls
- A / Left Arrow: Move left one lane
- D / Right Arrow: Move right one lane
- Space: Dash downward (3.5x speed, 0.8s cooldown)

### Depth Layers
1. Surface Soil (0-100m): Warm brown tones
2. Rock Caverns (100-300m): Cool grey-blue tones
3. Magma Zone (300-600m): Red/orange with emissive glow
4. Crystal Abyss (600m+): Purple/teal with neon glow

### Block Types
- SOFT: Breakable on contact, brown/grey/red/blue based on depth
- HARD: Game over on contact (unless shielded), darker appearance
- GEM: Collectible, yellow octahedrons
- POWERUP_SHIELD/MAGNET/SPEED: Temporary abilities

### Powerups
- Shield: Absorbs one hard block collision (15s)
- Magnet: Auto-collects nearby gems (8s)
- Speed Burst: 1.8x speed for 5s

### Random Events (every 15-25s)
- Gem Rush: Extra gems spawn
- Speed Tunnel: Increased fall speed
- Low Gravity: Reduced fall speed

## Performance Notes
- Blocks rendered via InstancedMesh (max 500 per type)
- Particles via InstancedMesh (max 500)
- Chunks generated ahead (35 rows) and cleaned up behind (15 rows)
- Game state separated: Zustand for UI, module-level for per-frame data
