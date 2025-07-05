import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Terms' });
  
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Terms' });

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
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.definitions.title')}</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>{t('sections.definitions.terms.platform')}</strong>: {t('sections.definitions.descriptions.platform')}</li>
            <li><strong>{t('sections.definitions.terms.user')}</strong>: {t('sections.definitions.descriptions.user')}</li>
            <li><strong>{t('sections.definitions.terms.vendor')}</strong>: {t('sections.definitions.descriptions.vendor')}</li>
            <li><strong>{t('sections.definitions.terms.products')}</strong>: {t('sections.definitions.descriptions.products')}</li>
            <li><strong>{t('sections.definitions.terms.services')}</strong>: {t('sections.definitions.descriptions.services')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.acceptance.title')}</h2>
          <p>{t('sections.acceptance.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.platformUse.title')}</h2>
          <p className="mb-4">{t('sections.platformUse.intro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('sections.platformUse.rules.age')}</li>
            <li>{t('sections.platformUse.rules.accuracy')}</li>
            <li>{t('sections.platformUse.rules.lawful')}</li>
            <li>{t('sections.platformUse.rules.respect')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.registration.title')}</h2>
          <p>{t('sections.registration.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.purchases.title')}</h2>
          <h3 className="text-xl font-myungjo mb-3 mt-6">{t('sections.purchases.process.title')}</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>{t('sections.purchases.process.steps.browse')}</li>
            <li>{t('sections.purchases.process.steps.cart')}</li>
            <li>{t('sections.purchases.process.steps.checkout')}</li>
            <li>{t('sections.purchases.process.steps.payment')}</li>
            <li>{t('sections.purchases.process.steps.confirmation')}</li>
          </ol>

          <h3 className="text-xl font-myungjo mb-3 mt-6">{t('sections.purchases.pricing.title')}</h3>
          <p>{t('sections.purchases.pricing.content')}</p>

          <h3 className="text-xl font-myungjo mb-3 mt-6">{t('sections.purchases.availability.title')}</h3>
          <p>{t('sections.purchases.availability.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.payment.title')}</h2>
          <p className="mb-4">{t('sections.payment.intro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('sections.payment.methods.cards')}</li>
            <li>{t('sections.payment.methods.oxxo')}</li>
            <li>{t('sections.payment.methods.transfer')}</li>
          </ul>
          <p className="mt-4">{t('sections.payment.stripe')}</p>
          <p className="mt-4">{t('sections.payment.oxxoDetails')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.shipping.title')}</h2>
          <p className="mb-4">{t('sections.shipping.intro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('sections.shipping.details.areas')}</li>
            <li>{t('sections.shipping.details.times')}</li>
            <li>{t('sections.shipping.details.costs')}</li>
            <li>{t('sections.shipping.details.tracking')}</li>
          </ul>
          <p className="mt-4">{t('sections.shipping.responsibility')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.returns.title')}</h2>
          <p className="mb-4">{t('sections.returns.intro')}</p>
          <h3 className="text-xl font-myungjo mb-3 mt-6">{t('sections.returns.conditions.title')}</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('sections.returns.conditions.items.timeframe')}</li>
            <li>{t('sections.returns.conditions.items.condition')}</li>
            <li>{t('sections.returns.conditions.items.packaging')}</li>
            <li>{t('sections.returns.conditions.items.proof')}</li>
          </ul>

          <h3 className="text-xl font-myungjo mb-3 mt-6">{t('sections.returns.process.title')}</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>{t('sections.returns.process.steps.contact')}</li>
            <li>{t('sections.returns.process.steps.authorization')}</li>
            <li>{t('sections.returns.process.steps.ship')}</li>
            <li>{t('sections.returns.process.steps.inspection')}</li>
            <li>{t('sections.returns.process.steps.refund')}</li>
          </ol>

          <h3 className="text-xl font-myungjo mb-3 mt-6">{t('sections.returns.nonReturnable.title')}</h3>
          <p>{t('sections.returns.nonReturnable.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.cancellations.title')}</h2>
          <p>{t('sections.cancellations.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.warranties.title')}</h2>
          <p className="mb-4">{t('sections.warranties.intro')}</p>
          <p>{t('sections.warranties.profeco')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.intellectualProperty.title')}</h2>
          <p>{t('sections.intellectualProperty.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.liability.title')}</h2>
          <p className="mb-4">{t('sections.liability.intro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('sections.liability.limitations.quality')}</li>
            <li>{t('sections.liability.limitations.availability')}</li>
            <li>{t('sections.liability.limitations.accuracy')}</li>
            <li>{t('sections.liability.limitations.thirdParty')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.indemnification.title')}</h2>
          <p>{t('sections.indemnification.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.modifications.title')}</h2>
          <p>{t('sections.modifications.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.termination.title')}</h2>
          <p>{t('sections.termination.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.governingLaw.title')}</h2>
          <p>{t('sections.governingLaw.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.disputeResolution.title')}</h2>
          <p className="mb-4">{t('sections.disputeResolution.intro')}</p>
          <p>{t('sections.disputeResolution.profeco')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-myungjo mb-4">{t('sections.contact.title')}</h2>
          <p className="mb-4">{t('sections.contact.intro')}</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold">MOMENTO ESPECIAL SAPI DE CV</p>
            <p>{t('sections.contact.email')}: legal@luzimarket.shop</p>
            <p>{t('sections.contact.phone')}: +52 (55) 1234-5678</p>
            <p>{t('sections.contact.address')}: Ciudad de México, México</p>
            <p>{t('sections.contact.hours')}: Lunes a Viernes, 9:00 - 18:00 CST</p>
          </div>
        </section>
      </div>
    </div>
  );
}