"use client";

import { 
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Mail,
  Phone,
  Copy,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import { useOrder } from "@/lib/hooks/use-orders";
import { useTranslations } from "next-intl";

interface OrderDetailClientProps {
  orderNumber: string;
  locale: string;
}

function OrderStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'shipped':
      return <Truck className="h-5 w-5 text-blue-600" />;
    case 'paid':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
}

function OrderStatusBadge({ status, t }: { status: string; t: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'paid':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return t('statuses.delivered');
      case 'shipped':
        return t('statuses.shipped');
      case 'paid':
        return t('statuses.paid');
      case 'cancelled':
        return t('statuses.cancelled');
      default:
        return t('statuses.pending');
    }
  };

  return (
    <Badge className={getStatusColor(status)}>
      <OrderStatusIcon status={status} />
      <span className="ml-2">{getStatusText(status)}</span>
    </Badge>
  );
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export function OrderDetailClient({ orderNumber, locale }: OrderDetailClientProps) {
  const t = useTranslations('orderDetail');
  const { data, isLoading, error, isError } = useOrder(orderNumber);

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-red-400 mx-auto mb-6" />
            <h3 className="text-xl font-times-now text-gray-900 mb-2">
              Error al cargar el pedido
            </h3>
            <p className="text-gray-600 font-univers mb-6">
              No se pudo cargar la información del pedido.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const order = data?.order;
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-times-now text-gray-900 mb-2">
              Pedido no encontrado
            </h3>
            <p className="text-gray-600 font-univers mb-6">
              No se pudo encontrar el pedido solicitado.
            </p>
            <Link href="/orders">
              <Button>Volver a pedidos</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const customerInfo = order.user ? {
    name: order.user.name,
    email: order.user.email,
    phone: null
  } : {
    name: order.guestName,
    email: order.guestEmail,
    phone: order.guestPhone
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/orders">
                <Button variant="outline" size="sm" className="font-univers">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('backToOrders')}
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-times-now text-gray-900">
                  {t('orderTitle')} {order.orderNumber}
                </h1>
                <p className="text-gray-600 font-univers mt-1">
                  {t('placedOn')} {new Date(order.createdAt).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <OrderStatusBadge status={order.status} t={t} />
          </div>

          {/* Order Progress */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              ['pending', 'paid', 'shipped', 'delivered'].includes(order.status) 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <CheckCircle className={`h-5 w-5 ${
                ['pending', 'paid', 'shipped', 'delivered'].includes(order.status) 
                  ? 'text-green-600' 
                  : 'text-gray-400'
              }`} />
              <div>
                <p className="font-univers font-medium text-sm">{t('progress.ordered')}</p>
                <p className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US')}</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              ['paid', 'shipped', 'delivered'].includes(order.status) 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <CreditCard className={`h-5 w-5 ${
                ['paid', 'shipped', 'delivered'].includes(order.status) 
                  ? 'text-green-600' 
                  : 'text-gray-400'
              }`} />
              <div>
                <p className="font-univers font-medium text-sm">{t('progress.paid')}</p>
                <p className="text-xs text-gray-600">
                  {order.paymentStatus === 'succeeded' ? t('completed') : t('pending')}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              ['shipped', 'delivered'].includes(order.status) 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <Truck className={`h-5 w-5 ${
                ['shipped', 'delivered'].includes(order.status) 
                  ? 'text-green-600' 
                  : 'text-gray-400'
              }`} />
              <div>
                <p className="font-univers font-medium text-sm">{t('progress.shipped')}</p>
                <p className="text-xs text-gray-600">
                  {order.trackingNumber ? order.trackingNumber : t('notYet')}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              order.status === 'delivered' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <Package className={`h-5 w-5 ${
                order.status === 'delivered' 
                  ? 'text-green-600' 
                  : 'text-gray-400'
              }`} />
              <div>
                <p className="font-univers font-medium text-sm">{t('progress.delivered')}</p>
                <p className="text-xs text-gray-600">
                  {order.actualDeliveryDate 
                    ? new Date(order.actualDeliveryDate).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US')
                    : order.estimatedDeliveryDate
                      ? new Date(order.estimatedDeliveryDate).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US')
                      : t('estimating')
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-times-now">{t('orderItems')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/products/${item.product.slug}`}
                        className="font-univers font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-600 font-univers mt-1">
                        {t('quantity')}: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600 font-univers">
                        {t('unitPrice')}: ${Number(item.price).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-times-now font-medium">
                        ${Number(item.total).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-times-now">{t('tracking.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-univers font-medium">{t('tracking.number')}</p>
                        <p className="text-sm text-gray-600 font-univers">{order.trackingNumber}</p>
                        {order.carrier && (
                          <p className="text-sm text-gray-600 font-univers">
                            {t('tracking.carrier')}: {order.carrier.toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(order.trackingNumber!)}
                        className="font-univers"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {t('tracking.copy')}
                      </Button>
                      <Button variant="outline" size="sm" className="font-univers">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t('tracking.track')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary & Details */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="font-times-now">{t('summary.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-univers">{t('summary.subtotal')}</span>
                  <span className="font-univers">${Number(order.subtotal).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-univers">{t('summary.shipping')}</span>
                  <span className="font-univers">${Number(order.shipping).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-univers">{t('summary.tax')}</span>
                  <span className="font-univers">${Number(order.tax).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-times-now font-medium">{t('summary.total')}</span>
                  <span className="font-times-now font-medium">${Number(order.total).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-times-now">{t('customer.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-univers">{customerInfo.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="font-univers">{customerInfo.email}</span>
                </div>
                {customerInfo.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span className="font-univers">{customerInfo.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendor Information */}
            <Card>
              <CardHeader>
              <CardTitle className="font-times-now">{t('Vendor.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-univers font-medium">{order.vendor.businessName}</p>
                  <p className="text-sm text-gray-600 font-univers">{order.vendor.email}</p>
                  {order.vendor.phone && (
                    <p className="text-sm text-gray-600 font-univers">{order.vendor.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-times-now">{t('shipping.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-600 mt-1" />
                    <div className="font-univers text-sm">
                      <p>{order.shippingAddress.street}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                      <p>{order.shippingAddress.postalCode}</p>
                      <p>{order.shippingAddress.country}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-times-now">{t('payment.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="font-univers font-medium">
                      {order.paymentStatus === 'succeeded' ? t('payment.completed') : t('payment.pending')}
                    </p>
                    {order.paymentIntentId && (
                      <p className="text-xs text-gray-600 font-univers">
                        ID: {order.paymentIntentId}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-times-now">{t('actions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.status === 'delivered' && (
                  <Button className="w-full font-univers">
                    {t('actions.buyAgain')}
                  </Button>
                )}
                <Button variant="outline" className="w-full font-univers">
                  {t('actions.downloadInvoice')}
                </Button>
                <Button variant="outline" className="w-full font-univers">
                  {t('actions.needHelp')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}