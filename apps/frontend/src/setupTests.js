import React from 'react';
import '@testing-library/jest-dom';
import { server } from './mocks/node.js';
// Silence unhandled promise rejections in test context (e.g., tinypool teardown)
if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', () => { });
}
// import 'whatwg-fetch'; // polyfill disabled for tests to prevent errors

// Vitest asset and CSS mocks
vi.mock('@/assets/images/luzimarket_logo_empleado.png', () => ({ default: 'mocked/path.png' }));
vi.mock('@/assets/images/luzimarket_logo.png', () => ({ default: 'mocked/path.png' }));
vi.mock('@/assets/images/bandera_mx.png', () => ({ default: 'mocked/path.png' }));
vi.mock('@/assets/images/notificacion.png', () => ({ default: 'mocked/path.png' }));
vi.mock('@/css/login.css', () => ({}));
vi.mock('@/css/navbar.css', () => ({}));

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
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Removed mocks for date_picker, petitioncard, and breadcrumb to use actual implementations
// MSW server setup disabled for testing to prevent worker thread issues
// import { server } from './mocks/node.js';
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());