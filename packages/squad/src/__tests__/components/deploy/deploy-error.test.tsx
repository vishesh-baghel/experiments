/**
 * DeployError Component Tests
 *
 * Tests for the error display component in the deploy flow.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeployError } from "@/components/deploy/deploy-error";

describe("DeployError", () => {
  it("should render error message", () => {
    render(
      <DeployError type="deploy" message="Deployment failed" agentId="jack" />
    );

    expect(screen.getByText("Deployment failed")).toBeInTheDocument();
  });

  it("should render error title based on type", () => {
    render(
      <DeployError type="deploy" message="Error" agentId="jack" />
    );

    expect(screen.getByText("deployment failed")).toBeInTheDocument();
  });

  it("should render oauth error title", () => {
    render(
      <DeployError type="oauth" message="Auth error" agentId="jack" />
    );

    expect(screen.getByText("authentication failed")).toBeInTheDocument();
  });

  it("should render provision error title", () => {
    render(
      <DeployError type="provision" message="Provision error" agentId="jack" />
    );

    expect(screen.getByText("provisioning failed")).toBeInTheDocument();
  });

  it("should render unknown error title", () => {
    render(
      <DeployError type="unknown" message="Unknown error" agentId="jack" />
    );

    expect(screen.getByText("something went wrong")).toBeInTheDocument();
  });

  it("should call onRetry when retry button is clicked", () => {
    const handleRetry = vi.fn();
    render(
      <DeployError
        type="deploy"
        message="Failed"
        agentId="jack"
        onRetry={handleRetry}
      />
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("should not render retry button when onRetry is not provided", () => {
    render(
      <DeployError type="deploy" message="Failed" agentId="jack" />
    );

    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("should render go back link to agent page", () => {
    render(
      <DeployError type="deploy" message="Error" agentId="jack" />
    );

    const backLink = screen.getByRole("link", { name: /go back/i });
    expect(backLink).toHaveAttribute("href", "/jack");
  });

  it("should render help link for deploy errors", () => {
    render(
      <DeployError type="deploy" message="Error" agentId="jack" />
    );

    const helpLink = screen.getByRole("link", { name: /get help/i });
    expect(helpLink).toHaveAttribute("href", expect.stringContaining("vercel.com"));
  });

  it("should render help link for provision errors", () => {
    render(
      <DeployError type="provision" message="Error" agentId="jack" />
    );

    const helpLink = screen.getByRole("link", { name: /get help/i });
    expect(helpLink).toHaveAttribute("href", expect.stringContaining("vercel-status.com"));
  });

  it("should not render help link for unknown errors", () => {
    render(
      <DeployError type="unknown" message="Error" agentId="jack" />
    );

    expect(screen.queryByRole("link", { name: /get help/i })).not.toBeInTheDocument();
  });
});
