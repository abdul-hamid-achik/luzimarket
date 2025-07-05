import { getTranslations } from "next-intl/server";

export default async function ContactPage() {
  const t = await getTranslations("Contact");

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-times-now mb-8 text-center">{t("title")}</h1>
      
      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-times-now mb-6">{t("info.title")}</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-univers font-bold mb-2">{t("info.customerService")}</h3>
              <p className="text-gray-600">{t("info.email")}</p>
              <p className="text-gray-600">{t("info.phone")}</p>
              <p className="text-gray-600 text-sm mt-2">{t("info.hours")}</p>
            </div>

            <div>
              <h3 className="font-univers font-bold mb-2">{t("info.vendorSupport")}</h3>
              <p className="text-gray-600">{t("info.vendorEmail")}</p>
            </div>

            <div>
              <h3 className="font-univers font-bold mb-2">{t("info.headquarters")}</h3>
              <p className="text-gray-600">{t("info.companyName")}</p>
              <p className="text-gray-600">{t("info.address1")}</p>
              <p className="text-gray-600">{t("info.address2")}</p>
            </div>

            <div>
              <h3 className="font-univers font-bold mb-2">{t("info.businessInfo")}</h3>
              <p className="text-gray-600">{t("info.rfc")}</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-times-now mb-6">{t("form.title")}</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-univers mb-2">
                {t("form.name")}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-univers mb-2">
                {t("form.email")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-univers mb-2">
                {t("form.subject")}
              </label>
              <select
                id="subject"
                name="subject"
                className="w-full px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-black"
                required
              >
                <option value="">{t("form.subjectOptions.select")}</option>
                <option value="order">{t("form.subjectOptions.order")}</option>
                <option value="product">{t("form.subjectOptions.product")}</option>
                <option value="vendor">{t("form.subjectOptions.vendor")}</option>
                <option value="technical">{t("form.subjectOptions.technical")}</option>
                <option value="other">{t("form.subjectOptions.other")}</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-univers mb-2">
                {t("form.message")}
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-black"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 font-univers hover:bg-gray-800 transition"
            >
              {t("form.submit")}
            </button>
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-times-now mb-4">{t("faq.title")}</h2>
        <p className="text-gray-600 mb-4">{t("faq.description")}</p>
        <a href="/help" className="text-black underline hover:no-underline">
          {t("faq.link")}
        </a>
      </div>
    </div>
  );
}