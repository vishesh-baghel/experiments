"use client";

/**
 * DeployFlow Component
 *
 * Client-side component that manages the deployment flow state and UI.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeployProgress, OAuthButton } from "@/components/deploy";
import { AgentConfig } from "@/config/agents";
import { DeploySession } from "@/lib/deploy/types";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

interface DeployFlowProps {
  agent: AgentConfig;
}

export const DeployFlow = ({ agent }: DeployFlowProps) => {
  const [session, setSession] = useState<DeploySession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeploy = useCallback(async (projectId: string) => {
    setIsDeploying(true);
    setError(null);

    try {
      const response = await fetch("/api/deploy/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, projectId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Deployment failed");
      }

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map((s) =>
            s.id === "deploying" ? { ...s, status: "completed" as const } : s
          ),
          deployment: {
            deploymentId: data.deploymentId,
            deploymentUrl: data.deploymentUrl,
            status: "ready" as const,
          },
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deployment failed");
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map((s) =>
            s.id === "deploying" ? { ...s, status: "error" as const, error: "Failed" } : s
          ),
        };
      });
    } finally {
      setIsDeploying(false);
    }
  }, [agent.id]);

  const handleProvision = useCallback(async () => {
    setIsProvisioning(true);
    setError(null);

    try {
      const response = await fetch("/api/deploy/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Provisioning failed");
      }

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentStep: "deploying" as const,
          steps: prev.steps.map((s) =>
            s.id === "provisioning"
              ? { ...s, status: "completed" as const }
              : s.id === "deploying"
              ? { ...s, status: "in-progress" as const }
              : s
          ),
          provisioning: {
            forkedRepoUrl: data.forkedRepoUrl,
            vercelProjectId: data.vercelProjectId,
            vercelProjectUrl: data.vercelProjectUrl,
          },
        };
      });

      // Auto-start deployment
      handleDeploy(data.vercelProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Provisioning failed");
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map((s) =>
            s.id === "provisioning"
              ? { ...s, status: "error" as const, error: "Failed" }
              : s
          ),
        };
      });
    } finally {
      setIsProvisioning(false);
    }
  }, [agent.id, handleDeploy]);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize");
      } finally {
        setIsInitializing(false);
      }
    };

    initSession();
  }, [agent.id]);

  // Auto-advance to provisioning when both OAuth complete
  useEffect(() => {
    if (!session) return;
    
    const hasVercel = !!session.vercel?.accessToken;
    const hasGitHub = !!session.github?.accessToken;
    const currentStep = session.currentStep;

    if (hasVercel && hasGitHub && currentStep === "github-auth") {
      handleProvision();
    }
  }, [session, handleProvision]);

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
      <div className="border border-border p-6">
        <p className="text-sm text-red-600 mb-4">{error || "Failed to initialize deploy session"}</p>
        <Button onClick={() => window.location.reload()}>retry</Button>
      </div>
    );
  }

  // Now we know session is not null
  const currentStep = session.currentStep;
  const hasVercel = !!session.vercel?.accessToken;
  const hasGitHub = !!session.github?.accessToken;
  const isComplete = session.deployment?.status === "ready";

  const handleRetry = () => {
    setError(null);
    if (currentStep === "provisioning") {
      handleProvision();
    } else if (currentStep === "deploying" && session.provisioning?.vercelProjectId) {
      handleDeploy(session.provisioning.vercelProjectId);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="border border-border p-6">
        <DeployProgress steps={session.steps} currentStep={currentStep} />
      </div>

      {/* Current Step Content */}
      <div className="border border-border p-6">
        {/* Step 1: Vercel Auth */}
        {currentStep === "vercel-auth" && !hasVercel && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">step 1: connect vercel</h2>
            <p className="text-sm text-muted-foreground">
              we need access to your vercel account to create the project and
              provision integrations.
            </p>
            <OAuthButton provider="vercel" agentId={agent.id} />
          </div>
        )}

        {/* Step 2: GitHub Auth */}
        {currentStep === "github-auth" && hasVercel && !hasGitHub && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">step 2: connect github</h2>
            <p className="text-sm text-muted-foreground">
              we need access to fork the repository to your github account.
            </p>
            <OAuthButton provider="github" agentId={agent.id} />
          </div>
        )}

        {/* Step 3: Provisioning */}
        {currentStep === "provisioning" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">step 3: provisioning</h2>
            {isProvisioning ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                setting up your infrastructure...
              </div>
            ) : error ? (
              <div className="space-y-4">
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={handleRetry}>retry</Button>
              </div>
            ) : null}
          </div>
        )}

        {/* Step 4: Deploying */}
        {currentStep === "deploying" && !isComplete && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">step 4: deploying</h2>
            {isDeploying ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                deploying to production...
              </div>
            ) : error ? (
              <div className="space-y-4">
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={handleRetry}>retry</Button>
              </div>
            ) : null}
          </div>
        )}

        {/* Success */}
        {isComplete && session.deployment && (
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
                  href={session.deployment.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {session.deployment.deploymentUrl}
                </a>
              </div>
              {session.provisioning?.forkedRepoUrl && (
                <div className="text-sm">
                  <span className="text-muted-foreground">repository: </span>
                  <a
                    href={session.provisioning.forkedRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {session.provisioning.forkedRepoUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button asChild>
                <a
                  href={session.deployment.deploymentUrl}
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
