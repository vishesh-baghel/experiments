import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { DeployPageTracker } from "@/components/analytics/deploy-page-tracker";
import * as analytics from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackDeployPageView: vi.fn(),
}));

describe("DeployPageTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should track deploy page view on mount", () => {
    render(
      <DeployPageTracker agentId="jack">
        <div>Deploy content</div>
      </DeployPageTracker>
    );

    expect(analytics.trackDeployPageView).toHaveBeenCalledWith("jack");
    expect(analytics.trackDeployPageView).toHaveBeenCalledTimes(1);
  });

  it("should render children correctly", () => {
    const { getByText } = render(
      <DeployPageTracker agentId="jack">
        <div>Deploy content</div>
      </DeployPageTracker>
    );

    expect(getByText("Deploy content")).toBeInTheDocument();
  });

  it("should not interfere with child component functionality", () => {
    const handleClick = vi.fn();
    const { getByRole } = render(
      <DeployPageTracker agentId="jack">
        <button onClick={handleClick}>Deploy</button>
      </DeployPageTracker>
    );

    const button = getByRole("button");
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(analytics.trackDeployPageView).toHaveBeenCalledWith("jack");
  });
});
