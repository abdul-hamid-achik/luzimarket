import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";

export default async function AdminSettingsPage() {
  const t = await getTranslations("Admin.settingsPage");
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Security Settings Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{t("securitySettings")}</p>
              <p className="text-xs text-gray-600">{t("securityDescription")}</p>
            </div>
          </div>
          <Link href="/admin/settings/security">
            <Button variant="outline" size="sm">
              {t("goToSecurity")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Settings Form */}
      <AdminSettingsForm />
    </div>
  );
}