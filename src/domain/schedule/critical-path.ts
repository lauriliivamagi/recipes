import type { Operation } from '../recipe/types.js';

export function findCriticalPath(
  cookOps: Operation[],
  operationMap: Map<string, Operation>,
): Set<string> {
  const cookIds = new Set(cookOps.map((op) => op.id));

  const inDeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const op of cookOps) {
    inDeg.set(op.id, 0);
    adj.set(op.id, []);
  }
  for (const op of cookOps) {
    for (const ref of op.inputs || []) {
      if (cookIds.has(ref)) {
        adj.get(ref)!.push(op.id);
        inDeg.set(op.id, inDeg.get(op.id)! + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDeg) {
    if (deg === 0) queue.push(id);
  }
  const sorted: string[] = [];
  while (queue.length) {
    const n = queue.shift()!;
    sorted.push(n);
    for (const nb of adj.get(n)!) {
      const nd = inDeg.get(nb)! - 1;
      inDeg.set(nb, nd);
      if (nd === 0) queue.push(nb);
    }
  }

  const dist = new Map<string, number>();
  const pred = new Map<string, string | null>();
  for (const opId of sorted) {
    const op = operationMap.get(opId)!;
    let maxPrev = 0;
    let bestPred: string | null = null;
    for (const ref of op.inputs || []) {
      if (dist.has(ref) && dist.get(ref)! > maxPrev) {
        maxPrev = dist.get(ref)!;
        bestPred = ref;
      }
    }
    dist.set(opId, maxPrev + op.time);
    pred.set(opId, bestPred);
  }

  let endOp: string | null = null;
  let maxDist = 0;
  for (const [id, d] of dist) {
    if (d > maxDist) {
      maxDist = d;
      endOp = id;
    }
  }

  const path = new Set<string>();
  let cur = endOp;
  while (cur) {
    path.add(cur);
    cur = pred.get(cur) ?? null;
  }
  return path;
}
