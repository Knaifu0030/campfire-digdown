import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { KeyboardControls } from "@react-three/drei";
import "@fontsource/pirata-one";
import { useAudio } from "./lib/stores/useAudio";
import { useGameStore } from "./game/useGameStore";
import { useControlsStore } from "./game/useControlsStore";
import { Controls } from "./game/Player";
import GameScene from "./game/GameScene";
import GameHUD from "./game/GameHUD";
import MenuScreen from "./game/MenuScreen";
import GameOverScreen from "./game/GameOverScreen";
import PauseMenu from "./game/PauseMenu";

function App() {
  const phase = useGameStore((s) => s.phase);
  const paused = useGameStore((s) => s.paused);
  const togglePause = useGameStore((s) => s.togglePause);
  const bindings = useControlsStore((s) => s.bindings);

  const keyMap = useMemo(() => {
    return bindings.map((b) => ({
      name: b.action as Controls,
      keys: b.keys,
    }));
  }, [bindings]);

  useEffect(() => {
    const bg = new Audio("/sounds/background.mp3");
    bg.loop = true;
    bg.volume = 0.25;
    const hit = new Audio("/sounds/hit.mp3");
    const success = new Audio("/sounds/success.mp3");

    useAudio.getState().setBackgroundMusic(bg);
    useAudio.getState().setHitSound(hit);
    useAudio.getState().setSuccessSound(success);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" && phase === "playing" && !paused) {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, paused, togglePause]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#0a0806",
      }}
    >
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows
          camera={{
            position: [0, 0, 14],
            fov: 50,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: true,
            powerPreference: "default",
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <color attach="background" args={["#0a0806"]} />
          <GameScene />
        </Canvas>

        {phase === "menu" && <MenuScreen />}
        {phase === "playing" && !paused && <GameHUD />}
        {phase === "playing" && paused && <PauseMenu />}
        {phase === "gameover" && <GameOverScreen />}
      </KeyboardControls>
    </div>
  );
}

export default App;
