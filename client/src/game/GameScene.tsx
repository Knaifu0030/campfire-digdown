import { Suspense } from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Player from './Player';
import World from './World';
import FollowCamera from './FollowCamera';
import Particles from './Particles';
import Lighting from './Lighting';
import MenuScene3D from './MenuScene3D';
import { useGameStore } from './useGameStore';

export default function GameScene() {
  const phase = useGameStore((s) => s.phase);
  const depth = useGameStore((s) => s.depth);

  if (phase === 'menu') {
    return (
      <Suspense fallback={null}>
        <MenuScene3D />
        <EffectComposer>
          <Bloom
            intensity={0.25}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette darkness={0.5} offset={0.3} />
        </EffectComposer>
      </Suspense>
    );
  }

  const vignetteIntensity = Math.min(0.3 + depth * 0.0003, 0.7);
  const bloomIntensity = depth > 300 ? Math.min(0.3 + (depth - 300) * 0.001, 0.8) : 0.15;

  return (
    <Suspense fallback={null}>
      <FollowCamera />
      <Lighting />
      <Player />
      <World />
      <Particles />
      <EffectComposer>
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette darkness={vignetteIntensity} offset={0.3} />
      </EffectComposer>
    </Suspense>
  );
}
