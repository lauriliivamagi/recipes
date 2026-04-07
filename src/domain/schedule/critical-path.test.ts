import { describe, it, expect } from 'vitest';
import { findCriticalPath } from './critical-path.js';
import { indexById } from './dag.js';
import { op, secs } from '../recipe/test-helpers.js';

describe('findCriticalPath', () => {
  it('linear chain: all ops on critical path', () => {
    const ops = [
      op({ id: 'a', type: 'cook', action: 'boil', time: secs(300), activeTime: secs(300) }),
      op({ id: 'b', type: 'cook', action: 'simmer', depends: ['a'], time: secs(600), activeTime: secs(60) }),
      op({ id: 'c', type: 'cook', action: 'reduce', depends: ['b'], time: secs(180), activeTime: secs(180) }),
    ];
    const opMap = indexById(ops);
    const path = findCriticalPath(ops, opMap);
    expect(path.has('a')).toBe(true);
    expect(path.has('b')).toBe(true);
    expect(path.has('c')).toBe(true);
    expect(path.size).toBe(3);
  });

  it('diamond DAG: longest branch is critical path', () => {
    const ops = [
      op({ id: 'start', type: 'cook', action: 'heat', time: secs(120), activeTime: secs(120) }),
      op({ id: 'long', type: 'cook', action: 'simmer', depends: ['start'], time: secs(1200), activeTime: secs(60) }),
      op({ id: 'short', type: 'cook', action: 'stir', depends: ['start'], time: secs(180), activeTime: secs(180) }),
      op({ id: 'end', type: 'cook', action: 'combine', depends: ['long', 'short'], time: secs(300), activeTime: secs(300) }),
    ];
    const opMap = indexById(ops);
    const path = findCriticalPath(ops, opMap);
    expect(path.has('start')).toBe(true);
    expect(path.has('long')).toBe(true);
    expect(path.has('end')).toBe(true);
    expect(path.has('short')).toBe(false);
  });
});
