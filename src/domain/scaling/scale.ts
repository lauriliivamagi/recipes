import type { Quantity, TimeRange } from '../recipe/types.js';
import { roundQuantity } from './round.js';

export function scaleQuantity(
  qty: Quantity,
  scaleFactor: number,
): Quantity {
  const scaled = qty.min * scaleFactor;
  return {
    min: roundQuantity(scaled, qty.unit),
    ...(qty.max !== undefined
      ? { max: roundQuantity(qty.max * scaleFactor, qty.unit) }
      : {}),
    unit: qty.unit,
  };
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
