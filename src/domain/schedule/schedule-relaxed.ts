import type { Operation, FinishStep, Recipe } from '../recipe/types.js';
import type { Phase } from './types.js';

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapOpsToSubProducts(
  recipe: Recipe,
  operationMap: Map<string, Operation>,
): Map<string, string> {
  const map = new Map<string, string>();
  const subProducts = recipe.subProducts || [];
  if (subProducts.length === 0) return map;

  function chainDepth(opId: string, visited: Set<string>): number {
    if (visited.has(opId)) return 0;
    visited.add(opId);
    const op = operationMap.get(opId);
    if (!op) return 0;
    let maxD = 0;
    for (const ref of op.inputs || []) {
      if (operationMap.has(ref))
        maxD = Math.max(maxD, chainDepth(ref, visited));
    }
    return maxD + 1;
  }

  const sorted = [...subProducts].sort(
    (a, b) =>
      chainDepth(a.finalOp, new Set()) - chainDepth(b.finalOp, new Set()),
  );

  for (const sp of sorted) {
    const visited = new Set<string>();
    function walkBack(opId: string): void {
      if (visited.has(opId)) return;
      visited.add(opId);
      if (map.has(opId)) return;
      map.set(opId, sp.name);
      const op = operationMap.get(opId);
      if (!op) return;
      for (const ref of op.inputs || []) {
        if (operationMap.has(ref)) walkBack(ref);
      }
    }
    walkBack(sp.finalOp);
  }

  for (const fs of recipe.finishSteps || []) {
    const label = capitalize(fs.action || '');
    for (const ref of fs.inputs || []) {
      const visited2 = new Set<string>();
      function walkBack2(opId: string): void {
        if (visited2.has(opId)) return;
        visited2.add(opId);
        if (map.has(opId)) return;
        map.set(opId, label);
        const op = operationMap.get(opId);
        if (!op) return;
        for (const ref2 of op.inputs || []) {
          if (operationMap.has(ref2)) walkBack2(ref2);
        }
      }
      if (operationMap.has(ref)) walkBack2(ref);
    }
  }

  return map;
}

function groupCookOpsBySubProduct(
  cookOps: Operation[],
  opSpMap: Map<string, string>,
): Operation[][] {
  const groupMap = new Map<string, Operation[]>();
  const ungrouped: Operation[] = [];

  for (const op of cookOps) {
    const spName = opSpMap.get(op.id);
    if (spName) {
      if (!groupMap.has(spName)) groupMap.set(spName, []);
      groupMap.get(spName)!.push(op);
    } else {
      ungrouped.push(op);
    }
  }

  const cookOpIdx = new Map<string, number>();
  cookOps.forEach((op, i) => cookOpIdx.set(op.id, i));

  const groups = [...groupMap.values()];
  groups.sort((a, b) => {
    const aIds = new Set(a.map((op) => op.id));
    const bIds = new Set(b.map((op) => op.id));
    const bDependsOnA = b.some((op) =>
      (op.inputs || []).some((ref) => aIds.has(ref)),
    );
    const aDependsOnB = a.some((op) =>
      (op.inputs || []).some((ref) => bIds.has(ref)),
    );
    if (bDependsOnA && !aDependsOnB) return -1;
    if (aDependsOnB && !bDependsOnA) return 1;
    return (cookOpIdx.get(a[0]!.id) ?? 0) - (cookOpIdx.get(b[0]!.id) ?? 0);
  });

  if (ungrouped.length > 0) groups.push(ungrouped);
  return groups;
}

function emitCookPhases(ops: Operation[], phases: Phase[]): void {
  let currentGroup: Operation[] = [];

  function flush(): void {
    if (currentGroup.length === 0) return;
    phases.push({
      name: currentGroup.map((op) => capitalize(op.action)).join(' + '),
      type: 'cook',
      time: currentGroup.reduce((s, op) => s + op.time, 0),
      operations: [...currentGroup],
      parallel: false,
    });
    currentGroup = [];
  }

  for (const op of ops) {
    const isPassive =
      op.activeTime !== undefined && op.activeTime < op.time * 0.25;
    if (isPassive) {
      flush();
      phases.push({
        name: capitalize(op.action),
        type: 'simmer',
        time: op.time,
        operations: [op],
        parallel: false,
      });
    } else {
      currentGroup.push(op);
    }
  }
  flush();
}

export function buildRelaxedSchedule(
  prepOps: Operation[],
  cookOps: Operation[],
  finishSteps: FinishStep[],
  operationMap: Map<string, Operation>,
  recipe: Recipe,
): Phase[] {
  const phases: Phase[] = [];

  // Prep phase
  if (prepOps.length > 0) {
    phases.push({
      name: 'Prep',
      type: 'prep',
      time: prepOps.reduce((sum, op) => sum + op.time, 0),
      operations: prepOps,
      parallel: false,
    });
  }

  // Cook phases grouped by sub-product
  const opSpMap = mapOpsToSubProducts(recipe, operationMap);
  const groups = groupCookOpsBySubProduct(cookOps, opSpMap);
  for (const group of groups) {
    emitCookPhases(group, phases);
  }

  // Finish phase
  if (finishSteps.length > 0) {
    phases.push({
      name: 'Finish',
      type: 'finish',
      time: finishSteps.reduce(
        (sum, s) => sum + ((s as Operation).time || 1),
        0,
      ),
      operations: finishSteps,
      parallel: false,
    });
  }

  return phases;
}
