# Worklog Module Architecture

## Purpose

The worklog module ingests coding agent sessions, sanitizes them, enriches them with engineering context, and writes structured documents to Memory. Each document contains both a public-facing entry (for the portfolio timeline) and rich context (for the content pipeline).

---

## Design Principles

- **Agent agnostic**: Generic adapter interface, but Claude Code adapter only for MVP
- **Privacy-first**: Two-pass sanitization before writing to Memory
- **Selective publishing**: LLM judges significance — trivial sessions get context stored but no public entry
- **Single storage**: Memory is the sole data store. Portfolio and jack agent both read from it.
- **Auto-publish**: No manual review step. Fix mistakes by editing in Memory afterward.

---

## System Architecture

```
┌─────────────────────────┐
│  Claude Code Session    │
│  (~/.claude/projects/)  │
└───────────┬─────────────┘
            │ SessionEnd hook
            ▼
┌──────────────────────────────────────┐
│  Worklog Module (CLI)                │
│                                      │
│  1. Read session from ~/.claude/     │
│  2. Normalize (strip tool calls)     │
│  3. Sanitize (rules + LLM)          │
│  4. Enrich (extract decisions,       │
│     judge significance)              │
│  5. Write to Memory                  │
└───────────┬──────────────────────────┘
            │ memory_write
            ▼
┌──────────────────────────────────────┐
│  Memory                              │
│                                      │
│  /worklog/{date}/{session-id}        │
│                                      │
│  metadata:                           │
│    public: true/false                │
│    summary, decision, tags, project  │
│                                      │
│  content:                            │
│    Full context (prompts, reasoning, │
│    plans, insights)                  │
└───────────┬──────────────┬───────────┘
            │              │
            ▼              ▼
┌────────────────┐  ┌──────────────────┐
│  Portfolio     │  │  Jack Agent      │
│  (REST API)    │  │  (MCP tools)     │
└────────────────┘  └──────────────────┘
```

---

## Invocation

### Primary: Claude Code SessionEnd Hook

Automatically triggers when a Claude Code session ends:

```json
{
  "hooks": {
    "SessionEnd": [{
      "command": "worklog ingest --source claude-code --project $PROJECT"
    }]
  }
}
```

The hook reads the most recent session from `~/.claude/projects/{project}/` automatically.

### Fallback: Manual CLI

For other agents or re-processing:

```bash
worklog ingest --source claude-code --session <path> --project portfolio
worklog ingest --source codex --session <path> --project experiments
```

---

## Session Source: Claude Code

Claude Code stores sessions at `~/.claude/projects/`. Each project gets a directory named by its path with slashes replaced by dashes.

### Directory Structure

```
~/.claude/projects/
  -home-vishesh-baghel-Documents-workspace-portfolio/
    sessions-index.json           # Index of all sessions
    8228cc1e-xxxx.jsonl          # Session transcript (JSONL)
    f339d24d-xxxx.jsonl          # Another session
    agent-a1ef208.jsonl          # Subagent session
    ...
  -home-vishesh-baghel-Documents-workspace-experiments/
    sessions-index.json
    ...
```

### sessions-index.json

Contains metadata for all sessions in a project. Use this to find the latest session:

```typescript
interface SessionsIndex {
  version: number;
  entries: SessionIndexEntry[];
  originalPath: string;           // e.g., "/home/user/workspace/portfolio"
}

interface SessionIndexEntry {
  sessionId: string;              // UUID
  fullPath: string;               // Absolute path to .jsonl file
  fileMtime: number;              // File modification timestamp (ms)
  firstPrompt: string;            // First user message (truncated)
  summary: string;                // Auto-generated session summary
  messageCount: number;           // Total messages in session
  created: string;                // ISO 8601
  modified: string;               // ISO 8601
  gitBranch: string;              // Git branch during session
  projectPath: string;            // Project root path
  isSidechain: boolean;           // Whether this is a sidechain session
}
```

### Session JSONL Format

Each line is a JSON object with a `type` field:

| Type | Description | Key Fields |
|------|-------------|------------|
| `summary` | Session summary | `summary` |
| `file-history-snapshot` | File state snapshot | `snapshot.trackedFileBackups` |
| `user` | User message | `message.role`, `message.content` |
| `assistant` | Assistant response | `message.content` (content blocks) |
| `progress` | Tool execution progress | `data`, `toolUseID` |
| `system` | System messages | `message.content` |

Each entry has: `uuid`, `parentUuid`, `timestamp`, `sessionId`, `type`, `isSidechain`

### Message Content Structure

**User messages**: `message.content` is a string or array of content blocks:
```typescript
// Simple text
{ "role": "user", "content": "fix the auth bug" }

// Content blocks
{ "role": "user", "content": [{ "type": "text", "text": "..." }] }
```

