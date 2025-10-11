"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    Truck,
    CheckCircle,
    MapPin,
    ExternalLink,
    Clock,
    Copy
} from "lucide-react";
import { toast } from "sonner";

interface TrackingHistoryItem {
    status: string;
    location: string;
    timestamp: Date;
    description: string;
    coordinates?: { lat: number; lng: number };
}

interface OrderTrackingDisplayProps {
    trackingNumber?: string | null;
    carrier?: string | null;
    trackingUrl?: string | null;
    status: string;
    shippedAt?: Date | null;
    estimatedDeliveryDate?: Date | null;
    actualDeliveryDate?: Date | null;
    trackingHistory?: TrackingHistoryItem[];
}

export function OrderTrackingDisplay({
    trackingNumber,
    carrier,
    trackingUrl,
    status,
    shippedAt,
    estimatedDeliveryDate,
    actualDeliveryDate,
    trackingHistory = [],
}: OrderTrackingDisplayProps) {
    const handleCopyTracking = () => {
        if (trackingNumber) {
            navigator.clipboard.writeText(trackingNumber);
            toast.success("Número de rastreo copiado");
        }
    };

    // If order hasn't been shipped yet
    if (!trackingNumber || status === "pending" || status === "paid") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Información de Envío
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Tu pedido está siendo preparado</p>
                        <p className="text-sm text-gray-500">
                            Te notificaremos cuando sea enviado
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Rastreo de Envío
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Tracking Number and Carrier */}
                <div className="space-y-3">
                    <div>
                        <Label className="text-sm font-medium text-gray-600">Número de Rastreo</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 text-lg font-mono bg-gray-100 px-3 py-2 rounded">
                                {trackingNumber}
                            </code>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopyTracking}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-600">Transportista</Label>
                        <p className="mt-1 capitalize text-lg">{carrier}</p>
                    </div>

                    {trackingUrl && (
                        <div className="pt-2">
                            <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Rastrear en sitio de {carrier}
                                <ExternalLink className="h-4 w-4 ml-1" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Delivery Dates */}
                {(shippedAt || estimatedDeliveryDate || actualDeliveryDate) && (
                    <div className="space-y-2 pt-4 border-t">
                        {shippedAt && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Fecha de envío:</span>
                                <span className="font-medium">
                                    {new Date(shippedAt).toLocaleDateString("es-MX", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                        )}
                        {estimatedDeliveryDate && !actualDeliveryDate && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Entrega estimada:</span>
                                <span className="font-medium">
                                    {new Date(estimatedDeliveryDate).toLocaleDateString("es-MX", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                        )}
                        {actualDeliveryDate && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Entregado el:</span>
                                <span className="font-medium text-green-600">
                                    {new Date(actualDeliveryDate).toLocaleDateString("es-MX", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Tracking History */}
                {trackingHistory.length > 0 && (
                    <div className="pt-4 border-t">
                        <Label className="text-sm font-medium mb-3 block">Historial de Rastreo</Label>
                        <div className="space-y-3">
                            {trackingHistory
                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                .map((event, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-3 relative"
                                    >
                                        {/* Timeline indicator */}
                                        <div className="flex flex-col items-center">
                                            <div className={`rounded-full p-1.5 ${index === 0 ? "bg-blue-600" : "bg-gray-300"
                                                }`}>
                                                {event.status.toLowerCase().includes("delivered") ? (
                                                    <CheckCircle className="h-3 w-3 text-white" />
                                                ) : (
                                                    <MapPin className="h-3 w-3 text-white" />
                                                )}
                                            </div>
                                            {index < trackingHistory.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                            )}
                                        </div>

                                        {/* Event details */}
                                        <div className="flex-1 pb-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{event.description}</p>
                                                    <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {event.location}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {new Date(event.timestamp).toLocaleDateString("es-MX", {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Status Badge */}
                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estado del envío:</span>
                        <Badge
                            variant={status === "delivered" ? "default" : "secondary"}
                            className={
                                status === "delivered" ? "bg-green-600" :
                                    status === "shipped" ? "bg-blue-600" :
                                        "bg-gray-600"
                            }
                        >
                            {status === "delivered" ? "Entregado" :
                                status === "shipped" ? "En tránsito" :
                                    "Procesando"}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
    return <label className={className}>{children}</label>;
}

