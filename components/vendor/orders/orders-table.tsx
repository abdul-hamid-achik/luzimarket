"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Eye, Package, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  total: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
  customerName: string | null;
  customerEmail: string | null;
}

export function VendorOrdersTable() {
  const t = useTranslations("vendor.orders");
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/vendor/orders");
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = {
    pending: { label: t("status.pending"), color: "bg-gray-100 text-gray-800" },
    paid: { label: t("status.paid"), color: "bg-blue-100 text-blue-800" },
    processing: { label: t("status.processing"), color: "bg-yellow-100 text-yellow-800" },
    shipped: { label: t("status.shipped"), color: "bg-purple-100 text-purple-800" },
    delivered: { label: t("status.delivered"), color: "bg-green-100 text-green-800" },
    cancelled: { label: t("status.cancelled"), color: "bg-red-100 text-red-800" },
  };

  const paymentStatusConfig = {
    pending: { label: t("payment.pending"), color: "bg-yellow-100 text-yellow-800" },
    succeeded: { label: t("payment.succeeded"), color: "bg-green-100 text-green-800" },
    failed: { label: t("payment.failed"), color: "bg-red-100 text-red-800" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noOrders")}</h3>
        <p className="text-sm text-gray-600">{t("noOrdersDescription")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                {t("orderNumber")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                {t("customer")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                {t("items")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                {t("total")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                {t("status")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                {t("payment")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                {t("date")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const paymentStatus = paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig] || paymentStatusConfig.pending;

              return (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-univers font-medium text-gray-900">
                      #{order.orderNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-univers text-gray-900">
                        {order.customerName || t("guest")}
                      </div>
                      <div className="text-xs text-gray-500 font-univers">
                        {order.customerEmail || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 font-univers">
                      {order.itemCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-univers font-medium text-gray-900">
                      {formatCurrency(Number(order.total))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={status.color}>
                      {status.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={paymentStatus.color}>
                      {paymentStatus.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-univers">
                      {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(order.createdAt))}
                    </div>
                    <div className="text-xs text-gray-500 font-univers">
                      {new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(order.createdAt))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={{ pathname: "/vendor/orders/[id]", params: { id: order.id } }}>
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
  );
}