/**
 * Auto-mocked database client for Jest
 */
const mockFn = () => jest.fn();
export const db = {
  select: mockFn(),
  insert: mockFn(),
  update: mockFn(),
  delete: mockFn(),
};