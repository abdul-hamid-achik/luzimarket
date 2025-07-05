import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy");

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-times-now mb-8">{t("title")}</h1>
      
      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <p className="text-lg text-gray-600">{t("lastUpdated")}</p>
          <p className="mt-4">{t("intro")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("dataCollection.title")}</h2>
          <p>{t("dataCollection.description")}</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>{t("dataCollection.personalInfo")}</li>
            <li>{t("dataCollection.paymentInfo")}</li>
            <li>{t("dataCollection.transactionInfo")}</li>
            <li>{t("dataCollection.communicationInfo")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("dataUse.title")}</h2>
          <p>{t("dataUse.description")}</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>{t("dataUse.orderProcessing")}</li>
            <li>{t("dataUse.customerService")}</li>
            <li>{t("dataUse.marketing")}</li>
            <li>{t("dataUse.legalCompliance")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("dataProtection.title")}</h2>
          <p>{t("dataProtection.description")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("thirdParties.title")}</h2>
          <p>{t("thirdParties.description")}</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>{t("thirdParties.stripe")}</li>
            <li>{t("thirdParties.shipping")}</li>
            <li>{t("thirdParties.analytics")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("userRights.title")}</h2>
          <p>{t("userRights.description")}</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>{t("userRights.access")}</li>
            <li>{t("userRights.rectification")}</li>
            <li>{t("userRights.deletion")}</li>
            <li>{t("userRights.portability")}</li>
            <li>{t("userRights.opposition")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("cookies.title")}</h2>
          <p>{t("cookies.description")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("contact.title")}</h2>
          <p>{t("contact.description")}</p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">{t("contact.company")}</p>
            <p>{t("contact.email")}</p>
            <p>{t("contact.address")}</p>
          </div>
        </section>
      </div>
    </div>
  );
}