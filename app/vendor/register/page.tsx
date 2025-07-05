import { getTranslations } from "next-intl/server";
import VendorRegistrationForm from "@/components/forms/vendor-registration-form";
import Image from "next/image";

export default async function VendorRegisterPage() {
  const t = await getTranslations("VendorRegistration");

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-4">
            <Image
              src="/images/logos/logo-family.png"
              alt="Luzimarket Family"
              width={180}
              height={50}
              className="mx-auto h-12 w-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-univers tracking-wider">
          </h1>
          <h2 className="text-5xl font-times-now mb-4">{t("welcomeTitle")}</h2>
          <p className="text-lg font-univers text-gray-600 max-w-2xl mx-auto">
            {t("welcomeSubtitle")}<br />
            {t("welcomeDescription")}
          </p>
          
          <div className="mt-8">
            <Image
              src="/images/logos/hand-gesture-icon.png"
              alt="Hand gesture"
              width={60}
              height={60}
              className="mx-auto"
            />
          </div>
        </div>

        <VendorRegistrationForm />

        <p className="text-center text-sm font-univers text-gray-500 mt-12">
          © {new Date().getFullYear()} LUZIMARKET. Built by <a href="https://abdulachik.dev" target="_blank" rel="noopener noreferrer" className="underline">Abdul-Hamid Achik</a>.
        </p>
      </div>
    </div>
  );
}