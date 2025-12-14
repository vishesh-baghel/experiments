/**
 * Agent Configuration
 *
 * This file defines all deployable agents in Squad.
 * To add a new agent, add a new entry to the `agents` array.
 */

export type IntegrationType = "neon" | "ai-gateway";

export type EnvVarSource = "integration" | "user" | "generated";

export interface EnvVarConfig {
  key: string;
  source: EnvVarSource;
  integration?: IntegrationType;
  description: string;
  required: boolean;
}

export interface RequirementConfig {
  name: string;
  cost: string;
  description: string;
}

export interface FeatureConfig {
  title: string;
  description: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: FeatureConfig[];
  requirements: RequirementConfig[];
  sourceRepo: string;
  sourcePath: string;
  integrations: IntegrationType[];
  envVars: EnvVarConfig[];
  status: "available" | "coming-soon";
  estimatedMonthlyCost: string;
  demoUrl?: string;
  specUrl?: string;
}

// Agent Definitions

export const jackAgent: AgentConfig = {
  id: "jack",
  name: "jack",
  tagline: "because writer's block is for normies",
  description:
    "x content agent that learns your voice. named after jack dorsey. tracks creators you follow, generates ideas from trending topics and gives you outline to write the actual content",
  features: [
    {
      title: "creator tracking",
      description:
        "monitors 50-100 x creators you specify and extracts trending topics",
    },
    {
      title: "idea generation",
      description:
        "generates 5 content ideas daily based on trends and your projects",
    },
    {
      title: "voice learning",
      description:
        'learns from posts you mark as "good" and adapts to your style',
    },
    {
      title: "outline creation",
      description:
        "creates structured outlines so you write the actual content",
    },
  ],
  requirements: [
    {
      name: "vercel account",
      cost: "free",
      description: "for hosting the application",
    },
    {
      name: "neon postgres",
      cost: "free tier",
      description: "database for storing ideas, posts, and learned patterns",
    },
    {
      name: "ai gateway",
      cost: "~$10/month",
      description: "for gpt-4 api calls (pay per use)",
    },
    {
      name: "apify",
      cost: "~$5/month",
      description: "for x/twitter data scraping",
    },
  ],
  sourceRepo: "https://github.com/vishesh-baghel/experiments",
  sourcePath: "packages/jack-x-agent",
  integrations: ["neon", "ai-gateway"],
  envVars: [
    {
      key: "DATABASE_URL",
      source: "integration",
      integration: "neon",
      description: "postgres connection string",
      required: true,
    },
    {
      key: "AI_GATEWAY_URL",
      source: "integration",
      integration: "ai-gateway",
      description: "vercel ai gateway endpoint",
      required: true,
    },
    {
      key: "APIFY_API_KEY",
      source: "user",
      description: "your apify api key for x data",
      required: true,
    },
    {
      key: "AUTH_PASSPHRASE",
      source: "generated",
      description: "auto-generated passphrase for owner auth",
      required: true,
    },
  ],
  status: "available",
  estimatedMonthlyCost: "~$15/month",
  demoUrl: "https://jack.visheshbaghel.com",
  specUrl:
    "https://github.com/vishesh-baghel/experiments/tree/main/packages/jack-x-agent/specs",
};

export const sensieAgent: AgentConfig = {
  id: "sensie",
  name: "sensie",
  tagline: "your personal teacher in the age of ai",
  description:
    "learning agent that tracks everything you learn and makes sure you're not getting dumb with new ai tools. your accountability partner for continuous growth.",
  features: [
    {
      title: "learning tracker",
      description:
        "logs what you learn daily with spaced repetition reminders",
    },
    {
      title: "knowledge gaps",
      description: "identifies areas where you're relying too much on ai",
    },
    {
      title: "progress insights",
      description: "weekly reports on your learning velocity and retention",
    },
  ],
  requirements: [
    {
      name: "vercel account",
      cost: "free",
      description: "for hosting the application",
    },
    {
      name: "neon postgres",
      cost: "free tier",
      description: "database for learning records",
    },
    {
      name: "ai gateway",
      cost: "~$5/month",
      description: "for ai-powered insights",
    },
  ],
  sourceRepo: "https://github.com/vishesh-baghel/experiments",
  sourcePath: "packages/sensie",
  integrations: ["neon", "ai-gateway"],
  envVars: [
    {
      key: "DATABASE_URL",
      source: "integration",
      integration: "neon",
      description: "postgres connection string",
      required: true,
    },
    {
      key: "AI_GATEWAY_URL",
      source: "integration",
      integration: "ai-gateway",
      description: "vercel ai gateway endpoint",
      required: true,
    },
  ],
  status: "coming-soon",
  estimatedMonthlyCost: "~$5/month",
};


export const agents: AgentConfig[] = [jackAgent, sensieAgent];

export const getAgentById = (id: string): AgentConfig | undefined => {
  return agents.find((agent) => agent.id === id);
};

export const getAvailableAgents = (): AgentConfig[] => {
  return agents.filter((agent) => agent.status === "available");
};

export const getComingSoonAgents = (): AgentConfig[] => {
  return agents.filter((agent) => agent.status === "coming-soon");
};
