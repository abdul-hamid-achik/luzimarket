import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import Link from "next/link";
import Image from "next/image";

interface EditorialPageProps {
  params: Promise<{ locale: string }>;
}

const articles = [
  {
    id: 'guia-regalos-navidad',
    title: 'Guía de Regalos de Navidad 2024',
    excerpt: 'Descubre los mejores regalos artesanales para esta temporada navideña',
    date: '15 de Diciembre, 2024',
    image: null,
  },
  {
    id: 'artesanos-mexicanos',
    title: 'Conoce a Nuestros Artesanos',
    excerpt: 'Historias de los talentosos creadores detrás de cada producto único',
    date: '10 de Diciembre, 2024',
    image: null,
  },
  {
    id: 'tendencias-regalos',
    title: 'Tendencias en Regalos 2024',
    excerpt: 'Las últimas tendencias en regalos personalizados y hechos a mano',
    date: '5 de Diciembre, 2024',
    image: null,
  },
];

export default async function EditorialPage({ params }: EditorialPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('Navigation');

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16">
        <div className="text-center px-8">
          <h1 className="text-4xl md:text-5xl font-times-now mb-4">
            Editorial
          </h1>
          <p className="text-base md:text-lg font-univers text-gray-600 max-w-2xl mx-auto">
            Historias, guías y tendencias del mundo de los regalos artesanales
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {articles.map((article) => (
            <article key={article.id} className="group">
              <Link href={`/editorial/${article.id}`}>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Image */}
                  <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-times-now text-gray-300">
                        Editorial
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div>
                    <time className="text-sm font-univers text-gray-500">{article.date}</time>
                    <h2 className="text-2xl font-times-now mt-2 mb-3 group-hover:text-gray-600 transition-colors">
                      {article.title}
                    </h2>
                    <p className="font-univers text-gray-600 mb-4">{article.excerpt}</p>
                    <span className="font-univers text-sm underline">Leer más</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto text-center px-8">
          <h2 className="text-3xl font-times-now mb-4">
            Suscríbete a nuestro newsletter
          </h2>
          <p className="font-univers text-gray-600 mb-8">
            Recibe las últimas novedades y ofertas exclusivas
          </p>
          <form className="flex gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="flex-1 px-4 py-3 border border-gray-300 font-univers focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-black text-white font-univers hover:bg-gray-800 transition-colors"
            >
              Suscribir
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}