import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 p-8">
        <div className="relative w-32 h-32 mx-auto">
          <Image
            src="/images/logos/flower-icon-1.png"
            alt="404"
            fill
            className="object-contain opacity-50"
          />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-times-now">404</h1>
          <h2 className="text-2xl font-univers">Not Found</h2>
          <p className="text-gray-600 font-univers">
            La página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/">
            <Button variant="default" className="bg-black text-white hover:bg-gray-800">
              Volver al Inicio
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline">
              Ver Productos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}