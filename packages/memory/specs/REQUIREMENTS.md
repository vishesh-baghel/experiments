# Memory - Requirements Specification

## Overview

Memory is a central knowledge base for storing personal and professional context as markdown files. It exposes an MCP server for AI agents (Claude Code, ChatGPT, custom agents) to search, read, and write content with sub-millisecond read latency.

## Core Requirements

### Functional Requirements

#### 1. Content Management
- Store markdown files with hierarchical folder structure
- Support tag-based categorization (cross-cutting concerns)
- Rich custom metadata per document (arbitrary key-value pairs)
- Simple versioning: keep last N versions of each file (configurable, default: 10)

#### 2. APIs (MCP + REST)
| API | Description | Latency Target |
|-----|-------------|----------------|
| `index` | Lightweight listing of all documents | < 20ms |
| `search` | Full-text search across all content | < 15ms |
| `read` | Fetch complete markdown file by path | < 10ms |
| `write` | Create or update markdown file | < 100ms |

**Note:** MCP server is remote (HTTP+SSE), not a local process. Users connect via URL, no local installation required.

#### 3. Search Capabilities
- Full-text search using SQLite FTS5
- Filter by folder path, tags, metadata
- Sort by relevance, date modified, date created
- Return file paths with snippets (not full content)

#### 4. Conflict Resolution (v1)
- **Strategy: Last-write-wins** - latest timestamp wins, simpler for v1
- Track `last_write_source` for debugging which agent made changes
- Previous content preserved in version history for recovery
- No write queuing - concurrent writes are rare at <1000 docs scale

**Future (v2):** AI-assisted merge for combining non-overlapping changes

#### 5. Access Control
- **v1:** Single user system (one deployment = one knowledge base)
- API key authentication for MCP/REST access
- Simple password authentication for web UI
- **Future:** Self-hosted multi-user for teams (schema designed for this)

### Non-Functional Requirements

#### 1. Performance
- **Read latency**: < 10ms using Turso edge-distributed database
- **Search latency**: < 15ms for full-text queries (FTS5)
- **Index latency**: < 20ms for lightweight document listing
- **Write latency**: < 100ms (direct to Turso primary)
- **Throughput**: Handle 100+ concurrent read requests

**Note:** Sub-millisecond latency possible with embedded replicas for self-hosted deployments with persistent storage. Serverless edge deployments use Turso HTTP API.

#### 2. Scale
- Target: < 1000 markdown files
- Average file size: 1-50KB
- Total storage: < 100MB initially

#### 3. Availability
- Cloud deployment (Vercel/Cloudflare)
- Edge-distributed reads via Turso embedded replicas
- 99.9% uptime target

#### 4. Data Durability
- All writes persisted to Turso primary database
- Version history maintained for rollback
- No data loss on service restart

## User Personas

### 1. AI Agents (Primary)
- Claude Code, ChatGPT, custom Mastra agents
- Access via MCP protocol
- High-frequency reads, low-frequency writes
- Need fast context retrieval during conversations

### 2. Human User (Secondary)
- Access via web UI
- Full management: create, edit, delete, organize
- View rendered markdown
- Monitor system health and fetch times

### 3. Visitors (Demo)
- Access via web UI in visitor mode
- View sample markdown content only
- No authentication required
- Demonstrates system capabilities

## Content Organization

### Folder Structure (Examples)
```
/personal
  /journal
  /goals
  /health
/work
  /projects
    /jack-x-agent
    /memory
  /meetings
  /learnings
/references
  /books
  /articles
  /code-snippets
```

### Metadata Schema
```typescript
interface DocumentMetadata {
  // System fields (auto-managed)
  id: string;
  path: string;           // e.g., "/work/projects/memory"
  createdAt: Date;
  updatedAt: Date;
  version: number;

  // User fields
  title: string;
  tags: string[];         // e.g., ["typescript", "ai", "project"]
  source?: string;        // e.g., "claude-code", "chatgpt", "manual"
  type?: string;          // e.g., "note", "meeting", "spec", "journal"

  // Custom fields (arbitrary key-value)
  custom: Record<string, string | number | boolean>;
}
```

## Integration Points

### 1. MCP Server (Remote via Mastra)
- Expose `index`, `search`, `read`, `write`, `list`, `delete` as MCP tools
- **Framework:** Mastra with `createTool` for tool definitions
- **Transport:** HTTP + Server-Sent Events (SSE) - no local installation
- Compatible with Claude Code, Claude Desktop
- Users configure with URL + API key, no `command` or local process

### 2. REST API
- For non-MCP clients (ChatGPT plugins, custom apps)
- Same functionality as MCP tools
- OpenAPI specification provided

### 3. Web UI
- Next.js application
- Rendered markdown view
- File management interface
- Fetch time display per file

## Constraints (v1)

1. **No image storage** - Markdown text only for v1
2. **No real-time sync** - Agents poll or fetch on-demand
3. **No semantic search** - Full-text search only (FTS5)
4. **No chunking** - Whole files served to agents
5. **Single user** - No multi-tenancy for v1
6. **No import** - Manual content creation only (no Obsidian/Notion import)
7. **Last-write-wins** - No AI-assisted merge for conflicts

## Success Metrics

1. **Read latency p99 < 10ms** - Measured at edge
2. **Search latency p99 < 15ms** - For typical queries
3. **Index latency p99 < 20ms** - For document listing
4. **Zero data loss** - All writes persisted with version history
5. **100% MCP compatibility** - Works with Claude Code/Desktop via remote URL
