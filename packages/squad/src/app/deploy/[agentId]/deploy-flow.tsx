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
import { DeployProgress, OAuthButton, DeployError } from "@/components/deploy";
import { AgentConfig } from "@/config/agents";
import { DeploySession } from "@/lib/deploy/types";
import {
  trackDeployStart,
  trackDeploySuccess,
  trackDeployFailure,
} from "@/lib/analytics";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

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
  const currentStep = session.currentStep;
  const isComplete = !!session.vercel?.deploymentUrl;

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="border border-border p-6">
        <DeployProgress steps={session.steps} currentStep={currentStep} />
      </div>

      {/* Current Step Content */}
      <div className="border border-border p-6">
        {/* Deploy to Vercel */}
        {currentStep === "vercel-deploy" && !isComplete && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">deploy {agent.name}</h2>
              <p className="text-sm text-muted-foreground">
                estimated cost: {agent.estimatedMonthlyCost}
              </p>
              <OAuthButton provider="vercel" agentId={agent.id} />
            </div>

            {/* Agent-specific deployment instructions */}
            {agent.deployInstructions.length > 0 && (
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold mb-4">deployment steps</h3>
                <ol className="space-y-4">
                  {agent.deployInstructions.map((instruction) => (
                    <li key={instruction.step} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {instruction.step}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{instruction.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {instruction.description}
                        </p>
                        {instruction.link && (
                          <a
                            href={instruction.link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm underline text-muted-foreground hover:text-foreground"
                          >
                            {instruction.link.text}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Success */}
        {isComplete && session.vercel && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-green-600">
                deployment successful
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                your {agent.name} agent is now live
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm">
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
                <div className="text-sm">
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
              {session.vercel.repositoryUrl && (
                <div className="text-sm">
                  <span className="text-muted-foreground">repository: </span>
                  <a
                    href={session.vercel.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {session.vercel.repositoryUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button asChild>
                <a
                  href={session.vercel.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  open your agent
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">deploy another</Link>
              </Button>
            </div>

            {/* Post-deploy instructions */}
            {agent.envVars.some((v) => v.source === "user") && (
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-2">next steps</h3>
                <p className="text-sm text-muted-foreground">
                  add these environment variables in your vercel project
                  settings:
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {agent.envVars
                    .filter((v) => v.source === "user")
                    .map((v) => (
                      <li key={v.key} className="font-mono text-xs">
                        {v.key} - {v.description}
                      </li>
                    ))}
                </ul>
              </div>
            )}
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

      {/* Cancel Link */}
      {!isComplete && (
        <div className="text-center">
          <Link
            href={`/${agent.id}`}
            className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            cancel and go back
          </Link>
        </div>
      )}
    </div>
  );
};

export default DeployFlow;
