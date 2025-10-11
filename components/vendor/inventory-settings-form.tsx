"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface InventorySettings {
    lowStockThreshold?: number;
    enableAutoDeactivate?: boolean;
    notificationPreferences?: {
        email?: boolean;
        lowStock?: boolean;
        outOfStock?: boolean;
    };
}

interface InventorySettingsFormProps {
    vendorId: string;
}

export function InventorySettingsForm({ vendorId }: InventorySettingsFormProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<InventorySettings>({
        lowStockThreshold: 10,
        enableAutoDeactivate: false,
        notificationPreferences: {
            email: true,
            lowStock: true,
            outOfStock: true,
        },
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch("/api/vendor/inventory/settings");
            if (!response.ok) throw new Error("Failed to fetch settings");

            const data = await response.json();
            if (data.settings && Object.keys(data.settings).length > 0) {
                setSettings({
                    lowStockThreshold: data.settings.lowStockThreshold || 10,
                    enableAutoDeactivate: data.settings.enableAutoDeactivate || false,
                    notificationPreferences: data.settings.notificationPreferences || {
                        email: true,
                        lowStock: true,
                        outOfStock: true,
                    },
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/vendor/inventory/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (!response.ok) throw new Error("Failed to save settings");

            toast.success("Configuración guardada");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Low Stock Threshold */}
            <div className="space-y-2">
                <Label htmlFor="threshold">Umbral de Stock Bajo</Label>
                <Input
                    id="threshold"
                    type="number"
                    min="0"
                    value={settings.lowStockThreshold || 10}
                    onChange={(e) =>
                        setSettings({
                            ...settings,
                            lowStockThreshold: parseInt(e.target.value) || 10,
                        })
                    }
                />
                <p className="text-xs text-gray-500">
                    Los productos con stock igual o menor a este número se considerarán de &quot;stock bajo&quot;
                </p>
            </div>

            {/* Auto-deactivate */}
            <div className="flex items-center justify-between space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                    <Label htmlFor="autoDeactivate" className="text-sm font-medium">
                        Desactivar Automáticamente Productos Agotados
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                        Los productos agotados se desactivarán automáticamente para evitar ventas sin stock
                    </p>
                </div>
                <Switch
                    id="autoDeactivate"
                    checked={settings.enableAutoDeactivate || false}
                    onCheckedChange={(checked) =>
                        setSettings({
                            ...settings,
                            enableAutoDeactivate: checked,
                        })
                    }
                />
            </div>

            {/* Notification Preferences */}
            <div className="space-y-4">
                <Label className="text-base font-medium">Preferencias de Notificación</Label>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="emailNotifications" className="text-sm font-normal">
                            Notificaciones por Email
                        </Label>
                        <Switch
                            id="emailNotifications"
                            checked={settings.notificationPreferences?.email ?? true}
                            onCheckedChange={(checked) =>
                                setSettings({
                                    ...settings,
                                    notificationPreferences: {
                                        ...settings.notificationPreferences,
                                        email: checked,
                                    },
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between pl-6">
                        <Label htmlFor="lowStockNotif" className="text-sm font-normal">
                            Alertas de Stock Bajo
                        </Label>
                        <Switch
                            id="lowStockNotif"
                            checked={settings.notificationPreferences?.lowStock ?? true}
                            onCheckedChange={(checked) =>
                                setSettings({
                                    ...settings,
                                    notificationPreferences: {
                                        ...settings.notificationPreferences,
                                        lowStock: checked,
                                    },
                                })
                            }
                            disabled={!settings.notificationPreferences?.email}
                        />
                    </div>

                    <div className="flex items-center justify-between pl-6">
                        <Label htmlFor="outOfStockNotif" className="text-sm font-normal">
                            Alertas de Productos Agotados
                        </Label>
                        <Switch
                            id="outOfStockNotif"
                            checked={settings.notificationPreferences?.outOfStock ?? true}
                            onCheckedChange={(checked) =>
                                setSettings({
                                    ...settings,
                                    notificationPreferences: {
                                        ...settings.notificationPreferences,
                                        outOfStock: checked,
                                    },
                                })
                            }
                            disabled={!settings.notificationPreferences?.email}
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Configuración
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

