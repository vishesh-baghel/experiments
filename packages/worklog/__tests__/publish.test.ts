import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildMemoryPayload, publishToMemory } from '../src/pipeline/publish.js';
import type { NormalizedSession, EnrichmentResult } from '../src/types.js';

const mockSession: NormalizedSession = {
  id: 'session-abc',
  turns: [],
  project: 'portfolio',
  startTime: '2025-01-22T10:00:00Z',
  endTime: '2025-01-22T11:00:00Z',
  summary: 'Added worklog feature',
  gitBranch: 'worklog-page',
};

const significantResult: EnrichmentResult = {
  isSignificant: true,
  entry: {
    summary: 'Implemented worklog timeline',
    decision: 'Used ISR for caching',
    problem: 'Needed efficient page updates',
    tags: ['feature', 'frontend'],
    links: null,
  },
  context: {
    title: 'Worklog Timeline',
    content: '# Session: Worklog Timeline\n\nContent here...',
    topics: ['feature', 'frontend'],
  },
};

const insignificantResult: EnrichmentResult = {
  isSignificant: false,
  entry: null,
  context: {
    title: 'Minor fix',
    content: '# Session: Minor fix\n\nFixed typo.',
    topics: [],
  },
};

describe('buildMemoryPayload', () => {
  describe('path construction', () => {
    it('constructs path from date and session id', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.path).toBe('/worklog/2025-01-22/session-abc');
    });

    it('extracts date from startTime ISO string', () => {
      const session = { ...mockSession, startTime: '2025-06-15T14:30:00Z' };
      const payload = buildMemoryPayload(session, significantResult);
      expect(payload.path).toBe('/worklog/2025-06-15/session-abc');
    });
  });

  describe('title and content', () => {
    it('sets title from context document', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.title).toBe('Worklog Timeline');
    });

    it('sets content from context document', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.content).toBe('# Session: Worklog Timeline\n\nContent here...');
    });
  });

  describe('tags', () => {
    it('includes worklog tag', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.tags).toContain('worklog');
    });

    it('includes project name as tag', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.tags).toContain('portfolio');
    });

    it('includes context topics as tags', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.tags).toContain('feature');
      expect(payload.tags).toContain('frontend');
    });

    it('handles empty topics', () => {
      const payload = buildMemoryPayload(mockSession, insignificantResult);
      expect(payload.tags).toEqual(['worklog', 'portfolio']);
    });
  });

  describe('metadata for significant sessions', () => {
    it('sets source to claude-code', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.metadata.source).toBe('claude-code');
    });

    it('sets sessionId', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.metadata.sessionId).toBe('session-abc');
    });

    it('sets project', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.metadata.project).toBe('portfolio');
    });

    it('sets date from startTime', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.metadata.date).toBe('2025-01-22');
    });

    it('sets public to true for significant sessions', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.metadata.public).toBe(true);
    });

    it('sets summary from entry', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.metadata.summary).toBe('Implemented worklog timeline');
    });

    it('sets decision from entry', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.metadata.decision).toBe('Used ISR for caching');
    });

    it('sets problem from entry', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.metadata.problem).toBe('Needed efficient page updates');
    });

    it('sets entryTags as comma-separated string', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.metadata.entryTags).toBe('feature,frontend');
    });

    it('sets links to empty string when entry has no links', () => {
      const payload = buildMemoryPayload(mockSession, significantResult);
      expect(payload.metadata.links).toBe('');
    });
  });

  describe('metadata for insignificant sessions', () => {
    it('sets public to false', () => {
      const payload = buildMemoryPayload(mockSession, insignificantResult);
      expect(payload.metadata.public).toBe(false);
    });

    it('sets summary to empty string', () => {
      const payload = buildMemoryPayload(mockSession, insignificantResult);
      expect(payload.metadata.summary).toBe('');
    });

    it('sets decision to empty string', () => {
      const payload = buildMemoryPayload(mockSession, insignificantResult);
      expect(payload.metadata.decision).toBe('');
    });

    it('sets problem to empty string', () => {
      const payload = buildMemoryPayload(mockSession, insignificantResult);
      expect(payload.metadata.problem).toBe('');
    });

    it('sets entryTags to empty string', () => {
      const payload = buildMemoryPayload(mockSession, insignificantResult);
      expect(payload.metadata.entryTags).toBe('');
    });

    it('sets links to empty string', () => {
      const payload = buildMemoryPayload(mockSession, insignificantResult);
      expect(payload.metadata.links).toBe('');
    });
  });

  describe('metadata with links', () => {
    it('includes links as JSON string when entry has them', () => {
      const result: EnrichmentResult = {
        ...significantResult,
        entry: {
          ...significantResult.entry!,
          links: { pr: 'https://github.com/user/repo/pull/42', commit: 'abc123' },
        },
      };
      const payload = buildMemoryPayload(mockSession, result);
      expect(JSON.parse(payload.metadata.links as string)).toEqual({ pr: 'https://github.com/user/repo/pull/42', commit: 'abc123' });
    });
  });
});

describe('publishToMemory', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const samplePayload = buildMemoryPayload(mockSession, significantResult);

  it('sends POST request to Memory API', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await publishToMemory(samplePayload, 'https://memory.example.com', 'mem_key');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://memory.example.com/api/documents',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('includes Authorization header', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await publishToMemory(samplePayload, 'https://memory.example.com', 'mem_secret_key');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer mem_secret_key');
  });

  it('includes Content-Type header', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await publishToMemory(samplePayload, 'https://memory.example.com', 'key');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('sends payload fields in body', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await publishToMemory(samplePayload, 'https://memory.example.com', 'key');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.path).toBe(samplePayload.path);
    expect(body.title).toBe(samplePayload.title);
    expect(body.content).toBe(samplePayload.content);
    expect(body.tags).toEqual(samplePayload.tags);
    expect(body.metadata).toEqual(samplePayload.metadata);
  });

  it('includes source field in body', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await publishToMemory(samplePayload, 'https://memory.example.com', 'key');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.source).toBe('worklog-cli');
  });

  it('succeeds silently on 2xx response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await expect(
      publishToMemory(samplePayload, 'https://memory.example.com', 'key')
    ).resolves.toBeUndefined();
  });

  it('throws on 4xx response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad request: missing path'),
    });

    await expect(
      publishToMemory(samplePayload, 'https://memory.example.com', 'key')
    ).rejects.toThrow('Memory write failed (400): Bad request: missing path');
  });

  it('throws on 401 unauthorized', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    await expect(
      publishToMemory(samplePayload, 'https://memory.example.com', 'bad-key')
    ).rejects.toThrow('Memory write failed (401): Unauthorized');
  });

  it('throws on 500 server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal server error'),
    });

    await expect(
      publishToMemory(samplePayload, 'https://memory.example.com', 'key')
    ).rejects.toThrow('Memory write failed (500)');
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(
      publishToMemory(samplePayload, 'https://memory.example.com', 'key')
    ).rejects.toThrow('ECONNREFUSED');
  });
});
