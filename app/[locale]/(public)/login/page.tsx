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
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

const createLoginSchema = (t: any) => z.object({
  email: z.string().email(t("validation.invalidEmail")),
  password: z.string().min(6, t("validation.passwordMinLength")),
});

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const nextRouter = useNextRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("LoginPage");
  const tAuth = useTranslations("Auth");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const loginSchema = createLoginSchema(t);

  useEffect(() => {
    // Check for verification success
    if (searchParams.get("verified") === "true") {
      setSuccessMessage(t("emailVerifiedSuccess"));
    }

    // Check for error messages
    const errorParam = searchParams.get("error");
    if (errorParam === "invalid-token") {
      setError(t("errors.invalidToken"));
    } else if (errorParam === "expired-token") {
      setError(t("errors.expiredToken"));
    } else if (errorParam === "verification-failed") {
      setError(t("errors.verificationFailed"));
    }
  }, [searchParams, t]);

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
      const authResult = await authenticateUser(data.email, data.password, userType, locale);

      if (!authResult.success) {
        if (authResult.isLocked) {
          setError(authResult.error || tAuth("accountLocked", { minutes: 30 }));
        } else if (authResult.remainingAttempts !== undefined && authResult.remainingAttempts < 3) {
          setError(tAuth("remainingAttempts", { attempts: authResult.remainingAttempts }));
        } else {
          setError(authResult.error || tAuth("invalidCredentials"));
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
        setError(tAuth("loginError"));
      } else {
        // Redirect based on user type
        switch (userType) {
          case "admin":
            router.push("/admin"); // Admin dashboard
            break;
          case "vendor":
            router.push("/vendor/dashboard"); // Vendor dashboard
            break;
          default:
            router.push("/"); // Customer home
        }
      }
    } catch (error) {
      setError(tAuth("loginError"));
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
            {t("subtitle")}
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
            <TabsTrigger value="customer" className="font-univers text-sm">{t("tabs.customer")}</TabsTrigger>
            <TabsTrigger value="vendor" className="font-univers text-sm">{t("tabs.vendor")}</TabsTrigger>
            <TabsTrigger value="admin" className="font-univers text-sm">{t("tabs.admin")}</TabsTrigger>
          </TabsList>

          {/* Customer Login */}
          <TabsContent value="customer">
            <form onSubmit={customerForm.handleSubmit((data) => handleLogin(data, "customer"))} className="space-y-4">
              <div>
                <Label htmlFor="customer-email">{t("fields.email")}</Label>
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
                <Label htmlFor="customer-password">{t("fields.password")}</Label>
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
                        {t("resendVerificationLink")}
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
                    {t("loggingIn")}
                  </>
                ) : (
                  t("loginButton")
                )}
              </Button>

              <div className="text-center space-y-2">
                <Link href="/register" className="text-sm text-gray-600 hover:text-black font-univers block">
                  {t("noAccount")}
                </Link>
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-black font-univers block">
                  {t("forgotPassword")}
                </Link>
              </div>
            </form>
          </TabsContent>

          {/* Vendor Login */}
          <TabsContent value="vendor">
            <form onSubmit={vendorForm.handleSubmit((data) => handleLogin(data, "vendor"))} className="space-y-4">
              <div>
                <Label htmlFor="vendor-email">{t("fields.email")}</Label>
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
                <Label htmlFor="vendor-password">{t("fields.password")}</Label>
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
                    {t("loggingIn")}
                  </>
                ) : (
                  t("loginButton")
                )}
              </Button>

              <div className="text-center space-y-2">
                <Link href="/vendor/register" className="text-sm text-gray-600 hover:text-black font-univers block">
                  {t("wantToBeVendor")}
                </Link>
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-black font-univers block">
                  {t("forgotPassword")}
                </Link>
              </div>
            </form>
          </TabsContent>

          {/* Admin Login */}
          <TabsContent value="admin">
            <form onSubmit={adminForm.handleSubmit((data) => handleLogin(data, "admin"))} className="space-y-4">
              <div>
                <Label htmlFor="admin-email">{t("fields.email")}</Label>
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
                <Label htmlFor="admin-password">{t("fields.password")}</Label>
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
                    {t("loggingIn")}
                  </>
                ) : (
                  t("loginButton")
                )}
              </Button>

              <div className="text-center">
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-black font-univers">
                  {t("forgotPassword")}
                </Link>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}