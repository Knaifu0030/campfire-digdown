import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { LANE_COUNT, LANE_SPACING, BLOCK_SIZE, getLaneX } from './constants';
import { useGameStore } from './useGameStore';

const MENU_BLOCK_ROWS = 8;
const DIG_DEPTH = 12;

export default function MenuScene3D() {
  const shovelRef = useRef<THREE.Group>(null);
  const cameraRef = useRef({ y: 0 });
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

  const time = useRef(0);
  const transitionProgress = useRef(0);

  const blocks = useMemo(() => {
    const arr: { x: number; y: number; color: string; scale: number }[] = [];
    for (let row = 0; row < MENU_BLOCK_ROWS; row++) {
      for (let lane = 0; lane < LANE_COUNT; lane++) {
        if (row === 0 && lane === Math.floor(LANE_COUNT / 2)) continue;
        if (Math.random() < 0.15) continue;
        const isHard = Math.random() < 0.2;
        const isGem = !isHard && Math.random() < 0.1;
        arr.push({
          x: getLaneX(lane),
          y: -(row + 2) * 1.1,
          color: isGem ? '#ffd700' : isHard ? '#2a2a35' : '#6b4226',
          scale: isGem ? 0.4 : BLOCK_SIZE * 0.95,
        });
      }
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    time.current += delta;
    const store = useGameStore.getState();
    const t = store.menuTransition;

    if (t > 0 && transitionProgress.current < 1) {
      transitionProgress.current = Math.min(1, transitionProgress.current + delta * 0.8);
    }

    const p = transitionProgress.current;
    const eased = p * p * (3 - 2 * p);

    const shovelY = 0.5 - eased * DIG_DEPTH;
    const digSpeed = p > 0 ? 6 + p * 14 : 1.5;
    const digAmplitude = p > 0 ? 0.3 + p * 0.2 : 0.15;

    if (shovelRef.current) {
      const swing = Math.sin(time.current * digSpeed) * digAmplitude;
      const bob = Math.sin(time.current * digSpeed * 2) * (p > 0 ? 0.08 : 0.06);
      shovelRef.current.rotation.z = swing;
      shovelRef.current.position.y = shovelY + bob;
    }

    const camY = -eased * DIG_DEPTH * 0.6;
    cameraRef.current.y += (camY - cameraRef.current.y) * Math.min(1, 4 * delta);
    state.camera.position.y = cameraRef.current.y;
    state.camera.lookAt(0, cameraRef.current.y - 2, 0);

    if (p >= 1 && t > 0) {
      store.startGame();
    }
  });

  return (
    <>
      <fog attach="fog" args={['#1a0f08', 6, 25]} />
      <ambientLight intensity={0.5} color="#c49a6c" />
      <directionalLight intensity={0.9} position={[3, 8, 6]} color="#ffe8cc" />
      <pointLight position={[0, 2, 6]} intensity={0.4} color="#4488ff" distance={20} />
      <pointLight position={[-3, -3, 4]} intensity={0.2} color="#ff8844" distance={15} />

      <group ref={shovelRef} position={[0, 0.5, 0]}>
        <primitive
          object={shovelModel}
          scale={[2.5, 2.5, 2.5]}
          rotation={[0, Math.PI, 0]}
        />
      </group>

      <mesh position={[-LANE_COUNT * LANE_SPACING * 0.5 - 0.5, -3, 0]} receiveShadow>
        <boxGeometry args={[0.8, 12, 2]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[LANE_COUNT * LANE_SPACING * 0.5 + 0.5, -3, 0]} receiveShadow>
        <boxGeometry args={[0.8, 12, 2]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>

      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0]} castShadow receiveShadow>
          <boxGeometry args={[b.scale, b.scale, b.scale]} />
          <meshStandardMaterial
            color={b.color}
            roughness={0.7}
            emissive={b.color === '#ffd700' ? '#aa8800' : '#000000'}
            emissiveIntensity={b.color === '#ffd700' ? 0.5 : 0}
          />
        </mesh>
      ))}
    </>
  );
}
