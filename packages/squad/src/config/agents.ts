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
    "ai learning agent that teaches through socratic questioning. named after master roshi (sensei). forces deep understanding through guided questions, tracks mastery with spaced repetition, and adapts to your learning pace.",
  features: [
    {
      title: "socratic teaching",
      description:
        "learns through guided questioning, never gives direct answers until you demonstrate understanding",
    },
    {
      title: "spaced repetition",
      description:
        "uses fsrs-5 algorithm (same as anki) to schedule reviews at optimal intervals for retention",
    },
    {
      title: "adaptive difficulty",
      description:
        "adjusts question difficulty based on your performance - from simple recall to complex synthesis",
    },
    {
      title: "knowledge gap detection",
      description:
        "identifies areas where understanding is shallow and creates targeted exercises",
    },
    {
      title: "feynman technique",
      description:
        "prompts you to explain concepts simply, refining until mastery is demonstrated",
    },
    {
      title: "master roshi personality",
      description:
        "wise, demanding but encouraging teaching style with anime references for fun",
    },
    {
      title: "progress tracking",
      description:
        "visual mastery gauges, learning streaks, xp system, and achievement badges for motivation",
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
      description:
        "serverless postgres database with pooled and direct connections (via vercel integration)",
    },
    {
      name: "ai gateway",
      cost: "~$5/month",
      description:
        "vercel ai gateway for llm access (claude/gpt-4 for socratic questioning and answer evaluation)",
    },
    {
      name: "langfuse (optional)",
      cost: "free tier",
      description:
        "llm observability platform for monitoring teaching quality and learning analytics (optional)",
    },
  ],
  sourceRepo: "https://github.com/vishesh-baghel/sensie",
  sourcePath: "",
  integrations: ["neon", "ai-gateway"],
  envVars: [
    // Database - Neon Postgres (Two URLs Required)
    {
      key: "DATABASE_URL",
      source: "integration",
      integration: "neon",
      description:
        "neon postgres pooled connection (for serverless runtime queries) - has '-pooler' in hostname",
      required: true,
    },
    {
      key: "DATABASE_URL_UNPOOLED",
      source: "integration",
      integration: "neon",
      description:
        "neon postgres direct connection (for prisma migrations during build) - without '-pooler' in hostname",
      required: true,
    },

    // AI Gateway
    {
      key: "AI_GATEWAY_API_KEY",
      source: "user",
      description:
        "vercel ai gateway api key for llm access (claude/gpt-4 for teaching and evaluation)",
      required: true,
    },

    // Authentication
    {
      key: "AGENT_PASSPHRASE_HASH",
      source: "generated",
      description:
        "bcrypt hash of owner passphrase. generate passphrase, then hash with: npx bcrypt-cli hash 'your-passphrase'",
      required: true,
    },

    // Observability (Optional)
    {
      key: "LANGFUSE_SECRET_KEY",
      source: "user",
      description:
        "langfuse secret key for llm observability and tracing (optional)",
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
      description:
        "langfuse base url (optional, default: https://cloud.langfuse.com)",
      required: false,
    },

    // Feature Flags (Optional)
    {
      key: "ALLOW_SIGNUP",
      source: "user",
      description:
        "allow visitor account creation (optional, default: true until owner exists)",
      required: false,
    },
  ],
  deployInstructions: [
    {
      step: 1,
      title: "click deploy to vercel",
      description:
        "vercel will clone the repository and guide you through project setup. you will need a free vercel account.",
    },
    {
      step: 2,
      title: "add neon postgres integration",
      description:
        "during setup, vercel will prompt you to add storage. select neon postgres (free tier available). this automatically adds DATABASE_URL and DATABASE_URL_UNPOOLED to your environment variables.",
      link: {
        text: "neon + vercel docs",
        url: "https://neon.tech/docs/guides/vercel",
      },
    },
    {
      step: 3,
      title: "configure required environment variables",
      description:
        "you must add these before deployment: AI_GATEWAY_API_KEY (from vercel ai gateway) and AGENT_PASSPHRASE_HASH (bcrypt hash of your passphrase). vercel will show an env vars form during deploy.",
      link: {
        text: "vercel ai gateway docs",
        url: "https://vercel.com/docs/ai-gateway/authentication",
      },
    },
    {
      step: 4,
      title: "optional: add langfuse for monitoring",
      description:
        "if you want llm observability, add LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, and optionally LANGFUSE_BASE_URL. you can skip this and add it later.",
      link: {
        text: "langfuse cloud",
        url: "https://cloud.langfuse.com",
      },
    },
  ],
  guideSteps: [
    {
      title: "verify deployment succeeded",
      description:
        "check your vercel dashboard to confirm the deployment completed without build errors. the build process includes prisma migrations.",
      link: {
        text: "open vercel dashboard",
        url: "https://vercel.com/dashboard",
      },
    },
    {
      title: "verify neon postgres setup",
      description:
        "confirm neon integration added both required database urls to your environment variables.",
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
      title: "configure ai gateway",
      description:
        "add your AI_GATEWAY_API_KEY for llm access. sensie uses claude/gpt-4 for socratic questioning and answer evaluation.",
      details: [
        "get your key from vercel ai gateway settings",
        "add to vercel: settings → environment variables → AI_GATEWAY_API_KEY",
        "estimated cost: ~$5/month for regular learning sessions",
      ],
      link: {
        text: "vercel ai gateway docs",
        url: "https://vercel.com/docs/ai-gateway/authentication",
      },
    },
    {
      title: "generate and add agent_passphrase_hash",
      description:
        "sensie uses passphrase-based authentication. you need to generate a bcrypt hash of your chosen passphrase.",
      details: [
        "choose a secure passphrase (min 8 characters)",
        "generate hash: npx bcrypt-cli hash 'your-passphrase'",
        "copy the output (starts with $2b$...)",
        "add to vercel: settings → environment variables → AGENT_PASSPHRASE_HASH",
        "remember your passphrase - you'll need it to log in!",
      ],
    },
    {
      title: "optional: add langfuse for observability",
      description:
        "langfuse provides monitoring and tracing for sensie's llm calls. helpful for tracking teaching quality and learning patterns.",
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
      description:
        "after adding all environment variables, trigger a redeploy to ensure they are applied. vercel will run migrations and build with the new config.",
      details: [
        "go to your vercel project deployments tab",
        "click the three-dot menu on latest deployment",
        "click 'redeploy' (keep production branch selected)",
        "wait for deployment to complete",
      ],
    },
    {
      title: "create your owner account",
      description:
        "visit your deployed sensie instance and create your owner account. this is required before sensie can start teaching you.",
      details: [
        "go to your deployed url (e.g., sensie-yourname.vercel.app)",
        "on first visit, you'll see a login form",
        "enter your username and the passphrase you chose earlier",
        "click 'login' to access your learning dashboard",
        "first user becomes the owner - signup auto-disabled after",
      ],
    },
    {
      title: "start your first learning topic",
      description:
        "after logging in, start a chat with sensie and tell it what you want to learn. sensie will guide you through socratic questioning.",
      details: [
        "go to chat and type what you want to learn (e.g., 'teach me rust')",
        "sensie will create a learning path and start with foundational questions",
        "answer honestly - sensie adapts difficulty based on your responses",
        "use /progress to see your mastery, /review for spaced repetition",
        "trust the sensei - no skipping ahead until concepts are mastered!",
      ],
    },
  ],
  status: "available",
  estimatedMonthlyCost: "~$5-7/month",
  demoUrl: "https://sensie.visheshbaghel.com",
  specUrl:
    "https://github.com/vishesh-baghel/sensie/tree/main/specs",
};

