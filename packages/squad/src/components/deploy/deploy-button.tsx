"use client";

/**
 * DeployButton Component
 *
 * Button that initiates Vercel Deploy Button flow.
 * Opens Vercel's deploy page in a new tab.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { trackDeployButtonClick } from "@/lib/analytics";


interface DeployButtonProps {
  agentId: string;
  disabled?: boolean;
  onStart?: () => void;
}


export const DeployButton = ({
  agentId,
  disabled = false,
  onStart,
}: DeployButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    trackDeployButtonClick(agentId);
    onStart?.();

    try {
      // Open Vercel deploy in new tab so user can browse other agents
      const url = new URL("/api/deploy/vercel/deploy", window.location.origin);
      url.searchParams.set("agentId", agentId);
      window.open(url.toString(), "_blank");
      setIsLoading(false);
    } catch (error) {
      console.error("Deploy button error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="w-full"
      size="lg"
      aria-label="Deploy to Vercel"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          redirecting...
        </>
      ) : (
        "deploy to vercel"
      )}
    </Button>
  );
};

export default DeployButton;
