"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/contexts/cart-context";
import { CheckCircle, Loader2, XCircle, UserPlus, Shield, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const { data: session } = useSession();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    // Verify the session and get order details
    const verifySession = async () => {
      try {
        const response = await fetch(`/api/checkout/sessions/${sessionId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setOrderDetails(data);
          setIsGuest(data.isGuest || !session?.user);
          // Clear the cart after successful payment
          clearCart();
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error verifying session:", error);
        setStatus("error");
      }
    };

    verifySession();
  }, [sessionId, clearCart]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-univers">Verificando tu orden...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-times-now mb-2">Error al procesar el pago</h1>
              <p className="text-gray-600 font-univers mb-6">
                Hubo un problema al verificar tu orden. Por favor contacta a soporte.
              </p>
              <div className="space-y-3">
                <Link href="/checkout">
                  <Button className="w-full">Intentar de nuevo</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">Volver al inicio</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-times-now mb-2">¡Gracias por tu compra!</h1>
            <p className="text-gray-600 font-univers mb-8">
              Tu orden ha sido procesada exitosamente.
            </p>

            {orderDetails && (
              <div className="bg-gray-100 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-times-now text-lg mb-4">Detalles de la orden</h2>
                <div className="space-y-2 font-univers text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Número de orden:</span>
                    <span className="font-medium">{sessionId?.slice(-8).toUpperCase()}</span>
                  </div>
                  {orderDetails.customerEmail && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{orderDetails.customerEmail}</span>
                    </div>
                  )}
                  {orderDetails.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total pagado:</span>
                      <span className="font-medium">
                        ${(orderDetails.amount / 100).toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm font-univers text-blue-800">
                Recibirás un correo de confirmación con los detalles de tu pedido y el seguimiento del envío.
              </p>
            </div>

            <div className="space-y-3">
              {isGuest ? (
                <Link href="/orders/lookup">
                  <Button className="w-full">Buscar mi pedido</Button>
                </Link>
              ) : (
                <Link href="/orders">
                  <Button className="w-full">Ver mis órdenes</Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline" className="w-full">Continuar comprando</Button>
              </Link>
            </div>

            {/* Guest Account Creation Offer */}
            {isGuest && (
              <Card className="mt-8 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-times-now text-lg">
                    <UserPlus className="h-5 w-5" />
                    Crea tu cuenta y ahorra tiempo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm font-univers text-gray-700">
                      Convierte tu compra como invitado en una cuenta para disfrutar de estos beneficios:
                    </p>
                    <ul className="space-y-2 text-sm font-univers">
                      <li className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                        <span>Rastrea todos tus pedidos en un solo lugar</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                        <span>Guarda tus direcciones para compras más rápidas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <UserPlus className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                        <span>Recibe ofertas exclusivas y descuentos especiales</span>
                      </li>
                    </ul>
                    <Link href={`/register?email=${orderDetails?.customerEmail || ''}`}>
                      <Button className="w-full bg-black text-white hover:bg-gray-800">
                        Crear cuenta gratis
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}