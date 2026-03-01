import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  playerState,
  blockGrid,
  generatedUpToRow,
  setGeneratedUpToRow,
  eventState,
  getCurrentRow,
} from './gameState';
import { useGameStore } from './useGameStore';
import { useAudio } from '../lib/stores/useAudio';
import { generateRow } from './worldGen';
import {
  LANE_COUNT,
  BLOCK_SIZE,
  GENERATE_AHEAD,
  REMOVE_BEHIND,
  BlockType,
  getLaneX,
  getRowY,
  getLayerColors,
  SHAFT_HALF_WIDTH,
  ROW_SPACING,
  GameEvent,
} from './constants';

const MAX_INSTANCES = 500;

export default function World() {
  const softRef = useRef<THREE.InstancedMesh>(null);
  const hardRef = useRef<THREE.InstancedMesh>(null);
  const gemRef = useRef<THREE.InstancedMesh>(null);
  const powerupRef = useRef<THREE.InstancedMesh>(null);
  const wallLeftRef = useRef<THREE.Mesh>(null);
  const wallRightRef = useRef<THREE.Mesh>(null);

  const tmp = useMemo(() => {
    return {
      mat: new THREE.Matrix4(),
      pos: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      scale: new THREE.Vector3(1, 1, 1),
      color: new THREE.Color(),
      rotQuat: new THREE.Quaternion(),
      axis: new THREE.Vector3(0, 1, 0),
    };
  }, []);

  const eventTimerRef = useRef(15 + Math.random() * 10);
  const powerupTimerRef = useRef(0);

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing' || store.paused) return;

    const dt = Math.min(delta, 0.05);
    const currentRow = getCurrentRow();
    const depth = currentRow;

    let targetRow = currentRow + GENERATE_AHEAD;
    while (generatedUpToRow < targetRow) {
      setGeneratedUpToRow(generatedUpToRow + 1);
      generateRow(generatedUpToRow, eventState.activeEvent);
    }

    const minRow = currentRow - REMOVE_BEHIND;
    const keysToDelete: string[] = [];
    blockGrid.forEach((_block, key) => {
      const row = parseInt(key.split(',')[1]);
      if (row < minRow) keysToDelete.push(key);
    });
    keysToDelete.forEach((k) => blockGrid.delete(k));

    eventTimerRef.current -= dt;
    if (
      eventTimerRef.current <= 0 &&
      eventState.activeEvent === 'none'
    ) {
      const events = [
        GameEvent.GEM_RUSH, GameEvent.SPEED_TUNNEL,
        GameEvent.LOW_GRAVITY, GameEvent.TREASURE_POCKET, GameEvent.ROCK_RAIN,
      ];
      const picked = events[Math.floor(Math.random() * events.length)];
      eventState.activeEvent = picked;
      const durations: Record<string, number> = {
        [GameEvent.GEM_RUSH]: 5, [GameEvent.SPEED_TUNNEL]: 3,
        [GameEvent.LOW_GRAVITY]: 5, [GameEvent.TREASURE_POCKET]: 6,
        [GameEvent.ROCK_RAIN]: 4,
      };
      eventState.eventTimeLeft = durations[picked] || 4;
      useGameStore.setState({ activeEvent: picked as GameEvent, eventTimeLeft: eventState.eventTimeLeft });
    }

    if (eventState.activeEvent !== 'none') {
      eventState.eventTimeLeft -= dt;
      useGameStore.setState({ eventTimeLeft: eventState.eventTimeLeft });
      if (eventState.eventTimeLeft <= 0) {
        eventState.activeEvent = 'none';
        eventState.eventTimeLeft = 0;
        eventTimerRef.current = 15 + Math.random() * 10;
        useGameStore.setState({ activeEvent: GameEvent.NONE, eventTimeLeft: 0 });
      }
    }

    const bgMusic = useAudio.getState().backgroundMusic;
    if (bgMusic && !useAudio.getState().isMuted) {
      const depthNorm = Math.min(depth / 800, 1);
      bgMusic.volume = Math.max(0.05, 0.3 - depthNorm * 0.15);
      bgMusic.playbackRate = Math.max(0.85, 1.0 - depthNorm * 0.15);
    }

    if (store.powerupTimer > 0) {
      powerupTimerRef.current = store.powerupTimer - dt;
      if (powerupTimerRef.current <= 0) {
        powerupTimerRef.current = 0;
        useGameStore.setState({
          shieldActive: false,
          magnetActive: false,
          speedBurstActive: false,
          powerupTimer: 0,
        });
      } else {
        useGameStore.setState({ powerupTimer: powerupTimerRef.current });
      }
    }

    const visMin = currentRow - 5;
    const visMax = currentRow + 30;
    const t = state.clock.elapsedTime;

    let softCount = 0;
    let hardCount = 0;
    let gemCount = 0;
    let puCount = 0;

    blockGrid.forEach((block, key) => {
      if (block.broken) return;
      const parts = key.split(',');
      const lane = parseInt(parts[0]);
      const row = parseInt(parts[1]);
      if (row < visMin || row > visMax) return;

      const x = getLaneX(lane);
      const y = getRowY(row);
      const lc = getLayerColors(row);

      switch (block.type) {
        case BlockType.SOFT: {
          if (softCount >= MAX_INSTANCES || !softRef.current) break;
          tmp.pos.set(x, y, 0);
          tmp.quat.identity();
          tmp.scale.set(1, 1, 1);
          tmp.mat.compose(tmp.pos, tmp.quat, tmp.scale);
          softRef.current.setMatrixAt(softCount, tmp.mat);
          tmp.color.setRGB(lc.softBlock[0], lc.softBlock[1], lc.softBlock[2]);
          softRef.current.setColorAt(softCount, tmp.color);
          softCount++;
          break;
        }
        case BlockType.HARD: {
          if (hardCount >= MAX_INSTANCES || !hardRef.current) break;
          tmp.pos.set(x, y, 0);
          tmp.quat.identity();
          tmp.scale.set(1, 1, 1);
          tmp.mat.compose(tmp.pos, tmp.quat, tmp.scale);
          hardRef.current.setMatrixAt(hardCount, tmp.mat);
          tmp.color.setRGB(lc.hardBlock[0], lc.hardBlock[1], lc.hardBlock[2]);
          hardRef.current.setColorAt(hardCount, tmp.color);
          hardCount++;
          break;
        }
        case BlockType.GEM: {
          if (gemCount >= MAX_INSTANCES || !gemRef.current) break;
          tmp.pos.set(x, y + Math.sin(t * 3 + row * 0.7) * 0.12, 0);
          tmp.rotQuat.setFromAxisAngle(tmp.axis, t * 2 + row);
          tmp.scale.set(1, 1, 1);
          tmp.mat.compose(tmp.pos, tmp.rotQuat, tmp.scale);
          gemRef.current.setMatrixAt(gemCount, tmp.mat);
          tmp.color.setRGB(1.0, 0.85, 0.1);
          gemRef.current.setColorAt(gemCount, tmp.color);
          gemCount++;
          break;
        }
        case BlockType.POWERUP_SHIELD:
        case BlockType.POWERUP_MAGNET:
        case BlockType.POWERUP_SPEED: {
          if (puCount >= MAX_INSTANCES || !powerupRef.current) break;
          tmp.pos.set(x, y + Math.sin(t * 2.5 + row) * 0.15, 0);
          tmp.rotQuat.setFromAxisAngle(tmp.axis, t * 1.5 + row);
          tmp.scale.set(1.2, 1.2, 1.2);
          tmp.mat.compose(tmp.pos, tmp.rotQuat, tmp.scale);
          powerupRef.current.setMatrixAt(puCount, tmp.mat);

          if (block.type === BlockType.POWERUP_SHIELD) tmp.color.setRGB(0.2, 0.5, 1.0);
          else if (block.type === BlockType.POWERUP_MAGNET) tmp.color.setRGB(0.8, 0.2, 1.0);
          else tmp.color.setRGB(0.2, 1.0, 0.3);

          powerupRef.current.setColorAt(puCount, tmp.color);
          puCount++;
          break;
        }
      }
    });

    if (softRef.current) {
      softRef.current.count = softCount;
      softRef.current.instanceMatrix.needsUpdate = true;
      if (softRef.current.instanceColor)
        softRef.current.instanceColor.needsUpdate = true;
    }
    if (hardRef.current) {
      hardRef.current.count = hardCount;
      hardRef.current.instanceMatrix.needsUpdate = true;
      if (hardRef.current.instanceColor)
        hardRef.current.instanceColor.needsUpdate = true;
    }
    if (gemRef.current) {
      gemRef.current.count = gemCount;
      gemRef.current.instanceMatrix.needsUpdate = true;
      if (gemRef.current.instanceColor)
        gemRef.current.instanceColor.needsUpdate = true;
    }
    if (powerupRef.current) {
      powerupRef.current.count = puCount;
      powerupRef.current.instanceMatrix.needsUpdate = true;
      if (powerupRef.current.instanceColor)
        powerupRef.current.instanceColor.needsUpdate = true;
    }

    const wallY = playerState.y;
    const wc = getLayerColors(depth);
    if (wallLeftRef.current) {
      wallLeftRef.current.position.set(-SHAFT_HALF_WIDTH, wallY, -0.3);
    }
    if (wallRightRef.current) {
      wallRightRef.current.position.set(SHAFT_HALF_WIDTH, wallY, -0.3);
    }
    wallMat.color.setRGB(wc.wallColor[0], wc.wallColor[1], wc.wallColor[2]);
    wallMat.emissive.setRGB(wc.emissive[0] * 0.3, wc.emissive[1] * 0.3, wc.emissive[2] * 0.3);
    wallMat.emissiveIntensity = wc.emissiveIntensity;
  });

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.25, 0.18, 0.1),
        roughness: 0.9,
        metalness: 0.05,
        emissive: new THREE.Color(0, 0, 0),
      }),
    [],
  );

  return (
    <>
      <instancedMesh ref={softRef} args={[undefined, undefined, MAX_INSTANCES]} frustumCulled={false}>
        <boxGeometry args={[BLOCK_SIZE, BLOCK_SIZE * 0.9, BLOCK_SIZE * 0.7]} />
        <meshStandardMaterial roughness={0.8} metalness={0.05} />
      </instancedMesh>

      <instancedMesh ref={hardRef} args={[undefined, undefined, MAX_INSTANCES]} frustumCulled={false}>
        <boxGeometry args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE * 0.9]} />
        <meshStandardMaterial roughness={0.3} metalness={0.4} />
      </instancedMesh>

      <instancedMesh ref={gemRef} args={[undefined, undefined, MAX_INSTANCES]} frustumCulled={false}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          emissive={new THREE.Color(1, 0.7, 0)}
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.9}
        />
      </instancedMesh>

      <instancedMesh ref={powerupRef} args={[undefined, undefined, MAX_INSTANCES]} frustumCulled={false}>
        <octahedronGeometry args={[0.28, 1]} />
        <meshStandardMaterial
          emissive={new THREE.Color(0.5, 0.5, 1.0)}
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </instancedMesh>

      <mesh ref={wallLeftRef} position={[-SHAFT_HALF_WIDTH, 0, -0.3]}>
        <boxGeometry args={[0.8, 80, 2.5]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      <mesh ref={wallRightRef} position={[SHAFT_HALF_WIDTH, 0, -0.3]}>
        <boxGeometry args={[0.8, 80, 2.5]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
    </>
  );
}
