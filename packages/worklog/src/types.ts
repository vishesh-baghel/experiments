// --- Session Index Types (from ~/.claude/projects/) ---

export interface SessionsIndex {
  version: number;
  entries: SessionIndexEntry[];
  originalPath: string;
}

export interface SessionIndexEntry {
  sessionId: string;
  fullPath: string;
  fileMtime: number;
  firstPrompt: string;
  summary: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch: string;
  projectPath: string;
  isSidechain: boolean;
}

// --- Raw JSONL Entry Types ---

export interface RawEntry {
  type: 'user' | 'assistant' | 'progress' | 'summary' | 'system' | 'file-history-snapshot';
  uuid: string;
  parentUuid: string | null;
  timestamp: string;
  sessionId: string;
  isSidechain: boolean;
  message?: RawMessage;
  data?: unknown;
  toolUseID?: string;
}

export interface RawMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock;

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  name: string;
  input: Record<string, unknown>;
}

// --- Normalized Session ---

export interface NormalizedSession {
  id: string;
  turns: ConversationTurn[];
  project: string;
  startTime: string;
  endTime: string;
  summary: string;
  gitBranch: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// --- Sanitization ---

export interface SanitizationConfig {
  blockedProjects: string[];
  blockedPaths: string[];
  allowedProjects: string[];
  blockedDomains: string[];
}

// --- Enrichment Output ---

export interface EnrichmentResult {
  isSignificant: boolean;
  entry: PublicEntry | null;
  context: ContextDocument;
}

export interface PublicEntry {
  summary: string;
  decision: string | null;
  problem: string | null;
  tags: string[];
  links: EntryLinks | null;
}

export interface EntryLinks {
  commit?: string;
  pr?: string;
  related?: string[];
}

export interface ContextDocument {
  title: string;
  content: string;
  topics: string[];
}

// --- Memory Document ---

export interface MemoryWritePayload {
  path: string;
  title: string;
  content: string;
  tags: string[];
  metadata: MemoryMetadata;
}

export interface MemoryMetadata {
  source: string;
  sessionId: string;
  project: string;
  date: string;
  public: boolean;
  summary: string | null;
  decision: string | null;
  problem: string | null;
  entryTags: string[];
  links: EntryLinks | null;
}

// --- Config ---

export interface WorklogConfig {
  memory: {
    url: string;
    apiKey: string;
  };
  sessionPaths: {
    claudeCode: string;
  };
  sanitization: SanitizationConfig;
  enrichment: {
    provider: 'openai';
    model: string;
    apiKey: string;
  };
}
