import { redirect } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { User, Mail, Calendar, ShoppingBag, Heart, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ProfileForm } from "@/components/account/profile-form";
import { OrdersList } from "@/components/account/orders-list";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

async function getUserData(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const userOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const orderStats = await db
    .select({
      totalOrders: sql<number>`count(*)`,
      totalSpent: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(eq(orders.userId, userId));

  return {
    user,
    recentOrders: userOrders,
    stats: orderStats[0] || { totalOrders: 0, totalSpent: 0 },
  };
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/login");
  }

  const t = await getTranslations('Account');
  const userData = await getUserData(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-times-now text-gray-900">
                  {userData.user?.name || 'Usuario'}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-univers">
                  <Mail className="h-4 w-4" />
                  {userData.user?.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-univers">
                  <Calendar className="h-4 w-4" />
                  Miembro desde {new Date(userData.user?.createdAt!).toLocaleDateString('es-MX')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-times-now text-gray-900">
                    {userData.stats.totalOrders}
                  </p>
                  <p className="text-xs text-gray-600 font-univers">Pedidos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-times-now text-gray-900">
                    ${Number(userData.stats.totalSpent).toLocaleString('es-MX')}
                  </p>
                  <p className="text-xs text-gray-600 font-univers">Gastado</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="overview" className="font-univers">
              Resumen
            </TabsTrigger>
            <TabsTrigger value="orders" className="font-univers">
              Mis Pedidos
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="font-univers">
              Lista de Deseos
            </TabsTrigger>
            <TabsTrigger value="profile" className="font-univers">
              Perfil
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-times-now">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/orders">
                    <Button variant="outline" className="w-full justify-start">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Ver todos mis pedidos
                    </Button>
                  </Link>
                  <Link href="/wishlist">
                    <Button variant="outline" className="w-full justify-start">
                      <Heart className="mr-2 h-4 w-4" />
                      Mi lista de deseos
                    </Button>
                  </Link>
                  <Link href="/account?tab=profile">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Editar perfil
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-times-now">Pedidos Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {userData.recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-univers">No tienes pedidos aún</p>
                      <Link href="/products">
                        <Button className="mt-4">Comenzar a comprar</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userData.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-univers font-medium">Pedido #{order.orderNumber}</p>
                            <p className="text-sm text-gray-600 font-univers">
                              {new Date(order.createdAt!).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-univers font-medium">
                              ${Number(order.total).toLocaleString('es-MX')}
                            </p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-univers ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'paid' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'delivered' ? 'Entregado' :
                               order.status === 'shipped' ? 'Enviado' :
                               order.status === 'paid' ? 'Pagado' :
                               'Pendiente'}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="text-center pt-4">
                        <Link href="/orders">
                          <Button variant="outline">Ver todos los pedidos</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-times-now">Historial de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <OrdersList userId={session.user.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-times-now">Mi Lista de Deseos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-univers mb-4">Tu lista de deseos está vacía</p>
                  <Link href="/products">
                    <Button>Explorar productos</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-times-now">Información del Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm user={userData.user!} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}