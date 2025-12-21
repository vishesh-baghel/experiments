# Squad - Data Models

**Version:** 0.3.0  
**Last Updated:** Dec 21, 2025

---

## Overview

Squad V1 uses a simplified architecture with no persistent database:

1. **Static config** - Agent definitions in code (`src/config/agents.ts`)
2. **Session state** - Deploy session stored in encrypted cookie (iron-session)
3. **External state** - Created in user's Vercel account via Deploy Button

**Note:** User authentication and persistent storage are planned for V2.

---

## Session Storage (iron-session)

Deploy sessions are stored in encrypted HTTP-only cookies. No database required.

### DeploySession Type

```typescript
// src/lib/deploy/types.ts

export type DeployStepId = "vercel-deploy";

export type DeployStepStatus = "pending" | "in-progress" | "complete" | "error";

export interface DeployStep {
  id: DeployStepId;
  label: string;
  status: DeployStepStatus;
  error?: string;
}

export interface VercelDeploymentData {
  deploymentUrl: string;
  projectDashboardUrl?: string;
}

export interface DeploySession {
  agentId: string;
  currentStep: DeployStepId;
  steps: DeployStep[];
  vercel?: VercelDeploymentData;
  createdAt: number;
  expiresAt: number;
}
```

### Session Configuration

```typescript
// Session expires after 30 minutes
const SESSION_TTL_MS = 30 * 60 * 1000;

// iron-session configuration
const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "squad-deploy-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};
```

---

## Agent Configuration

### AgentConfig

The core data structure defining each deployable agent.

```typescript
// src/config/agents.ts

export type IntegrationType = 'prisma' | 'ai-gateway';

export type EnvVarSource = 'integration' | 'user' | 'generated';

export interface EnvVarConfig {
  /** environment variable key name */
  key: string;
  /** where this value comes from */
  source: EnvVarSource;
  /** if source is 'integration', which integration provides this */
  integration?: IntegrationType;
  /** human-readable description */
  description: string;
  /** is this required for the agent to function */
  required: boolean;
}

export interface RequirementConfig {
  /** name of the requirement */
  name: string;
  /** estimated cost (e.g., "free", "$5/month") */
  cost: string;
  /** brief description */
  description: string;
}

export interface FeatureConfig {
  /** feature title */
  title: string;
  /** feature description */
  description: string;
}

export interface DeployInstruction {
  /** instruction title */
  title: string;
  /** instruction description */
  description: string;
}

export interface GuideStep {
  /** step title */
  title: string;
  /** step description */
  description: string;
  /** optional external link */
  link?: string;
  /** link text */
  linkText?: string;
}

export interface AgentConfig {
  /** unique identifier (used in URLs) */
  id: string;
  
  /** display name */
  name: string;
  
  /** short tagline (shown on cards) */
  tagline: string;
  
  /** longer description (shown on detail page) */
  description: string;
  
  /** key features list */
  features: FeatureConfig[];
  
  /** requirements/costs for running this agent */
  requirements: RequirementConfig[];
  
  /** github repository URL (standalone repo, not monorepo) */
  sourceRepo: string;
  
  /** path within the repo (empty for root) */
  sourcePath: string;
  
  /** integrations to provision via Vercel marketplace */
  integrations: IntegrationType[];
  
  /** environment variables needed */
  envVars: EnvVarConfig[];
  
  /** deploy instructions shown on agent detail page */
  deployInstructions: DeployInstruction[];
  
  /** post-deployment setup guide steps */
  guideSteps: GuideStep[];
  
  /** availability status */
  status: 'available' | 'coming-soon';
  
  /** estimated monthly operating cost */
  estimatedMonthlyCost: string;
  
  /** demo URL if available */
  demoUrl?: string;
  
  /** spec/documentation URL */
  specUrl?: string;
}
```

### Example: Jack Agent Config

```typescript
export const jackAgent: AgentConfig = {
  id: 'jack',
  name: 'jack',
  tagline: 'because writer\'s block is for normies',
  description: 'x content agent that learns your voice. named after jack dorsey. tracks creators you follow, generates ideas from trending topics, and improves from 50% to 80% relevance in 4 weeks.',
  features: [
    {
      title: 'creator tracking',
      description: 'monitors 50-100 x creators you specify and extracts trending topics'
    },
    {
      title: 'idea generation',
      description: 'generates 5 content ideas daily based on trends and your projects'
    },
    {
      title: 'voice learning',
      description: 'learns from posts you mark as "good" and adapts to your style'
    },
    {
      title: 'outline creation',
      description: 'creates structured outlines so you write the actual content'
    }
  ],
  requirements: [
    {
      name: 'vercel account',
      cost: 'free',
      description: 'for hosting the application'
    },
    {
      name: 'neon postgres',
      cost: 'free tier',
      description: 'database for storing ideas, posts, and learned patterns'
    },
    {
      name: 'ai gateway',
      cost: '~$10/month',
      description: 'for gpt-4 api calls (pay per use)'
    },
    {
      name: 'apify',
      cost: '~$5/month',
      description: 'for x/twitter data scraping'
    }
  ],
  sourceRepo: 'https://github.com/vishesh-baghel/experiments',
  sourcePath: 'packages/jack-x-agent',
  integrations: ['neon', 'ai-gateway'],
  envVars: [
    {
      key: 'DATABASE_URL',
      source: 'integration',
      integration: 'neon',
      description: 'postgres connection string',
      required: true
    },
    {
      key: 'AI_GATEWAY_URL',
      source: 'integration',
      integration: 'ai-gateway',
      description: 'vercel ai gateway endpoint',
      required: true
    },
    {
      key: 'APIFY_API_KEY',
      source: 'user',
      description: 'your apify api key for x data',
      required: true
    },
    {
      key: 'AUTH_PASSPHRASE',
      source: 'generated',
      description: 'auto-generated passphrase for owner auth',
      required: true
    }
  ],
  status: 'available',
  estimatedMonthlyCost: '~$15/month',
  demoUrl: 'https://jack.visheshbaghel.com',
  specUrl: 'https://github.com/vishesh-baghel/experiments/tree/main/packages/jack-x-agent/specs'
};
```

