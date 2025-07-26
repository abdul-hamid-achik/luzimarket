import { Suspense } from "react";
import { VendorOrdersTable } from "@/components/vendor/orders/orders-table";
import { getTranslations } from "next-intl/server";

export default async function VendorOrdersPage() {
  const t = await getTranslations("vendor.orders");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-univers">{t("title")}</h1>
        <p className="text-gray-600 mt-1">{t("description")}</p>
      </div>

      <Suspense fallback={<div>{t("loading")}</div>}>
        <VendorOrdersTable />
      </Suspense>
    </div>
  );
}