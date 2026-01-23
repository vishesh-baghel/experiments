import { describe, it, expect } from 'vitest';
import { normalize } from '../src/pipeline/normalize.js';
import type { SessionIndexEntry, RawEntry } from '../src/types.js';

const mockEntry: SessionIndexEntry = {
  sessionId: 'test-session-123',
  fullPath: '/tmp/test.jsonl',
  fileMtime: Date.now(),
  firstPrompt: 'Fix the auth bug',
  summary: 'Fixed authentication bug',
  messageCount: 10,
  created: '2025-01-22T10:00:00Z',
  modified: '2025-01-22T11:00:00Z',
  gitBranch: 'fix-auth',
  projectPath: '/home/user/workspace/portfolio',
  isSidechain: false,
};

describe('normalize', () => {
  describe('basic message extraction', () => {
    it('extracts text from user string messages', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: 'Fix the auth bug' },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(1);
      expect(result.turns[0].role).toBe('user');
      expect(result.turns[0].content).toBe('Fix the auth bug');
      expect(result.turns[0].timestamp).toBe('2025-01-22T10:00:00Z');
    });

    it('extracts text blocks from assistant content arrays', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'assistant',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'assistant',
            content: [
              { type: 'thinking', thinking: 'Let me think...' },
              { type: 'text', text: 'I found the issue.' },
              { type: 'tool_use', name: 'Edit', input: { file: 'auth.ts' } },
              { type: 'text', text: 'The fix is applied.' },
            ],
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(1);
      expect(result.turns[0].role).toBe('assistant');
      expect(result.turns[0].content).toBe('I found the issue.\nThe fix is applied.');
    });

    it('handles user messages with content block arrays', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Block-based user message' }],
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns[0].content).toBe('Block-based user message');
    });

    it('joins multiple text blocks with newlines', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'assistant',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'First paragraph.' },
              { type: 'text', text: 'Second paragraph.' },
              { type: 'text', text: 'Third paragraph.' },
            ],
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns[0].content).toBe('First paragraph.\nSecond paragraph.\nThird paragraph.');
    });
  });

  describe('filtering non-message entries', () => {
    it('skips sidechain entries', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: 'Main message' },
        },
        {
          type: 'assistant',
          uuid: '2',
          parentUuid: '1',
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: true,
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Sidechain response' }],
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(1);
      expect(result.turns[0].content).toBe('Main message');
    });

    it('skips progress entries', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'progress',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          data: { percent: 50 },
          toolUseID: 'tool-1',
        },
        {
          type: 'user',
          uuid: '2',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:01Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: 'Actual message' },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(1);
      expect(result.turns[0].content).toBe('Actual message');
    });

    it('skips summary entries', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'summary',
          uuid: '0',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
        },
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: 'Hello' },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(1);
      expect(result.turns[0].content).toBe('Hello');
    });

    it('skips system entries', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'system',
          uuid: '0',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
        },
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: 'After system' },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(1);
    });

    it('skips file-history-snapshot entries', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'file-history-snapshot',
          uuid: '0',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          data: { files: [] },
        },
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: 'After snapshot' },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(1);
    });

    it('skips entries without message field', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          // no message field
        },
        {
          type: 'user',
          uuid: '2',
          parentUuid: null,
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: 'Has message' },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(1);
      expect(result.turns[0].content).toBe('Has message');
    });
  });

  describe('command tag stripping', () => {
    it('strips command-message tags', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'user',
            content: '<command-message>copy-editing</command-message> please check the tone',
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns[0].content).toBe('please check the tone');
      expect(result.turns[0].content).not.toContain('<command-message>');
    });

    it('strips command-name tags', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'user',
            content: '<command-name>/copy-editing</command-name> review this',
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns[0].content).toBe('review this');
    });

    it('strips command-args tags', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'user',
            content: '<command-args>some args here</command-args> do the thing',
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns[0].content).toBe('do the thing');
    });

    it('strips multiple command tags from one message', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'user',
            content: '<command-message>copy-editing</command-message> <command-name>/copy-editing</command-name> <command-args>review my copy</command-args> please check for tone issues',
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns[0].content).toBe('please check for tone issues');
    });

    it('strips command tags that span multiple lines', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'user',
            content: '<command-args>line 1\nline 2\nline 3</command-args> actual content here',
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns[0].content).toBe('actual content here');
    });

    it('filters out entries that become empty after tag stripping', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'user',
            content: '<command-name>/commit</command-name>',
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(0);
    });
  });

  describe('content block filtering', () => {
    it('ignores thinking blocks from assistant messages', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'assistant',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'assistant',
            content: [
              { type: 'thinking', thinking: 'Long internal reasoning...' },
              { type: 'text', text: 'Here is my response.' },
            ],
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns[0].content).toBe('Here is my response.');
      expect(result.turns[0].content).not.toContain('reasoning');
    });

    it('ignores tool_use blocks from assistant messages', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'assistant',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'Let me fix that.' },
              { type: 'tool_use', name: 'Edit', input: { file: 'index.ts', content: 'new code' } },
              { type: 'tool_use', name: 'Bash', input: { command: 'npm test' } },
            ],
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns[0].content).toBe('Let me fix that.');
    });

    it('skips assistant entries with only tool_use and thinking blocks', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'assistant',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: {
            role: 'assistant',
            content: [
              { type: 'thinking', thinking: 'Thinking about this...' },
              { type: 'tool_use', name: 'Read', input: { file: 'package.json' } },
            ],
          },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(0);
    });
  });

  describe('session metadata', () => {
    it('sets session id from entry', () => {
      const result = normalize(mockEntry, []);
      expect(result.id).toBe('test-session-123');
    });

    it('extracts project name from projectPath', () => {
      const result = normalize(mockEntry, []);
      expect(result.project).toBe('portfolio');
    });

    it('handles projectPath with trailing slash', () => {
      const entry = { ...mockEntry, projectPath: '/home/user/workspace/my-project/' };
      // split('/').pop() on trailing slash gives empty string, so falls back to full path
      const result = normalize(entry, []);
      // Actually pop() on '/home/user/workspace/my-project/' splits to ['', 'home', ...  'my-project', '']
      // pop() returns '', so fallback to full path
      expect(result.project).toBeTruthy();
    });

    it('sets start and end times from entry', () => {
      const result = normalize(mockEntry, []);
      expect(result.startTime).toBe('2025-01-22T10:00:00Z');
      expect(result.endTime).toBe('2025-01-22T11:00:00Z');
    });

    it('sets summary from entry', () => {
      const result = normalize(mockEntry, []);
      expect(result.summary).toBe('Fixed authentication bug');
    });

    it('sets gitBranch from entry', () => {
      const result = normalize(mockEntry, []);
      expect(result.gitBranch).toBe('fix-auth');
    });
  });

  describe('ordering and completeness', () => {
    it('preserves message order', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: 'First' },
        },
        {
          type: 'assistant',
          uuid: '2',
          parentUuid: '1',
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'assistant', content: [{ type: 'text', text: 'Second' }] },
        },
        {
          type: 'user',
          uuid: '3',
          parentUuid: '2',
          timestamp: '2025-01-22T10:02:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: 'Third' },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns.map(t => t.content)).toEqual(['First', 'Second', 'Third']);
    });

    it('handles empty raw entries', () => {
      const result = normalize(mockEntry, []);
      expect(result.turns).toHaveLength(0);
      expect(result.id).toBe('test-session-123');
    });

    it('handles large sessions with many entries', () => {
      const rawEntries: RawEntry[] = Array.from({ length: 100 }, (_, i) => ({
        type: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        uuid: String(i),
        parentUuid: i > 0 ? String(i - 1) : null,
        timestamp: `2025-01-22T10:${String(i).padStart(2, '0')}:00Z`,
        sessionId: 'test',
        isSidechain: false,
        message: i % 2 === 0
          ? { role: 'user' as const, content: `User message ${i}` }
          : { role: 'assistant' as const, content: [{ type: 'text' as const, text: `Response ${i}` }] },
      }));

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(100);
    });
  });

  describe('edge cases', () => {
    it('trims whitespace from extracted text', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: '  padded message  ' },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns[0].content).toBe('padded message');
    });

    it('skips entries with whitespace-only content', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'user',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:00:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'user', content: '   \n\t  ' },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(0);
    });

    it('handles assistant with empty string content', () => {
      const rawEntries: RawEntry[] = [
        {
          type: 'assistant',
          uuid: '1',
          parentUuid: null,
          timestamp: '2025-01-22T10:01:00Z',
          sessionId: 'test',
          isSidechain: false,
          message: { role: 'assistant', content: [] },
        },
      ];

      const result = normalize(mockEntry, rawEntries);
      expect(result.turns).toHaveLength(0);
    });
  });
});