**Assistant messages**: `message.content` is an array of content blocks:
```typescript
{
  "role": "assistant",
  "content": [
    { "type": "thinking", "thinking": "..." },       // Internal reasoning
    { "type": "text", "text": "..." },               // Text response
    { "type": "tool_use", "name": "Edit", "input": {...} }  // Tool calls
  ]
}
```

### Reading a Session

```typescript
const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

function getProjectDir(projectPath: string): string {
  // /home/user/workspace/portfolio → -home-user-workspace-portfolio
  return projectPath.replace(/\//g, '-').replace(/^-/, '-');
}

async function getLatestSession(projectPath: string): Promise<SessionIndexEntry> {
  const dir = path.join(CLAUDE_PROJECTS_DIR, getProjectDir(projectPath));
  const index: SessionsIndex = JSON.parse(
    await fs.readFile(path.join(dir, 'sessions-index.json'), 'utf-8')
  );
  // Sort by modified date, skip trivial sessions
  return index.entries
    .filter(e => !e.isSidechain && e.messageCount > 4)
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())[0];
}

async function readSessionMessages(entry: SessionIndexEntry): Promise<RawMessage[]> {
  const content = await fs.readFile(entry.fullPath, 'utf-8');
  return content
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))
    .filter(obj => obj.type === 'user' || obj.type === 'assistant');
}
```

---

## Processing Pipeline

### 1. Read & Normalize

Read the session JSONL and extract text-only conversation:

**From the JSONL entries:**
- Keep entries with `type: "user"` and `type: "assistant"`
- Skip `type: "progress"`, `type: "system"`, `type: "summary"`, `type: "file-history-snapshot"`
- Skip entries with `isSidechain: true`

**From assistant content blocks:**
- Keep `type: "text"` blocks → these are the assistant's text responses
- Skip `type: "thinking"` blocks → internal reasoning (not shown to user)
- Skip `type: "tool_use"` blocks → tool calls (Read, Edit, Bash, etc.)

**From user content:**
- Extract text content (string or `type: "text"` blocks)
- Strip `<command-message>` and `<command-name>` wrapper tags (skill invocations)

```typescript
interface NormalizedSession {
  id: string;
  turns: ConversationTurn[];
  project: string;
  startTime: string;       // From sessions-index.json created field
  endTime: string;         // From sessions-index.json modified field
  summary: string;         // From sessions-index.json summary field
  gitBranch: string;       // From sessions-index.json
}

interface ConversationTurn {
  role: "user" | "assistant";
  content: string;           // Text only, tool calls stripped
  timestamp: string;         // From JSONL entry timestamp field
}

function normalizeSession(
  entry: SessionIndexEntry,
  messages: RawMessage[]
): NormalizedSession {
  const turns: ConversationTurn[] = [];

  for (const msg of messages) {
    if (msg.isSidechain) continue;

    if (msg.type === 'user') {
      const text = extractUserText(msg.message.content);
      if (text) turns.push({ role: 'user', content: text, timestamp: msg.timestamp });
    }

    if (msg.type === 'assistant') {
      const text = extractAssistantText(msg.message.content);
      if (text) turns.push({ role: 'assistant', content: text, timestamp: msg.timestamp });
    }
  }

  return {
    id: entry.sessionId,
    turns,
    project: path.basename(entry.projectPath),
    startTime: entry.created,
    endTime: entry.modified,
    summary: entry.summary,
    gitBranch: entry.gitBranch,
  };
}

function extractAssistantText(content: ContentBlock[]): string {
  // Only keep "text" type blocks, skip "thinking" and "tool_use"
  return content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');
}
```

### 2. Sanitize

Two-pass sanitization:

**Pass 1 — Rule-based (deterministic, fast):**
- Strip file paths matching blocked project directories
- Remove API keys, tokens, secrets (regex: `(?:key|token|secret|password)\s*[:=]\s*\S+`)
- Remove internal URLs and IP addresses
- Remove stack traces containing blocked paths
- Remove references to blocked project names

**Pass 2 — LLM-based (contextual):**
- Classify remaining turns as "personal project" or "work/sensitive"
- Remove turns classified as work-related
- Redact any remaining proprietary references
- Model: gpt-4o-mini (cost-efficient for classification)

### 3. Significance Check

Before enrichment, the LLM evaluates whether the session is worth a public entry:

**Skip criteria (no public entry, context still stored):**
- Session has fewer than 3 meaningful actions
- Only trivial work: typo fixes, formatting, single-line changes
- Abandoned or very short sessions
- Sessions that are purely exploratory with no concrete outcome

**Include criteria (gets a public entry):**
- Architectural decisions were made
- A non-trivial feature was implemented
- A meaningful bug was solved
- A design trade-off was evaluated
- Something novel was learned or applied

### 4. Enrich

For sessions that pass the significance check, the LLM extracts:

