import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getProjectDir,
  readSessionsIndex,
  getLatestSession,
  getSessionById,
  readSessionEntries,
  listProjects,
} from '../src/adapters/claude-code.js';
import type { SessionsIndex, SessionIndexEntry } from '../src/types.js';

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    readdir: vi.fn(),
  },
}));

let mockReadFile: ReturnType<typeof vi.fn>;
let mockReaddir: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.clearAllMocks();
  const fs = (await import('fs/promises')).default;
  mockReadFile = fs.readFile as ReturnType<typeof vi.fn>;
  mockReaddir = fs.readdir as ReturnType<typeof vi.fn>;
});

describe('getProjectDir', () => {
  it('replaces slashes with dashes in project path', () => {
    const result = getProjectDir('/base', '/home/user/workspace/portfolio');
    expect(result).toBe('/base/-home-user-workspace-portfolio');
  });

  it('replaces dots with dashes in project path', () => {
    const result = getProjectDir('/base', '/home/vishesh.baghel/workspace');
    expect(result).toBe('/base/-home-vishesh-baghel-workspace');
  });

  it('handles both dots and slashes', () => {
    const result = getProjectDir('/base', '/home/vishesh.baghel/Documents/workspace/portfolio');
    expect(result).toBe('/base/-home-vishesh-baghel-Documents-workspace-portfolio');
  });

  it('joins base path with transformed project dir', () => {
    const result = getProjectDir('/home/user/.claude/projects', '/tmp/test');
    expect(result).toBe('/home/user/.claude/projects/-tmp-test');
  });
});

describe('readSessionsIndex', () => {
  it('reads and parses sessions-index.json', async () => {
    const mockIndex: SessionsIndex = {
      version: 1,
      entries: [],
      originalPath: '/home/user/portfolio',
    };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(mockIndex));

    const result = await readSessionsIndex('/base/project-dir');

    expect(mockReadFile).toHaveBeenCalledWith('/base/project-dir/sessions-index.json', 'utf-8');
    expect(result).toEqual(mockIndex);
  });

  it('returns null when file does not exist (ENOENT)', async () => {
    const err = new Error('ENOENT') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockReadFile.mockRejectedValueOnce(err);

    const result = await readSessionsIndex('/nonexistent');
    expect(result).toBeNull();
  });

  it('throws on non-ENOENT errors', async () => {
    const err = new Error('EACCES') as NodeJS.ErrnoException;
    err.code = 'EACCES';
    mockReadFile.mockRejectedValueOnce(err);

    await expect(readSessionsIndex('/base')).rejects.toThrow('EACCES');
  });

  it('throws on invalid JSON', async () => {
    mockReadFile.mockResolvedValueOnce('not json');

    await expect(readSessionsIndex('/base')).rejects.toThrow();
  });
});

