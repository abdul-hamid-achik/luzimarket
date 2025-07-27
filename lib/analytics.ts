// Performance monitoring and analytics utilities

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Add your analytics provider here (e.g., Google Analytics, Mixpanel, etc.)
    console.log('Track event:', eventName, properties);
  }
};

export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Track page views
    console.log('Page view:', url);
  }
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    // Error tracking (e.g., Sentry)
    console.error('Error tracked:', error, context);
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
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
};
