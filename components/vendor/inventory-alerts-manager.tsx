"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, AlertTriangle, PackageX } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Product {
    id: string;
    name: string;
    stock: number | null;
}

interface InventoryAlert {
    alert: {
        id: string;
        productId: string;
        alertType: string;
        threshold: number;
        isActive: boolean;
        lastTriggeredAt: Date | null;
    };
    product: Product | null;
}

interface InventoryAlertsManagerProps {
    vendorId: string;
    products: Product[];
}

export function InventoryAlertsManager({ vendorId, products }: InventoryAlertsManagerProps) {
    const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [selectedProduct, setSelectedProduct] = useState("");
    const [alertType, setAlertType] = useState<"low_stock" | "out_of_stock">("low_stock");
    const [threshold, setThreshold] = useState("10");

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await fetch("/api/vendor/inventory/alerts");
            if (!response.ok) throw new Error("Failed to fetch alerts");

            const data = await response.json();
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error("Error fetching alerts:", error);
            toast.error("Error al cargar las alertas");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAlert = async () => {
        if (!selectedProduct) {
            toast.error("Selecciona un producto");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch("/api/vendor/inventory/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct,
                    alertType,
                    threshold: parseInt(threshold),
                    isActive: true,
                }),
            });

            if (!response.ok) throw new Error("Failed to create alert");

            toast.success("Alerta creada exitosamente");
            setShowDialog(false);
            setSelectedProduct("");
            setThreshold("10");
            fetchAlerts();
        } catch (error) {
            console.error("Error creating alert:", error);
            toast.error("Error al crear la alerta");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAlert = async (alertId: string) => {
        if (!confirm("¿Eliminar esta alerta?")) return;

        try {
            const response = await fetch(`/api/vendor/inventory/alerts?alertId=${alertId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete alert");

            toast.success("Alerta eliminada");
            fetchAlerts();
        } catch (error) {
            console.error("Error deleting alert:", error);
            toast.error("Error al eliminar la alerta");
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
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-univers font-medium">Alertas de Inventario</h3>
                    <p className="text-sm text-gray-600">
                        Configura alertas automáticas cuando tus productos tengan stock bajo
                    </p>
                </div>
                <Button onClick={() => setShowDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Alerta
                </Button>
            </div>

            {alerts.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No has configurado alertas de inventario</p>
                        <Button onClick={() => setShowDialog(true)} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Crear Primera Alerta
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {alerts.map(({ alert, product }) => (
                        <Card key={alert.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {alert.alertType === "out_of_stock" ? (
                                                <PackageX className="h-5 w-5 text-red-600" />
                                            ) : (
                                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                            )}
                                            <h4 className="font-univers font-medium">
                                                {product?.name || "Producto eliminado"}
                                            </h4>
                                            <Badge variant={alert.isActive ? "default" : "secondary"}>
                                                {alert.isActive ? "Activa" : "Inactiva"}
                                            </Badge>
                                        </div>

                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>
                                                <span className="font-medium">Tipo:</span>{" "}
                                                {alert.alertType === "out_of_stock"
                                                    ? "Producto Agotado"
                                                    : "Stock Bajo"}
                                            </p>
                                            {alert.alertType === "low_stock" && (
                                                <p>
                                                    <span className="font-medium">Umbral:</span> {alert.threshold} unidades
                                                </p>
                                            )}
                                            {product && (
                                                <p>
                                                    <span className="font-medium">Stock actual:</span>{" "}
                                                    <span
                                                        className={
                                                            (product.stock || 0) <= alert.threshold
                                                                ? "text-red-600 font-medium"
                                                                : "text-green-600"
                                                        }
                                                    >
                                                        {product.stock || 0} unidades
                                                    </span>
                                                </p>
                                            )}
                                            {alert.lastTriggeredAt && (
                                                <p>
                                                    <span className="font-medium">Última alerta:</span>{" "}
                                                    {new Date(alert.lastTriggeredAt).toLocaleDateString("es-MX")}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteAlert(alert.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Alert Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Alerta de Inventario</DialogTitle>
                        <DialogDescription>
                            Configura una alerta automática para cuando un producto tenga stock bajo
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="product">Producto</Label>
                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name} (Stock: {product.stock || 0})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="alertType">Tipo de Alerta</Label>
                            <Select value={alertType} onValueChange={(v: any) => setAlertType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low_stock">Stock Bajo</SelectItem>
                                    <SelectItem value="out_of_stock">Producto Agotado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {alertType === "low_stock" && (
                            <div>
                                <Label htmlFor="threshold">Umbral (unidades)</Label>
                                <Input
                                    id="threshold"
                                    type="number"
                                    min="0"
                                    value={threshold}
                                    onChange={(e) => setThreshold(e.target.value)}
                                    placeholder="10"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Recibirás una alerta cuando el stock sea igual o menor a este número
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateAlert} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Crear Alerta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

