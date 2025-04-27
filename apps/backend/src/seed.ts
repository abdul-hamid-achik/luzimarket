import dotenv from 'dotenv';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { categories, products } from '@/schema';

dotenv.config();

async function main() {
  try {
    // Ensure a test category exists
    const existingCats = await db
      .select()
      .from(categories)
      .where(eq(categories.name, 'Test Category'));
    let catId: number;
    if (existingCats.length > 0) {
      catId = existingCats[0].id;
    } else {
      const [cat] = await db
        .insert(categories)
        .values({ name: 'Test Category' })
        .returning();
      catId = cat.id;
    }

    // Ensure a test product exists
    const existingProds = await db
      .select()
      .from(products)
      .where(eq(products.name, 'Test Product'));
    if (existingProds.length === 0) {
      await db.insert(products).values({
        name: 'Test Product',
        description: 'A product for E2E testing',
        price: '9.99',
        categoryId: catId,
        imageUrl: 'https://via.placeholder.com/150',
      });
    }
    console.log('Seed completed');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    process.exit(0);
  }
}

main();