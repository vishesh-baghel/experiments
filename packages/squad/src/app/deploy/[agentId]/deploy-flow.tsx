"use client";

/**
 * DeployFlow Component
 *
 * Client-side component that manages the deployment flow state and UI.
 * Single-step flow: Deploy to Vercel (handles repo cloning automatically)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OAuthButton, DeployError } from "@/components/deploy";
import { AgentConfig } from "@/config/agents";
import { DeploySession } from "@/lib/deploy/types";
import {
  trackDeployStart,
  trackDeploySuccess,
  trackDeployFailure,
} from "@/lib/analytics";
import { ArrowLeft, ExternalLink, Loader2, BookOpen, CheckCircle2 } from "lucide-react";

interface DeployFlowProps {
  agent: AgentConfig;
}

export const DeployFlow = ({ agent }: DeployFlowProps) => {
  const [session, setSession] = useState<DeploySession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch("/api/deploy/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: agent.id }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to initialize deploy session");
        }

        setSession(data.session);
        trackDeployStart(agent.id);

        // Check if deployment is already complete (returning from Vercel)
        if (data.session.vercel?.deploymentUrl) {
          trackDeploySuccess(agent.id, data.session.vercel.deploymentUrl);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to initialize";
        setError(errorMsg);
        trackDeployFailure(agent.id, "init", errorMsg);
      } finally {
        setIsInitializing(false);
      }
    };

    initSession();
  }, [agent.id]);

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="border border-border p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">initializing...</span>
      </div>
    );
  }

  // Show error if initialization failed
  if (!session) {
    return (
      <DeployError
        type="unknown"
        message={error || "Failed to initialize deploy session"}
        agentId={agent.id}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Session state
  const isComplete = !!session.vercel?.deploymentUrl;

  return (
    <div className="space-y-8">
      {/* Deploy Section */}
      <div className="border border-border p-6">
        {/* Deploy to Vercel */}
        {!isComplete && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">deploy {agent.name}</h2>
              <p className="text-sm text-muted-foreground">
                click below to deploy your agent. this opens vercel in a new tab
                where you can set up your project and add a database.
              </p>
              <OAuthButton provider="vercel" agentId={agent.id} />
            </div>

            <p className="text-xs text-muted-foreground">
              you only pay for services you use (vercel, neon, openai). this
              project is free and open source.
            </p>
          </div>
        )}

        {/* Success */}
        {isComplete && session.vercel && (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold">deployment successful</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  your {agent.name} agent is now live. follow the setup guide to
                  complete configuration.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">deployment url: </span>
                <a
                  href={session.vercel.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {session.vercel.deploymentUrl}
                </a>
              </div>
              {session.vercel.projectDashboardUrl && (
                <div>
                  <span className="text-muted-foreground">vercel project: </span>
                  <a
                    href={session.vercel.projectDashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {session.vercel.projectName}
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link href={`/deploy/${agent.id}/guide`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  complete setup
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={session.vercel.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  open your agent
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <DeployError
            type="unknown"
            message={error}
            agentId={agent.id}
            onRetry={() => window.location.reload()}
          />
        )}
      </div>

      {/* Setup Guide Link - always visible */}
      <div className="border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">setup guide</h3>
            <p className="text-sm text-muted-foreground mt-1">
              step-by-step instructions to configure your {agent.name} agent
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/deploy/${agent.id}/guide`}>
              <BookOpen className="mr-2 h-4 w-4" />
              view guide
            </Link>
          </Button>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <Link
          href={`/${agent.id}`}
          className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          back to {agent.name}
        </Link>
      </div>
    </div>
  );
};

export default DeployFlow;
