import { useState, useEffect, useRef } from 'react';
import { useGameStore } from './useGameStore';
import { resetGameState } from './gameState';
import { useAudio } from '../lib/stores/useAudio';

export default function MenuScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const highScore = useGameStore((s) => s.highScore);
  const startGame = useGameStore((s) => s.startGame);
  const startedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleStart = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setFadeOut(true);
    resetGameState();

    const audio = useAudio.getState();
    if (audio.isMuted) audio.toggleMute();
    if (audio.backgroundMusic) {
      audio.backgroundMusic.currentTime = 0;
      audio.backgroundMusic.volume = 0.25;
      audio.backgroundMusic.play().catch(() => {});
    }

    setTimeout(() => {
      startGame();
    }, 400);
  };

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
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, #0a0806 0%, #1a1008 40%, #0d0a06 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        opacity: fadeOut ? 0 : visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        zIndex: 100,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: 8,
            color: 'rgba(255,180,80,0.5)',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}
        >
          Beneath the Surface
        </div>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: '#fff',
            margin: 0,
            letterSpacing: -2,
            textShadow:
              '0 0 40px rgba(100,180,255,0.3), 0 4px 20px rgba(0,0,0,0.5)',
            lineHeight: 1,
          }}
        >
          DIG DOWN
        </h1>

        <div
          style={{
            width: 60,
            height: 3,
            background:
              'linear-gradient(90deg, transparent, rgba(100,180,255,0.6), transparent)',
            margin: '24px auto',
            borderRadius: 2,
          }}
        />

        <button
          onClick={handleStart}
          style={{
            background: 'rgba(100,180,255,0.12)',
            border: '1px solid rgba(100,180,255,0.3)',
            borderRadius: 12,
            padding: '14px 48px',
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: 3,
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            fontFamily: "'Inter', sans-serif",
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background =
              'rgba(100,180,255,0.25)';
            (e.target as HTMLElement).style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background =
              'rgba(100,180,255,0.12)';
            (e.target as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          Start Digging
        </button>

        {highScore > 0 && (
          <div
            style={{
              marginTop: 20,
              fontSize: 14,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Best: {highScore}m
          </div>
        )}

        <div
          style={{
            marginTop: 40,
            fontSize: 13,
            color: 'rgba(255,255,255,0.25)',
            lineHeight: 2,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            A/D
          </span>{' '}
          Move &nbsp;&nbsp;
          <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            SPACE
          </span>{' '}
          Dash
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 20,
          fontSize: 11,
          color: 'rgba(255,255,255,0.15)',
          letterSpacing: 1,
        }}
      >
        A Game Jam Entry
      </div>
    </div>
  );
}
