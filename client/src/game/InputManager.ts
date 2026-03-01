import { useControlsStore } from './useControlsStore';

const GAMEPAD_DEADZONE = 0.15;
const ANALOG_LANE_THRESHOLD = 0.5;

export interface InputState {
  moveLeft: boolean;
  moveRight: boolean;
  moveStrength: number;
  dash: boolean;
  pause: boolean;
}

type InputSource = 'keyboard' | 'gamepad' | 'touch';

const keyboardState: Record<string, boolean> = {};
const prevKeyboardState: Record<string, boolean> = {};

const joystickState = {
  moveX: 0,
  active: false,
};

const touchButtons = {
  dashPressed: false,
  pausePressed: false,
};

const gamepadPrev = {
  dash: false,
  pause: false,
  left: false,
  right: false,
};

let activeSource: InputSource = 'keyboard';
let isMobileDevice = false;
let initialized = false;
let gamepadConnected = false;

function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.innerWidth <= 900
  );
}

function onKeyDown(e: KeyboardEvent) {
  keyboardState[e.code] = true;
  activeSource = 'keyboard';
}

function onKeyUp(e: KeyboardEvent) {
  keyboardState[e.code] = false;
}

function preventTouchScroll(e: TouchEvent) {
  if ((e.target as HTMLElement)?.closest?.('[data-touch-control]')) {
    e.preventDefault();
  }
}

export function initInputManager() {
  if (initialized) return;
  initialized = true;
  isMobileDevice = detectMobile();
  if (isMobileDevice) activeSource = 'touch';

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  document.addEventListener('touchmove', preventTouchScroll, { passive: false });

  window.addEventListener('gamepadconnected', () => {
    gamepadConnected = true;
  });
  window.addEventListener('gamepaddisconnected', () => {
    gamepadConnected = false;
    if (activeSource === 'gamepad') {
      activeSource = isMobileDevice ? 'touch' : 'keyboard';
    }
  });
}

export function cleanupInputManager() {
  if (!initialized) return;
  initialized = false;
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  document.removeEventListener('touchmove', preventTouchScroll);
}

export function setJoystickInput(moveX: number, active: boolean) {
  joystickState.moveX = moveX;
  joystickState.active = active;
  if (active) activeSource = 'touch';
}

export function triggerTouchDash() {
  touchButtons.dashPressed = true;
  activeSource = 'touch';
}

export function triggerTouchPause() {
  touchButtons.pausePressed = true;
  activeSource = 'touch';
}

export function getActiveSource(): InputSource {
  return activeSource;
}

export function isMobile(): boolean {
  return isMobileDevice;
}

function isKeyEdge(code: string): boolean {
  return !!keyboardState[code] && !prevKeyboardState[code];
}

function getKeyboardInput(): InputState {
  const bindings = useControlsStore.getState().bindings;
  const leftBinding = bindings.find(b => b.action === 'left');
  const rightBinding = bindings.find(b => b.action === 'right');
  const dashBinding = bindings.find(b => b.action === 'dash');

  const leftPressed = leftBinding
    ? leftBinding.keys.some(k => isKeyEdge(k))
    : false;
  const rightPressed = rightBinding
    ? rightBinding.keys.some(k => isKeyEdge(k))
    : false;
  const dashPressed = dashBinding
    ? dashBinding.keys.some(k => isKeyEdge(k))
    : false;
  const pausePressed = isKeyEdge('Escape');

  return {
    moveLeft: leftPressed,
    moveRight: rightPressed,
    moveStrength: leftPressed || rightPressed ? 1 : 0,
    dash: dashPressed,
    pause: pausePressed,
  };
}

