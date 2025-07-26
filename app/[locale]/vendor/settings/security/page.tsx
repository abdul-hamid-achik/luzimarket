import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { TwoFactorSettings } from "@/components/settings/two-factor-settings";
import { SessionManager } from "@/components/settings/session-manager";
import { ArrowLeft, Shield, Key, Smartphone, Monitor } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function VendorSecurityPage() {
  const session = await auth();
  const t = await getTranslations("vendor.security");
  
  if (!session || session.user.role !== "vendor") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-univers text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            {t("description")}
          </p>
        </div>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Key className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>{t("changePassword.title")}</CardTitle>
              <CardDescription>{t("changePassword.description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>{t("twoFactor.title")}</CardTitle>
              <CardDescription>{t("twoFactor.description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TwoFactorSettings />
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Monitor className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>{t("sessions.title")}</CardTitle>
              <CardDescription>{t("sessions.description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SessionManager />
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle>{t("recommendations.title")}</CardTitle>
              <CardDescription>{t("recommendations.description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-sm text-gray-700">{t("recommendations.strongPassword")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-sm text-gray-700">{t("recommendations.uniquePassword")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-sm text-gray-700">{t("recommendations.enableTwoFactor")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-sm text-gray-700">{t("recommendations.regularReview")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-sm text-gray-700">{t("recommendations.phishingAware")}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}