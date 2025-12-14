/**
 * DeployProgress Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeployProgress } from "@/components/deploy/deploy-progress";
import { DeployStepState } from "@/lib/deploy/types";

const createSteps = (
  overrides: Partial<Record<string, Partial<DeployStepState>>> = {}
): DeployStepState[] => {
  const defaults: DeployStepState[] = [
    { id: "vercel-auth", status: "pending" },
    { id: "github-auth", status: "pending" },
    { id: "provisioning", status: "pending" },
    { id: "deploying", status: "pending" },
  ];

  return defaults.map((step) => ({
    ...step,
    ...overrides[step.id],
  }));
};

describe("DeployProgress", () => {
  it("should render all four steps", () => {
    const steps = createSteps();
    render(<DeployProgress steps={steps} currentStep="vercel-auth" />);

    expect(screen.getByText("connect vercel")).toBeInTheDocument();
    expect(screen.getByText("connect github")).toBeInTheDocument();
    expect(screen.getByText("provision services")).toBeInTheDocument();
    expect(screen.getByText("deploy")).toBeInTheDocument();
  });

  it("should show completed icon for completed steps", () => {
    const steps = createSteps({
      "vercel-auth": { status: "completed" },
    });
    render(<DeployProgress steps={steps} currentStep="github-auth" />);

    const completedIcons = screen.getAllByLabelText("Completed");
    expect(completedIcons).toHaveLength(1);
  });

  it("should show loading icon for in-progress step", () => {
    const steps = createSteps({
      "vercel-auth": { status: "in-progress" },
    });
    render(<DeployProgress steps={steps} currentStep="vercel-auth" />);

    expect(screen.getByLabelText("In progress")).toBeInTheDocument();
  });

  it("should show error icon and message for error step", () => {
    const steps = createSteps({
      "vercel-auth": { status: "error", error: "Connection failed" },
    });
    render(<DeployProgress steps={steps} currentStep="vercel-auth" />);

    expect(screen.getByLabelText("Error")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("should mark current step with aria-current", () => {
    const steps = createSteps();
    render(<DeployProgress steps={steps} currentStep="github-auth" />);

    const currentStep = screen.getByText("connect github").closest('[role="listitem"]');
    expect(currentStep).toHaveAttribute("aria-current", "step");
  });

  it("should have accessible list structure", () => {
    const steps = createSteps();
    render(<DeployProgress steps={steps} currentStep="vercel-auth" />);

    expect(screen.getByRole("list", { name: "Deployment progress" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });
});
