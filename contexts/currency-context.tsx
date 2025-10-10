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

// Fallback exchange rate from MXN to USD
const FALLBACK_MXN_TO_USD_RATE = 0.059;

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('MXN');
  const [exchangeRate, setExchangeRate] = useState(FALLBACK_MXN_TO_USD_RATE);

  // Fetch exchange rate from API
  const fetchExchangeRate = async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem('mxn-usd-rate');
      const cacheTimestamp = localStorage.getItem('mxn-usd-rate-timestamp');

      if (cached && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < CACHE_DURATION) {
          setExchangeRate(parseFloat(cached));
          return;
        }
      }

      // Fetch fresh rate from API
      const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/mxn.json');
      const data = await response.json();

      if (data.mxn && data.mxn.usd) {
        const rate = data.mxn.usd;
        setExchangeRate(rate);

        // Cache the result
        localStorage.setItem('mxn-usd-rate', rate.toString());
        localStorage.setItem('mxn-usd-rate-timestamp', Date.now().toString());
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate, using fallback:', error);
      // Fallback rate is already set as default
    }
  };

  // Load currency preference from localStorage and fetch exchange rate
  useEffect(() => {
    const saved = localStorage.getItem('preferred-currency');
    if (saved === 'USD' || saved === 'MXN') {
      setCurrency(saved);
    }

    // Fetch exchange rate
    fetchExchangeRate();
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
      minimumFractionDigits: 2,
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