describe('getLatestSession', () => {
  const makeEntry = (overrides: Partial<SessionIndexEntry> = {}): SessionIndexEntry => ({
    sessionId: 'sess-1',
    fullPath: '/tmp/session.jsonl',
    fileMtime: Date.now(),
    firstPrompt: 'Hello',
    summary: 'Test session',
    messageCount: 10,
    created: '2025-01-20T10:00:00Z',
    modified: '2025-01-20T11:00:00Z',
    gitBranch: 'main',
    projectPath: '/home/user/portfolio',
    isSidechain: false,
    ...overrides,
  });

  const setupIndex = (entries: SessionIndexEntry[]) => {
    const index: SessionsIndex = {
      version: 1,
      entries,
      originalPath: '/home/user/portfolio',
    };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(index));
  };

  it('returns the most recently modified session', async () => {
    setupIndex([
      makeEntry({ sessionId: 'old', modified: '2025-01-18T10:00:00Z' }),
      makeEntry({ sessionId: 'newest', modified: '2025-01-22T10:00:00Z' }),
      makeEntry({ sessionId: 'middle', modified: '2025-01-20T10:00:00Z' }),
    ]);

    const result = await getLatestSession('/base', '/home/user/portfolio');
    expect(result!.sessionId).toBe('newest');
  });

  it('filters out sidechain sessions', async () => {
    setupIndex([
      makeEntry({ sessionId: 'sidechain', isSidechain: true, modified: '2025-01-22T10:00:00Z' }),
      makeEntry({ sessionId: 'main', isSidechain: false, modified: '2025-01-20T10:00:00Z' }),
    ]);

    const result = await getLatestSession('/base', '/home/user/portfolio');
    expect(result!.sessionId).toBe('main');
  });

  it('filters out sessions with fewer than 5 messages', async () => {
    setupIndex([
      makeEntry({ sessionId: 'short', messageCount: 3, modified: '2025-01-22T10:00:00Z' }),
      makeEntry({ sessionId: 'long', messageCount: 15, modified: '2025-01-20T10:00:00Z' }),
    ]);

    const result = await getLatestSession('/base', '/home/user/portfolio');
    expect(result!.sessionId).toBe('long');
  });

  it('filters out agent sessions (sessionId starts with agent-)', async () => {
    setupIndex([
      makeEntry({ sessionId: 'agent-subagent-1', modified: '2025-01-22T10:00:00Z' }),
      makeEntry({ sessionId: 'regular-session', modified: '2025-01-20T10:00:00Z' }),
    ]);

    const result = await getLatestSession('/base', '/home/user/portfolio');
    expect(result!.sessionId).toBe('regular-session');
  });

  it('returns null when no eligible sessions exist', async () => {
    setupIndex([
      makeEntry({ sessionId: 'sidechain', isSidechain: true }),
      makeEntry({ sessionId: 'short', messageCount: 2 }),
      makeEntry({ sessionId: 'agent-sub-1' }),
    ]);

    const result = await getLatestSession('/base', '/home/user/portfolio');
    expect(result).toBeNull();
  });

  it('returns null for empty index', async () => {
    setupIndex([]);

    const result = await getLatestSession('/base', '/home/user/portfolio');
    expect(result).toBeNull();
  });

  it('accepts sessions with exactly 5 messages', async () => {
    setupIndex([
      makeEntry({ sessionId: 'exactly-five', messageCount: 5 }),
    ]);

    const result = await getLatestSession('/base', '/home/user/portfolio');
    expect(result!.sessionId).toBe('exactly-five');
  });

  it('returns null when project dir does not exist (ENOENT)', async () => {
    const err = new Error('ENOENT') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockReadFile.mockRejectedValueOnce(err);

    const result = await getLatestSession('/base', '/nonexistent/project');
    expect(result).toBeNull();
  });
});

