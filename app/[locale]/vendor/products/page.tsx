import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { VendorProductsClient } from "@/components/vendor/vendor-products-client";

export default async function VendorProductsPage() {
  const session = await auth();
  const t = await getTranslations("Vendor.products");

  if (!session || session.user.role !== "vendor") {
    redirect("/login");
  }

  const vendorProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      isActive: products.isActive,
      images: products.images,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.vendorId, session.user.id))
    .orderBy(products.createdAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-univers text-gray-900" data-testid="vendor-products-title">{t("title")}</h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            {t("description")}
          </p>
        </div>
        <Link href="/vendor/products/new">
          <Button className="bg-black text-white hover:bg-gray-800" data-testid="vendor-add-product">
            <Plus className="h-4 w-4 mr-2" />
            {t("addProduct")}
          </Button>
        </Link>
      </div>

      {/* Products table with bulk operations */}
      <VendorProductsClient products={vendorProducts} vendorId={session.user.id} />
    </div>
  );
}