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
- `constants.ts` - Game constants, types, layer color configs, helper functions. Includes spring physics constants (SPRING_STIFFNESS=320, SPRING_DAMPING=22)
- `gameState.ts` - Shared mutable game state (block grid, player state, particles with maxLife for fade-out, camera shake with exponential decay, events)
- `useGameStore.ts` - Zustand store for UI-reactive state (phase, depth, gems, powerups, events, menuTransition)
- `worldGen.ts` - Procedural row generation with depth-based difficulty scaling using depthFactor (0-1 over 800 rows)
- `Player.tsx` - Player component with spring-based lane movement, dash trail particles, death slow-mo sequence, gem sparkle effects, shovel tilt on lane change
- `World.tsx` - World rendering with InstancedMesh, chunk generation/cleanup, event system, wall rendering
- `FollowCamera.tsx` - Smooth follow camera with speed-based dynamic look-ahead and offset, exponential camera shake
- `Particles.tsx` - InstancedMesh particle system (max 600) with maxLife-based fade-out and brightness scaling
- `Lighting.tsx` - Dynamic depth-based lighting with smoothed transitions, player glow light (dash turns it blue), fog/background lerping
- `GameScene.tsx` - Main 3D scene composition with post-processing (Bloom, Vignette)
- `GameHUD.tsx` - In-game HUD overlay (depth counter, gems, powerups with glow, dash cooldown bar, event banners with color-coded slide-in animation)
- `MenuScreen.tsx` - Title/start screen with transition animation (logo slides up, fades)
- `MenuScene3D.tsx` - 3D menu scene with shovel idle animation and dig-down transition
- `GameOverScreen.tsx` - Game over screen with red flash, phased fade-in, audio fade-out, stats display
- `PauseMenu.tsx` - Pause menu with resume, exit, volume controls, and key rebinding
- `useControlsStore.ts` - Zustand store for customizable key bindings

### Existing Files
- `client/src/lib/stores/useAudio.tsx` - Audio management (background, hit, success sounds)
- `client/src/App.tsx` - Root component wiring Canvas, KeyboardControls, and UI screens

### Server (minimal)
- `server/index.ts` - Express server
- `server/routes.ts` - API routes (none used by game)
- `server/vite.ts` - Vite dev middleware
- `server/static.ts` - Production static file serving

## Game Design

### Font
- All UI uses "Pirata One" gothic font (@fontsource/pirata-one)

### Controls (Remappable via Pause > Options)
- A / Left Arrow: Move left one lane (default)
- D / Right Arrow: Move right one lane (default)
- Space: Dash downward (3.2x speed, 0.7s cooldown) (default)
- Escape: Toggle pause menu

### Depth Layers
1. Surface Soil (0-100m): Warm brown tones
2. Rock Caverns (100-300m): Cool grey-blue tones
3. Magma Zone (300-600m): Red/orange with emissive glow
4. Crystal Abyss (600m+): Purple/teal with neon glow

### Block Types
- SOFT: Breakable on contact, brown/grey/red/blue based on depth
- HARD: Game over on contact (unless shielded), darker appearance
- GEM: Collectible, yellow octahedrons with sparkle particles
- POWERUP_SHIELD/MAGNET/SPEED: Temporary abilities

### Powerups
- Shield: Absorbs one hard block collision (15s)
- Magnet: Auto-collects nearby gems (8s)
- Speed Burst: 1.8x speed for 5s

### Random Events (every 15-25s)
- Gem Rush: Extra gems spawn
- Speed Tunnel: Increased fall speed
- Low Gravity: Reduced fall speed
- Treasure Pocket: Extra gems and powerups, fewer hard blocks
- Rock Rain: More hard blocks

### Mechanics
- Spring-based lane movement (stiffness=320, damping=22) with snap thresholds
- Gap speed boost: accumulates when passing through empty rows (+0.1 per gap, max 0.5, decays at 1.8/s)
- Death sequence: 0.6s slow-mo with shake effect and particle burst before game over
- Dash trail: blue particles emitted every 0.03s during dash
- Camera: speed-based dynamic look-ahead and Y offset for anticipation feel
- Particles: maxLife-based fade-out with brightness scaling, capacity 800 (rendered up to 600)

## Performance Notes
- Blocks rendered via InstancedMesh (max 500 per type)
- Particles via InstancedMesh (max 600)
- Chunks generated ahead (40 rows) and cleaned up behind (15 rows)
- Game state separated: Zustand for UI, module-level for per-frame data
- Lighting transitions smoothed with lerp to avoid popping
- Camera shake uses exponential decay for natural feel
