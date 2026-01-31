import path from 'path';
import os from 'os';
import type { WorklogConfig } from './types.js';

const parseRedactedTerms = (raw: string): Record<string, string> => {
  if (!raw) return {};
  const terms: Record<string, string> = {};
  for (const pair of raw.split(',')) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) continue;
    const term = pair.slice(0, colonIdx).trim();
    const replacement = pair.slice(colonIdx + 1).trim();
    if (term && replacement) {
      terms[term] = replacement;
    }
  }
  return terms;
};

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
    blockedDomains: (process.env.WORKLOG_BLOCKED_DOMAINS || '').split(',').filter(Boolean),
    redactedTerms: parseRedactedTerms(process.env.WORKLOG_REDACTED_TERMS || ''),
  },
  enrichment: {
    provider: 'ai-gateway',
    model: process.env.WORKLOG_ENRICHMENT_MODEL || 'anthropic/claude-3-5-haiku-latest',
    apiKey: getEnvOrThrow('AI_GATEWAY_API_KEY'),
  },
});
