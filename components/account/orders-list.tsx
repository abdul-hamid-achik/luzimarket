"use client";

import { useState } from "react";
import { Package, Calendar, CreditCard, Eye, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import { useOrders } from "@/lib/hooks/use-orders";
import { useTranslations } from "next-intl";

interface OrdersListProps {
  searchParams?: {
    search?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: string;
  };
}

export function OrdersList({ searchParams = {} }: OrdersListProps) {
  const t = useTranslations('Orders');
  
  const { data, isLoading, error } = useOrders({
    search: searchParams.search,
    status: searchParams.status as any,
    from: searchParams.from,
    to: searchParams.to,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (error) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 font-univers mb-4">
          {t('error.loading')}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          {t('error.retry')}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const orders = data?.orders || [];

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-univers">{t('noOrders.description')}</p>
        <Link href="/products">
          <Button className="mt-4">{t('noOrders.startShopping')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Order Header */}
          <div className="bg-gray-50 p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-univers font-medium">
                  {t('orderNumber')} {order.orderNumber}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleDateString('es-MX')}
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {order.paymentStatus === 'succeeded' ? t('paid') : t('pending')}
                  </div>
                  {order.vendor && (
                    <p className="text-sm text-gray-600 font-univers">
                      {order.vendor.businessName}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
                <p className="font-times-now text-lg mt-1">
                  ${Number(order.total).toLocaleString('es-MX')}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items Preview */}
          {order.items && order.items.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-3">
                {order.items.slice(0, 3).map((item, index) => {
                  const images = item.product?.images as string[] || [];
                  return (
                    <div key={item.id} className="h-12 w-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {images[0] ? (
                        <Image
                          src={images[0]}
                          alt={item.product?.name || 'Producto'}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {order.items.length > 3 && (
                  <div className="text-sm text-gray-600 font-univers">
                    +{order.items.length - 3} {t('moreItems')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Actions */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center gap-3">
              <Link href={`/orders/${order.orderNumber}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  {t('viewDetails')}
                </Button>
              </Link>
              
              {order.status === 'delivered' && (
                <Button variant="outline" size="sm">
                  {t('actions.buyAgain')}
                </Button>
              )}

              {order.status === 'shipped' && (
                <Button variant="outline" size="sm">
                  <Truck className="h-4 w-4 mr-2" />
                  {t('track')}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}