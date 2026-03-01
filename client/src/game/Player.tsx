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
  SPRING_STIFFNESS,
  SPRING_DAMPING,
  SPRING_SNAP_THRESHOLD,
  SPRING_SNAP_VELOCITY,
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
  count = 12,
  speed = 3.5,
) {
  const x = getLaneX(lane);
  const y = getRowY(row);
  const np: Omit<ParticleData, 'maxLife'>[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const spd = speed * 0.6 + Math.random() * speed;
    np.push({
      x: x + (Math.random() - 0.5) * 0.3,
      y: y + (Math.random() - 0.5) * 0.2,
      z: (Math.random() - 0.5) * 0.3,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd * 0.8 + 1.5,
      vz: (Math.random() - 0.5) * spd * 0.5,
      life: 0.3 + Math.random() * 0.35,
      color: [
        Math.min(1, Math.max(0, color[0] + (Math.random() - 0.5) * 0.15)),
        Math.min(1, Math.max(0, color[1] + (Math.random() - 0.5) * 0.15)),
        Math.min(1, Math.max(0, color[2] + (Math.random() - 0.5) * 0.15)),
      ],
      size: 0.05 + Math.random() * 0.08,
    });
  }
  addParticles(np);
}

function spawnGemSparkles(lane: number, row: number) {
  const x = getLaneX(lane);
  const y = getRowY(row);
  const np: Omit<ParticleData, 'maxLife'>[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const spd = 2 + Math.random() * 4;
    np.push({
      x: x + (Math.random() - 0.5) * 0.2,
      y: y + (Math.random() - 0.5) * 0.2,
      z: (Math.random() - 0.5) * 0.4,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd + 2,
      vz: (Math.random() - 0.5) * spd * 0.6,
      life: 0.4 + Math.random() * 0.3,
      color: [1.0, 0.85 + Math.random() * 0.15, 0.1 + Math.random() * 0.3],
      size: 0.03 + Math.random() * 0.05,
    });
  }
  addParticles(np);
}

function spawnDashTrail(x: number, y: number) {
  const np: Omit<ParticleData, 'maxLife'>[] = [];
  for (let i = 0; i < 3; i++) {
    np.push({
      x: x + (Math.random() - 0.5) * 0.4,
      y: y + 0.3 + Math.random() * 0.5,
      z: (Math.random() - 0.5) * 0.3,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 2 + Math.random() * 2,
      vz: (Math.random() - 0.5) * 0.8,
      life: 0.15 + Math.random() * 0.12,
      color: [0.3 + Math.random() * 0.2, 0.7 + Math.random() * 0.3, 1.0],
      size: 0.04 + Math.random() * 0.04,
    });
  }
  addParticles(np);
}

