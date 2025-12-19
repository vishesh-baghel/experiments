/**
 * Vercel Deploy Button Redirect
 *
 * Redirects user to Vercel's Deploy Button flow to create a new project.
 * Vercel handles repo cloning - no GitHub OAuth required.
 *
 * @see https://vercel.com/docs/deploy-button
 */

import { NextRequest, NextResponse } from "next/server";
import { getDeploySession, updateStepStatus } from "@/lib/deploy/session";
import { getAgentById } from "@/config/agents";


// GET Handler

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  // Validate agentId
  if (!agentId) {
    return NextResponse.redirect(
      new URL("/?error=missing_agent_id", request.url)
    );
  }

  // Get agent config for source repo and path
  const agent = getAgentById(agentId);
  if (!agent) {
    return NextResponse.redirect(
      new URL(`/?error=agent_not_found`, request.url)
    );
  }

  // Verify we have a deploy session
  const session = await getDeploySession();
  if (!session) {
    return NextResponse.redirect(
      new URL(`/deploy/${agentId}?error=missing_session`, request.url)
    );
  }

  // Update step status
  await updateStepStatus("vercel-deploy", "in-progress");

  // Build Vercel Deploy Button URL
  // https://vercel.com/docs/deploy-button
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/deploy/vercel/callback`;
  const state = Buffer.from(JSON.stringify({ agentId })).toString("base64url");

  const deployUrl = new URL("https://vercel.com/new/clone");
  deployUrl.searchParams.set("repository-url", agent.sourceRepo);
  deployUrl.searchParams.set("redirect-url", `${callbackUrl}?state=${state}`);
  deployUrl.searchParams.set("project-name", `${agentId}-agent`);
  deployUrl.searchParams.set("repository-name", `${agentId}-agent`);
  
  // Set root directory only if agent is in a subdirectory
  if (agent.sourcePath) {
    deployUrl.searchParams.set("root-directory", agent.sourcePath);
  }

  return NextResponse.redirect(deployUrl.toString());
};