### Example: Sensie Agent Config

```typescript
export const sensieAgent: AgentConfig = {
  id: 'sensie',
  name: 'sensie',
  tagline: 'your personal teacher in the age of ai',
  description: 'learning agent that tracks everything you learn and makes sure you\'re not getting dumb with new ai tools. your accountability partner for continuous growth.',
  features: [
    {
      title: 'learning tracker',
      description: 'logs what you learn daily with spaced repetition reminders'
    },
    {
      title: 'knowledge gaps',
      description: 'identifies areas where you\'re relying too much on ai'
    },
    {
      title: 'progress insights',
      description: 'weekly reports on your learning velocity and retention'
    }
  ],
  requirements: [
    {
      name: 'vercel account',
      cost: 'free',
      description: 'for hosting the application'
    },
    {
      name: 'neon postgres',
      cost: 'free tier',
      description: 'database for learning records'
    },
    {
      name: 'ai gateway',
      cost: '~$5/month',
      description: 'for ai-powered insights'
    }
  ],
  sourceRepo: 'https://github.com/vishesh-baghel/experiments',
  sourcePath: 'packages/sensie',
  integrations: ['neon', 'ai-gateway'],
  envVars: [
    {
      key: 'DATABASE_URL',
      source: 'integration',
      integration: 'neon',
      description: 'postgres connection string',
      required: true
    },
    {
      key: 'AI_GATEWAY_URL',
      source: 'integration',
      integration: 'ai-gateway',
      description: 'vercel ai gateway endpoint',
      required: true
    }
  ],
  status: 'coming-soon',
  estimatedMonthlyCost: '~$5/month'
};
```

---

## API Routes

### Deploy Start

```typescript
// POST /api/deploy/start
// Initializes a deploy session for an agent

export interface DeployStartRequest {
  agentId: string;
}

export interface DeployStartResponse {
  success: boolean;
  session?: DeploySession;
  error?: string;
}
```

### Deploy Redirect

```typescript
// GET /api/deploy/vercel/deploy
// Redirects to Vercel Deploy Button with agent configuration

// Query params:
// - agentId: string (required)

// Redirects to: https://vercel.com/new/clone?...
// With parameters:
// - repository-url: agent's source repo
// - redirect-url: callback URL with state
// - project-name: suggested project name
// - products: Prisma Postgres integration config
// - env: required environment variables
```

### Deploy Callback

```typescript
// GET /api/deploy/vercel/callback
// Handles callback from Vercel after deployment

// Query params from Vercel:
// - state: base64url encoded { agentId }
// - deployment-url: deployed project URL (optional)
// - project-dashboard-url: Vercel dashboard URL (optional)

// Updates session with deployment data and redirects to deploy page
```

---

## Vercel Deploy Button Integration

Squad uses Vercel's Deploy Button instead of OAuth. This simplifies the flow:

```typescript
// Deploy Button URL structure
const deployUrl = new URL("https://vercel.com/new/clone");
deployUrl.searchParams.set("repository-url", agent.sourceRepo);
deployUrl.searchParams.set("redirect-url", callbackUrl);
deployUrl.searchParams.set("project-name", `${agentId}-agent`);
deployUrl.searchParams.set("repository-name", `${agentId}-agent`);

// Prisma Postgres integration
const prismaProduct = {
  type: "integration",
  protocol: "storage",
  productSlug: "prisma-postgres",
  integrationSlug: "prisma",
};
deployUrl.searchParams.set("products", JSON.stringify([prismaProduct]));
deployUrl.searchParams.set("skippable-integrations", "1");

// Environment variables
deployUrl.searchParams.set("env", requiredEnvVars.join(","));
```

---

## Constants

```typescript
// src/lib/deploy/types.ts

export const DEPLOY_STEPS: DeployStep[] = [
  { id: "vercel-deploy", label: "deploy to vercel", status: "pending" },
];

export const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
```

---

## Future: V2 Data Models

Planned for V2 with user authentication:

```typescript
// V2: User accounts (Better Auth)
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

// V2: Deployment records
export interface Deployment {
  id: string;
  userId: string;
  agentId: string;
  deploymentUrl: string;
  projectDashboardUrl?: string;
  createdAt: Date;
}

// V2: Payment integration (DodoPayments)
export interface PaymentSession {
  id: string;
  agentId: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: 'pending' | 'completed' | 'failed';
  email: string;
  createdAt: number;
}
```
