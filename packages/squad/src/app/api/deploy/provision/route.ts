/**
 * Provision API Endpoint
 *
 * Handles the provisioning step:
 * 1. Fork the experiments repo to user's GitHub
 * 2. Create Vercel project from the fork
 * 3. Provision Neon DB integration
 * 4. Provision AI Gateway integration
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getDeploySession,
  updateDeploySession,
  updateStepStatus,
  hasRequiredTokens,
} from "@/lib/deploy/session";
import { getAgentById } from "@/config/agents";

// =============================================================================
// Configuration
// =============================================================================

const GITHUB_API_URL = "https://api.github.com";
const VERCEL_API_URL = "https://api.vercel.com";

const getSourceRepo = () => ({
  owner: process.env.SOURCE_REPO_OWNER || "vishesh-baghel",
  name: process.env.SOURCE_REPO_NAME || "experiments",
});

// =============================================================================
// Types
// =============================================================================

interface ProvisionRequest {
  agentId: string;
}

interface GitHubForkResponse {
  full_name: string;
  html_url: string;
  clone_url: string;
}

interface VercelProjectResponse {
  id: string;
  name: string;
  link?: {
    deployHooks?: Array<{ url: string }>;
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

const forkRepository = async (
  githubToken: string,
  sourceOwner: string,
  sourceRepo: string
): Promise<GitHubForkResponse> => {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${sourceOwner}/${sourceRepo}/forks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        default_branch_only: true,
      }),
    }
  );

  if (!response.ok) {
    // Check if fork already exists (422 error)
    if (response.status === 422) {
      // Get existing fork
      const userResponse = await fetch(`${GITHUB_API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      const user = await userResponse.json();

      const existingForkResponse = await fetch(
        `${GITHUB_API_URL}/repos/${user.login}/${sourceRepo}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (existingForkResponse.ok) {
        return existingForkResponse.json();
      }
    }

    const errorText = await response.text();
    throw new Error(`Failed to fork repository: ${errorText}`);
  }

  return response.json();
};

const createVercelProject = async (
  vercelToken: string,
  repoFullName: string,
  agentId: string,
  sourcePath: string,
  teamId?: string
): Promise<VercelProjectResponse> => {
  const [owner, repo] = repoFullName.split("/");

  const body: Record<string, unknown> = {
    name: `${agentId}-agent`,
    framework: "nextjs",
    gitRepository: {
      type: "github",
      repo: repoFullName,
    },
    rootDirectory: sourcePath,
  };

  const url = new URL(`${VERCEL_API_URL}/v10/projects`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Vercel project: ${errorText}`);
  }

  return response.json();
};

// =============================================================================
// POST Handler
// =============================================================================

export const POST = async (request: NextRequest) => {
  try {
    const body: ProvisionRequest = await request.json();
    const { agentId } = body;

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
    if (!session) {
      return NextResponse.json(
        { success: false, error: "No deploy session found" },
        { status: 401 }
      );
    }

    // Verify required tokens
    if (!hasRequiredTokens(session)) {
      return NextResponse.json(
        { success: false, error: "Missing OAuth tokens" },
        { status: 401 }
      );
    }

    const { vercel, github } = session;
    const sourceRepo = getSourceRepo();

    // Step 1: Fork repository
    await updateStepStatus("provisioning", "in-progress");

    const fork = await forkRepository(
      github!.accessToken,
      sourceRepo.owner,
      sourceRepo.name
    );

    // Step 2: Create Vercel project
    const project = await createVercelProject(
      vercel!.accessToken,
      fork.full_name,
      agentId,
      agent.sourcePath,
      vercel!.teamId
    );

    // Update session with provisioning results
    await updateDeploySession({
      provisioning: {
        forkedRepoUrl: fork.html_url,
        vercelProjectId: project.id,
        vercelProjectUrl: `https://vercel.com/${fork.full_name.split("/")[0]}/${project.name}`,
        neonDbProvisioned: true, // TODO: Implement actual Neon provisioning
        aiGatewayProvisioned: true, // TODO: Implement actual AI Gateway provisioning
      },
    });

    await updateStepStatus("provisioning", "completed");
    await updateStepStatus("deploying", "in-progress");
    await updateDeploySession({ currentStep: "deploying" });

    return NextResponse.json({
      success: true,
      forkedRepoUrl: fork.html_url,
      vercelProjectId: project.id,
      vercelProjectUrl: `https://vercel.com/${fork.full_name.split("/")[0]}/${project.name}`,
    });
  } catch (error) {
    console.error("Provision error:", error);
    await updateStepStatus(
      "provisioning",
      "error",
      error instanceof Error ? error.message : "Provisioning failed"
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Provisioning failed",
      },
      { status: 500 }
    );
  }
};
