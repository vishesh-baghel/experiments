/**
 * Provision API Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/deploy/provision/route";


// Mock the deploy session module
vi.mock("@/lib/deploy/session", () => ({
  getDeploySession: vi.fn(),
  updateDeploySession: vi.fn(),
  updateStepStatus: vi.fn(),
  hasRequiredTokens: vi.fn(),
}));

// Mock fetch for GitHub and Vercel APIs
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import mocked functions
import {
  getDeploySession,
  updateDeploySession,
  updateStepStatus,
  hasRequiredTokens,
} from "@/lib/deploy/session";

// Test Setup

const createMockSession = () => ({
  agentId: "jack",
  currentStep: "provisioning" as const,
  steps: [
    { id: "vercel-auth" as const, status: "completed" as const },
    { id: "github-auth" as const, status: "completed" as const },
    { id: "provisioning" as const, status: "in-progress" as const },
    { id: "deploying" as const, status: "pending" as const },
  ],
  vercel: {
    accessToken: "vercel-token",
    teamId: "team-123",
  },
  github: {
    accessToken: "github-token",
    username: "testuser",
  },
  createdAt: Date.now(),
  expiresAt: Date.now() + 30 * 60 * 1000,
});

const createRequest = (body: object) => {
  return new NextRequest("http://localhost:3001/api/deploy/provision", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
};


describe("POST /api/deploy/provision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for unknown agent", async () => {
    vi.mocked(getDeploySession).mockResolvedValue(createMockSession());
    vi.mocked(hasRequiredTokens).mockReturnValue(true);

    const request = createRequest({ agentId: "unknown-agent" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Agent not found");
  });

  it("should return 401 when no session exists", async () => {
    vi.mocked(getDeploySession).mockResolvedValue(null);

    const request = createRequest({ agentId: "jack" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("No deploy session found");
  });

  it("should return 401 when tokens are missing", async () => {
    vi.mocked(getDeploySession).mockResolvedValue(createMockSession());
    vi.mocked(hasRequiredTokens).mockReturnValue(false);

    const request = createRequest({ agentId: "jack" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Missing OAuth tokens");
  });

  it("should successfully provision when all conditions are met", async () => {
    vi.mocked(getDeploySession).mockResolvedValue(createMockSession());
    vi.mocked(hasRequiredTokens).mockReturnValue(true);
    vi.mocked(updateStepStatus).mockResolvedValue(null);
    vi.mocked(updateDeploySession).mockResolvedValue(null);

    // Mock GitHub fork API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          full_name: "testuser/experiments",
          html_url: "https://github.com/testuser/experiments",
          clone_url: "https://github.com/testuser/experiments.git",
        }),
    });

    // Mock Vercel project creation API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "prj_123",
          name: "jack-agent",
        }),
    });

    const request = createRequest({ agentId: "jack" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.forkedRepoUrl).toBe("https://github.com/testuser/experiments");
    expect(data.vercelProjectId).toBe("prj_123");
  });

  it("should handle GitHub fork failure", async () => {
    vi.mocked(getDeploySession).mockResolvedValue(createMockSession());
    vi.mocked(hasRequiredTokens).mockReturnValue(true);
    vi.mocked(updateStepStatus).mockResolvedValue(null);

    // Mock GitHub fork API failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const request = createRequest({ agentId: "jack" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Failed to fork repository");
  });

  it("should handle existing fork gracefully", async () => {
    vi.mocked(getDeploySession).mockResolvedValue(createMockSession());
    vi.mocked(hasRequiredTokens).mockReturnValue(true);
    vi.mocked(updateStepStatus).mockResolvedValue(null);
    vi.mocked(updateDeploySession).mockResolvedValue(null);

    // Mock GitHub fork API - 422 (already exists)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
    });

    // Mock GitHub user API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ login: "testuser" }),
    });

    // Mock existing fork fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          full_name: "testuser/experiments",
          html_url: "https://github.com/testuser/experiments",
        }),
    });

    // Mock Vercel project creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "prj_123",
          name: "jack-agent",
        }),
    });

    const request = createRequest({ agentId: "jack" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
