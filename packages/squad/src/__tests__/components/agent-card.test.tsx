/**
 * AgentCard Component Tests
 *
 * Tests for the agent card component displayed on the homepage.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentCard } from "@/components/agent-card";
import { AgentConfig } from "@/config/agents";

const createMockAgent = (overrides: Partial<AgentConfig> = {}): AgentConfig => ({
  id: "test-agent",
  name: "test agent",
  tagline: "a test agent for testing",
  description: "this is a test agent used for unit testing",
  features: [
    { title: "feature 1", description: "first feature" },
    { title: "feature 2", description: "second feature" },
  ],
  requirements: [
    { name: "vercel account", cost: "free", description: "for hosting" },
  ],
  sourceRepo: "https://github.com/test/repo",
  sourcePath: "packages/test-agent",
  integrations: ["prisma"],
  envVars: [
    { key: "DATABASE_URL", source: "integration", integration: "prisma", description: "db url", required: true },
  ],
  deployInstructions: [
    { step: 1, title: "deploy", description: "click deploy" },
  ],
  guideSteps: [
    { title: "verify", description: "verify deployment" },
  ],
  status: "available",
  estimatedMonthlyCost: "~$10/month",
  demoUrl: "https://demo.example.com",
  specUrl: "https://spec.example.com",
  ...overrides,
});

describe("AgentCard", () => {
  it("should render agent name", () => {
    const agent = createMockAgent({ name: "jack" });
    render(<AgentCard agent={agent} />);

    expect(screen.getByText("jack")).toBeInTheDocument();
  });

  it("should render agent tagline", () => {
    const agent = createMockAgent({ tagline: "x content agent" });
    render(<AgentCard agent={agent} />);

    expect(screen.getByText(/x content agent/)).toBeInTheDocument();
  });

  it("should not show status badge for available agents", () => {
    const agent = createMockAgent({ status: "available" });
    render(<AgentCard agent={agent} />);

    expect(screen.queryByText("coming soon")).not.toBeInTheDocument();
  });

  it("should render 'coming soon' badge for coming-soon agents", () => {
    const agent = createMockAgent({ status: "coming-soon" });
    render(<AgentCard agent={agent} />);

    expect(screen.getByText("coming soon")).toBeInTheDocument();
  });

  it("should link to agent page for available agents", () => {
    const agent = createMockAgent({ id: "jack", status: "available" });
    render(<AgentCard agent={agent} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/jack");
  });

  it("should not be a link for coming-soon agents", () => {
    const agent = createMockAgent({ status: "coming-soon" });
    render(<AgentCard agent={agent} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("should render estimated monthly cost with 'to run' suffix", () => {
    const agent = createMockAgent({ estimatedMonthlyCost: "~$15/month" });
    render(<AgentCard agent={agent} />);

    expect(screen.getByText(/~\$15\/month/)).toBeInTheDocument();
    expect(screen.getByText(/to run/)).toBeInTheDocument();
  });

  it("should show 'learn more' for available agents", () => {
    const agent = createMockAgent({ status: "available" });
    render(<AgentCard agent={agent} />);

    expect(screen.getByText("learn more")).toBeInTheDocument();
  });

  it("should not show 'learn more' for coming-soon agents", () => {
    const agent = createMockAgent({ status: "coming-soon" });
    render(<AgentCard agent={agent} />);

    expect(screen.queryByText("learn more")).not.toBeInTheDocument();
  });
});
