"use client";

import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loadStripe } from "@stripe/stripe-js";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { ProgressSteps, MobileProgressSteps } from "@/components/ui/progress-steps";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const checkoutSchema = z.object({
  // Customer info
  email: z.string().email("Correo electrónico inválido"),
  firstName: z.string().min(1, "Nombre es requerido"),
  lastName: z.string().min(1, "Apellido es requerido"),
  phone: z.string().min(10, "Teléfono inválido"),
  
  // Shipping address
  shippingStreet: z.string().min(1, "Calle es requerida"),
  shippingCity: z.string().min(1, "Ciudad es requerida"),
  shippingState: z.string().min(1, "Estado es requerido"),
  shippingPostalCode: z.string().min(5, "Código postal inválido"),
  
  // Billing address
  billingSameAsShipping: z.boolean(),
  billingStreet: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { state, getTotalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingDifferent, setBillingDifferent] = useState(false);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      billingSameAsShipping: true,
    },
  });

  const onSubmit = async (data: CheckoutForm) => {
    setIsProcessing(true);

    try {
      // Create checkout session
      const response = await fetch("/api/checkout/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: state.items,
          customerInfo: {
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            phone: data.phone,
          },
          shippingAddress: {
            street: data.shippingStreet,
            city: data.shippingCity,
            state: data.shippingState,
            postalCode: data.shippingPostalCode,
            country: "MX",
          },
          billingAddress: data.billingSameAsShipping
            ? {
                street: data.shippingStreet,
                city: data.shippingCity,
                state: data.shippingState,
                postalCode: data.shippingPostalCode,
                country: "MX",
              }
            : {
                street: data.billingStreet!,
                city: data.billingCity!,
                state: data.billingState!,
                postalCode: data.billingPostalCode!,
                country: "MX",
              },
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });

      if (error) {
        console.error("Stripe error:", error);
        // Handle error
      }
    } catch (error) {
      console.error("Checkout error:", error);
      // Handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.16; // 16% IVA in Mexico
  const shipping = subtotal > 1000 ? 0 : 99; // Free shipping over $1000 MXN
  const total = subtotal + tax + shipping;

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-univers mb-4">Tu carrito está vacío</p>
          <Button onClick={() => window.location.href = "/products"}>
            Continuar comprando
          </Button>
        </div>
      </div>
    );
  }

  const checkoutSteps = [
    { id: "cart", title: "Carrito", description: "Revisa tus productos" },
    { id: "info", title: "Información", description: "Datos de contacto y envío" },
    { id: "payment", title: "Pago", description: "Método de pago" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-times-now mb-8">Finalizar compra</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="hidden md:block">
            <ProgressSteps steps={checkoutSteps} currentStep={1} />
          </div>
          <div className="md:hidden">
            <MobileProgressSteps steps={checkoutSteps} currentStep={1} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-univers mb-4">Información de contacto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      className={form.formState.errors.email ? "border-red-500" : ""}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      className={form.formState.errors.phone ? "border-red-500" : ""}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      {...form.register("firstName")}
                      className={form.formState.errors.firstName ? "border-red-500" : ""}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      {...form.register("lastName")}
                      className={form.formState.errors.lastName ? "border-red-500" : ""}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-univers mb-4">Dirección de envío</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shippingStreet">Calle</Label>
                    <Input
                      id="shippingStreet"
                      {...form.register("shippingStreet")}
                      className={form.formState.errors.shippingStreet ? "border-red-500" : ""}
                    />
                    {form.formState.errors.shippingStreet && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.shippingStreet.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="shippingCity">Ciudad</Label>
                      <Input
                        id="shippingCity"
                        {...form.register("shippingCity")}
                        className={form.formState.errors.shippingCity ? "border-red-500" : ""}
                      />
                      {form.formState.errors.shippingCity && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.shippingCity.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="shippingState">Estado</Label>
                      <Input
                        id="shippingState"
                        {...form.register("shippingState")}
                        className={form.formState.errors.shippingState ? "border-red-500" : ""}
                      />
                      {form.formState.errors.shippingState && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.shippingState.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="shippingPostalCode">Código postal</Label>
                      <Input
                        id="shippingPostalCode"
                        {...form.register("shippingPostalCode")}
                        className={form.formState.errors.shippingPostalCode ? "border-red-500" : ""}
                      />
                      {form.formState.errors.shippingPostalCode && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.shippingPostalCode.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-univers mb-4">Dirección de facturación</h2>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="billingSame"
                    checked={!billingDifferent}
                    onCheckedChange={(checked) => {
                      setBillingDifferent(!checked);
                      form.setValue("billingSameAsShipping", checked as boolean);
                    }}
                  />
                  <Label htmlFor="billingSame" className="cursor-pointer">
                    Igual que la dirección de envío
                  </Label>
                </div>

                {billingDifferent && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="billingStreet">Calle</Label>
                      <Input
                        id="billingStreet"
                        {...form.register("billingStreet")}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="billingCity">Ciudad</Label>
                        <Input
                          id="billingCity"
                          {...form.register("billingCity")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingState">Estado</Label>
                        <Input
                          id="billingState"
                          {...form.register("billingState")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingPostalCode">Código postal</Label>
                        <Input
                          id="billingPostalCode"
                          {...form.register("billingPostalCode")}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  `Pagar $${total.toFixed(2)} MXN`
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
              <h2 className="text-xl font-univers mb-4">Resumen del pedido</h2>
              
              <div className="space-y-4 mb-6">
                {state.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-univers">{item.name}</h3>
                      <p className="text-xs text-gray-600">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-univers">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (16%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Envío</span>
                  <span>{shipping === 0 ? "Gratis" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)} MXN</span>
                </div>
              </div>

              <div className="mt-6 text-xs text-gray-600">
                <p>Al realizar el pedido, aceptas nuestros términos y condiciones.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}