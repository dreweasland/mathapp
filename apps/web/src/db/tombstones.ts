import { rowKey, type SyncTable } from '@mathapp/engine';
import type { AppDb } from './db';

/**
 * Deletes rows and leaves a marker for each, so sync deletes them on the family's other
 * devices too. Call inside a transaction that includes `db.tombstones`.
 */
export async function deleteRows(db: AppDb, table: SyncTable, rows: object[], at: number) {
  if (rows.length === 0) return;
  const keys = rows.map((row) => rowKey(table, row));
  await db.tombstones.bulkPut(
    keys.map((key) => ({ id: `${table}|${key}`, table, key, updatedAt: at })),
  );
  await db.table(table).bulkDelete(
    keys.map((key) => {
      const parts = JSON.parse(key) as (string | number)[];
      return parts.length === 1 ? parts[0] : parts;
    }) as never[],
  );
}
