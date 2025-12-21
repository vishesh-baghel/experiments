"use client";

import { useEffect } from "react";
import { trackGuidePageView } from "@/lib/analytics";

interface GuidePageTrackerProps {
  agentId: string;
  children: React.ReactNode;
}

export const GuidePageTracker = ({ agentId, children }: GuidePageTrackerProps) => {
  useEffect(() => {
    trackGuidePageView(agentId);
  }, [agentId]);

  return <>{children}</>;
};
