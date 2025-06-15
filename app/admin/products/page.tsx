import { db } from "@/db";
import { products, vendors, categories } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Check, X, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

async function getProducts() {
  const productList = await db
    .select({
      id: products.id,
      name: products.name,
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

async function toggleProductStatus(productId: string, currentStatus: boolean) {
  "use server";
  
  await db
    .update(products)
    .set({ isActive: !currentStatus })
    .where(eq(products.id, productId));
  
  revalidatePath("/admin/products");
}

export default async function AdminProductsPage() {
  const productList = await getProducts();
  const pendingProducts = productList.filter(p => !p.isActive);
  const activeProducts = productList.filter(p => p.isActive);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">Productos</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          Administra y aprueba productos de los vendedores
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">Total productos</p>
          <p className="text-2xl font-univers font-semibold text-gray-900">{productList.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">Activos</p>
          <p className="text-2xl font-univers font-semibold text-green-600">{activeProducts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">Pendientes</p>
          <p className="text-2xl font-univers font-semibold text-yellow-600">{pendingProducts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">Con stock</p>
          <p className="text-2xl font-univers font-semibold text-blue-600">
            {productList.filter(p => p.stock && p.stock > 0).length}
          </p>
        </div>
      </div>

      {/* Pending approvals */}
      {pendingProducts.length > 0 && (
        <div>
          <h2 className="text-lg font-univers text-gray-900 mb-4">
            Pendientes de aprobación ({pendingProducts.length})
          </h2>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                      Vendedor
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
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingProducts.map((product) => {
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
                              <div className="text-xs text-gray-500 font-univers">
                                {new Date(product.createdAt!).toLocaleDateString('es-MX')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/admin/vendors/${product.vendorId}`} className="text-sm text-blue-600 hover:text-blue-800 font-univers">
                            {product.vendorName || '-'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-univers">
                            {product.categoryName || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-univers">
                            ${Number(product.price).toLocaleString('es-MX')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-univers ${
                            product.stock && product.stock > 0 ? 'text-gray-900' : 'text-red-600'
                          }`}>
                            {product.stock || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <form action={toggleProductStatus.bind(null, product.id, product.isActive || false)}>
                              <Button
                                type="submit"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                            </form>
                            <Link href={`/products/${product.id}`} target="_blank">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All products */}
      <div>
        <h2 className="text-lg font-univers text-gray-900 mb-4">
          Todos los productos
        </h2>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
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
                {productList.map((product) => {
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
                        <Link href={`/admin/vendors/${product.vendorId}`} className="text-sm text-blue-600 hover:text-blue-800 font-univers">
                          {product.vendorName || '-'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-univers">
                          {product.categoryName || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-univers">
                          ${Number(product.price).toLocaleString('es-MX')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-univers ${
                          product.stock && product.stock > 0 ? 'text-gray-900' : 'text-red-600'
                        }`}>
                          {product.stock || 0}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <form action={toggleProductStatus.bind(null, product.id, product.isActive || false)}>
                            <Button
                              type="submit"
                              size="sm"
                              variant="ghost"
                              className={product.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                            >
                              {product.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                          </form>
                          <Link href={`/products/${product.id}`} target="_blank">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}