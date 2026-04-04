import { roundQuantity } from './round.js';

export function scaleQuantity(
  qty: number,
  unit: string,
  scaleFactor: number,
): number {
  const scaled = qty * scaleFactor;
  return roundQuantity(scaled, unit);
}

export function scaleTime(
  time: number,
  scalable: boolean,
  scaleFactor: number,
): number {
  if (!scalable) return time;
  if (scaleFactor <= 1) return Math.max(1, Math.round(time * scaleFactor));
  return Math.round(time * Math.sqrt(scaleFactor));
}
