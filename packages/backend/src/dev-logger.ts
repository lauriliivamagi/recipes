/**
 * Development Logger for Coding Agent Observability
 *
 * SQLite-based logging system that provides:
 * - Queryable log entries with request correlation
 * - Breadcrumb trails for debugging
 * - State snapshots for XState machines
 * - Agent-friendly query endpoints
 *
 * SECURITY: Only enabled when DEV_LOGGING=true AND not in production mode.
 */

import Database from "better-sqlite3";
import type { Database as BetterSqliteDatabase } from "better-sqlite3";
import { mkdirSync, chmodSync } from "node:fs";

// ============================================================================
// Types
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogCategory = "http" | "xstate" | "service" | "db" | "validation" | "general";

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  data?: Record<string, unknown>;
}

export interface StoredLogEntry extends LogEntry {
  id: number;
  ts: string;
  source: "backend" | "frontend";
}

interface Breadcrumb {
  id?: number;
  ts?: string;
  requestId?: string;
  action: string;
  target: string;
  data?: Record<string, unknown>;
}

interface Snapshot {
  id?: number;
  ts?: string;
  requestId?: string;
  machine: string;
  state: string;
  context: Record<string, unknown>;
  event?: Record<string, unknown>;
}

export interface RequestTrace {
  logs: StoredLogEntry[];
  breadcrumbs: Breadcrumb[];
  snapshots: Snapshot[];
}

export interface QueryOptions {
  level?: LogLevel;
  category?: LogCategory;
  requestId?: string;
  limit?: number;
  offset?: number;
  since?: string;
  until?: string;
}

// ============================================================================
// Security Gate
// ============================================================================

/**
 * Multi-layer security gate to ensure dev logging is NEVER enabled in production.
 *
 * Requirements:
 * 1. DEV_LOGGING must be explicitly "true"
 * 2. NODE_ENV must NOT be "production"
 * 3. Docker production mode must NOT be active
 */
export function isDevLoggingEnabled(): boolean {
  if (process.env.DEV_LOGGING !== "true") return false;
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.DOCKER_ENV === "true" && process.env.DOCKER_PROD === "true") return false;
  return true;
}

// ============================================================================
// DevLogger Class
// ============================================================================

class DevLogger {
  private db: BetterSqliteDatabase | null = null;
  private enabled: boolean;
  private dbPath: string;
  private retentionDays: number;

