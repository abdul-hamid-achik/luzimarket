import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("Terms");

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-times-now mb-8">{t("title")}</h1>
      
      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <p className="text-lg text-gray-600">{t("lastUpdated")}</p>
          <p className="mt-4">{t("intro")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("acceptance.title")}</h2>
          <p>{t("acceptance.description")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("platformUse.title")}</h2>
          <p>{t("platformUse.description")}</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>{t("platformUse.eligibility")}</li>
            <li>{t("platformUse.account")}</li>
            <li>{t("platformUse.prohibited")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("purchases.title")}</h2>
          <p>{t("purchases.description")}</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>{t("purchases.pricing")}</li>
            <li>{t("purchases.payment")}</li>
            <li>{t("purchases.oxxo")}</li>
            <li>{t("purchases.confirmation")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("shipping.title")}</h2>
          <p>{t("shipping.description")}</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>{t("shipping.zones")}</li>
            <li>{t("shipping.times")}</li>
            <li>{t("shipping.costs")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("returns.title")}</h2>
          <p>{t("returns.description")}</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>{t("returns.period")}</li>
            <li>{t("returns.conditions")}</li>
            <li>{t("returns.process")}</li>
            <li>{t("returns.refunds")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("intellectual.title")}</h2>
          <p>{t("intellectual.description")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("liability.title")}</h2>
          <p>{t("liability.description")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("profeco.title")}</h2>
          <p>{t("profeco.description")}</p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">{t("profeco.info")}</p>
            <p>{t("profeco.phone")}</p>
            <p>{t("profeco.website")}</p>
          </div>
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