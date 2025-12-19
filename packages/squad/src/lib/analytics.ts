import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export const initPostHog = () => {
  if (typeof window === "undefined") return;
  if (initialized) return;
  if (!POSTHOG_KEY) {
    console.warn("PostHog key not configured");
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
  });

  initialized = true;
};

export type DeployEvent = {
  agentId: string;
  step: "vercel-auth" | "github-auth" | "provisioning" | "deploying";
  success: boolean;
  error?: string;
};

export const trackDeployStart = (agentId: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("deploy_started", { agent_id: agentId });
};

export const trackDeployStep = (event: DeployEvent) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("deploy_step", {
    agent_id: event.agentId,
    step: event.step,
    success: event.success,
    error: event.error,
  });
};

export const trackDeploySuccess = (agentId: string, deploymentUrl: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("deploy_success", {
    agent_id: agentId,
    deployment_url: deploymentUrl,
  });
};

export const trackDeployFailure = (agentId: string, step: string, error: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("deploy_failure", {
    agent_id: agentId,
    failed_step: step,
    error,
  });
};

export { posthog };
