import { ease } from "./ease";

interface AnimationParams {
  duration: number;
  ease: [number, number, number, number] | string;
  update: (t: { time: number; progress: number; ease: number }) => void;
}

export const animate = {
  to: (params: AnimationParams) => {
    let duration = params.duration;
    let easeFn: (t: number) => number;
    let updateCallback: (t: {
      time: number;
      progress: number;
      ease: number;
    }) => void;
    let startTime: number | null = null;
    let animationFrame: number | null = null;

    easeFn = (t: number) =>
      Array.isArray(params.ease) && typeof params.ease !== "string"
        ? ease.bezier(
            t,
            params.ease[0],
            params.ease[1],
            params.ease[2],
            params.ease[3]
          )
        : ease[params.ease](t);
    updateCallback = params.update;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      let progress = Math.min(timeElapsed / duration, 1); // Clamp progress between 0 and 1
      const easedProgress = easeFn(progress);

      updateCallback({
        time: timeElapsed,
        progress: progress,
        ease: easedProgress,
      });

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        stop(); // Optionally stop the animation when finished
      }
    };

    animationFrame = requestAnimationFrame(animate);

    const stop = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    return { stop };
  },
};
