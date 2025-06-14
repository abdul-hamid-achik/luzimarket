"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        userType,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales inválidas");
      } else {
        // Redirect based on user type
        switch (userType) {
          case "admin":
            router.push("/admin");
            break;
          case "vendor":
            router.push("/vendor/dashboard");
            break;
          default:
            router.push("/");
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
                  <p className="text-sm text-red-500 mt-1">{customerForm.formState.errors.email.message}</p>
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
                  <p className="text-sm text-red-500 mt-1">{customerForm.formState.errors.password.message}</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
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
                <Link href="/register" className="text-sm text-gray-600 hover:text-black font-univers">
                  ¿No tienes cuenta? Regístrate
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
                  <p className="text-sm text-red-500 mt-1">{vendorForm.formState.errors.email.message}</p>
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
                  <p className="text-sm text-red-500 mt-1">{vendorForm.formState.errors.password.message}</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
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
                <Link href="/vendor/register" className="text-sm text-gray-600 hover:text-black font-univers">
                  ¿Quieres ser vendedor? Regístrate
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
                  <p className="text-sm text-red-500 mt-1">{adminForm.formState.errors.email.message}</p>
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
                  <p className="text-sm text-red-500 mt-1">{adminForm.formState.errors.password.message}</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
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
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}