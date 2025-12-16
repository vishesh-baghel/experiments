/**
 * Deploy Start API Endpoint
 *
 * Initializes a deploy session for the given agent.
 * Called when user lands on the deploy page.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDeploySession, createDeploySession } from "@/lib/deploy/session";
import { getAgentById } from "@/config/agents";

// POST Handler

export const POST = async (request: NextRequest) => {
  try {
    const { agentId } = await request.json();

    // Validate agent
    const agent = getAgentById(agentId);
    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    if (agent.status === "coming-soon") {
      return NextResponse.json(
        { success: false, error: "Agent not available for deployment" },
        { status: 400 }
      );
    }

    // Get existing session or create new one
    let session = await getDeploySession();

    // Force new session if agentId changed or step order is outdated
    const isStaleSession = session && session.steps.length !== 1;
    
    if (!session || session.agentId !== agentId || isStaleSession) {
      session = await createDeploySession(agentId);
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Deploy start error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start deploy",
      },
      { status: 500 }
    );
  }
};
