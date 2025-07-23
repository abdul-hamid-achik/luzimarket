"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'MXN' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  convertPrice: (priceInMXN: number) => number;
  formatPrice: (price: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rate from MXN to USD (you might want to fetch this from an API)
const MXN_TO_USD_RATE = 0.059; // Approximately 1 USD = 17 MXN

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('MXN');
  const [exchangeRate] = useState(MXN_TO_USD_RATE);

  // Load currency preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('preferred-currency');
    if (saved === 'USD' || saved === 'MXN') {
      setCurrency(saved);
    }
  }, []);

  // Save currency preference to localStorage
  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferred-currency', newCurrency);
  };

  // Convert price from MXN to selected currency
  const convertPrice = (priceInMXN: number): number => {
    if (currency === 'USD') {
      return priceInMXN * exchangeRate;
    }
    return priceInMXN;
  };

  // Format price with currency symbol
  const formatPrice = (price: number): string => {
    const converted = convertPrice(price);
    return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency: handleSetCurrency, 
        exchangeRate,
        convertPrice,
        formatPrice 
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}