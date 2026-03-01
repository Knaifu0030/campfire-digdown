import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from './useGameStore';
import { resetGameState } from './gameState';
import { useAudio } from '../lib/stores/useAudio';
import { useControlsStore, getKeyLabel } from './useControlsStore';
import { useGamepadButton } from './useGamepadButton';

const FONT = "'Pirata One', 'Inter', sans-serif";

export default function MenuScreen() {
  const [visible, setVisible] = useState(false);
  const highScore = useGameStore((s) => s.highScore);
  const menuTransition = useGameStore((s) => s.menuTransition);
  const setMenuTransition = useGameStore((s) => s.setMenuTransition);
  const startedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    resetGameState();

    const audio = useAudio.getState();
    if (audio.isMuted) audio.toggleMute();
    if (audio.backgroundMusic) {
      audio.backgroundMusic.currentTime = 0;
      audio.backgroundMusic.volume = 0.25;
      audio.backgroundMusic.play().catch(() => {});
    }

    setMenuTransition(1);
  }, [setMenuTransition]);

  useGamepadButton(0, handleStart, visible);

  useEffect(() => {
    let ready = false;
    const readyTimer = setTimeout(() => {
      ready = true;
    }, 500);

    const onKey = (e: KeyboardEvent) => {
      if (!ready || e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(readyTimer);
      window.removeEventListener('keydown', onKey);
    };
  }, [handleStart]);

  const logoOffset = menuTransition > 0 ? -120 : 0;
  const bottomOffset = menuTransition > 0 ? 100 : 0;
  const fadeOpacity = menuTransition > 0 ? 0 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        fontFamily: FONT,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(10,8,6,0.7) 0%, rgba(10,8,6,0.1) 40%, rgba(10,8,6,0.3) 70%, rgba(10,8,6,0.8) 100%)',
          pointerEvents: 'none',
          opacity: fadeOpacity,
          transition: 'opacity 1.2s ease',
        }}
      />

      <div style={{
        position: 'relative',
        textAlign: 'center',
        marginTop: '8vh',
        transform: `translateY(${logoOffset}vh)`,
        opacity: fadeOpacity,
        transition: 'transform 1.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.2s ease',
      }}>
        <div
          style={{
            fontSize: 13,
            letterSpacing: 8,
            color: 'rgba(255,180,80,0.6)',
            marginBottom: 10,
            textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(255,150,50,0.3)',
          }}
        >
          Beneath the Surface
        </div>
        <h1
          style={{
            fontSize: 80,
            fontWeight: 400,
            color: '#fff',
            margin: 0,
            letterSpacing: 6,
            textShadow:
              '0 0 60px rgba(100,180,255,0.4), 0 0 120px rgba(100,180,255,0.15), 0 4px 20px rgba(0,0,0,0.8)',
            lineHeight: 1,
          }}
        >
          DIG DOWN
        </h1>

        <div
          style={{
            width: 80,
            height: 2,
            background:
              'linear-gradient(90deg, transparent, rgba(100,180,255,0.5), transparent)',
            margin: '20px auto',
            borderRadius: 2,
          }}
        />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '18vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        transform: `translateY(${bottomOffset}vh)`,
        opacity: fadeOpacity,
        transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease',
      }}>
        <button
          onClick={handleStart}
          style={{
            background: 'rgba(100,180,255,0.15)',
            border: '1px solid rgba(100,180,255,0.35)',
            borderRadius: 14,
            padding: '16px 56px',
            color: '#fff',
            fontSize: 22,
            fontWeight: 400,
            cursor: 'pointer',
            letterSpacing: 4,
            textTransform: 'uppercase',
            transition: 'all 0.25s',
            fontFamily: FONT,
            pointerEvents: 'auto',
            backdropFilter: 'blur(8px)',
            textShadow: '0 0 20px rgba(100,180,255,0.3)',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background =
              'rgba(100,180,255,0.3)';
            (e.target as HTMLElement).style.transform = 'scale(1.08)';
            (e.target as HTMLElement).style.boxShadow = '0 0 30px rgba(100,180,255,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background =
              'rgba(100,180,255,0.15)';
            (e.target as HTMLElement).style.transform = 'scale(1)';
            (e.target as HTMLElement).style.boxShadow = 'none';
          }}
        >
          Start Digging
        </button>

        {highScore > 0 && (
          <div
            style={{
              fontSize: 16,
              color: 'rgba(255,215,0,0.7)',
              textShadow: '0 0 10px rgba(255,200,0,0.2)',
            }}
          >
            Best: {highScore}m
          </div>
        )}

        <ControlHints />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          fontSize: 11,
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: 2,
          opacity: fadeOpacity,
          transition: 'opacity 0.6s ease',
        }}
      >
        A Game Jam Entry
      </div>
    </div>
  );
}

function ControlHints() {
  const bindings = useControlsStore((s) => s.bindings);
  const leftBinding = bindings.find((b) => b.action === 'left');
  const rightBinding = bindings.find((b) => b.action === 'right');
  const dashBinding = bindings.find((b) => b.action === 'dash');

  const leftLabel = leftBinding ? leftBinding.keys.map(getKeyLabel).join('/') : 'A';
  const rightLabel = rightBinding ? rightBinding.keys.map(getKeyLabel).join('/') : 'D';
  const dashLabel = dashBinding ? dashBinding.keys.map(getKeyLabel).join('/') : 'SPACE';

  return (
    <div
      style={{
        marginTop: 8,
        fontSize: 13,
        color: 'rgba(255,255,255,0.3)',
        lineHeight: 2,
        backdropFilter: 'blur(4px)',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
        padding: '4px 20px',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>
        {leftLabel}/{rightLabel}
      </span>{' '}
      Move &nbsp;&nbsp;
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>
        {dashLabel}
      </span>{' '}
      Dash &nbsp;&nbsp;
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>
        SPACE/ENTER
      </span>{' '}
      Start
    </div>
  );
}
