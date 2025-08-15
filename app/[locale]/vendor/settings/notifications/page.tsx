import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function updateNotificationSettings(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "vendor") {
        redirect("/login");
    }

    const vendorId = session.user.vendor?.id || session.user.id;

    // Read current settings and merge
    const [vendor] = await db
        .select({ shippingSettings: vendors.shippingSettings })
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

    const current = (vendor?.shippingSettings as any) || {};
    const updated = {
        ...current,
        notifications: {
            ...(current.notifications || {}),
            orderUpdates: formData.get("orderUpdates") === "on",
            promotionalEmails: formData.get("promotionalEmails") === "on",
            securityAlerts: formData.get("securityAlerts") === "on",
        },
    };

    await db.update(vendors).set({ shippingSettings: updated, updatedAt: new Date() }).where(eq(vendors.id, vendorId));
    revalidatePath("/vendor/settings/notifications");
}

export default async function VendorNotificationsSettingsPage() {
    const session = await auth();
    const t = await getTranslations("Vendor.notifications");

    if (!session || session.user.role !== "vendor") {
        redirect("/login");
    }

    const vendorId = session.user.vendor?.id || session.user.id;
    const [vendor] = await db
        .select({ shippingSettings: vendors.shippingSettings })
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

    const notifications = ((vendor?.shippingSettings as any)?.notifications) || {};

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-univers text-gray-900">{t("title", { default: "Notificaciones" })}</h1>
                <p className="text-sm text-gray-600 font-univers mt-1">
                    {t("description", { default: "Elige cómo quieres que te contactemos" })}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("preferences.title", { default: "Preferencias" })}</CardTitle>
                    <CardDescription>
                        {t("preferences.description", { default: "Actualiza tus preferencias de notificación" })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateNotificationSettings} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="orderUpdates">{t("orderUpdates", { default: "Actualizaciones de pedidos" })}</Label>
                                <p className="text-xs text-gray-600">{t("orderUpdatesDescription", { default: "Notificaciones sobre el estado de tus pedidos" })}</p>
                            </div>
                            <Switch id="orderUpdates" name="orderUpdates" defaultChecked={!!notifications.orderUpdates} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="promotionalEmails">{t("promotionalEmails", { default: "Correos promocionales" })}</Label>
                                <p className="text-xs text-gray-600">{t("promotionalDescription", { default: "Ofertas y novedades" })}</p>
                            </div>
                            <Switch id="promotionalEmails" name="promotionalEmails" defaultChecked={!!notifications.promotionalEmails} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="securityAlerts">{t("securityAlerts", { default: "Alertas de seguridad" })}</Label>
                                <p className="text-xs text-gray-600">{t("securityDescription", { default: "Avisos importantes de cuenta" })}</p>
                            </div>
                            <Switch id="securityAlerts" name="securityAlerts" defaultChecked={!!notifications.securityAlerts} />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit">{t("save", { default: "Guardar" })}</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}


