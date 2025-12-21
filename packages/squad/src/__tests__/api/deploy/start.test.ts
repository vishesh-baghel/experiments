/**
 * Deploy Start API Endpoint Tests
 *
 * Tests for POST /api/deploy/start
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/deploy/start/route";
import { NextRequest } from "next/server";

// Mock the session module
vi.mock("@/lib/deploy/session", () => ({
  getDeploySession: vi.fn(),
  createDeploySession: vi.fn(),
}));

// Mock the agents config
vi.mock("@/config/agents", () => ({
  getAgentById: vi.fn(),
}));

import { getDeploySession, createDeploySession } from "@/lib/deploy/session";
import { getAgentById } from "@/config/agents";

const mockGetDeploySession = vi.mocked(getDeploySession);
const mockCreateDeploySession = vi.mocked(createDeploySession);
const mockGetAgentById = vi.mocked(getAgentById);

const createRequest = (body: object): NextRequest => {
  return new NextRequest("http://localhost:3001/api/deploy/start", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

describe("POST /api/deploy/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 if agent not found", async () => {
    mockGetAgentById.mockReturnValue(undefined);

    const request = createRequest({ agentId: "nonexistent" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Agent not found");
  });

  it("should return 400 if agent is coming-soon", async () => {
    mockGetAgentById.mockReturnValue({
      id: "sensie",
      name: "sensie",
      status: "coming-soon",
    } as ReturnType<typeof getAgentById>);

    const request = createRequest({ agentId: "sensie" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Agent not available for deployment");
  });

  it("should create new session if none exists", async () => {
    const mockAgent = {
      id: "jack",
      name: "jack",
      status: "available",
    } as ReturnType<typeof getAgentById>;

    const mockSession = {
      agentId: "jack",
      currentStep: "vercel-deploy",
      steps: [{ id: "vercel-deploy", status: "pending" }],
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    };

    mockGetAgentById.mockReturnValue(mockAgent);
    mockGetDeploySession.mockResolvedValue(null);
    mockCreateDeploySession.mockResolvedValue(mockSession as ReturnType<typeof createDeploySession> extends Promise<infer T> ? T : never);

    const request = createRequest({ agentId: "jack" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.session).toEqual(mockSession);
    expect(mockCreateDeploySession).toHaveBeenCalledWith("jack");
  });

  it("should return existing session if agentId matches", async () => {
    const mockAgent = {
      id: "jack",
      name: "jack",
      status: "available",
    } as ReturnType<typeof getAgentById>;

    const mockSession = {
      agentId: "jack",
      currentStep: "vercel-deploy",
      steps: [{ id: "vercel-deploy", status: "pending" }],
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    };

    mockGetAgentById.mockReturnValue(mockAgent);
    mockGetDeploySession.mockResolvedValue(mockSession as Awaited<ReturnType<typeof getDeploySession>>);

    const request = createRequest({ agentId: "jack" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.session).toEqual(mockSession);
    expect(mockCreateDeploySession).not.toHaveBeenCalled();
  });

  it("should create new session if agentId changed", async () => {
    const mockAgent = {
      id: "jack",
      name: "jack",
      status: "available",
    } as ReturnType<typeof getAgentById>;

    const existingSession = {
      agentId: "sensie",
      currentStep: "vercel-deploy",
      steps: [{ id: "vercel-deploy", status: "pending" }],
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    };

    const newSession = {
      agentId: "jack",
      currentStep: "vercel-deploy",
      steps: [{ id: "vercel-deploy", status: "pending" }],
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    };

    mockGetAgentById.mockReturnValue(mockAgent);
    mockGetDeploySession.mockResolvedValue(existingSession as Awaited<ReturnType<typeof getDeploySession>>);
    mockCreateDeploySession.mockResolvedValue(newSession as Awaited<ReturnType<typeof createDeploySession>>);

    const request = createRequest({ agentId: "jack" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.session.agentId).toBe("jack");
    expect(mockCreateDeploySession).toHaveBeenCalledWith("jack");
  });

  it("should create new session if step count is stale", async () => {
    const mockAgent = {
      id: "jack",
      name: "jack",
      status: "available",
    } as ReturnType<typeof getAgentById>;

    const staleSession = {
      agentId: "jack",
      currentStep: "github-auth",
      steps: [
        { id: "github-auth", status: "pending" },
        { id: "vercel-auth", status: "pending" },
        { id: "provisioning", status: "pending" },
        { id: "deploying", status: "pending" },
      ],
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    };

    const newSession = {
      agentId: "jack",
      currentStep: "vercel-deploy",
      steps: [{ id: "vercel-deploy", status: "pending" }],
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    };

    mockGetAgentById.mockReturnValue(mockAgent);
    mockGetDeploySession.mockResolvedValue(staleSession as Awaited<ReturnType<typeof getDeploySession>>);
    mockCreateDeploySession.mockResolvedValue(newSession as Awaited<ReturnType<typeof createDeploySession>>);

    const request = createRequest({ agentId: "jack" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.session.steps).toHaveLength(1);
    expect(mockCreateDeploySession).toHaveBeenCalledWith("jack");
  });

  it("should return 500 on unexpected error", async () => {
    mockGetAgentById.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const request = createRequest({ agentId: "jack" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Database connection failed");
  });
});
