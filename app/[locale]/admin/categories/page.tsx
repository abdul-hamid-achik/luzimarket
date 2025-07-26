import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { CategoriesTable } from "@/components/admin/categories/categories-table";

export default async function CategoriesPage() {
  // Get all categories with product count
  const categoriesWithCount = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      imageUrl: categories.imageUrl,
      isActive: categories.isActive,
      displayOrder: categories.displayOrder,
      productCount: sql<number>`count(${products.id})`,
    })
    .from(categories)
    .leftJoin(products, eq(categories.id, products.categoryId))
    .groupBy(categories.id)
    .orderBy(categories.displayOrder, categories.name);

  return (
    <div className="space-y-6">
      <CategoriesTable categories={categoriesWithCount} />
    </div>
  );
}