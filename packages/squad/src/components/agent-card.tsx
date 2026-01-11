"use client";

import Link from "next/link";
import { ArrowRight, Bot, Brain, Megaphone } from "lucide-react";
import type { AgentConfig } from "@/config/agents";
import { trackAgentCardClick } from "@/lib/analytics";

interface AgentCardProps {
  agent: AgentConfig;
}

const getAgentIcon = (agentId: string) => {
  switch (agentId) {
    case "jack":
      return <Bot className="h-6 w-6" />;
    case "sensie":
      return <Brain className="h-6 w-6" />;
    case "gary":
      return <Megaphone className="h-6 w-6" />;
    default:
      return <Bot className="h-6 w-6" />;
  }
};

export const AgentCard = ({ agent }: AgentCardProps) => {
  const isComingSoon = agent.status === "coming-soon";

  const handleClick = () => {
    if (!isComingSoon) {
      trackAgentCardClick(agent.id);
    }
  };

  const CardContent = () => (
    <div className="flex flex-col h-full">
      {/* Header with icon */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-[var(--color-background-muted)] flex items-center justify-center text-[var(--color-foreground-muted)] shrink-0">
          {getAgentIcon(agent.id)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight leading-tight">
              {agent.name}
            </h3>
            {isComingSoon && (
              <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 bg-[var(--color-background-muted)] text-[var(--color-foreground-subtle)] border border-[var(--color-border)]">
                soon
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-foreground-muted)] leading-tight">
            {agent.tagline}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-[15px] text-[var(--color-foreground-muted)] leading-relaxed mb-4 flex-1">
        {agent.description}
      </p>

      {/* Features preview */}
      <div className="flex flex-wrap gap-2 mb-4">
        {agent.features.slice(0, 3).map((feature) => (
          <span
            key={feature.title}
            className="text-[13px] px-3 py-1.5 bg-[var(--color-background-muted)] text-[var(--color-foreground-muted)]"
          >
            {feature.title}
          </span>
        ))}
        {agent.features.length > 3 && (
          <span className="text-[13px] px-3 py-1.5 bg-[var(--color-background-muted)] text-[var(--color-foreground-subtle)]">
            +{agent.features.length - 3} more
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--glass-border)]">
        <span className="text-sm font-mono text-[var(--color-foreground-subtle)]">
          {agent.estimatedMonthlyCost}
        </span>
        {!isComingSoon && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-foreground-muted)] group-hover:text-[var(--color-foreground)] group-hover:gap-2.5 transition-all">
            Learn more
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );

  const cardClasses = `
    glass p-6 h-full
    transition-all duration-200
    ${
      isComingSoon
        ? "opacity-60 cursor-default"
        : "hover:translate-y-[-2px] hover:border-[var(--color-border-hover)] cursor-pointer"
    }
  `;

  if (isComingSoon) {
    return (
      <div className={cardClasses}>
        <CardContent />
      </div>
    );
  }

  return (
    <Link
      href={`/${agent.id}`}
      onClick={handleClick}
      className={`block no-underline text-[var(--color-foreground)] group ${cardClasses}`}
    >
      <CardContent />
    </Link>
  );
};
