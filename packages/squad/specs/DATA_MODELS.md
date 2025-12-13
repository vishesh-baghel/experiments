# Squad - Data Models

**Version:** 0.2.0  
**Last Updated:** Dec 13, 2025

---

## Overview

Squad uses a Neon Postgres database for user management and deployment tracking:

1. **Database tables** - Users, sessions, accounts, deployments (via Better Auth + custom)
2. **Static config** - Agent definitions in code
3. **Session state** - OAuth tokens during deploy flow (temporary, discarded after use)
4. **External state** - Created in user's Vercel/GitHub accounts

---

## Database Schema

### Better Auth Tables (Managed)

Better Auth manages these tables automatically:

```sql
-- Users table (extended with custom fields)
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  name          TEXT,
  email         TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  image         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  
  -- Custom fields
  forked_repo   TEXT,              -- e.g., "username/experiments"
  forked_at     TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT REFERENCES users(id),
  token         TEXT UNIQUE NOT NULL,
  expires_at    TIMESTAMP NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- OAuth accounts table
CREATE TABLE accounts (
  id                TEXT PRIMARY KEY,
  user_id           TEXT REFERENCES users(id),
  account_id        TEXT NOT NULL,
  provider_id       TEXT NOT NULL,        -- 'github', 'google'
  access_token      TEXT,
  refresh_token     TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope             TEXT,
  id_token          TEXT,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(provider_id, account_id)
);
```

### Custom Tables

```sql
-- Deployed agents per user
CREATE TABLE deployments (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT REFERENCES users(id) NOT NULL,
  agent_id        TEXT NOT NULL,           -- 'jack', 'sensie', etc.
  
  -- Vercel deployment info
  vercel_project_id   TEXT,
  vercel_project_name TEXT,
  deployment_url      TEXT,
  
  -- Status
  status          TEXT DEFAULT 'pending',  -- 'pending', 'deployed', 'failed'
  error_message   TEXT,
  
  -- Timestamps
  created_at      TIMESTAMP DEFAULT NOW(),
  deployed_at     TIMESTAMP,
  
  -- Prevent duplicate deployments
  UNIQUE(user_id, agent_id)
);

-- Index for fast lookups
CREATE INDEX idx_deployments_user_id ON deployments(user_id);
CREATE INDEX idx_deployments_agent_id ON deployments(agent_id);
```

### TypeScript Types (Drizzle)

```typescript
// src/db/schema.ts
import { pgTable, text, timestamp, boolean, index, unique } from 'drizzle-orm/pg-core';

// Users table (Better Auth + custom fields)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
  // Custom fields
  forkedRepo: text('forked_repo'),
  forkedAt: timestamp('forked_at'),
});

// Deployments table
export const deployments = pgTable('deployments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id).notNull(),
  agentId: text('agent_id').notNull(),
  
  vercelProjectId: text('vercel_project_id'),
  vercelProjectName: text('vercel_project_name'),
  deploymentUrl: text('deployment_url'),
  
  status: text('status').default('pending'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow(),
  deployedAt: timestamp('deployed_at'),
}, (table) => ({
  userIdIdx: index('idx_deployments_user_id').on(table.userId),
  agentIdIdx: index('idx_deployments_agent_id').on(table.agentId),
  uniqueUserAgent: unique('unique_user_agent').on(table.userId, table.agentId),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;
```

---

## Agent Configuration

### AgentConfig

The core data structure defining each deployable agent.

```typescript
// src/config/agents.ts

export type IntegrationType = 'neon' | 'ai-gateway';

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
  
  /** github repository URL */
  sourceRepo: string;
  
  /** path within the monorepo (e.g., "packages/jack-x-agent") */
  sourcePath: string;
  
  /** integrations to provision via Vercel */
  integrations: IntegrationType[];
  
  /** environment variables needed */
  envVars: EnvVarConfig[];
  
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

## Session State

During the deploy flow, we need to track OAuth tokens temporarily.

### DeploySession

```typescript
// stored in encrypted cookies during deploy flow

export interface DeploySession {
  /** which agent is being deployed */
  agentId: string;
  
  /** vercel oauth state */
  vercel?: {
    accessToken: string;
    teamId?: string;
    expiresAt: number;
  };
  
  /** github oauth state */
  github?: {
    accessToken: string;
    username: string;
    expiresAt: number;
  };
  
  /** current step in the flow */
  step: DeployStep;
  
