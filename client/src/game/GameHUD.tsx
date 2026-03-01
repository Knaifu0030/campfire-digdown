import { useGameStore } from './useGameStore';
import { useAudio } from '../lib/stores/useAudio';
import { GameEvent } from './constants';
import { useControlsStore, getKeyLabel } from './useControlsStore';

const FONT = "'Pirata One', 'Inter', sans-serif";

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
      case GameEvent.GEM_RUSH: return 'GEM RUSH';
      case GameEvent.SPEED_TUNNEL: return 'SPEED TUNNEL';
      case GameEvent.LOW_GRAVITY: return 'LOW GRAVITY';
      case GameEvent.TREASURE_POCKET: return 'TREASURE POCKET';
      case GameEvent.ROCK_RAIN: return 'ROCK RAIN';
      default: return '';
    }
  };

  const getEventColor = (e: GameEvent): string => {
    switch (e) {
      case GameEvent.GEM_RUSH: return '#ffd700';
      case GameEvent.SPEED_TUNNEL: return '#33ff66';
      case GameEvent.LOW_GRAVITY: return '#88bbff';
      case GameEvent.TREASURE_POCKET: return '#ffaa33';
      case GameEvent.ROCK_RAIN: return '#ff5544';
      default: return '#fff';
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
      fontFamily: FONT,
    }}>
      <div style={{
        position: 'absolute',
        top: 20,
        right: 24,
        textAlign: 'right',
      }}>
        <div style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 4,
          transition: 'color 0.5s ease',
        }}>
          {getLayerName(depth)}
        </div>
        <div style={{
          fontSize: 52,
          fontWeight: 800,
          color: '#fff',
          textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3)',
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
        gap: 10,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0,0,0,0.45)',
          borderRadius: 12,
          padding: '8px 16px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,215,0,0.1)',
        }}>
          <span style={{ fontSize: 18 }}>💎</span>
          <span style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#ffd700',
            textShadow: '0 0 10px rgba(255,200,0,0.2)',
            minWidth: 28,
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
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            pointerEvents: 'auto',
            backdropFilter: 'blur(8px)',
            transition: 'background 0.2s',
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
        gap: 10,
        alignItems: 'center',
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 14,
        padding: '8px 18px',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.06)',
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
          width: 1,
          height: 28,
          background: 'rgba(255,255,255,0.08)',
          margin: '0 8px',
        }} />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}>
          <div style={{
            width: 56,
            height: 5,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(1 - dashCooldownPct) * 100}%`,
              height: '100%',
              background: dashCooldownPct > 0
                ? 'linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.25))'
                : 'linear-gradient(90deg, #33ccff, #66ddff)',
              borderRadius: 3,
              transition: dashCooldownPct === 0 ? 'background 0.3s' : 'none',
              boxShadow: dashCooldownPct === 0 ? '0 0 8px rgba(51,204,255,0.4)' : 'none',
            }} />
          </div>
          <span style={{
            fontSize: 9,
            color: dashCooldownPct > 0 ? 'rgba(255,255,255,0.25)' : 'rgba(100,200,255,0.7)',
            letterSpacing: 2,
            transition: 'color 0.3s',
          }}>
            DASH
          </span>
        </div>
      </div>

      {activeEvent !== GameEvent.NONE && (
        <div style={{
          position: 'absolute',
          top: 90,
          left: '50%',
          transform: 'translateX(-50%)',
          background: `linear-gradient(135deg, ${getEventColor(activeEvent)}15, ${getEventColor(activeEvent)}08)`,
          border: `1px solid ${getEventColor(activeEvent)}40`,
          borderRadius: 10,
          padding: '8px 24px',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'eventSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: getEventColor(activeEvent),
            letterSpacing: 2,
            textShadow: `0 0 15px ${getEventColor(activeEvent)}44`,
          }}>
            {getEventLabel(activeEvent)}
          </span>
          <span style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {Math.ceil(eventTimeLeft)}s
          </span>
        </div>
      )}

      <style>{`
        @keyframes eventSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
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
      opacity: active ? 1 : 0.25,
      transition: 'opacity 0.3s, transform 0.3s',
      transform: active ? 'scale(1.1)' : 'scale(1)',
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${active ? `${color}80` : 'rgba(255,255,255,0.08)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 17,
        boxShadow: active ? `0 0 16px ${color}33, inset 0 0 8px ${color}11` : 'none',
        transition: 'all 0.3s',
      }}>
        {icon}
      </div>
      {active && timer > 0 && (
        <span style={{
          fontSize: 9,
          color,
          fontWeight: 600,
          marginTop: 3,
          textShadow: `0 0 6px ${color}44`,
        }}>
          {Math.ceil(timer)}s
        </span>
      )}
    </div>
  );
}
