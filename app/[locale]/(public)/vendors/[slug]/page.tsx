import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Globe, Clock, Star, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductsGrid } from "@/components/products/products-grid";
import { SocialShare } from "@/components/products/social-share";
import { db } from "@/db";
import { vendors, products, reviews } from "@/db/schema";
import { eq, and, desc, avg, count, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

interface VendorPageProps {
  params: {
    locale: string;
    slug: string;
  };
}

async function getVendorData(slug: string) {
  const vendor = await db.query.vendors.findFirst({
    where: and(eq(vendors.slug, slug), eq(vendors.isActive, true)),
    with: {
      products: {
        where: eq(products.isActive, true),
        limit: 12,
        orderBy: [desc(products.createdAt)],
        with: {
          category: true,
          reviews: {
            columns: {
              rating: true,
            },
          },
        },
      },
    },
  });

  if (!vendor) return null;

  // Get vendor stats
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

  return { vendor, stats };
}

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const data = await getVendorData(params.slug);
  
  if (!data) {
    return {
      title: "Vendor not found",
    };
  }

  const { vendor } = data;

  return {
    title: `${vendor.businessName} | LuziMarket`,
    description: vendor.description || `Shop from ${vendor.businessName} on LuziMarket`,
    openGraph: {
      title: `${vendor.businessName} | LuziMarket`,
      description: vendor.description || `Shop from ${vendor.businessName} on LuziMarket`,
      type: 'website',
    },
  };
}

export default async function VendorPage({ params }: VendorPageProps) {
  const t = await getTranslations("Vendor");
  const data = await getVendorData(params.slug);
  
  if (!data) {
    notFound();
  }

  const { vendor, stats } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vendor Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Vendor Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-univers">
                    {vendor.businessName}
                  </h1>
                  {vendor.description && (
                    <p className="text-gray-600 mt-2 max-w-2xl">
                      {vendor.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <SocialShare
                    title={vendor.businessName}
                    description={vendor.description || undefined}
                    url={`/vendors/${vendor.slug}`}
                  />
                </div>
              </div>

              {/* Vendor Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Contact Information</h3>
                  
                  {(vendor.street || vendor.city || vendor.state) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-600">
                        {[vendor.street, vendor.city, vendor.state].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  )}
                  
                  {vendor.businessPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <a href={`tel:${vendor.businessPhone}`} className="text-sm text-gray-600 hover:text-gray-900">
                        {vendor.businessPhone}
                      </a>
                    </div>
                  )}
                  
                  {vendor.websiteUrl && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <a 
                        href={vendor.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  
                  {vendor.businessHours && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        {vendor.businessHours}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Store Statistics</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Package className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {stats.totalProducts}
                        </div>
                        <div className="text-sm text-gray-600">Products</div>
                      </CardContent>
                    </Card>
                    
                    {stats.avgRating && (
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Star className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-gray-900">
                            {Number(stats.avgRating).toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Avg Rating ({stats.totalReviews} reviews)
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="flex flex-wrap gap-2 mt-6">
                {vendor.hasDelivery && (
                  <Badge variant="secondary">
                    Delivery Available
                  </Badge>
                )}
                {vendor.deliveryService && (
                  <Badge variant="outline">
                    {vendor.deliveryService}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 font-univers">
            Latest Products
          </h2>
          <Button variant="outline" asChild>
            <Link href={`/products?vendors=${vendor.id}`}>
              View All Products
            </Link>
          </Button>
        </div>

        <Suspense fallback={<div className="text-center py-8">Loading products...</div>}>
          <ProductsGrid products={vendor.products} />
        </Suspense>

        {vendor.products.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products yet
            </h3>
            <p className="text-gray-600">
              This vendor hasn&apos;t added any products yet. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}