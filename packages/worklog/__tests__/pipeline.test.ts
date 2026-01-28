import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processSession } from '../src/pipeline/index.js';
import type { SessionIndexEntry, WorklogConfig, RawEntry } from '../src/types.js';

// Mock all pipeline dependencies
vi.mock('../src/adapters/claude-code.js', () => ({
  readSessionEntries: vi.fn(),
}));

vi.mock('../src/pipeline/enrich.js', () => ({
  enrich: vi.fn(),
}));

vi.mock('../src/pipeline/publish.js', () => ({
  buildMemoryPayload: vi.fn(),
  publishToMemory: vi.fn(),
}));

let mockReadSessionEntries: ReturnType<typeof vi.fn>;
let mockEnrich: ReturnType<typeof vi.fn>;
let mockBuildMemoryPayload: ReturnType<typeof vi.fn>;
let mockPublishToMemory: ReturnType<typeof vi.fn>;

const mockEntry: SessionIndexEntry = {
  sessionId: 'session-xyz',
  fullPath: '/tmp/session.jsonl',
  fileMtime: Date.now(),
  firstPrompt: 'Add caching',
  summary: 'Added caching to worklog',
  messageCount: 10,
  created: '2025-01-22T10:00:00Z',
  modified: '2025-01-22T11:00:00Z',
  gitBranch: 'feature-cache',
  projectPath: '/home/user/workspace/portfolio',
  isSidechain: false,
};

const mockConfig: WorklogConfig = {
  memory: { url: 'https://memory.test.com', apiKey: 'mem_key' },
  sessionPaths: { claudeCode: '/home/user/.claude/projects' },
  sanitization: {
    blockedProjects: [],
    blockedPaths: [],
    allowedProjects: ['portfolio', 'experiments'],
    blockedDomains: [],
  },
  enrichment: { provider: 'ai-gateway', model: 'anthropic/claude-3-5-haiku-latest', apiKey: 'gw-test' },
};

const makeRawEntries = (count: number): RawEntry[] =>
  Array.from({ length: count }, (_, i) => ({
    type: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    uuid: String(i),
    parentUuid: i > 0 ? String(i - 1) : null,
    timestamp: `2025-01-22T10:${String(i).padStart(2, '0')}:00Z`,
    sessionId: 'session-xyz',
    isSidechain: false,
    message: i % 2 === 0
      ? { role: 'user' as const, content: `User message ${i}` }
      : { role: 'assistant' as const, content: [{ type: 'text' as const, text: `Response ${i}` }] },
  }));

const mockSignificantEnrichment = {
  isSignificant: true,
  entry: {
    summary: 'Added caching',
    decision: 'Used ISR',
    problem: 'Too many API calls',
    tags: ['performance'],
    links: null,
  },
  context: {
    title: 'Caching Session',
    content: '# Session\n\nContent...',
    topics: ['performance'],
  },
};

const mockPayload = {
  path: '/worklog/2025-01-22/session-xyz',
  title: 'Caching Session',
  content: '# Session\n\nContent...',
  tags: ['worklog', 'portfolio', 'performance'],
  metadata: {
    source: 'claude-code',
    sessionId: 'session-xyz',
    project: 'portfolio',
    date: '2025-01-22',
    public: true,
    summary: 'Added caching',
    decision: 'Used ISR',
    problem: 'Too many API calls',
    entryTags: ['performance'],
    links: null,
  },
};

beforeEach(async () => {
  vi.clearAllMocks();
  const adapter = await import('../src/adapters/claude-code.js');
  const enrichMod = await import('../src/pipeline/enrich.js');
  const publishMod = await import('../src/pipeline/publish.js');

  mockReadSessionEntries = adapter.readSessionEntries as ReturnType<typeof vi.fn>;
  mockEnrich = enrichMod.enrich as ReturnType<typeof vi.fn>;
  mockBuildMemoryPayload = publishMod.buildMemoryPayload as ReturnType<typeof vi.fn>;
  mockPublishToMemory = publishMod.publishToMemory as ReturnType<typeof vi.fn>;
});

