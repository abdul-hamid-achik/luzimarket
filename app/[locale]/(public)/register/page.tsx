"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const createRegisterSchema = (t: any) => z.object({
  name: z.string().min(2, t("validation.nameMinLength")),
  email: z.string().email(t("validation.invalidEmail")),
  password: z.string().min(6, t("validation.passwordMinLength")),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, t("validation.acceptTerms")),
}).refine((data) => data.password === data.confirmPassword, {
  message: t("validation.passwordsDoNotMatch"),
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<ReturnType<typeof createRegisterSchema>>;

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('RegisterPage');
  const tCommon = useTranslations('Common');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const registerSchema = createRegisterSchema(t);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || t("errors.accountCreationError"));
      }
    } catch (error) {
      setError(t("errors.connectionError"));
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
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-times-now text-gray-900">{t("success.title")}</h2>
              <p className="text-sm text-gray-600 font-univers mt-4">
                {t("success.message")}
              </p>
              <p className="text-sm text-gray-600 font-univers mt-2">
                {t("success.checkEmail")}
              </p>
              <div className="mt-6">
                <Link href="/login" className="text-sm text-black hover:underline font-univers">
                  {t("success.backToLogin")}
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
            {t("subtitle")}
          </p>
          <p className="text-xs text-gray-500 font-univers mt-1">
            {t("description")}
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border border-gray-200">
          <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-6">
            {/* Name Field */}
            <div>
              <Label htmlFor="name" className="block text-sm font-univers text-gray-700">
                {t("fields.fullName")}
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="name"
                  type="text"
                  {...form.register("name")}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black"
                  placeholder={t("placeholders.fullName")}
                />
                <User className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600 font-univers">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="block text-sm font-univers text-gray-700">
                {t("fields.email")}
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black"
                  placeholder={t("placeholders.email")}
                />
                <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600 font-univers">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="block text-sm font-univers text-gray-700">
                {t("fields.password")}
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black"
                  placeholder={t("placeholders.password")}
                />
                <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600 font-univers">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-univers text-gray-700">
                {t("fields.confirmPassword")}
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...form.register("confirmPassword")}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black"
                  placeholder={t("placeholders.confirmPassword")}
                />
                <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 font-univers">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <Checkbox
                id="acceptTerms"
                checked={form.watch("acceptTerms")}
                onCheckedChange={(checked) => form.setValue("acceptTerms", checked as boolean)}
                disabled={isLoading}
                className="mt-1"
              />
              <Label htmlFor="acceptTerms" className="ml-2 text-sm font-univers text-gray-700">
                {t("terms.accept")}{" "}
                <Link href="/terms" className="text-black hover:underline">
                  {t("terms.termsAndConditions")}
                </Link>{" "}
                {t("terms.and")}{" "}
                <Link href="/privacy" className="text-black hover:underline">
                  {t("terms.privacyPolicy")}
                </Link>
              </Label>
            </div>
            {form.formState.errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-600 font-univers">
                {form.formState.errors.acceptTerms.message}
              </p>
            )}

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
                  {t("creatingAccount")}
                </>
              ) : (
                t("createAccount")
              )}
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <Link href="/login" className="text-sm text-gray-600 hover:text-black font-univers">
                {t("alreadyHaveAccount")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}