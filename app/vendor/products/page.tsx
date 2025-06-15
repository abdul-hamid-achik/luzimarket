import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, EyeOff } from "lucide-react";

export default async function VendorProductsPage() {
  const session = await auth();
  
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
          <h1 className="text-2xl font-univers text-gray-900">Mis Productos</h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            Administra tu catálogo de productos
          </p>
        </div>
        <Link href="/vendor/products/new">
          <Button className="bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        </Link>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {vendorProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-univers mb-4">
              No tienes productos aún
            </p>
            <Link href="/vendor/products/new">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar tu primer producto
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendorProducts.map((product) => {
                  const images = product.images as string[] || [];
                  return (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 relative bg-gray-100 rounded">
                            {images[0] && (
                              <Image
                                src={images[0]}
                                alt={product.name}
                                fill
                                className="object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-univers font-medium text-gray-900">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-univers">
                          {product.categoryName || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-univers">
                          ${Number(product.price).toLocaleString('es-MX')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-univers ${
                          product.stock > 0 ? 'text-gray-900' : 'text-red-600'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-univers ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <span className={`mr-1.5 h-2 w-2 rounded-full ${
                            product.isActive ? 'bg-green-400' : 'bg-gray-400'
                          }`} />
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-univers">
                        <div className="flex items-center gap-2">
                          <Link href={`/vendor/products/${product.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <form action={async () => {
                            "use server";
                            const newStatus = !product.isActive;
                            await db
                              .update(products)
                              .set({ isActive: newStatus })
                              .where(eq(products.id, product.id));
                            revalidatePath("/vendor/products");
                          }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="submit"
                            >
                            {product.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}