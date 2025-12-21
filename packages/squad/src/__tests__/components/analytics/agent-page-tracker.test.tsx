import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { AgentPageTracker } from "@/components/analytics/agent-page-tracker";
import * as analytics from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackAgentPageView: vi.fn(),
  trackDemoClick: vi.fn(),
  trackSpecClick: vi.fn(),
}));

describe("AgentPageTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should track page view on mount", () => {
    render(
      <AgentPageTracker agentId="jack">
        <div>Test content</div>
      </AgentPageTracker>
    );

    expect(analytics.trackAgentPageView).toHaveBeenCalledWith("jack");
    expect(analytics.trackAgentPageView).toHaveBeenCalledTimes(1);
  });

  it("should render children correctly", () => {
    const { getByText } = render(
      <AgentPageTracker agentId="jack">
        <div>Test content</div>
      </AgentPageTracker>
    );

    expect(getByText("Test content")).toBeInTheDocument();
  });

  it("should track page view with different agent IDs", () => {
    const { rerender } = render(
      <AgentPageTracker agentId="jack">
        <div>Content</div>
      </AgentPageTracker>
    );

    expect(analytics.trackAgentPageView).toHaveBeenCalledWith("jack");

    rerender(
      <AgentPageTracker agentId="squad">
        <div>Content</div>
      </AgentPageTracker>
    );

    expect(analytics.trackAgentPageView).toHaveBeenCalledWith("squad");
    expect(analytics.trackAgentPageView).toHaveBeenCalledTimes(2);
  });

  it("should not interfere with application rendering", () => {
    const { container } = render(
      <AgentPageTracker agentId="jack">
        <div className="test-class">
          <button>Click me</button>
        </div>
      </AgentPageTracker>
    );

    expect(container.querySelector(".test-class")).toBeInTheDocument();
    expect(container.querySelector("button")).toBeInTheDocument();
  });
});
