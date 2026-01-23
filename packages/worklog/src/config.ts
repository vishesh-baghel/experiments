import path from 'path';
import os from 'os';
import type { WorklogConfig } from './types.js';

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const loadConfig = (): WorklogConfig => ({
  memory: {
    url: getEnvOrThrow('MEMORY_API_URL'),
    apiKey: getEnvOrThrow('MEMORY_API_KEY'),
  },
  sessionPaths: {
    claudeCode: path.join(os.homedir(), '.claude', 'projects'),
  },
  sanitization: {
    blockedProjects: (process.env.WORKLOG_BLOCKED_PROJECTS || '').split(',').filter(Boolean),
    blockedPaths: (process.env.WORKLOG_BLOCKED_PATHS || '').split(',').filter(Boolean),
    allowedProjects: (process.env.WORKLOG_ALLOWED_PROJECTS || 'portfolio,experiments').split(',').filter(Boolean),
    blockedDomains: (process.env.WORKLOG_BLOCKED_DOMAINS || '').split(',').filter(Boolean),
  },
  enrichment: {
    provider: 'openai',
    model: process.env.WORKLOG_ENRICHMENT_MODEL || 'gpt-4o-mini',
    apiKey: getEnvOrThrow('OPENAI_API_KEY'),
  },
});
