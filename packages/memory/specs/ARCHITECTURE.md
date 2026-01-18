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
         │ MCP Protocol    │ REST API        │ MCP/REST          │ HTTPS
         │                 │                 │                   │
         ▼                 ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EDGE LAYER (Cloudflare Workers / Vercel Edge)   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  MCP Server  │  │  REST API    │  │  Web UI      │                   │
│  │  (stdio)     │  │  (HTTP)      │  │  (Next.js)   │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                 │                           │
│         └─────────────────┼─────────────────┘                           │
│                           ▼                                             │
│                 ┌──────────────────┐                                    │
│                 │   Core Service   │                                    │
│                 │   (TypeScript)   │                                    │
│                 └────────┬─────────┘                                    │
│                          │                                              │
│         ┌────────────────┼────────────────┐                             │
│         ▼                ▼                ▼                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │   Search    │  │   Read      │  │   Write     │                      │
│  │   Handler   │  │   Handler   │  │   Handler   │                      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                      │
│         │                │                │                             │
│         └────────────────┼────────────────┘                             │
│                          ▼                                              │
│                ┌───────────────────┐                                    │
│                │  Turso Embedded   │  ◄── Sub-millisecond reads         │
│                │  Replica (local)  │                                    │
│                └─────────┬─────────┘                                    │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │ Sync
                           ▼
              ┌────────────────────────┐
              │   Turso Primary DB     │  ◄── Writes go here
              │   (Edge-distributed)   │
              └────────────────────────┘
```

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Runtime | Node.js / Bun | TypeScript support, fast startup |
| Framework | Hono | Lightweight, edge-compatible, fast |
| Database | Turso (libSQL) | Sub-ms reads via embedded replicas |
| ORM | Drizzle | Type-safe, lightweight, libSQL support |
| Full-text Search | SQLite FTS5 | Built into libSQL, fast for small scale |
| MCP Server | @modelcontextprotocol/sdk | Official MCP SDK |
| Web UI | Next.js 15 | App Router, React 19, matches monorepo |
| Styling | TailwindCSS + shadcn/ui | Consistent with other packages |
| Auth | Simple password (bcrypt) | Single user, minimal complexity |
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
  version INTEGER NOT NULL DEFAULT 1
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
}, (table) => ({
  pathIdx: index('idx_documents_path').on(table.path),
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
│   └── API.md
├── src/
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema
│   │   ├── client.ts           # Turso client setup
│   │   └── migrations/         # SQL migrations
│   ├── core/
│   │   ├── search.ts           # Search handler
│   │   ├── read.ts             # Read handler
│   │   ├── write.ts            # Write handler
│   │   ├── merge.ts            # AI-assisted merge logic
│   │   └── versioning.ts       # Version management
│   ├── mcp/
│   │   ├── server.ts           # MCP server setup
│   │   └── tools.ts            # Tool definitions
│   ├── api/
│   │   ├── routes.ts           # Hono routes
│   │   └── middleware.ts       # Auth, logging
│   └── index.ts                # Entry point
├── app/                        # Next.js web UI
│   ├── (auth)/
│   │   └── login/
│   ├── (visitor)/
│   │   └── demo/
│   ├── (dashboard)/
│   │   ├── documents/
│   │   └── settings/
│   ├── api/
│   │   └── [...route]/         # API routes via Hono
│   └── layout.tsx
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── CLAUDE.md
```

## Performance Strategy

### Sub-millisecond Reads

1. **Embedded Replica**: Turso syncs data to a local SQLite file within the edge function
2. **Local Queries**: All reads hit the local replica, no network round-trip
3. **Sync Strategy**: Replica syncs in background, reads never blocked

```typescript
import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:local.db',                    // Local embedded replica
  syncUrl: process.env.TURSO_DATABASE_URL, // Remote primary
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Sync on startup and periodically
await client.sync();
```

### Write Path

1. Write goes to Turso primary (remote)
2. Primary replicates to embedded replicas
3. Latency: 50-100ms acceptable for writes

### Search Optimization

1. FTS5 index maintained automatically via triggers
2. Prefix queries for folder filtering
3. Limit results to prevent large payloads

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
