import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { playerState } from './gameState';
import { useGameStore } from './useGameStore';
import { getLayerColors, ROW_SPACING } from './constants';

export default function Lighting() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();

  useFrame(() => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing' && store.phase !== 'gameover') return;

    const depth = Math.floor(-playerState.y / ROW_SPACING);
    const lc = getLayerColors(depth);

    scene.background = new THREE.Color(lc.background[0], lc.background[1], lc.background[2]);

    if (scene.fog) {
      (scene.fog as THREE.Fog).color.setRGB(lc.fog[0], lc.fog[1], lc.fog[2]);
      (scene.fog as THREE.Fog).near = lc.fogNear;
      (scene.fog as THREE.Fog).far = lc.fogFar;
    }

    if (ambientRef.current) {
      ambientRef.current.color.setRGB(lc.ambient[0], lc.ambient[1], lc.ambient[2]);
      ambientRef.current.intensity = lc.ambientIntensity;
    }

    if (dirRef.current) {
      dirRef.current.color.setRGB(lc.directional[0], lc.directional[1], lc.directional[2]);
      dirRef.current.position.set(2, playerState.y + 10, 8);
      dirRef.current.target.position.set(0, playerState.y, 0);
      dirRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <fog attach="fog" args={['#1a0f08', 8, 30]} />
      <ambientLight ref={ambientRef} intensity={0.6} />
      <directionalLight ref={dirRef} intensity={0.8} position={[2, 10, 8]} />
      <pointLight
        position={[0, 0, 5]}
        intensity={0.3}
        color="#4488ff"
        distance={20}
      />
    </>
  );
}
