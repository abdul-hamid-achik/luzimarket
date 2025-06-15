import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-times-now mb-2">¡Gracias por tu compra!</h1>
          <p className="text-gray-600 font-univers">
            Tu orden ha sido confirmada y pronto recibirás un correo con los detalles.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <p className="text-sm font-univers text-gray-600 mb-2">
            Número de orden
          </p>
          <p className="text-lg font-univers font-medium">
            {searchParams.session_id?.slice(-8).toUpperCase() || "XXXXXXXX"}
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
            <Link href="/products">
              Continuar comprando
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/account/orders">
              Ver mis órdenes
            </Link>
          </Button>
        </div>

        <p className="text-xs text-gray-500 font-univers mt-8">
          Si tienes alguna pregunta, contáctanos en{" "}
          <a href="mailto:soporte@luzimarket.com" className="underline">
            soporte@luzimarket.com
          </a>
        </p>
      </div>
    </div>
  );
}