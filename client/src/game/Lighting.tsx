import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { playerState } from './gameState';
import { useGameStore } from './useGameStore';
import { getLayerColors, ROW_SPACING } from './constants';

export default function Lighting() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const playerLightRef = useRef<THREE.PointLight>(null);
  const { scene } = useThree();

  const bgColor = useMemo(() => new THREE.Color(), []);
  const fogColor = useMemo(() => new THREE.Color(), []);

  useFrame((_state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing' && store.phase !== 'gameover') return;

    const dt = Math.min(delta, 0.05);
    const depth = Math.floor(-playerState.y / ROW_SPACING);
    const lc = getLayerColors(depth);

    const targetBg = bgColor.setRGB(lc.background[0], lc.background[1], lc.background[2]);
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(targetBg, Math.min(1, 3 * dt));
    } else {
      scene.background = targetBg.clone();
    }

    if (scene.fog) {
      const fog = scene.fog as THREE.Fog;
      fogColor.setRGB(lc.fog[0], lc.fog[1], lc.fog[2]);
      fog.color.lerp(fogColor, Math.min(1, 3 * dt));
      fog.near += (lc.fogNear - fog.near) * Math.min(1, 2 * dt);
      fog.far += (lc.fogFar - fog.far) * Math.min(1, 2 * dt);
    }

    if (ambientRef.current) {
      ambientRef.current.color.setRGB(lc.ambient[0], lc.ambient[1], lc.ambient[2]);
      ambientRef.current.intensity += (lc.ambientIntensity - ambientRef.current.intensity) * Math.min(1, 3 * dt);
    }

    if (dirRef.current) {
      dirRef.current.color.setRGB(lc.directional[0], lc.directional[1], lc.directional[2]);
      dirRef.current.position.set(2, playerState.y + 10, 8);
      dirRef.current.target.position.set(0, playerState.y, 0);
      dirRef.current.target.updateMatrixWorld();
    }

    if (playerLightRef.current) {
      playerLightRef.current.position.set(playerState.visualX, playerState.y + 0.5, 3);
      const dashGlow = playerState.dashActive ? 1.5 : 0;
      playerLightRef.current.intensity += ((0.5 + dashGlow) - playerLightRef.current.intensity) * Math.min(1, 8 * dt);
      if (playerState.dashActive) {
        playerLightRef.current.color.setRGB(0.3, 0.7, 1.0);
      } else {
        playerLightRef.current.color.setRGB(1.0, 0.9, 0.7);
      }
    }
  });

  return (
    <>
      <fog attach="fog" args={['#1a0f08', 8, 30]} />
      <ambientLight ref={ambientRef} intensity={0.6} />
      <directionalLight ref={dirRef} intensity={0.8} position={[2, 10, 8]} />
      <pointLight ref={playerLightRef} position={[0, 0, 3]} intensity={0.5} color="#ffeecc" distance={12} decay={2} />
    </>
  );
}
