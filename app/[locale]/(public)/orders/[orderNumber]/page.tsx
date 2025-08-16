import { redirect } from "next/navigation";
import { setRequestLocale } from 'next-intl/server';
import { auth } from "@/lib/auth";
import { OrderDetailClient } from "@/components/orders/order-detail-client";
import { Suspense } from "react";
import GuestOrderDetailWrapper from "./guest-order-wrapper";

interface OrderDetailPageProps {
  params: Promise<{ locale: string; orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  
  const session = await auth();
  
  if (!session || !session.user) {
    // For guests, render a wrapper that reads email from query and fetches guest order
    return (
      <Suspense>
        <GuestOrderDetailWrapper orderNumber={orderNumber} locale={locale} />
      </Suspense>
    );
  }

  return <OrderDetailClient orderNumber={orderNumber} locale={locale} />;
}