describe('getSessionById', () => {
  it('finds session by exact sessionId', async () => {
    const index: SessionsIndex = {
      version: 1,
      entries: [
        {
          sessionId: 'target-id',
          fullPath: '/tmp/target.jsonl',
          fileMtime: Date.now(),
          firstPrompt: 'Hello',
          summary: 'Target session',
          messageCount: 10,
          created: '2025-01-22T10:00:00Z',
          modified: '2025-01-22T11:00:00Z',
          gitBranch: 'main',
          projectPath: '/home/user/portfolio',
          isSidechain: false,
        },
        {
          sessionId: 'other-id',
          fullPath: '/tmp/other.jsonl',
          fileMtime: Date.now(),
          firstPrompt: 'Hi',
          summary: 'Other session',
          messageCount: 5,
          created: '2025-01-21T10:00:00Z',
          modified: '2025-01-21T11:00:00Z',
          gitBranch: 'feature',
          projectPath: '/home/user/portfolio',
          isSidechain: false,
        },
      ],
      originalPath: '/home/user/portfolio',
    };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(index));

    const result = await getSessionById('/base', '/home/user/portfolio', 'target-id');
    expect(result!.sessionId).toBe('target-id');
    expect(result!.summary).toBe('Target session');
  });

  it('returns null when session not found', async () => {
    const index: SessionsIndex = {
      version: 1,
      entries: [],
      originalPath: '/home/user/portfolio',
    };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(index));

    const result = await getSessionById('/base', '/home/user/portfolio', 'nonexistent');
    expect(result).toBeNull();
  });

  it('matches session by prefix (partial ID)', async () => {
    const index: SessionsIndex = {
      version: 1,
      entries: [
        {
          sessionId: 'abcd1234-5678-9abc-def0-123456789abc',
          fullPath: '/tmp/target.jsonl',
          fileMtime: Date.now(),
          firstPrompt: 'Hello',
          summary: 'Target session',
          messageCount: 10,
          created: '2025-01-22T10:00:00Z',
          modified: '2025-01-22T11:00:00Z',
          gitBranch: 'main',
          projectPath: '/home/user/portfolio',
          isSidechain: false,
        },
        {
          sessionId: 'efgh5678-1234-5678-9abc-def012345678',
          fullPath: '/tmp/other.jsonl',
          fileMtime: Date.now(),
          firstPrompt: 'Hi',
          summary: 'Other session',
          messageCount: 5,
          created: '2025-01-21T10:00:00Z',
          modified: '2025-01-21T11:00:00Z',
          gitBranch: 'feature',
          projectPath: '/home/user/portfolio',
          isSidechain: false,
        },
      ],
      originalPath: '/home/user/portfolio',
    };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(index));

    const result = await getSessionById('/base', '/home/user/portfolio', 'abcd1234');
    expect(result!.sessionId).toBe('abcd1234-5678-9abc-def0-123456789abc');
  });

  it('returns null when prefix matches multiple sessions (ambiguous)', async () => {
    const index: SessionsIndex = {
      version: 1,
      entries: [
        {
          sessionId: 'abcd1234-aaaa-0000-0000-000000000001',
          fullPath: '/tmp/a.jsonl',
          fileMtime: Date.now(),
          firstPrompt: 'Hello',
          summary: 'Session A',
          messageCount: 10,
          created: '2025-01-22T10:00:00Z',
          modified: '2025-01-22T11:00:00Z',
          gitBranch: 'main',
          projectPath: '/home/user/portfolio',
          isSidechain: false,
        },
        {
          sessionId: 'abcd1234-bbbb-0000-0000-000000000002',
          fullPath: '/tmp/b.jsonl',
          fileMtime: Date.now(),
          firstPrompt: 'Hi',
          summary: 'Session B',
          messageCount: 5,
          created: '2025-01-21T10:00:00Z',
          modified: '2025-01-21T11:00:00Z',
          gitBranch: 'feature',
          projectPath: '/home/user/portfolio',
          isSidechain: false,
        },
      ],
      originalPath: '/home/user/portfolio',
    };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(index));

    const result = await getSessionById('/base', '/home/user/portfolio', 'abcd1234');
    expect(result).toBeNull();
  });

  it('returns null when project dir does not exist (ENOENT)', async () => {
    const err = new Error('ENOENT') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockReadFile.mockRejectedValueOnce(err);

    const result = await getSessionById('/base', '/nonexistent/project', 'any-id');
    expect(result).toBeNull();
  });
});

describe('readSessionEntries', () => {
  it('reads and parses JSONL file', async () => {
    const entries = [
      { type: 'user', uuid: '1', parentUuid: null, timestamp: '2025-01-22T10:00:00Z', sessionId: 'test', isSidechain: false, message: { role: 'user', content: 'Hello' } },
      { type: 'assistant', uuid: '2', parentUuid: '1', timestamp: '2025-01-22T10:01:00Z', sessionId: 'test', isSidechain: false, message: { role: 'assistant', content: [{ type: 'text', text: 'Hi' }] } },
    ];
    const jsonl = entries.map(e => JSON.stringify(e)).join('\n');
    mockReadFile.mockResolvedValueOnce(jsonl);

    const entry: SessionIndexEntry = {
      sessionId: 'test',
      fullPath: '/tmp/session.jsonl',
      fileMtime: Date.now(),
      firstPrompt: 'Hello',
      summary: 'Test',
      messageCount: 2,
      created: '2025-01-22T10:00:00Z',
      modified: '2025-01-22T10:01:00Z',
      gitBranch: 'main',
      projectPath: '/home/user/portfolio',
      isSidechain: false,
    };

    const result = await readSessionEntries(entry);

    expect(mockReadFile).toHaveBeenCalledWith('/tmp/session.jsonl', 'utf-8');
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('user');
    expect(result[1].type).toBe('assistant');
  });

  it('skips empty lines in JSONL', async () => {
    const jsonl = '{"type":"user","uuid":"1","parentUuid":null,"timestamp":"t","sessionId":"s","isSidechain":false}\n\n{"type":"assistant","uuid":"2","parentUuid":"1","timestamp":"t","sessionId":"s","isSidechain":false}\n';
    mockReadFile.mockResolvedValueOnce(jsonl);

    const entry: SessionIndexEntry = {
      sessionId: 'test',
      fullPath: '/tmp/session.jsonl',
      fileMtime: Date.now(),
      firstPrompt: 'Hi',
      summary: 'Test',
      messageCount: 2,
      created: '2025-01-22T10:00:00Z',
      modified: '2025-01-22T10:01:00Z',
      gitBranch: 'main',
      projectPath: '/path',
      isSidechain: false,
    };

    const result = await readSessionEntries(entry);
    expect(result).toHaveLength(2);
  });

  it('throws on file read error', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));

    const entry: SessionIndexEntry = {
      sessionId: 'test',
      fullPath: '/nonexistent.jsonl',
      fileMtime: Date.now(),
      firstPrompt: 'Hi',
      summary: 'Test',
      messageCount: 1,
      created: '2025-01-22T10:00:00Z',
      modified: '2025-01-22T10:00:00Z',
      gitBranch: 'main',
      projectPath: '/path',
      isSidechain: false,
    };

    await expect(readSessionEntries(entry)).rejects.toThrow('ENOENT');
  });
});

