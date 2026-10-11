/**
 * Giả lập Cloudflare D1 Database sử dụng SQLite thuần (Task C17)
 * Sử dụng node:sqlite (DatabaseSync) có sẵn trong Node.js 22+
 * Hỗ trợ lưu trữ bền vững (Persistent) trên đĩa qua các lần khởi động lại máy chủ!
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { D1Database, D1PreparedStatement, D1Response, D1ExecResult } from '../types.js';

export class LocalD1Database implements D1Database {
  private db: DatabaseSync;

  constructor(dbPath: string = ':memory:', schemaSql?: string) {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(dbPath);
    // Bật chế độ WAL để tăng tốc và an toàn đồng thời
    if (dbPath !== ':memory:') {
      this.db.exec('PRAGMA journal_mode = WAL;');
    }
    this.db.exec('PRAGMA foreign_keys = ON;');
    if (schemaSql) {
      this.db.exec(schemaSql);
    }
  }

  prepare(query: string): D1PreparedStatement {
    return new LocalD1PreparedStatement(this.db, query);
  }

  async exec(query: string): Promise<D1ExecResult> {
    const start = Date.now();
    this.db.exec(query);
    return {
      count: 1,
      duration: Date.now() - start,
    };
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Response<T>[]> {
    const responses: D1Response<T>[] = [];
    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const stmt of statements) {
        const res = await stmt.run<T>();
        if (res && res.success === false) {
          throw new Error(res.error || 'D1 Batch Statement Failed');
        }
        responses.push(res);
      }
      this.db.exec('COMMIT;');
      return responses;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {}
      throw err;
    }
  }

  close(): void {
    this.db.close();
  }
}

class LocalD1PreparedStatement implements D1PreparedStatement {
  private boundValues: unknown[] = [];

  constructor(private db: DatabaseSync, private query: string) {}

  bind(...values: unknown[]): D1PreparedStatement {
    const next = new LocalD1PreparedStatement(this.db, this.query);
    next.boundValues = values.map((v) => (v === undefined ? null : v));
    return next;
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    try {
      const stmt = this.db.prepare(this.query);
      const row = stmt.get(...(this.boundValues as any)) as Record<string, unknown> | undefined;
      if (!row) return null;
      if (colName) return (row[colName] as T) ?? null;
      return row as T;
    } catch (err: any) {
      throw new Error(`D1 Query Error: ${err.message} [SQL: ${this.query}]`);
    }
  }

  async all<T = unknown>(): Promise<D1Response<T>> {
    try {
      const stmt = this.db.prepare(this.query);
      const rows = stmt.all(...(this.boundValues as any)) as T[];
      return {
        success: true,
        results: rows,
        meta: {
          changes: 0,
        },
      };
    } catch (err: any) {
      throw new Error(`D1 Query Error: ${err.message} [SQL: ${this.query}]`);
    }
  }

  async run<T = unknown>(): Promise<D1Response<T>> {
    try {
      const stmt = this.db.prepare(this.query);
      const result = stmt.run(...(this.boundValues as any));
      return {
        success: true,
        meta: {
          changes: Number(result.changes),
          last_row_id: Number(result.lastInsertRowid),
        },
      };
    } catch (err: any) {
      throw new Error(`D1 Execution Error: ${err.message} [SQL: ${this.query}]`);
    }
  }
}
