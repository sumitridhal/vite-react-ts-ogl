import { bezier, ease } from "./trasitions";

interface AnimationParams {
  duration: number;
  ease: [number, number, number, number] | string;
  update: (t: { time: number; progress: number; ease: number }) => void;
}

export class to {
  private duration: number;
  private easeFn: (t: number) => number;
  private updateCallback: (t: {
    time: number;
    progress: number;
    ease: number;
  }) => void;
  private startTime: number | null = null;
  private animationFrame: number | null = null;

  constructor(params: AnimationParams) {
    this.duration = params.duration;
    this.easeFn = (t: number) =>
      Array.isArray(params.ease) && typeof params.ease !== "string"
        ? bezier(
            t,
            params.ease[0],
            params.ease[1],
            params.ease[2],
            params.ease[3]
          )
        : ease[params.ease](t);
    this.updateCallback = params.update;
  }

  start() {
    this.startTime = null; // Reset start time
    const animate = (currentTime: number) => {
      if (!this.startTime) this.startTime = currentTime;
      const timeElapsed = currentTime - this.startTime;
      let progress = Math.min(timeElapsed / this.duration, 1); // Clamp progress between 0 and 1
      const easedProgress = this.easeFn(progress);

      this.updateCallback({
        time: timeElapsed,
        progress: progress,
        ease: easedProgress,
      });

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.stop(); // Optionally stop the animation when finished
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  stop() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}
