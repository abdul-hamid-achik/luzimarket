import { redirect } from "next/navigation";
import { setRequestLocale } from 'next-intl/server';
import { auth } from "@/lib/auth";
import { OrdersPageClient } from "@/components/orders/orders-page-client";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/login");
  }

  return <OrdersPageClient locale={locale} />;
}