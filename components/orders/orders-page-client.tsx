"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package, 
  Calendar, 
  CreditCard, 
  Eye, 
  Truck, 
  Filter,
  Search,
  Download,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import { useOrders } from "@/lib/hooks/use-orders";
import { useTranslations } from "next-intl";

const filterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'all']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

interface OrdersPageClientProps {
  locale: string;
}

export function OrdersPageClient({ locale }: OrdersPageClientProps) {
  const t = useTranslations('orders');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get current filters from URL
  const currentFilters = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') as any || 'all',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    page: parseInt(searchParams.get('page') || '1'),
  };

  // Fetch orders with React Query
  const { data, isLoading, error, isError } = useOrders(currentFilters);

  // Setup form for filters
  const form = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: currentFilters.search,
      status: currentFilters.status,
      from: currentFilters.from,
      to: currentFilters.to,
    },
  });

  // Handle filter changes
  const onFiltersChange = (formData: FilterFormData) => {
    const params = new URLSearchParams();
    
    // Only add non-empty values to URL
    Object.entries(formData).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filters change
    if (params.toString()) {
      params.set('page', '1');
    }

    // Update URL
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

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

  const OrderStatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'paid':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-red-400 mx-auto mb-6" />
            <h3 className="text-xl font-times-now text-gray-900 mb-2">
              {t('error.loading')}
            </h3>
            <Button onClick={() => window.location.reload()} variant="outline">
              {t('error.retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/account">
                <Button variant="outline" size="sm" className="font-univers">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('backToAccount')}
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-times-now text-gray-900">
                  {t('title')}
                </h1>
                <p className="text-gray-600 font-univers mt-1">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <Button variant="outline" className="font-univers">
              <Download className="h-4 w-4 mr-2" />
              {t('exportOrders')}
            </Button>
          </div>

          {/* Filters */}
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onFiltersChange)}
              className="grid grid-cols-1 md:grid-cols-5 gap-4"
            >
              <FormField
                control={form.control}
                name="search"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          placeholder={t('filters.searchPlaceholder')}
                          className="pl-10 font-univers"
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-submit on search
                            const timer = setTimeout(() => {
                              form.handleSubmit(onFiltersChange)();
                            }, 500);
                            return () => clearTimeout(timer);
                          }}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      value={field.value || 'all'}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.handleSubmit(onFiltersChange)();
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="font-univers">
                          <SelectValue placeholder={t('filters.statusPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                        <SelectItem value="pending">{t('statuses.pending')}</SelectItem>
                        <SelectItem value="paid">{t('statuses.paid')}</SelectItem>
                        <SelectItem value="shipped">{t('statuses.shipped')}</SelectItem>
                        <SelectItem value="delivered">{t('statuses.delivered')}</SelectItem>
                        <SelectItem value="cancelled">{t('statuses.cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        placeholder={t('filters.fromDate')}
                        className="font-univers"
                        onChange={(e) => {
                          field.onChange(e);
                          form.handleSubmit(onFiltersChange)();
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        placeholder={t('filters.toDate')}
                        className="font-univers"
                        onChange={(e) => {
                          field.onChange(e);
                          form.handleSubmit(onFiltersChange)();
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="font-univers">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </form>
          </Form>
        </div>

        {/* Orders Content */}
        {isLoading ? (
          <OrdersLoadingSkeleton />
        ) : (
          <OrdersContent data={data} t={t} locale={locale} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  );
}

function OrdersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32"></TableHead>
                <TableHead className="w-32"></TableHead>
                <TableHead className="w-24"></TableHead>
                <TableHead className="w-24"></TableHead>
                <TableHead className="w-20"></TableHead>
                <TableHead className="w-24"></TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      
      <div className="block md:hidden space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OrdersContent({ 
  data, 
  t, 
  locale, 
  onPageChange 
}: { 
  data: any; 
  t: any; 
  locale: string;
  onPageChange: (page: number) => void;
}) {
  const orders = data?.orders || [];
  const pagination = data?.pagination;

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

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
        <h3 className="text-xl font-times-now text-gray-900 mb-2">
          {t('noOrders.title')}
        </h3>
        <p className="text-gray-600 font-univers mb-6 max-w-sm mx-auto">
          {t('noOrders.description')}
        </p>
        <Link href="/products">
          <Button size="lg" className="font-univers">
            {t('noOrders.startShopping')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Order Cards */}
      <div className="block md:hidden space-y-4">
        {orders.map((order: any) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-univers">
                    {t('orderNumber')} {order.orderNumber}
                  </CardTitle>
                  <p className="text-sm text-gray-600 font-univers mt-1">
                    {order.vendor.businessName}
                  </p>
                  <p className="text-xs text-gray-500 font-univers">
                    {new Date(order.createdAt).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Order Items Preview */}
              <div className="flex items-center gap-3">
                {order.items.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
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
                ))}
                {order.items.length > 3 && (
                  <div className="text-sm text-gray-600 font-univers">
                    +{order.items.length - 3} {t('moreItems')}
                  </div>
                )}
              </div>

              {/* Order Total and Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-lg font-times-now text-gray-900">
                    ${Number(order.total).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}
                  </p>
                  <p className="text-xs text-gray-600 font-univers">
                    {order.items.length} {order.items.length === 1 ? t('item') : t('items')}
                  </p>
                </div>
                <Link href={`/orders/${order.orderNumber}`}>
                  <Button variant="outline" size="sm" className="font-univers">
                    <Eye className="h-4 w-4 mr-2" />
                    {t('viewDetails')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-univers">{t('table.order')}</TableHead>
              <TableHead className="font-univers">{t('table.vendor')}</TableHead>
              <TableHead className="font-univers">{t('table.items')}</TableHead>
              <TableHead className="font-univers">{t('table.date')}</TableHead>
              <TableHead className="font-univers">{t('table.status')}</TableHead>
              <TableHead className="font-univers">{t('table.total')}</TableHead>
              <TableHead className="font-univers">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-univers font-medium">
                    {order.orderNumber}
                  </div>
                  <div className="text-xs text-gray-500 font-univers">
                    {order.paymentStatus === 'succeeded' ? t('paid') : t('pending')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-univers text-sm">
                    {order.vendor.businessName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 2).map((item: any) => (
                        <div key={item.id} className="h-8 w-8 bg-gray-100 rounded-full overflow-hidden border-2 border-white">
                          {item.product.images[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              width={32}
                              height={32}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="h-3 w-3 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-univers text-gray-600">
                      {order.items.length} {order.items.length === 1 ? t('item') : t('items')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-univers">
                    {new Date(order.createdAt).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US')}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-times-now font-medium">
                    ${Number(order.total).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/orders/${order.orderNumber}`}>
                      <Button variant="outline" size="sm" className="font-univers">
                        <Eye className="h-4 w-4 mr-1" />
                        {t('view')}
                      </Button>
                    </Link>
                    {order.status === 'shipped' && (
                      <Button variant="outline" size="sm" className="font-univers">
                        <Truck className="h-4 w-4 mr-1" />
                        {t('track')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 font-univers">
            {t('pagination.showing')} {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} {t('pagination.of')} {pagination.totalCount}
          </p>
          <div className="flex items-center gap-2">
            {pagination.hasPrev && (
              <Button 
                variant="outline" 
                size="sm" 
                className="font-univers"
                onClick={() => onPageChange(pagination.currentPage - 1)}
              >
                {t('pagination.previous')}
              </Button>
            )}
            {pagination.hasNext && (
              <Button 
                variant="outline" 
                size="sm" 
                className="font-univers"
                onClick={() => onPageChange(pagination.currentPage + 1)}
              >
                {t('pagination.next')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}