import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { GuidePageTracker } from "@/components/analytics/guide-page-tracker";
import * as analytics from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackGuidePageView: vi.fn(),
}));

describe("GuidePageTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should track guide page view on mount", () => {
    render(
      <GuidePageTracker agentId="jack">
        <div>Guide content</div>
      </GuidePageTracker>
    );

    expect(analytics.trackGuidePageView).toHaveBeenCalledWith("jack");
    expect(analytics.trackGuidePageView).toHaveBeenCalledTimes(1);
  });

  it("should render children correctly", () => {
    const { getByText } = render(
      <GuidePageTracker agentId="jack">
        <div>Guide content</div>
      </GuidePageTracker>
    );

    expect(getByText("Guide content")).toBeInTheDocument();
  });

  it("should not interfere with guide step interactions", () => {
    const handleStepClick = vi.fn();
    const { getByText } = render(
      <GuidePageTracker agentId="jack">
        <div>
          <button onClick={handleStepClick}>Step 1</button>
        </div>
      </GuidePageTracker>
    );

    const button = getByText("Step 1");
    button.click();

    expect(handleStepClick).toHaveBeenCalledTimes(1);
    expect(analytics.trackGuidePageView).toHaveBeenCalledWith("jack");
  });
});
