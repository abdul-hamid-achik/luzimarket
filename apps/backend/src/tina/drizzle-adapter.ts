import { tinaData } from './schema';
import { eq, gt, like } from 'drizzle-orm';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';

export default class DrizzleAdapter {
  private db: ReturnType<typeof drizzlePg>;
  public supports = { list: true, put: true, get: true, delete: true };

  constructor(db: ReturnType<typeof drizzlePg>) {
    this.db = db;
  }

  async get(key: string): Promise<any> {
    const rows = await this.db
      .select()
      .from(tinaData)
      .where(eq(tinaData.key, key))
      .execute();
    const row = rows[0];
    if (!row) {
      throw new Error('NotFound');
    }
    return JSON.parse(row.value);
  }

  async put(key: string, value: any): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.db
      .insert(tinaData)
      .values({ key, value: serialized, updated_at: new Date() })
      .onConflictDoUpdate({
        target: [tinaData.key],
        set: { value: serialized, updated_at: new Date() }
      })
      .execute();
  }

  async delete(key: string): Promise<void> {
    await this.db.delete(tinaData).where(eq(tinaData.key, key)).execute();
  }

  async list(opts: { prefix?: string; limit?: number; cursor?: string }): Promise<{ items: [string, any][]; cursor?: string }> {
    let query = this.db
      .select({ key: tinaData.key, value: tinaData.value })
      .from(tinaData)
      .$dynamic();

    if (opts.prefix) {
      query = query.where(like(tinaData.key, `${opts.prefix}%`));
    }
    if (opts.cursor) {
      query = query.where(gt(tinaData.key, opts.cursor));
    }
    if (opts.limit) {
      query = query.limit(opts.limit);
    }

    query = query.orderBy(tinaData.key);

    const rows = await query.execute();
    const items = rows.map((r: any) => [r.key, JSON.parse(r.value)] as [string, any]);
    const lastCursor = items.length ? items[items.length - 1][0] : undefined;
    return { items, cursor: lastCursor };
  }
}