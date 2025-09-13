import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MapPin, Star, Package, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/db";
import { vendors, products, reviews } from "@/db/schema";
import { eq, and, desc, avg, count, like, or } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Vendors | LuziMarket",
  description: "Discover local vendors and businesses on LuziMarket",
};

interface VendorsPageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    state?: string;
  }>;
}

async function getVendors(searchParams: Awaited<VendorsPageProps['searchParams']>) {
  const { q, city, state } = searchParams;

  const conditions = [eq(vendors.isActive, true)];

  // Add search filters
  if (q) {
    const searchCondition = or(
      like(vendors.businessName, `%${q}%`),
      like(vendors.description, `%${q}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (city) {
    conditions.push(like(vendors.city, `%${city}%`));
  }

  if (state) {
    conditions.push(like(vendors.state, `%${state}%`));
  }

  const vendorsList = await db.query.vendors.findMany({
    where: and(...conditions),
    orderBy: [desc(vendors.createdAt)],
    limit: 24,
  });

  // Get stats for each vendor
  const vendorsWithStats = await Promise.all(
    vendorsList.map(async (vendor) => {
      const stats = await db
        .select({
          totalProducts: count(products.id),
          avgRating: avg(reviews.rating),
          totalReviews: count(reviews.id),
        })
        .from(products)
        .leftJoin(reviews, eq(reviews.productId, products.id))
        .where(and(eq(products.vendorId, vendor.id), eq(products.isActive, true)))
        .groupBy(products.vendorId)
        .then(result => result[0] || { totalProducts: 0, avgRating: null, totalReviews: 0 });

      return { ...vendor, stats };
    })
  );

  return vendorsWithStats;
}

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations("Vendors");
  const vendorsList = await getVendors(resolvedSearchParams);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 font-univers">
              Our Vendors
            </h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              Discover amazing local businesses and vendors
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-md mx-auto">
            <form method="GET" className="flex gap-2">
              <Input
                type="search"
                name="q"
                placeholder="Search vendors..."
                defaultValue={resolvedSearchParams.q}
                className="flex-1"
              />
            </form>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {vendorsList.length}+
                </div>
                <div className="text-sm text-gray-600">Active Vendors</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {vendorsList.reduce((acc, v) => acc + v.stats.totalProducts, 0)}+
                </div>
                <div className="text-sm text-gray-600">Products Available</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {(vendorsList
                    .filter(v => v.stats.avgRating)
                    .reduce((acc, v) => acc + Number(v.stats.avgRating), 0) /
                    vendorsList.filter(v => v.stats.avgRating).length || 0
                  ).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="text-center py-8">Loading vendors...</div>}>
          {vendorsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vendorsList.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/vendors/${vendor.slug}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      {/* Vendor Name */}
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                        {vendor.businessName}
                      </h3>

                      {/* Description */}
                      {vendor.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {vendor.description}
                        </p>
                      )}

                      {/* Location */}
                      {(vendor.city || vendor.state) && (
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {vendor.stats.totalProducts}
                          </div>
                          <div className="text-xs text-gray-600">Products</div>
                        </div>
                        {vendor.stats.avgRating && (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-lg font-semibold text-gray-900">
                                {Number(vendor.stats.avgRating).toFixed(1)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              ({vendor.stats.totalReviews} reviews)
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Services */}
                      <div className="flex flex-wrap gap-1">
                        {vendor.hasDelivery && (
                          <Badge variant="secondary" className="text-xs">
                            Delivery
                          </Badge>
                        )}
                        {vendor.websiteUrl && (
                          <Badge variant="outline" className="text-xs">
                            Website
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No vendors found
              </h3>
              <p className="text-gray-600">
                {resolvedSearchParams.q
                  ? "Try adjusting your search terms"
                  : "We're working on adding more vendors to the platform"
                }
              </p>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}