**Public entry fields:**
- `summary`: What was done (max 120 chars, 1 sentence)
- `decision`: Engineering reasoning and trade-offs (2-4 sentences)
- `problem`: What problem was being solved (1 sentence, optional)
- `tags`: Category + domains (e.g., `["architecture", "caching", "nextjs"]`)
- `links`: Any PR/commit references mentioned in the session

**Context document (always generated, regardless of significance):**
- Prompts & intent: what the user was trying to achieve
- Key decisions: why certain approaches were chosen
- Problems solved: obstacles and how they were overcome
- Insights: learnings, patterns discovered, things to remember

### 5. Write to Memory

Single document per session:

```typescript
await memoryWrite({
  path: `/worklog/${date}/${sessionId}`,
  title: summary || `Session: ${project} (${date})`,
  content: contextMarkdown,  // Full context document
  tags: ["worklog", project, ...topicTags],
  metadata: {
    source: "claude-code",
    sessionId,
    project,
    date,                    // YYYY-MM-DD
    public: isSignificant,   // Whether this has a public entry
    summary,                 // Public summary (null if not significant)
    decision,                // Public decision text (null if not significant)
    problem,                 // Public problem text (null if not significant)
    entryTags,               // Tags for the public entry
    links,                   // PR/commit references
  },
});
```

---

## Document Structure in Memory

### Path Convention

```
/worklog/{YYYY-MM-DD}/{session-id}
```

Example: `/worklog/2025-01-22/abc123`

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Agent identifier |
| `sessionId` | string | Unique session ID |
| `project` | string | Project name |
| `date` | string | YYYY-MM-DD |
| `public` | boolean | Has a public-facing entry |
| `summary` | string\|null | Public entry summary |
| `decision` | string\|null | Engineering reasoning |
| `problem` | string\|null | Problem being solved |
| `entryTags` | string[] | Entry category/domain tags |
| `links` | object\|null | PR/commit references |

### Content (Body)

The document body is the full context, structured as:

```markdown
# Session: {summary or project description}

**Source**: claude-code
**Project**: experiments
**Date**: 2025-01-22

## Prompts & Intent

What the user was trying to achieve in this session.

## Key Decisions

### Decision title
Why this approach was chosen. What alternatives were considered.
What trade-offs were accepted.

## Problems Solved

- Problem description → how it was resolved

## Insights

- Learnings, patterns, things to remember
```

---

## Daily Entry Cap

With 6+ sessions per day, the significance check naturally caps public entries at 3-5 per day because:
- Trivial sessions are skipped entirely
- Only sessions with real engineering decisions get public entries
- The LLM's significance threshold should be calibrated to produce ~3-5 entries on a busy day

If too many entries are produced, the portfolio can further limit at render time (show top 5, sorted by tag priority: architecture > performance > feature > fix).

---

## Configuration

```typescript
interface WorklogConfig {
  memory: {
    url: string;              // Memory REST API URL
    apiKey: string;           // Memory API key
  };
  sessionPaths: {
    claudeCode: string;       // Default: ~/.claude/projects/
  };
  sanitization: {
    blockedProjects: string[];
    blockedPaths: string[];
    allowedProjects: string[];
    blockedDomains: string[];
  };
  enrichment: {
    provider: "openai";
    model: string;            // gpt-4o-mini for sanitization, gpt-4o for enrichment
    apiKey: string;
  };
}
```

---

## Adapter Interface (Future)

For now, only Claude Code is supported. The adapter interface exists for future agents:

```typescript
interface SessionAdapter {
  name: string;
  canHandle(source: string): boolean;
  readSession(input: SessionInput): Promise<NormalizedSession>;
}

// MVP: only ClaudeCodeAdapter
class ClaudeCodeAdapter implements SessionAdapter {
  name = "claude-code";
  canHandle(source: string) { return source === "claude-code"; }
  async readSession(input: SessionInput): Promise<NormalizedSession> {
    // Read from ~/.claude/projects/{project}/
    // Parse Claude Code's session format
    // Strip tool calls, normalize turns
  }
}
```

---

## Open Questions

1. **Hook environment**: What environment variables does the SessionEnd hook receive? Need to verify if project path is available or if the hook needs to infer it from CWD.
2. **Memory availability**: If Memory is down when the hook fires, should the module retry, queue locally, or fail silently? Recommendation: write to a local `.pending/` queue and retry on next invocation.
3. **Cost per session**: With gpt-4o-mini for sanitization and gpt-4o for enrichment, estimate ~2-5K input tokens per session after normalization. Cost: ~$0.01-0.03 per session.
4. **Significance calibration**: May need a few weeks of data to tune. Start permissive (more public entries), tighten threshold once volume is established.
5. **Subagent sessions**: Claude Code creates `agent-*.jsonl` files for subagents (Task tool). Should these be included in the parent session or ignored?