  /** session creation timestamp */
  createdAt: number;
  
  /** session expiry (30 minutes) */
  expiresAt: number;
}

export type DeployStep = 
  | 'initial'
  | 'vercel-auth'
  | 'github-auth'
  | 'provisioning'
  | 'deploying'
  | 'complete'
  | 'error';
```

### DeployResult

```typescript
// returned after successful deployment

export interface DeployResult {
  /** deployed project URL */
  deploymentUrl: string;
  
  /** vercel project dashboard URL */
  projectUrl: string;
  
  /** github repo URL (user's fork) */
  repoUrl: string;
  
  /** provisioned integrations */
  integrations: {
    type: IntegrationType;
    status: 'success' | 'failed';
    details?: string;
  }[];
  
  /** any user-provided env vars that were set */
  configuredEnvVars: string[];
}
```

---

## API Response Types

### OAuth Callback

```typescript
// GET /api/auth/vercel/callback
export interface VercelAuthResponse {
  success: boolean;
  accessToken?: string;
  teamId?: string;
  error?: string;
}

// GET /api/auth/github/callback
export interface GitHubAuthResponse {
  success: boolean;
  accessToken?: string;
  username?: string;
  error?: string;
}
```

### Deployment API

```typescript
// POST /api/deploy/provision
export interface ProvisionRequest {
  agentId: string;
  vercelToken: string;
  githubToken: string;
}

export interface ProvisionResponse {
  success: boolean;
  repoUrl?: string;
  integrations?: {
    neon?: { connectionString: string };
    aiGateway?: { endpoint: string };
  };
  error?: string;
}

// POST /api/deploy/create
export interface CreateDeploymentRequest {
  agentId: string;
  vercelToken: string;
  repoUrl: string;
  envVars: Record<string, string>;
}

export interface CreateDeploymentResponse {
  success: boolean;
  deploymentUrl?: string;
  projectUrl?: string;
  error?: string;
}
```

---

## Vercel API Types

Types for interacting with Vercel's REST API.

```typescript
// vercel project creation
export interface VercelProjectCreate {
  name: string;
  gitRepository: {
    type: 'github';
    repo: string;  // "owner/repo"
  };
  rootDirectory?: string;
  framework?: 'nextjs';
  buildCommand?: string;
  installCommand?: string;
}

// vercel environment variable
export interface VercelEnvVar {
  key: string;
  value: string;
  type: 'encrypted' | 'plain';
  target: ('production' | 'preview' | 'development')[];
}

// vercel integration provisioning
export interface VercelIntegrationProvision {
  integrationSlug: string;  // e.g., "neon", "ai-gateway"
  projectId: string;
}
```

---

## GitHub API Types

Types for interacting with GitHub's REST API.

```typescript
// fork a repository
export interface GitHubForkRequest {
  owner: string;
  repo: string;
  name?: string;  // optional custom name for fork
}

export interface GitHubForkResponse {
  id: number;
  full_name: string;  // "user/repo"
  html_url: string;
  clone_url: string;
}
```

---

## Future: Payment Types (V2)

Placeholder for DodoPayments integration.

```typescript
// V2: payment session
export interface PaymentSession {
  id: string;
  agentId: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: 'pending' | 'completed' | 'failed';
  email: string;
  createdAt: number;
}

// V2: paid deployment record
export interface PaidDeployment {
  id: string;
  paymentSessionId: string;
  agentId: string;
  deploymentUrl: string;
  createdAt: number;
}
```

---

## Constants

```typescript
// src/config/constants.ts

export const OAUTH_CONFIG = {
  vercel: {
    authUrl: 'https://vercel.com/oauth/authorize',
    tokenUrl: 'https://api.vercel.com/oauth/token',
    scopes: ['user', 'project', 'integration'],
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'read:user'],
  },
};

export const DEPLOY_CONFIG = {
  sessionTtlMs: 30 * 60 * 1000,  // 30 minutes
  pollIntervalMs: 2000,          // 2 seconds
  maxPollAttempts: 60,           // 2 minutes max wait
};

export const INTEGRATIONS = {
  neon: {
    slug: 'neon',
    name: 'Neon Postgres',
    envVar: 'DATABASE_URL',
  },
  aiGateway: {
    slug: 'ai-gateway',
    name: 'Vercel AI Gateway',
    envVar: 'AI_GATEWAY_URL',
  },
};
```
