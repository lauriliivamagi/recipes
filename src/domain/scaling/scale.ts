import type { Quantity } from '../recipe/types.js';
import { roundQuantity } from './round.js';

export function scaleQuantity(
  qty: Quantity,
  scaleFactor: number,
): Quantity {
  const scaled = qty.amount * scaleFactor;
  return { amount: roundQuantity(scaled, qty.unit), unit: qty.unit };
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
