/**
 * Agent Configuration
 *
 * This file defines all deployable agents in Squad.
 * To add a new agent, add a new entry to the `agents` array.
 */

export type IntegrationType = "neon" | "prisma" | "ai-gateway";

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

export interface DeployInstructionConfig {
  step: number;
  title: string;
  description: string;
  link?: {
    text: string;
    url: string;
  };
}

export interface GuideStepConfig {
  title: string;
  description: string;
  details?: string[];
  link?: {
    text: string;
    url: string;
  };
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
  deployInstructions: DeployInstructionConfig[];
  guideSteps: GuideStepConfig[];
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
      name: "vercel postgres",
      cost: "free tier",
      description: "database for storing ideas, posts, and learned patterns (prisma-managed)",
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
  sourceRepo: "https://github.com/vishesh-baghel/jack",
  sourcePath: "",
  integrations: ["prisma", "ai-gateway"],
  envVars: [
    {
      key: "DATABASE_URL",
      source: "integration",
      integration: "prisma",
      description: "prisma postgres connection string",
      required: true,
    },
    {
      key: "POSTGRES_URL",
      source: "integration",
      integration: "prisma",
      description: "postgres connection string (same as DATABASE_URL)",
      required: true,
    },
    {
      key: "PRISMA_DATABASE_URL",
      source: "integration",
      integration: "prisma",
      description: "prisma database connection string (same as DATABASE_URL)",
      required: true,
    },
    {
      key: "AI_GATEWAY_API_KEY",
      source: "user",
      description: "vercel ai gateway api key for llm access",
      required: true,
    },
    {
      key: "LANGFUSE_SECRET_KEY",
      source: "user",
      description: "langfuse secret key for observability (optional)",
      required: false,
    },
    {
      key: "LANGFUSE_PUBLIC_KEY",
      source: "user",
      description: "langfuse public key for observability (optional)",
      required: false,
    },
    {
      key: "LANGFUSE_BASE_URL",
      source: "user",
      description: "langfuse base url (default: https://cloud.langfuse.com)",
      required: false,
    },
  ],
  deployInstructions: [
    {
      step: 1,
      title: "click deploy to vercel",
      description: "vercel will clone the repository and guide you through project setup. you will need a vercel account (free).",
    },
    {
      step: 2,
      title: "add vercel postgres",
      description: "during setup, vercel will prompt you to add integrations. add vercel postgres (prisma) for the database (free tier available).",
      link: {
        text: "vercel postgres docs",
        url: "https://vercel.com/docs/storage/vercel-postgres",
      },
    },
    {
      step: 3,
      title: "configure environment variables",
      description: "add required environment variables: AI_GATEWAY_API_KEY (required), and optional langfuse keys for observability.",
      link: {
        text: "ai gateway docs",
        url: "https://vercel.com/docs/ai-gateway",
      },
    },
  ],
  guideSteps: [
    {
      title: "verify deployment",
      description: "make sure your vercel deployment completed successfully. check your vercel dashboard for any build errors.",
      link: {
        text: "open vercel dashboard",
        url: "https://vercel.com/dashboard",
      },
    },
    {
      title: "database setup",
      description: "if you added prisma postgres during deployment, your database is ready with DATABASE_URL configured. otherwise, add it from your vercel project settings.",
      details: [
        "go to your vercel project settings",
        "click \"storage\" tab",
        "select \"prisma\" and create a database",
        "DATABASE_URL will be added automatically",
      ],
      link: {
        text: "prisma postgres docs",
        url: "https://www.prisma.io/docs/postgres",
      },
    },
    {
      title: "configure ai gateway",
      description: "add your AI_GATEWAY_API_KEY in vercel project settings > environment variables. this is required for llm access.",
      link: {
        text: "get ai gateway key",
        url: "https://vercel.com/docs/ai-gateway/authentication",
      },
    },
    {
      title: "optional: add langfuse",
      description: "optionally add langfuse keys (LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, LANGFUSE_BASE_URL) for observability and monitoring.",
      link: {
        text: "langfuse docs",
        url: "https://langfuse.com/docs",
      },
    },
    {
      title: "redeploy",
      description: "after adding environment variables, redeploy your project to apply the changes. go to your vercel project and click \"redeploy\".",
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
  sourceRepo: "https://github.com/vishesh-baghel/sensie",
  sourcePath: "",
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
  deployInstructions: [
    {
      step: 1,
      title: "click deploy to vercel",
      description: "vercel will clone the repository and guide you through project setup. you will need a vercel account (free).",
    },
    {
      step: 2,
      title: "add neon postgres",
      description: "during setup, add neon postgres integration for the database (free tier available).",
      link: {
        text: "neon docs",
        url: "https://neon.tech/docs",
      },
    },
    {
      step: 3,
      title: "configure ai gateway",
      description: "vercel ai gateway will be set up automatically during deployment.",
    },
  ],
  guideSteps: [
    {
      title: "verify deployment",
      description: "make sure your vercel deployment completed successfully. check your vercel dashboard for any build errors.",
      link: {
        text: "open vercel dashboard",
        url: "https://vercel.com/dashboard",
      },
    },
    {
      title: "database setup",
      description: "if you added neon postgres during deployment, your database is ready. otherwise, add it now from your vercel project settings.",
      details: [
        "go to your vercel project settings",
        "click \"storage\" tab",
        "select \"neon\" and create a database",
        "environment variables will be added automatically",
      ],
      link: {
        text: "neon + vercel docs",
        url: "https://neon.tech/docs/guides/vercel",
      },
    },
    {
      title: "redeploy",
      description: "after adding environment variables, redeploy your project to apply the changes. go to your vercel project and click \"redeploy\".",
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
