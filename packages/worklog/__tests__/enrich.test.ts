import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enrich } from '../src/pipeline/enrich.js';
import type { NormalizedSession } from '../src/types.js';

const mockCreate = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

const mockSession: NormalizedSession = {
  id: 'session-1',
  turns: [
    { role: 'user', content: 'Add caching to the worklog page', timestamp: '2025-01-22T10:00:00Z' },
    { role: 'assistant', content: 'I will implement ISR with time-based revalidation.', timestamp: '2025-01-22T10:01:00Z' },
    { role: 'user', content: 'Use shorter TTL for today', timestamp: '2025-01-22T10:05:00Z' },
    { role: 'assistant', content: 'Done. Today uses 5min TTL, past days use 1hr.', timestamp: '2025-01-22T10:06:00Z' },
  ],
  project: 'portfolio',
  startTime: '2025-01-22T10:00:00Z',
  endTime: '2025-01-22T11:00:00Z',
  summary: 'Added caching to worklog',
  gitBranch: 'worklog-caching',
};

const significantResponse = {
  isSignificant: true,
  entry: {
    summary: 'Implemented two-tier caching for worklog page',
    decision: 'Used ISR with 5min TTL for today and 1hr for past days.',
    problem: 'Worklog page was hitting Memory API on every request.',
    tags: ['performance', 'frontend'],
  },
  context: {
    title: 'Worklog Caching Implementation',
    promptsAndIntent: 'User wanted to reduce API calls to Memory.',
    keyDecisions: [
      { title: 'Time-based revalidation', reasoning: 'Simpler than on-demand, no webhook needed.' },
    ],
    problemsSolved: ['Origin hit reduction via ISR caching'],
    insights: ['Shorter TTL for today balances freshness vs load'],
  },
};

const insignificantResponse = {
  isSignificant: false,
  entry: null,
  context: {
    title: 'Minor fix session',
    promptsAndIntent: 'User fixed a typo.',
    keyDecisions: [],
    problemsSolved: ['Typo in README'],
    insights: [],
  },
};

const mockLLMResult = (content: string) => {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content } }],
  });
};

