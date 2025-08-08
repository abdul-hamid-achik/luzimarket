"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";

const resendSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

type ResendForm = z.infer<typeof resendSchema>;

export default function ResendVerificationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResendForm>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleResend = async (data: ResendForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || "Error al enviar el enlace de verificación");
      }
    } catch (error) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="mb-6">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-times-now text-gray-900">¡Enlace enviado!</h2>
              <p className="text-sm text-gray-600 font-univers mt-4">
                Si existe una cuenta con ese correo electrónico, recibirás un nuevo enlace de verificación.
              </p>
              <p className="text-sm text-gray-600 font-univers mt-2">
                Por favor revisa tu bandeja de entrada y la carpeta de spam.
              </p>
              <div className="mt-6">
                <Link href="/login" className="text-sm text-black hover:underline font-univers">
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-times-now">LUZIMARKET</h1>
          <p className="mt-2 text-sm text-gray-600 font-univers">
            Reenviar enlace de verificación
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border border-gray-200">
          <form onSubmit={form.handleSubmit(handleResend)} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-univers text-gray-700">
                Correo electrónico
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black"
                  placeholder="tu@email.com"
                />
                <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600 font-univers">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="text-sm text-gray-600 font-univers">
              <p>Te enviaremos un nuevo enlace de verificación si tu cuenta existe y aún no ha sido verificada.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600 font-univers">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 font-univers"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando enlace...
                </>
              ) : (
                "Enviar enlace de verificación"
              )}
            </Button>

            {/* Back Link */}
            <div className="text-center">
              <Link href="/login" className="text-sm text-gray-600 hover:text-black font-univers inline-flex items-center">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}