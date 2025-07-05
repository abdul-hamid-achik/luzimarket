import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'About' });
  
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'About' });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl font-myungjo mb-6">{t('title')}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {t('subtitle')}
        </p>
      </section>

      {/* Our Story */}
      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-myungjo mb-8 text-center">{t('sections.story.title')}</h2>
        <div className="prose prose-lg max-w-none">
          <p className="mb-6">{t('sections.story.paragraph1')}</p>
          <p className="mb-6">{t('sections.story.paragraph2')}</p>
          <p>{t('sections.story.paragraph3')}</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mb-16 bg-gray-50 py-12 -mx-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-myungjo mb-4">{t('sections.mission.title')}</h3>
              <p className="text-gray-700">{t('sections.mission.content')}</p>
            </div>
            <div>
              <h3 className="text-2xl font-myungjo mb-4">{t('sections.vision.title')}</h3>
              <p className="text-gray-700">{t('sections.vision.content')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-myungjo mb-8 text-center">{t('sections.values.title')}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🎨</span>
            </div>
            <h4 className="font-semibold mb-2">{t('sections.values.items.authenticity.title')}</h4>
            <p className="text-gray-600">{t('sections.values.items.authenticity.description')}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-400 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🌱</span>
            </div>
            <h4 className="font-semibold mb-2">{t('sections.values.items.sustainability.title')}</h4>
            <p className="text-gray-600">{t('sections.values.items.sustainability.description')}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-400 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🤝</span>
            </div>
            <h4 className="font-semibold mb-2">{t('sections.values.items.community.title')}</h4>
            <p className="text-gray-600">{t('sections.values.items.community.description')}</p>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-myungjo mb-8 text-center">{t('sections.difference.title')}</h2>
        <div className="space-y-6">
          <div className="border-l-4 border-yellow-400 pl-6">
            <h4 className="font-semibold mb-2">{t('sections.difference.items.curation.title')}</h4>
            <p className="text-gray-700">{t('sections.difference.items.curation.description')}</p>
          </div>
          <div className="border-l-4 border-green-400 pl-6">
            <h4 className="font-semibold mb-2">{t('sections.difference.items.localSupport.title')}</h4>
            <p className="text-gray-700">{t('sections.difference.items.localSupport.description')}</p>
          </div>
          <div className="border-l-4 border-cyan-400 pl-6">
            <h4 className="font-semibold mb-2">{t('sections.difference.items.experience.title')}</h4>
            <p className="text-gray-700">{t('sections.difference.items.experience.description')}</p>
          </div>
          <div className="border-l-4 border-pink-400 pl-6">
            <h4 className="font-semibold mb-2">{t('sections.difference.items.trust.title')}</h4>
            <p className="text-gray-700">{t('sections.difference.items.trust.description')}</p>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="mb-16 bg-gradient-to-r from-green-400 via-yellow-300 to-cyan-400 py-12 -mx-4 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-myungjo mb-6">{t('sections.commitment.title')}</h2>
          <p className="text-lg mb-8">{t('sections.commitment.content')}</p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/80 p-6 rounded-lg">
              <h4 className="font-semibold mb-2">{t('sections.commitment.points.quality.title')}</h4>
              <p className="text-sm">{t('sections.commitment.points.quality.description')}</p>
            </div>
            <div className="bg-white/80 p-6 rounded-lg">
              <h4 className="font-semibold mb-2">{t('sections.commitment.points.service.title')}</h4>
              <p className="text-sm">{t('sections.commitment.points.service.description')}</p>
            </div>
            <div className="bg-white/80 p-6 rounded-lg">
              <h4 className="font-semibold mb-2">{t('sections.commitment.points.transparency.title')}</h4>
              <p className="text-sm">{t('sections.commitment.points.transparency.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section className="text-center max-w-4xl mx-auto">
        <h2 className="text-3xl font-myungjo mb-6">{t('sections.joinUs.title')}</h2>
        <p className="text-lg mb-8">{t('sections.joinUs.content')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/vendor/register" 
            className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('sections.joinUs.vendorButton')}
          </Link>
          <Link 
            href="/contact" 
            className="inline-block border border-black px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {t('sections.joinUs.contactButton')}
          </Link>
        </div>
      </section>

      {/* Company Info */}
      <section className="mt-16 pt-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-xl font-myungjo mb-4">{t('sections.companyInfo.title')}</h3>
          <div className="text-sm text-gray-600">
            <p className="font-semibold">MOMENTO ESPECIAL SAPI DE CV</p>
            <p>RFC: MES240101ABC</p>
            <p>{t('sections.companyInfo.location')}</p>
            <p className="mt-4">{t('sections.companyInfo.compliance')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}