"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Carrier {
    carrier: string;
    name: string;
    code: string;
}

interface AddTrackingFormProps {
    orderId: string;
    orderNumber: string;
    currentTracking?: {
        trackingNumber?: string;
        carrier?: string;
        trackingUrl?: string;
    };
}

export function AddTrackingForm({ orderId, orderNumber, currentTracking }: AddTrackingFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [formData, setFormData] = useState({
        trackingNumber: currentTracking?.trackingNumber || "",
        carrier: currentTracking?.carrier || "",
        estimatedDeliveryDate: "",
    });

    useEffect(() => {
        fetchCarriers();
    }, []);

    const fetchCarriers = async () => {
        try {
            const response = await fetch("/api/shipping/carriers");
            if (!response.ok) throw new Error("Failed to fetch carriers");

            const data = await response.json();
            setCarriers(data.carriers || []);
        } catch (error) {
            console.error("Error fetching carriers:", error);
            toast.error("Error al cargar transportistas");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.trackingNumber || !formData.carrier) {
            toast.error("Por favor completa todos los campos requeridos");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/vendor/orders/${orderId}/shipping`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "add_tracking",
                    trackingNumber: formData.trackingNumber,
                    carrier: formData.carrier,
                    estimatedDeliveryDate: formData.estimatedDeliveryDate || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to add tracking");
            }

            const data = await response.json();

            toast.success("Información de rastreo agregada", {
                description: "El cliente recibirá un correo con el número de rastreo",
            });

            // Refresh the page to show updated tracking info
            router.refresh();
        } catch (error: any) {
            console.error("Error adding tracking:", error);
            toast.error(error.message || "Error al agregar información de rastreo");
        } finally {
            setLoading(false);
        }
    };

    if (currentTracking?.trackingNumber) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Información de Envío
                    </CardTitle>
                    <CardDescription>
                        El cliente ya puede rastrear su pedido
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-sm font-medium">Número de Rastreo</Label>
                            <p className="text-lg font-mono mt-1">{currentTracking.trackingNumber}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Transportista</Label>
                            <p className="mt-1 capitalize">{currentTracking.carrier}</p>
                        </div>
                        {currentTracking.trackingUrl && (
                            <div className="pt-2">
                                <a
                                    href={currentTracking.trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                                >
                                    Ver rastreo en sitio del transportista →
                                </a>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Agregar Información de Envío
                </CardTitle>
                <CardDescription>
                    Proporciona el número de rastreo para que el cliente pueda seguir su pedido
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="carrier">Transportista *</Label>
                        <Select
                            value={formData.carrier}
                            onValueChange={(value) => setFormData({ ...formData, carrier: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona el transportista" />
                            </SelectTrigger>
                            <SelectContent>
                                {carriers.map((carrier) => (
                                    <SelectItem key={carrier.code} value={carrier.carrier}>
                                        {carrier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="trackingNumber">Número de Rastreo *</Label>
                        <Input
                            id="trackingNumber"
                            value={formData.trackingNumber}
                            onChange={(e) =>
                                setFormData({ ...formData, trackingNumber: e.target.value })
                            }
                            placeholder="Ej: 1234567890"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Ingresa el número de guía proporcionado por el transportista
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="estimatedDelivery">Fecha Estimada de Entrega (Opcional)</Label>
                        <Input
                            id="estimatedDelivery"
                            type="date"
                            value={formData.estimatedDeliveryDate}
                            onChange={(e) =>
                                setFormData({ ...formData, estimatedDeliveryDate: e.target.value })
                            }
                            min={new Date().toISOString().split("T")[0]}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-black text-white hover:bg-gray-800"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Package className="h-4 w-4 mr-2" />
                                    Agregar Información de Envío
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

