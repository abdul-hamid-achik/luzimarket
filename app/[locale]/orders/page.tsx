import { redirect } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Package, Calendar, CreditCard, Truck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

async function getUserOrders(userId: string) {
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
    with: {
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  return userOrders;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/login");
  }

  const t = await getTranslations('Orders');
  const userOrders = await getUserOrders(session.user.id);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'paid':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-times-now text-gray-900 mb-2">Mis Pedidos</h1>
          <p className="text-gray-600 font-univers">
            Historial completo de tus compras y estado de envíos
          </p>
        </div>

        {/* Breadcrumb */}
        <nav className="text-sm font-univers mb-8">
          <ol className="flex items-center gap-2 text-gray-600">
            <li><Link href={`/${locale}`} className="hover:text-black">Inicio</Link></li>
            <li>/</li>
            <li><Link href={`/${locale}/account`} className="hover:text-black">Mi cuenta</Link></li>
            <li>/</li>
            <li className="text-black">Pedidos</li>
          </ol>
        </nav>

        {/* Orders List */}
        {userOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-times-now text-gray-900 mb-2">
                No tienes pedidos aún
              </h3>
              <p className="text-gray-600 font-univers mb-6">
                Cuando realices tu primera compra, aparecerá aquí
              </p>
              <Link href={`/${locale}/products`}>
                <Button className="bg-black text-white hover:bg-gray-800">
                  Comenzar a comprar
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {userOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-times-now">
                        Pedido #{order.orderNumber}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 font-univers">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.createdAt!).toLocaleDateString('es-MX')}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          {order.paymentStatus === 'succeeded' ? 'Pagado' : 'Pendiente'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusText(order.status)}</span>
                        </Badge>
                      </div>
                      <p className="text-lg font-times-now">
                        ${Number(order.total).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* Order Items */}
                  <div className="space-y-4">
                    <h4 className="font-univers font-medium text-gray-900">
                      Artículos ({order.items?.length || 0})
                    </h4>
                    <div className="space-y-3">
                      {order.items?.map((item) => {
                        const images = item.product?.images as string[] || [];
                        return (
                          <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="h-16 w-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                              {images[0] ? (
                                <Image
                                  src={images[0]}
                                  alt={item.product?.name || 'Producto'}
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
                            <div className="flex-1">
                              <h5 className="font-univers font-medium text-gray-900">
                                {item.product?.name || 'Producto eliminado'}
                              </h5>
                              <p className="text-sm text-gray-600 font-univers">
                                Cantidad: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-univers font-medium">
                                ${Number(item.price).toLocaleString('es-MX')}
                              </p>
                              <p className="text-sm text-gray-600 font-univers">
                                c/u
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t">
                    <Link href={`/${locale}/orders/${order.id}`}>
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
                    
                    {(order.status === 'pending' || order.status === 'paid') && (
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                        Cancelar pedido
                      </Button>
                    )}

                    {order.status === 'shipped' && (
                      <Link href={`/${locale}/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Truck className="h-4 w-4 mr-2" />
                          Rastrear envío
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}