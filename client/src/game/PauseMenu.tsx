import { useState, useEffect } from 'react';
import { useGameStore } from './useGameStore';
import { useAudio } from '../lib/stores/useAudio';
import { resetGameState } from './gameState';
import {
  useControlsStore,
  getKeyLabel,
} from './useControlsStore';

const FONT = "'Pirata One', 'Inter', sans-serif";

export default function PauseMenu() {
  const setPaused = useGameStore((s) => s.setPaused);
  const restart = useGameStore((s) => s.restart);
  const [view, setView] = useState<'main' | 'options'>('main');
  const isMuted = useAudio((s) => s.isMuted);
  const bindings = useControlsStore((s) => s.bindings);
  const rebindingAction = useControlsStore((s) => s.rebindingAction);
  const setRebinding = useControlsStore((s) => s.setRebinding);
  const updateBinding = useControlsStore((s) => s.updateBinding);
  const resetDefaults = useControlsStore((s) => s.resetDefaults);

  const handleResume = () => {
    setPaused(false);
  };

  const handleExit = () => {
    const audio = useAudio.getState();
    if (audio.backgroundMusic) {
      audio.backgroundMusic.pause();
    }
    resetGameState();
    restart();
  };

  const adjustVolume = (delta: number) => {
    const audio = useAudio.getState();
    if (audio.backgroundMusic) {
      const newVol = Math.max(0, Math.min(1, audio.backgroundMusic.volume + delta));
      audio.backgroundMusic.volume = newVol;
    }
  };

  useEffect(() => {
    if (!rebindingAction) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        setRebinding(null);
        return;
      }
      updateBinding(rebindingAction, e.code);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [rebindingAction]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && !rebindingAction) {
        e.preventDefault();
        handleResume();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rebindingAction]);

  const currentVol = useAudio.getState().backgroundMusic
    ? Math.round((useAudio.getState().backgroundMusic?.volume ?? 0.25) * 100)
    : 25;

  return (
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
        zIndex: 200,
      }}
    >
      <div style={{ textAlign: 'center', minWidth: 320 }}>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 400,
            color: '#fff',
            margin: '0 0 32px 0',
            letterSpacing: 4,
            textShadow: '0 0 30px rgba(100,180,255,0.3)',
          }}
        >
          {view === 'main' ? 'PAUSED' : 'OPTIONS'}
        </h2>

        {view === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <PauseButton label="Resume" onClick={handleResume} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                justifyContent: 'center',
              }}
            >
              <PauseButton
                label="-"
                onClick={() => adjustVolume(-0.1)}
                small
              />
              <span
                style={{
                  color: '#fff',
                  fontSize: 16,
                  minWidth: 120,
                  textAlign: 'center',
                }}
              >
                Music {isMuted ? 'OFF' : `${currentVol}%`}
              </span>
              <PauseButton
                label="+"
                onClick={() => adjustVolume(0.1)}
                small
              />
            </div>

            <PauseButton label="Options" onClick={() => setView('options')} />
            <PauseButton label="Exit to Menu" onClick={handleExit} danger />
          </div>
        )}

        {view === 'options' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 8,
                letterSpacing: 2,
              }}
            >
              Click a key to rebind, then press the new key
            </div>

            {bindings.map((b) => (
              <div
                key={b.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: 280,
                  padding: '8px 0',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
                  {b.label}
                </span>
                <button
                  onClick={() => setRebinding(b.action)}
                  style={{
                    background:
                      rebindingAction === b.action
                        ? 'rgba(100,180,255,0.3)'
                        : 'rgba(255,255,255,0.1)',
                    border:
                      rebindingAction === b.action
                        ? '1px solid rgba(100,180,255,0.6)'
                        : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    padding: '8px 20px',
                    color: '#fff',
                    fontSize: 16,
                    fontFamily: FONT,
                    cursor: 'pointer',
                    minWidth: 80,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    animation:
                      rebindingAction === b.action
                        ? 'pulse 1s infinite'
                        : 'none',
                  }}
                >
                  {rebindingAction === b.action
                    ? '...'
                    : b.keys.map(getKeyLabel).join(' / ')}
                </button>
              </div>
            ))}

            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              <PauseButton label="Reset Defaults" onClick={resetDefaults} small />
              <PauseButton label="Back" onClick={() => { setRebinding(null); setView('main'); }} small />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function PauseButton({
  label,
  onClick,
  danger,
  small,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  small?: boolean;
}) {
  const bgBase = danger
    ? 'rgba(255,80,80,0.15)'
    : 'rgba(100,180,255,0.12)';
  const bgHover = danger
    ? 'rgba(255,80,80,0.3)'
    : 'rgba(100,180,255,0.25)';
  const borderColor = danger
    ? 'rgba(255,80,80,0.35)'
    : 'rgba(100,180,255,0.3)';

  return (
    <button
      onClick={onClick}
      style={{
        background: bgBase,
        border: `1px solid ${borderColor}`,
        borderRadius: small ? 8 : 12,
        padding: small ? '8px 20px' : '12px 48px',
        color: '#fff',
        fontSize: small ? 14 : 18,
        fontWeight: 400,
        cursor: 'pointer',
        letterSpacing: 2,
        textTransform: 'uppercase',
        transition: 'all 0.2s',
        fontFamily: "'Pirata One', 'Inter', sans-serif",
        pointerEvents: 'auto',
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.background = bgHover;
        (e.target as HTMLElement).style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.background = bgBase;
        (e.target as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      {label}
    </button>
  );
}
