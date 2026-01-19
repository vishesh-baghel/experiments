import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { getDocumentIndex } from '@/core/index';

export const memoryIndex = createTool({
  id: 'memory_index',
  description:
    'Get a lightweight index of all documents in the knowledge base. Returns paths, titles, tags, and metadata without full content. Use this first to understand what documents are available before reading specific ones.',
  inputSchema: z.object({
    folder: z
      .string()
      .optional()
      .describe('Filter by folder path prefix, e.g., "/work"'),
    source: z
      .string()
      .optional()
      .describe('Filter by source, e.g., "claude-code", "manual"'),
    type: z
      .string()
      .optional()
      .describe('Filter by document type, e.g., "note", "spec"'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Filter by tags (documents must have all specified tags)'),
    limit: z
      .number()
      .optional()
      .describe('Maximum number of documents to return (default: 100)'),
  }),
  execute: async ({ context }) => {
    const db = getDb();
    const result = await getDocumentIndex(db, {
      folder: context.folder,
      source: context.source,
      type: context.type,
      tags: context.tags,
      limit: context.limit,
    });

    return {
      documents: result.documents.map((doc) => ({
        path: doc.path,
        title: doc.title,
        tags: doc.tags,
        source: doc.source,
        type: doc.type,
        updatedAt: doc.updatedAt.toISOString(),
      })),
      folders: result.folders,
      tagCounts: result.tagCounts,
      total: result.total,
      latencyMs: result.latencyMs,
    };
  },
});
