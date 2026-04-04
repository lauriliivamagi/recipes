import { describe, it, expect } from 'vitest';
import { findCriticalPath } from './critical-path.js';
import { indexById } from './dag.js';
import type { Operation } from '../recipe/types.js';

describe('findCriticalPath', () => {
  it('linear chain: all ops on critical path', () => {
    const ops: Operation[] = [
      { id: 'a', type: 'cook', action: 'boil', inputs: [], time: 5, activeTime: 5 },
      { id: 'b', type: 'cook', action: 'simmer', inputs: ['a'], time: 10, activeTime: 1 },
      { id: 'c', type: 'cook', action: 'reduce', inputs: ['b'], time: 3, activeTime: 3 },
    ];
    const opMap = indexById(ops);
    const path = findCriticalPath(ops, opMap);
    expect(path.has('a')).toBe(true);
    expect(path.has('b')).toBe(true);
    expect(path.has('c')).toBe(true);
    expect(path.size).toBe(3);
  });

  it('diamond DAG: longest branch is critical path', () => {
    const ops: Operation[] = [
      { id: 'start', type: 'cook', action: 'heat', inputs: [], time: 2, activeTime: 2 },
      { id: 'long', type: 'cook', action: 'simmer', inputs: ['start'], time: 20, activeTime: 1 },
      { id: 'short', type: 'cook', action: 'stir', inputs: ['start'], time: 3, activeTime: 3 },
      { id: 'end', type: 'cook', action: 'combine', inputs: ['long', 'short'], time: 5, activeTime: 5 },
    ];
    const opMap = indexById(ops);
    const path = findCriticalPath(ops, opMap);
    expect(path.has('start')).toBe(true);
    expect(path.has('long')).toBe(true);
    expect(path.has('end')).toBe(true);
    // 'short' is not on the critical path because its branch is shorter
    expect(path.has('short')).toBe(false);
  });
});
