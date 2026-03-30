/**
 * Lightweight Result type for domain operations.
 *
 * Avoids throwing exceptions for expected domain failures (validation errors,
 * business rule violations). Keeps error handling explicit and composable.
 *
 * Usage:
 * ```typescript
 * function createWidgetName(value: string): Result<WidgetName, string> {
 *   if (value.length < 1) return Err("Name is required");
 *   return Ok(value as WidgetName);
 * }
 *
 * const result = createWidgetName(input);
 * if (!result.ok) return c.json(errorResponse(result.error), 400);
 * const name = result.value;
 * ```
 */

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
