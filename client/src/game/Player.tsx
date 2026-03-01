import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  playerState,
  getBlock,
  addParticles,
  triggerCameraShake,
  ParticleData,
  eventState,
  getCurrentRow,
} from './gameState';
import { useGameStore } from './useGameStore';
import { useAudio } from '../lib/stores/useAudio';
import {
  LANE_COUNT,
  BASE_SPEED,
  MAX_SPEED,
  SPEED_INCREASE_RATE,
  DASH_SPEED_MULT,
  DASH_DURATION,
  DASH_COOLDOWN,
  PLAYER_SIZE,
  ROW_SPACING,
  BlockType,
  getLaneX,
  getRowY,
  getLayerColors,
  GameEvent,
} from './constants';

export enum Controls {
  left = 'left',
  right = 'right',
  dash = 'dash',
}

function spawnBlockParticles(
  lane: number,
  row: number,
  color: [number, number, number],
) {
  const x = getLaneX(lane);
  const y = getRowY(row);
  const count = 8;
  const np: ParticleData[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const spd = 2 + Math.random() * 3;
    np.push({
      x,
      y,
      z: 0,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      vz: (Math.random() - 0.5) * 2,
      life: 0.35 + Math.random() * 0.25,
      color: [
        Math.min(1, Math.max(0, color[0] + (Math.random() - 0.5) * 0.2)),
        Math.min(1, Math.max(0, color[1] + (Math.random() - 0.5) * 0.2)),
        Math.min(1, Math.max(0, color[2] + (Math.random() - 0.5) * 0.2)),
      ],
      size: 0.06 + Math.random() * 0.06,
    });
  }
  addParticles(np);
}

