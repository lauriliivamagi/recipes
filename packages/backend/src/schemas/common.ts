import { z } from "zod";

/**
 * Standard error response schema for API endpoints.
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

/**
 * Standard success response wrapper.
 */
export function successResponse<T>(data: T) {
  return { success: true as const, data };
}

/**
 * Standard error response wrapper.
 */
export function errorResponse(error: string, code?: string) {
  return { success: false as const, error, code };
}
