import { describe, it, expect } from 'vitest';
import { sanitizeRuleBased } from '../src/pipeline/sanitize.js';
import type { NormalizedSession, SanitizationConfig } from '../src/types.js';

const baseSession: NormalizedSession = {
  id: 'session-1',
  turns: [
    { role: 'user', content: 'Fix the auth bug', timestamp: '2025-01-22T10:00:00Z' },
    { role: 'assistant', content: 'I found the issue in middleware.', timestamp: '2025-01-22T10:01:00Z' },
  ],
  project: 'portfolio',
  startTime: '2025-01-22T10:00:00Z',
  endTime: '2025-01-22T11:00:00Z',
  summary: 'Fixed auth bug',
  gitBranch: 'fix-auth',
};

const baseConfig: SanitizationConfig = {
  blockedProjects: [],
  blockedPaths: [],
  allowedProjects: ['portfolio', 'experiments'],
  blockedDomains: [],
};

describe('sanitizeRuleBased', () => {
  describe('project allowlist', () => {
    it('returns session when project is in allowedProjects', () => {
      const result = sanitizeRuleBased(baseSession, baseConfig);
      expect(result).not.toBeNull();
      expect(result!.project).toBe('portfolio');
    });

    it('returns null when project is not in allowedProjects', () => {
      const session = { ...baseSession, project: 'work-client' };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result).toBeNull();
    });

    it('performs case-insensitive allowlist matching', () => {
      const session = { ...baseSession, project: 'Portfolio' };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result).not.toBeNull();
    });

    it('matches partial project names in allowlist', () => {
      const session = { ...baseSession, project: 'my-portfolio-v2' };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result).not.toBeNull();
    });

    it('returns null when allowedProjects is empty', () => {
      const config = { ...baseConfig, allowedProjects: [] };
      const result = sanitizeRuleBased(baseSession, config);
      expect(result).toBeNull();
    });
  });

  describe('secret redaction', () => {
    it('redacts API keys with colon separator', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Set api_key: sk_live_abc123def456ghi789', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED]');
      expect(result!.turns[0].content).not.toContain('sk_live_abc123');
    });

    it('redacts API keys with equals separator', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'token=abcdefghijklmnopqrstuv12345', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED]');
    });

    it('redacts Bearer tokens', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'assistant' as const, content: 'Use Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0 for auth', timestamp: '2025-01-22T10:01:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED]');
      expect(result!.turns[0].content).not.toContain('eyJhbGci');
    });

    it('redacts GitHub personal access tokens', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Token is ghp_1234567890abcdefghijklmnopqrstuvwxyz', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED]');
      expect(result!.turns[0].content).not.toContain('ghp_');
    });

    it('redacts JWT tokens', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'assistant' as const, content: 'JWT: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ', timestamp: '2025-01-22T10:01:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED]');
      expect(result!.turns[0].content).not.toContain('eyJhbGci');
    });

    it('redacts sk- prefixed keys', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'OPENAI: sk-proj-abcdefghijklmnopqrstuvwx', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED]');
      expect(result!.turns[0].content).not.toContain('sk-proj-');
    });

    it('redacts IPv4 addresses', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Connect to 192.168.1.100 on port 3000', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED_IP]');
      expect(result!.turns[0].content).not.toContain('192.168.1.100');
    });

    it('redacts internal/localhost URLs', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'assistant' as const, content: 'Server at http://localhost:3000/api/health', timestamp: '2025-01-22T10:01:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED_URL]');
      expect(result!.turns[0].content).not.toContain('localhost');
    });

    it('redacts 10.x.x.x IPs in URLs', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'API at http://10.0.1.50:8080/internal', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED_IP]');
      expect(result!.turns[0].content).not.toContain('10.0.1.50');
    });

    it('redacts 172.16-31.x.x IPs in URLs', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Check http://172.20.5.10/dashboard', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED_IP]');
      expect(result!.turns[0].content).not.toContain('172.20.5.10');
    });

    it('redacts 192.168.x.x IPs in URLs', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Visit http://192.168.0.1/admin', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED_IP]');
      expect(result!.turns[0].content).not.toContain('192.168.0.1');
    });

    it('redacts password fields', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'password: my_super_secret_password', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toContain('[REDACTED]');
      expect(result!.turns[0].content).not.toContain('my_super_secret');
    });

    it('handles multiple secrets in one message', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'api_key: abc123xyz token=def456uvw secret: ghi789rst', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      const content = result!.turns[0].content;
      expect(content).not.toContain('abc123');
      expect(content).not.toContain('def456');
      expect(content).not.toContain('ghi789');
    });

    it('preserves non-secret content unchanged', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Implement the user authentication flow', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toBe('Implement the user authentication flow');
    });

    it('does not redact public URLs', () => {
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Check https://github.com/user/repo', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, baseConfig);
      expect(result!.turns[0].content).toBe('Check https://github.com/user/repo');
    });
  });

  describe('blocked paths', () => {
    it('removes turns containing blocked paths', () => {
      const config = { ...baseConfig, blockedPaths: ['/home/user/work'] };
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Edit /home/user/work/secret.ts', timestamp: '2025-01-22T10:00:00Z' },
          { role: 'assistant' as const, content: 'Done editing', timestamp: '2025-01-22T10:01:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, config);
      expect(result!.turns).toHaveLength(1);
      expect(result!.turns[0].content).toBe('Done editing');
    });

    it('returns null when all turns are blocked', () => {
      const config = { ...baseConfig, blockedPaths: ['/home/user/work'] };
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Edit /home/user/work/file.ts', timestamp: '2025-01-22T10:00:00Z' },
          { role: 'assistant' as const, content: 'Found issue at /home/user/work/auth.ts', timestamp: '2025-01-22T10:01:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, config);
      expect(result).toBeNull();
    });

    it('checks multiple blocked paths', () => {
      const config = { ...baseConfig, blockedPaths: ['/opt/internal', '/home/user/work'] };
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Edit /opt/internal/config.yaml', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, config);
      expect(result).toBeNull();
    });
  });

  describe('blocked projects', () => {
    it('removes turns mentioning blocked projects', () => {
      const config = { ...baseConfig, blockedProjects: ['secret-client'] };
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Working on the secret-client dashboard', timestamp: '2025-01-22T10:00:00Z' },
          { role: 'assistant' as const, content: 'Here is the fix for portfolio', timestamp: '2025-01-22T10:01:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, config);
      expect(result!.turns).toHaveLength(1);
      expect(result!.turns[0].content).toContain('portfolio');
    });

    it('performs case-insensitive project blocking', () => {
      const config = { ...baseConfig, blockedProjects: ['Secret-Client'] };
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'The SECRET-CLIENT app needs fixing', timestamp: '2025-01-22T10:00:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, config);
      expect(result).toBeNull();
    });
  });

  describe('blocked domains', () => {
    it('removes turns mentioning blocked domains', () => {
      const config = { ...baseConfig, blockedDomains: ['internal.company.com'] };
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Check internal.company.com/dashboard', timestamp: '2025-01-22T10:00:00Z' },
          { role: 'assistant' as const, content: 'The public API looks good', timestamp: '2025-01-22T10:01:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, config);
      expect(result!.turns).toHaveLength(1);
      expect(result!.turns[0].content).toContain('public API');
    });

    it('blocks multiple domains', () => {
      const config = { ...baseConfig, blockedDomains: ['jira.company.com', 'confluence.company.com'] };
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'See jira.company.com/PROJ-123', timestamp: '2025-01-22T10:00:00Z' },
          { role: 'assistant' as const, content: 'Check confluence.company.com/wiki/page', timestamp: '2025-01-22T10:01:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, config);
      expect(result).toBeNull();
    });
  });

  describe('combined filters', () => {
    it('applies redaction and blocking together', () => {
      const config = {
        ...baseConfig,
        blockedPaths: ['/opt/work'],
        blockedDomains: ['internal.co'],
      };
      const session = {
        ...baseSession,
        turns: [
          { role: 'user' as const, content: 'Edit /opt/work/file.ts', timestamp: '2025-01-22T10:00:00Z' },
          { role: 'assistant' as const, content: 'Used api_key: sk_test_1234567890abcdef to auth', timestamp: '2025-01-22T10:01:00Z' },
          { role: 'user' as const, content: 'Check internal.co/page', timestamp: '2025-01-22T10:02:00Z' },
          { role: 'assistant' as const, content: 'The feature is ready', timestamp: '2025-01-22T10:03:00Z' },
        ],
      };
      const result = sanitizeRuleBased(session, config);
      // Turns 0 and 2 are blocked, turn 1 has redaction, turn 3 is clean
      expect(result!.turns).toHaveLength(2);
      expect(result!.turns[0].content).toContain('[REDACTED]');
      expect(result!.turns[1].content).toBe('The feature is ready');
    });

    it('preserves session metadata after sanitization', () => {
      const result = sanitizeRuleBased(baseSession, baseConfig);
      expect(result!.id).toBe('session-1');
      expect(result!.project).toBe('portfolio');
      expect(result!.startTime).toBe('2025-01-22T10:00:00Z');
      expect(result!.gitBranch).toBe('fix-auth');
      expect(result!.summary).toBe('Fixed auth bug');
    });
  });
});