describe('enrich', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('significant sessions', () => {
    it('returns significant result with public entry', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');

      expect(result.isSignificant).toBe(true);
      expect(result.entry).not.toBeNull();
      expect(result.entry!.summary).toBe('Implemented two-tier caching for worklog page');
      expect(result.entry!.decision).toBe('Used ISR with 5min TTL for today and 1hr for past days.');
      expect(result.entry!.problem).toBe('Worklog page was hitting Memory API on every request.');
      expect(result.entry!.tags).toEqual(['performance', 'frontend']);
      expect(result.entry!.links).toBeNull();
    });

    it('sets context topics from entry tags', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');
      expect(result.context.topics).toEqual(['performance', 'frontend']);
    });
  });

  describe('insignificant sessions', () => {
    it('returns non-significant result with null entry', async () => {
      mockLLMResult(JSON.stringify(insignificantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');

      expect(result.isSignificant).toBe(false);
      expect(result.entry).toBeNull();
    });

    it('sets empty topics when entry is null', async () => {
      mockLLMResult(JSON.stringify(insignificantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');
      expect(result.context.topics).toEqual([]);
    });

    it('still provides context document', async () => {
      mockLLMResult(JSON.stringify(insignificantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');
      expect(result.context.title).toBe('Minor fix session');
      expect(result.context.content).toContain('# Session: Minor fix session');
    });
  });

  describe('context document formatting', () => {
    it('includes session header in markdown', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');

      expect(result.context.content).toContain('# Session: Worklog Caching Implementation');
      expect(result.context.content).toContain('**Source**: claude-code');
      expect(result.context.content).toContain('**Project**: portfolio');
      expect(result.context.content).toContain('**Branch**: worklog-caching');
      expect(result.context.content).toContain('**Date**: 2025-01-22');
    });

    it('includes prompts and intent section', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');
      expect(result.context.content).toContain('## Prompts & Intent');
      expect(result.context.content).toContain('User wanted to reduce API calls to Memory.');
    });

    it('includes key decisions section', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');
      expect(result.context.content).toContain('## Key Decisions');
      expect(result.context.content).toContain('### Time-based revalidation');
      expect(result.context.content).toContain('Simpler than on-demand');
    });

    it('includes problems solved section', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');
      expect(result.context.content).toContain('## Problems Solved');
      expect(result.context.content).toContain('- Origin hit reduction via ISR caching');
    });

    it('includes insights section', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');
      expect(result.context.content).toContain('## Insights');
      expect(result.context.content).toContain('- Shorter TTL for today balances freshness vs load');
    });

    it('omits empty sections', async () => {
      mockLLMResult(JSON.stringify(insignificantResponse));

      const result = await enrich(mockSession, 'test-key', 'gpt-4o-mini');
      expect(result.context.content).not.toContain('## Key Decisions');
      expect(result.context.content).not.toContain('## Insights');
    });
  });

  describe('OpenAI call parameters', () => {
    it('uses provided model', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      await enrich(mockSession, 'test-key', 'gpt-4o');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o' })
      );
    });

    it('sets temperature to 0.3', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      await enrich(mockSession, 'test-key', 'gpt-4o-mini');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 0.3 })
      );
    });

    it('requests JSON response format', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      await enrich(mockSession, 'test-key', 'gpt-4o-mini');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ response_format: { type: 'json_object' } })
      );
    });

    it('sends system and user messages', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      await enrich(mockSession, 'test-key', 'gpt-4o-mini');

      const call = mockCreate.mock.calls[0][0];
      expect(call.messages).toHaveLength(2);
      expect(call.messages[0].role).toBe('system');
      expect(call.messages[1].role).toBe('user');
    });

    it('includes session metadata in user prompt', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      await enrich(mockSession, 'test-key', 'gpt-4o-mini');

      const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain('PROJECT: portfolio');
      expect(userMessage).toContain('BRANCH: worklog-caching');
      expect(userMessage).toContain('SESSION SUMMARY: Added caching to worklog');
    });

    it('truncates turn content to 500 chars in prompt', async () => {
      const longSession = {
        ...mockSession,
        turns: [{ role: 'user' as const, content: 'a'.repeat(1000), timestamp: '2025-01-22T10:00:00Z' }],
      };
      mockLLMResult(JSON.stringify(significantResponse));

      await enrich(longSession, 'test-key', 'gpt-4o-mini');

      const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain('a'.repeat(500));
      expect(userMessage).not.toContain('a'.repeat(501));
    });

    it('includes conversation turns in prompt', async () => {
      mockLLMResult(JSON.stringify(significantResponse));

      await enrich(mockSession, 'test-key', 'gpt-4o-mini');

      const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain('[user]: Add caching to the worklog page');
      expect(userMessage).toContain('[assistant]: I will implement ISR');
    });

    it('initializes OpenAI with provided API key', async () => {
      mockLLMResult(JSON.stringify(significantResponse));
      const OpenAI = (await import('openai')).default;

      await enrich(mockSession, 'my-secret-key', 'gpt-4o-mini');

      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'my-secret-key' });
    });
  });

  describe('error handling', () => {
    it('throws on empty LLM response content', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      await expect(enrich(mockSession, 'key', 'model')).rejects.toThrow('Empty response from LLM');
    });

    it('throws on empty choices array', async () => {
      mockCreate.mockResolvedValueOnce({ choices: [] });

      await expect(enrich(mockSession, 'key', 'model')).rejects.toThrow();
    });

    it('throws on invalid JSON response', async () => {
      mockLLMResult('This is not JSON at all');

      await expect(enrich(mockSession, 'key', 'model')).rejects.toThrow();
    });

    it('propagates OpenAI API errors', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      await expect(enrich(mockSession, 'key', 'model')).rejects.toThrow('Rate limit exceeded');
    });

    it('propagates network errors', async () => {
      mockCreate.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(enrich(mockSession, 'key', 'model')).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('edge cases', () => {
    it('handles response with isSignificant true but null entry', async () => {
      const response = { ...significantResponse, isSignificant: true, entry: null };
      mockLLMResult(JSON.stringify(response));

      const result = await enrich(mockSession, 'key', 'model');
      // isSignificant but no entry means null public entry
      expect(result.isSignificant).toBe(true);
      expect(result.entry).toBeNull();
    });

    it('handles empty tags in entry', async () => {
      const response = {
        ...significantResponse,
        entry: { ...significantResponse.entry, tags: [] },
      };
      mockLLMResult(JSON.stringify(response));

      const result = await enrich(mockSession, 'key', 'model');
      expect(result.entry!.tags).toEqual([]);
    });

    it('handles null decision and problem', async () => {
      const response = {
        ...significantResponse,
        entry: { ...significantResponse.entry, decision: null, problem: null },
      };
      mockLLMResult(JSON.stringify(response));

      const result = await enrich(mockSession, 'key', 'model');
      expect(result.entry!.decision).toBeNull();
      expect(result.entry!.problem).toBeNull();
    });
  });
});
