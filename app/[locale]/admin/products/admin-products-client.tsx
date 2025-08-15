"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  X,
  Eye,
  CheckSquare,
  Square,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SubmitButton from "@/components/ui/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { bulkUpdateProductStatus } from "@/lib/actions/admin-actions";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number | null;
  isActive: boolean | null;
  images: unknown;
  createdAt: Date | null;
  vendorName: string | null;
  vendorId: string | null;
  categoryName: string | null;
}

interface AdminProductsClientProps {
  products: Product[];
  translations: Record<string, string>;
}

export function AdminProductsClient({ products, translations: t }: AdminProductsClientProps) {
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const pendingProducts = products.filter(p => !p.isActive);
  const activeProducts = products.filter(p => p.isActive);

  const handleSelectAll = (productList: Product[]) => {
    const allIds = new Set(productList.map(p => p.id));
    setSelectedProducts(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedProducts(new Set());
  };

  const handleToggleSelect = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedProducts.size === 0) {
      toast.error(t.noProductsSelected);
      return;
    }

    setIsLoading(true);
    try {
      const productIds = Array.from(selectedProducts);
      const result = await bulkUpdateProductStatus(productIds, action);

      if (result.success) {
        toast.success(result.message || t.bulkActionSuccess);
        setSelectedProducts(new Set());
        router.refresh();
      } else {
        toast.error(result.error || t.bulkActionError);
      }
    } catch (error) {
      toast.error(t.bulkActionError);
    } finally {
      setIsLoading(false);
    }
  };

  const ProductTable = ({ productList, showBulkActions = false }: { productList: Product[], showBulkActions?: boolean }) => (
    <>
      {showBulkActions && selectedProducts.size > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {t.selected}: {selectedProducts.size}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeselectAll}
              disabled={isLoading}
            >
              {t.deselectAll}
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleBulkAction('approve')}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.approveSelected}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction('reject')}
              disabled={isLoading}
            >
              {t.rejectSelected}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {showBulkActions && (
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={productList.every(p => selectedProducts.has(p.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleSelectAll(productList);
                        } else {
                          handleDeselectAll();
                        }
                      }}
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.product}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.vendor}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.category}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.price}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.stock}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productList.map((product) => {
                const images = product.images as string[] || [];
                return (
                  <tr key={product.id}>
                    {showBulkActions && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => handleToggleSelect(product.id)}
                        />
                      </td>
                    )}
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
                          {product.createdAt && (
                            <div className="text-xs text-gray-500 font-univers">
                              {new Date(product.createdAt).toLocaleDateString('es-MX')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.vendorId ? (
                        <Link href={`/admin/vendors/${product.vendorId}`} className="text-sm text-blue-600 hover:text-blue-800 font-univers">
                          {product.vendorName || '-'}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-900 font-univers">-</span>
                      )}
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
                      <span className={`text-sm font-univers ${product.stock && product.stock > 0 ? 'text-gray-900' : 'text-red-600'
                        }`}>
                        {product.stock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={product.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {product.isActive ? t.active : t.inactive}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <form action={async () => {
                          await bulkUpdateProductStatus([product.id], product.isActive ? 'reject' : 'approve');
                          router.refresh();
                        }}>
                          <SubmitButton
                            type="submit"
                            size="sm"
                            variant={product.isActive ? "ghost" : "default"}
                            className={!product.isActive ? "bg-green-600 hover:bg-green-700" : "text-red-600 hover:text-red-700"}
                            pendingChildren={product.isActive ? <X className="h-4 w-4 animate-pulse" /> : <Check className="h-4 w-4 animate-pulse" />}
                          >
                            {product.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </SubmitButton>
                        </form>
                        <Link href={`/admin/products/${product.id}`}>
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
    </>
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">{t.title}</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">{t.totalProducts}</p>
          <p className="text-2xl font-univers font-semibold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">{t.activeProducts}</p>
          <p className="text-2xl font-univers font-semibold text-green-600">{activeProducts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">{t.pendingProducts}</p>
          <p className="text-2xl font-univers font-semibold text-yellow-600">{pendingProducts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">{t.withStock}</p>
          <p className="text-2xl font-univers font-semibold text-blue-600">
            {products.filter(p => p.stock && p.stock > 0).length}
          </p>
        </div>
      </div>

      {/* Pending approvals */}
      {pendingProducts.length > 0 && (
        <div>
          <h2 className="text-lg font-univers text-gray-900 mb-4">
            {t.pendingApproval} ({pendingProducts.length})
          </h2>
          <ProductTable productList={pendingProducts} showBulkActions={true} />
        </div>
      )}

      {/* All products */}
      <div>
        <h2 className="text-lg font-univers text-gray-900 mb-4">
          {t.allProducts}
        </h2>
        <ProductTable productList={products} />
      </div>
    </div>
  );
}