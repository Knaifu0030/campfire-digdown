import { useGameStore } from './useGameStore';
import { useAudio } from '../lib/stores/useAudio';
import { GameEvent } from './constants';
import { useControlsStore, getKeyLabel } from './useControlsStore';

export default function GameHUD() {
  const depth = useGameStore((s) => s.depth);
  const isMuted = useAudio((s) => s.isMuted);
  const toggleMute = useAudio((s) => s.toggleMute);
  const gems = useGameStore((s) => s.gems);
  const shieldActive = useGameStore((s) => s.shieldActive);
  const magnetActive = useGameStore((s) => s.magnetActive);
  const speedBurstActive = useGameStore((s) => s.speedBurstActive);
  const powerupTimer = useGameStore((s) => s.powerupTimer);
  const activeEvent = useGameStore((s) => s.activeEvent);
  const eventTimeLeft = useGameStore((s) => s.eventTimeLeft);
  const dashCooldownPct = useGameStore((s) => s.dashCooldownPct);

  const getLayerName = (d: number): string => {
    if (d < 100) return 'SURFACE SOIL';
    if (d < 300) return 'ROCK CAVERNS';
    if (d < 600) return 'MAGMA ZONE';
    return 'CRYSTAL ABYSS';
  };

  const getEventLabel = (e: GameEvent): string => {
    switch (e) {
      case GameEvent.GEM_RUSH: return 'GEM RUSH!';
      case GameEvent.SPEED_TUNNEL: return 'SPEED TUNNEL!';
      case GameEvent.LOW_GRAVITY: return 'LOW GRAVITY!';
      case GameEvent.TREASURE_POCKET: return 'TREASURE POCKET!';
      case GameEvent.ROCK_RAIN: return 'ROCK RAIN!';
      default: return '';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      fontFamily: "'Pirata One', 'Inter', sans-serif",
    }}>
      <div style={{
        position: 'absolute',
        top: 20,
        right: 24,
        textAlign: 'right',
      }}>
        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          {getLayerName(depth)}
        </div>
        <div style={{
          fontSize: 48,
          fontWeight: 800,
          color: '#fff',
          textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          lineHeight: 1,
        }}>
          {depth}m
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: 24,
        left: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 12,
          padding: '8px 16px',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 20 }}>💎</span>
          <span style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#ffd700',
          }}>
            {gems}
          </span>
        </div>
        <button
          onClick={() => {
            const wasMuted = useAudio.getState().isMuted;
            toggleMute();
            const audio = useAudio.getState();
            if (audio.backgroundMusic) {
              if (!wasMuted) {
                audio.backgroundMusic.pause();
              } else {
                audio.backgroundMusic.play().catch(() => {});
              }
            }
          }}
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: 'none',
            borderRadius: 10,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            pointerEvents: 'auto',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}>
        <PowerupIcon
          label="SHIELD"
          icon="🛡️"
          active={shieldActive}
          timer={shieldActive ? powerupTimer : 0}
          color="#3388ff"
        />
        <PowerupIcon
          label="MAGNET"
          icon="🧲"
          active={magnetActive}
          timer={magnetActive ? powerupTimer : 0}
          color="#cc44ff"
        />
        <PowerupIcon
          label="SPEED"
          icon="⚡"
          active={speedBurstActive}
          timer={speedBurstActive ? powerupTimer : 0}
          color="#33ff66"
        />

        <div style={{
          width: 60,
          height: 6,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 3,
          marginLeft: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(1 - dashCooldownPct) * 100}%`,
            height: '100%',
            background: dashCooldownPct > 0 ? 'rgba(255,255,255,0.3)' : '#44ccff',
            borderRadius: 3,
            transition: dashCooldownPct === 0 ? 'background 0.2s' : 'none',
          }} />
        </div>
        <span style={{
          fontSize: 11,
          color: dashCooldownPct > 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
          letterSpacing: 1,
        }}>
          DASH
        </span>
      </div>

      {activeEvent !== GameEvent.NONE && (
        <div style={{
          position: 'absolute',
          top: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,200,0,0.15)',
          border: '1px solid rgba(255,200,0,0.3)',
          borderRadius: 8,
          padding: '6px 20px',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#ffd700',
            letterSpacing: 2,
          }}>
            {getEventLabel(activeEvent)} {Math.ceil(eventTimeLeft)}s
          </span>
        </div>
      )}

      <HudControlHints />
    </div>
  );
}

function PowerupIcon({
  label,
  icon,
  active,
  timer,
  color,
}: {
  label: string;
  icon: string;
  active: boolean;
  timer: number;
  color: string;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      opacity: active ? 1 : 0.3,
      transition: 'opacity 0.3s',
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: active ? `${color}33` : 'rgba(255,255,255,0.08)',
        border: `2px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        boxShadow: active ? `0 0 12px ${color}55` : 'none',
      }}>
        {icon}
      </div>
      {active && timer > 0 && (
        <span style={{
          fontSize: 10,
          color,
          fontWeight: 600,
          marginTop: 2,
        }}>
          {Math.ceil(timer)}s
        </span>
      )}
    </div>
  );
}

function HudControlHints() {
  const bindings = useControlsStore((s) => s.bindings);
  const leftBinding = bindings.find((b) => b.action === 'left');
  const rightBinding = bindings.find((b) => b.action === 'right');
  const dashBinding = bindings.find((b) => b.action === 'dash');

  const moveLabel = `${leftBinding ? leftBinding.keys.map(getKeyLabel).join('/') : 'A'}/${rightBinding ? rightBinding.keys.map(getKeyLabel).join('/') : 'D'}`;
  const dashLabel = dashBinding ? dashBinding.keys.map(getKeyLabel).join('/') : 'SPACE';

  return (
    <div style={{
      position: 'absolute',
      bottom: 60,
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 11,
      color: 'rgba(255,255,255,0.25)',
      letterSpacing: 1,
    }}>
      {moveLabel} MOVE &nbsp; {dashLabel} DASH &nbsp; ESC PAUSE
    </div>
  );
}
