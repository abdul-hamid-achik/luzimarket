import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

interface HandpickedPageProps {
  params: Promise<{ locale: string }>;
}

export default async function HandpickedPage({ params }: HandpickedPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('HandpickedPage');

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-times-now mb-8 text-center">
          Handpicked Collection
        </h1>
        <p className="text-lg font-univers text-gray-600 text-center max-w-2xl mx-auto">
          Productos cuidadosamente seleccionados para ti.
        </p>
        
        {/* This page will show curated products */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">Coming soon...</p>
        </div>
      </div>
    </main>
  );
}