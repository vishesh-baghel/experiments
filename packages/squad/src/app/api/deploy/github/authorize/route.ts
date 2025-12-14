/**
 * GitHub OAuth Authorization Endpoint
 *
 * Redirects user to GitHub OAuth consent screen.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDeploySession, updateStepStatus } from "@/lib/deploy/session";


const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";

const getConfig = () => ({
  clientId: process.env.GITHUB_CLIENT_ID,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/deploy/github/callback`,
});

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

  const config = getConfig();

  // Validate configuration
  if (!config.clientId) {
    console.error("Missing GITHUB_CLIENT_ID");
    return NextResponse.redirect(
      new URL(`/${agentId}?error=config_error`, request.url)
    );
  }

  // Verify we have a deploy session with Vercel auth
  const session = await getDeploySession();
  if (!session || !session.vercel?.accessToken) {
    return NextResponse.redirect(
      new URL(`/deploy/${agentId}?error=missing_vercel_auth`, request.url)
    );
  }

  // Update step status
  await updateStepStatus("github-auth", "in-progress");

  // Generate state parameter (includes agentId for callback)
  const state = Buffer.from(JSON.stringify({ agentId })).toString("base64url");

  // Build OAuth URL
  const oauthUrl = new URL(GITHUB_OAUTH_URL);
  oauthUrl.searchParams.set("client_id", config.clientId);
  oauthUrl.searchParams.set("redirect_uri", config.redirectUri);
  oauthUrl.searchParams.set("scope", "repo read:user");
  oauthUrl.searchParams.set("state", state);

  return NextResponse.redirect(oauthUrl.toString());
};
