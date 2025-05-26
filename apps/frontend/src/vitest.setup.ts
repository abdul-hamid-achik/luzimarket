import '@testing-library/jest-dom';
import { act } from 'react';
import { vi } from 'vitest';
import './setupTests.js';

// Make React.act available globally for tests
global.act = act;

// Log session information for debugging
const sessionId = process.env.VITEST_SESSION_ID || 'unknown';
const isCI = process.env.CI === 'true';
console.log(`🎨 Frontend test session: ${sessionId} (CI: ${isCI})`);
if (isCI) {
  console.log('📁 Frontend coverage will be output to tmp/test-results/test-session-' + sessionId + '/coverage/frontend/');
}

// Set up jsdom environment polyfills
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

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
