import { CheckCircle, Package, Truck, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  
  if (!params.session_id) {
    redirect("/");
  }

  try {
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(params.session_id, {
      expand: ["line_items", "customer"],
    });

    if (!session.metadata?.orderId) {
      throw new Error("No order ID in session");
    }

    // Fetch the order from database
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, session.metadata.orderId),
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Calculate estimated delivery date (3-5 business days)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Success Header */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h1 className="text-4xl font-times-now mb-2">¡Gracias por tu compra!</h1>
              <p className="text-lg text-gray-600 font-univers">
                Tu orden ha sido confirmada exitosamente
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-univers text-gray-600">Número de orden</p>
                  <p className="font-univers font-medium">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className="text-center">
                  <Truck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-univers text-gray-600">Estado</p>
                  <p className="font-univers font-medium text-green-600">
                    Procesando
                  </p>
                </div>
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-univers text-gray-600">Entrega estimada</p>
                  <p className="font-univers font-medium">
                    {deliveryDate.toLocaleDateString('es-MX', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-univers mb-4">Resumen del pedido</h2>
                
                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {order.items.map((item) => {
                    const productImages = item.product.images as string[] || [];
                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden">
                          <Image
                            src={productImages[0] || "/images/links/pia-riverola.webp"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-univers text-sm">{item.product.name}</h3>
                          <p className="text-sm text-gray-600 font-univers">
                            Cantidad: {item.quantity} × ${parseFloat(item.price).toLocaleString('es-MX')}
                          </p>
                        </div>
                        <p className="font-univers">
                          ${(parseFloat(item.price) * item.quantity).toLocaleString('es-MX')}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm font-univers">
                    <span>Subtotal</span>
                    <span>${parseFloat(order.subtotal).toLocaleString('es-MX')}</span>
                  </div>
                  {parseFloat(order.shipping) > 0 && (
                    <div className="flex justify-between text-sm font-univers">
                      <span>Envío</span>
                      <span>${parseFloat(order.shipping).toLocaleString('es-MX')}</span>
                    </div>
                  )}
                  {parseFloat(order.tax) > 0 && (
                    <div className="flex justify-between text-sm font-univers">
                      <span>Impuestos</span>
                      <span>${parseFloat(order.tax).toLocaleString('es-MX')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-univers pt-2 border-t">
                    <span className="font-medium">Total</span>
                    <span className="font-medium">
                      ${parseFloat(order.total).toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            {order.shippingAddress && (
              <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                <h2 className="text-lg font-univers mb-4">Información de envío</h2>
                <address className="font-univers text-sm not-italic text-gray-600">
                  {(order.shippingAddress as any).name || "N/A"}<br />
                  {(order.shippingAddress as any).street}<br />
                  {(order.shippingAddress as any).city}, {(order.shippingAddress as any).state} {(order.shippingAddress as any).postalCode}<br />
                  {(order.shippingAddress as any).country}
                </address>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-6">
              <h3 className="font-univers font-medium mb-2">Próximos pasos</h3>
              <ul className="space-y-1 text-sm font-univers text-gray-700">
                <li>• Recibirás un correo de confirmación en breve</li>
                <li>• Te notificaremos cuando tu pedido sea enviado</li>
                <li>• Puedes seguir tu pedido desde tu cuenta</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="flex-1 bg-black text-white hover:bg-gray-800">
                <Link href="/products">
                  Continuar comprando
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="flex-1">
                <Link href="/account/orders">
                  Ver mis órdenes
                </Link>
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500 font-univers mt-8">
              ¿Necesitas ayuda? Contáctanos en{" "}
              <a href="mailto:soporte@luzimarket.com" className="underline">
                soporte@luzimarket.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading order:", error);
    
    // Fallback to simple success page
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
}