"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useRouter as useNextRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const nextRouter = useNextRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for verification success
    if (searchParams.get("verified") === "true") {
      setSuccessMessage("\u00a1Tu correo electr\u00f3nico ha sido verificado exitosamente! Ahora puedes iniciar sesi\u00f3n.");
    }

    // Check for error messages
    const errorParam = searchParams.get("error");
    if (errorParam === "invalid-token") {
      setError("El enlace de verificaci\u00f3n es inv\u00e1lido.");
    } else if (errorParam === "expired-token") {
      setError("El enlace de verificaci\u00f3n ha expirado. Por favor reg\u00edstrate nuevamente.");
    } else if (errorParam === "verification-failed") {
      setError("Error al verificar tu correo electr\u00f3nico. Por favor int\u00e9ntalo de nuevo.");
    }
  }, [searchParams]);

  const customerForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const vendorForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const adminForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = async (data: LoginForm, userType: "customer" | "vendor" | "admin") => {
    setIsLoading(true);
    setError(null);

    try {
      // First, try to authenticate to get detailed error info
      const { authenticateUser } = await import("@/lib/actions/auth");
      const authResult = await authenticateUser(data.email, data.password, userType);

      if (!authResult.success) {
        if (authResult.isLocked) {
          setError(authResult.error || "Cuenta bloqueada temporalmente");
        } else if (authResult.remainingAttempts !== undefined && authResult.remainingAttempts < 3) {
          setError(`Credenciales inválidas. ${authResult.remainingAttempts} intentos restantes antes del bloqueo.`);
        } else {
          setError(authResult.error || "Credenciales inválidas");
        }
        return;
      }

      // If authentication succeeded, proceed with NextAuth signIn
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        userType,
        redirect: false,
      });

      if (result?.error) {
        setError("Error al iniciar sesión");
      } else {
        // Redirect based on user type
        switch (userType) {
          case "admin":
            nextRouter.push("/admin"); // Admin routes are not internationalized
            break;
          case "vendor":
            nextRouter.push("/vendor/dashboard"); // Vendor routes are not internationalized
            break;
          default:
            router.push("/"); // Customer routes are internationalized
        }
      }
    } catch (error) {
      setError("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-times-now">LUZIMARKET</h1>
          <p className="mt-2 text-sm text-gray-600 font-univers">
            Inicia sesión en tu cuenta
          </p>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 font-univers">{successMessage}</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer" className="font-univers text-sm">Cliente</TabsTrigger>
            <TabsTrigger value="vendor" className="font-univers text-sm">Vendedor</TabsTrigger>
            <TabsTrigger value="admin" className="font-univers text-sm">Admin</TabsTrigger>
          </TabsList>

          {/* Customer Login */}
          <TabsContent value="customer">
            <form onSubmit={customerForm.handleSubmit((data) => handleLogin(data, "customer"))} className="space-y-4">
              <div>
                <Label htmlFor="customer-email">Correo electrónico</Label>
                <Input
                  id="customer-email"
                  type="email"
                  {...customerForm.register("email")}
                  disabled={isLoading}
                />
                {customerForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1" role="alert">{customerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="customer-password">Contraseña</Label>
                <Input
                  id="customer-password"
                  type="password"
                  {...customerForm.register("password")}
                  disabled={isLoading}
                />
                {customerForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1" role="alert">{customerForm.formState.errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className={`p-3 rounded-md text-sm ${error.includes("bloqueada") || error.includes("intentos restantes")
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "text-red-500"
                  }`} role="alert">
                  {error}
                  {error.includes("verifica tu correo electrónico") && (
                    <div className="mt-2">
                      <Link href="/resend-verification" className="text-sm text-blue-600 hover:text-blue-800 underline">
                        ¿No recibiste el correo? Reenviar enlace de verificación
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>

              <div className="text-center space-y-2">
                <Link href="/register" className="text-sm text-gray-600 hover:text-black font-univers block">
                  ¿No tienes cuenta? Regístrate
                </Link>
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-black font-univers block">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </form>
          </TabsContent>

          {/* Vendor Login */}
          <TabsContent value="vendor">
            <form onSubmit={vendorForm.handleSubmit((data) => handleLogin(data, "vendor"))} className="space-y-4">
              <div>
                <Label htmlFor="vendor-email">Correo electrónico</Label>
                <Input
                  id="vendor-email"
                  type="email"
                  {...vendorForm.register("email")}
                  disabled={isLoading}
                />
                {vendorForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1" role="alert">{vendorForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="vendor-password">Contraseña</Label>
                <Input
                  id="vendor-password"
                  type="password"
                  {...vendorForm.register("password")}
                  disabled={isLoading}
                />
                {vendorForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1" role="alert">{vendorForm.formState.errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className={`p-3 rounded-md text-sm ${error.includes("bloqueada") || error.includes("intentos restantes")
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "text-red-500"
                  }`} role="alert">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>

              <div className="text-center space-y-2">
                <Link href="/vendor/register" className="text-sm text-gray-600 hover:text-black font-univers block">
                  ¿Quieres ser vendedor? Regístrate
                </Link>
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-black font-univers block">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </form>
          </TabsContent>

          {/* Admin Login */}
          <TabsContent value="admin">
            <form onSubmit={adminForm.handleSubmit((data) => handleLogin(data, "admin"))} className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Correo electrónico</Label>
                <Input
                  id="admin-email"
                  type="email"
                  {...adminForm.register("email")}
                  disabled={isLoading}
                />
                {adminForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1" role="alert">{adminForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="admin-password">Contraseña</Label>
                <Input
                  id="admin-password"
                  type="password"
                  {...adminForm.register("password")}
                  disabled={isLoading}
                />
                {adminForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1" role="alert">{adminForm.formState.errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className={`p-3 rounded-md text-sm ${error.includes("bloqueada") || error.includes("intentos restantes")
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "text-red-500"
                  }`} role="alert">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>

              <div className="text-center">
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-black font-univers">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}