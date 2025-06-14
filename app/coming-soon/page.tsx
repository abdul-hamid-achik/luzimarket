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
            <h2 className="text-6xl font-times-now mb-8">
            <span className="inline-block border-2 border-black rounded-full px-8 py-4">
              Handpicked
            </span>
          </h2>
          <h2 className="text-6xl font-times-now mb-12">
            extraordinary gifts
          </h2>
          
          {/* Decorative element */}
          <div className="mb-12">
            <svg className="w-24 h-24 mx-auto" viewBox="0 0 100 100">
              <path d="M50 20 L50 80 M30 50 L70 50" stroke="black" strokeWidth="2" />
              <circle cx="50" cy="20" r="3" fill="black" />
              <circle cx="50" cy="80" r="3" fill="black" />
              <circle cx="30" cy="50" r="3" fill="black" />
              <circle cx="70" cy="50" r="3" fill="black" />
            </svg>
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