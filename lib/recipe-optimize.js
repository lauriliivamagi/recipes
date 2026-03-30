/**
 * recipe-optimize.js
 *
 * Core algorithm for computing relaxed and optimized recipe schedules
 * from the operation DAG defined in the recipe JSON format.
 *
 * Plain ES module -- no build step required.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a lookup map from an array of objects with `id` fields.
 * @param {Array<{id: string}>} items
 * @returns {Map<string, object>}
 */
function indexById(items) {
  const map = new Map();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
}

/**
 * Classify an input reference as either an ingredient ID or an operation ID.
 * @param {string} ref
 * @param {Map<string, object>} ingredientMap
 * @param {Map<string, object>} operationMap
 * @returns {"ingredient"|"operation"|"unknown"}
 */
function classifyRef(ref, ingredientMap, operationMap) {
  if (ingredientMap.has(ref)) return "ingredient";
  if (operationMap.has(ref)) return "operation";
  return "unknown";
}

// ---------------------------------------------------------------------------
// validateDag
// ---------------------------------------------------------------------------

/**
 * Validate the operation DAG of a recipe.
 *
 * Checks performed:
 * 1. All input references resolve to an ingredient ID or operation ID.
 * 2. The operation graph is acyclic (topological sort).
 * 3. No two operations use the same equipment at the same time unless
 *    the earlier operation releases it.
 *
 * @param {object} recipe - A recipe object matching the JSON schema.
 * @returns {{ valid: boolean, errors?: string[] }}
 */
