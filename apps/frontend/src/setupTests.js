// Jest setup file for React Testing Library
import '@testing-library/jest-dom';
// Mock Service Worker setup
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());