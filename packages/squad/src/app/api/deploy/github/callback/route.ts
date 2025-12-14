/**
 * GitHub OAuth Callback Endpoint
 *
 * Handles the OAuth callback from GitHub, exchanges code for token,
 * and stores the token in the deploy session.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getDeploySession,
  storeGitHubTokens,
  updateStepStatus,
  updateDeploySession,
} from "@/lib/deploy/session";

// =============================================================================
// Configuration
// =============================================================================

const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

const getConfig = () => ({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/deploy/github/callback`,
});

// =============================================================================
// Types
// =============================================================================

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  login: string;
  id: number;
}

interface StatePayload {
  agentId: string;
}

// =============================================================================
// GET Handler
// =============================================================================

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("GitHub OAuth error:", error);
    const session = await getDeploySession();
    const agentId = session?.agentId || "";
    await updateStepStatus("github-auth", "error", "Authorization denied");
    return NextResponse.redirect(
      new URL(`/deploy/${agentId}?error=oauth_denied`, request.url)
    );
  }

  // Validate code and state
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/?error=invalid_callback", request.url)
    );
  }

  // Decode state to get agentId
  let statePayload: StatePayload;
  try {
    statePayload = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return NextResponse.redirect(
      new URL("/?error=invalid_state", request.url)
    );
  }

  const { agentId } = statePayload;
  const config = getConfig();

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("GitHub token exchange failed:", errorText);
      await updateStepStatus("github-auth", "error", "Token exchange failed");
      return NextResponse.redirect(
        new URL(`/deploy/${agentId}?error=token_exchange_failed`, request.url)
      );
    }

    const tokenData: GitHubTokenResponse = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("GitHub token response missing access_token:", tokenData);
      await updateStepStatus("github-auth", "error", "Invalid token response");
      return NextResponse.redirect(
        new URL(`/deploy/${agentId}?error=invalid_token`, request.url)
      );
    }

    // Get GitHub username
    const userResponse = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      console.error("GitHub user fetch failed");
      await updateStepStatus("github-auth", "error", "Failed to get user info");
      return NextResponse.redirect(
        new URL(`/deploy/${agentId}?error=user_fetch_failed`, request.url)
      );
    }

    const userData: GitHubUser = await userResponse.json();

    // Store tokens in session
    await storeGitHubTokens(tokenData.access_token, userData.login);

    // Update step status
    await updateStepStatus("github-auth", "completed");
    await updateStepStatus("provisioning", "in-progress");

    // Update current step to provisioning
    await updateDeploySession({ currentStep: "provisioning" });

    // Redirect back to deploy page
    return NextResponse.redirect(
      new URL(`/deploy/${agentId}`, request.url)
    );
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    await updateStepStatus("github-auth", "error", "Unexpected error");
    return NextResponse.redirect(
      new URL(`/deploy/${agentId}?error=unexpected_error`, request.url)
    );
  }
};
