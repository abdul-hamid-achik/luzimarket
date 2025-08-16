"use client";

import { useSearchParams } from "next/navigation";
import { OrderDetailClient } from "@/components/orders/order-detail-client";
import { useGuestOrder } from "@/lib/hooks/use-orders";

export default function GuestOrderDetailWrapper({ orderNumber, locale }: { orderNumber: string; locale: string }) {
  const params = useSearchParams();
  const email = params.get("email");

  // Pre-fetch to ensure access; OrderDetailClient expects useOrder, but we only need the UI
  useGuestOrder(orderNumber, email);

  return <OrderDetailClient orderNumber={orderNumber} locale={locale} />;
}


