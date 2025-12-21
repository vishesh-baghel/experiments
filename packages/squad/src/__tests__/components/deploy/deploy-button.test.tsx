/**
 * DeployButton Component Tests
 *
 * Tests for the deploy button used in the deploy flow.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeployButton } from "@/components/deploy/deploy-button";
import * as analytics from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackDeployButtonClick: vi.fn(),
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, "open", {
  value: mockWindowOpen,
  writable: true,
});

describe("DeployButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with deploy to vercel label", () => {
    render(<DeployButton agentId="jack" />);

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("deploy to vercel")).toBeInTheDocument();
  });

  it("should be disabled when disabled prop is true", () => {
    render(<DeployButton agentId="jack" disabled />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should open vercel deploy URL in new tab on click", () => {
    render(<DeployButton agentId="jack" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining("/api/deploy/vercel/deploy"),
      "_blank"
    );
  });

  it("should include agentId in URL", () => {
    render(<DeployButton agentId="jack" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining("agentId=jack"),
      "_blank"
    );
  });

  it("should call onStart callback when provided", () => {
    const handleStart = vi.fn();
    render(<DeployButton agentId="jack" onStart={handleStart} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleStart).toHaveBeenCalled();
  });

  it("should not open URL when disabled", () => {
    render(<DeployButton agentId="jack" disabled />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockWindowOpen).not.toHaveBeenCalled();
  });

  it("should have accessible aria-label", () => {
    render(<DeployButton agentId="jack" />);

    expect(screen.getByLabelText("Deploy to Vercel")).toBeInTheDocument();
  });

  it("should track analytics when button is clicked", () => {
    render(<DeployButton agentId="jack" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(analytics.trackDeployButtonClick).toHaveBeenCalledWith("jack");
    expect(analytics.trackDeployButtonClick).toHaveBeenCalledTimes(1);
  });

  it("should track analytics before opening window", () => {
    render(<DeployButton agentId="jack" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(analytics.trackDeployButtonClick).toHaveBeenCalled();
    expect(mockWindowOpen).toHaveBeenCalled();
  });

  it("should not track analytics when button is disabled", () => {
    render(<DeployButton agentId="jack" disabled />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(analytics.trackDeployButtonClick).not.toHaveBeenCalled();
  });
});
