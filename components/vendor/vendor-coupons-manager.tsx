"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Plus,
    Edit,
    Trash2,
    Copy,
    BarChart3,
    Loader2,
    Calendar,
    Percent,
    DollarSign,
    Ticket
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Coupon {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: string;
    value: string;
    minimumOrderAmount: string | null;
    maximumDiscountAmount: string | null;
    usageLimit: number | null;
    usageCount: number | null;
    userUsageLimit: number | null;
    isActive: boolean | null;
    startsAt: Date | null;
    expiresAt: Date | null;
    restrictToProducts: string[] | null;
    createdAt: Date | null;
    stats: {
        totalUses: number;
        totalDiscount: number;
    };
}

interface VendorCouponsManagerProps {
    vendorId: string;
    initialCoupons: Coupon[];
}

export function VendorCouponsManager({ vendorId, initialCoupons }: VendorCouponsManagerProps) {
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
    const [showDialog, setShowDialog] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        type: "percentage" as "percentage" | "fixed_amount" | "free_shipping",
        value: "",
        minimumOrderAmount: "",
        maximumDiscountAmount: "",
        usageLimit: "",
        userUsageLimit: "1",
        startsAt: "",
        expiresAt: "",
        isActive: true,
    });

    const resetForm = () => {
        setFormData({
            code: "",
            name: "",
            description: "",
            type: "percentage",
            value: "",
            minimumOrderAmount: "",
            maximumDiscountAmount: "",
            usageLimit: "",
            userUsageLimit: "1",
            startsAt: "",
            expiresAt: "",
            isActive: true,
        });
        setEditingCoupon(null);
    };

    const handleCreate = () => {
        resetForm();
        setShowDialog(true);
    };

    const handleEdit = (coupon: Coupon) => {
        setFormData({
            code: coupon.code,
            name: coupon.name,
            description: coupon.description || "",
            type: coupon.type as any,
            value: coupon.value,
            minimumOrderAmount: coupon.minimumOrderAmount || "",
            maximumDiscountAmount: coupon.maximumDiscountAmount || "",
            usageLimit: coupon.usageLimit?.toString() || "",
            userUsageLimit: (coupon.userUsageLimit || 1).toString(),
            startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().split("T")[0] : "",
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
            isActive: coupon.isActive ?? true,
        });
        setEditingCoupon(coupon);
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.code || !formData.name || !formData.value) {
            toast.error("Por favor completa todos los campos requeridos");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                code: formData.code.toUpperCase(),
                name: formData.name,
                description: formData.description || undefined,
                type: formData.type,
                value: parseFloat(formData.value),
                minimumOrderAmount: formData.minimumOrderAmount ? parseFloat(formData.minimumOrderAmount) : undefined,
                maximumDiscountAmount: formData.maximumDiscountAmount ? parseFloat(formData.maximumDiscountAmount) : undefined,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
                userUsageLimit: parseInt(formData.userUsageLimit),
                startsAt: formData.startsAt || undefined,
                expiresAt: formData.expiresAt || undefined,
                isActive: formData.isActive,
            };

            const url = editingCoupon
                ? "/api/vendor/coupons"
                : "/api/vendor/coupons";

            const method = editingCoupon ? "PUT" : "POST";
            const body = editingCoupon
                ? { ...payload, couponId: editingCoupon.id }
                : payload;

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al guardar cupón");
            }

            toast.success(editingCoupon ? "Cupón actualizado" : "Cupón creado exitosamente");
            setShowDialog(false);
            resetForm();
            router.refresh();
        } catch (error: any) {
            console.error("Error saving coupon:", error);
            toast.error(error.message || "Error al guardar cupón");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (couponId: string) => {
        if (!confirm("¿Eliminar este cupón? Esta acción no se puede deshacer.")) return;

        try {
            const response = await fetch(`/api/vendor/coupons?couponId=${couponId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Error al eliminar cupón");

            toast.success("Cupón eliminado");
            router.refresh();
        } catch (error) {
            console.error("Error deleting coupon:", error);
            toast.error("Error al eliminar cupón");
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Código copiado");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-univers font-medium">Gestión de Cupones</h3>
                    <p className="text-sm text-gray-600">
                        Crea cupones de descuento para promocionar tus productos
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Cupón
                </Button>
            </div>

            {/* Coupons List */}
            {coupons.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No has creado cupones aún</p>
                    <Button onClick={handleCreate} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Primer Cupón
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {coupons.map((coupon) => {
                        const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                        const isMaxedOut = coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit;

                        return (
                            <Card key={coupon.id}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <code className="text-lg font-mono font-bold bg-gray-100 px-3 py-1 rounded">
                                                        {coupon.code}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleCopyCode(coupon.code)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                <Badge variant={coupon.isActive && !isExpired && !isMaxedOut ? "default" : "secondary"}>
                                                    {isExpired ? "Expirado" : isMaxedOut ? "Agotado" : coupon.isActive ? "Activo" : "Inactivo"}
                                                </Badge>
                                            </div>

                                            <h4 className="font-univers font-medium text-gray-900 mb-1">
                                                {coupon.name}
                                            </h4>
                                            {coupon.description && (
                                                <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
                                            )}

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Tipo:</span>
                                                    <div className="font-medium flex items-center gap-1 mt-1">
                                                        {coupon.type === "percentage" ? (
                                                            <>
                                                                <Percent className="h-3 w-3" />
                                                                {coupon.value}% descuento
                                                            </>
                                                        ) : coupon.type === "fixed_amount" ? (
                                                            <>
                                                                <DollarSign className="h-3 w-3" />
                                                                ${Number(coupon.value).toFixed(0)} descuento
                                                            </>
                                                        ) : (
                                                            "Envío gratis"
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-gray-600">Usos:</span>
                                                    <p className="font-medium mt-1">
                                                        {coupon.usageCount || 0}
                                                        {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-gray-600">Descuento Total:</span>
                                                    <p className="font-medium mt-1">
                                                        ${Number(coupon.stats.totalDiscount).toLocaleString("es-MX")}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-gray-600">Vigencia:</span>
                                                    <p className="font-medium mt-1 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {coupon.expiresAt
                                                            ? new Date(coupon.expiresAt).toLocaleDateString("es-MX")
                                                            : "Sin límite"}
                                                    </p>
                                                </div>
                                            </div>

                                            {coupon.minimumOrderAmount && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Compra mínima: ${Number(coupon.minimumOrderAmount).toFixed(0)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(coupon)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(coupon.id)}
                                                disabled={(coupon.usageCount || 0) > 0}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCoupon ? "Editar Cupón" : "Crear Nuevo Cupón"}
                        </DialogTitle>
                        <DialogDescription>
                            Configura los detalles de tu cupón de descuento
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Code and Name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="code">Código *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="DESCUENTO10"
                                    maxLength={20}
                                    disabled={!!editingCoupon}
                                />
                                <p className="text-xs text-gray-500 mt-1">Solo letras y números en mayúsculas</p>
                            </div>

                            <div>
                                <Label htmlFor="name">Nombre *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="10% de descuento"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descripción del cupón para tus clientes"
                                rows={2}
                            />
                        </div>

                        {/* Type and Value */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="type">Tipo de Descuento *</Label>
                                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                        <SelectItem value="fixed_amount">Cantidad Fija ($)</SelectItem>
                                        <SelectItem value="free_shipping">Envío Gratis</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.type !== "free_shipping" && (
                                <div>
                                    <Label htmlFor="value">
                                        Valor * {formData.type === "percentage" ? "(%)" : "($)"}
                                    </Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        step={formData.type === "percentage" ? "1" : "0.01"}
                                        min="0"
                                        max={formData.type === "percentage" ? "100" : undefined}
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        placeholder={formData.type === "percentage" ? "10" : "50.00"}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Order Amount Restrictions */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="minAmount">Compra Mínima ($)</Label>
                                <Input
                                    id="minAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.minimumOrderAmount}
                                    onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })}
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-gray-500 mt-1">Opcional</p>
                            </div>

                            {formData.type === "percentage" && (
                                <div>
                                    <Label htmlFor="maxDiscount">Descuento Máximo ($)</Label>
                                    <Input
                                        id="maxDiscount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.maximumDiscountAmount}
                                        onChange={(e) => setFormData({ ...formData, maximumDiscountAmount: e.target.value })}
                                        placeholder="100.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Límite del descuento</p>
                                </div>
                            )}
                        </div>

                        {/* Usage Limits */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="usageLimit">Límite de Usos Total</Label>
                                <Input
                                    id="usageLimit"
                                    type="number"
                                    min="1"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                    placeholder="Ilimitado"
                                />
                                <p className="text-xs text-gray-500 mt-1">Dejar vacío para ilimitado</p>
                            </div>

                            <div>
                                <Label htmlFor="userLimit">Límite por Usuario</Label>
                                <Input
                                    id="userLimit"
                                    type="number"
                                    min="1"
                                    value={formData.userUsageLimit}
                                    onChange={(e) => setFormData({ ...formData, userUsageLimit: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startsAt">Fecha de Inicio</Label>
                                <Input
                                    id="startsAt"
                                    type="date"
                                    value={formData.startsAt}
                                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="expiresAt">Fecha de Expiración</Label>
                                <Input
                                    id="expiresAt"
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    min={formData.startsAt || undefined}
                                />
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <Label htmlFor="isActive">Cupón Activo</Label>
                                <p className="text-xs text-gray-500">Los clientes pueden usar este cupón</p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                editingCoupon ? "Actualizar Cupón" : "Crear Cupón"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

