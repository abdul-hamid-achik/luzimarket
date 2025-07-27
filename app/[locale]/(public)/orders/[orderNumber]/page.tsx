import { redirect } from "next/navigation";
import { setRequestLocale } from 'next-intl/server';
import { auth } from "@/lib/auth";
import { OrderDetailClient } from "@/components/orders/order-detail-client";

interface OrderDetailPageProps {
  params: Promise<{ locale: string; orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/login");
  }

  return <OrderDetailClient orderNumber={orderNumber} locale={locale} />;
}