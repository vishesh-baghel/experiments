/**
 * Deploy Flow Types
 *
 * Type definitions for the agent deployment flow.
 */

// Deploy Steps

export type DeployStepId =
  | "github-auth"
  | "vercel-auth"
  | "provisioning"
  | "deploying";

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

  /** Vercel OAuth data (temporary, cleared after deployment) */
  vercel?: {
    accessToken: string;
    teamId?: string;
  };

  /** GitHub OAuth data (temporary, cleared after deployment) */
  github?: {
    accessToken: string;
    username: string;
  };

  /** Provisioning results */
  provisioning?: {
    forkedRepoUrl?: string;
    vercelProjectId?: string;
    vercelProjectUrl?: string;
    neonDbProvisioned?: boolean;
    aiGatewayProvisioned?: boolean;
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
    currentStep: "github-auth",
    steps: [
      { id: "github-auth", status: "pending" },
      { id: "vercel-auth", status: "pending" },
      { id: "provisioning", status: "pending" },
      { id: "deploying", status: "pending" },
    ],
    createdAt: now,
    expiresAt: now + thirtyMinutes,
  };
};

export const getStepIndex = (stepId: DeployStepId): number => {
  const order: DeployStepId[] = [
    "github-auth",
    "vercel-auth",
    "provisioning",
    "deploying",
  ];
  return order.indexOf(stepId);
};

export const getNextStep = (currentStep: DeployStepId): DeployStepId | null => {
  const order: DeployStepId[] = [
    "github-auth",
    "vercel-auth",
    "provisioning",
    "deploying",
  ];
  const currentIndex = order.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === order.length - 1) {
    return null;
  }
  return order[currentIndex + 1];
};

export const isSessionExpired = (session: DeploySession): boolean => {
  return Date.now() > session.expiresAt;
};
