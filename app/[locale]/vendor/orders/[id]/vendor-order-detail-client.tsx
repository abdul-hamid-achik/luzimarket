"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Calendar,
  Mail,
  Phone,
  Copy,
  Download,
  Printer,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { OrderStatusUpdateForm } from "@/components/vendor/order-status-update-form";
import { printOrder, generateOrderPDF } from "@/lib/utils/print";

interface VendorOrderDetailClientProps {
  order: any;
  translations: Record<string, string>;
}

export function VendorOrderDetailClient({ order, translations: t }: VendorOrderDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [isProcessingCancellation, setIsProcessingCancellation] = useState(false);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(`#${order.order.orderNumber}`);
    setCopied(true);
    toast.success(t.orderNumberCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancellationRequest = async (action: 'approve' | 'reject', notes?: string) => {
    setIsProcessingCancellation(true);
    try {
      const response = await fetch(`/api/vendor/orders/${order.order.id}/cancel-request`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Solicitud procesada');
        // Reload page to show updated status
        window.location.reload();
      } else {
        toast.error(result.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsProcessingCancellation(false);
    }
  };

  const handlePrint = () => {
    printOrder();
  };

  const handleDownloadInvoice = () => {
    generateOrderPDF(
      {
        ...order.order,
        items: order.items,
        user: order.user,
        shippingAddress: order.shippingAddress
      },
      {
        orderNumber: t.orderNumber,
        orderInvoice: t.orderInvoice || "Factura de Orden",
        date: t.date,
        status: t.status,
        customer: t.customer,
        guest: t.guest,
        shippingAddress: t.shippingAddress,
        orderItems: t.orderItems,
        product: t.product,
        quantity: t.quantity,
        price: t.price,
        total: t.total,
        subtotal: t.subtotal,
        tax: t.tax,
        shipping: t.shipping,
      }
    );
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: t.statusPending, color: "bg-yellow-100 text-yellow-800" },
    processing: { label: t.statusProcessing, color: "bg-blue-100 text-blue-800" },
    shipped: { label: t.statusShipped, color: "bg-purple-100 text-purple-800" },
    delivered: { label: t.statusDelivered, color: "bg-green-100 text-green-800" },
    cancelled: { label: t.statusCancelled, color: "bg-red-100 text-red-800" },
  };

  const currentStatus = statusMap[order.order.status] || { label: order.order.status, color: "bg-gray-100 text-gray-800" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-univers text-gray-900">
            {t.orderNumber} #{order.order.orderNumber}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            {order.order.createdAt && new Date(order.order.createdAt).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={currentStatus.color}>
            {currentStatus.label}
          </Badge>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t.print}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
            <Download className="h-4 w-4 mr-2" />
            {t.downloadInvoice}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t.orderItems}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                    <div className="relative h-20 w-20 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product.images?.[0] && (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {t.quantity}: {item.quantity} × {formatCurrency(Number(item.price))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number(item.total))}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t.subtotal}</span>
                  <span>{formatCurrency(Number(order.order.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t.tax}</span>
                  <span>{formatCurrency(Number(order.order.tax))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t.shipping}</span>
                  <span>{formatCurrency(Number(order.order.shipping))}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <span>{t.total}</span>
                  <span>{formatCurrency(Number(order.order.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Request Alert */}
          {order.order.cancellationStatus === 'requested' && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertTriangle className="h-5 w-5" />
                  Solicitud de Cancelación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-700">
                    <strong>Razón:</strong> {order.order.cancellationReason || 'No especificada'}
                  </p>
                  {order.order.cancelledAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Solicitado: {new Date(order.order.cancelledAt).toLocaleDateString('es-MX')}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCancellationRequest('approve', 'Aprobado por vendedor')}
                    disabled={isProcessingCancellation}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isProcessingCancellation ? 'Procesando...' : 'Aprobar y Reembolsar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCancellationRequest('reject', 'Rechazado - Orden ya en proceso')}
                    disabled={isProcessingCancellation}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </div>

                <p className="text-xs text-gray-600">
                  Si apruebas, se procesará un reembolso automático y se restaurará el inventario.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Shipping Actions */}
          {order.order.status !== 'cancelled' && order.order.status !== 'delivered' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {t.shippingActions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusUpdateForm
                  orderId={order.order.id}
                  currentStatus={order.order.status}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Customer & Shipping Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.customer}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.user?.name || t.guest}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Mail className="h-3 w-3" />
                  {order.user?.email || order.shippingAddress?.email || '-'}
                </p>
                {order.shippingAddress?.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t.shippingAddress}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress && (
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t.paymentInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.method}:</span>
                  <span className="font-medium capitalize">
                    {order.order.paymentMethod?.replace('_', ' ') || 'Tarjeta'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.status}:</span>
                  <Badge variant={order.order.paymentStatus === 'succeeded' ? 'default' : 'secondary'}>
                    {order.order.paymentStatus === 'succeeded' ? t.paid : t.pending}
                  </Badge>
                </div>
              </div>
              {order.order.paymentIntentId && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-600">{t.transactionId}:</p>
                  <div className="flex items-center gap-1 mt-1">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                      {order.order.paymentIntentId}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(order.order.paymentIntentId!);
                        toast.success(t.copiedToClipboard);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {order.order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t.notes}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{order.order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}