"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, Package, Info } from "lucide-react";
import { Link } from "@/i18n/navigation";

const lookupSchema = z.object({
  email: z.string().email("Email inválido"),
  orderNumber: z.string().min(1, "Número de orden requerido"),
});

type LookupForm = z.infer<typeof lookupSchema>;

export default function OrderLookupPage() {
  const router = useRouter();
  const t = useTranslations('Orders');
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LookupForm>({
    resolver: zodResolver(lookupSchema),
    defaultValues: {
      email: "",
      orderNumber: "",
    },
  });

  const handleSubmit = async (data: LookupForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.orderNumber) {
        // Redirect to order details page using orderNumber for consistency and include email for guest access
        const usp = new URLSearchParams({ email: data.email });
        router.push((`/orders/${result.orderNumber}?${usp.toString()}`) as any);
      } else {
        setError(result.error || "No se encontró la orden con los datos proporcionados");
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-times-now text-gray-900 mb-2">
            Buscar mi pedido
          </h1>
          <p className="text-gray-600 font-univers">
            Ingresa tu email y número de orden para ver el estado de tu pedido
          </p>
        </div>

        {/* Breadcrumb */}
        <nav className="text-sm font-univers mb-8 max-w-md mx-auto">
          <ol className="flex items-center gap-2 text-gray-600">
            <li><Link href="/" className="hover:text-black">Inicio</Link></li>
            <li>/</li>
            <li className="text-black">Buscar pedido</li>
          </ol>
        </nav>

        {/* Lookup Form */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-times-now">
                <Search className="h-5 w-5" />
                Información del pedido
              </CardTitle>
              <CardDescription className="font-univers">
                Ingresa los datos que usaste al realizar tu compra
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="orderNumber">Número de orden</Label>
                  <Input
                    id="orderNumber"
                    placeholder="Ej: LM-2501-A7B9"
                    {...form.register("orderNumber")}
                  />
                  {form.formState.errors.orderNumber && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.orderNumber.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 font-univers">
                    Formato: LM-AAMM-XXXX. Puedes encontrarlo en tu email de confirmación.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-800"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Buscar pedido
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Help section */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-univers font-medium text-gray-900">
                    ¿Necesitas ayuda?
                  </p>
                  <p className="text-sm text-gray-600 font-univers">
                    Si no recibiste tu email de confirmación o tienes problemas para encontrar tu pedido, 
                    contáctanos en soporte@luzimarket.shop
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create account prompt - only show if user is not logged in */}
          {!session ? (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 font-univers">
                ¿Quieres un acceso más fácil a tus pedidos?
              </p>
              <Link href="/register" className="text-sm font-univers font-medium text-black hover:underline">
                Crea una cuenta gratis
              </Link>
            </div>
          ) : (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 font-univers">
                ¿Buscas tus pedidos como usuario registrado?
              </p>
              <Link href="/orders" className="text-sm font-univers font-medium text-black hover:underline">
                Ver mis pedidos
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}