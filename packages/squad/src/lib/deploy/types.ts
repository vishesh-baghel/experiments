/**
 * Deploy Flow Types
 *
 * Type definitions for the agent deployment flow.
 */

// Deploy Steps

export type DeployStepId = "vercel-deploy";

export type DeployStepStatus = "pending" | "in-progress" | "completed" | "error";

export interface DeployStepState {
  id: DeployStepId;
  status: DeployStepStatus;
  error?: string;
}

// Deploy Session

export interface DeploySession {
  /** Agent being deployed */
  agentId: string;

  /** Current step in the flow */
  currentStep: DeployStepId;

  /** Step states */
  steps: DeployStepState[];

  /** Vercel deployment data from Deploy Button callback */
  vercel?: {
    projectName: string;
    projectDashboardUrl: string;
    deploymentUrl: string;
    deploymentDashboardUrl: string;
    repositoryUrl: string;
  };


  /** Deployment results */
  deployment?: {
    deploymentId: string;
    deploymentUrl: string;
    status: "building" | "ready" | "error";
  };

  /** Session timestamps */
  createdAt: number;
  expiresAt: number;
}

// Deploy Result

export interface DeployResult {
  success: boolean;
  deploymentUrl?: string;
  projectUrl?: string;
  repoUrl?: string;
  error?: string;
}

// API Response Types

export interface DeployStartResponse {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

export interface OAuthCallbackResponse {
  success: boolean;
  nextStep?: DeployStepId;
  error?: string;
}

export interface ProvisionResponse {
  success: boolean;
  forkedRepoUrl?: string;
  vercelProjectId?: string;
  vercelProjectUrl?: string;
  error?: string;
}

export interface DeployCreateResponse {
  success: boolean;
  deploymentId?: string;
  deploymentUrl?: string;
  error?: string;
}

export interface DeployStatusResponse {
  status: "building" | "ready" | "error" | "cancelled";
  deploymentUrl?: string;
  error?: string;
}

// Helper Functions

export const createInitialDeploySession = (agentId: string): DeploySession => {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;

  return {
    agentId,
    currentStep: "vercel-deploy",
    steps: [{ id: "vercel-deploy", status: "pending" }],
    createdAt: now,
    expiresAt: now + thirtyMinutes,
  };
};

export const getStepIndex = (stepId: DeployStepId): number => {
  return stepId === "vercel-deploy" ? 0 : -1;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getNextStep = (currentStep: DeployStepId): DeployStepId | null => {
  return null; // Only one step - kept for future multi-step flows
};

export const isSessionExpired = (session: DeploySession): boolean => {
  return Date.now() > session.expiresAt;
};
