import type { Quantity } from '../recipe/types.js';

/** Format a Quantity for display. Uses en-dash for ranges (e.g., "100–150 g"). */
export function formatQuantity(qty: Quantity): string {
  if (qty.max !== undefined) {
    return `${qty.min}\u2013${qty.max} ${qty.unit}`;
  }
  return `${qty.min} ${qty.unit}`;
}
