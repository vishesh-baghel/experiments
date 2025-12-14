/**
 * Vitest Setup
 *
 * Global test setup and mocks.
 */

import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock next/headers for server-side tests
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock environment variables
process.env.SESSION_SECRET = "test-secret-32-characters-long!";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";
process.env.VERCEL_CLIENT_ID = "test-vercel-client-id";
process.env.VERCEL_CLIENT_SECRET = "test-vercel-client-secret";
process.env.GITHUB_CLIENT_ID = "test-github-client-id";
process.env.GITHUB_CLIENT_SECRET = "test-github-client-secret";
process.env.SOURCE_REPO_OWNER = "vishesh-baghel";
process.env.SOURCE_REPO_NAME = "experiments";
