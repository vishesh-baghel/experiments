/**
 * Vercel OAuth Callback Endpoint
 *
 * Handles the OAuth callback from Vercel, exchanges code for token,
 * and stores the token in the deploy session.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getDeploySession,
  storeVercelTokens,
  updateStepStatus,
} from "@/lib/deploy/session";


const VERCEL_TOKEN_URL = "https://api.vercel.com/v2/oauth/access_token";

const getConfig = () => ({
  clientId: process.env.VERCEL_CLIENT_ID!,
  clientSecret: process.env.VERCEL_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/deploy/vercel/callback`,
});


interface VercelTokenResponse {
  access_token: string;
  token_type: string;
  team_id?: string;
}

interface StatePayload {
  agentId: string;
}

// GET Handler

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("Vercel OAuth error:", error);
    const session = await getDeploySession();
    const agentId = session?.agentId || "";
    await updateStepStatus("vercel-auth", "error", "Authorization denied");
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
    const tokenResponse = await fetch(VERCEL_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Vercel token exchange failed:", errorText);
      await updateStepStatus("vercel-auth", "error", "Token exchange failed");
      return NextResponse.redirect(
        new URL(`/deploy/${agentId}?error=token_exchange_failed`, request.url)
      );
    }

    const tokenData: VercelTokenResponse = await tokenResponse.json();

    // Store tokens in session
    await storeVercelTokens(tokenData.access_token, tokenData.team_id);

    // Update step status
    await updateStepStatus("vercel-auth", "completed");
    await updateStepStatus("provisioning", "in-progress");

    // Redirect back to deploy page
    return NextResponse.redirect(
      new URL(`/deploy/${agentId}`, request.url)
    );
  } catch (err) {
    console.error("Vercel OAuth callback error:", err);
    await updateStepStatus("vercel-auth", "error", "Unexpected error");
    return NextResponse.redirect(
      new URL(`/deploy/${agentId}?error=unexpected_error`, request.url)
    );
  }
};
