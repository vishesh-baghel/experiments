/**
 * DeployProgress Component Tests
 *
 * Tests for the single-step deploy flow.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeployProgress } from "@/components/deploy/deploy-progress";
import { DeployStepState } from "@/lib/deploy/types";

const createSteps = (
  overrides: Partial<Record<string, Partial<DeployStepState>>> = {}
): DeployStepState[] => {
  const defaults: DeployStepState[] = [
    { id: "vercel-deploy", status: "pending" },
  ];

  return defaults.map((step) => ({
    ...step,
    ...overrides[step.id],
  }));
};

describe("DeployProgress", () => {
  it("should render the deploy step", () => {
    const steps = createSteps();
    render(<DeployProgress steps={steps} currentStep="vercel-deploy" />);

    expect(screen.getByText("deploy to vercel")).toBeInTheDocument();
  });

  it("should show completed icon for completed step", () => {
    const steps = createSteps({
      "vercel-deploy": { status: "completed" },
    });
    render(<DeployProgress steps={steps} currentStep="vercel-deploy" />);

    const completedIcons = screen.getAllByLabelText("Completed");
    expect(completedIcons).toHaveLength(1);
  });

  it("should show loading icon for in-progress step", () => {
    const steps = createSteps({
      "vercel-deploy": { status: "in-progress" },
    });
    render(<DeployProgress steps={steps} currentStep="vercel-deploy" />);

    expect(screen.getByLabelText("In progress")).toBeInTheDocument();
  });

  it("should show error icon and message for error step", () => {
    const steps = createSteps({
      "vercel-deploy": { status: "error", error: "Deployment failed" },
    });
    render(<DeployProgress steps={steps} currentStep="vercel-deploy" />);

    expect(screen.getByLabelText("Error")).toBeInTheDocument();
    expect(screen.getByText("Deployment failed")).toBeInTheDocument();
  });

  it("should mark current step with aria-current", () => {
    const steps = createSteps();
    render(<DeployProgress steps={steps} currentStep="vercel-deploy" />);

    const currentStep = screen.getByText("deploy to vercel").closest('[role="listitem"]');
    expect(currentStep).toHaveAttribute("aria-current", "step");
  });

  it("should have accessible list structure", () => {
    const steps = createSteps();
    render(<DeployProgress steps={steps} currentStep="vercel-deploy" />);

    expect(screen.getByRole("list", { name: "Deployment progress" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
