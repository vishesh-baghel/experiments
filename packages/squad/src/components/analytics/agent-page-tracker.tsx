"use client";

import { useEffect } from "react";
import { trackAgentPageView, trackDemoClick, trackSpecClick } from "@/lib/analytics";

interface AgentPageTrackerProps {
  agentId: string;
  children: React.ReactNode;
}

export const AgentPageTracker = ({ agentId, children }: AgentPageTrackerProps) => {
  useEffect(() => {
    trackAgentPageView(agentId);
  }, [agentId]);

  return <>{children}</>;
};

export const trackDemoLinkClick = (agentId: string, demoUrl: string) => {
  trackDemoClick(agentId, demoUrl);
};

export const trackSpecLinkClick = (agentId: string) => {
  trackSpecClick(agentId);
};
