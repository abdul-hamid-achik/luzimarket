import { Settings, Store, CreditCard, Mail, Truck, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

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

      {/* Settings sections */}
      <div className="space-y-6">
        {/* General settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Store className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-univers text-gray-900">{t("generalSettings")}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="site-name">{t("siteName")}</Label>
              <Input id="site-name" defaultValue="Luzimarket" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="admin-email">{t("adminEmail")}</Label>
              <Input id="admin-email" type="email" defaultValue="admin@luzimarket.shop" className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers font-medium text-gray-900">{t("maintenanceMode")}</p>
                <p className="text-xs text-gray-600 font-univers">{t("maintenanceModeDescription")}</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Payment settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-univers text-gray-900">{t("paymentSettings")}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="stripe-key">{t("stripePublicKey")}</Label>
              <Input id="stripe-key" defaultValue="pk_test_..." className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="commission">{t("platformCommission")}</Label>
              <Input id="commission" type="number" defaultValue="15" className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers font-medium text-gray-900">{t("testMode")}</p>
                <p className="text-xs text-gray-600 font-univers">{t("testModeDescription")}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Email settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-univers text-gray-900">{t("emailSettings")}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="from-email">{t("fromEmail")}</Label>
              <Input id="from-email" type="email" defaultValue="noreply@luzimarket.shop" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="from-name">{t("fromName")}</Label>
              <Input id="from-name" defaultValue="Luzimarket" className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers font-medium text-gray-900">{t("orderNotifications")}</p>
                <p className="text-xs text-gray-600 font-univers">{t("orderNotificationsDescription")}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Shipping settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Truck className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-univers text-gray-900">{t("shippingSettings")}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="default-shipping">{t("defaultShippingCost")}</Label>
              <Input id="default-shipping" type="number" defaultValue="99" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="free-shipping">{t("freeShippingThreshold")}</Label>
              <Input id="free-shipping" type="number" defaultValue="599" className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers font-medium text-gray-900">{t("automaticCalculation")}</p>
                <p className="text-xs text-gray-600 font-univers">{t("automaticCalculationDescription")}</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Localization settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-univers text-gray-900">{t("localization")}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="default-locale">{t("defaultLanguage")}</Label>
              <select 
                id="default-locale" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              >
                <option value="es">{t("spanish")}</option>
                <option value="en">{t("english")}</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="timezone">{t("timezone")}</Label>
              <select 
                id="timezone" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              >
                <option value="America/Mexico_City">{t("mexicoCity")}</option>
                <option value="America/Monterrey">{t("monterrey")}</option>
                <option value="America/Cancun">{t("cancun")}</option>
              </select>
            </div>

            <div>
              <Label htmlFor="currency">{t("currency")}</Label>
              <select 
                id="currency" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              >
                <option value="MXN">{t("mxn")}</option>
                <option value="USD">{t("usd")}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-6 border-t">
        <Button className="bg-black text-white hover:bg-gray-800">
          {t("saveChanges")}
        </Button>
      </div>
    </div>
  );
}