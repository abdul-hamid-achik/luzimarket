"use client";

import { useCurrency } from "@/contexts/currency-context";

export function useFormatPrice() {
  const { formatPrice } = useCurrency();
  return formatPrice;
}