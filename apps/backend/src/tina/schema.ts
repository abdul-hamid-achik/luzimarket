import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const tinaData = pgTable('tina_data', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});