function getGamepadInput(): InputState | null {
  if (!gamepadConnected) return null;

  const gamepads = navigator.getGamepads?.();
  if (!gamepads) return null;

  let gp: Gamepad | null = null;
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      gp = gamepads[i];
      break;
    }
  }
  if (!gp) return null;

  const axisX = Math.abs(gp.axes[0]) > GAMEPAD_DEADZONE ? gp.axes[0] : 0;
  const leftAnalog = axisX < -ANALOG_LANE_THRESHOLD;
  const rightAnalog = axisX > ANALOG_LANE_THRESHOLD;
  const dpadLeft = gp.buttons[14]?.pressed ?? false;
  const dpadRight = gp.buttons[15]?.pressed ?? false;
  const dashButton = gp.buttons[0]?.pressed ?? false;
  const pauseButton = gp.buttons[9]?.pressed ?? false;

  const anyInput = leftAnalog || rightAnalog || dpadLeft || dpadRight || dashButton || pauseButton || Math.abs(axisX) > GAMEPAD_DEADZONE;
  if (anyInput) activeSource = 'gamepad';
  if (activeSource !== 'gamepad') return null;

  const moveLeftEdge = (leftAnalog || dpadLeft) && !gamepadPrev.left;
  const moveRightEdge = (rightAnalog || dpadRight) && !gamepadPrev.right;
  const dashEdge = dashButton && !gamepadPrev.dash;
  const pauseEdge = pauseButton && !gamepadPrev.pause;

  gamepadPrev.left = leftAnalog || dpadLeft;
  gamepadPrev.right = rightAnalog || dpadRight;
  gamepadPrev.dash = dashButton;
  gamepadPrev.pause = pauseButton;

  return {
    moveLeft: moveLeftEdge,
    moveRight: moveRightEdge,
    moveStrength: Math.abs(axisX),
    dash: dashEdge,
    pause: pauseEdge,
  };
}

let touchRepeatTimer = 0;
let touchRepeatDir = 0;
const TOUCH_REPEAT_INITIAL = 0.22;
const TOUCH_REPEAT_FAST = 0.1;
let touchFirstRepeatDone = false;
let lastPollTime = 0;

function getTouchInput(): InputState {
  let moveLeft = false;
  let moveRight = false;
  const strength = Math.abs(joystickState.moveX);

  const dir = joystickState.active
    ? (joystickState.moveX < -0.3 ? -1 : joystickState.moveX > 0.3 ? 1 : 0)
    : 0;

  const now = performance.now();
  const dt = lastPollTime ? (now - lastPollTime) / 1000 : 0.016;

  if (dir !== 0 && dir !== touchRepeatDir) {
    if (dir === -1) moveLeft = true;
    else moveRight = true;
    touchRepeatDir = dir;
    touchRepeatTimer = TOUCH_REPEAT_INITIAL;
    touchFirstRepeatDone = false;
  } else if (dir !== 0 && dir === touchRepeatDir) {
    touchRepeatTimer -= dt;
    if (touchRepeatTimer <= 0) {
      if (dir === -1) moveLeft = true;
      else moveRight = true;
      touchRepeatTimer = touchFirstRepeatDone ? TOUCH_REPEAT_FAST : TOUCH_REPEAT_INITIAL;
      touchFirstRepeatDone = true;
    }
  } else {
    touchRepeatDir = 0;
    touchRepeatTimer = 0;
    touchFirstRepeatDone = false;
  }

  const dash = touchButtons.dashPressed;
  const pause = touchButtons.pausePressed;
  touchButtons.dashPressed = false;
  touchButtons.pausePressed = false;

  return {
    moveLeft,
    moveRight,
    moveStrength: strength,
    dash,
    pause,
  };
}

export function pollInput(): InputState {
  const now = performance.now();

  const gpInput = getGamepadInput();
  const kbInput = getKeyboardInput();

  Object.assign(prevKeyboardState, keyboardState);

  let result: InputState;

  if (activeSource === 'gamepad' && gpInput) {
    result = gpInput;
  } else if (activeSource === 'touch' && isMobileDevice) {
    result = getTouchInput();
  } else {
    result = kbInput;
  }

  lastPollTime = now;
  return result;
}

export function vibrateGamepad(duration = 100, intensity = 0.3) {
  try {
    const gamepads = navigator.getGamepads?.();
    if (!gamepads) return;
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp) continue;
      const actuator = (gp as any).vibrationActuator;
      if (actuator?.playEffect) {
        actuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration,
          weakMagnitude: intensity,
          strongMagnitude: intensity * 0.5,
        });
      }
    }
  } catch (_) {}
}
