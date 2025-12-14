/**
 * Deploy Types Tests
 */

import { describe, it, expect } from "vitest";
import {
  createInitialDeploySession,
  getStepIndex,
  getNextStep,
  isSessionExpired,
  DeploySession,
  DeployStepId,
} from "@/lib/deploy/types";

describe("createInitialDeploySession", () => {
  it("should create a session with the correct agentId", () => {
    const session = createInitialDeploySession("jack");
    expect(session.agentId).toBe("jack");
  });

  it("should start at github-auth step", () => {
    const session = createInitialDeploySession("jack");
    expect(session.currentStep).toBe("github-auth");
  });

  it("should have all steps in pending status", () => {
    const session = createInitialDeploySession("jack");
    expect(session.steps).toHaveLength(4);
    session.steps.forEach((step) => {
      expect(step.status).toBe("pending");
    });
  });

  it("should have correct step order", () => {
    const session = createInitialDeploySession("jack");
    const stepIds = session.steps.map((s) => s.id);
    expect(stepIds).toEqual([
      "github-auth",
      "vercel-auth",
      "provisioning",
      "deploying",
    ]);
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
  it("should return 0 for github-auth", () => {
    expect(getStepIndex("github-auth")).toBe(0);
  });

  it("should return 1 for vercel-auth", () => {
    expect(getStepIndex("vercel-auth")).toBe(1);
  });

  it("should return 2 for provisioning", () => {
    expect(getStepIndex("provisioning")).toBe(2);
  });

  it("should return 3 for deploying", () => {
    expect(getStepIndex("deploying")).toBe(3);
  });
});

describe("getNextStep", () => {
  it("should return vercel-auth after github-auth", () => {
    expect(getNextStep("github-auth")).toBe("vercel-auth");
  });

  it("should return provisioning after vercel-auth", () => {
    expect(getNextStep("vercel-auth")).toBe("provisioning");
  });

  it("should return deploying after provisioning", () => {
    expect(getNextStep("provisioning")).toBe("deploying");
  });

  it("should return null after deploying (last step)", () => {
    expect(getNextStep("deploying")).toBeNull();
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
