export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distanceSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function normalize(dx: number, dy: number): { x: number; y: number; length: number } {
  const length = Math.hypot(dx, dy);
  if (length <= 0.0001) return { x: 0, y: 0, length: 0 };
  return { x: dx / length, y: dy / length, length };
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function chooseOne<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
