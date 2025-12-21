/**
 * PostHog Analytics
 *
 * Tracks user behavior and deployment metrics for Squad.
 *
 * Events tracked:
 * - Page views (agent pages, deploy pages, guide pages)
 * - Agent interactions (view details, try demo, start deploy)
 * - Deploy flow (start, success, failure, guide view)
 * - User engagement (time on page, scroll depth)
 */

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

// Page View Events

export const trackPageView = (pageName: string, properties?: Record<string, unknown>) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("$pageview", {
    page_name: pageName,
    url: window.location.href,
    ...properties,
  });
};

export const trackAgentPageView = (agentId: string) => {
  trackPageView("agent_detail", { agent_id: agentId });
};

export const trackDeployPageView = (agentId: string) => {
  trackPageView("deploy_flow", { agent_id: agentId });
};

export const trackGuidePageView = (agentId: string) => {
  trackPageView("setup_guide", { agent_id: agentId });
};

// Agent Interaction Events

export const trackAgentCardClick = (agentId: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("agent_card_clicked", { agent_id: agentId });
};

export const trackDemoClick = (agentId: string, demoUrl: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("demo_clicked", {
    agent_id: agentId,
    demo_url: demoUrl,
  });
};

export const trackSpecClick = (agentId: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("spec_clicked", { agent_id: agentId });
};

// Deploy Flow Events

export const trackDeployStart = (agentId: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("deploy_started", { agent_id: agentId });
};

export const trackDeployButtonClick = (agentId: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("deploy_button_clicked", { agent_id: agentId });
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

export const trackGuideStepView = (agentId: string, stepIndex: number, stepTitle: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("guide_step_viewed", {
    agent_id: agentId,
    step_index: stepIndex,
    step_title: stepTitle,
  });
};

export const trackGuideComplete = (agentId: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("guide_completed", { agent_id: agentId });
};

// External Link Events

export const trackExternalLinkClick = (linkType: string, url: string, agentId?: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("external_link_clicked", {
    link_type: linkType,
    url,
    agent_id: agentId,
  });
};

// Error Events

export const trackError = (errorType: string, errorMessage: string, context?: Record<string, unknown>) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("error_occurred", {
    error_type: errorType,
    error_message: errorMessage,
    ...context,
  });
};

export { posthog };
