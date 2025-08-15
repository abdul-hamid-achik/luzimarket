import { db } from "@/db";
import { products, vendors, categories } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { AdminProductsClient } from "./admin-products-client";

async function getProducts() {
  const productList = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      isActive: products.isActive,
      images: products.images,
      createdAt: products.createdAt,
      vendorName: vendors.businessName,
      vendorId: vendors.id,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));

  return productList;
}

export default async function AdminProductsPage() {
  const productList = await getProducts();
  const t = await getTranslations("Admin.productsPage");

  return <AdminProductsClient products={productList} translations={{
    title: t("title"),
    subtitle: t("subtitle"),
    pendingApproval: t("pendingApproval"),
    allProducts: t("allProducts"),
    bulkActions: t("bulkActions"),
    approveSelected: t("approveSelected"),
    rejectSelected: t("rejectSelected"),
    deleteSelected: t("deleteSelected"),
    selected: t("selected"),
    selectAll: t("selectAll"),
    deselectAll: t("deselectAll"),
    product: t("product"),
    vendor: t("Vendor"),
    category: t("category"),
    price: t("price"),
    stock: t("stock"),
    status: t("status"),
    actions: t("actions"),
    active: t("active"),
    inactive: t("inactive"),
    approve: t("approve"),
    deactivate: t("deactivate"),
    view: t("view"),
    noProducts: t("noProducts"),
    noProductsSelected: t("noProductsSelected"),
    bulkActionSuccess: t("bulkActionSuccess"),
    bulkActionError: t("bulkActionError"),
    totalProducts: t("totalProducts"),
    activeProducts: t("activeProducts"),
    pendingProducts: t("pendingProducts"),
    withStock: t("withStock"),
  }} />;
}