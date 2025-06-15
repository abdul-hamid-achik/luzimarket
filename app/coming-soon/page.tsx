import Image from "next/image";
import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-8">
        <Link href="#" className="text-sm font-univers hover:underline">
          Instagram
        </Link>
        <h1 className="text-2xl font-univers tracking-wider">
          LUZIMARKET
        </h1>
        <Link href="#" className="text-sm font-univers hover:underline">
          Contact
        </Link>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">

          {/* Main content */}
          <div className="mb-12">
            <h2 className="text-6xl font-times-now mb-8 relative">
              <span className="relative">
                Handpicked
                <Image
                  src="/images/logos/gradient-circle.png"
                  alt=""
                  width={300}
                  height={100}
                  className="absolute inset-0 w-full h-full object-contain -z-10"
                />
              </span>
            </h2>
          <h2 className="text-6xl font-times-now mb-12">
            extraordinary gifts
          </h2>
          
          {/* Decorative element */}
          <div className="mb-12">
            <Image
              src="/images/logos/hand-gesture-icon.png"
              alt="Hand gesture"
              width={80}
              height={80}
              className="mx-auto"
            />
          </div>

          <p className="text-lg font-univers max-w-2xl mx-auto mb-12">
            LUZIMARKET® es una nueva plataforma online que ofrece curaduría, venta y envío 
            a domicilio de regalos excepcionales para momentos especiales, con un catálogo de 
            marcas y tiendas seleccionadas en todo México.
          </p>

          <Link
            href="/vendor/register"
            className="inline-block bg-black text-white px-8 py-3 font-univers hover:bg-gray-800 transition-colors"
          >
            Afiliate
          </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-green-400 via-yellow-300 to-cyan-400 flex items-center justify-center gap-8 text-sm font-univers">
        <span>COMING SOON</span>
        <span>PRÓXIMAMENTE</span>
        <span>BIENTÔT</span>
        <span>곧 출시</span>
      </div>
    </div>
  );
}