/**
 * Deploy Create API Endpoint
 *
 * Handles the deployment step:
 * 1. Set environment variables
 * 2. Trigger deployment
 * 3. Return deployment URL
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getDeploySession,
  updateDeploySession,
  updateStepStatus,
  clearDeploySession,
} from "@/lib/deploy/session";
import { getAgentById } from "@/config/agents";

// =============================================================================
// Configuration
// =============================================================================

const VERCEL_API_URL = "https://api.vercel.com";

// =============================================================================
// Types
// =============================================================================

interface DeployCreateRequest {
  agentId: string;
  projectId: string;
}

interface VercelDeploymentResponse {
  id: string;
  url: string;
  readyState: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

const setEnvironmentVariables = async (
  vercelToken: string,
  projectId: string,
  envVars: Record<string, string>,
  teamId?: string
): Promise<void> => {
  const url = new URL(`${VERCEL_API_URL}/v10/projects/${projectId}/env`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  // Set each env var
  for (const [key, value] of Object.entries(envVars)) {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        type: "encrypted",
        target: ["production", "preview", "development"],
      }),
    });

    if (!response.ok) {
      // Ignore "already exists" errors
      const errorData = await response.json().catch(() => ({}));
      if (!errorData.error?.code?.includes("ENV_ALREADY_EXISTS")) {
        console.warn(`Failed to set env var ${key}:`, errorData);
      }
    }
  }
};

const triggerDeployment = async (
  vercelToken: string,
  projectId: string,
  teamId?: string
): Promise<VercelDeploymentResponse> => {
  const url = new URL(`${VERCEL_API_URL}/v13/deployments`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectId,
      project: projectId,
      target: "production",
      gitSource: {
        type: "github",
        ref: "main",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to trigger deployment: ${errorText}`);
  }

  return response.json();
};

const waitForDeployment = async (
  vercelToken: string,
  deploymentId: string,
  teamId?: string,
  maxWaitMs: number = 300000 // 5 minutes
): Promise<{ url: string; status: string }> => {
  const startTime = Date.now();
  const pollInterval = 3000; // 3 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const url = new URL(`${VERCEL_API_URL}/v13/deployments/${deploymentId}`);
    if (teamId) {
      url.searchParams.set("teamId", teamId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to check deployment status");
    }

    const data = await response.json();

    if (data.readyState === "READY") {
      return {
        url: `https://${data.url}`,
        status: "ready",
      };
    }

    if (data.readyState === "ERROR" || data.readyState === "CANCELED") {
      throw new Error(`Deployment failed: ${data.readyState}`);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Deployment timed out");
};

const generatePassphrase = (): string => {
  // Generate a random passphrase
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let passphrase = "";
  for (let i = 0; i < 16; i++) {
    passphrase += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return passphrase;
};

// =============================================================================
// POST Handler
// =============================================================================

export const POST = async (request: NextRequest) => {
  try {
    const body: DeployCreateRequest = await request.json();
    const { agentId, projectId } = body;

    // Validate agent
    const agent = getAgentById(agentId);
    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    // Get deploy session
    const session = await getDeploySession();
    if (!session || !session.vercel?.accessToken) {
      return NextResponse.json(
        { success: false, error: "No deploy session found" },
        { status: 401 }
      );
    }

    const { vercel } = session;

    // Prepare environment variables
    const envVars: Record<string, string> = {};

    // Add generated passphrase for auth
    const passphrase = generatePassphrase();
    envVars["AGENT_PASSPHRASE"] = passphrase;

    // Note: Integration env vars (DATABASE_URL, AI_GATEWAY_URL) are set
    // automatically by Vercel when integrations are provisioned

    // Set environment variables
    await setEnvironmentVariables(
      vercel.accessToken,
      projectId,
      envVars,
      vercel.teamId
    );

    // Trigger deployment
    const deployment = await triggerDeployment(
      vercel.accessToken,
      projectId,
      vercel.teamId
    );

    // Wait for deployment to complete
    const result = await waitForDeployment(
      vercel.accessToken,
      deployment.id,
      vercel.teamId
    );

    // Update session with deployment results
    await updateDeploySession({
      deployment: {
        deploymentId: deployment.id,
        deploymentUrl: result.url,
        status: "ready",
      },
    });

    await updateStepStatus("deploying", "completed");

    // Clear OAuth tokens from session (security)
    await updateDeploySession({
      vercel: undefined,
      github: undefined,
    });

    return NextResponse.json({
      success: true,
      deploymentId: deployment.id,
      deploymentUrl: result.url,
      passphrase, // Return passphrase so user can save it
    });
  } catch (error) {
    console.error("Deploy create error:", error);
    await updateStepStatus(
      "deploying",
      "error",
      error instanceof Error ? error.message : "Deployment failed"
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Deployment failed",
      },
      { status: 500 }
    );
  }
};
