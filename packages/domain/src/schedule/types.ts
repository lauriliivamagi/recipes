import type { Operation } from '../recipe/types.js';
import type { TimeRange } from '../shared/types.js';

export type ScheduleMode = 'relaxed' | 'optimized';
export type PhaseType = 'prep' | 'cook' | 'simmer' | 'rest' | 'assemble';

export interface Phase {
  name: string;
  type: PhaseType;
  time: TimeRange;
  operations: Operation[];
  parallel: boolean;
  parallelOps?: Operation[];
}
