import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-yellow-300 to-pink-300 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-7xl font-times-now mb-6">
              Acerca de Luzimarket
            </h1>
            <p className="text-xl font-univers text-black/80">
              Regalos handpicked para momentos especiales
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-times-now mb-8 text-center">Nuestra Misión</h2>
            
            <div className="space-y-6 font-univers text-gray-700">
              <p>
                LUZIMARKET® es una nueva plataforma online que ofrece curaduría, venta y envío 
                a domicilio de regalos excepcionales para momentos especiales, con un catálogo de 
                marcas y tiendas seleccionadas en todo México.
              </p>
              
              <p>
                Creemos que cada regalo cuenta una historia. Por eso, seleccionamos cuidadosamente 
                cada producto y cada vendedor para asegurar que encuentres exactamente lo que buscas 
                para esa persona especial.
              </p>
              
              <p>
                Nuestro equipo trabaja día a día para descubrir los mejores artesanos, diseñadores 
                y marcas locales que comparten nuestra pasión por la calidad y la autenticidad.
              </p>
            </div>

            {/* Signature */}
            <div className="mt-12 text-center">
              <Image
                src="/images/logos/signature-decoration.png"
                alt="Luzimarket signature"
                width={200}
                height={100}
                className="mx-auto opacity-80"
              />
              <p className="mt-4 font-univers text-sm text-gray-600">
                Con amor,<br />
                El equipo de Luzimarket
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-times-now mb-12 text-center">Nuestros Valores</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="mb-4">
                <Image
                  src="/images/logos/hand-gesture-icon.png"
                  alt="Handpicked"
                  width={60}
                  height={60}
                  className="mx-auto"
                />
              </div>
              <h3 className="text-xl font-univers mb-2">Curaduría Excepcional</h3>
              <p className="font-univers text-sm text-gray-600">
                Cada producto es seleccionado cuidadosamente para garantizar calidad y originalidad.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mb-4">
                <Image
                  src="/images/logos/flower-icon-1.png"
                  alt="Local"
                  width={60}
                  height={60}
                  className="mx-auto"
                />
              </div>
              <h3 className="text-xl font-univers mb-2">Apoyo Local</h3>
              <p className="font-univers text-sm text-gray-600">
                Impulsamos el talento mexicano conectando artesanos locales con todo el país.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mb-4">
                <Image
                  src="/images/logos/flower-icon-2.png"
                  alt="Experiencia"
                  width={60}
                  height={60}
                  className="mx-auto"
                />
              </div>
              <h3 className="text-xl font-univers mb-2">Experiencia Única</h3>
              <p className="font-univers text-sm text-gray-600">
                Más que productos, ofrecemos experiencias memorables para momentos especiales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-times-now mb-6">
            ¿Quieres formar parte de Luzimarket?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-black text-white hover:bg-gray-800">
              <Link href="/vendor/register">
                Vende con nosotros
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">
                Contáctanos
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}