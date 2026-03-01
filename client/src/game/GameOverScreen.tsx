import { useState, useEffect, useRef } from 'react';
import { useGameStore } from './useGameStore';
import { resetGameState } from './gameState';
import { useAudio } from '../lib/stores/useAudio';

export default function GameOverScreen() {
  const [visible, setVisible] = useState(false);
  const depth = useGameStore((s) => s.depth);
  const gems = useGameStore((s) => s.gems);
  const highScore = useGameStore((s) => s.highScore);
  const restart = useGameStore((s) => s.restart);
  const restartedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);

    const audio = useAudio.getState();
    if (audio.backgroundMusic) {
      audio.backgroundMusic.pause();
    }

    return () => clearTimeout(t);
  }, []);

  const handleRestart = () => {
    if (restartedRef.current) return;
    restartedRef.current = true;
    resetGameState();
    restart();
  };

  useEffect(() => {
    let ready = false;
    const readyTimer = setTimeout(() => {
      ready = true;
    }, 800);

    const onKey = (e: KeyboardEvent) => {
      if (!ready || e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleRestart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(readyTimer);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const isNewBest = Math.floor(depth) >= highScore && highScore > 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        zIndex: 100,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,100,100,0.7)',
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          You dug too deep beneath the surface
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            textShadow: '0 0 30px rgba(255,50,50,0.2)',
          }}
        >
          {Math.floor(depth)}m
        </div>

        {isNewBest && (
          <div
            style={{
              fontSize: 14,
              color: '#ffd700',
              fontWeight: 700,
              marginTop: 8,
              letterSpacing: 2,
            }}
          >
            NEW BEST!
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 32,
            justifyContent: 'center',
            marginTop: 24,
            marginBottom: 32,
          }}
        >
          <StatBox label="DEPTH" value={`${Math.floor(depth)}m`} />
          <StatBox label="GEMS" value={`${gems}`} />
          <StatBox label="BEST" value={`${highScore}m`} />
        </div>

        <button
          onClick={handleRestart}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 12,
            padding: '14px 48px',
            color: '#fff',
            fontSize: 16,
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
              'rgba(255,255,255,0.2)';
            (e.target as HTMLElement).style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background =
              'rgba(255,255,255,0.1)';
            (e.target as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          Dig Again
        </button>

        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          Press SPACE to restart
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 2,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {value}
      </div>
    </div>
  );
}
