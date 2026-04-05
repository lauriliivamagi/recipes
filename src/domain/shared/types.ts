// ---------------------------------------------------------------------------
// Shared Kernel — minimal types shared between recipe and schedule contexts
// ---------------------------------------------------------------------------
// Schedule needs the subset of Operation relevant to scheduling + display.
// Recipe's full Operation extends this with optional fields (heat, details).
// IDs are plain strings here — branded IDs are a recipe-context concern.
// ---------------------------------------------------------------------------

/** The subset of an Operation that the scheduler needs. */
export interface SchedulableOperation {
  readonly id: string;
  readonly type: 'prep' | 'cook';
  readonly action: string;
  readonly time: number;
  readonly activeTime: number;
  readonly scalable?: boolean;
  readonly equipment?: { readonly use: string; readonly release: boolean };
  readonly inputs: readonly string[];
  readonly output?: string;
}

// SchedulableFinishStep can be added here when the schedule module
// needs to process finish steps independently of the recipe context.
