"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Store, TruckIcon, CheckCircle2, Clock, XCircle } from "lucide-react";

interface OrderWithDetails {
  id: string;
  orderNumber: string;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  total: string;
  vendor: {
    id: string;
    businessName: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
    };
  }>;
}

interface MultiVendorSummaryProps {
  relatedOrders: OrderWithDetails[];
  currentOrderId?: string;
}

const statusConfig = {
  pending: { label: "Pendiente", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Procesando", icon: Package, color: "bg-blue-100 text-blue-800" },
  shipped: { label: "Enviado", icon: TruckIcon, color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Entregado", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "bg-red-100 text-red-800" },
  refunded: { label: "Reembolsado", icon: XCircle, color: "bg-gray-100 text-gray-800" },
};

export function MultiVendorSummary({ relatedOrders, currentOrderId }: MultiVendorSummaryProps) {
  if (!relatedOrders || relatedOrders.length <= 1) {
    return null; // Don't show for single-vendor orders
  }

  // Calculate overall progress
  const deliveredCount = relatedOrders.filter(o => o.status === 'delivered').length;
  const shippedCount = relatedOrders.filter(o => o.status === 'shipped').length;
  const cancelledCount = relatedOrders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length;
  const progressPercent = (deliveredCount / relatedOrders.length) * 100;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600" />
              Orden Multi-Vendedor
            </CardTitle>
            <CardDescription className="mt-1">
              Tu compra incluye productos de {relatedOrders.length} vendedores diferentes
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white">
            {deliveredCount}/{relatedOrders.length} Entregado
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progreso general</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Vendor List */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Vendedores en esta orden:</h4>
          {relatedOrders.map((order) => {
            const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = config.icon;
            const isCurrentOrder = order.id === currentOrderId;

            return (
              <div
                key={order.id}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrentOrder
                    ? "bg-white border-blue-300 shadow-sm ring-2 ring-blue-200"
                    : "bg-white/60 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Store className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{order.vendor.businessName}</span>
                      {isCurrentOrder && (
                        <Badge variant="secondary" className="text-xs">
                          Actual
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} productos
                        <span className="mx-1">•</span>
                        ${Number(order.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </div>
                      {order.trackingNumber && (
                        <div className="flex items-center gap-1 font-mono">
                          <TruckIcon className="h-3 w-3" />
                          {order.carrier && <span className="uppercase">{order.carrier}:</span>}
                          {order.trackingNumber}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={config.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
          {deliveredCount > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              {deliveredCount} entregado{deliveredCount > 1 ? 's' : ''}
            </div>
          )}
          {shippedCount > 0 && (
            <div className="flex items-center gap-1">
              <TruckIcon className="h-3 w-3 text-purple-600" />
              {shippedCount} en camino
            </div>
          )}
          {cancelledCount > 0 && (
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-600" />
              {cancelledCount} cancelado{cancelledCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800">
            <strong>💡 Nota:</strong> Cada vendedor envía su parte por separado. Los números de rastreo y tiempos de entrega pueden variar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

