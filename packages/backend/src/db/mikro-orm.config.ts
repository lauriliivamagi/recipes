import { BetterSqliteDriver } from "@mikro-orm/better-sqlite";
import type { Options } from "@mikro-orm/core";
import { Widget, Gadget } from "../contexts/example/entities/Widget.js";

/**
 * Create MikroORM configuration.
 * Uses BetterSQLite for local development.
 * Swap driver for production (e.g., @mikro-orm/libsql for Turso).
 */
export function createOrmConfig(): Options {
  const dbUrl = process.env.DATABASE_URL || "file:./data/app.db";
  const dbPath = dbUrl.replace("file:", "");

  return {
    driver: BetterSqliteDriver,
    dbName: dbPath,
    entities: [Widget, Gadget],
    debug: process.env.NODE_ENV === "development",
    migrations: {
      path: "./src/db/migrations",
      pathTs: "./src/db/migrations",
    },
  };
}
