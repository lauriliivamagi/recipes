import "reflect-metadata";

import { MikroORM, type EntityManager, type IDatabaseDriver } from "@mikro-orm/core";
import { createOrmConfig } from "./mikro-orm.config.js";

let _orm: MikroORM<IDatabaseDriver> | null = null;

/**
 * Initialize MikroORM singleton.
 * Call once at application startup.
 */
export async function initializeOrm(): Promise<MikroORM<IDatabaseDriver>> {
  if (_orm) return _orm;

  const config = createOrmConfig();
  _orm = await MikroORM.init(config);
  return _orm;
}

/**
 * Get the MikroORM instance.
 * Must be called after initializeOrm().
 */
export function getOrm(): MikroORM<IDatabaseDriver> {
  if (!_orm) {
    throw new Error("MikroORM not initialized. Call initializeOrm() first.");
  }
  return _orm;
}

/**
 * Get a forked EntityManager for request isolation.
 */
export function getEntityManager(): EntityManager {
  return getOrm().em.fork();
}

/**
 * Close the MikroORM connection.
 */
export async function closeOrm(): Promise<void> {
  if (_orm) {
    await _orm.close();
    _orm = null;
  }
}

/**
 * Set ORM instance for testing (inject in-memory DB).
 */
export function setTestOrm(orm: MikroORM<IDatabaseDriver> | null): void {
  _orm = orm;
}