export const garyAgent: AgentConfig = {
  id: "gary",
  name: "gary",
  tagline: "document, don't create",
  description:
    "ai marketing agent that handles everything content and distribution. named after gary vaynerchuk. creates content from your daily work, repurposes across platforms, and builds your personal brand while you focus on building.",
  features: [
    {
      title: "content documentation",
      description:
        "turns your daily work, thoughts, and learnings into shareable content automatically",
    },
    {
      title: "multi-platform distribution",
      description:
        "repurposes content for twitter/x, linkedin, newsletter, and blog from a single source",
    },
    {
      title: "voice consistency",
      description:
        "learns your authentic voice and maintains it across all platforms and formats",
    },
    {
      title: "content calendar",
      description:
        "schedules and manages your content pipeline so you never miss posting",
    },
    {
      title: "engagement tracking",
      description:
        "monitors what resonates with your audience and optimizes future content",
    },
    {
      title: "trend surfing",
      description:
        "identifies relevant trends in your niche and suggests timely content angles",
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
      description:
        "serverless postgres database for content and analytics storage",
    },
    {
      name: "ai gateway",
      cost: "~$8/month",
      description:
        "vercel ai gateway for llm access (content generation and repurposing)",
    },
    {
      name: "social apis (optional)",
      cost: "varies",
      description:
        "platform-specific apis for automated posting (twitter, linkedin, etc.)",
    },
  ],
  sourceRepo: "https://github.com/vishesh-baghel/gary",
  sourcePath: "",
  integrations: ["neon", "ai-gateway"],
  envVars: [
    {
      key: "DATABASE_URL",
      source: "integration",
      integration: "neon",
      description:
        "neon postgres pooled connection for content and analytics storage",
      required: true,
    },
    {
      key: "DATABASE_URL_UNPOOLED",
      source: "integration",
      integration: "neon",
      description:
        "neon postgres direct connection for prisma migrations during build",
      required: true,
    },
    {
      key: "AI_GATEWAY_API_KEY",
      source: "user",
      description:
        "vercel ai gateway api key for content generation and repurposing",
      required: true,
    },
  ],
  deployInstructions: [
    {
      step: 1,
      title: "click deploy to vercel",
      description:
        "vercel will clone the repository and guide you through project setup.",
    },
    {
      step: 2,
      title: "add neon postgres",
      description:
        "during setup, add neon postgres integration for content storage.",
      link: {
        text: "neon docs",
        url: "https://neon.tech/docs/guides/vercel",
      },
    },
    {
      step: 3,
      title: "configure ai gateway",
      description:
        "add your AI_GATEWAY_API_KEY for content generation capabilities.",
    },
  ],
  guideSteps: [
    {
      title: "verify deployment",
      description:
        "check your vercel dashboard to confirm the deployment completed successfully.",
      link: {
        text: "open vercel dashboard",
        url: "https://vercel.com/dashboard",
      },
    },
    {
      title: "connect your platforms",
      description:
        "link your social media accounts to enable content distribution.",
    },
    {
      title: "set your voice",
      description:
        "provide examples of your writing style so gary can match your authentic voice.",
    },
  ],
  status: "coming-soon",
  estimatedMonthlyCost: "~$8-10/month",
};

export const agents: AgentConfig[] = [jackAgent, sensieAgent, garyAgent];

export const getAgentById = (id: string): AgentConfig | undefined => {
  return agents.find((agent) => agent.id === id);
};

export const getAvailableAgents = (): AgentConfig[] => {
  return agents.filter((agent) => agent.status === "available");
};

export const getComingSoonAgents = (): AgentConfig[] => {
  return agents.filter((agent) => agent.status === "coming-soon");
};
