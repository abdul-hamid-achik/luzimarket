import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Store, CreditCard, Bell, Shield, ChevronRight } from "lucide-react";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function VendorSettingsPage() {
  const session = await auth();
  const t = await getTranslations("vendor.settings");
  
  if (!session || session.user.role !== "vendor") {
    redirect("/login");
  }

  // Get vendor info
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, session.user.id))
    .limit(1);

  const settingsSections = [
    {
      title: t("shipping.title"),
      description: t("shipping.description"),
      icon: Truck,
      href: "/vendor/settings/shipping",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: t("store.title"),
      description: t("store.description"),
      icon: Store,
      href: "/vendor/settings/store",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t("payments.title"),
      description: t("payments.description"),
      icon: CreditCard,
      href: "/vendor/settings/payments",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: t("notifications.title"),
      description: t("notifications.description"),
      icon: Bell,
      href: "/vendor/settings/notifications",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: t("security.title"),
      description: t("security.description"),
      icon: Shield,
      href: "/vendor/settings/security",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-univers text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          {t("description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${section.bgColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <CardTitle className="mt-4">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Vendor Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("accountInfo.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-univers text-gray-600">{t("accountInfo.businessName")}:</dt>
              <dd className="text-sm font-medium">{vendor?.businessName || t("accountInfo.notConfigured")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-univers text-gray-600">{t("accountInfo.email")}:</dt>
              <dd className="text-sm font-medium">{vendor?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-univers text-gray-600">{t("accountInfo.vendorId")}:</dt>
              <dd className="text-sm font-medium font-mono">{vendor?.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-univers text-gray-600">{t("accountInfo.status")}:</dt>
              <dd className="text-sm font-medium">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-univers ${
                  vendor?.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {vendor?.isActive ? t("accountInfo.active") : t("accountInfo.inactive")}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-univers text-gray-600">{t("accountInfo.memberSince")}:</dt>
              <dd className="text-sm font-medium">
                {vendor?.createdAt 
                  ? new Date(vendor.createdAt).toLocaleDateString('es-MX', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : '-'
                }
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}