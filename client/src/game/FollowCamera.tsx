import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import {
  playerState,
  cameraShakeIntensity,
  updateCameraShake,
} from './gameState';
import { useGameStore } from './useGameStore';
import {
  CAMERA_OFFSET_Y,
  CAMERA_OFFSET_Z,
  CAMERA_LOOK_AHEAD,
  CAMERA_SMOOTH,
} from './constants';

export default function FollowCamera() {
  const initialized = useRef(false);
  const { camera } = useThree();

  useFrame((_state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing' && store.phase !== 'gameover') return;

    const dt = Math.min(delta, 0.05);

    const targetX = playerState.visualX * 0.3;
    const targetY = playerState.y + CAMERA_OFFSET_Y;
    const targetZ = CAMERA_OFFSET_Z;

    if (!initialized.current) {
      camera.position.set(targetX, targetY, targetZ);
      initialized.current = true;
    }

    const smoothFactor = CAMERA_SMOOTH * dt * 60;
    camera.position.x += (targetX - camera.position.x) * smoothFactor;
    camera.position.y += (targetY - camera.position.y) * smoothFactor;
    camera.position.z += (targetZ - camera.position.z) * 0.1;

    const lookY = playerState.y - CAMERA_LOOK_AHEAD;
    camera.lookAt(playerState.visualX * 0.15, lookY, 0);

    if (cameraShakeIntensity > 0) {
      camera.position.x +=
        (Math.random() - 0.5) * cameraShakeIntensity * 0.25;
      camera.position.y +=
        (Math.random() - 0.5) * cameraShakeIntensity * 0.25;
      updateCameraShake(dt);
    }
  });

  return null;
}
