import { describe, it, expect } from 'vitest';
import { normalizeUnit, convertUnit } from './unit-convert.js';
import { convertTemperature } from './temperature.js';
import { roundQuantity } from './round.js';
import { scaleQuantity, scaleTime } from './scale.js';
import type { Quantity, TimeRange } from '../recipe/types.js';

const q = (amount: number, unit: string): Quantity => ({ amount, unit });
const tr = (min: number, max?: number): TimeRange => max !== undefined ? { min, max } : { min };

describe('normalizeUnit', () => {
  it('resolves plural alias to canonical', () => {
    expect(normalizeUnit('cups')).toBe('cup');
    expect(normalizeUnit('tablespoons')).toBe('tbsp');
    expect(normalizeUnit('ounces')).toBe('oz');
    expect(normalizeUnit('pounds')).toBe('lb');
  });

  it('returns already-canonical units unchanged', () => {
    expect(normalizeUnit('cup')).toBe('cup');
    expect(normalizeUnit('g')).toBe('g');
    expect(normalizeUnit('ml')).toBe('ml');
  });

  it('passes through unknown units as lowercase', () => {
    expect(normalizeUnit('pinch')).toBe('pinch');
    expect(normalizeUnit('BUNCH')).toBe('bunch');
  });
});

describe('convertUnit', () => {
  it('converts cup of flour to grams via density', () => {
    const result = convertUnit(1, 'cup', 'flour');
    expect(result.unit).toBe('g');
    expect(result.quantity).toBe(120);
  });

  it('converts cup without ingredient to ml', () => {
    const result = convertUnit(1, 'cup');
    expect(result.unit).toBe('ml');
    expect(result.quantity).toBe(240);
  });

  it('converts oz to grams', () => {
    const result = convertUnit(1, 'oz');
    expect(result.unit).toBe('g');
    expect(result.quantity).toBe(28.35);
  });

  it('converts lb to grams', () => {
    const result = convertUnit(2, 'lb');
    expect(result.unit).toBe('g');
    expect(result.quantity).toBeCloseTo(907.2);
  });

  it('passes through already-metric units', () => {
    const result = convertUnit(100, 'ml');
    expect(result).toEqual({ quantity: 100, unit: 'ml' });
  });

  it('flags unknown ingredient with volume unit', () => {
    const result = convertUnit(1, 'cup', 'dragon fruit puree');
    expect(result).toMatchObject({
      flagged: true,
      unit: 'ml',
      quantity: 240,
      reason: 'No density data for ingredient',
    });
  });

  it('converts tsp of baking powder to grams via density', () => {
    const result = convertUnit(1, 'tsp', 'baking powder');
    expect(result.unit).toBe('g');
    expect(result.quantity).toBe(4);
  });

  it('converts tbsp of salt to grams via density', () => {
    const result = convertUnit(1, 'tbsp', 'salt');
    expect(result.unit).toBe('g');
    expect(result.quantity).toBe(18);
  });

  it('converts tsp of vanilla extract to ml via ml_per_tsp density', () => {
    const result = convertUnit(2, 'tsp', 'vanilla extract');
    expect(result.unit).toBe('ml');
    expect(result.quantity).toBe(10);
  });

  it('matches ingredient by substring (whole wheat flour matches flour)', () => {
    const result = convertUnit(1, 'cup', 'whole wheat flour');
    expect(result.unit).toBe('g');
    expect(result.quantity).toBe(128);
  });

  it('converts metric volume unit with unknown ingredient without flagging', () => {
    const result = convertUnit(100, 'ml', 'dragon fruit puree');
    expect(result).toEqual({ quantity: 100, unit: 'ml' });
  });

  it('returns unknown units as-is', () => {
    const result = convertUnit(3, 'cloves');
    expect(result).toEqual({ quantity: 3, unit: 'cloves' });
  });
});

describe('convertTemperature', () => {
  it('converts 350F to 177C', () => {
    const result = convertTemperature(350, 'F');
    expect(result).toEqual({ value: 177, unit: '°C' });
  });

  it('converts 32F to 0C', () => {
    const result = convertTemperature(32, 'fahrenheit');
    expect(result).toEqual({ value: 0, unit: '°C' });
  });

  it('passes through Celsius values', () => {
    const result = convertTemperature(180, 'C');
    expect(result).toEqual({ value: 180, unit: '°C' });
  });
});

describe('roundQuantity', () => {
  it('rounds g > 50 to nearest 5', () => {
    expect(roundQuantity(123, 'g')).toBe(125);
    expect(roundQuantity(52, 'g')).toBe(50);
  });

  it('rounds g <= 50 to nearest integer', () => {
    expect(roundQuantity(3.7, 'g')).toBe(4);
    expect(roundQuantity(50, 'g')).toBe(50);
  });

  it('rounds whole units to integer', () => {
    expect(roundQuantity(2.4, 'whole')).toBe(2);
    expect(roundQuantity(2.6, 'whole')).toBe(3);
  });

  it('rounds cloves to integer', () => {
    expect(roundQuantity(3.3, 'cloves')).toBe(3);
  });

  it('rounds general units to 1 decimal place', () => {
    expect(roundQuantity(1.25, 'cup')).toBe(1.3);
    expect(roundQuantity(0.333, 'tbsp')).toBe(0.3);
  });
});

describe('scaleQuantity', () => {
  it('scales and rounds, returning a Quantity', () => {
    expect(scaleQuantity(q(120, 'g'), 2)).toEqual(q(240, 'g'));
    expect(scaleQuantity(q(1, 'cup'), 1.5)).toEqual(q(1.5, 'cup'));
  });

  it('preserves the unit', () => {
    const result = scaleQuantity(q(100, 'ml'), 3);
    expect(result.unit).toBe('ml');
  });
});

describe('scaleTime', () => {
  it('returns unchanged for non-scalable', () => {
    expect(scaleTime(tr(600), false, 2)).toEqual(tr(600));
  });

  it('scales down linearly', () => {
    expect(scaleTime(tr(3600), true, 0.5)).toEqual(tr(1800));
  });

  it('has minimum of 1 when scaling down', () => {
    expect(scaleTime(tr(1), true, 0.1)).toEqual(tr(1));
  });

  it('scales up with sqrt', () => {
    expect(scaleTime(tr(3600), true, 4)).toEqual(tr(7200));
    expect(scaleTime(tr(1800), true, 2)).toEqual(tr(Math.round(1800 * Math.sqrt(2))));
  });

  it('scales TimeRange with max', () => {
    const result = scaleTime(tr(600, 900), true, 0.5);
    expect(result.min).toBe(300);
    expect(result.max).toBe(450);
  });
});
