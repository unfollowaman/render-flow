import { useState, useRef, useCallback, useEffect } from "react";

const MARIO_SPRITE_FRAMES = ["🏃", "🏃‍♂️", "🚶", "🚶‍♂️"];

const LOADING_STEPS = [
  "Preparing your HTML...",
  "Rendering in iframe sandbox...",
  "Capturing DOM snapshot...",
  "Converting to PNG...",
  "Finalising image...",
  "Almost done...",
];

export function useMarioAnimation() {
  const [marioFrame, setMarioFrame] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const marioIntervalRef = useRef(null);
  const stepIntervalRef = useRef(null);

  const startMarioAnimation = useCallback(() => {
    let frame = 0;
    marioIntervalRef.current = setInterval(() => {
      frame = (frame + 1) % MARIO_SPRITE_FRAMES.length;
      setMarioFrame(frame);
    }, 150);

    let stepIdx = 0;
    setLoadingStep(LOADING_STEPS[0]);
    stepIntervalRef.current = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, LOADING_STEPS.length - 1);
      setLoadingStep(LOADING_STEPS[stepIdx]);
    }, 1800);
  }, []);

  const stopMarioAnimation = useCallback(() => {
    clearInterval(marioIntervalRef.current);
    clearInterval(stepIntervalRef.current);
  }, []);

  useEffect(() => {
    return stopMarioAnimation;
  }, [stopMarioAnimation]);

  const marioSprite = MARIO_SPRITE_FRAMES[marioFrame];

  return { startMarioAnimation, stopMarioAnimation, marioSprite, loadingStep };
}
