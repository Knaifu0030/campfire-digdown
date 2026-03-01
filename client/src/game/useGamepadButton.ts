import { useEffect, useRef } from 'react';

export function useGamepadButton(buttonIndex: number, onPress: () => void, enabled = true) {
  const prevRef = useRef(false);
  const callbackRef = useRef(onPress);
  callbackRef.current = onPress;

  useEffect(() => {
    if (!enabled) {
      prevRef.current = false;
      return;
    }

    let raf: number;
    const poll = () => {
      const gamepads = navigator.getGamepads?.();
      if (gamepads) {
        for (let i = 0; i < gamepads.length; i++) {
          const gp = gamepads[i];
          if (!gp) continue;
          const pressed = gp.buttons[buttonIndex]?.pressed ?? false;
          if (pressed && !prevRef.current) {
            callbackRef.current();
          }
          prevRef.current = pressed;
          break;
        }
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [buttonIndex, enabled]);
}
