"use client";

import { useState } from "react";
import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { exportToCSV, formatDate, formatOrderStatus, formatPaymentStatus } from "@/lib/utils/export";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  total: string;
  status: string;
  paymentStatus: string | null;
  shippingAddress: any;
  createdAt: Date | null;
  userName: string | null;
  userEmail: string | null;
  itemCount: number;
}

interface AdminOrdersClientProps {
  orders: Order[];
  translations: Record<string, string>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
}

export function AdminOrdersClient({ orders, translations: t, updateOrderStatus }: AdminOrdersClientProps) {
  const [isExporting, setIsExporting] = useState(false);
  const locale = useLocale();

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const paymentStatusColors: Record<string, string> = {
    succeeded: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };

  const handleExport = () => {
    setIsExporting(true);

    const columns = [
      { key: 'orderNumber', header: 'Número de Orden' },
      { key: 'userName', header: t.customer },
      { key: 'userEmail', header: 'Email' },
      { key: 'total', header: 'Total', formatter: (value: string) => formatCurrency(Number(value)) },
      { key: 'itemCount', header: t.items },
      { key: 'status', header: t.status, formatter: formatOrderStatus },
      { key: 'paymentStatus', header: t.payment, formatter: formatPaymentStatus },
      { key: 'createdAt', header: t.date, formatter: formatDate },
    ];

    const filename = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(orders, columns, filename);

    setTimeout(() => setIsExporting(false), 1000);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-univers text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            {t.subtitle}
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? t.exporting : t.exportCSV}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries({
          pending: t.statusPending || "Pendientes",
          paid: t.statusPaid || "Pagadas",
          shipped: t.statusShipped || "Enviadas",
          delivered: t.statusDelivered || "Entregadas",
          cancelled: t.statusCancelled || "Canceladas",
        }).map(([status, label]) => {
          const count = orders.filter(o => o.status === status).length;
          return (
            <div key={status} className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-univers text-gray-600">{label}</p>
              <p className="text-2xl font-univers font-semibold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.orderNumber}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.customer}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.total}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.items}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.payment}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.date}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const shippingAddress = order.shippingAddress as any;
                return (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-univers font-medium text-gray-900">
                        #{order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-univers">
                        {order.userName || t.guest}
                      </div>
                      <div className="text-xs text-gray-500 font-univers">
                        {order.userEmail || shippingAddress?.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-univers">
                        {formatCurrency(Number(order.total))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-univers">
                        {order.itemCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusSelect
                        orderId={order.id}
                        currentStatus={order.status}
                        onStatusChange={updateOrderStatus}
                        statusColors={statusColors}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-univers ${order.paymentStatus ? paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {order.paymentStatus === 'succeeded' ? t.paymentSucceeded :
                          order.paymentStatus === 'failed' ? t.paymentFailed :
                            t.paymentPending}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-univers">
                        {order.createdAt ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(order.createdAt)) : '-'}
                      </div>
                      <div className="text-xs text-gray-500 font-univers">
                        {order.createdAt ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(order.createdAt)) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={{ pathname: '/admin/orders/[id]', params: { id: order.id } } as any}>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}