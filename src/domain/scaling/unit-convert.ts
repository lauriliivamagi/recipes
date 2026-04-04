import conversions from '../../../config/unit-conversions.json';
import densities from '../../../config/ingredient-densities.json';
import type {
  ConversionResult,
  ConversionTable,
  DensityEntry,
  DensityTable,
  FlaggedConversion,
} from './types.js';

const conv = conversions as ConversionTable;
const dens = densities as DensityTable;

export function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();
  return conv.aliases[lower] ?? lower;
}

function findDensity(ingredientName: string | null | undefined): DensityEntry | null {
  if (!ingredientName) return null;
  const lower = ingredientName.toLowerCase().trim();
  if (dens[lower] && lower !== '_comment') return dens[lower]!;

  const keys = Object.keys(dens)
    .filter((k) => k !== '_comment')
    .sort((a, b) => b.length - a.length);

  for (const key of keys) {
    if (lower.includes(key) || key.includes(lower)) {
      return dens[key]!;
    }
  }
  return null;
}

function convertWithDensity(
  quantity: number,
  canonicalUnit: string,
  density: DensityEntry,
): ConversionResult | null {
  if (density.g_per_cup != null) {
    const mlValue = conv.volume[canonicalUnit]?.ml;
    if (mlValue == null) return null;
    const cups = (quantity * mlValue) / 240;
    return { quantity: cups * density.g_per_cup, unit: 'g' };
  }
  if (density.g_per_tbsp != null) {
    const mlValue = conv.volume[canonicalUnit]?.ml;
    if (mlValue == null) return null;
    const tbsps = (quantity * mlValue) / 15;
    return { quantity: tbsps * density.g_per_tbsp, unit: 'g' };
  }
  if (density.g_per_tsp != null) {
    const mlValue = conv.volume[canonicalUnit]?.ml;
    if (mlValue == null) return null;
    const tsps = (quantity * mlValue) / 5;
    return { quantity: tsps * density.g_per_tsp, unit: 'g' };
  }
  if (density.ml_per_tsp != null) {
    const mlValue = conv.volume[canonicalUnit]?.ml;
    if (mlValue == null) return null;
    return { quantity: quantity * mlValue, unit: 'ml' };
  }
  return null;
}

export function convertUnit(
  quantity: number,
  fromUnit: string,
  ingredientName: string | null = null,
): ConversionResult | FlaggedConversion {
  const canonical = normalizeUnit(fromUnit);

  if (conv.weight[canonical]) {
    const grams = quantity * conv.weight[canonical]!.g;
    return { quantity: grams, unit: 'g' };
  }

  if (conv.volume[canonical]) {
    const density = findDensity(ingredientName);
    if (density) {
      const result = convertWithDensity(quantity, canonical, density);
      if (result) return result;
    }

    if (ingredientName && !density) {
      const isAlreadyMetric = ['ml', 'l', 'dl', 'liter'].includes(canonical);
      if (!isAlreadyMetric) {
        const mlValue = quantity * conv.volume[canonical]!.ml;
        return {
          flagged: true,
          quantity: mlValue,
          unit: 'ml',
          original: { quantity, unit: fromUnit },
          reason: 'No density data for ingredient',
        };
      }
    }

    const ml = quantity * conv.volume[canonical]!.ml;
    return { quantity: ml, unit: 'ml' };
  }

  return { quantity, unit: canonical };
}
