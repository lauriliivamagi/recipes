export interface ConversionResult {
  quantity: number;
  unit: string;
}

export interface FlaggedConversion extends ConversionResult {
  flagged: true;
  original: { quantity: number; unit: string };
  reason: string;
}

export interface VolumeEntry { ml: number; }
export interface WeightEntry { g: number; }

export interface ConversionTable {
  volume: Record<string, VolumeEntry>;
  weight: Record<string, WeightEntry>;
  temperature: Record<string, string>;
  aliases: Record<string, string>;
}

export interface DensityEntry {
  g_per_cup?: number;
  g_per_tbsp?: number;
  g_per_tsp?: number;
  ml_per_tsp?: number;
}

export type DensityTable = Record<string, DensityEntry>;
