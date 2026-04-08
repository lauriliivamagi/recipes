export function convertTemperature(
  value: number,
  fromUnit: string,
): { value: number; unit: string } {
  const lower = fromUnit.toLowerCase().trim();
  if (lower === 'f' || lower === 'fahrenheit') {
    return { value: Math.round(((value - 32) * 5) / 9), unit: '°C' };
  }
  return { value, unit: '°C' };
}
