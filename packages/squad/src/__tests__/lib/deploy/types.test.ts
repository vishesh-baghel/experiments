/**
 * Deploy Types Tests
 *
 * Tests for the single-step deploy flow:
 * 1. vercel-deploy (via Deploy Button - handles repo cloning)
 */

import { describe, it, expect } from "vitest";
import {
  createInitialDeploySession,
  getStepIndex,
  getNextStep,
  isSessionExpired,
} from "@/lib/deploy/types";

describe("createInitialDeploySession", () => {
  it("should create a session with the correct agentId", () => {
    const session = createInitialDeploySession("jack");
    expect(session.agentId).toBe("jack");
  });

  it("should start at vercel-deploy step", () => {
    const session = createInitialDeploySession("jack");
    expect(session.currentStep).toBe("vercel-deploy");
  });

  it("should have 1 step in pending status", () => {
    const session = createInitialDeploySession("jack");
    expect(session.steps).toHaveLength(1);
    session.steps.forEach((step) => {
      expect(step.status).toBe("pending");
    });
  });

  it("should have correct step", () => {
    const session = createInitialDeploySession("jack");
    const stepIds = session.steps.map((s) => s.id);
    expect(stepIds).toEqual(["vercel-deploy"]);
  });

  it("should set expiry to 30 minutes from now", () => {
    const before = Date.now();
    const session = createInitialDeploySession("jack");
    const after = Date.now();

    const thirtyMinutes = 30 * 60 * 1000;
    expect(session.expiresAt).toBeGreaterThanOrEqual(before + thirtyMinutes);
    expect(session.expiresAt).toBeLessThanOrEqual(after + thirtyMinutes);
  });

  it("should set createdAt to current time", () => {
    const before = Date.now();
    const session = createInitialDeploySession("jack");
    const after = Date.now();

    expect(session.createdAt).toBeGreaterThanOrEqual(before);
    expect(session.createdAt).toBeLessThanOrEqual(after);
  });
});

describe("getStepIndex", () => {
  it("should return 0 for vercel-deploy", () => {
    expect(getStepIndex("vercel-deploy")).toBe(0);
  });
});

describe("getNextStep", () => {
  it("should return null after vercel-deploy (only step)", () => {
    expect(getNextStep("vercel-deploy")).toBeNull();
  });
});

describe("isSessionExpired", () => {
  it("should return false for a fresh session", () => {
    const session = createInitialDeploySession("jack");
    expect(isSessionExpired(session)).toBe(false);
  });

  it("should return true for an expired session", () => {
    const session = createInitialDeploySession("jack");
    // Set expiry to the past
    session.expiresAt = Date.now() - 1000;
    expect(isSessionExpired(session)).toBe(true);
  });

  it("should return false for a session about to expire", () => {
    const session = createInitialDeploySession("jack");
    // Set expiry to 1 second from now
    session.expiresAt = Date.now() + 1000;
    expect(isSessionExpired(session)).toBe(false);
  });
});
