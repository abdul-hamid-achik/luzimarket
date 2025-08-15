import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function updateVendorProfileAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "vendor") {
        redirect("/login");
    }

    const vendorId = session.user.vendor?.id || session.user.id;

    const payload: any = {
        businessName: formData.get("businessName")?.toString() || null,
        phone: formData.get("phone")?.toString() || null,
        whatsapp: formData.get("whatsapp")?.toString() || null,
        businessPhone: formData.get("businessPhone")?.toString() || null,
        businessHours: formData.get("businessHours")?.toString() || null,
        street: formData.get("street")?.toString() || null,
        city: formData.get("city")?.toString() || null,
        state: formData.get("state")?.toString() || null,
        country: formData.get("country")?.toString() || undefined,
        postalCode: formData.get("postalCode")?.toString() || null,
        websiteUrl: formData.get("websiteUrl")?.toString() || null,
        instagramUrl: formData.get("instagramUrl")?.toString() || null,
        facebookUrl: formData.get("facebookUrl")?.toString() || null,
        tiktokUrl: formData.get("tiktokUrl")?.toString() || null,
        twitterUrl: formData.get("twitterUrl")?.toString() || null,
        description: formData.get("description")?.toString() || null,
    };

    await db.update(vendors).set({ ...payload, updatedAt: new Date() }).where(eq(vendors.id, vendorId));
    revalidatePath("/vendor/settings");
}

export default async function VendorStoreSettingsPage() {
    const session = await auth();
    const t = await getTranslations("Vendor.store");

    if (!session || session.user.role !== "vendor") {
        redirect("/login");
    }

    const vendorId = session.user.vendor?.id || session.user.id;
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-univers text-gray-900">{t("title", { default: "Tienda" })}</h1>
                <p className="text-sm text-gray-600 font-univers mt-1">
                    {t("description", { default: "Actualiza la información de tu tienda" })}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("profile.title", { default: "Perfil de la tienda" })}</CardTitle>
                    <CardDescription>{t("profile.description", { default: "Datos básicos, dirección y enlaces" })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateVendorProfileAction} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="businessName">{t("fields.businessName", { default: "Nombre del negocio" })}</Label>
                                <Input id="businessName" name="businessName" defaultValue={vendor?.businessName || ""} />
                            </div>
                            <div>
                                <Label htmlFor="websiteUrl">Website</Label>
                                <Input id="websiteUrl" name="websiteUrl" type="url" defaultValue={vendor?.websiteUrl || ""} />
                            </div>
                            <div>
                                <Label htmlFor="phone">{t("fields.phone", { default: "Teléfono" })}</Label>
                                <Input id="phone" name="phone" defaultValue={vendor?.phone || ""} />
                            </div>
                            <div>
                                <Label htmlFor="whatsapp">WhatsApp</Label>
                                <Input id="whatsapp" name="whatsapp" defaultValue={vendor?.whatsapp || ""} />
                            </div>
                            <div>
                                <Label htmlFor="businessPhone">{t("fields.businessPhone", { default: "Teléfono del negocio" })}</Label>
                                <Input id="businessPhone" name="businessPhone" defaultValue={vendor?.businessPhone || ""} />
                            </div>
                            <div>
                                <Label htmlFor="businessHours">{t("fields.businessHours", { default: "Horario" })}</Label>
                                <Input id="businessHours" name="businessHours" defaultValue={vendor?.businessHours || ""} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="street">{t("fields.street", { default: "Calle y número" })}</Label>
                                <Input id="street" name="street" defaultValue={vendor?.street || ""} />
                            </div>
                            <div>
                                <Label htmlFor="city">{t("fields.city", { default: "Ciudad" })}</Label>
                                <Input id="city" name="city" defaultValue={vendor?.city || ""} />
                            </div>
                            <div>
                                <Label htmlFor="state">{t("fields.state", { default: "Estado" })}</Label>
                                <Input id="state" name="state" defaultValue={vendor?.state || ""} />
                            </div>
                            <div>
                                <Label htmlFor="country">{t("fields.country", { default: "País" })}</Label>
                                <Input id="country" name="country" defaultValue={vendor?.country || "México"} />
                            </div>
                            <div>
                                <Label htmlFor="postalCode">{t("fields.postalCode", { default: "Código postal" })}</Label>
                                <Input id="postalCode" name="postalCode" defaultValue={vendor?.postalCode || ""} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="instagramUrl">Instagram</Label>
                                <Input id="instagramUrl" name="instagramUrl" defaultValue={vendor?.instagramUrl || ""} />
                            </div>
                            <div>
                                <Label htmlFor="facebookUrl">Facebook</Label>
                                <Input id="facebookUrl" name="facebookUrl" defaultValue={vendor?.facebookUrl || ""} />
                            </div>
                            <div>
                                <Label htmlFor="tiktokUrl">TikTok</Label>
                                <Input id="tiktokUrl" name="tiktokUrl" defaultValue={vendor?.tiktokUrl || ""} />
                            </div>
                            <div>
                                <Label htmlFor="twitterUrl">Twitter/X</Label>
                                <Input id="twitterUrl" name="twitterUrl" defaultValue={vendor?.twitterUrl || ""} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">{t("fields.description", { default: "Descripción" })}</Label>
                            <Textarea id="description" name="description" rows={5} defaultValue={vendor?.description || ""} />
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


