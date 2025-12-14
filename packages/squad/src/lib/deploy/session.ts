/**
 * Deploy Session Management
 *
 * Uses iron-session for encrypted cookie-based session storage.
 * Sessions are temporary and cleared after deployment completes.
 */

import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import {
  DeploySession,
  DeployStepId,
  createInitialDeploySession,
  isSessionExpired,
} from "./types";

// =============================================================================
// Session Configuration
// =============================================================================

const SESSION_NAME = "squad_deploy_session";

const getSessionOptions = (): SessionOptions => ({
  password: process.env.SESSION_SECRET || "fallback-secret-for-development-only",
  cookieName: SESSION_NAME,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 60, // 30 minutes
  },
});

// =============================================================================
// Session Interface
// =============================================================================

interface SessionData {
  deploy?: DeploySession;
}

// =============================================================================
// Session Operations
// =============================================================================

/**
 * Get the current deploy session
 */
export const getDeploySession = async (): Promise<DeploySession | null> => {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions()
  );

  if (!session.deploy) {
    return null;
  }

  // Check if session is expired
  if (isSessionExpired(session.deploy)) {
    await clearDeploySession();
    return null;
  }

  return session.deploy;
};

/**
 * Create a new deploy session
 */
export const createDeploySession = async (
  agentId: string
): Promise<DeploySession> => {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions()
  );

  const deploySession = createInitialDeploySession(agentId);
  session.deploy = deploySession;
  await session.save();

  return deploySession;
};

/**
 * Update the deploy session
 */
export const updateDeploySession = async (
  updates: Partial<DeploySession>
): Promise<DeploySession | null> => {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions()
  );

  if (!session.deploy) {
    return null;
  }

  session.deploy = {
    ...session.deploy,
    ...updates,
  };
  await session.save();

  return session.deploy;
};

/**
 * Update a specific step's status
 */
export const updateStepStatus = async (
  stepId: DeployStepId,
  status: "pending" | "in-progress" | "completed" | "error",
  error?: string
): Promise<DeploySession | null> => {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions()
  );

  if (!session.deploy) {
    return null;
  }

  session.deploy.steps = session.deploy.steps.map((step) =>
    step.id === stepId ? { ...step, status, error } : step
  );

  if (status === "in-progress") {
    session.deploy.currentStep = stepId;
  }

  await session.save();
  return session.deploy;
};

/**
 * Store Vercel OAuth tokens
 */
export const storeVercelTokens = async (
  accessToken: string,
  teamId?: string
): Promise<DeploySession | null> => {
  return updateDeploySession({
    vercel: { accessToken, teamId },
  });
};

/**
 * Store GitHub OAuth tokens
 */
export const storeGitHubTokens = async (
  accessToken: string,
  username: string
): Promise<DeploySession | null> => {
  return updateDeploySession({
    github: { accessToken, username },
  });
};

/**
 * Clear the deploy session
 */
export const clearDeploySession = async (): Promise<void> => {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions()
  );

  session.destroy();
};

/**
 * Check if session has required OAuth tokens for provisioning
 */
export const hasRequiredTokens = (session: DeploySession): boolean => {
  return !!(session.vercel?.accessToken && session.github?.accessToken);
};
