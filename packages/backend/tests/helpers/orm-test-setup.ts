import { MikroORM } from "@mikro-orm/core";
import { BetterSqliteDriver } from "@mikro-orm/better-sqlite";
import { setTestOrm } from "../../src/db/orm.js";

let _testOrm: MikroORM | null = null;

/**
 * Set up an in-memory SQLite database for integration tests.
 * Call in beforeAll() of integration test suites.
 */
export async function setupTestOrm(): Promise<MikroORM> {
  _testOrm = await MikroORM.init({
    driver: BetterSqliteDriver,
    dbName: ":memory:",
    entities: [],
    debug: false,
    allowGlobalContext: true,
  });

  const generator = _testOrm.getSchemaGenerator();
  await generator.createSchema();

  setTestOrm(_testOrm);
  return _testOrm;
}

/**
 * Tear down the test database.
 * Call in afterAll() of integration test suites.
 */
export async function teardownTestOrm(): Promise<void> {
  if (_testOrm) {
    await _testOrm.close();
    _testOrm = null;
    setTestOrm(null);
  }
}
