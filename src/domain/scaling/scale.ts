import type { Quantity, TimeRange } from '../recipe/types.js';
import { roundQuantity } from './round.js';

export function scaleQuantity(
  qty: Quantity,
  scaleFactor: number,
): Quantity {
  const scaled = qty.amount * scaleFactor;
  return { amount: roundQuantity(scaled, qty.unit), unit: qty.unit };
}

export function scaleTime(
  time: TimeRange,
  scalable: boolean,
  scaleFactor: number,
): TimeRange {
  if (!scalable) return time;
  const scaleValue = (v: number): number => {
    if (scaleFactor <= 1) return Math.max(1, Math.round(v * scaleFactor));
    return Math.round(v * Math.sqrt(scaleFactor));
  };
  return {
    min: scaleValue(time.min),
    ...(time.max !== undefined ? { max: scaleValue(time.max) } : {}),
  };
}
