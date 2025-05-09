import '@testing-library/jest-dom';
import './setupTests.js';
// Add any global setup for Vitest here (e.g., msw setup, polyfills)
// Silence unhandled promise rejections (e.g., from tinypool termination)
if (typeof process !== 'undefined' && process && process.on) {
  process.on('unhandledRejection', () => { });
}

// Polyfill ResizeObserver for components using recharts
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
  }
}
