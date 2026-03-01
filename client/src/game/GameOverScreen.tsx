import { useState, useEffect, useRef } from 'react';
import { useGameStore } from './useGameStore';
import { resetGameState } from './gameState';
import { useAudio } from '../lib/stores/useAudio';

const FONT = "'Pirata One', 'Inter', sans-serif";

export default function GameOverScreen() {
  const [phase, setPhase] = useState<'flash' | 'fadeIn' | 'ready'>('flash');
  const depth = useGameStore((s) => s.depth);
  const gems = useGameStore((s) => s.gems);
  const highScore = useGameStore((s) => s.highScore);
  const restart = useGameStore((s) => s.restart);
  const restartedRef = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fadeIn'), 100);
    const t2 = setTimeout(() => setPhase('ready'), 700);

    const audio = useAudio.getState();
    if (audio.backgroundMusic) {
      let vol = audio.backgroundMusic.volume;
      const fadeInterval = setInterval(() => {
        vol = Math.max(0, vol - 0.02);
        if (audio.backgroundMusic) audio.backgroundMusic.volume = vol;
        if (vol <= 0) {
          audio.backgroundMusic?.pause();
          clearInterval(fadeInterval);
        }
      }, 50);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearInterval(fadeInterval);
      };
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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
    <>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(180,30,10,0.3)',
        opacity: phase === 'flash' ? 1 : 0,
        transition: 'opacity 0.4s ease-out',
        pointerEvents: 'none',
        zIndex: 99,
      }} />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          opacity: phase !== 'flash' ? 1 : 0,
          transition: 'opacity 0.8s ease',
          zIndex: 100,
        }}
      >
        <div style={{
          textAlign: 'center',
          transform: phase === 'ready' ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          opacity: phase === 'ready' ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
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
              fontSize: 72,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
              textShadow: '0 0 40px rgba(255,50,50,0.3), 0 0 80px rgba(255,50,50,0.1)',
            }}
          >
            {Math.floor(depth)}m
          </div>

          {isNewBest && (
            <div
              style={{
                fontSize: 16,
                color: '#ffd700',
                fontWeight: 700,
                marginTop: 10,
                letterSpacing: 3,
                textShadow: '0 0 20px rgba(255,200,0,0.3)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              NEW BEST!
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 36,
              justifyContent: 'center',
              marginTop: 28,
              marginBottom: 36,
            }}
          >
            <StatBox label="DEPTH" value={`${Math.floor(depth)}m`} />
            <StatBox label="GEMS" value={`${gems}`} color="#ffd700" />
            <StatBox label="BEST" value={`${highScore}m`} />
          </div>

          <button
            onClick={handleRestart}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 14,
              padding: '16px 56px',
              color: '#fff',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: 4,
              textTransform: 'uppercase',
              transition: 'all 0.25s',
              fontFamily: FONT,
              pointerEvents: 'auto',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.18)';
              (e.target as HTMLElement).style.transform = 'scale(1.06)';
              (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.4)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
              (e.target as HTMLElement).style.transform = 'scale(1)';
              (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            Dig Again
          </button>

          <div
            style={{
              marginTop: 14,
              fontSize: 12,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: 1,
            }}
          >
            SPACE to restart
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: 2,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: color || '#fff',
          textShadow: color ? `0 0 15px ${color}44` : 'none',
        }}
      >
        {value}
      </div>
    </div>
  );
}
