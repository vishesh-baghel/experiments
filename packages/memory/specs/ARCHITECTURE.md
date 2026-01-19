# Memory - Architecture Specification

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
├─────────────────┬─────────────────┬─────────────────┬───────────────────┤
│   Claude Code   │    ChatGPT      │  Custom Agents  │     Web UI        │
│   (MCP Client)  │  (REST Client)  │  (MCP/REST)     │   (Browser)       │
└────────┬────────┴────────┬────────┴────────┬────────┴─────────┬─────────┘
         │                 │                 │                   │
         │ MCP (HTTP+SSE)  │ REST API        │ MCP/REST          │ HTTPS
         │                 │                 │                   │
         ▼                 ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EDGE LAYER (Cloudflare Workers / Vercel Edge)   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  MCP Server  │  │  REST API    │  │  Web UI      │                   │
│  │  (HTTP+SSE)  │  │  (HTTP)      │  │  (Next.js)   │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                 │                           │
│         └─────────────────┼─────────────────┘                           │
│                           ▼                                             │
│                 ┌──────────────────┐                                    │
│                 │   Core Service   │                                    │
│                 │   (TypeScript)   │                                    │
│                 └────────┬─────────┘                                    │
│                          │                                              │
│      ┌───────────────────┼───────────────────┐                          │
│      ▼                   ▼                   ▼                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                         │
│  │ Index  │  │ Search │  │  Read  │  │ Write  │                         │
│  │Handler │  │Handler │  │Handler │  │Handler │                         │
│  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘                         │
│       │           │           │           │                             │
│       └───────────┴───────────┴───────────┘                             │
│                          │                                              │
│                          ▼                                              │
│                ┌───────────────────┐                                    │
│                │   Turso Client    │  ◄── HTTP connection to Turso      │
│                │   (libSQL HTTP)   │      Target: <10ms reads           │
│                └─────────┬─────────┘                                    │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Turso Primary DB     │  ◄── All reads/writes
              │   (Edge-distributed)   │      Turso edge = low latency
              └────────────────────────┘
```

## MCP Server Architecture (Remote)

Memory exposes a **remote MCP server** using HTTP + Server-Sent Events (SSE) transport. This means:
- No local installation required for users
- Claude Code/Desktop connects directly to the hosted URL
- Single deployment serves all transports (MCP, REST, Web UI)

### MCP Transport: Streamable HTTP

```
Client (Claude Code)                    Server (Memory)
       │                                      │
       │──── POST /mcp (initialize) ────────►│
       │◄─── SSE stream opened ──────────────│
       │                                      │
       │──── POST /mcp (tools/list) ────────►│
       │◄─── SSE: tools response ────────────│
       │                                      │
       │──── POST /mcp (tools/call) ────────►│
       │◄─── SSE: tool result ───────────────│
       │                                      │
```

### MCP Configuration for Users

Users add this to their Claude Desktop/Code config:

```json
{
  "mcpServers": {
    "memory": {
      "url": "https://memory.yourdomain.com/mcp",
      "headers": {
        "Authorization": "Bearer mem_xxxxxxxxxxxx"
      }
    }
  }
}
```

No `command` or `args` needed - it's a remote server, not a local process.

### Mastra Tool Definitions

Tools are defined using Mastra's `createTool` helper:

```typescript
// src/mastra/tools/memory-read.ts
import { createTool } from '@mastra/core';
import { z } from 'zod';
import { readDocument } from '@/core/read';

export const memoryRead = createTool({
  id: 'memory_read',
  description: 'Read a markdown file by path from the knowledge base',
  inputSchema: z.object({
    path: z.string().describe('Document path, e.g., /work/projects/memory'),
    version: z.number().optional().describe('Specific version (default: latest)'),
  }),
  outputSchema: z.object({
    path: z.string(),
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()),
    version: z.number(),
    latencyMs: z.number(),
  }),
  execute: async ({ context }) => {
    const result = await readDocument(context.path, context.version);
    return result;
  },
});
```

### Mastra MCP Server Setup

```typescript
// src/mastra/index.ts
import { Mastra } from '@mastra/core';
import { memoryIndex, memorySearch, memoryRead, memoryWrite, memoryList, memoryDelete } from './tools';

