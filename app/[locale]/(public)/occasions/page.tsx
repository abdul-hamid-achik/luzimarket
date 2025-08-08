import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface OccasionsPageProps {
  params: Promise<{ locale: string }>;
}

const occasions = [
  { id: 'cumpleanos', name: 'Cumpleaños', image: null },
  { id: 'aniversario', name: 'Aniversario', image: null },
  { id: 'boda', name: 'Boda', image: null },
  { id: 'baby-shower', name: 'Baby Shower', image: null },
  { id: 'graduacion', name: 'Graduación', image: null },
  { id: 'navidad', name: 'Navidad', image: null },
  { id: 'dia-madres', name: 'Día de las Madres', image: null },
  { id: 'dia-padres', name: 'Día del Padre', image: null },
  { id: 'san-valentin', name: 'San Valentín', image: null },
  { id: 'agradecimiento', name: 'Agradecimiento', image: null },
  { id: 'nuevo-hogar', name: 'Nuevo Hogar', image: null },
  { id: 'recuperacion', name: 'Pronta Recuperación', image: null },
];

export default async function OccasionsPage({ params }: OccasionsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Navigation');

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16">
        <div className="text-center px-8">
          <h1 className="text-4xl md:text-5xl font-times-now mb-4">
            Ocasiones
          </h1>
          <p className="text-base md:text-lg font-univers text-gray-600 max-w-2xl mx-auto">
            Encuentra el regalo perfecto para cada momento especial
          </p>
        </div>
      </section>

      {/* Occasions Grid */}
      <section className="py-16 px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {occasions.map((occasion) => (
            <Link
              key={occasion.id}
              href={{ pathname: "/occasions/[id]", params: { id: occasion.id } }}
              className="group"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-times-now text-gray-300">
                    {occasion.name.charAt(0)}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <h3 className="text-xl font-univers text-center px-4">{occasion.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}