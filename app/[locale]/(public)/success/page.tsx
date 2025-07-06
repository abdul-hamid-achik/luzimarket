import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const t = await getTranslations("Success");

  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
      <div className="mb-8">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
      </div>
      
      <h1 className="text-4xl font-times-now mb-4">{t("title")}</h1>
      <p className="text-xl text-gray-600 mb-8">{t("subtitle")}</p>
      
      <div className="bg-gray-50 p-8 rounded-lg mb-8">
        <p className="text-lg mb-4">{t("orderConfirmation")}</p>
        {searchParams.session_id && (
          <p className="text-sm text-gray-500 mb-4">
            {t("sessionId")}: {searchParams.session_id}
          </p>
        )}
        <p className="text-gray-600">{t("emailSent")}</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-times-now mb-4">{t("whatNext.title")}</h2>
        <div className="text-left space-y-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📧</span>
            <div>
              <p className="font-semibold">{t("whatNext.email.title")}</p>
              <p className="text-gray-600">{t("whatNext.email.description")}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📦</span>
            <div>
              <p className="font-semibold">{t("whatNext.shipping.title")}</p>
              <p className="text-gray-600">{t("whatNext.shipping.description")}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-semibold">{t("whatNext.support.title")}</p>
              <p className="text-gray-600">{t("whatNext.support.description")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 space-x-4">
        <Link
          href="/orders"
          className="inline-block bg-black text-white px-8 py-3 hover:bg-gray-800 transition"
        >
          {t("viewOrders")}
        </Link>
        <Link
          href="/"
          className="inline-block border border-black px-8 py-3 hover:bg-gray-100 transition"
        >
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  );
}