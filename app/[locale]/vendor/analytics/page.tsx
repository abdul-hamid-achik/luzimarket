import { getTranslations } from "next-intl/server";

export default async function VendorAnalyticsPage() {
  const t = await getTranslations("vendor.analytics");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-univers">{t("title")}</h1>
        <p className="text-gray-600 mt-1">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">{t("totalSales")}</h3>
          <p className="text-2xl font-semibold mt-2">$0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">{t("totalOrders")}</h3>
          <p className="text-2xl font-semibold mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">{t("averageOrder")}</h3>
          <p className="text-2xl font-semibold mt-2">$0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">{t("conversionRate")}</h3>
          <p className="text-2xl font-semibold mt-2">0%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">{t("comingSoon")}</h2>
        <p className="text-gray-600">{t("analyticsComingSoon")}</p>
      </div>
    </div>
  );
}