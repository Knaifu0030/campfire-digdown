import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { LANE_COUNT, LANE_SPACING, BLOCK_SIZE, getLaneX } from './constants';

const MENU_BLOCK_ROWS = 8;

export default function MenuScene3D() {
  const shovelRef = useRef<THREE.Group>(null);
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

  useFrame((_state, delta) => {
    time.current += delta;

    if (shovelRef.current) {
      const idleSwing = Math.sin(time.current * 1.5) * 0.15;
      const idleBob = Math.sin(time.current * 2.5) * 0.06;
      shovelRef.current.rotation.z = idleSwing;
      shovelRef.current.position.y = idleBob + 0.5;
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