  constructor() {
    this.enabled = isDevLoggingEnabled();
    this.dbPath = process.env.DEV_LOG_DB || ".dev-logs/logs.db";
    this.retentionDays = parseInt(process.env.DEV_LOG_RETENTION_DAYS || "7");

    if (this.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    try {
      const dir = this.dbPath.substring(0, this.dbPath.lastIndexOf("/"));
      if (dir) {
        try {
          mkdirSync(dir, { recursive: true });
          chmodSync(dir, 0o700);
        } catch {
          // Directory may already exist
        }
      }

      this.db = new Database(this.dbPath);

      try {
        chmodSync(this.dbPath, 0o600);
      } catch {
        // May fail on some systems
      }

      this.initSchema();
      this.cleanupOldEntries();

      console.warn("[dev-logger] DEV LOGGING ENABLED — do not use in production");
      console.info(`[dev-logger] DB path: ${this.dbPath}`);
    } catch (error) {
      console.error("[dev-logger] Failed to initialize:", error);
      this.enabled = false;
    }
  }

  private initSchema(): void {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP,
        level TEXT CHECK(level IN ('debug','info','warn','error')),
        category TEXT,
        message TEXT,
        request_id TEXT,
        trace_id TEXT,
        span_id TEXT,
        data JSON,
        source TEXT DEFAULT 'backend'
      );

      CREATE TABLE IF NOT EXISTS breadcrumbs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP,
        request_id TEXT,
        trace_id TEXT,
        action TEXT,
        target TEXT,
        data JSON
      );

      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP,
        request_id TEXT,
        trace_id TEXT,
        machine TEXT,
        state TEXT,
        context JSON,
        event JSON
      );

      CREATE INDEX IF NOT EXISTS idx_logs_request ON logs(request_id);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
      CREATE INDEX IF NOT EXISTS idx_logs_ts ON logs(ts);
      CREATE INDEX IF NOT EXISTS idx_logs_trace ON logs(trace_id);
      CREATE INDEX IF NOT EXISTS idx_breadcrumbs_request ON breadcrumbs(request_id);
      CREATE INDEX IF NOT EXISTS idx_snapshots_request ON snapshots(request_id);
    `);
  }

  private cleanupOldEntries(): void {
    if (!this.db) return;
    const modifier = `-${this.retentionDays} days`;
    this.db.prepare("DELETE FROM logs WHERE ts < datetime('now', ?)").run(modifier);
    this.db.prepare("DELETE FROM breadcrumbs WHERE ts < datetime('now', ?)").run(modifier);
    this.db.prepare("DELETE FROM snapshots WHERE ts < datetime('now', ?)").run(modifier);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // ============================================================================
  // Logging Methods
  // ============================================================================

  log(entry: LogEntry): void {
    if (!this.enabled || !this.db) return;

    const requestId = entry.requestId;
    const traceId = entry.traceId;
    const spanId = entry.spanId;

    try {
      this.db
        .prepare(
          `INSERT INTO logs (level, category, message, request_id, trace_id, span_id, data)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          entry.level,
          entry.category,
          entry.message,
          requestId || null,
          traceId || null,
          spanId || null,
          entry.data ? JSON.stringify(entry.data) : null
        );
    } catch (error) {
      console.error("[dev-logger] Failed to write log:", error);
    }
  }

  debug(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.log({ level: "debug", category, message, data });
  }

  info(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.log({ level: "info", category, message, data });
  }

  warn(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.log({ level: "warn", category, message, data });
  }

  error(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.log({ level: "error", category, message, data });
  }

  breadcrumb(
    requestId: string | undefined,
    traceId: string | undefined,
    action: string,
    target: string,
    data?: Record<string, unknown>
  ): void {
    if (!this.enabled || !this.db) return;

    try {
      this.db
        .prepare(
          `INSERT INTO breadcrumbs (request_id, trace_id, action, target, data)
         VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          requestId || null,
          traceId || null,
          action,
          target,
          data ? JSON.stringify(data) : null
        );
    } catch (error) {
      console.error("[dev-logger] Failed to write breadcrumb:", error);
    }
  }

  snapshot(
    requestId: string | undefined,
    traceId: string | undefined,
    machine: string,
    state: string,
    context: Record<string, unknown>,
    event?: Record<string, unknown>
  ): void {
    if (!this.enabled || !this.db) return;

    try {
      this.db
        .prepare(
          `INSERT INTO snapshots (request_id, trace_id, machine, state, context, event)
         VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
          requestId || null,
          traceId || null,
          machine,
          state,
          JSON.stringify(context),
          event ? JSON.stringify(event) : null
        );
    } catch (error) {
      console.error("[dev-logger] Failed to write snapshot:", error);
    }
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  query(options: QueryOptions = {}): StoredLogEntry[] {
    if (!this.enabled || !this.db) return [];

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.level) {
      conditions.push("level = ?");
      params.push(options.level);
    }
    if (options.category) {
      conditions.push("category = ?");
      params.push(options.category);
    }
    if (options.requestId) {
      conditions.push("request_id = ?");
      params.push(options.requestId);
    }
    if (options.since) {
      conditions.push("ts >= ?");
      params.push(options.since);
    }
    if (options.until) {
      conditions.push("ts <= ?");
      params.push(options.until);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const allParams = [...params, limit, offset] as (string | number | null | undefined)[];

    try {
      const rows = this.db
        .prepare(`SELECT * FROM logs ${whereClause} ORDER BY ts DESC LIMIT ? OFFSET ?`)
        .all(...allParams) as Record<string, unknown>[];

      return rows.map((row) => ({
        id: row.id as number,
        ts: row.ts as string,
        level: row.level as LogLevel,
        category: row.category as LogCategory,
        message: row.message as string,
        requestId: row.request_id as string | undefined,
        traceId: row.trace_id as string | undefined,
        spanId: row.span_id as string | undefined,
        data: row.data ? JSON.parse(row.data as string) : undefined,
        source: row.source as "backend" | "frontend",
      }));
    } catch (error) {
      console.error("[dev-logger] Failed to query logs:", error);
      return [];
    }
  }

  queryByTraceId(traceId: string, limit = 100): StoredLogEntry[] {
    if (!this.enabled || !this.db) return [];

    try {
      const rows = this.db
        .prepare("SELECT * FROM logs WHERE trace_id = ? ORDER BY ts DESC LIMIT ?")
        .all(traceId, limit) as Record<string, unknown>[];

      return rows.map((row) => ({
        id: row.id as number,
        ts: row.ts as string,
        level: row.level as LogLevel,
        category: row.category as LogCategory,
        message: row.message as string,
        requestId: row.request_id as string | undefined,
        traceId: row.trace_id as string | undefined,
        spanId: row.span_id as string | undefined,
        data: row.data ? JSON.parse(row.data as string) : undefined,
        source: row.source as "backend" | "frontend",
      }));
    } catch (error) {
      console.error("[dev-logger] Failed to query by traceId:", error);
      return [];
    }
  }

  getRequestTrace(requestId: string): RequestTrace {
    if (!this.enabled || !this.db) {
      return { logs: [], breadcrumbs: [], snapshots: [] };
    }

    try {
      const logs = this.query({ requestId, limit: 1000 });

      const breadcrumbRows = this.db
        .prepare("SELECT * FROM breadcrumbs WHERE request_id = ? ORDER BY ts ASC")
        .all(requestId) as Record<string, unknown>[];

      const breadcrumbs: Breadcrumb[] = breadcrumbRows.map((row) => ({
        id: row.id as number,
        ts: row.ts as string,
        requestId: row.request_id as string,
        action: row.action as string,
        target: row.target as string,
        data: row.data ? JSON.parse(row.data as string) : undefined,
      }));

      const snapshotRows = this.db
        .prepare("SELECT * FROM snapshots WHERE request_id = ? ORDER BY ts ASC")
        .all(requestId) as Record<string, unknown>[];

      const snapshots: Snapshot[] = snapshotRows.map((row) => ({
        id: row.id as number,
        ts: row.ts as string,
        requestId: row.request_id as string,
        machine: row.machine as string,
        state: row.state as string,
        context: JSON.parse(row.context as string),
        event: row.event ? JSON.parse(row.event as string) : undefined,
      }));

      return { logs, breadcrumbs, snapshots };
    } catch (error) {
      console.error("[dev-logger] Failed to get request trace:", error);
      return { logs: [], breadcrumbs: [], snapshots: [] };
    }
  }

  getStats(): {
    totalLogs: number;
    totalBreadcrumbs: number;
    totalSnapshots: number;
    errorCount: number;
    uniqueRequests: number;
  } {
    if (!this.enabled || !this.db) {
      return {
        totalLogs: 0,
        totalBreadcrumbs: 0,
        totalSnapshots: 0,
        errorCount: 0,
        uniqueRequests: 0,
      };
    }

    try {
      const logCount = this.db.prepare("SELECT COUNT(*) as count FROM logs").get() as {
        count: number;
      };
      const breadcrumbCount = this.db
        .prepare("SELECT COUNT(*) as count FROM breadcrumbs")
        .get() as { count: number };
      const snapshotCount = this.db.prepare("SELECT COUNT(*) as count FROM snapshots").get() as {
        count: number;
      };
      const errorCount = this.db
        .prepare("SELECT COUNT(*) as count FROM logs WHERE level = 'error'")
        .get() as { count: number };
      const uniqueRequests = this.db
        .prepare(
          "SELECT COUNT(DISTINCT request_id) as count FROM logs WHERE request_id IS NOT NULL"
        )
        .get() as { count: number };

      return {
        totalLogs: logCount.count,
        totalBreadcrumbs: breadcrumbCount.count,
        totalSnapshots: snapshotCount.count,
        errorCount: errorCount.count,
        uniqueRequests: uniqueRequests.count,
      };
    } catch (error) {
      console.error("[dev-logger] Failed to get stats:", error);
      return {
        totalLogs: 0,
        totalBreadcrumbs: 0,
        totalSnapshots: 0,
        errorCount: 0,
        uniqueRequests: 0,
      };
    }
  }

  clear(): void {
    if (!this.enabled || !this.db) return;
    try {
      this.db.prepare("DELETE FROM logs").run();
      this.db.prepare("DELETE FROM breadcrumbs").run();
      this.db.prepare("DELETE FROM snapshots").run();
    } catch (error) {
      console.error("[dev-logger] Failed to clear logs:", error);
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const devLog = new DevLogger();