export const mastra = new Mastra({
  tools: {
    memoryIndex,
    memorySearch,
    memoryRead,
    memoryWrite,
    memoryList,
    memoryDelete,
  },
});

// MCP server is exposed via Mastra's built-in server
// Route: /api/mcp -> mastra.server.handleMCP()
```

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Runtime | Node.js / Bun | TypeScript support, fast startup |
| Framework | Hono | Lightweight, edge-compatible, fast |
| AI Framework | Mastra | MCP server primitives, tool definitions, matches monorepo |
| Database | Turso (libSQL) | Edge-distributed, low latency HTTP API |
| ORM | Drizzle | Type-safe, lightweight, libSQL support |
| Full-text Search | SQLite FTS5 | Built into libSQL, fast for <1000 docs |
| Web UI | Next.js 15 | App Router, React 19, matches monorepo |
| Styling | TailwindCSS + shadcn/ui | Consistent with other packages |
| Auth | Simple password (bcrypt) | Single user v1, multi-user ready schema |
| Deployment | Cloudflare Workers or Vercel | Edge deployment, serverless |

## Database Schema

### Tables

```sql
-- Main documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,           -- e.g., "/work/projects/memory"
  title TEXT NOT NULL,
  content TEXT NOT NULL,               -- Full markdown content
  tags TEXT,                           -- JSON array: ["typescript", "ai"]
  metadata TEXT,                       -- JSON object for custom fields
  source TEXT,                         -- e.g., "claude-code", "manual"
  type TEXT,                           -- e.g., "note", "spec", "meeting"
  created_at INTEGER NOT NULL,         -- Unix timestamp
  updated_at INTEGER NOT NULL,         -- Unix timestamp
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at INTEGER DEFAULT NULL,     -- Soft delete timestamp (NULL = not deleted)
  last_write_source TEXT               -- Track which agent last wrote (for debugging)
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE documents_fts USING fts5(
  title,
  content,
  tags,
  content=documents,
  content_rowid=rowid
);

-- Triggers to keep FTS in sync
CREATE TRIGGER documents_ai AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, title, content, tags)
  VALUES (NEW.rowid, NEW.title, NEW.content, NEW.tags);
END;

CREATE TRIGGER documents_ad AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, content, tags)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.content, OLD.tags);
END;

CREATE TRIGGER documents_au AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, content, tags)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.content, OLD.tags);
  INSERT INTO documents_fts(rowid, title, content, tags)
  VALUES (NEW.rowid, NEW.title, NEW.content, NEW.tags);
END;

-- Version history table
CREATE TABLE document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Index for version lookups
CREATE INDEX idx_versions_document ON document_versions(document_id, version DESC);

-- Index for path lookups
CREATE INDEX idx_documents_path ON documents(path);

-- Index for folder queries (prefix search)
CREATE INDEX idx_documents_folder ON documents(path COLLATE NOCASE);
```

### Drizzle Schema

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  path: text('path').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags'),                    // JSON string
  metadata: text('metadata'),            // JSON string
  source: text('source'),
  type: text('type'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  version: integer('version').notNull().default(1),
  deletedAt: integer('deleted_at'),      // Soft delete (NULL = active)
  lastWriteSource: text('last_write_source'), // Agent tracking
}, (table) => ({
  pathIdx: index('idx_documents_path').on(table.path),
  deletedIdx: index('idx_documents_deleted').on(table.deletedAt),
}));

export const documentVersions = sqliteTable('document_versions', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: text('content').notNull(),
  metadata: text('metadata'),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  documentVersionIdx: index('idx_versions_document').on(table.documentId, table.version),
}));
```

