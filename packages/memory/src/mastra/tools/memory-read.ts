import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { readDocument, readDocumentVersion } from '@/core/read';

export const memoryRead = createTool({
  id: 'memory_read',
  description:
    'Read the full content of a document by its path. Returns the complete markdown content along with metadata. Use memory_index or memory_search first to find document paths.',
  inputSchema: z.object({
    path: z
      .string()
      .describe('Document path, e.g., "/work/projects/memory"'),
    version: z
      .number()
      .optional()
      .describe('Specific version number to read (default: latest)'),
  }),
  execute: async ({ context }) => {
    const db = getDb();

    // If specific version requested
    if (context.version !== undefined) {
      const versionResult = await readDocumentVersion(
        db,
        context.path,
        context.version
      );

      if (!versionResult) {
        return {
          error: `Version ${context.version} not found for document at ${context.path}`,
          found: false,
        };
      }

      return {
        found: true,
        path: context.path,
        content: versionResult.content,
        metadata: versionResult.metadata,
        version: versionResult.version,
        createdAt: versionResult.createdAt.toISOString(),
      };
    }

    // Read latest version
    const result = await readDocument(db, context.path);

    if (!result) {
      return {
        error: `Document not found at ${context.path}`,
        found: false,
      };
    }

    return {
      found: true,
      path: result.path,
      title: result.title,
      content: result.content,
      tags: result.tags,
      metadata: result.metadata,
      source: result.source,
      type: result.type,
      version: result.version,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      latencyMs: result.latencyMs,
    };
  },
});
