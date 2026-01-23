import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import os from 'os';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const setRequiredEnv = () => {
    process.env.MEMORY_API_URL = 'https://memory.test.com';
    process.env.MEMORY_API_KEY = 'mem_test_key';
    process.env.AI_GATEWAY_API_KEY = 'gw-test-key';
  };

  describe('required environment variables', () => {
    it('throws when MEMORY_API_URL is missing', async () => {
      process.env.MEMORY_API_KEY = 'key';
      process.env.AI_GATEWAY_API_KEY = 'key';

      const { loadConfig } = await import('../src/config.js');
      expect(() => loadConfig()).toThrow('Missing required environment variable: MEMORY_API_URL');
    });

    it('throws when MEMORY_API_KEY is missing', async () => {
      process.env.MEMORY_API_URL = 'http://localhost';
      process.env.AI_GATEWAY_API_KEY = 'key';

      const { loadConfig } = await import('../src/config.js');
      expect(() => loadConfig()).toThrow('Missing required environment variable: MEMORY_API_KEY');
    });

    it('throws when AI_GATEWAY_API_KEY is missing', async () => {
      process.env.MEMORY_API_URL = 'http://localhost';
      process.env.MEMORY_API_KEY = 'key';

      const { loadConfig } = await import('../src/config.js');
      expect(() => loadConfig()).toThrow('Missing required environment variable: AI_GATEWAY_API_KEY');
    });

    it('succeeds when all required variables are set', async () => {
      setRequiredEnv();

      const { loadConfig } = await import('../src/config.js');
      expect(() => loadConfig()).not.toThrow();
    });
  });

  describe('memory config', () => {
    it('sets memory.url from MEMORY_API_URL', async () => {
      setRequiredEnv();
      process.env.MEMORY_API_URL = 'https://my-memory.com';

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.memory.url).toBe('https://my-memory.com');
    });

    it('sets memory.apiKey from MEMORY_API_KEY', async () => {
      setRequiredEnv();
      process.env.MEMORY_API_KEY = 'mem_abc123';

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.memory.apiKey).toBe('mem_abc123');
    });
  });

  describe('session paths', () => {
    it('sets claudeCode path to ~/.claude/projects', async () => {
      setRequiredEnv();

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.sessionPaths.claudeCode).toBe(
        path.join(os.homedir(), '.claude', 'projects')
      );
    });
  });

  describe('sanitization config', () => {
    it('parses WORKLOG_BLOCKED_PROJECTS as comma-separated list', async () => {
      setRequiredEnv();
      process.env.WORKLOG_BLOCKED_PROJECTS = 'client-a,client-b,secret-project';

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.sanitization.blockedProjects).toEqual(['client-a', 'client-b', 'secret-project']);
    });

    it('defaults blockedProjects to empty array', async () => {
      setRequiredEnv();
      delete process.env.WORKLOG_BLOCKED_PROJECTS;

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.sanitization.blockedProjects).toEqual([]);
    });

    it('parses WORKLOG_BLOCKED_PATHS as comma-separated list', async () => {
      setRequiredEnv();
      process.env.WORKLOG_BLOCKED_PATHS = '/home/user/work,/opt/internal';

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.sanitization.blockedPaths).toEqual(['/home/user/work', '/opt/internal']);
    });

    it('defaults blockedPaths to empty array', async () => {
      setRequiredEnv();
      delete process.env.WORKLOG_BLOCKED_PATHS;

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.sanitization.blockedPaths).toEqual([]);
    });

    it('parses WORKLOG_ALLOWED_PROJECTS as comma-separated list', async () => {
      setRequiredEnv();
      process.env.WORKLOG_ALLOWED_PROJECTS = 'portfolio,experiments,side-project';

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.sanitization.allowedProjects).toEqual(['portfolio', 'experiments', 'side-project']);
    });

    it('defaults allowedProjects to portfolio,experiments', async () => {
      setRequiredEnv();
      delete process.env.WORKLOG_ALLOWED_PROJECTS;

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.sanitization.allowedProjects).toEqual(['portfolio', 'experiments']);
    });

    it('parses WORKLOG_BLOCKED_DOMAINS as comma-separated list', async () => {
      setRequiredEnv();
      process.env.WORKLOG_BLOCKED_DOMAINS = 'jira.company.com,internal.corp.net';

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.sanitization.blockedDomains).toEqual(['jira.company.com', 'internal.corp.net']);
    });

    it('defaults blockedDomains to empty array', async () => {
      setRequiredEnv();
      delete process.env.WORKLOG_BLOCKED_DOMAINS;

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.sanitization.blockedDomains).toEqual([]);
    });

    it('filters empty strings from comma-separated lists', async () => {
      setRequiredEnv();
      process.env.WORKLOG_BLOCKED_PROJECTS = 'project-a,,project-b,';

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.sanitization.blockedProjects).toEqual(['project-a', 'project-b']);
    });
  });

  describe('enrichment config', () => {
    it('sets provider to ai-gateway', async () => {
      setRequiredEnv();

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.enrichment.provider).toBe('ai-gateway');
    });

    it('sets apiKey from AI_GATEWAY_API_KEY', async () => {
      setRequiredEnv();
      process.env.AI_GATEWAY_API_KEY = 'gw-my-key-123';

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.enrichment.apiKey).toBe('gw-my-key-123');
    });

    it('sets model from WORKLOG_ENRICHMENT_MODEL', async () => {
      setRequiredEnv();
      process.env.WORKLOG_ENRICHMENT_MODEL = 'anthropic/claude-3-5-sonnet-latest';

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.enrichment.model).toBe('anthropic/claude-3-5-sonnet-latest');
    });

    it('defaults model to anthropic/claude-3-5-haiku-latest', async () => {
      setRequiredEnv();
      delete process.env.WORKLOG_ENRICHMENT_MODEL;

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config.enrichment.model).toBe('anthropic/claude-3-5-haiku-latest');
    });
  });
});
