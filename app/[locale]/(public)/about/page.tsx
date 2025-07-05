import { getTranslations } from "next-intl/server";
import Image from "next/image";

export default async function AboutPage() {
  const t = await getTranslations("About");

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-times-now mb-8 text-center">{t("title")}</h1>
      
      <div className="prose prose-gray max-w-none space-y-8">
        <section className="text-center">
          <p className="text-lg text-gray-600">{t("tagline")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("story.title")}</h2>
          <p>{t("story.paragraph1")}</p>
          <p className="mt-4">{t("story.paragraph2")}</p>
          <p className="mt-4">{t("story.paragraph3")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("mission.title")}</h2>
          <p>{t("mission.description")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("values.title")}</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="text-center">
              <h3 className="font-univers font-bold text-lg mb-2">{t("values.authenticity.title")}</h3>
              <p className="text-sm">{t("values.authenticity.description")}</p>
            </div>
            <div className="text-center">
              <h3 className="font-univers font-bold text-lg mb-2">{t("values.sustainability.title")}</h3>
              <p className="text-sm">{t("values.sustainability.description")}</p>
            </div>
            <div className="text-center">
              <h3 className="font-univers font-bold text-lg mb-2">{t("values.community.title")}</h3>
              <p className="text-sm">{t("values.community.description")}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("difference.title")}</h2>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>{t("difference.curation")}</li>
            <li>{t("difference.directSupport")}</li>
            <li>{t("difference.transparency")}</li>
            <li>{t("difference.experience")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("commitment.title")}</h2>
          <p>{t("commitment.description")}</p>
        </section>

        <section className="bg-gray-50 p-8 rounded-lg">
          <h2 className="text-2xl font-times-now mb-4 text-center">{t("join.title")}</h2>
          <p className="text-center mb-6">{t("join.description")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/vendor/register" className="bg-black text-white px-6 py-3 text-center hover:bg-gray-800 transition">
              {t("join.vendorButton")}
            </a>
            <a href="/products" className="border border-black px-6 py-3 text-center hover:bg-gray-100 transition">
              {t("join.shopButton")}
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-times-now mb-4">{t("legal.title")}</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">{t("legal.company")}</p>
            <p>{t("legal.rfc")}</p>
            <p>{t("legal.address")}</p>
          </div>
        </section>
      </div>
    </div>
  );
}