function spawnDeathParticles(x: number, y: number) {
  const np: Omit<ParticleData, 'maxLife'>[] = [];
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const spd = 3 + Math.random() * 5;
    np.push({
      x,
      y,
      z: 0,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      vz: (Math.random() - 0.5) * 4,
      life: 0.5 + Math.random() * 0.5,
      color: [0.8 + Math.random() * 0.2, 0.1 + Math.random() * 0.2, 0.0],
      size: 0.06 + Math.random() * 0.1,
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
  const deathTimer = useRef(0);
  const dashTrailTimer = useRef(0);
  const tiltAngle = useRef(0);
  const tiltTarget = useRef(0);

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
    if (store.phase !== 'playing' || store.paused) return;

    const dt = Math.min(delta, 0.05);

    if (!playerState.alive) {
      deathTimer.current += dt;
      if (deathTimer.current < 0.6) {
        const slowDt = dt * 0.15;
        playerState.y -= playerState.speed * slowDt * 0.3;
        if (groupRef.current) {
          groupRef.current.position.set(playerState.visualX, playerState.y, 0);
          const shake = Math.sin(deathTimer.current * 40) * (0.6 - deathTimer.current) * 0.3;
          groupRef.current.position.x += shake;
          const s = 1 - deathTimer.current * 0.5;
          groupRef.current.scale.set(s, s, s);
        }
      }
      if (deathTimer.current >= 0.6) {
        useGameStore.getState().endGame();
        deathTimer.current = 0;
      }
      return;
    }

    const controls = getControls();

    if (controls.left && !prevLeft.current) {
      playerState.lane = Math.max(0, playerState.lane - 1);
      tiltTarget.current = 0.15;
    }
    if (controls.right && !prevRight.current) {
      playerState.lane = Math.min(LANE_COUNT - 1, playerState.lane + 1);
      tiltTarget.current = -0.15;
    }
    if (controls.dash && !prevDash.current && playerState.dashCooldown <= 0) {
      playerState.dashActive = true;
      playerState.dashTimer = DASH_DURATION;
      playerState.dashCooldown = DASH_COOLDOWN;
      targetScale.current.set(0.75, 1.35, 0.75);
      triggerCameraShake(0.3);
    }
    prevLeft.current = controls.left;
    prevRight.current = controls.right;
    prevDash.current = controls.dash;

    if (playerState.dashActive) {
      playerState.dashTimer -= dt;
      dashTrailTimer.current -= dt;
      if (dashTrailTimer.current <= 0) {
        spawnDashTrail(playerState.visualX, playerState.y);
        dashTrailTimer.current = 0.03;
      }
      if (playerState.dashTimer <= 0) {
        playerState.dashActive = false;
        targetScale.current.set(1.25, 0.75, 1.25);
        squashTimer.current = 0.12;
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

    playerState.gapSpeedBoost = Math.max(0, playerState.gapSpeedBoost - dt * 1.8);
    speed *= 1 + playerState.gapSpeedBoost;

    playerState.speed = speed;
    playerState.y -= speed * dt;

    const targetX = getLaneX(playerState.lane);
    const dx = targetX - playerState.visualX;
    const springForce = dx * SPRING_STIFFNESS;
    const dampingForce = -playerState.xVelocity * SPRING_DAMPING;
    playerState.xVelocity += (springForce + dampingForce) * dt;
    playerState.visualX += playerState.xVelocity * dt;

    if (Math.abs(dx) < SPRING_SNAP_THRESHOLD && Math.abs(playerState.xVelocity) < SPRING_SNAP_VELOCITY) {
      playerState.visualX = targetX;
      playerState.xVelocity = 0;
    }

    tiltTarget.current *= (1 - Math.min(1, 6 * dt));
    tiltAngle.current += (tiltTarget.current - tiltAngle.current) * Math.min(1, 10 * dt);

    const currentRow = getCurrentRow();
    while (playerState.lastCheckedRow < currentRow) {
      playerState.lastCheckedRow++;
      const row = playerState.lastCheckedRow;
      const block = getBlock(playerState.lane, row);
      if (!block || block.broken) {
        playerState.gapSpeedBoost = Math.min(0.5, playerState.gapSpeedBoost + 0.1);
        continue;
      }

      const layerColors = getLayerColors(row);

      switch (block.type) {
        case BlockType.SOFT: {
          block.broken = true;
          spawnBlockParticles(playerState.lane, row, layerColors.softBlock, 10, 3);
          triggerCameraShake(0.15);
          targetScale.current.set(1.12, 0.88, 1.12);
          squashTimer.current = 0.1;
          useAudio.getState().playHit();
          break;
        }
        case BlockType.HARD: {
          if (store.shieldActive) {
            useGameStore.setState({ shieldActive: false });
            block.broken = true;
            spawnBlockParticles(playerState.lane, row, [0.3, 0.8, 1.0], 18, 5);
            triggerCameraShake(0.8);
            targetScale.current.set(0.8, 1.2, 0.8);
            squashTimer.current = 0.15;
          } else {
            triggerCameraShake(2.0);
            spawnDeathParticles(playerState.visualX, playerState.y);
            playerState.alive = false;
            deathTimer.current = 0;
            return;
          }
          break;
        }
        case BlockType.GEM: {
          block.broken = true;
          useGameStore.setState((s) => ({ gems: s.gems + 1 }));
          spawnGemSparkles(playerState.lane, row);
          targetScale.current.set(1.08, 0.92, 1.08);
          squashTimer.current = 0.06;
          useAudio.getState().playSuccess();
          break;
        }
        case BlockType.POWERUP_SHIELD: {
          block.broken = true;
          useGameStore.setState({ shieldActive: true, powerupTimer: 15 });
          spawnBlockParticles(playerState.lane, row, [0.2, 0.5, 1.0], 20, 4);
          triggerCameraShake(0.3);
          useAudio.getState().playSuccess();
          break;
        }
        case BlockType.POWERUP_MAGNET: {
          block.broken = true;
          useGameStore.setState({ magnetActive: true, powerupTimer: 8 });
          spawnBlockParticles(playerState.lane, row, [0.8, 0.2, 1.0], 20, 4);
          triggerCameraShake(0.3);
          useAudio.getState().playSuccess();
          break;
        }
        case BlockType.POWERUP_SPEED: {
          block.broken = true;
          useGameStore.setState({ speedBurstActive: true, powerupTimer: 5 });
          spawnBlockParticles(playerState.lane, row, [0.2, 1.0, 0.3], 20, 4);
          triggerCameraShake(0.3);
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
        spawnGemSparkles(playerState.lane, r);
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
              spawnGemSparkles(l, r);
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

    const lerpSpeed = Math.min(1, 14 * dt);
    scaleRef.current.lerp(targetScale.current, lerpSpeed);

    const digSpeed = playerState.dashActive ? 20 : (8 + speed * 0.8);
    digTime.current += dt * digSpeed;

    if (groupRef.current) {
      groupRef.current.position.set(playerState.visualX, playerState.y, 0);
      groupRef.current.scale.copy(scaleRef.current);
    }

    if (shovelRef.current) {
      const digAmplitude = playerState.dashActive ? 0.35 : 0.2;
      const digSwing = Math.sin(digTime.current) * digAmplitude;
      const digBob = Math.sin(digTime.current * 2) * 0.05;
      shovelRef.current.rotation.set(tiltAngle.current * 0.5, 0, digSwing);
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
