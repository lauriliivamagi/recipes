import type { Context } from "hono";
import { z } from "zod";

const HelloRequestSchema = z.object({
  name: z.string().min(1).max(100),
});

/**
 * Example Vertical Slice handler.
 *
 * Pattern: Each feature has a Handler class with an execute() method.
 * The handler owns its validation, business logic, and response formatting.
 *
 * To add a new feature:
 * 1. Create a new directory under contexts/<context>/features/<feature>/
 * 2. Add a Handler class with execute(c: Context)
 * 3. Add an index.ts with a factory function
 * 4. Wire it up in the appropriate route file
 */
export class HelloHandler {
  async execute(c: Context): Promise<Response> {
    const body = await c.req.json();
    const result = HelloRequestSchema.safeParse(body);

    if (!result.success) {
      return c.json({ success: false, error: result.error.message }, 400);
    }

    return c.json({
      success: true,
      data: { message: `Hello, ${result.data.name}!` },
    });
  }
}
