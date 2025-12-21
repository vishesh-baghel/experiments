"use client";

import { useEffect } from "react";
import { trackDeployPageView } from "@/lib/analytics";

interface DeployPageTrackerProps {
  agentId: string;
  children: React.ReactNode;
}

export const DeployPageTracker = ({ agentId, children }: DeployPageTrackerProps) => {
  useEffect(() => {
    trackDeployPageView(agentId);
  }, [agentId]);

  return <>{children}</>;
};
