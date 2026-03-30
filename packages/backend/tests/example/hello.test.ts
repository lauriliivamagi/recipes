import { describe, it, expect } from "vitest";
import { createHelloHandler } from "../../src/contexts/example/features/hello/index.js";

describe("HelloHandler", () => {
  const handler = createHelloHandler();

  it("returns greeting for valid name", async () => {
    const mockContext = {
      req: {
        json: async () => ({ name: "World" }),
      },
      json: (data: unknown, status?: number) => {
        return { data, status: status || 200 } as unknown as Response;
      },
    };

    const response = (await handler.execute(mockContext as any)) as any;
    expect(response.data).toEqual({
      success: true,
      data: { message: "Hello, World!" },
    });
  });

  it("returns 400 for missing name", async () => {
    const mockContext = {
      req: {
        json: async () => ({}),
      },
      json: (data: unknown, status?: number) => {
        return { data, status } as unknown as Response;
      },
    };

    const response = (await handler.execute(mockContext as any)) as any;
    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
  });
});
