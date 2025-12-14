/**
 * Vercel OAuth Authorization Endpoint
 *
 * Redirects user to Vercel OAuth consent screen.
 */

import { NextRequest, NextResponse } from "next/server";
import { createDeploySession, getDeploySession, updateStepStatus } from "@/lib/deploy/session";

// =============================================================================
// Configuration
// =============================================================================

const VERCEL_OAUTH_URL = "https://vercel.com/oauth/authorize";

const getConfig = () => ({
  clientId: process.env.VERCEL_CLIENT_ID,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/deploy/vercel/callback`,
});

// =============================================================================
// GET Handler
// =============================================================================

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  // Validate agentId
  if (!agentId) {
    return NextResponse.redirect(
      new URL("/?error=missing_agent_id", request.url)
    );
  }

  const config = getConfig();

  // Validate configuration
  if (!config.clientId) {
    console.error("Missing VERCEL_CLIENT_ID");
    return NextResponse.redirect(
      new URL(`/${agentId}?error=config_error`, request.url)
    );
  }

  // Get or create deploy session
  let session = await getDeploySession();
  if (!session || session.agentId !== agentId) {
    session = await createDeploySession(agentId);
  }

  // Update step status
  await updateStepStatus("vercel-auth", "in-progress");

  // Generate state parameter (includes agentId for callback)
  const state = Buffer.from(JSON.stringify({ agentId })).toString("base64url");

  // Build OAuth URL
  const oauthUrl = new URL(VERCEL_OAUTH_URL);
  oauthUrl.searchParams.set("client_id", config.clientId);
  oauthUrl.searchParams.set("redirect_uri", config.redirectUri);
  oauthUrl.searchParams.set("scope", "user project");
  oauthUrl.searchParams.set("state", state);

  return NextResponse.redirect(oauthUrl.toString());
};
