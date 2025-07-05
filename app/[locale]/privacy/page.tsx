import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Privacy' });
  
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Privacy' });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-myungjo mb-8">{t('title')}</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-sm text-gray-600 mb-8">
          {t('lastUpdated', { date: new Date().toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US') })}
        </p>

        <section className="mb-8">
          <p className="text-lg leading-relaxed">{t('introduction')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.dataController.title')}</h2>
          <p>{t('sections.dataController.content')}</p>
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <p className="font-semibold">{t('sections.dataController.companyName')}</p>
            <p>{t('sections.dataController.rfc')}</p>
            <p>{t('sections.dataController.address')}</p>
            <p>{t('sections.dataController.email')}</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.dataCollected.title')}</h2>
          <p className="mb-4">{t('sections.dataCollected.intro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('sections.dataCollected.items.personalData')}</li>
            <li>{t('sections.dataCollected.items.contactData')}</li>
            <li>{t('sections.dataCollected.items.paymentData')}</li>
            <li>{t('sections.dataCollected.items.navigationData')}</li>
            <li>{t('sections.dataCollected.items.purchaseHistory')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.purposes.title')}</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('sections.purposes.items.processOrders')}</li>
            <li>{t('sections.purposes.items.customerService')}</li>
            <li>{t('sections.purposes.items.marketing')}</li>
            <li>{t('sections.purposes.items.fraudPrevention')}</li>
            <li>{t('sections.purposes.items.legalCompliance')}</li>
            <li>{t('sections.purposes.items.improvements')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.legalBasis.title')}</h2>
          <p>{t('sections.legalBasis.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.arcoRights.title')}</h2>
          <p className="mb-4">{t('sections.arcoRights.intro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>{t('sections.arcoRights.rights.access.title')}</strong>: {t('sections.arcoRights.rights.access.description')}</li>
            <li><strong>{t('sections.arcoRights.rights.rectification.title')}</strong>: {t('sections.arcoRights.rights.rectification.description')}</li>
            <li><strong>{t('sections.arcoRights.rights.cancellation.title')}</strong>: {t('sections.arcoRights.rights.cancellation.description')}</li>
            <li><strong>{t('sections.arcoRights.rights.opposition.title')}</strong>: {t('sections.arcoRights.rights.opposition.description')}</li>
          </ul>
          <p className="mt-4">{t('sections.arcoRights.howToExercise')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.dataSharing.title')}</h2>
          <p className="mb-4">{t('sections.dataSharing.intro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('sections.dataSharing.parties.vendors')}</li>
            <li>{t('sections.dataSharing.parties.stripe')}</li>
            <li>{t('sections.dataSharing.parties.shipping')}</li>
            <li>{t('sections.dataSharing.parties.authorities')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.paymentProcessing.title')}</h2>
          <p className="mb-4">{t('sections.paymentProcessing.stripeInfo')}</p>
          <p>{t('sections.paymentProcessing.oxxoInfo')}</p>
          <p className="mt-4">{t('sections.paymentProcessing.security')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.cookies.title')}</h2>
          <p>{t('sections.cookies.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.security.title')}</h2>
          <p>{t('sections.security.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.retention.title')}</h2>
          <p>{t('sections.retention.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.minors.title')}</h2>
          <p>{t('sections.minors.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.changes.title')}</h2>
          <p>{t('sections.changes.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.contact.title')}</h2>
          <p className="mb-4">{t('sections.contact.intro')}</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><strong>{t('sections.contact.email')}</strong>: privacy@luzimarket.shop</p>
            <p><strong>{t('sections.contact.phone')}</strong>: +52 (55) 1234-5678</p>
            <p><strong>{t('sections.contact.address')}</strong>: {t('sections.dataController.address')}</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.inai.title')}</h2>
          <p>{t('sections.inai.content')}</p>
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <p className="font-semibold">Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI)</p>
            <p>www.inai.org.mx</p>
          </div>
        </section>
      </div>
    </div>
  );
}