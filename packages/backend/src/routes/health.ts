import { OpenAPIHono } from "@hono/zod-openapi";

export const healthRouter = new OpenAPIHono();

healthRouter.get("/health", (c) => {
  return c.json({
    status: "healthy",
    service: "template-api",
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/", (c) => {
  return c.json({
    status: "healthy",
    service: "template-api",
  });
});
