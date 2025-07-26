import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, Monitor, Bell } from "lucide-react";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { SessionManager } from "@/components/settings/session-manager";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default async function AccountSecurityPage() {
  const session = await auth();
  const t = await getTranslations("account.security");
  
  if (!session || session.user.role !== "customer") {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-times-now text-gray-900">{t("title")}</h1>
        <p className="text-gray-600 mt-2">
          {t("description")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Password Change */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-gray-600" />
              <CardTitle>{t("password.title")}</CardTitle>
            </div>
            <CardDescription>{t("password.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-600" />
              <CardTitle>{t("twoFactor.title")}</CardTitle>
            </div>
            <CardDescription>{t("twoFactor.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("twoFactor.authenticatorApp")}</p>
                  <p className="text-xs text-gray-600">{t("twoFactor.authenticatorDescription")}</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("twoFactor.emailBackup")}</p>
                  <p className="text-xs text-gray-600">{t("twoFactor.emailDescription")}</p>
                </div>
                <Switch />
              </div>
              <Button variant="outline" className="w-full">
                {t("twoFactor.viewBackupCodes")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-gray-600" />
              <CardTitle>{t("sessions.title")}</CardTitle>
            </div>
            <CardDescription>{t("sessions.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SessionManager />
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <CardTitle>{t("privacy.title")}</CardTitle>
            </div>
            <CardDescription>{t("privacy.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="order-updates" className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{t("privacy.orderUpdates")}</span>
                  <span className="text-xs text-gray-600">{t("privacy.orderUpdatesDescription")}</span>
                </Label>
                <Switch id="order-updates" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="promotional-emails" className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{t("privacy.promotionalEmails")}</span>
                  <span className="text-xs text-gray-600">{t("privacy.promotionalDescription")}</span>
                </Label>
                <Switch id="promotional-emails" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="security-alerts" className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{t("privacy.securityAlerts")}</span>
                  <span className="text-xs text-gray-600">{t("privacy.securityDescription")}</span>
                </Label>
                <Switch id="security-alerts" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">{t("deleteAccount.title")}</CardTitle>
            <CardDescription>{t("deleteAccount.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full sm:w-auto">
              {t("deleteAccount.button")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}