export function validateDag(recipe) {
  const errors = [];
  const ingredients = recipe.ingredients || [];
  const operations = recipe.operations || [];
  const equipment = recipe.equipment || [];

  const ingredientMap = indexById(ingredients);
  const operationMap = indexById(operations);
  const equipmentMap = indexById(equipment);

  // 1. Check all input references resolve
  for (const op of operations) {
    for (const ref of op.inputs || []) {
      const kind = classifyRef(ref, ingredientMap, operationMap);
      if (kind === "unknown") {
        errors.push(
          `Operation "${op.id}": input "${ref}" does not match any ingredient or operation ID.`
        );
      }
    }
  }

  // Also validate finishSteps inputs
  for (const step of recipe.finishSteps || []) {
    for (const ref of step.inputs || []) {
      const kind = classifyRef(ref, ingredientMap, operationMap);
      if (kind === "unknown") {
        errors.push(
          `Finish step "${step.action}": input "${ref}" does not match any ingredient or operation ID.`
        );
      }
    }
  }

  // 2. Cycle detection via topological sort (Kahn's algorithm)
  // Build adjacency list among operations only
  const inDegree = new Map();
  const adj = new Map();
  for (const op of operations) {
    inDegree.set(op.id, 0);
    adj.set(op.id, []);
  }
  for (const op of operations) {
    for (const ref of op.inputs || []) {
      if (operationMap.has(ref)) {
        adj.get(ref).push(op.id);
        inDegree.set(op.id, inDegree.get(op.id) + 1);
      }
    }
  }

  const queue = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }
  const sorted = [];
  while (queue.length > 0) {
    const node = queue.shift();
    sorted.push(node);
    for (const neighbour of adj.get(node)) {
      const newDeg = inDegree.get(neighbour) - 1;
      inDegree.set(neighbour, newDeg);
      if (newDeg === 0) queue.push(neighbour);
    }
  }

  if (sorted.length !== operations.length) {
    const inCycle = operations
      .filter((op) => !sorted.includes(op.id))
      .map((op) => op.id);
    errors.push(`Cycle detected among operations: ${inCycle.join(", ")}.`);
  }

  // 3. Equipment conflict detection
  // Walk the topological order, tracking equipment occupancy.
  // An operation that uses equipment with release:false keeps it occupied
  // until the next operation on that equipment (which inherits the pan).
  const equipmentHolder = new Map(); // equipmentId -> operationId currently holding it
  for (const opId of sorted) {
    const op = operationMap.get(opId);
    if (!op.equipment) continue;
    const eqId = op.equipment.use;
    const holder = equipmentHolder.get(eqId);

    if (holder) {
      // Something is occupying this equipment. Check whether the current op
      // is a direct downstream consumer of the holder (i.e., it chains in the
      // same pan). If not, it is a conflict.
      const holderOp = operationMap.get(holder);
      const isChained = (op.inputs || []).includes(holder);
      if (!isChained) {
        errors.push(
          `Equipment conflict: "${eqId}" is held by "${holder}" (release: false) ` +
            `but "${op.id}" also needs it and is not a direct successor.`
        );
      }
    }

    if (op.equipment.release) {
      equipmentHolder.delete(eqId);
    } else {
      equipmentHolder.set(eqId, op.id);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// resolveIngredients
// ---------------------------------------------------------------------------

/**
 * Given an operation, walk the input chain and return all ingredient objects
 * that feed into it (directly or transitively through other operations).
 *
 * @param {object} operation - An operation from the recipe.
 * @param {object} recipe - The full recipe object.
 * @returns {object[]} Array of ingredient objects.
 */
export function resolveIngredients(operation, recipe) {
  const ingredientMap = indexById(recipe.ingredients || []);
  const operationMap = indexById(recipe.operations || []);
  const result = [];
  const seen = new Set();

  function walk(op) {
    for (const ref of op.inputs || []) {
      if (seen.has(ref)) continue;
      seen.add(ref);
      if (ingredientMap.has(ref)) {
        result.push(ingredientMap.get(ref));
      } else if (operationMap.has(ref)) {
        walk(operationMap.get(ref));
      }
    }
  }

  walk(operation);
  return result;
}

// ---------------------------------------------------------------------------
// computeSchedule
// ---------------------------------------------------------------------------

/**
 * Produce a topologically sorted list of operation IDs.
 * @param {object[]} operations
 * @param {Map<string, object>} ingredientMap
 * @returns {string[]}
 */
function topoSort(operations, ingredientMap) {
  const operationMap = indexById(operations);
  const inDegree = new Map();
  const adj = new Map();
  for (const op of operations) {
    inDegree.set(op.id, 0);
    adj.set(op.id, []);
  }
  for (const op of operations) {
    for (const ref of op.inputs || []) {
      if (operationMap.has(ref)) {
        adj.get(ref).push(op.id);
        inDegree.set(op.id, inDegree.get(op.id) + 1);
      }
    }
  }
  const queue = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }
  const sorted = [];
  while (queue.length > 0) {
    const node = queue.shift();
    sorted.push(node);
    for (const neighbour of adj.get(node)) {
      const newDeg = inDegree.get(neighbour) - 1;
      inDegree.set(neighbour, newDeg);
      if (newDeg === 0) queue.push(neighbour);
    }
  }
  return sorted;
}

/**
 * Determine which prep operations are needed before the first cook step.
 * An "early" prep op is one whose output is (transitively) required by
 * a cook operation that has no cook-type predecessors.
 *
 * @param {object[]} operations
 * @param {Map<string, object>} operationMap
 * @returns {Set<string>} IDs of essential early prep ops
 */
function findEarlyPrepOps(operations, operationMap) {
  // Find the first cook operations (cook ops with no cook predecessors)
  const firstCookOps = operations.filter((op) => {
    if (op.type !== "cook") return false;
    // Check if any input is another cook operation
    return !(op.inputs || []).some((ref) => {
      const dep = operationMap.get(ref);
      return dep && dep.type === "cook";
    });
  });

  // Walk backwards from first cook ops to find all required prep ops
  const needed = new Set();

  function walkBack(opId) {
    const op = operationMap.get(opId);
    if (!op) return;
    for (const ref of op.inputs || []) {
      if (needed.has(ref)) continue;
      const dep = operationMap.get(ref);
      if (dep && dep.type === "prep") {
        needed.add(dep.id);
        walkBack(dep.id); // in case prep depends on other prep
      }
    }
  }

  for (const cookOp of firstCookOps) {
    walkBack(cookOp.id);
  }
  return needed;
}

/**
 * Find idle windows: operations where time > activeTime (passive time).
 * Returns an array of { operation, idleTime }.
 *
 * @param {object[]} orderedOps
 * @returns {Array<{operation: object, idleTime: number}>}
 */
function findIdleWindows(orderedOps) {
  const windows = [];
  for (const op of orderedOps) {
    const active = op.activeTime ?? op.time;
    const idle = op.time - active;
    if (idle > 0) {
      windows.push({ operation: op, idleTime: idle });
    }
  }
  return windows;
}

/**
 * Check whether an operation can be scheduled in parallel with an idle window,
 * given current equipment usage.
 *
 * @param {object} op - The candidate operation to schedule.
 * @param {Set<string>} busyEquipment - Equipment IDs currently in use.
 * @returns {boolean}
 */
function canScheduleParallel(op, busyEquipment) {
  if (!op.equipment) return true;
  return !busyEquipment.has(op.equipment.use);
}

/**
 * Compute the schedule (array of phases) for a recipe.
 *
 * @param {object} recipe - The full recipe object.
 * @param {"relaxed"|"optimized"} mode - Schedule mode.
 * @returns {Array<{
 *   name: string,
 *   type: string,
 *   time: number,
 *   operations: object[],
 *   parallel: boolean,
 *   parallelOps?: object[]
 * }>}
 */
export function computeSchedule(recipe, mode) {
  const operations = recipe.operations || [];
  const ingredientMap = indexById(recipe.ingredients || []);
  const operationMap = indexById(operations);
  const sorted = topoSort(operations, ingredientMap);

  const prepOps = sorted
    .filter((id) => operationMap.get(id).type === "prep")
    .map((id) => operationMap.get(id));
  const cookOps = sorted
    .filter((id) => operationMap.get(id).type === "cook")
    .map((id) => operationMap.get(id));
  const finishSteps = recipe.finishSteps || [];

  if (mode === "relaxed") {
    return buildRelaxedSchedule(prepOps, cookOps, finishSteps, operationMap);
  }
  return buildOptimizedSchedule(
    prepOps,
    cookOps,
    finishSteps,
    operations,
    operationMap
  );
}

/**
 * Build relaxed schedule: all prep first, then cook in order, then finish.
 */
function buildRelaxedSchedule(prepOps, cookOps, finishSteps, operationMap) {
  const phases = [];

  // PREP phase -- all prep ops sequentially
  if (prepOps.length > 0) {
    phases.push({
      name: "Prep",
      type: "prep",
      time: prepOps.reduce((sum, op) => sum + op.time, 0),
      operations: prepOps,
      parallel: false,
    });
  }

  // COOK phases -- group consecutive cook operations into logical phases.
  // A passive operation (activeTime === 0 or very low relative to time) gets
  // its own "simmer" phase. Active cook ops are grouped together.
  let currentCookGroup = [];

  function flushCookGroup() {
    if (currentCookGroup.length === 0) return;
    const totalTime = currentCookGroup.reduce((s, op) => s + op.time, 0);
    phases.push({
      name: currentCookGroup.map((op) => capitalize(op.action)).join(" + "),
      type: "cook",
      time: totalTime,
      operations: [...currentCookGroup],
      parallel: false,
    });
    currentCookGroup = [];
  }

  for (const op of cookOps) {
    const isPassive =
      op.activeTime !== undefined && op.activeTime < op.time * 0.25;
    if (isPassive) {
      flushCookGroup();
      phases.push({
        name: capitalize(op.action),
        type: "simmer",
        time: op.time,
        operations: [op],
        parallel: false,
      });
    } else {
      currentCookGroup.push(op);
    }
  }
  flushCookGroup();

  // FINISH phase
  if (finishSteps.length > 0) {
    phases.push({
      name: "Finish",
      type: "finish",
      time: finishSteps.reduce((sum, s) => sum + (s.time || 1), 0),
      operations: finishSteps,
      parallel: false,
    });
  }

  return phases;
}

/**
 * Build optimized schedule: only essential prep upfront, deferred prep into
 * idle windows, parallel cook ops scheduled during passive windows.
 */
function buildOptimizedSchedule(
  prepOps,
  cookOps,
  finishSteps,
  allOperations,
  operationMap
) {
  const phases = [];

  // Identify early prep (needed before the first cook step)
  const earlyPrepIds = findEarlyPrepOps(allOperations, operationMap);
  const earlyPrep = prepOps.filter((op) => earlyPrepIds.has(op.id));
  const deferredPrep = prepOps.filter((op) => !earlyPrepIds.has(op.id));

  // 1. Essential PREP phase
  if (earlyPrep.length > 0) {
    phases.push({
      name: "Prep",
      type: "prep",
      time: earlyPrep.reduce((sum, op) => sum + op.time, 0),
      operations: earlyPrep,
      parallel: false,
    });
  }

  // 2. Cook phases -- similar to relaxed, but passive windows get parallel ops
  let deferredQueue = [...deferredPrep];
  let currentCookGroup = [];

  // Find cook ops that are fully independent from the main cook chain:
  // 1. They have no cook-type inputs (no dependency on other cook ops)
  // 2. No other cook op depends on them (they are not prerequisites)
  // These can potentially run in parallel during idle windows.
  const cookOpIds = new Set(cookOps.map((op) => op.id));
  const hasCookSuccessor = new Set();
  for (const op of cookOps) {
    for (const ref of op.inputs || []) {
      if (cookOpIds.has(ref)) {
        hasCookSuccessor.add(ref);
      }
    }
  }

  const independentCookOps = new Set();
  for (const op of cookOps) {
    // Must not have any cook-type input dependency
    const hasCookDep = (op.inputs || []).some((ref) => cookOpIds.has(ref));
    // Must not be depended on by any other cook op
    const isDepOf = hasCookSuccessor.has(op.id);
    if (!hasCookDep && !isDepOf) {
      independentCookOps.add(op.id);
    }
  }

  // Separate cook ops into main sequence and parallelizable
  const mainCookOps = cookOps.filter((op) => !independentCookOps.has(op.id));
  const parallelCookCandidates = cookOps.filter((op) =>
    independentCookOps.has(op.id)
  );

  // But if a "parallel" cook op is the only cook op, it is the main sequence
  // Also, keep the first cook chain as main always
  let actualParallelCook = [];
  let actualMainCook = [...mainCookOps];
  if (actualMainCook.length === 0 && parallelCookCandidates.length > 0) {
    actualMainCook = [parallelCookCandidates.shift()];
    actualParallelCook = parallelCookCandidates;
  } else {
    actualParallelCook = parallelCookCandidates;
  }

  function flushCookGroup() {
    if (currentCookGroup.length === 0) return;
    const totalTime = currentCookGroup.reduce((s, op) => s + op.time, 0);
    phases.push({
      name: currentCookGroup.map((op) => capitalize(op.action)).join(" + "),
      type: "cook",
      time: totalTime,
      operations: [...currentCookGroup],
      parallel: false,
    });
    currentCookGroup = [];
  }

  for (const op of actualMainCook) {
    const isPassive =
      op.activeTime !== undefined && op.activeTime < op.time * 0.25;
    if (isPassive) {
      flushCookGroup();

      // Find what can be scheduled during this idle window
      const idleTime = op.time - (op.activeTime ?? 0);
      const busyEquipment = new Set();
      if (op.equipment && !op.equipment.release) {
        busyEquipment.add(op.equipment.use);
      }

      const scheduledParallel = [];

      // First try deferred prep
      const remainingDeferred = [];
      for (const dOp of deferredQueue) {
        if (
          dOp.time <= idleTime &&
          canScheduleParallel(dOp, busyEquipment)
        ) {
          scheduledParallel.push(dOp);
          if (dOp.equipment) busyEquipment.add(dOp.equipment.use);
        } else {
          remainingDeferred.push(dOp);
        }
      }
      deferredQueue = remainingDeferred;

      // Then try parallel cook ops
      const remainingParallel = [];
      for (const pOp of actualParallelCook) {
        if (
          pOp.time <= idleTime &&
          canScheduleParallel(pOp, busyEquipment)
        ) {
          // Also check that its prep deps are satisfied
          const prepDepsSatisfied = (pOp.inputs || []).every((ref) => {
            const dep = operationMap.get(ref);
            if (!dep || dep.type !== "prep") return true;
            // Prep dep must already be scheduled (in earlyPrep or scheduledParallel)
            return (
              earlyPrepIds.has(ref) ||
              scheduledParallel.some((sp) => sp.id === ref)
            );
          });
          if (prepDepsSatisfied) {
            scheduledParallel.push(pOp);
            if (pOp.equipment) busyEquipment.add(pOp.equipment.use);
          } else {
            remainingParallel.push(pOp);
          }
        } else {
          remainingParallel.push(pOp);
        }
      }
      actualParallelCook = remainingParallel;

      const hasParallel = scheduledParallel.length > 0;
      phases.push({
        name: hasParallel
          ? `${capitalize(op.action)} + Parallel`
          : capitalize(op.action),
        type: "simmer",
        time: op.time,
        operations: [op],
        parallel: hasParallel,
        ...(hasParallel ? { parallelOps: scheduledParallel } : {}),
      });
    } else {
      currentCookGroup.push(op);
    }
  }
  flushCookGroup();

  // Any remaining parallel cook ops get their own phase
  for (const pOp of actualParallelCook) {
    phases.push({
      name: capitalize(pOp.action),
      type: "cook",
      time: pOp.time,
      operations: [pOp],
      parallel: false,
    });
  }

  // Any remaining deferred prep that didn't fit into idle windows
  if (deferredQueue.length > 0) {
    phases.push({
      name: "Remaining Prep",
      type: "prep",
      time: deferredQueue.reduce((sum, op) => sum + op.time, 0),
      operations: deferredQueue,
      parallel: false,
    });
  }

  // FINISH phase
  if (finishSteps.length > 0) {
    phases.push({
      name: "Finish",
      type: "finish",
      time: finishSteps.reduce((sum, s) => sum + (s.time || 1), 0),
      operations: finishSteps,
      parallel: false,
    });
  }

  return phases;
}

// ---------------------------------------------------------------------------
// computeTotalTime
// ---------------------------------------------------------------------------

/**
 * Calculate total time from a phase list. Parallel operations within a phase
 * run concurrently with the main operations, so only the longer duration
 * counts for that phase.
 *
 * @param {Array<{time: number, parallel?: boolean, parallelOps?: object[]}>} phases
 * @returns {number} Total time in minutes.
 */
export function computeTotalTime(phases) {
  let total = 0;
  for (const phase of phases) {
    if (phase.parallel && phase.parallelOps && phase.parallelOps.length > 0) {
      // The main phase time already covers the window; parallel ops fit inside
      // it, so we just take the phase time (the max of main vs parallel).
      const parallelTime = phase.parallelOps.reduce(
        (sum, op) => sum + (op.time || 0),
        0
      );
      total += Math.max(phase.time, parallelTime);
    } else {
      total += phase.time;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Self-test when run directly
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const sampleRecipe = {
    meta: {
      title: "Spaghetti Bolognese",
      slug: "spaghetti-bolognese",
      servings: 4,
      totalTime: { relaxed: 55, optimized: 43 },
    },
    ingredients: [
      { id: "onion", name: "Onion", quantity: 1, unit: "whole", group: "vegetables" },
      { id: "garlic", name: "Garlic", quantity: 3, unit: "cloves", group: "vegetables" },
      { id: "mince", name: "Beef mince", quantity: 500, unit: "g", group: "meat" },
      { id: "tomatoes", name: "Crushed tomatoes", quantity: 400, unit: "g", group: "canned" },
      { id: "spaghetti", name: "Spaghetti", quantity: 400, unit: "g", group: "pasta" },
      { id: "parmesan", name: "Parmesan", quantity: 50, unit: "g", group: "dairy" },
    ],
    equipment: [
      { id: "large-pan", name: "Large pan", count: 1 },
      { id: "large-pot", name: "Large pot", count: 1 },
      { id: "cutting-board", name: "Cutting board", count: 1 },
      { id: "grater", name: "Grater", count: 1 },
    ],
    operations: [
      {
        id: "dice-onion", type: "prep", action: "dice",
        inputs: ["onion"],
        equipment: { use: "cutting-board", release: true },
        time: 3, activeTime: 3,
      },
      {
        id: "mince-garlic", type: "prep", action: "mince",
        inputs: ["garlic"],
        equipment: { use: "cutting-board", release: true },
        time: 2, activeTime: 2,
      },
      {
        id: "saute-veg", type: "cook", action: "saut\u00e9",
        inputs: ["dice-onion", "mince-garlic"],
        equipment: { use: "large-pan", release: false },
        time: 5, activeTime: 5, heat: "medium",
      },
      {
        id: "brown-mince", type: "cook", action: "brown",
        inputs: ["saute-veg", "mince"],
        equipment: { use: "large-pan", release: false },
        time: 8, activeTime: 8, heat: "medium-high",
      },
      {
        id: "simmer-sauce", type: "cook", action: "simmer",
        inputs: ["brown-mince", "tomatoes"],
        equipment: { use: "large-pan", release: true },
        time: 20, activeTime: 0, scalable: false, heat: "low",
        output: "sauce",
      },
      {
        id: "boil-pasta", type: "cook", action: "boil",
        inputs: ["spaghetti"],
        equipment: { use: "large-pot", release: true },
        time: 8, activeTime: 1, heat: "high",
        output: "pasta",
      },
      {
        id: "grate-parmesan", type: "prep", action: "grate",
        inputs: ["parmesan"],
        equipment: { use: "grater", release: true },
        time: 2, activeTime: 2,
      },
    ],
    finishSteps: [
      { action: "drain", inputs: ["boil-pasta"], details: "Reserve a cup of pasta water" },
      { action: "toss", inputs: ["simmer-sauce", "boil-pasta"], details: "Combine in the pan" },
      { action: "top", inputs: ["grate-parmesan"], details: "Serve immediately" },
    ],
  };

  console.log("=== Recipe Optimize Self-Test ===\n");

  // Validate DAG
  const validation = validateDag(sampleRecipe);
  console.log("validateDag:", validation.valid ? "PASS (valid)" : "FAIL");
  if (!validation.valid) console.log("  errors:", validation.errors);

  // Relaxed schedule
  const relaxed = computeSchedule(sampleRecipe, "relaxed");
  const relaxedTime = computeTotalTime(relaxed);
  console.log(`\nRelaxed schedule (${relaxedTime} min):`);
  for (const phase of relaxed) {
    const ops = phase.operations.map((o) => o.id || o.action).join(", ");
    console.log(`  [${phase.type}] ${phase.name} — ${phase.time} min (${ops})`);
  }

  // Optimized schedule
  const optimized = computeSchedule(sampleRecipe, "optimized");
  const optimizedTime = computeTotalTime(optimized);
  console.log(`\nOptimized schedule (${optimizedTime} min):`);
  for (const phase of optimized) {
    const ops = phase.operations.map((o) => o.id || o.action).join(", ");
    const parallel =
      phase.parallel && phase.parallelOps
        ? ` | parallel: ${phase.parallelOps.map((o) => o.id || o.action).join(", ")}`
        : "";
    console.log(
      `  [${phase.type}] ${phase.name} — ${phase.time} min (${ops}${parallel})`
    );
  }

  // Resolve ingredients
  const sauteOp = sampleRecipe.operations.find((o) => o.id === "saute-veg");
  const sauteIngredients = resolveIngredients(sauteOp, sampleRecipe);
  console.log(
    `\nIngredients for saute-veg: ${sauteIngredients.map((i) => i.name).join(", ")}`
  );

  // Basic assertions
  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      passed++;
    } else {
      failed++;
      console.log(`  FAIL: ${label}`);
    }
  }

  console.log("\n--- Assertions ---");
  assert(validation.valid === true, "DAG should be valid");
  assert(relaxedTime > optimizedTime, "Optimized should be shorter than relaxed");
  assert(
    relaxed[0].type === "prep" && relaxed[0].operations.length === 3,
    "Relaxed should have all 3 prep ops in first phase"
  );
  assert(
    optimized[0].type === "prep" && optimized[0].operations.length === 2,
    "Optimized should only have 2 early prep ops (dice-onion, mince-garlic)"
  );
  assert(
    optimized.some((p) => p.parallel && p.parallelOps && p.parallelOps.length > 0),
    "Optimized should have at least one phase with parallel ops"
  );
  assert(
    sauteIngredients.length === 2,
    "saute-veg should resolve to 2 ingredients (onion, garlic)"
  );
  assert(
    sauteIngredients.some((i) => i.id === "onion") &&
      sauteIngredients.some((i) => i.id === "garlic"),
    "saute-veg ingredients should be onion and garlic"
  );

  // Test cycle detection
  const cyclicRecipe = {
    ingredients: [{ id: "a", name: "A" }],
    equipment: [],
    operations: [
      { id: "op1", type: "prep", inputs: ["op2"], time: 1 },
      { id: "op2", type: "prep", inputs: ["op1"], time: 1 },
    ],
    finishSteps: [],
  };
  const cyclicResult = validateDag(cyclicRecipe);
  assert(cyclicResult.valid === false, "Cyclic DAG should be invalid");
  assert(
    cyclicResult.errors.some((e) => e.includes("Cycle")),
    "Should report cycle error"
  );

  // Test unresolved reference
  const unresolvedRecipe = {
    ingredients: [{ id: "a", name: "A" }],
    equipment: [],
    operations: [
      { id: "op1", type: "prep", inputs: ["nonexistent"], time: 1 },
    ],
    finishSteps: [],
  };
  const unresolvedResult = validateDag(unresolvedRecipe);
  assert(unresolvedResult.valid === false, "Unresolved ref should be invalid");

  console.log(`\n${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
  console.log("\nAll tests passed.");
}
