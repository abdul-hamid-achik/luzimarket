import { AbstractLevel } from 'abstract-level';
// Database client type simplified to any for compatibility
import { tinaData } from './schema';
import { eq, gt, like } from 'drizzle-orm';

export default class DrizzleAdapter extends AbstractLevel<string, any> {
  private db: any;

  constructor(db: any) {
    super({
      supports: { list: true, put: true, get: true, delete: true }
    });
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
      .insertInto(tinaData)
      .values({ key, value: serialized })
      .onConflict((oc: any) =>
        oc.column(tinaData.key).doUpdateSet({ value: serialized, updated_at: new Date() })
      )
      .execute();
  }

  async delete(key: string): Promise<void> {
    await this.db.deleteFrom(tinaData).where(eq(tinaData.key, key)).execute();
  }

  async list(opts: { prefix?: string; limit?: number; cursor?: string }): Promise<{ items: [string, any][]; cursor?: string }> {
    let q = this.db
      .select({ key: tinaData.key, value: tinaData.value })
      .from(tinaData)
      .orderBy(tinaData.key);

    if (opts.prefix) {
      q = q.where(like(tinaData.key, `${opts.prefix}%`));
    }
    if (opts.cursor) {
      q = q.where(gt(tinaData.key, opts.cursor));
    }
    if (opts.limit) {
      q = q.limit(opts.limit);
    }

    const rows = await q.execute();
    const items = rows.map((r: any) => [r.key, JSON.parse(r.value)] as [string, any]);
    const lastCursor = items.length ? items[items.length - 1][0] : undefined;
    return { items, cursor: lastCursor };
  }
}