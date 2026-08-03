"use client";

import { useEffect, useState } from "react";

/**
 * useAdaptivePerformance
 *
 * Measures frame render times via requestAnimationFrame.
 * If FPS drops below 50 for a sustained window, returns true so
 * rendering can be downgraded.
 */
export function useAdaptivePerformance(): boolean {
  const [lowPerf, setLowPerf] = useState(false);

  useEffect(() => {
    let frameTimes: number[] = [];
    let animationFrameId: number;
    let firstFrameTime: number | null = null;
    let startTime: number | null = null;
    let isDegraded = false;

    const checkFrame = (timestamp: number) => {
      if (firstFrameTime === null) {
        firstFrameTime = timestamp;
      }

      if (timestamp - firstFrameTime < 2500) {
        animationFrameId = requestAnimationFrame(checkFrame);
        return;
      }

      if (startTime === null) {
        startTime = timestamp;
      }
      const cutoff = timestamp - 1500;
      frameTimes = frameTimes.filter((t) => t > cutoff);

      const lastFrameTime = frameTimes[frameTimes.length - 1];
      const delta = lastFrameTime ? timestamp - lastFrameTime : 0;

      if (delta < 200) {
        frameTimes.push(timestamp);
      }

      if (timestamp - startTime > 1500 && !isDegraded) {
        const fps = frameTimes.length / 1.5;

        if (fps < 50) {
          isDegraded = true;
          setLowPerf(true);
          return;
        }
      }

      animationFrameId = requestAnimationFrame(checkFrame);
    };

    animationFrameId = requestAnimationFrame(checkFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return lowPerf;
}
