import type { Operation, FinishStep } from '../recipe/types.js';

export type ScheduleMode = 'relaxed' | 'optimized';
export type PhaseType = 'prep' | 'cook' | 'simmer' | 'finish';

export interface Phase {
  name: string;
  type: PhaseType;
  time: number;
  operations: (Operation | FinishStep)[];
  parallel: boolean;
  parallelOps?: Operation[];
}
