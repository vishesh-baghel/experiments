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
    {
      title: "cost-optimized scraping",
      description:
        "uses twitterapi.io for 94% cost savings ($1/month vs $18/month) with automatic fallback to apify",
    },
    {
      title: "automated daily updates",
      description:
        "cron jobs scrape fresh tweets at 2am utc and cleanup old data at 3am utc automatically",
    },
    {
      title: "visitor mode",
      description:
        "optional read-only access for others to view your content ideas without modification",
    },
  ],
  requirements: [
    {
      name: "vercel account",
      cost: "free",
      description: "for hosting the next.js application",
    },
    {
      name: "neon postgres",
      cost: "free tier (500mb)",
      description: "serverless postgres database with pooled and direct connections (via vercel integration)",
    },
    {
      name: "twitterapi.io account",
      cost: "~$1-2/month",
      description: "primary tweet scraper - cost-effective at $0.00015/tweet (scraping 50-100 tweets/day from 5-10 creators)",
    },
    {
      name: "ai gateway",
      cost: "~$10/month",
      description: "vercel ai gateway for gpt-4 api calls (pay-per-use for idea and outline generation)",
    },
    {
      name: "apify account (optional)",
      cost: "$5/month",
      description: "backup tweet scraper if twitterapi.io has issues (not required for deployment)",
    },
    {
      name: "langfuse (optional)",
      cost: "free tier",
      description: "llm observability platform for monitoring agent performance (optional)",
    },
  ],
  sourceRepo: "https://github.com/vishesh-baghel/jack",
  sourcePath: "",
  integrations: ["neon", "ai-gateway"],
  envVars: [
    // Database - Neon Postgres (Two URLs Required)
    {
      key: "DATABASE_URL",
      source: "integration",
      integration: "neon",
      description: "neon postgres pooled connection (for serverless runtime queries) - has '-pooler' in hostname",
      required: true,
    },
    {
      key: "DATABASE_URL_UNPOOLED",
      source: "integration",
      integration: "neon",
      description: "neon postgres direct connection (for prisma migrations during build) - without '-pooler' in hostname",
      required: true,
    },

    // Twitter Scraping - Primary (CRITICAL)
    {
      key: "TWITTERAPI_IO_KEY",
      source: "user",
      description: "twitterapi.io api key for cost-effective tweet scraping ($0.00015/tweet). get from https://twitterapi.io",
      required: true,
    },

    // Cron Job Authentication (CRITICAL)
    {
      key: "CRON_SECRET",
      source: "generated",
      description: "random secret for authenticating daily cron jobs (scraping at 2am, cleanup at 3am utc). generate with: openssl rand -hex 32",
      required: true,
    },

    // AI Gateway
    {
      key: "AI_GATEWAY_API_KEY",
      source: "user",
      description: "vercel ai gateway api key for llm access (gpt-4 for idea/outline generation)",
      required: true,
    },

    // Twitter Scraping - Backup (Optional)
    {
      key: "APIFY_API_KEY",
      source: "user",
      description: "apify api key (backup scraper, optional). get from https://console.apify.com/account/integrations",
      required: false,
    },

    // Observability (Optional)
    {
      key: "LANGFUSE_SECRET_KEY",
      source: "user",
      description: "langfuse secret key for llm observability and tracing (optional)",
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
      description: "langfuse base url (optional, default: https://cloud.langfuse.com)",
      required: false,
    },

    // Feature Flags (Optional)
    {
      key: "ALLOW_SIGNUP",
      source: "user",
      description: "allow visitor account creation when no owner exists (optional, auto-disabled after owner signup)",
      required: false,
    },
  ],
  deployInstructions: [
    {
      step: 1,
      title: "click deploy to vercel",
      description: "vercel will clone the repository and guide you through project setup. you will need a free vercel account.",
    },
    {
      step: 2,
      title: "add neon postgres integration",
      description: "during setup, vercel will prompt you to add storage. select neon postgres (free tier available). this automatically adds DATABASE_URL and DATABASE_URL_UNPOOLED to your environment variables.",
      link: {
        text: "neon + vercel docs",
        url: "https://neon.tech/docs/guides/vercel",
      },
    },
    {
      step: 3,
      title: "configure required environment variables",
      description: "you must add these before deployment: TWITTERAPI_IO_KEY (from twitterapi.io dashboard), AI_GATEWAY_API_KEY (from vercel ai gateway), and CRON_SECRET (generate with: openssl rand -hex 32). vercel will show an env vars form during deploy.",
      link: {
        text: "twitterapi.io signup",
        url: "https://twitterapi.io",
      },
    },
    {
      step: 4,
      title: "optional: add langfuse for monitoring",
      description: "if you want llm observability, add LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, and optionally LANGFUSE_BASE_URL. you can skip this and add it later.",
      link: {
        text: "langfuse cloud",
        url: "https://cloud.langfuse.com",
      },
    },
  ],
  guideSteps: [
    {
      title: "verify deployment succeeded",
      description: "check your vercel dashboard to confirm the deployment completed without build errors. the build process includes prisma migrations.",
      link: {
        text: "open vercel dashboard",
        url: "https://vercel.com/dashboard",
      },
    },
    {
      title: "verify neon postgres setup",
      description: "confirm neon integration added both required database urls to your environment variables.",
      details: [
        "go to your vercel project → settings → environment variables",
        "verify DATABASE_URL exists (has '-pooler' in hostname)",
        "verify DATABASE_URL_UNPOOLED exists (no '-pooler' in hostname)",
        "both should point to the same neon database",
      ],
      link: {
        text: "neon + vercel integration guide",
        url: "https://neon.tech/docs/guides/vercel",
      },
    },
    {
      title: "set up twitterapi.io account",
      description: "twitterapi.io is the primary tweet scraper. you need an api key for jack to scrape tweets from creators you follow.",
      details: [
        "create account at https://twitterapi.io",
        "go to dashboard → api keys",
        "create new api key and copy it",
        "add to vercel: settings → environment variables → TWITTERAPI_IO_KEY",
        "estimated cost: $1-2/month for 50-100 tweets/day from 5-10 creators",
      ],
      link: {
        text: "twitterapi.io dashboard",
        url: "https://twitterapi.io/dashboard",
      },
    },
    {
      title: "generate and add cron_secret",
      description: "jack runs daily cron jobs (2am utc: scrape tweets, 3am utc: cleanup old tweets). these require authentication via CRON_SECRET.",
      details: [
        "generate secret locally: openssl rand -hex 32",
        "copy the output (64-character hex string)",
        "add to vercel: settings → environment variables → CRON_SECRET",
        "this prevents unauthorized access to your cron endpoints",
      ],
    },
    {
      title: "configure ai gateway",
      description: "add your AI_GATEWAY_API_KEY for llm access. jack uses gpt-4 for generating content ideas and outlines.",
      details: [
        "get your key from vercel ai gateway settings",
        "add to vercel: settings → environment variables → AI_GATEWAY_API_KEY",
        "estimated cost: ~$10/month for 3 generations/day",
      ],
      link: {
        text: "vercel ai gateway docs",
        url: "https://vercel.com/docs/ai-gateway/authentication",
      },
    },
    {
      title: "optional: add apify as backup scraper",
      description: "optionally add APIFY_API_KEY for backup tweet scraping if twitterapi.io has issues. not required for deployment.",
      details: [
        "create account at https://console.apify.com",
        "go to integrations and create api token",
        "add to vercel: settings → environment variables → APIFY_API_KEY",
        "jack will automatically use apify if twitterapi.io fails",
      ],
      link: {
        text: "apify console",
        url: "https://console.apify.com/account/integrations",
      },
    },
    {
      title: "optional: enable visitor mode",
      description: "by default, jack allows you to create your owner account on first visit. after that, signup is auto-disabled. optionally enable visitor mode for others to view your ideas (read-only).",
      details: [
        "visitor mode is controlled in your deployed app settings",
        "visitors can browse your content ideas but cannot modify or generate new ones",
        "to explicitly control signup: set ALLOW_SIGNUP=false in vercel env vars",
      ],
    },
    {
      title: "optional: add langfuse for observability",
      description: "langfuse provides monitoring and tracing for jack's llm calls. helpful for debugging and cost tracking.",
      details: [
        "create account at https://cloud.langfuse.com",
        "create new project and get secret key and public key",
        "add to vercel: LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY",
        "optionally set LANGFUSE_BASE_URL (defaults to cloud.langfuse.com)",
      ],
      link: {
        text: "langfuse quickstart",
        url: "https://langfuse.com/docs/get-started",
      },
    },
    {
      title: "redeploy with all environment variables",
      description: "after adding all environment variables, trigger a redeploy to ensure they are applied. vercel will run migrations and build with the new config.",
      details: [
        "go to your vercel project deployments tab",
        "click the three-dot menu on latest deployment",
        "click 'redeploy' (keep production branch selected)",
        "wait for deployment to complete",
      ],
    },
    {
      title: "verify cron jobs are scheduled",
      description: "jack uses vercel cron jobs for automated daily scraping. verify they are registered after deployment.",
      details: [
        "go to vercel project → settings → cron jobs",
        "verify two cron jobs exist:",
        "  - /api/cron/scrape-tweets (daily at 2am utc)",
        "  - /api/cron/cleanup-tweets (daily at 3am utc)",
        "if missing, check vercel.json in repository root",
        "cron jobs run automatically - no manual trigger needed",
      ],
      link: {
        text: "vercel cron documentation",
        url: "https://vercel.com/docs/cron-jobs",
      },
    },
    {
      title: "create your owner account",
      description: "visit your deployed jack instance and create your owner account. this is required before jack can generate content ideas for you.",
      details: [
        "go to your deployed url (e.g., jack-yourname.vercel.app)",
        "on first visit, you'll see a signup form",
        "enter your email, optional name, and secure passphrase (min 8 chars)",
        "click 'create my account'",
        "signup is automatically disabled after owner account exists",
        "your passphrase is bcrypt-encrypted - remember it!",
      ],
    },
    {
      title: "add creators to track",
      description: "after logging in, add twitter/x creators whose content you want jack to learn from. jack scrapes their tweets daily to identify trending topics.",
      details: [
        "go to creators tab in your jack dashboard",
        "click 'add creator' and enter twitter handle (without @)",
        "set tweet count (how many tweets to scrape per day per creator)",
        "recommended: start with 5-10 creators, 10 tweets each",
        "jack will scrape them during the next 2am utc cron job",
        "scraped tweets are stored for 7 days (automatic cleanup)",
      ],
    },
  ],
  status: "available",
  estimatedMonthlyCost: "~$11-12/month",
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
