"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Calendar, CreditCard, Eye, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

interface Order {
  id: string;
  orderNumber: string;
  total: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items?: Array<{
    id: string;
    quantity: number;
    price: string;
    product?: {
      name: string;
      images: string[];
    };
  }>;
}

interface OrdersListProps {
  userId: string;
}

export function OrdersList({ userId }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
        return 'Entregado';
      case 'shipped':
        return 'Enviado';
      case 'paid':
        return 'Pagado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-univers">No tienes pedidos aún</p>
        <Link href="/products">
          <Button className="mt-4">Comenzar a comprar</Button>
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
                  Pedido #{order.orderNumber}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleDateString('es-MX')}
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {order.paymentStatus === 'succeeded' ? 'Pagado' : 'Pendiente'}
                  </div>
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
                    +{order.items.length - 3} más
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Actions */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center gap-3">
              <Link href={`/orders/${order.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalles
                </Button>
              </Link>
              
              {order.status === 'delivered' && (
                <Button variant="outline" size="sm">
                  Comprar de nuevo
                </Button>
              )}

              {order.status === 'shipped' && (
                <Button variant="outline" size="sm">
                  <Truck className="h-4 w-4 mr-2" />
                  Rastrear
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}