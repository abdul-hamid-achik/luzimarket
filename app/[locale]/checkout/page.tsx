"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, MapPin, User, Phone, Mail, Truck, Shield, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const checkoutSchema = z.object({
  // Personal Information
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  phone: z.string().min(10, "Teléfono inválido"),
  
  // Shipping Address
  address: z.string().min(1, "Dirección requerida"),
  city: z.string().min(1, "Ciudad requerida"),
  state: z.string().min(1, "Estado requerido"),
  postalCode: z.string().min(5, "Código postal inválido"),
  country: z.string().min(1, "País requerido"),
  
  // Optional fields
  apartment: z.string().optional(),
  company: z.string().optional(),
  instructions: z.string().optional(),
  
  // Billing
  sameAsBilling: z.boolean(),
  
  // Payment
  paymentMethod: z.enum(["card", "paypal", "oxxo"]),
  
  // Terms
  acceptTerms: z.boolean().refine(val => val === true, "Debes aceptar los términos"),
  newsletter: z.boolean().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations('Checkout');
  const { state, getTotalPrice, clearCart } = useCart();
  const items = state.items;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      sameAsBilling: true,
      paymentMethod: "card",
      acceptTerms: false,
      newsletter: false,
      country: "México",
    },
  });

  const subtotal = getTotalPrice();
  const shipping = 99; // Fixed shipping cost
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-times-now mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-600 font-univers mb-6">
            Agrega algunos productos para continuar con el checkout
          </p>
          <Link href="/products">
            <Button className="bg-black text-white hover:bg-gray-800">
              Continuar comprando
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: CheckoutForm) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create checkout session
      const response = await fetch("/api/checkout/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items,
          shippingAddress: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            apartment: data.apartment,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country,
            instructions: data.instructions,
          },
          paymentMethod: data.paymentMethod,
        }),
      });

      const result = await response.json();

      if (response.ok && result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else {
        setError(result.error || "Error al procesar el pago");
      }
    } catch (error) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-times-now">LUZIMARKET</h1>
          <p className="text-sm text-gray-600 font-univers mt-2">
            Finalizar compra
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Checkout Form */}
            <div className="space-y-8">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-times-now">
                      <Mail className="h-5 w-5" />
                      Información de Contacto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                        placeholder="tu@email.com"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input
                          id="firstName"
                          {...form.register("firstName")}
                          placeholder="Nombre"
                        />
                        {form.formState.errors.firstName && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input
                          id="lastName"
                          {...form.register("lastName")}
                          placeholder="Apellido"
                        />
                        {form.formState.errors.lastName && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...form.register("phone")}
                        placeholder="+52 555 123 4567"
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-times-now">
                      <MapPin className="h-5 w-5" />
                      Dirección de Envío
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        {...form.register("address")}
                        placeholder="Calle y número"
                      />
                      {form.formState.errors.address && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.address.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="apartment">Apartamento, depto, etc. (opcional)</Label>
                      <Input
                        id="apartment"
                        {...form.register("apartment")}
                        placeholder="Apt 4B"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                          id="city"
                          {...form.register("city")}
                          placeholder="Ciudad"
                        />
                        {form.formState.errors.city && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.city.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          {...form.register("state")}
                          placeholder="Estado"
                        />
                        {form.formState.errors.state && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.state.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postalCode">Código Postal</Label>
                        <Input
                          id="postalCode"
                          {...form.register("postalCode")}
                          placeholder="12345"
                        />
                        {form.formState.errors.postalCode && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.postalCode.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="country">País</Label>
                        <Input
                          id="country"
                          {...form.register("country")}
                          placeholder="México"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="instructions">Instrucciones de entrega (opcional)</Label>
                      <Textarea
                        id="instructions"
                        {...form.register("instructions")}
                        placeholder="Ej: Tocar el timbre, entregar en recepción..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-times-now">
                      <CreditCard className="h-5 w-5" />
                      Método de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={form.watch("paymentMethod")}
                      onValueChange={(value) => form.setValue("paymentMethod", value as any)}
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5" />
                            <span>Tarjeta de crédito o débito</span>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-5 w-5 bg-blue-600 rounded"></div>
                            <span>PayPal</span>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="oxxo" id="oxxo" />
                        <Label htmlFor="oxxo" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-5 w-5 bg-red-600 rounded"></div>
                            <span>OXXO</span>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Terms and Submit */}
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Checkbox
                      id="acceptTerms"
                      checked={form.watch("acceptTerms")}
                      onCheckedChange={(checked) => form.setValue("acceptTerms", checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="acceptTerms" className="ml-2 text-sm font-univers">
                      Acepto los{" "}
                      <Link href="/terms" className="text-black hover:underline">
                        términos y condiciones
                      </Link>{" "}
                      y la{" "}
                      <Link href="/privacy" className="text-black hover:underline">
                        política de privacidad
                      </Link>
                    </Label>
                  </div>

                  <div className="flex items-start">
                    <Checkbox
                      id="newsletter"
                      checked={form.watch("newsletter")}
                      onCheckedChange={(checked) => form.setValue("newsletter", checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="newsletter" className="ml-2 text-sm font-univers text-gray-600">
                      Quiero recibir ofertas especiales y noticias por email
                    </Label>
                  </div>

                  {form.formState.errors.acceptTerms && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.acceptTerms.message}
                    </p>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-gray-800 py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      `Finalizar compra - $${total.toLocaleString('es-MX')}`
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-8 lg:h-fit">
              <Card>
                <CardHeader>
                  <CardTitle className="font-times-now">Resumen del pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative h-16 w-16 bg-gray-100 rounded overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-univers font-medium text-sm">{item.name}</h4>
                          <p className="text-sm text-gray-600 font-univers">
                            ${item.price.toLocaleString('es-MX')} c/u
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-univers font-medium">
                            ${(item.price * item.quantity).toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-univers">
                      <span>Subtotal</span>
                      <span>${subtotal.toLocaleString('es-MX')}</span>
                    </div>
                    <div className="flex justify-between font-univers">
                      <span>Envío</span>
                      <span>${shipping.toLocaleString('es-MX')}</span>
                    </div>
                    <div className="flex justify-between font-univers">
                      <span>IVA (16%)</span>
                      <span>${tax.toLocaleString('es-MX')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-times-now text-lg">
                      <span>Total</span>
                      <span>${total.toLocaleString('es-MX')} MXN</span>
                    </div>
                  </div>

                  {/* Security badges */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        <span className="font-univers">Pago seguro</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        <span className="font-univers">Envío protegido</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}