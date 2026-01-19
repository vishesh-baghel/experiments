# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Overview

Memory is a central knowledge base for storing personal and professional context as markdown files. It exposes a remote MCP server (HTTP+SSE) for AI agents (Claude Code, Claude Desktop, ChatGPT) to search, read, and write content with low-latency reads.

**Core Value Proposition:** A single source of truth for AI agents to access your knowledge, projects, and context without local file sync complexity. Agents connect via URL - no local installation required.

## Essential Commands

### Development
```bash
pnpm dev                 # Start Next.js dev server (localhost:3000)
pnpm build              # Build for production
pnpm start              # Run production build
```

### Database
```bash
pnpm db:generate        # Generate Drizzle client
pnpm db:migrate         # Run migrations
pnpm db:push            # Push schema changes (dev only)
pnpm db:studio          # Open Drizzle Studio
```

### Testing
```bash
pnpm test               # Run all tests
pnpm test:watch         # Run tests in watch mode
pnpm test:unit          # Run only unit tests
pnpm test:integration   # Run only integration tests
pnpm test:ci            # Run tests with coverage
```

### Linting
```bash
pnpm lint               # Run ESLint
pnpm typecheck          # Run TypeScript type checking
```

## Architecture

### Core System Flow

1. **Agent connects** -> MCP client connects to remote server via HTTP+SSE
2. **Index retrieval** -> Agent calls `memory_index` to get document overview
3. **Search/Browse** -> Agent uses `memory_search` or navigates by folder/tags
4. **Read content** -> Agent calls `memory_read` for full document
5. **Write content** -> Agent calls `memory_write` to create/update documents

### Key Components

