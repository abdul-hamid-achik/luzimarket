"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Store, CreditCard, Mail, Truck, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Settings {
    siteName?: string;
    adminEmail?: string;
    maintenanceMode?: boolean;
    platformCommission?: number;
    testMode?: boolean;
    fromEmail?: string;
    fromName?: string;
    orderNotifications?: boolean;
    defaultShippingCost?: number;
    freeShippingThreshold?: number;
    automaticCalculation?: boolean;
    defaultLocale?: string;
    timezone?: string;
    currency?: string;
}

export function AdminSettingsForm() {
    const t = useTranslations("Admin.settingsPage");
    const [settings, setSettings] = useState<Settings>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch("/api/admin/settings");
            const data = await response.json();

            if (response.ok) {
                setSettings(data.settings || {});
            } else {
                toast.error("Failed to load settings");
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const response = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Settings saved successfully");
            } else {
                toast.error(data.error || "Failed to save settings");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
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
                        <Input
                            id="site-name"
                            value={settings.siteName || ""}
                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="admin-email">{t("adminEmail")}</Label>
                        <Input
                            id="admin-email"
                            type="email"
                            value={settings.adminEmail || ""}
                            onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-univers font-medium text-gray-900">{t("maintenanceMode")}</p>
                            <p className="text-xs text-gray-600 font-univers">{t("maintenanceModeDescription")}</p>
                        </div>
                        <Switch
                            checked={settings.maintenanceMode || false}
                            onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                        />
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
                        <Label htmlFor="commission">{t("platformCommission")}</Label>
                        <Input
                            id="commission"
                            type="number"
                            value={settings.platformCommission || ""}
                            onChange={(e) => setSettings({ ...settings, platformCommission: parseFloat(e.target.value) })}
                            className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Percentage (e.g., 15 for 15%)</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-univers font-medium text-gray-900">{t("testMode")}</p>
                            <p className="text-xs text-gray-600 font-univers">{t("testModeDescription")}</p>
                        </div>
                        <Switch
                            checked={settings.testMode || false}
                            onCheckedChange={(checked) => setSettings({ ...settings, testMode: checked })}
                        />
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
                        <Input
                            id="from-email"
                            type="email"
                            value={settings.fromEmail || ""}
                            onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="from-name">{t("fromName")}</Label>
                        <Input
                            id="from-name"
                            value={settings.fromName || ""}
                            onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-univers font-medium text-gray-900">{t("orderNotifications")}</p>
                            <p className="text-xs text-gray-600 font-univers">{t("orderNotificationsDescription")}</p>
                        </div>
                        <Switch
                            checked={settings.orderNotifications || false}
                            onCheckedChange={(checked) => setSettings({ ...settings, orderNotifications: checked })}
                        />
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
                        <Input
                            id="default-shipping"
                            type="number"
                            value={settings.defaultShippingCost || ""}
                            onChange={(e) => setSettings({ ...settings, defaultShippingCost: parseFloat(e.target.value) })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="free-shipping">{t("freeShippingThreshold")}</Label>
                        <Input
                            id="free-shipping"
                            type="number"
                            value={settings.freeShippingThreshold || ""}
                            onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-univers font-medium text-gray-900">{t("automaticCalculation")}</p>
                            <p className="text-xs text-gray-600 font-univers">{t("automaticCalculationDescription")}</p>
                        </div>
                        <Switch
                            checked={settings.automaticCalculation || false}
                            onCheckedChange={(checked) => setSettings({ ...settings, automaticCalculation: checked })}
                        />
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
                            value={settings.defaultLocale || "es"}
                            onChange={(e) => setSettings({ ...settings, defaultLocale: e.target.value })}
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
                            value={settings.timezone || "America/Mexico_City"}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
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
                            value={settings.currency || "MXN"}
                            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                        >
                            <option value="MXN">{t("mxn")}</option>
                            <option value="USD">{t("usd")}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-6 border-t">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-black text-white hover:bg-gray-800"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        t("saveChanges")
                    )}
                </Button>
            </div>
        </div>
    );
}
