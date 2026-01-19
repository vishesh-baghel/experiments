import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { deleteDocument } from '@/core/delete';

export const memoryDelete = createTool({
  id: 'memory_delete',
  description:
    'Soft delete a document from the knowledge base. The document is moved to trash and can be restored later. Use this to remove documents you no longer need.',
  inputSchema: z.object({
    path: z
      .string()
      .describe('Document path to delete, e.g., "/work/old-project"'),
  }),
  execute: async ({ context }) => {
    const db = getDb();

    const result = await deleteDocument(db, context.path);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        latencyMs: result.latencyMs,
      };
    }

    return {
      success: true,
      path: context.path,
      action: result.action,
      message: `Document at ${context.path} has been moved to trash. It can be restored from the web UI.`,
      latencyMs: result.latencyMs,
    };
  },
});