## API Design

### MCP Tools

```typescript
// Tool: memory_search
{
  name: "memory_search",
  description: "Search across all stored markdown content",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      folder: { type: "string", description: "Limit to folder path" },
      tags: { type: "array", items: { type: "string" } },
      limit: { type: "number", default: 10 }
    },
    required: ["query"]
  }
}

// Tool: memory_read
{
  name: "memory_read",
  description: "Read a markdown file by path",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path, e.g., /work/projects/memory" }
    },
    required: ["path"]
  }
}

// Tool: memory_write
{
  name: "memory_write",
  description: "Create or update a markdown file",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string" },
      title: { type: "string" },
      content: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      metadata: { type: "object" }
    },
    required: ["path", "content"]
  }
}
```

### REST API

```
GET  /api/documents              - List all documents
GET  /api/documents/:path        - Read document by path
POST /api/documents              - Create document
PUT  /api/documents/:path        - Update document
DELETE /api/documents/:path      - Delete document

GET  /api/search?q=...           - Full-text search
GET  /api/folders                - List folder structure
GET  /api/tags                   - List all tags

GET  /api/health                 - Health check with latency metrics
```

## Directory Structure

```
packages/memory/
├── specs/
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── UI.md
│   └── DESIGN.md
├── src/
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema
│   │   ├── client.ts           # Turso client setup
│   │   ├── queries.ts          # Common query helpers
│   │   └── migrations/         # SQL migrations
│   ├── core/
│   │   ├── index.ts            # Index handler (lightweight listing)
│   │   ├── search.ts           # Search handler (FTS5)
│   │   ├── read.ts             # Read handler
│   │   ├── write.ts            # Write handler
│   │   ├── delete.ts           # Soft delete handler
│   │   ├── folders.ts          # Folder tree derivation logic
│   │   └── versioning.ts       # Version management
│   ├── mastra/
│   │   ├── index.ts            # Mastra instance configuration
│   │   ├── tools/
│   │   │   ├── index.ts        # Tool exports
│   │   │   ├── memory-index.ts # memory_index tool
│   │   │   ├── memory-search.ts# memory_search tool
│   │   │   ├── memory-read.ts  # memory_read tool
│   │   │   ├── memory-write.ts # memory_write tool
│   │   │   ├── memory-list.ts  # memory_list tool
│   │   │   └── memory-delete.ts# memory_delete tool
│   │   └── server.ts           # MCP server setup via Mastra
│   ├── api/
│   │   ├── routes.ts           # Hono REST routes
│   │   └── middleware.ts       # Auth, logging, CORS
│   ├── auth/
│   │   ├── api-key.ts          # API key validation
│   │   └── session.ts          # UI session management
│   └── index.ts                # Entry point
├── app/                        # Next.js web UI
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (visitor)/
│   │   └── demo/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx            # Document list
│   │   ├── documents/
│   │   │   └── [...path]/
│   │   │       └── page.tsx    # Document view/edit
│   │   ├── search/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── [...rest]/          # REST API via Hono
│   │   │   └── route.ts
│   │   └── mcp/                # MCP endpoint
│   │       └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/                 # Shared React components
│   ├── ui/                     # shadcn/ui components
│   ├── document-card.tsx
│   ├── folder-tree.tsx
│   ├── latency-badge.tsx
│   ├── markdown-renderer.tsx
│   └── search-bar.tsx
├── lib/
│   └── utils.ts                # Client-side utilities
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── tailwind.config.ts
└── CLAUDE.md
```

### Folder Derivation Logic

Folders are derived from document paths, not stored as separate entities:

```typescript
// src/core/folders.ts
export function deriveFolderTree(documents: { path: string }[]): FolderNode[] {
  const folders = new Set<string>();

  for (const doc of documents) {
    // Extract all parent paths: "/work/projects/memory" -> ["/work", "/work/projects"]
    const parts = doc.path.split('/').filter(Boolean);
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current += '/' + parts[i];
      folders.add(current);
    }
  }

  // Build tree structure from flat set
  return buildTree(Array.from(folders));
}
```

