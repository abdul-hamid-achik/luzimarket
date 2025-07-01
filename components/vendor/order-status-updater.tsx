"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface OrderStatusUpdaterProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: string;
    currency: string;
    createdAt: string;
    user?: {
      name: string;
      email: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      product: {
        name: string;
        images: string[];
      };
    }>;
  };
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

const statusOptions = [
  { value: "processing", label: "📦 Procesando orden", icon: Package, color: "bg-blue-500" },
  { value: "shipped", label: "🚚 Enviado", icon: Truck, color: "bg-orange-500" },
  { value: "delivered", label: "✅ Entregado", icon: CheckCircle, color: "bg-green-500" },
  { value: "cancelled", label: "❌ Cancelado", icon: XCircle, color: "bg-red-500" },
];

export function OrderStatusUpdater({ order, onStatusUpdate }: OrderStatusUpdaterProps) {
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [notes, setNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.status && !notes && !trackingNumber) {
      toast.error("No hay cambios para actualizar");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/vendor/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedStatus,
          notes: notes.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el estado");
      }

      const result = await response.json();
      
      toast.success("✅ Estado actualizado exitosamente", {
        description: `La orden #${order.orderNumber} ha sido actualizada. El cliente será notificado automáticamente.`,
      });

      // Reset form
      setNotes("");
      setTrackingNumber("");

      // Notify parent component
      onStatusUpdate?.(order.id, selectedStatus);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "No se pudo actualizar el estado",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    if (!statusOption) return null;

    const Icon = statusOption.icon;
    return (
      <Badge className={`${statusOption.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusOption.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Orden #{order.orderNumber}</span>
          {getStatusBadge(order.status)}
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p>Total: ${order.total} {order.currency}</p>
          <p>Fecha: {new Date(order.createdAt).toLocaleDateString('es-MX')}</p>
          {order.user && <p>Cliente: {order.user.name} ({order.user.email})</p>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Items */}
        <div>
          <h4 className="font-medium mb-2">Productos</h4>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                  {item.product.images[0] && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-600">Cantidad: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Update Form */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Actualizar Estado</h4>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="status">Nuevo Estado</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedStatus === "shipped" && (
              <div>
                <Label htmlFor="tracking">Número de Rastreo (Opcional)</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackingNumber(e.target.value)}
                  placeholder="Ingresa el número de rastreo"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="Agrega notas sobre esta actualización..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? "Actualizando..." : "Actualizar Estado"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}