describe('listProjects', () => {
  it('returns originalPath from each valid sessions-index.json', async () => {
    mockReaddir.mockResolvedValueOnce([
      { name: 'project-a', isDirectory: () => true },
      { name: 'project-b', isDirectory: () => true },
    ]);
    // project-a index
    mockReadFile.mockResolvedValueOnce(JSON.stringify({
      version: 1,
      entries: [],
      originalPath: '/home/user/project-a',
    }));
    // project-b index
    mockReadFile.mockResolvedValueOnce(JSON.stringify({
      version: 1,
      entries: [],
      originalPath: '/home/user/project-b',
    }));

    const result = await listProjects('/base');
    expect(result).toEqual(['/home/user/project-a', '/home/user/project-b']);
  });

  it('skips non-directory entries', async () => {
    mockReaddir.mockResolvedValueOnce([
      { name: 'project-a', isDirectory: () => true },
      { name: 'some-file.txt', isDirectory: () => false },
    ]);
    mockReadFile.mockResolvedValueOnce(JSON.stringify({
      version: 1,
      entries: [],
      originalPath: '/home/user/project-a',
    }));

    const result = await listProjects('/base');
    expect(result).toEqual(['/home/user/project-a']);
  });

  it('skips directories without sessions-index.json', async () => {
    mockReaddir.mockResolvedValueOnce([
      { name: 'valid-project', isDirectory: () => true },
      { name: 'no-index', isDirectory: () => true },
    ]);
    mockReadFile.mockResolvedValueOnce(JSON.stringify({
      version: 1,
      entries: [],
      originalPath: '/home/user/valid-project',
    }));
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));

    const result = await listProjects('/base');
    expect(result).toEqual(['/home/user/valid-project']);
  });

  it('skips directories with invalid JSON index', async () => {
    mockReaddir.mockResolvedValueOnce([
      { name: 'valid', isDirectory: () => true },
      { name: 'corrupt', isDirectory: () => true },
    ]);
    mockReadFile.mockResolvedValueOnce(JSON.stringify({
      version: 1,
      entries: [],
      originalPath: '/home/user/valid',
    }));
    mockReadFile.mockResolvedValueOnce('not json');

    const result = await listProjects('/base');
    expect(result).toEqual(['/home/user/valid']);
  });

  it('skips directories where index lacks originalPath', async () => {
    mockReaddir.mockResolvedValueOnce([
      { name: 'no-path', isDirectory: () => true },
    ]);
    mockReadFile.mockResolvedValueOnce(JSON.stringify({
      version: 1,
      entries: [],
    }));

    const result = await listProjects('/base');
    expect(result).toEqual([]);
  });

  it('returns empty array when no directories exist', async () => {
    mockReaddir.mockResolvedValueOnce([]);

    const result = await listProjects('/base');
    expect(result).toEqual([]);
  });
});
