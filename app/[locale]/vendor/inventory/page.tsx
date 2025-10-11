import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, PackageX, AlertTriangle, CheckCircle } from "lucide-react";
import { InventoryAlertsManager } from "@/components/vendor/inventory-alerts-manager";
import { InventorySettingsForm } from "@/components/vendor/inventory-settings-form";

async function getInventoryStats(vendorId: string) {
    const vendorProducts = await db
        .select({
            id: products.id,
            name: products.name,
            stock: products.stock,
            isActive: products.isActive,
        })
        .from(products)
        .where(eq(products.vendorId, vendorId));

    const outOfStock = vendorProducts.filter((p) => (p.stock || 0) === 0);
    const lowStock = vendorProducts.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
    const inStock = vendorProducts.filter((p) => (p.stock || 0) > 10);

    return {
        total: vendorProducts.length,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        inStock: inStock.length,
        outOfStockProducts: outOfStock,
        lowStockProducts: lowStock,
        products: vendorProducts,
    };
}

export default async function VendorInventoryPage() {
    const session = await auth();
    const t = await getTranslations("Vendor.inventory");

    if (!session || session.user.role !== "vendor") {
        redirect("/login");
    }

    const vendorId = session.user.vendor?.id || session.user.id;
    const stats = await getInventoryStats(vendorId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-univers text-gray-900">
                    {t("title", { default: "Gestión de Inventario" })}
                </h1>
                <p className="text-sm text-gray-600 font-univers mt-1">
                    {t("subtitle", { default: "Controla tus niveles de stock y configura alertas automáticas" })}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                        <Package className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-gray-500">Productos en catálogo</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Stock</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
                        <p className="text-xs text-gray-500">Stock adecuado</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
                        <p className="text-xs text-gray-500">Requieren atención</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agotados</CardTitle>
                        <PackageX className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                        <p className="text-xs text-gray-500">Sin disponibilidad</p>
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Products */}
            {(stats.lowStockProducts.length > 0 || stats.outOfStockProducts.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Productos que Requieren Atención</CardTitle>
                        <CardDescription>
                            Productos con stock bajo o agotado que necesitan ser reabastecidos
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.outOfStockProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <PackageX className="h-5 w-5 text-red-600" />
                                        <div>
                                            <p className="font-univers font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-red-600">Agotado - 0 unidades</p>
                                        </div>
                                    </div>
                                    {!product.isActive && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            Desactivado
                                        </span>
                                    )}
                                </div>
                            ))}

                            {stats.lowStockProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                        <div>
                                            <p className="font-univers font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-yellow-600">
                                                Stock bajo - {product.stock} {(product.stock || 0) === 1 ? "unidad" : "unidades"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Inventory Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Inventario</CardTitle>
                    <CardDescription>
                        Personaliza cómo quieres gestionar tu inventario
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Cargando...</div>}>
                        <InventorySettingsForm vendorId={vendorId} />
                    </Suspense>
                </CardContent>
            </Card>

            {/* Alerts Manager */}
            <Card>
                <CardContent className="pt-6">
                    <InventoryAlertsManager vendorId={vendorId} products={stats.products} />
                </CardContent>
            </Card>
        </div>
    );
}

