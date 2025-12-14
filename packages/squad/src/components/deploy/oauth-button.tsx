"use client";

/**
 * OAuthButton Component
 *
 * Button that initiates OAuth flow for Vercel or GitHub.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

type OAuthProvider = "vercel" | "github";

interface OAuthButtonProps {
  provider: OAuthProvider;
  agentId: string;
  disabled?: boolean;
  onStart?: () => void;
}

// =============================================================================
// Provider Config
// =============================================================================

const PROVIDER_CONFIG: Record<
  OAuthProvider,
  { label: string; endpoint: string }
> = {
  vercel: {
    label: "connect vercel",
    endpoint: "/api/deploy/vercel/authorize",
  },
  github: {
    label: "connect github",
    endpoint: "/api/deploy/github/authorize",
  },
};

// =============================================================================
// Component
// =============================================================================

export const OAuthButton = ({
  provider,
  agentId,
  disabled = false,
  onStart,
}: OAuthButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const config = PROVIDER_CONFIG[provider];

  const handleClick = async () => {
    setIsLoading(true);
    onStart?.();

    try {
      // Redirect to OAuth authorization endpoint
      const url = new URL(config.endpoint, window.location.origin);
      url.searchParams.set("agentId", agentId);
      window.location.href = url.toString();
    } catch (error) {
      console.error(`OAuth ${provider} error:`, error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="w-full"
      size="lg"
      aria-label={`Connect ${provider} account`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          connecting...
        </>
      ) : (
        config.label
      )}
    </Button>
  );
};

export default OAuthButton;
