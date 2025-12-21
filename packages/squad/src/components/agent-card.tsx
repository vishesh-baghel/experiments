"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AgentConfig } from "@/config/agents";
import { trackAgentCardClick } from "@/lib/analytics";

interface AgentCardProps {
  agent: AgentConfig;
}

export const AgentCard = ({ agent }: AgentCardProps) => {
  const isComingSoon = agent.status === "coming-soon";

  const handleClick = () => {
    if (!isComingSoon) {
      trackAgentCardClick(agent.id);
    }
  };

  const CardContent = () => (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-3 mb-2">
            <h3 className="text-lg font-bold">{agent.name}</h3>
            {isComingSoon && (
              <span className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground leading-none">
                coming soon
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-3 italic">
            &quot;{agent.tagline}&quot;
          </p>

          <p className="text-sm mb-4">{agent.description}</p>

          <p className="text-xs text-muted-foreground">
            {agent.estimatedMonthlyCost} to run
          </p>
        </div>
      </div>

      {!isComingSoon && (
        <div className="mt-6 flex justify-end">
          <span className="inline-flex items-center gap-2 text-sm text-foreground group-hover:text-accent-red transition-colors">
            learn more
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      )}
    </>
  );

  if (isComingSoon) {
    return (
      <div className="border border-border p-6">
        <CardContent />
      </div>
    );
  }

  return (
    <Link
      href={`/${agent.id}`}
      onClick={handleClick}
      className="block border border-border p-6 hover:border-muted-foreground transition-colors no-underline text-foreground group"
    >
      <CardContent />
    </Link>
  );
};
