import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { searchDocuments } from '@/core/search';

export const memorySearch = createTool({
  id: 'memory_search',
  description:
    'Search documents in the knowledge base using full-text search. Supports phrases, AND/OR/NOT operators, and prefix matching. Returns snippets with highlights, not full content. Use memory_read to get full content.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Search query. Supports: phrases ("exact phrase"), operators (AND, OR, NOT), prefix (term*). Use "*" to list all documents.'
      ),
    folder: z
      .string()
      .optional()
      .describe('Filter by folder path prefix, e.g., "/work"'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Filter by tags (documents must have all specified tags)'),
    source: z
      .string()
      .optional()
      .describe('Filter by source, e.g., "claude-code", "manual"'),
    limit: z
      .number()
      .optional()
      .describe('Maximum results to return (default: 20)'),
    offset: z.number().optional().describe('Offset for pagination (default: 0)'),
  }),
  execute: async ({ context }) => {
    const db = getDb();
    const result = await searchDocuments(db, {
      query: context.query,
      folder: context.folder,
      tags: context.tags,
      source: context.source,
      limit: context.limit,
      offset: context.offset,
    });

    return {
      documents: result.documents.map((doc) => ({
        path: doc.path,
        title: doc.title,
        tags: doc.tags,
        snippet: doc.snippet,
        source: doc.source,
        type: doc.type,
      })),
      total: result.total,
      latencyMs: result.latencyMs,
    };
  },
});
