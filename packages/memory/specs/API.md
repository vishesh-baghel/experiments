# Memory - API Specification

## Overview

Memory exposes two interfaces:
1. **MCP Server** - For AI agents (Claude Code, Claude Desktop) via HTTP+SSE
2. **REST API** - For HTTP clients (ChatGPT plugins, custom apps, web UI)

Both interfaces share the same core functionality.

### Recommended Agent Workflow

1. **Start**: Call `memory_index` to get overview of all documents
2. **Discover**: Use folder/tag info to understand organization
3. **Search**: Call `memory_search` when looking for specific content
4. **Read**: Call `memory_read` to get full document content
5. **Write**: Call `memory_write` to create/update documents

---

## MCP Tools

### memory_index

Get a lightweight index of all documents for context-aware navigation. Call this first to understand what's in the knowledge base.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "includeSnippets": {
      "type": "boolean",
      "default": false,
      "description": "Include first 100 chars of each document"
    },
    "includeTags": {
      "type": "boolean",
      "default": true,
      "description": "Include tag list with counts"
    },
    "includeFolders": {
      "type": "boolean",
      "default": true,
      "description": "Include folder tree structure"
    }
  }
}
```

**Output:**
```json
{
  "documents": [
    {
      "path": "/work/projects/memory",
      "title": "Memory Project Spec",
      "tags": ["typescript", "ai", "project"],
      "type": "spec",
      "updatedAt": "2025-01-18T12:00:00Z",
      "snippet": "A central knowledge base for storing..."
    }
  ],
  "folders": [
    {
      "path": "/work",
      "children": ["/work/projects", "/work/meetings"],
      "documentCount": 15
    },
    {
      "path": "/personal",
      "children": ["/personal/journal"],
      "documentCount": 30
    }
  ],
  "tags": [
    { "name": "typescript", "count": 25 },
    { "name": "ai", "count": 18 },
    { "name": "project", "count": 10 }
  ],
  "stats": {
    "totalDocuments": 156,
    "totalFolders": 12,
    "totalTags": 45
  },
  "latencyMs": 8.5
}
```

**Use Cases:**
- Agent starts session → calls `memory_index` to understand available content
- Agent needs to decide what to read → scans titles/tags from index
- User asks "what do you know about X?" → agent checks index before searching

---

### memory_search

Search across all stored markdown content using full-text search.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query (supports FTS5 syntax: AND, OR, NOT, phrases)"
    },
    "folder": {
      "type": "string",
      "description": "Limit search to folder path, e.g., '/work/projects'"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Filter by tags (AND logic)"
    },
    "type": {
      "type": "string",
      "description": "Filter by document type, e.g., 'note', 'spec', 'meeting'"
    },
    "limit": {
      "type": "number",
      "default": 10,
      "maximum": 50,
      "description": "Maximum results to return"
    }
  },
  "required": ["query"]
}
```

**Output:**
```json
{
  "results": [
    {
      "path": "/work/projects/memory",
      "title": "Memory Project Spec",
      "snippet": "...sub-millisecond latency for all APIs...",
      "tags": ["typescript", "ai", "project"],
      "type": "spec",
      "updatedAt": "2025-01-18T12:00:00Z",
      "score": 0.95
    }
  ],
  "total": 1,
  "latencyMs": 2.3
}
```

**FTS5 Query Examples:**
- `memory project` - Documents containing both words
- `"sub-millisecond latency"` - Exact phrase
- `typescript OR golang` - Either word
- `ai NOT chatgpt` - Contains "ai" but not "chatgpt"
- `turso*` - Prefix match (turso, turso's, etc.)

---

### memory_read

Read a complete markdown file by its path.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Document path, e.g., '/work/projects/memory'"
    },
    "version": {
      "type": "number",
      "description": "Specific version to read (optional, defaults to latest)"
    },
    "includeMetadata": {
      "type": "boolean",
      "default": true,
      "description": "Include document metadata in response"
    }
  },
  "required": ["path"]
}
```

**Output:**
```json
{
  "path": "/work/projects/memory",
  "title": "Memory Project Spec",
  "content": "# Memory\n\nA central knowledge base...",
  "tags": ["typescript", "ai", "project"],
  "metadata": {
    "priority": "high",
    "status": "in-progress"
  },
  "type": "spec",
  "source": "claude-code",
  "version": 3,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-18T12:00:00Z",
  "latencyMs": 0.45
}
```

**Errors:**
- `404` - Document not found at path
- `400` - Invalid path format

---

### memory_write

Create or update a markdown file.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Document path (creates parent folders if needed)"
    },
    "title": {
      "type": "string",
      "description": "Document title (extracted from content if not provided)"
    },
    "content": {
      "type": "string",
      "description": "Full markdown content"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Tags for categorization"
    },
    "metadata": {
      "type": "object",
      "description": "Custom key-value metadata"
    },
    "type": {
      "type": "string",
      "description": "Document type, e.g., 'note', 'spec', 'meeting'"
    },
    "source": {
      "type": "string",
      "description": "Source of write, e.g., 'claude-code', 'chatgpt'"
    },
    "mergeStrategy": {
      "type": "string",
      "enum": ["replace", "merge", "append"],
      "default": "replace",
      "description": "How to handle existing content"
    }
  },
  "required": ["path", "content"]
}
```

**Output:**
```json
{
  "path": "/work/projects/memory",
  "version": 4,
  "previousVersion": 3,
  "action": "updated",
  "latencyMs": 85.2
}
```

**Merge Strategies:**
- `replace` - Overwrite entire content (default)
- `merge` - AI-assisted merge with existing content
- `append` - Add content to end of document

---

### memory_list

