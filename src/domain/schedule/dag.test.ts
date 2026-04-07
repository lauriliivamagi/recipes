import { describe, it, expect } from 'vitest';
import { validateDag } from './dag.js';
import { makeRecipe, ing, op, equip, secs } from '../recipe/test-helpers.js';

describe('validateDag', () => {
  it('valid linear DAG passes', () => {
    const result = validateDag(
      makeRecipe({
        ingredients: [ing('a', 'A', 1, 'g', 'x')],
        operations: [
          op({ id: 'op1', type: 'prep', action: 'chop', ingredients: ['a'], time: secs(60), activeTime: secs(60) }),
          op({ id: 'op2', type: 'cook', action: 'fry', depends: ['op1'], time: secs(120), activeTime: secs(120) }),
        ],
      }),
    );
    expect(result.valid).toBe(true);
  });

  it('valid diamond DAG passes', () => {
    const result = validateDag(
      makeRecipe({
        ingredients: [ing('a', 'A', 1, 'g', 'x')],
        operations: [
          op({ id: 'op1', type: 'prep', action: 'chop', ingredients: ['a'], time: secs(60), activeTime: secs(60) }),
          op({ id: 'op2', type: 'prep', action: 'dice', ingredients: ['a'], time: secs(60), activeTime: secs(60) }),
          op({ id: 'op3', type: 'cook', action: 'mix', depends: ['op1', 'op2'], time: secs(120), activeTime: secs(120) }),
        ],
      }),
    );
    expect(result.valid).toBe(true);
  });

  it('detects cycle (A->B->A)', () => {
    const result = validateDag(
      makeRecipe({
        operations: [
          op({ id: 'a', type: 'prep', action: 'x', depends: ['b'], time: secs(60), activeTime: secs(60) }),
          op({ id: 'b', type: 'prep', action: 'y', depends: ['a'], time: secs(60), activeTime: secs(60) }),
        ],
      }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('Cycle detected'))).toBe(true);
    }
  });

  it('detects unresolved dependency reference', () => {
    const result = validateDag(
      makeRecipe({
        operations: [
          op({ id: 'op1', type: 'prep', action: 'chop', depends: ['nonexistent'], time: secs(60), activeTime: secs(60) }),
        ],
      }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('nonexistent'))).toBe(true);
    }
  });

  it('detects equipment conflict (two ops need same unreleased equipment, not chained)', () => {
    const result = validateDag(
      makeRecipe({
        ingredients: [
          ing('a', 'A', 1, 'g', 'x'),
          ing('b', 'B', 1, 'g', 'x'),
        ],
        equipment: [equip('pan', 'Pan', 1)],
        operations: [
          op({ id: 'op1', type: 'cook', action: 'fry', ingredients: ['a'], equipment: [{ use: 'pan', release: false }], time: secs(300), activeTime: secs(300) }),
          op({ id: 'op2', type: 'cook', action: 'sear', ingredients: ['b'], equipment: [{ use: 'pan', release: true }], time: secs(180), activeTime: secs(180) }),
        ],
      }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('Equipment conflict'))).toBe(true);
    }
  });

  it('equipment chained correctly passes', () => {
    const result = validateDag(
      makeRecipe({
        ingredients: [ing('a', 'A', 1, 'g', 'x')],
        equipment: [equip('pan', 'Pan', 1)],
        operations: [
          op({ id: 'op1', type: 'cook', action: 'fry', ingredients: ['a'], equipment: [{ use: 'pan', release: false }], time: secs(300), activeTime: secs(300) }),
          op({ id: 'op2', type: 'cook', action: 'sear', depends: ['op1'], equipment: [{ use: 'pan', release: true }], time: secs(180), activeTime: secs(180) }),
        ],
      }),
    );
    expect(result.valid).toBe(true);
  });

  it('detects self-referencing op', () => {
    const result = validateDag(
      makeRecipe({
        operations: [
          op({ id: 'op1', type: 'prep', action: 'chop', depends: ['op1'], time: secs(60), activeTime: secs(60) }),
        ],
      }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('Cycle detected'))).toBe(true);
    }
  });
});
