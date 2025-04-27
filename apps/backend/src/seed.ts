import dotenv from 'dotenv';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { categories, products, sales } from '@/schema';
import { Categories } from '@/data/categoriesData';
import { Products } from '@/data/productsData';
import { Sales } from '@/data/salesData';

dotenv.config();

async function main() {
  try {
    // Seed categories
    console.log('Seeding categories...');
    for (const cat of Categories) {
      const exists = await db
        .select()
        .from(categories)
        .where(eq(categories.name, cat.name));
      if (exists.length === 0) {
        await db.insert(categories).values({ name: cat.name }).returning();
      }
    }

    // Map category names to IDs
    const dbCats = await db.select().from(categories);
    const catMap = new Map(dbCats.map((c) => [c.name, c.id]));

    // Seed products
    console.log('Seeding products...');
    for (const p of Products) {
      const catId = catMap.get(p.category);
      if (!catId) {
        console.warn(`Category not found for product: ${p.name}`);
        continue;
      }
      const prodExists = await db
        .select()
        .from(products)
        .where(eq(products.name, p.name));
      if (prodExists.length === 0) {
        await db.insert(products)
          .values({
            name: p.name,
            description: p.description,
            price: p.price.toString(),
            categoryId: catId,
            imageUrl: p.imageUrl,
          })
          .returning();
      }
    }

    // Seed sales data
    console.log('Seeding sales data...');
    for (const entry of Sales) {
      const dateObj = new Date(entry.date);
      const saleExists = await db
        .select()
        .from(sales)
        .where(eq(sales.date, dateObj));
      if (saleExists.length === 0) {
        await db.insert(sales)
          .values({ date: dateObj, amount: entry.May })
          .returning();
      }
    }
    console.log('Seed completed');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    process.exit(0);
  }
}

main();