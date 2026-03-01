import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { particles } from './gameState';
import { useGameStore } from './useGameStore';

const MAX_PARTICLES = 600;

export default function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const tmp = useMemo(() => ({
    mat: new THREE.Matrix4(),
    pos: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    scl: new THREE.Vector3(),
    col: new THREE.Color(),
  }), []);

  useFrame((_state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing' && store.phase !== 'gameover') return;

    const dt = Math.min(delta, 0.05);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 9 * dt;
      p.vx *= (1 - 2.5 * dt);
      p.vz *= (1 - 2.5 * dt);
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    if (!meshRef.current) return;

    const count = Math.min(particles.length, MAX_PARTICLES);
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const lifeRatio = Math.max(0, p.life / p.maxLife);
      const fadeOut = lifeRatio < 0.3 ? lifeRatio / 0.3 : 1;
      const s = p.size * fadeOut;
      tmp.pos.set(p.x, p.y, p.z);
      tmp.quat.identity();
      tmp.scl.set(s, s, s);
      tmp.mat.compose(tmp.pos, tmp.quat, tmp.scl);
      meshRef.current.setMatrixAt(i, tmp.mat);
      const brightness = 0.6 + lifeRatio * 0.4;
      tmp.col.setRGB(p.color[0] * brightness, p.color[1] * brightness, p.color[2] * brightness);
      meshRef.current.setColorAt(i, tmp.col);
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        roughness={0.4}
        metalness={0.3}
        emissive={new THREE.Color(0.2, 0.15, 0.1)}
        emissiveIntensity={0.3}
      />
    </instancedMesh>
  );
}