This approach:
- No folder table needed (less schema complexity)
- Folders auto-appear when documents created
- Folders auto-disappear when last document deleted
- Consistent with file system mental model

## Performance Strategy

### Target Latencies

| Operation | Target | Strategy |
|-----------|--------|----------|
| Read | <10ms | Turso edge regions + HTTP/2 |
| Search | <15ms | FTS5 + result limiting |
| Write | <100ms | Direct to Turso primary |
| Index | <20ms | Lightweight metadata only |

### Turso Edge Architecture

Turso databases are automatically distributed to edge regions. When deployed to Cloudflare/Vercel edge:

1. **Edge Location Matching**: Turso routes requests to nearest replica
2. **HTTP/2 Connection Reuse**: Persistent connections reduce latency
3. **No Local State**: Serverless-compatible, no file system dependencies

```typescript
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,    // Edge-distributed URL
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// All operations go through Turso's edge network
// No local replica needed - Turso handles distribution
```

### Future Optimization: Embedded Replicas

For self-hosted deployments with persistent storage (VPS, Docker), embedded replicas can achieve sub-millisecond reads:

```typescript
// Only for persistent-storage deployments
const client = createClient({
  url: 'file:local.db',
  syncUrl: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
await client.sync();
```

### Search Optimization

1. FTS5 index maintained automatically via triggers
2. Prefix queries for folder filtering (`path LIKE '/work/%'`)
3. Result limiting to prevent large payloads (max 50)
4. Separate index query for lightweight listings

### Conflict Handling (v1)

**Strategy: Last-Write-Wins**

For v1, concurrent writes to the same document use timestamp-based resolution:
- Latest `updated_at` wins
- `last_write_source` tracks which agent made the change
- Version number increments on every write
- Previous content preserved in `document_versions`

AI-assisted merge is planned for v2.

## Security

### Authentication

| Context | Method |
|---------|--------|
| MCP | API key in environment variable |
| REST API | Bearer token (API key) |
| Web UI | Password (bcrypt hashed) |
| Visitor Mode | No auth, read-only sample data |

### API Key Management

```typescript
// Environment variables
MEMORY_API_KEY=mem_xxxxxxxxxxxx     // For MCP/REST access
MEMORY_UI_PASSWORD_HASH=...         // bcrypt hash for UI login
```

## Deployment

### Option 1: Cloudflare Workers (Recommended)

- Edge deployment, global distribution
- Native libSQL support via Turso
- Free tier generous

### Option 2: Vercel Edge Functions

- Familiar if using Vercel for other packages
- Good Next.js integration
- Turso works via HTTP

### Environment Variables

```bash
# Turso
TURSO_DATABASE_URL=libsql://memory-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbG...

# Auth
MEMORY_API_KEY=mem_xxxxxxxxxxxxxxxx
MEMORY_UI_PASSWORD=your-secure-password

# Optional
MEMORY_MAX_VERSIONS=10
MEMORY_SYNC_INTERVAL=5000
```

## Monitoring

### Metrics to Track

1. **Read latency** (p50, p95, p99)
2. **Search latency** (p50, p95, p99)
3. **Write latency** (p50, p95, p99)
4. **Request count** by operation
5. **Error rate**

### Logging

- Structured JSON logs
- Request ID tracking
- Latency timing for each operation

## Future Considerations (Out of Scope for v1)

1. **Semantic search**: Add embedding-based search with vector store
2. **Multi-user**: Tenant isolation, per-user API keys
3. **Image support**: Store images in R2/S3, reference in markdown
4. **Real-time sync**: WebSocket/SSE for live updates
5. **Obsidian sync**: Two-way sync with local Obsidian vault
6. **Mobile app**: React Native companion app
