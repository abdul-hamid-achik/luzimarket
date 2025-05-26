import React from 'react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { server } from './mocks/node.js';
// Silence unhandled promise rejections in test context (e.g., tinypool teardown)
if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', () => { });
}
// import 'whatwg-fetch'; // polyfill disabled for tests to prevent errors

// Mock browser APIs that might not be available in test environment
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn(),
    pushState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:5173/',
    origin: 'http://localhost:5173',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn(),
    assign: vi.fn(),
    replace: vi.fn(),
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Vitest asset and CSS mocks
vi.mock('@/assets/images/luzimarket_logo_empleado.png', () => ({ default: 'mocked/path.png' }));
vi.mock('@/assets/images/luzimarket_logo.png', () => ({ default: 'mocked/path.png' }));
vi.mock('@/assets/images/bandera_mx.png', () => ({ default: 'mocked/path.png' }));
vi.mock('@/assets/images/notificacion.png', () => ({ default: 'mocked/path.png' }));
vi.mock('@/css/login.css', () => ({}));
vi.mock('@/css/navbar.css', () => ({}));
vi.mock('@/pages/inicio/css/handpicked.css', () => ({}));
vi.mock('@/pages/inicio/css/category.css', () => ({}));

// Mock dashboard chart/card dependencies if needed
vi.mock('@/components/re_charts/chart_annual', () => ({ default: () => null }));
vi.mock('@/components/re_charts/chart_total_ear', () => ({ default: () => null }));
vi.mock('@/components/re_charts/chart_overview', () => ({ default: () => null }));

// Mock additional components to simplify page tests
vi.mock('@/components/re_charts/recharts_ventas', () => ({ default: () => null }));
// Mock react-slick Slider component
vi.mock('react-slick', () => ({
  __esModule: true,
  default: ({ children }) => React.createElement('div', null, children),
}));

// Setup MSW server for all tests
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  // Clear all mocks after each test
  vi.clearAllMocks();

  // Comprehensive DOM cleanup
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Clear all timers
  vi.clearAllTimers();

  // Reset any global state
  if (typeof window !== 'undefined') {
    // Only reset history if the method exists
    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState({}, '', '/');
    }
    // Clear sessionStorage and localStorage
    window.sessionStorage.clear();
    window.localStorage.clear();
  }

  // Force garbage collection of React components
  if (global.gc) {
    global.gc();
  }
});
afterAll(() => server.close());

// Removed mocks for date_picker, petitioncard, and breadcrumb to use actual implementations
// MSW server setup disabled for testing to prevent worker thread issues
// import { server } from './mocks/node.js';
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());