import { DatabaseSync } from 'node:sqlite';
import type { Db, Statement } from '../db';

/** D1's API over an in-memory SQLite, for tests. D1 is SQLite, so the SQL is the same. */
export function memoryDb(): Db {
  const sql = new DatabaseSync(':memory:');
  const statement = (query: string, args: (string | number | null)[] = []): Statement => ({
    bind: (...values) => statement(query, values),
    first: async <T>() => (sql.prepare(query).get(...args) ?? null) as T | null,
    all: async <T>() => ({ results: sql.prepare(query).all(...args) as T[] }),
    run: async () => sql.prepare(query).run(...args),
  });
  return {
    prepare: (query) => statement(query),
    async batch(statements) {
      sql.exec('BEGIN');
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sql.exec('COMMIT');
        return out;
      } catch (error) {
        sql.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
