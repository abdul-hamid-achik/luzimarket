import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, Monitor, Bell } from "lucide-react";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { SessionManager } from "@/components/settings/session-manager";
import { TwoFactorSettings } from "@/components/settings/two-factor-settings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default async function AdminSecurityPage() {
  const session = await auth();
  const t = await getTranslations("Admin.security");

  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-univers text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          {t("description")}
        </p>
      </div>

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
          <TwoFactorSettings />
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

      {/* Security Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <CardTitle>{t("notifications.title")}</CardTitle>
          </div>
          <CardDescription>{t("notifications.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-alerts" className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t("notifications.loginAlerts")}</span>
                <span className="text-xs text-gray-600">{t("notifications.loginAlertsDescription")}</span>
              </Label>
              <Switch id="login-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="suspicious-activity" className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t("notifications.suspiciousActivity")}</span>
                <span className="text-xs text-gray-600">{t("notifications.suspiciousDescription")}</span>
              </Label>
              <Switch id="suspicious-activity" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password-changes" className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t("notifications.passwordChanges")}</span>
                <span className="text-xs text-gray-600">{t("notifications.passwordDescription")}</span>
              </Label>
              <Switch id="password-changes" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}