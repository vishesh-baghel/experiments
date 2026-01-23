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
  it('extracts text from user and assistant messages', () => {
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
      {
        type: 'assistant',
        uuid: '2',
        parentUuid: '1',
        timestamp: '2025-01-22T10:01:00Z',
        sessionId: 'test',
        isSidechain: false,
        message: {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'Let me think about this...' },
            { type: 'text', text: 'I found the bug in the auth middleware.' },
            { type: 'tool_use', name: 'Edit', input: { file: 'auth.ts' } },
          ],
        },
      },
    ];

    const result = normalize(mockEntry, rawEntries);

    expect(result.id).toBe('test-session-123');
    expect(result.project).toBe('portfolio');
    expect(result.turns).toHaveLength(2);
    expect(result.turns[0].role).toBe('user');
    expect(result.turns[0].content).toBe('Fix the auth bug');
    expect(result.turns[1].role).toBe('assistant');
    expect(result.turns[1].content).toBe('I found the bug in the auth middleware.');
  });

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

  it('strips command tags from user messages', () => {
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
          content: '<command-message>copy-editing</command-message> <command-name>/copy-editing</command-name> <command-args>review my copy on the pitch page</command-args> please check for tone issues',
        },
      },
    ];

    const result = normalize(mockEntry, rawEntries);
    expect(result.turns).toHaveLength(1);
    expect(result.turns[0].content).not.toContain('<command-');
    expect(result.turns[0].content).toContain('please check for tone issues');
  });

  it('skips progress, summary, and system entries', () => {
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
        type: 'progress',
        uuid: '1',
        parentUuid: null,
        timestamp: '2025-01-22T10:00:00Z',
        sessionId: 'test',
        isSidechain: false,
        data: {},
        toolUseID: 'tool-1',
      },
      {
        type: 'user',
        uuid: '2',
        parentUuid: null,
        timestamp: '2025-01-22T10:00:00Z',
        sessionId: 'test',
        isSidechain: false,
        message: { role: 'user', content: 'Hello' },
      },
    ];

    const result = normalize(mockEntry, rawEntries);
    expect(result.turns).toHaveLength(1);
    expect(result.turns[0].content).toBe('Hello');
  });

  it('handles user messages with content blocks', () => {
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
});
