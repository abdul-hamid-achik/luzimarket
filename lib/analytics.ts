"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

// Built-in event types
export type BuiltInEvents = 
  | "page_view"
  | "product_view"
  | "product_search" 
  | "add_to_cart"
  | "remove_from_cart"
  | "add_to_wishlist"
  | "remove_from_wishlist"
  | "purchase_initiated"
  | "purchase_completed"
  | "vendor_view"
  | "category_view"
  | "share_product"
  | "filter_applied"
  | "search_performed";

class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("luzimarket_analytics");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.events = data.events || [];
          this.userId = data.userId || null;
        } catch (error) {
          console.warn("Failed to load analytics from storage:", error);
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("luzimarket_analytics", JSON.stringify({
          events: this.events.slice(-100), // Keep only last 100 events
          userId: this.userId,
        }));
      } catch (error) {
        console.warn("Failed to save analytics to storage:", error);
      }
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
    this.saveToStorage();
  }

  public track(name: BuiltInEvents | string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        url: window.location.href,
        timestamp: Date.now(),
      },
      userId: this.userId || undefined,
      timestamp: Date.now(),
    };

    this.events.push(event);
    this.saveToStorage();

    // Send to analytics service (implement based on your provider)
    this.sendEvent(event);

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Analytics Event:", event);
    }
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      // Example: Send to your analytics API endpoint
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }).catch(() => {
        // Fail silently - don't block user experience
      });

      // Google Analytics 4 (if you use it)
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", event.name, {
          custom_map: event.properties,
          user_id: event.userId,
        });
      }
    } catch (error) {
      // Fail silently
    }
  }

  public getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  public clearEvents() {
    this.events = [];
    this.saveToStorage();
  }

  // Helper methods for common events
  public trackPageView(path: string, title?: string) {
    this.track("page_view", {
      path,
      title: title || document.title,
    });
  }

  public trackProductView(productId: string, productName: string, category?: string, vendor?: string) {
    this.track("product_view", {
      product_id: productId,
      product_name: productName,
      category,
      vendor,
    });
  }

  public trackSearch(query: string, resultsCount: number, filters?: Record<string, any>) {
    this.track("search_performed", {
      search_query: query,
      results_count: resultsCount,
      filters,
    });
  }

  public trackProductSearch(query: string, category?: string, resultsCount?: number) {
    this.track("product_search", {
      search_query: query,
      category,
      results_count: resultsCount,
    });
  }

  public trackAddToCart(productId: string, productName: string, quantity: number, price: number) {
    this.track("add_to_cart", {
      product_id: productId,
      product_name: productName,
      quantity,
      price,
      value: price * quantity,
    });
  }

  public trackRemoveFromCart(productId: string, productName: string, quantity: number) {
    this.track("remove_from_cart", {
      product_id: productId,
      product_name: productName,
      quantity,
    });
  }

  public trackWishlistAdd(productId: string, productName: string) {
    this.track("add_to_wishlist", {
      product_id: productId,
      product_name: productName,
    });
  }

  public trackWishlistRemove(productId: string, productName: string) {
    this.track("remove_from_wishlist", {
      product_id: productId,
      product_name: productName,
    });
  }

  public trackPurchase(orderId: string, orderValue: number, items: Array<{id: string, name: string, quantity: number, price: number}>) {
    this.track("purchase_completed", {
      order_id: orderId,
      order_value: orderValue,
      items: items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  }

  public trackVendorView(vendorId: string, vendorName: string) {
    this.track("vendor_view", {
      vendor_id: vendorId,
      vendor_name: vendorName,
    });
  }

  public trackShare(type: "product" | "vendor", id: string, name: string, platform?: string) {
    this.track("share_product", {
      share_type: type,
      item_id: id,
      item_name: name,
      platform,
    });
  }

  public trackFilterApplied(filters: Record<string, any>) {
    this.track("filter_applied", {
      filters,
    });
  }
}

// Singleton instance
export const analytics = Analytics.getInstance();

// Legacy functions for backward compatibility
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  analytics.track(eventName, properties);
};

export const trackPageView = (url: string) => {
  analytics.trackPageView(url);
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    console.error('Error tracked:', error, context);
    analytics.track('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }
};

// Performance metrics
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  const start = performance.now();
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
    });
  } else {
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }
};

// Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS((metric) => analytics.track('web_vital_cls', { value: metric.value }));
      onINP((metric) => analytics.track('web_vital_inp', { value: metric.value }));
      onFCP((metric) => analytics.track('web_vital_fcp', { value: metric.value }));
      onLCP((metric) => analytics.track('web_vital_lcp', { value: metric.value }));
      onTTFB((metric) => analytics.track('web_vital_ttfb', { value: metric.value }));
    });
  }
};

// React hooks for analytics
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    analytics.trackPageView(url);
  }, [pathname, searchParams]);
}

export function useAnalyticsUser(userId?: string) {
  useEffect(() => {
    if (userId) {
      analytics.setUserId(userId);
    }
  }, [userId]);
}