#### Mastra Layer (`src/mastra/`)
- **index.ts**: Mastra instance with all tools registered
- **tools/**: MCP tool definitions using `createTool`
  - `memory-index.ts`, `memory-search.ts`, `memory-read.ts`
  - `memory-write.ts`, `memory-list.ts`, `memory-delete.ts`
- **server.ts**: MCP server setup via Mastra's built-in primitives

#### Core Handlers (`src/core/`)
- **index.ts**: Lightweight listing of all documents (paths, titles, tags)
- **search.ts**: Full-text search using FTS5
- **read.ts**: Fetch complete document by path
- **write.ts**: Create or update documents (last-write-wins)
- **delete.ts**: Soft delete (sets `deleted_at`)
- **folders.ts**: Derive folder tree from document paths
- **versioning.ts**: Manage document version history

#### API Layer (`src/api/`)
- **routes.ts**: Hono REST API routes
- **middleware.ts**: Auth, logging, CORS middleware

#### Database Layer (`src/db/`)
- **schema.ts**: Drizzle schema definitions
- **client.ts**: Turso client setup
- **queries.ts**: Common query helpers

#### Auth (`src/auth/`)
- **api-key.ts**: API key validation for MCP/REST
- **session.ts**: Cookie-based session for web UI

### Database Schema Key Points

- **documents**: Main table with soft delete (`deleted_at`), version tracking, FTS5 index
- **document_versions**: Version history (last N versions per document)
- **Folders**: Derived from paths, not stored as entities
- **Tags**: JSON array in documents table, indexed via FTS5
- **Metadata**: JSON object for arbitrary key-value pairs

```typescript
// Key columns in documents table
{
  id: text,
  path: text,              // e.g., "/work/projects/memory"
  title: text,
  content: text,           // Full markdown
  tags: text,              // JSON array
  metadata: text,          // JSON object
  source: text,            // "claude-code", "chatgpt", "manual"
  type: text,              // "note", "spec", "meeting"
  version: integer,
  deleted_at: integer,     // NULL = active, timestamp = soft deleted
  last_write_source: text, // Track which agent wrote last
}
```

### Environment Variables

Required in `.env`:
```bash
# Turso Database
TURSO_DATABASE_URL=libsql://memory-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbG...

# Auth
MEMORY_API_KEY=mem_xxxxxxxxxxxxxxxx    # For MCP/REST access
MEMORY_UI_PASSWORD=your-secure-password # For web UI login

# Optional
MEMORY_MAX_VERSIONS=10                  # Versions to keep per document
```

## Important Patterns

### Mastra MCP Server

Memory uses Mastra framework to expose MCP tools. The server uses HTTP+SSE transport (not stdio).

**Tool Definition Pattern:**
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
    return await readDocument(context.path, context.version);
  },
});
```

**Mastra Instance:**
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
```

**User Configuration (Claude Desktop/Code):**
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

No local process, no `command` field - it's a remote server.

### Agent Workflow (Recommended)

1. Call `memory_index` first to get overview
2. Use index to decide what to read
3. Call `memory_search` for specific queries
4. Call `memory_read` to get full content
5. Call `memory_write` to save new content

### Folder Derivation

Folders are not stored - they're derived from document paths:

```typescript
// "/work/projects/memory" -> folders: ["/work", "/work/projects"]
function deriveFolders(path: string): string[] {
  const parts = path.split('/').filter(Boolean);
  const folders: string[] = [];
  let current = '';
  for (let i = 0; i < parts.length - 1; i++) {
    current += '/' + parts[i];
    folders.push(current);
  }
  return folders;
}
```

### Conflict Handling (v1)

**Last-write-wins**: Latest `updated_at` timestamp wins. Previous content preserved in `document_versions` for recovery. `last_write_source` tracks which agent made changes.

### Soft Delete

Documents are never hard-deleted immediately:
- `memory_delete` sets `deleted_at` timestamp
- Queries filter `WHERE deleted_at IS NULL`
- UI can show trash and restore
- Permanent delete available via UI settings

### Full-Text Search (FTS5)

Search uses SQLite FTS5 with triggers to stay in sync:

```sql
-- Search query
SELECT path, title, snippet(documents_fts, 1, '<mark>', '</mark>', '...', 32)
FROM documents_fts
WHERE documents_fts MATCH ?
ORDER BY rank
LIMIT 10;
```

Supports: `AND`, `OR`, `NOT`, phrases (`"exact phrase"`), prefix (`turso*`)

## Testing Strategy

- Unit tests in `__tests__/unit/` - core handlers, utilities
- Integration tests in `__tests__/integration/` - API endpoints, MCP tools
- Environment: vitest with happy-dom
- Mock Turso client for unit tests
- Use test database for integration tests

## Common Workflows

### Adding a New Document (Agent)
1. Agent calls `memory_write` with path, content, tags
2. Handler checks if path exists
3. If exists: increment version, save old content to versions, update
4. If new: create document with version 1
5. FTS5 triggers update search index
6. Return new version number

### Searching for Content (Agent)
1. Agent calls `memory_search` with query and optional filters
2. Handler builds FTS5 query with filters
3. Execute search with `LIMIT` and `OFFSET`
4. Return paths, titles, snippets (not full content)
5. Agent calls `memory_read` for documents it wants

### Restoring Deleted Document (UI)
1. User views trash in settings
2. User clicks restore on document
3. Handler sets `deleted_at = NULL`
4. Document reappears in listings

## Path Aliases

Uses TypeScript path alias `@/` -> src directory:
```typescript
import { documents } from '@/db/schema';
import { searchDocuments } from '@/core/search';
```

## Deployment Notes

### Vercel (Recommended)
- Deploy as Next.js app
- MCP endpoint at `/api/mcp`
- REST endpoints at `/api/*`
- Edge functions for low latency
- Set env vars in Vercel dashboard

### Cloudflare Workers (Alternative)
- Use Hono adapter for Workers
- Turso works via HTTP
- May need separate deployment for MCP vs UI

### Self-Hosted (Docker)
- Can use embedded Turso replicas for sub-ms reads
- Requires persistent storage for replica file
- See ARCHITECTURE.md for embedded replica setup

## API Quick Reference

### MCP Tools
| Tool | Description |
|------|-------------|
| `memory_index` | Get lightweight listing of all documents |
| `memory_search` | Full-text search with filters |
| `memory_read` | Get full document by path |
| `memory_write` | Create or update document |
| `memory_list` | List documents in folder |
| `memory_delete` | Soft delete document |

### REST Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/index` | GET | Document index |
| `/api/search` | GET | Full-text search |
| `/api/documents/*path` | GET | Read document |
| `/api/documents` | POST | Create document |
| `/api/documents/*path` | PUT | Update document |
| `/api/documents/*path` | DELETE | Soft delete |
| `/api/folders` | GET | Folder tree |
| `/api/tags` | GET | Tag list with counts |
| `/api/health` | GET | Health check |

## Performance Targets

| Operation | Target | Strategy |
|-----------|--------|----------|
| Read | <10ms | Turso edge distribution |
| Search | <15ms | FTS5 + result limiting |
| Index | <20ms | Lightweight metadata only |
| Write | <100ms | Direct to Turso primary |

## Key Design Decisions

### Why Mastra for MCP Server?
- Consistency: Matches jack-x-agent and sensie in the monorepo
- Primitives: `createTool` handles schema validation, error handling
- Built-in: MCP server support with HTTP+SSE transport
- Observability: Integrates with Langfuse for tracing

### Why Turso + Drizzle (not Prisma + Neon)?
- Performance-first: Turso's edge distribution for low latency
- FTS5 built-in: No separate search service needed
- Lighter weight: Drizzle generates smaller bundles

### Why Remote MCP (not local)?
- No sync issues: Single source of truth in cloud
- No installation: Users just add URL to config
- Always available: Works from any device

### Why Last-Write-Wins (not AI merge)?
- Simplicity: v1 focus on core functionality
- Rare conflicts: <1000 docs, single user
- Recovery: Version history preserves old content
- Future: AI merge planned for v2

### Why No Semantic Search (v1)?
- FTS5 sufficient: Good for keyword and phrase search
- Complexity: Embeddings add cost and latency
- Scale: <1000 docs don't need semantic matching
- Future: Can add embeddings layer later
