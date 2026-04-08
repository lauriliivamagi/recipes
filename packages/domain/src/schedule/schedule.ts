import type { Recipe, TimeRange } from '../recipe/types.js';
import type { Phase, ScheduleMode } from './types.js';
import { indexById, topoSort } from './dag.js';
import { buildRelaxedSchedule } from './schedule-relaxed.js';
import { buildOptimizedSchedule } from './schedule-optimized.js';

export function computeSchedule(recipe: Recipe, mode: ScheduleMode): Phase[] {
  const operations = recipe.operations || [];
  const operationMap = indexById(operations);
  const sorted = topoSort(operations);

  const prepOps = sorted
    .filter((id) => operationMap.get(id)!.type === 'prep')
    .map((id) => operationMap.get(id)!);
  const cookOps = sorted
    .filter((id) => operationMap.get(id)!.type === 'cook')
    .map((id) => operationMap.get(id)!);
  const restOps = sorted
    .filter((id) => operationMap.get(id)!.type === 'rest')
    .map((id) => operationMap.get(id)!);
  const assembleOps = sorted
    .filter((id) => operationMap.get(id)!.type === 'assemble')
    .map((id) => operationMap.get(id)!);

  if (mode === 'relaxed') {
    return buildRelaxedSchedule(
      prepOps,
      cookOps,
      restOps,
      assembleOps,
      operationMap,
      recipe,
    );
  }
  return buildOptimizedSchedule(
    prepOps,
    cookOps,
    operations,
    operationMap,
  );
}

export function computeTotalTime(phases: Phase[]): TimeRange {
  let totalMin = 0;
  let totalMax = 0;
  let hasMax = false;
  for (const phase of phases) {
    if (phase.parallel && phase.parallelOps && phase.parallelOps.length > 0) {
      const parallelMin = phase.parallelOps.reduce(
        (sum, op) => sum + op.time.min,
        0,
      );
      totalMin += Math.max(phase.time.min, parallelMin);
      const phaseMax = phase.time.max ?? phase.time.min;
      const parallelMax = phase.parallelOps.reduce(
        (sum, op) => sum + (op.time.max ?? op.time.min),
        0,
      );
      totalMax += Math.max(phaseMax, parallelMax);
      if (phase.time.max !== undefined) hasMax = true;
    } else {
      totalMin += phase.time.min;
      totalMax += phase.time.max ?? phase.time.min;
      if (phase.time.max !== undefined) hasMax = true;
    }
  }
  return hasMax ? { min: totalMin, max: totalMax } : { min: totalMin };
}
