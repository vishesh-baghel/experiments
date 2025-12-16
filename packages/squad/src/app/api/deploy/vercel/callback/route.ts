/**
 * Vercel Deploy Button Callback
 *
 * Handles the callback from Vercel's Deploy Button flow.
 * Receives deployment info and stores it in the session.
 *
 * @see https://vercel.com/docs/deploy-button/callback
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getDeploySession,
  storeVercelDeployment,
  updateStepStatus,
} from "@/lib/deploy/session";


interface StatePayload {
  agentId: string;
}

// GET Handler

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Deploy Button callback parameters
  const projectName = searchParams.get("project-name");
  const projectDashboardUrl = searchParams.get("project-dashboard-url");
  const deploymentUrl = searchParams.get("deployment-url");
  const deploymentDashboardUrl = searchParams.get("deployment-dashboard-url");
  const repositoryUrl = searchParams.get("repository-url");
  const state = searchParams.get("state");

  // Decode state to get agentId
  let agentId = "";
  if (state) {
    try {
      const statePayload: StatePayload = JSON.parse(
        Buffer.from(state, "base64url").toString()
      );
      agentId = statePayload.agentId;
    } catch {
      // Fall back to session
      const session = await getDeploySession();
      agentId = session?.agentId || "";
    }
  } else {
    const session = await getDeploySession();
    agentId = session?.agentId || "";
  }

  // Validate required parameters
  if (!deploymentUrl || !projectName) {
    console.error("Missing required Deploy Button callback params:", {
      projectName,
      deploymentUrl,
    });
    await updateStepStatus("vercel-deploy", "error", "Missing deployment info");
    return NextResponse.redirect(
      new URL(`/deploy/${agentId}?error=missing_deployment_info`, request.url)
    );
  }

  try {
    // Store deployment data in session
    await storeVercelDeployment({
      projectName,
      projectDashboardUrl: projectDashboardUrl || "",
      deploymentUrl,
      deploymentDashboardUrl: deploymentDashboardUrl || "",
      repositoryUrl: repositoryUrl || "",
    });

    // Update step status - deployment is complete!
    await updateStepStatus("vercel-deploy", "completed");

    // Redirect back to deploy page with success
    return NextResponse.redirect(
      new URL(`/deploy/${agentId}?success=true`, request.url)
    );
  } catch (err) {
    console.error("Vercel callback error:", err);
    await updateStepStatus("vercel-deploy", "error", "Failed to store deployment");
    return NextResponse.redirect(
      new URL(`/deploy/${agentId}?error=callback_failed`, request.url)
    );
  }
};
