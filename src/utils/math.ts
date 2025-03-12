export function lerp(p1: number, p2: number, t: number) {
  return p1 + (p2 - p1) * t;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function map(
  value: number,
  min: number,
  max: number,
  min2: number,
  max2: number
) {
  return lerp(min2, max2, (value - min) / (max - min));
}

export function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function randomIntRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomSign() {
  return Math.random() < 0.5 ? 1 : -1;
}

export function randomGaussian(mean: number, std: number) {
  return Math.random() * std + mean;
}

export function randomNormal(mean: number, std: number) {
  return Math.random() * std + mean;
}