export default function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const shovelRef = useRef<THREE.Group>(null);
  const [, getControls] = useKeyboardControls<Controls>();
  const prevLeft = useRef(false);
  const prevRight = useRef(false);
  const prevDash = useRef(false);
  const scaleRef = useRef(new THREE.Vector3(1, 1, 1));
  const targetScale = useRef(new THREE.Vector3(1, 1, 1));
  const squashTimer = useRef(0);
  const digTime = useRef(0);

  const { scene: shovelScene } = useGLTF('/models/shovel.glb');
  const shovelModel = useMemo(() => {
    const clone = shovelScene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
      }
    });
    return clone;
  }, [shovelScene]);

  const shieldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.3, 0.7, 1.0),
        transparent: true,
        opacity: 0.25,
        emissive: new THREE.Color(0.15, 0.4, 0.8),
        emissiveIntensity: 0.6,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useFrame((_state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing' || !playerState.alive || store.paused) return;

    const dt = Math.min(delta, 0.05);
    const controls = getControls();

    if (controls.left && !prevLeft.current) {
      playerState.lane = Math.max(0, playerState.lane - 1);
    }
    if (controls.right && !prevRight.current) {
      playerState.lane = Math.min(LANE_COUNT - 1, playerState.lane + 1);
    }
    if (controls.dash && !prevDash.current && playerState.dashCooldown <= 0) {
      playerState.dashActive = true;
      playerState.dashTimer = DASH_DURATION;
      playerState.dashCooldown = DASH_COOLDOWN;
      targetScale.current.set(0.7, 1.4, 0.7);
    }
    prevLeft.current = controls.left;
    prevRight.current = controls.right;
    prevDash.current = controls.dash;

    if (playerState.dashActive) {
      playerState.dashTimer -= dt;
      if (playerState.dashTimer <= 0) {
        playerState.dashActive = false;
        targetScale.current.set(1.3, 0.7, 1.3);
        squashTimer.current = 0.1;
      }
    }
    if (squashTimer.current > 0) {
      squashTimer.current -= dt;
      if (squashTimer.current <= 0) {
        targetScale.current.set(1, 1, 1);
      }
    }
    playerState.dashCooldown = Math.max(0, playerState.dashCooldown - dt);

    const depth = -playerState.y;
    let speed = BASE_SPEED + (depth / 100) * SPEED_INCREASE_RATE;
    speed = Math.min(speed, MAX_SPEED);

    if (store.speedBurstActive || eventState.activeEvent === GameEvent.SPEED_TUNNEL) {
      speed *= 1.8;
    }
    if (eventState.activeEvent === GameEvent.LOW_GRAVITY) {
      speed *= 0.5;
    }
    if (playerState.dashActive) {
      speed *= DASH_SPEED_MULT;
    }

    playerState.gapSpeedBoost = Math.max(0, playerState.gapSpeedBoost - dt * 2);
    speed *= 1 + playerState.gapSpeedBoost;

    playerState.speed = speed;
    playerState.y -= speed * dt;

    const targetX = getLaneX(playerState.lane);
    const dx = targetX - playerState.visualX;
    const springForce = dx * 280;
    const dampingForce = -playerState.xVelocity * 18;
    playerState.xVelocity += (springForce + dampingForce) * dt;
    playerState.visualX += playerState.xVelocity * dt;

    if (Math.abs(dx) < 0.01 && Math.abs(playerState.xVelocity) < 0.1) {
      playerState.visualX = targetX;
      playerState.xVelocity = 0;
    }

    const currentRow = getCurrentRow();
    while (playerState.lastCheckedRow < currentRow) {
      playerState.lastCheckedRow++;
      const row = playerState.lastCheckedRow;
      const block = getBlock(playerState.lane, row);
      if (!block || block.broken) {
        playerState.gapSpeedBoost = Math.min(0.5, playerState.gapSpeedBoost + 0.12);
        continue;
      }

      const layerColors = getLayerColors(row);

      switch (block.type) {
        case BlockType.SOFT: {
          block.broken = true;
          spawnBlockParticles(playerState.lane, row, layerColors.softBlock);
          triggerCameraShake(0.2);
          targetScale.current.set(1.15, 0.85, 1.15);
          squashTimer.current = 0.08;
          useAudio.getState().playHit();
          break;
        }
        case BlockType.HARD: {
          if (store.shieldActive) {
            useGameStore.setState({ shieldActive: false });
            block.broken = true;
            spawnBlockParticles(playerState.lane, row, [0.3, 0.8, 1.0]);
            triggerCameraShake(0.6);
          } else {
            triggerCameraShake(1.5);
            playerState.alive = false;
            useGameStore.getState().endGame();
            return;
          }
          break;
        }
        case BlockType.GEM: {
          block.broken = true;
          useGameStore.setState((s) => ({ gems: s.gems + 1 }));
          spawnBlockParticles(playerState.lane, row, [1.0, 0.85, 0.1]);
          useAudio.getState().playSuccess();
          break;
        }
        case BlockType.POWERUP_SHIELD: {
          block.broken = true;
          useGameStore.setState({ shieldActive: true, powerupTimer: 15 });
          spawnBlockParticles(playerState.lane, row, [0.2, 0.5, 1.0]);
          useAudio.getState().playSuccess();
          break;
        }
        case BlockType.POWERUP_MAGNET: {
          block.broken = true;
          useGameStore.setState({ magnetActive: true, powerupTimer: 8 });
          spawnBlockParticles(playerState.lane, row, [0.8, 0.2, 1.0]);
          useAudio.getState().playSuccess();
          break;
        }
        case BlockType.POWERUP_SPEED: {
          block.broken = true;
          useGameStore.setState({ speedBurstActive: true, powerupTimer: 5 });
          spawnBlockParticles(playerState.lane, row, [0.2, 1.0, 0.3]);
          useAudio.getState().playSuccess();
          break;
        }
      }
    }

    for (let r = currentRow - 1; r <= currentRow + 1; r++) {
      const gemBlock = getBlock(playerState.lane, r);
      if (gemBlock && !gemBlock.broken && gemBlock.type === BlockType.GEM) {
        gemBlock.broken = true;
        useGameStore.setState((s) => ({ gems: s.gems + 1 }));
        spawnBlockParticles(playerState.lane, r, [1.0, 0.85, 0.1]);
        useAudio.getState().playSuccess();
      }
    }

    if (store.magnetActive) {
      const magnetRange = 4;
      for (let r = currentRow - 2; r <= currentRow + magnetRange; r++) {
        for (let l = 0; l < LANE_COUNT; l++) {
          const block = getBlock(l, r);
          if (block && block.type === BlockType.GEM && !block.broken) {
            const dist =
              Math.abs(l - playerState.lane) + Math.abs(r - currentRow);
            if (dist <= magnetRange) {
              block.broken = true;
              useGameStore.setState((s) => ({ gems: s.gems + 1 }));
              spawnBlockParticles(l, r, [1.0, 0.85, 0.1]);
            }
          }
        }
      }
    }

    const displayDepth = Math.floor(-playerState.y / ROW_SPACING);
    if (Math.abs(displayDepth - store.depth) >= 1) {
      useGameStore.setState({ depth: displayDepth });
    }

    useGameStore.setState({
      dashCooldownPct: playerState.dashCooldown / DASH_COOLDOWN,
    });

    scaleRef.current.lerp(targetScale.current, Math.min(1, 12 * dt));

    digTime.current += dt * (playerState.dashActive ? 18 : 10);

    if (groupRef.current) {
      groupRef.current.position.set(playerState.visualX, playerState.y, 0);
      groupRef.current.scale.copy(scaleRef.current);
    }

    if (shovelRef.current) {
      const digSwing = Math.sin(digTime.current) * 0.25;
      const digBob = Math.sin(digTime.current * 2) * 0.04;
      shovelRef.current.rotation.set(0, 0, digSwing);
      shovelRef.current.position.y = digBob;
    }
  });

  const shieldActive = useGameStore((s) => s.shieldActive);

  return (
    <group ref={groupRef}>
      <group ref={shovelRef}>
        <primitive
          object={shovelModel}
          scale={[2.0, 2.0, 2.0]}
          rotation={[0, Math.PI, 0]}
        />
      </group>
      {shieldActive && (
        <mesh material={shieldMat}>
          <sphereGeometry args={[PLAYER_SIZE * 0.85, 16, 16]} />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload('/models/shovel.glb');
