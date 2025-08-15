import { db } from "@/db";
import { vendors, products, orders, orderItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import SubmitButton from "@/components/ui/submit-button";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Globe, Instagram, Facebook, Twitter } from "lucide-react";
import { revalidatePath } from "next/cache";

async function toggleVendorStatus(vendorId: string, currentStatus: boolean) {
  "use server";

  await db
    .update(vendors)
    .set({ isActive: !currentStatus })
    .where(eq(vendors.id, vendorId));

  revalidatePath(`/admin/vendors/${vendorId}`);
}

export default async function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Admin.vendorsPage");

  // Fetch vendor details
  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, id))
    .limit(1);

  if (!vendor.length) {
    notFound();
  }

  const vendorData = vendor[0];

  // Fetch vendor stats
  const stats = await db
    .select({
      productCount: sql<number>`COUNT(DISTINCT ${products.id})`,
      orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
      totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
    })
    .from(vendors)
    .leftJoin(products, eq(products.vendorId, vendors.id))
    .leftJoin(orders, eq(orders.vendorId, vendors.id))
    .where(eq(vendors.id, id))
    .groupBy(vendors.id);

  const vendorStats = stats[0] || { productCount: 0, orderCount: 0, totalRevenue: 0 };

  // Fetch recent products
  const recentProducts = await db
    .select()
    .from(products)
    .where(eq(products.vendorId, id))
    .orderBy(products.createdAt)
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-univers text-gray-900">
            {vendorData.businessName}
          </h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            {t("vendorDetails")}
          </p>
        </div>
        <Link href="/admin/vendors">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToVendors")}
          </Button>
        </Link>
      </div>

      {/* Status and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${vendorData.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              }`}>
              <span className={`mr-1.5 h-2 w-2 rounded-full ${vendorData.isActive ? 'bg-green-400' : 'bg-red-400'
                }`} />
              {vendorData.isActive ? t("vendorStatus.active") : t("vendorStatus.inactive")}
            </span>
          </div>
          <form action={toggleVendorStatus.bind(null, vendorData.id, vendorData.isActive || false)}>
            <SubmitButton
              type="submit"
              variant={vendorData.isActive ? "destructive" : "default"}
              pendingText={vendorData.isActive ? t("deactivate") : t("activate")}
            >
              {vendorData.isActive ? t("deactivate") : t("activate")}
            </SubmitButton>
          </form>
        </div>
      </div>

      {/* Business Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{t("businessInfo")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">{t("businessName")}</p>
            <p className="mt-1 text-sm text-gray-900">{vendorData.businessName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t("contactName")}</p>
            <p className="mt-1 text-sm text-gray-900">{vendorData.contactName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t("email")}</p>
            <p className="mt-1 text-sm text-gray-900">{vendorData.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t("phone")}</p>
            <p className="mt-1 text-sm text-gray-900">{vendorData.phone}</p>
          </div>
          {vendorData.whatsapp && (
            <div>
              <p className="text-sm font-medium text-gray-500">WhatsApp</p>
              <p className="mt-1 text-sm text-gray-900">{vendorData.whatsapp}</p>
            </div>
          )}
          {vendorData.websiteUrl && (
            <div>
              <p className="text-sm font-medium text-gray-500">{t("website")}</p>
              <a
                href={vendorData.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-blue-600 hover:text-blue-500 flex items-center"
              >
                <Globe className="h-4 w-4 mr-1" />
                {vendorData.websiteUrl}
              </a>
            </div>
          )}
        </div>
        {vendorData.description && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-500">{t("description")}</p>
            <p className="mt-1 text-sm text-gray-900">{vendorData.description}</p>
          </div>
        )}
      </div>

      {/* Address */}
      {(vendorData.street || vendorData.city || vendorData.state) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t("address")}</h2>
          <div className="text-sm text-gray-600">
            {vendorData.street && <p>{vendorData.street}</p>}
            {(vendorData.city || vendorData.state || vendorData.postalCode) && (
              <p>
                {[vendorData.city, vendorData.state, vendorData.postalCode].filter(Boolean).join(", ")}
              </p>
            )}
            {vendorData.country && <p>{vendorData.country}</p>}
          </div>
        </div>
      )}

      {/* Social Media */}
      {(vendorData.instagramUrl || vendorData.facebookUrl || vendorData.twitterUrl || vendorData.tiktokUrl) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t("socialMedia")}</h2>
          <div className="flex space-x-4">
            {vendorData.instagramUrl && (
              <a
                href={vendorData.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-500"
              >
                <Instagram className="h-6 w-6" />
              </a>
            )}
            {vendorData.facebookUrl && (
              <a
                href={vendorData.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-500"
              >
                <Facebook className="h-6 w-6" />
              </a>
            )}
            {vendorData.twitterUrl && (
              <a
                href={vendorData.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-500"
              >
                <Twitter className="h-6 w-6" />
              </a>
            )}
            {vendorData.tiktokUrl && (
              <a
                href={vendorData.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Performance Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{t("performance")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">{t("totalProducts")}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{vendorStats.productCount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t("totalOrders")}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{vendorStats.orderCount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t("totalRevenue")}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              ${Number(vendorStats.totalRevenue).toLocaleString("es-MX")}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Products */}
      {recentProducts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {recentProducts.map((product) => (
              <div key={product.id} className="space-y-2">
                {product.images?.[0] && (
                  <div className="relative w-full h-32">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-sm text-gray-500">
                  ${Number(product.price).toLocaleString("es-MX")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}