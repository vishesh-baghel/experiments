import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { writeDocument } from '@/core/write';

export const memoryWrite = createTool({
  id: 'memory_write',
  description:
    'Create or update a document in the knowledge base. If the document exists, it will be updated and the previous version saved to history. Uses last-write-wins conflict resolution.',
  inputSchema: z.object({
    path: z
      .string()
      .describe(
        'Document path, e.g., "/work/projects/memory". Must start with "/".'
      ),
    content: z
      .string()
      .describe('Full markdown content of the document'),
    title: z
      .string()
      .optional()
      .describe(
        'Document title. If not provided, will be extracted from first # heading or derived from path.'
      ),
    tags: z
      .array(z.string())
      .optional()
      .describe('Tags for categorization and filtering'),
    metadata: z
      .record(z.unknown())
      .optional()
      .describe('Arbitrary key-value metadata'),
    source: z
      .string()
      .optional()
      .describe(
        'Source identifier, e.g., "claude-code", "chatgpt", "manual"'
      ),
    type: z
      .string()
      .optional()
      .describe('Document type, e.g., "note", "spec", "meeting"'),
  }),
  execute: async ({ context }) => {
    const db = getDb();

    const result = await writeDocument(db, {
      path: context.path,
      content: context.content,
      title: context.title,
      tags: context.tags,
      metadata: context.metadata as Record<string, unknown> | undefined,
      source: context.source,
      type: context.type,
    });

    return {
      success: true,
      path: result.path,
      version: result.version,
      previousVersion: result.previousVersion,
      action: result.action,
      latencyMs: result.latencyMs,
    };
  },
});
