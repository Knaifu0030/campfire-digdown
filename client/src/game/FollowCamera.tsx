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
  MAX_SPEED,
} from './constants';

export default function FollowCamera() {
  const initialized = useRef(false);
  const { camera } = useThree();
  const smoothX = useRef(0);
  const smoothY = useRef(0);
  const smoothLookY = useRef(0);

  useFrame((_state, delta) => {
    const store = useGameStore.getState();
    if (store.phase !== 'playing' && store.phase !== 'gameover') return;

    const dt = Math.min(delta, 0.05);

    const speedRatio = Math.min(playerState.speed / MAX_SPEED, 1);
    const dynamicLookAhead = CAMERA_LOOK_AHEAD + speedRatio * 2.5;
    const dynamicOffsetY = CAMERA_OFFSET_Y + speedRatio * 0.5;

    const targetX = playerState.visualX * 0.25;
    const targetY = playerState.y + dynamicOffsetY;
    const targetZ = CAMERA_OFFSET_Z;

    if (!initialized.current) {
      smoothX.current = targetX;
      smoothY.current = targetY;
      smoothLookY.current = playerState.y - dynamicLookAhead;
      camera.position.set(targetX, targetY, targetZ);
      initialized.current = true;
    }

    const smoothFactor = CAMERA_SMOOTH * dt * 60;
    const ySmoothFactor = smoothFactor * (1 + speedRatio * 0.5);

    smoothX.current += (targetX - smoothX.current) * smoothFactor;
    smoothY.current += (targetY - smoothY.current) * ySmoothFactor;

    camera.position.x = smoothX.current;
    camera.position.y = smoothY.current;
    camera.position.z += (targetZ - camera.position.z) * 0.1;

    const lookTargetY = playerState.y - dynamicLookAhead;
    smoothLookY.current += (lookTargetY - smoothLookY.current) * (smoothFactor * 1.2);
    camera.lookAt(smoothX.current * 0.5, smoothLookY.current, 0);

    if (cameraShakeIntensity > 0) {
      const shakeDecay = cameraShakeIntensity * cameraShakeIntensity;
      camera.position.x += (Math.random() - 0.5) * shakeDecay * 0.3;
      camera.position.y += (Math.random() - 0.5) * shakeDecay * 0.2;
      updateCameraShake(dt);
    }
  });

  return null;
}