List documents in a folder or matching criteria.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "folder": {
      "type": "string",
      "description": "Folder path to list, e.g., '/work/projects'"
    },
    "recursive": {
      "type": "boolean",
      "default": false,
      "description": "Include documents in subfolders"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Filter by tags"
    },
    "limit": {
      "type": "number",
      "default": 50,
      "maximum": 200
    },
    "offset": {
      "type": "number",
      "default": 0
    }
  }
}
```

**Output:**
```json
{
  "documents": [
    {
      "path": "/work/projects/memory",
      "title": "Memory Project Spec",
      "tags": ["typescript", "ai"],
      "type": "spec",
      "updatedAt": "2025-01-18T12:00:00Z"
    }
  ],
  "folders": [
    "/work/projects/jack-x-agent",
    "/work/projects/squad"
  ],
  "total": 15,
  "latencyMs": 1.2
}
```

---

### memory_delete

Delete a document (moves to trash, can be restored).

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Document path to delete"
    },
    "permanent": {
      "type": "boolean",
      "default": false,
      "description": "Permanently delete (skip trash)"
    }
  },
  "required": ["path"]
}
```

---

## REST API

Base URL: `https://memory.yourdomain.com/api`

### Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer mem_xxxxxxxxxxxx
```

### Endpoints

#### GET /api/index

Get lightweight index of all documents.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| snippets | boolean | Include content snippets (default: false) |
| tags | boolean | Include tag list (default: true) |
| folders | boolean | Include folder tree (default: true) |

**Response:**
```json
{
  "documents": [
    {
      "path": "/work/projects/memory",
      "title": "Memory Project Spec",
      "tags": ["typescript", "ai"],
      "type": "spec",
      "updatedAt": "2025-01-18T12:00:00Z"
    }
  ],
  "folders": [...],
  "tags": [...],
  "stats": { "totalDocuments": 156 },
  "latencyMs": 8.5
}
```

---

#### GET /api/documents

List all documents with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| folder | string | Filter by folder path |
| tags | string | Comma-separated tags |
| type | string | Filter by document type |
| limit | number | Max results (default: 50) |
| offset | number | Pagination offset |

**Response:**
```json
{
  "documents": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

---

#### GET /api/documents/*path

Read a document by path.

**Path:** Document path as URL segments, e.g., `/api/documents/work/projects/memory`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| version | number | Specific version |

**Response:**
```json
{
  "path": "/work/projects/memory",
  "title": "Memory Project Spec",
  "content": "# Memory\n\n...",
  "tags": ["typescript", "ai"],
  "metadata": {...},
  "version": 3,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-18T12:00:00Z",
  "latencyMs": 0.42
}
```

---

#### POST /api/documents

Create a new document.

**Request Body:**
```json
{
  "path": "/work/projects/new-project",
  "title": "New Project",
  "content": "# New Project\n\nDescription...",
  "tags": ["project"],
  "metadata": {
    "priority": "medium"
  },
  "type": "spec"
}
```

**Response:**
```json
{
  "path": "/work/projects/new-project",
  "version": 1,
  "action": "created"
}
```

---

#### PUT /api/documents/*path

Update an existing document.

**Request Body:**
```json
{
  "content": "# Updated Content\n\n...",
  "tags": ["updated-tag"],
  "mergeStrategy": "replace"
}
```

---

#### DELETE /api/documents/*path

Delete a document.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| permanent | boolean | Skip trash |

---

#### GET /api/search

Full-text search.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (required) |
| folder | string | Limit to folder |
| tags | string | Comma-separated tags |
| type | string | Document type |
| limit | number | Max results |

**Response:**
```json
{
  "results": [
    {
      "path": "/work/projects/memory",
      "title": "Memory Project",
      "snippet": "...matching text...",
      "score": 0.95
    }
  ],
  "total": 5,
  "latencyMs": 2.1
}
```

---

#### GET /api/folders

List folder structure.

**Response:**
```json
{
  "folders": [
    {
      "path": "/work",
      "children": [
        { "path": "/work/projects", "documentCount": 5 },
        { "path": "/work/meetings", "documentCount": 12 }
      ]
    },
    {
      "path": "/personal",
      "children": [
        { "path": "/personal/journal", "documentCount": 30 }
      ]
    }
  ]
}
```

---

#### GET /api/tags

List all tags with counts.

**Response:**
```json
{
  "tags": [
    { "name": "typescript", "count": 25 },
    { "name": "ai", "count": 18 },
    { "name": "project", "count": 10 }
  ]
}
```

---

#### GET /api/health

Health check with latency metrics.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "replicaSync": "up-to-date",
  "metrics": {
    "readLatencyP50Ms": 0.35,
    "readLatencyP99Ms": 0.82,
    "searchLatencyP50Ms": 1.8,
    "searchLatencyP99Ms": 4.2
  },
  "documentCount": 156,
  "lastSyncAt": "2025-01-18T12:00:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Document not found at path: /work/nonexistent",
    "path": "/work/nonexistent"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NOT_FOUND | 404 | Document not found |
| INVALID_PATH | 400 | Malformed path |
| INVALID_QUERY | 400 | Malformed search query |
| UNAUTHORIZED | 401 | Missing or invalid API key |
| CONFLICT | 409 | Write conflict (use merge) |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limits

| Tier | Reads/min | Writes/min | Search/min |
|------|-----------|------------|------------|
| Default | 1000 | 100 | 200 |

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1705579200
```

---

## Webhooks (Future)

Reserved for future implementation:

```json
{
  "event": "document.updated",
  "path": "/work/projects/memory",
  "version": 4,
  "timestamp": "2025-01-18T12:00:00Z"
}
```
