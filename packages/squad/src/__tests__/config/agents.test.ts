/**
 * Agent Configuration Tests
 *
 * Tests for agent configuration validation and helper functions.
 */

import { describe, it, expect } from "vitest";
import {
  agents,
  getAgentById,
  jackAgent,
  sensieAgent,
} from "@/config/agents";

describe("agents configuration", () => {
  describe("agents array", () => {
    it("should have at least one agent", () => {
      expect(agents.length).toBeGreaterThan(0);
    });

    it("should have unique agent ids", () => {
      const ids = agents.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have valid status for all agents", () => {
      agents.forEach((agent) => {
        expect(["available", "coming-soon"]).toContain(agent.status);
      });
    });

    it("should have required fields for all agents", () => {
      agents.forEach((agent) => {
        expect(agent.id).toBeTruthy();
        expect(agent.name).toBeTruthy();
        expect(agent.tagline).toBeTruthy();
        expect(agent.description).toBeTruthy();
        expect(agent.features).toBeInstanceOf(Array);
        expect(agent.requirements).toBeInstanceOf(Array);
        expect(agent.sourceRepo).toBeTruthy();
        expect(agent.integrations).toBeInstanceOf(Array);
        expect(agent.envVars).toBeInstanceOf(Array);
        expect(agent.deployInstructions).toBeInstanceOf(Array);
        expect(agent.guideSteps).toBeInstanceOf(Array);
      });
    });
  });

  describe("getAgentById", () => {
    it("should return jack agent for id 'jack'", () => {
      const agent = getAgentById("jack");
      expect(agent).toBeDefined();
      expect(agent?.id).toBe("jack");
      expect(agent?.name).toBe("jack");
    });

    it("should return sensie agent for id 'sensie'", () => {
      const agent = getAgentById("sensie");
      expect(agent).toBeDefined();
      expect(agent?.id).toBe("sensie");
      expect(agent?.name).toBe("sensie");
    });

    it("should return undefined for unknown agent id", () => {
      const agent = getAgentById("nonexistent");
      expect(agent).toBeUndefined();
    });

    it("should be case-sensitive", () => {
      const agent = getAgentById("JACK");
      expect(agent).toBeUndefined();
    });
  });

  describe("jackAgent", () => {
    it("should have status 'available'", () => {
      expect(jackAgent.status).toBe("available");
    });

    it("should have prisma integration", () => {
      expect(jackAgent.integrations).toContain("prisma");
    });

    it("should have required environment variables", () => {
      const envKeys = jackAgent.envVars.map((v) => v.key);
      expect(envKeys).toContain("DATABASE_URL");
      expect(envKeys).toContain("AI_GATEWAY_API_KEY");
    });

    it("should have valid sourceRepo URL", () => {
      expect(jackAgent.sourceRepo).toMatch(/^https:\/\/github\.com\//);
    });

    it("should have demoUrl", () => {
      expect(jackAgent.demoUrl).toBeTruthy();
    });

    it("should have at least 3 features", () => {
      expect(jackAgent.features.length).toBeGreaterThanOrEqual(3);
    });

    it("should have at least 2 requirements", () => {
      expect(jackAgent.requirements.length).toBeGreaterThanOrEqual(2);
    });

    it("should have deploy instructions", () => {
      expect(jackAgent.deployInstructions.length).toBeGreaterThan(0);
    });

    it("should have guide steps", () => {
      expect(jackAgent.guideSteps.length).toBeGreaterThan(0);
    });
  });

  describe("sensieAgent", () => {
    it("should have status 'coming-soon'", () => {
      expect(sensieAgent.status).toBe("coming-soon");
    });

    it("should have valid sourceRepo URL", () => {
      expect(sensieAgent.sourceRepo).toMatch(/^https:\/\/github\.com\//);
    });
  });

  describe("envVars configuration", () => {
    it("should have valid source for all env vars", () => {
      agents.forEach((agent) => {
        agent.envVars.forEach((envVar) => {
          expect(["integration", "user", "generated"]).toContain(envVar.source);
        });
      });
    });

    it("should have integration specified for integration-sourced env vars", () => {
      agents.forEach((agent) => {
        agent.envVars
          .filter((v) => v.source === "integration")
          .forEach((envVar) => {
            expect(envVar.integration).toBeTruthy();
          });
      });
    });

    it("should have description for all env vars", () => {
      agents.forEach((agent) => {
        agent.envVars.forEach((envVar) => {
          expect(envVar.description).toBeTruthy();
        });
      });
    });
  });

  describe("requirements configuration", () => {
    it("should have name, cost, and description for all requirements", () => {
      agents.forEach((agent) => {
        agent.requirements.forEach((req) => {
          expect(req.name).toBeTruthy();
          expect(req.cost).toBeTruthy();
          expect(req.description).toBeTruthy();
        });
      });
    });
  });

  describe("guideSteps configuration", () => {
    it("should have title and description for all guide steps", () => {
      agents.forEach((agent) => {
        agent.guideSteps.forEach((step) => {
          expect(step.title).toBeTruthy();
          expect(step.description).toBeTruthy();
        });
      });
    });

    it("should have valid link structure if link is present", () => {
      agents.forEach((agent) => {
        agent.guideSteps
          .filter((step) => step.link)
          .forEach((step) => {
            expect(step.link?.text).toBeTruthy();
            expect(step.link?.url).toMatch(/^https?:\/\//);
          });
      });
    });
  });
});
