export function roundQuantity(quantity: number, unit: string): number {
  const lower = unit.toLowerCase().trim();
  const wholeUnits = ['whole', 'cloves', 'leaves'];
  if (wholeUnits.includes(lower)) return Math.round(quantity);

  if (lower === 'g' || lower === 'ml') {
    if (quantity > 50) return Math.round(quantity / 5) * 5;
    return Math.round(quantity);
  }

  return Math.round(quantity * 10) / 10;
}