describe('processSession', () => {
  describe('successful flow', () => {
    it('returns published result for significant session', async () => {
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));
      mockEnrich.mockResolvedValueOnce(mockSignificantEnrichment);
      mockBuildMemoryPayload.mockReturnValueOnce(mockPayload);
      mockPublishToMemory.mockResolvedValueOnce(undefined);

      const result = await processSession(mockEntry, mockConfig);

      expect(result.published).toBe(true);
      expect(result.isSignificant).toBe(true);
      expect(result.summary).toBe('Added caching');
      expect(result.sessionId).toBe('session-xyz');
      expect(result.project).toBe('portfolio');
      expect(result.date).toBe('2025-01-22');
    });

    it('calls pipeline steps in order', async () => {
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));
      mockEnrich.mockResolvedValueOnce(mockSignificantEnrichment);
      mockBuildMemoryPayload.mockReturnValueOnce(mockPayload);
      mockPublishToMemory.mockResolvedValueOnce(undefined);

      await processSession(mockEntry, mockConfig);

      expect(mockReadSessionEntries).toHaveBeenCalledWith(mockEntry);
      expect(mockEnrich).toHaveBeenCalled();
      expect(mockBuildMemoryPayload).toHaveBeenCalled();
      expect(mockPublishToMemory).toHaveBeenCalledWith(mockPayload, 'https://memory.test.com', 'mem_key');
    });

    it('passes sanitization config to sanitizer', async () => {
      const config = {
        ...mockConfig,
        sanitization: {
          ...mockConfig.sanitization,
          allowedProjects: ['nonexistent'], // will block the session
        },
      };
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));

      const result = await processSession(mockEntry, config);
      expect(result.published).toBe(false);
      expect(result.skippedReason).toContain('sanitization');
    });

    it('passes enrichment config to enrich', async () => {
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));
      mockEnrich.mockResolvedValueOnce(mockSignificantEnrichment);
      mockBuildMemoryPayload.mockReturnValueOnce(mockPayload);
      mockPublishToMemory.mockResolvedValueOnce(undefined);

      await processSession(mockEntry, mockConfig);

      expect(mockEnrich).toHaveBeenCalledWith(
        expect.anything(),
        'gw-test',
        'anthropic/claude-3-5-haiku-latest'
      );
    });
  });

  describe('skipping conditions', () => {
    it('skips when normalized session has fewer than 3 turns', async () => {
      // 2 raw entries = 2 turns after normalization
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(2));

      const result = await processSession(mockEntry, mockConfig);

      expect(result.published).toBe(false);
      expect(result.skippedReason).toContain('Too few turns after normalization');
      expect(mockEnrich).not.toHaveBeenCalled();
    });

    it('skips when project not in allowlist', async () => {
      const config = {
        ...mockConfig,
        sanitization: { ...mockConfig.sanitization, allowedProjects: ['other-project'] },
      };
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));

      const result = await processSession(mockEntry, config);

      expect(result.published).toBe(false);
      expect(result.skippedReason).toContain('sanitization');
      expect(mockEnrich).not.toHaveBeenCalled();
    });

    it('skips when too few turns remain after sanitization', async () => {
      // Create entries where most will be blocked by path
      const entries: RawEntry[] = [
        {
          type: 'user', uuid: '1', parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z', sessionId: 'test', isSidechain: false,
          message: { role: 'user', content: 'Edit /blocked/path/file.ts' },
        },
        {
          type: 'assistant', uuid: '2', parentUuid: '1',
          timestamp: '2025-01-22T10:01:00Z', sessionId: 'test', isSidechain: false,
          message: { role: 'assistant', content: [{ type: 'text', text: 'Editing /blocked/path/file.ts' }] },
        },
        {
          type: 'user', uuid: '3', parentUuid: '2',
          timestamp: '2025-01-22T10:02:00Z', sessionId: 'test', isSidechain: false,
          message: { role: 'user', content: 'Thanks' },
        },
        {
          type: 'user', uuid: '4', parentUuid: '3',
          timestamp: '2025-01-22T10:03:00Z', sessionId: 'test', isSidechain: false,
          message: { role: 'user', content: 'Edit /blocked/path/other.ts' },
        },
      ];
      const config = {
        ...mockConfig,
        sanitization: { ...mockConfig.sanitization, blockedPaths: ['/blocked/path'] },
      };
      mockReadSessionEntries.mockResolvedValueOnce(entries);

      const result = await processSession(mockEntry, config);

      expect(result.published).toBe(false);
      expect(result.skippedReason).toContain('Too few turns after sanitization');
    });
  });

  describe('enrichment failure', () => {
    it('returns skipped result when enrichment throws', async () => {
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));
      mockEnrich.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const result = await processSession(mockEntry, mockConfig);

      expect(result.published).toBe(false);
      expect(result.skippedReason).toContain('Enrichment failed');
      expect(result.skippedReason).toContain('Rate limit exceeded');
    });

    it('does not call publish when enrichment fails', async () => {
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));
      mockEnrich.mockRejectedValueOnce(new Error('API error'));

      await processSession(mockEntry, mockConfig);

      expect(mockPublishToMemory).not.toHaveBeenCalled();
    });
  });

  describe('publish failure', () => {
    it('returns result with significance info when publish fails', async () => {
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));
      mockEnrich.mockResolvedValueOnce(mockSignificantEnrichment);
      mockBuildMemoryPayload.mockReturnValueOnce(mockPayload);
      mockPublishToMemory.mockRejectedValueOnce(new Error('Memory write failed (500)'));

      const result = await processSession(mockEntry, mockConfig);

      expect(result.published).toBe(false);
      expect(result.isSignificant).toBe(true);
      expect(result.summary).toBe('Added caching');
      expect(result.skippedReason).toContain('Publish failed');
      expect(result.skippedReason).toContain('500');
    });
  });

  describe('non-significant sessions', () => {
    it('still publishes non-significant sessions (for context)', async () => {
      const insignificantResult = {
        isSignificant: false,
        entry: null,
        context: { title: 'Minor fix', content: 'Content', topics: [] },
      };
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));
      mockEnrich.mockResolvedValueOnce(insignificantResult);
      mockBuildMemoryPayload.mockReturnValueOnce(mockPayload);
      mockPublishToMemory.mockResolvedValueOnce(undefined);

      const result = await processSession(mockEntry, mockConfig);

      expect(result.published).toBe(true);
      expect(result.isSignificant).toBe(false);
      expect(mockPublishToMemory).toHaveBeenCalled();
    });

    it('uses entry summary as fallback when enrichment has no summary', async () => {
      const result = {
        isSignificant: false,
        entry: null,
        context: { title: 'Session', content: 'Content', topics: [] },
      };
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));
      mockEnrich.mockResolvedValueOnce(result);
      mockBuildMemoryPayload.mockReturnValueOnce(mockPayload);
      mockPublishToMemory.mockResolvedValueOnce(undefined);

      const pipelineResult = await processSession(mockEntry, mockConfig);

      // Falls back to entry.summary when enrichment entry is null
      expect(pipelineResult.summary).toBe('Added caching to worklog');
    });
  });

  describe('metadata extraction', () => {
    it('extracts project name from projectPath', async () => {
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));
      mockEnrich.mockResolvedValueOnce(mockSignificantEnrichment);
      mockBuildMemoryPayload.mockReturnValueOnce(mockPayload);
      mockPublishToMemory.mockResolvedValueOnce(undefined);

      const result = await processSession(mockEntry, mockConfig);
      expect(result.project).toBe('portfolio');
    });

    it('extracts date from created field', async () => {
      mockReadSessionEntries.mockResolvedValueOnce(makeRawEntries(8));
      mockEnrich.mockResolvedValueOnce(mockSignificantEnrichment);
      mockBuildMemoryPayload.mockReturnValueOnce(mockPayload);
      mockPublishToMemory.mockResolvedValueOnce(undefined);

      const result = await processSession(mockEntry, mockConfig);
      expect(result.date).toBe('2025-01-22');
    });
  });
});
