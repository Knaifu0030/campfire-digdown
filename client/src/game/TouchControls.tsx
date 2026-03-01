import { useRef, useCallback, useEffect, useState } from 'react';
import { setJoystickInput, triggerTouchDash, triggerTouchPause, isMobile } from './InputManager';
import { useGameStore } from './useGameStore';

const JOYSTICK_SIZE = 120;
const JOYSTICK_KNOB = 50;
const DASH_SIZE = 80;
const MARGIN = 20;

export default function TouchControls() {
  const phase = useGameStore((s) => s.phase);
  const paused = useGameStore((s) => s.paused);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    setShowControls(isMobile());
  }, []);

  if (!showControls || phase !== 'playing' || paused) return null;

  return (
    <div
      data-touch-control
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 50,
        touchAction: 'none',
      }}
    >
      <VirtualJoystick />
      <DashButton />
      <TouchPauseButton />
    </div>
  );
}

function VirtualJoystick() {
  const knobRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const originRef = useRef({ x: 0, y: 0 });

  const handleStart = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    touchIdRef.current = touch.identifier;
    originRef.current = { x: touch.clientX, y: touch.clientY };
    setJoystickInput(0, true);
  }, []);

  const handleMove = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier !== touchIdRef.current) continue;
      const dx = touch.clientX - originRef.current.x;
      const maxRange = JOYSTICK_SIZE / 2;
      const clamped = Math.max(-maxRange, Math.min(maxRange, dx));
      const normalized = clamped / maxRange;

      if (knobRef.current) {
        knobRef.current.style.transform = `translateX(${clamped}px)`;
      }

      setJoystickInput(normalized, true);
    }
  }, []);

  const handleEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        if (knobRef.current) {
          knobRef.current.style.transform = 'translateX(0px)';
        }
        setJoystickInput(0, false);
        break;
      }
    }
  }, []);

  return (
    <div
      data-touch-control
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      style={{
        position: 'absolute',
        bottom: MARGIN + 30,
        left: MARGIN + 10,
        width: JOYSTICK_SIZE,
        height: JOYSTICK_SIZE,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        border: '2px solid rgba(255,255,255,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 12,
          transform: 'translateY(-50%)',
          color: 'rgba(255,255,255,0.15)',
          fontSize: 18,
          userSelect: 'none',
        }}
      >
        ◀
      </div>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: 12,
          transform: 'translateY(-50%)',
          color: 'rgba(255,255,255,0.15)',
          fontSize: 18,
          userSelect: 'none',
        }}
      >
        ▶
      </div>
      <div
        ref={knobRef}
        style={{
          width: JOYSTICK_KNOB,
          height: JOYSTICK_KNOB,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,180,255,0.35), rgba(100,180,255,0.15))',
          border: '2px solid rgba(100,180,255,0.4)',
          boxShadow: '0 0 12px rgba(100,180,255,0.15)',
          transition: 'transform 0.05s ease-out',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function DashButton() {
  const btnRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    triggerTouchDash();
    if (btnRef.current) {
      btnRef.current.style.transform = 'scale(0.9)';
      btnRef.current.style.background = 'rgba(100,180,255,0.3)';
    }
  }, []);

  const handleEnd = useCallback(() => {
    if (btnRef.current) {
      btnRef.current.style.transform = 'scale(1)';
      btnRef.current.style.background = 'rgba(100,180,255,0.12)';
    }
  }, []);

  return (
    <div
      ref={btnRef}
      data-touch-control
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      style={{
        position: 'absolute',
        bottom: MARGIN + 50,
        right: MARGIN + 20,
        width: DASH_SIZE,
        height: DASH_SIZE,
        borderRadius: '50%',
        background: 'rgba(100,180,255,0.12)',
        border: '2px solid rgba(100,180,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        pointerEvents: 'auto',
        touchAction: 'none',
        transition: 'transform 0.1s, background 0.1s',
        boxShadow: '0 0 20px rgba(100,180,255,0.08)',
        userSelect: 'none',
      }}
    >
      <span style={{
        fontSize: 22,
        color: 'rgba(100,180,255,0.7)',
        lineHeight: 1,
        marginBottom: 2,
      }}>
        ⚡
      </span>
      <span style={{
        fontSize: 10,
        color: 'rgba(100,180,255,0.5)',
        letterSpacing: 1,
        fontFamily: "'Pirata One', sans-serif",
      }}>
        DASH
      </span>
    </div>
  );
}

function TouchPauseButton() {
  return (
    <div
      data-touch-control
      onTouchStart={(e) => {
        e.stopPropagation();
        triggerTouchPause();
      }}
      style={{
        position: 'absolute',
        top: 20,
        right: 80,
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        touchAction: 'none',
        backdropFilter: 'blur(4px)',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>⏸</span>
    </div>
  );
}
