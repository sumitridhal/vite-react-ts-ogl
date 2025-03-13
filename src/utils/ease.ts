export const ease: { [key: string]: (...args: number[]) => number } = {
  out: (t: number) => t * (2 - t),
  in: (t: number) => t * t,
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  linear: (t: number) => t,
  bounceOut: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      t -= 1.5 / d1;
      return n1 * t * t + 0.75;
    } else if (t < 2.5 / d1) {
      t -= 2.25 / d1;
      return n1 * t * t + 0.9375;
    } else {
      t -= 2.625 / d1;
      return n1 * t * t + 0.984375;
    }
  },
  bezier: (t: number, ...args: [number, number, number, number]): number => {
    const [p1x, p1y, p2x, p2y] = args;
    const cx = 3 * p1x;
    const bx = 3 * (p2x - p1x) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * p1y;
    const by = 3 * (p2y - p1y) - cy;
    const ay = 1 - cy - by;

    let solveEpsilon = 1e-6; // Adjust for needed precision

    const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
    const sampleCurveDerivativeX = (t: number) =>
      (3 * ax * t + 2 * bx) * t + cx;

    const solveCurveX = (x: number, epsilon: number): number => {
      let t0: number;
      let t1: number;
      let t2: number;
      let x2: number;
      let d2: number;
      let i: number;

      // First try a few iterations of Newton's method -- normally very fast.
      for (t2 = x, i = 0; i < 8; i++) {
        x2 = sampleCurveX(t2) - x;
        if (Math.abs(x2) < epsilon) return t2;
        d2 = sampleCurveDerivativeX(t2);
        if (Math.abs(d2) < epsilon) break;
        t2 = t2 - x2 / d2;
      }

      // Fallback to the bisection method for reliability.
      t0 = 0;
      t1 = 1;
      t2 = x;

      if (t2 < t0) return t0;
      if (t2 > t1) return t1;

      while (t0 < t1) {
        x2 = sampleCurveX(t2);
        if (Math.abs(x2 - x) < epsilon) return t2;
        if (x > x2) t0 = t2;
        else t1 = t2;
        t2 = (t1 - t0) * 0.5 + t0;
      }

      // Failure.  Is the best we can do.
      return t2;
    };

    return sampleCurveY(solveCurveX(t, solveEpsilon));
  },
};
