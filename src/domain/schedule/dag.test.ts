import { describe, it, expect } from 'vitest';
import { validateDag } from './dag.js';
import { makeRecipe, ing, op, equip } from '../recipe/test-helpers.js';

describe('validateDag', () => {
  it('valid linear DAG passes', () => {
    const result = validateDag(
      makeRecipe({
        ingredients: [ing('a', 'A', 1, 'g', 'x')],
        operations: [
          op({ id: 'op1', type: 'prep', action: 'chop', inputs: ['a'], time: 1, activeTime: 1 }),
          op({ id: 'op2', type: 'cook', action: 'fry', inputs: ['op1'], time: 2, activeTime: 2 }),
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
          op({ id: 'op1', type: 'prep', action: 'chop', inputs: ['a'], time: 1, activeTime: 1 }),
          op({ id: 'op2', type: 'prep', action: 'dice', inputs: ['a'], time: 1, activeTime: 1 }),
          op({ id: 'op3', type: 'cook', action: 'mix', inputs: ['op1', 'op2'], time: 2, activeTime: 2 }),
        ],
      }),
    );
    expect(result.valid).toBe(true);
  });

  it('detects cycle (A->B->A)', () => {
    const result = validateDag(
      makeRecipe({
        operations: [
          op({ id: 'a', type: 'prep', action: 'x', inputs: ['b'], time: 1, activeTime: 1 }),
          op({ id: 'b', type: 'prep', action: 'y', inputs: ['a'], time: 1, activeTime: 1 }),
        ],
      }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('Cycle detected'))).toBe(true);
    }
  });

  it('detects unresolved input reference', () => {
    const result = validateDag(
      makeRecipe({
        operations: [
          op({ id: 'op1', type: 'prep', action: 'chop', inputs: ['nonexistent'], time: 1, activeTime: 1 }),
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
          op({ id: 'op1', type: 'cook', action: 'fry', inputs: ['a'], equipment: { use: 'pan', release: false }, time: 5, activeTime: 5 }),
          op({ id: 'op2', type: 'cook', action: 'sear', inputs: ['b'], equipment: { use: 'pan', release: true }, time: 3, activeTime: 3 }),
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
          op({ id: 'op1', type: 'cook', action: 'fry', inputs: ['a'], equipment: { use: 'pan', release: false }, time: 5, activeTime: 5 }),
          op({ id: 'op2', type: 'cook', action: 'sear', inputs: ['op1'], equipment: { use: 'pan', release: true }, time: 3, activeTime: 3 }),
        ],
      }),
    );
    expect(result.valid).toBe(true);
  });

  it('detects unresolved reference in finish steps', () => {
    const result = validateDag(
      makeRecipe({
        ingredients: [ing('a', 'A', 1, 'g', 'x')],
        operations: [
          op({ id: 'op1', type: 'prep', action: 'chop', inputs: ['a'], time: 1, activeTime: 1 }),
        ],
        finishSteps: [
          { action: 'plate', inputs: ['op1', 'nonexistent-ref'], details: '' },
        ],
      }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('nonexistent-ref'))).toBe(true);
      expect(result.errors.some((e) => e.includes('Finish step'))).toBe(true);
    }
  });

  it('detects self-referencing op', () => {
    const result = validateDag(
      makeRecipe({
        operations: [
          op({ id: 'op1', type: 'prep', action: 'chop', inputs: ['op1'], time: 1, activeTime: 1 }),
        ],
      }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('Cycle detected'))).toBe(true);
    }
  });
});
