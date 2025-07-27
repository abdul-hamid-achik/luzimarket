import { redirect } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { User, Mail, Calendar, ShoppingBag, Heart, Settings, LogOut, Shield } from "lucide-react";
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

  const t = await getTranslations('account.page');
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
                  {userData.user?.name || t('user')}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-univers">
                  <Mail className="h-4 w-4" />
                  {userData.user?.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-univers">
                  <Calendar className="h-4 w-4" />
                  {t('memberSince')} {new Date(userData.user?.createdAt!).toLocaleDateString('es-MX')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-times-now text-gray-900">
                    {userData.stats.totalOrders}
                  </p>
                  <p className="text-xs text-gray-600 font-univers">{t('orders')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-times-now text-gray-900">
                    ${Number(userData.stats.totalSpent).toLocaleString('es-MX')}
                  </p>
                  <p className="text-xs text-gray-600 font-univers">{t('spent')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="overview" className="font-univers">
              {t('overview')}
            </TabsTrigger>
            <TabsTrigger value="orders" className="font-univers">
              {t('myOrders')}
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="font-univers">
              {t('wishlist')}
            </TabsTrigger>
            <TabsTrigger value="profile" className="font-univers">
              {t('profile')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-times-now">{t('quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/orders">
                    <Button variant="outline" className="w-full justify-start">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      {t('viewAllOrders')}
                    </Button>
                  </Link>
                  <Link href="/wishlist">
                    <Button variant="outline" className="w-full justify-start">
                      <Heart className="mr-2 h-4 w-4" />
                      {t('myWishlist')}
                    </Button>
                  </Link>
                  <Link href="/account?tab=profile">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('editProfile')}
                    </Button>
                  </Link>
                  <Link href="/account/security">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="mr-2 h-4 w-4" />
                      {t('security')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-times-now">{t('recentOrders')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {userData.recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-univers">{t('noOrdersYet')}</p>
                      <Link href="/products">
                        <Button className="mt-4">{t('startShopping')}</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userData.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-univers font-medium">{t('order')} #{order.orderNumber}</p>
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
                              {order.status === 'delivered' ? t('delivered') :
                               order.status === 'shipped' ? t('shipped') :
                               order.status === 'paid' ? t('paid') :
                               t('pending')}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="text-center pt-4">
                        <Link href="/orders">
                          <Button variant="outline">{t('viewAllOrdersButton')}</Button>
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
                <CardTitle className="text-lg font-times-now">{t('orderHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <OrdersList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-times-now">{t('myWishlistTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-univers mb-4">{t('wishlistEmpty')}</p>
                  <Link href="/products">
                    <Button>{t('exploreProducts')}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-times-now">{t('profileInfo')}</CardTitle>
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