"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

type ErrorType = "oauth" | "fork" | "provision" | "deploy" | "unknown";

interface DeployErrorProps {
  type: ErrorType;
  message: string;
  agentId: string;
  onRetry?: () => void;
}

const errorConfig: Record<ErrorType, { title: string; description: string; helpLink?: string }> = {
  oauth: {
    title: "authentication failed",
    description: "we couldn't connect to your account. this usually happens if permissions were denied or the connection timed out.",
  },
  fork: {
    title: "repository fork failed",
    description: "we couldn't fork the repository to your github account. please check that you have permission to create repositories.",
    helpLink: "https://docs.github.com/en/get-started/quickstart/fork-a-repo",
  },
  provision: {
    title: "provisioning failed",
    description: "we couldn't set up the infrastructure. this might be a temporary issue with vercel or github.",
    helpLink: "https://www.vercel-status.com/",
  },
  deploy: {
    title: "deployment failed",
    description: "the deployment didn't complete successfully. this could be due to a build error or configuration issue.",
    helpLink: "https://vercel.com/docs/deployments/troubleshoot-a-build",
  },
  unknown: {
    title: "something went wrong",
    description: "an unexpected error occurred. please try again or contact support if the issue persists.",
  },
};

export const DeployError = ({ type, message, agentId, onRetry }: DeployErrorProps) => {
  const config = errorConfig[type];

  return (
    <div className="border border-destructive/50 bg-destructive/5 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-semibold text-destructive">{config.title}</h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      <div className="bg-muted/50 p-3 rounded text-xs font-mono text-muted-foreground break-all">
        {message}
      </div>

      <div className="flex flex-wrap gap-3">
        {onRetry && (
          <Button onClick={onRetry} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            try again
          </Button>
        )}

        <Button variant="outline" size="sm" asChild>
          <Link href={`/${agentId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            go back
          </Link>
        </Button>

        {config.helpLink && (
          <Button variant="ghost" size="sm" asChild>
            <a href={config.helpLink} target="_blank" rel="noreferrer">
              get help
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

export default DeployError;
