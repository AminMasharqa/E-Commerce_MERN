/**
 * @jest-environment node
 */

// This file is used for global Jest setup and is not a test file itself

// Increase timeout for all tests
jest.setTimeout(300000);

// Global setup for tests
beforeAll(() => {
  // Global test setup if needed
});

afterAll(() => {
  // Global test cleanup if needed
});

// Export an empty object to keep TypeScript happy
export {};