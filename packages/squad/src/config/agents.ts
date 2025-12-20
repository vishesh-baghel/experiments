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
  sourceRepo: "https://github.com/vishesh-baghel/jack",
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
  deployInstructions: [
    {
      step: 1,
      title: "click deploy to vercel",
      description: "vercel will clone the repository and guide you through project setup. you will need a vercel account (free).",
    },
    {
      step: 2,
      title: "add neon postgres",
      description: "during setup, vercel will prompt you to add integrations. add neon postgres for the database (free tier available).",
      link: {
        text: "neon docs",
        url: "https://neon.tech/docs",
      },
    },
    {
      step: 3,
      title: "get apify api key",
      description: "after deployment, add your apify api key in vercel project settings > environment variables. apify is used for x/twitter data scraping.",
      link: {
        text: "get apify key",
        url: "https://console.apify.com/account/integrations",
      },
    },
    {
      step: 4,
      title: "set auth passphrase",
      description: "add AUTH_PASSPHRASE env var with a secret passphrase. this protects your agent's admin endpoints.",
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
      title: "add apify api key",
      description: "add your apify api key in vercel project settings > environment variables. apify is used for x/twitter data scraping.",
      link: {
        text: "get apify key",
        url: "https://console.apify.com/account/integrations",
      },
    },
    {
      title: "set auth passphrase",
      description: "add AUTH_PASSPHRASE env var with a secret passphrase. this protects your agent's admin endpoints. use a strong, unique passphrase.",
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
