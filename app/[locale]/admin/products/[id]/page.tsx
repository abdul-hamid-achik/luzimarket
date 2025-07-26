import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products, vendors, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Check, 
  X, 
  Edit, 
  Package, 
  DollarSign, 
  Tag, 
  Store,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { toggleProductStatus } from "@/lib/actions/admin-actions";
import { getTranslations } from "next-intl/server";

async function getProduct(id: string) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      stock: products.stock,
      isActive: products.isActive,
      images: products.images,
      tags: products.tags,
      weight: products.weight,
      length: products.length,
      width: products.width,
      height: products.height,
      shippingClass: products.shippingClass,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      vendorId: products.vendorId,
      vendor: {
        id: vendors.id,
        businessName: vendors.businessName,
        email: vendors.email,
        isActive: vendors.isActive,
      },
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(products)
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);

  return product;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const session = await auth();
  const { id, locale } = await params;
  const t = await getTranslations("Admin.productDetail");
  
  if (!session || (session.user.role !== "admin" && session.user.role !== "vendor")) {
    redirect("/login");
  }

  const product = await getProduct(id);
  
  if (!product) {
    notFound();
  }

  // Check if vendor can access this product
  if (session.user.role === "vendor" && product.vendorId !== session.user.id) {
    redirect("/vendor/products");
  }

  const isAdmin = session.user.role === "admin";
  const images = product.images as string[] || [];
  const tags = product.tags as string[] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={isAdmin ? "/admin/products" : "/vendor/products"}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-univers text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-600 font-univers mt-1">
              ID: {product.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={product.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {product.isActive ? t("active") : t("inactive")}
          </Badge>
          
          {isAdmin && (
            <form action={async () => {
                "use server";
                await toggleProductStatus(product.id, product.isActive || false);
              }}>
              <Button
                type="submit"
                variant={product.isActive ? "destructive" : "default"}
                className={!product.isActive ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {product.isActive ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    {t("deactivate")}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t("approve")}
                  </>
                )}
              </Button>
            </form>
          )}
          
          {session.user.role === "vendor" && (
            <Link href={`/vendor/products/${product.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                {t("edit")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>{t("images")}</CardTitle>
            </CardHeader>
            <CardContent>
              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">{t("noImages")}</p>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t("description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {product.description || t("noDescription")}
              </p>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("shippingInfo")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t("weight")}</p>
                  <p className="font-univers">{product.weight || 0}g</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("dimensions")}</p>
                  <p className="font-univers">
                    {product.length || 0} × {product.width || 0} × {product.height || 0} cm
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("shippingClass")}</p>
                  <p className="font-univers capitalize">{product.shippingClass || "standard"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("productInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">{t("price")}</p>
                  <p className="text-xl font-univers font-semibold">
                    ${Number(product.price).toLocaleString('es-MX')} MXN
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">{t("stock")}</p>
                  <p className="text-lg font-univers">
                    {product.stock || 0} {t("units")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">{t("category")}</p>
                  <p className="font-univers">{product.category?.name || "-"}</p>
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">{t("tags")}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Info (for admin) */}
          {isAdmin && product.vendor && (
            <Card>
              <CardHeader>
                <CardTitle>{t("vendorInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{t("vendor")}</p>
                    <Link 
                      href={`/admin/vendors/${product.vendor.id}`}
                      className="font-univers text-blue-600 hover:underline"
                    >
                      {product.vendor.businessName}
                    </Link>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">{t("vendorEmail")}</p>
                  <p className="font-univers text-sm">{product.vendor.email}</p>
                </div>
                
                <Badge className={product.vendor.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {product.vendor.isActive ? t("vendorActive") : t("vendorInactive")}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {product.isActive && (
                <Link href={`/products/${product.slug}`} target="_blank">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("viewPublic")}
                  </Button>
                </Link>
              )}
              
              {!product.isActive && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      {isAdmin ? t("pendingApproval") : t("awaitingApproval")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>{t("timestamps")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">{t("created")}</p>
                <p className="font-univers">
                  {new Date(product.createdAt!).toLocaleString('es-MX')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">{t("updated")}</p>
                <p className="font-univers">
                  {new Date(product.updatedAt!).toLocaleString('es-MX')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}