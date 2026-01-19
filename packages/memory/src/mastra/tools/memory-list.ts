import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { getDocumentIndex } from '@/core/index';

export const memoryList = createTool({
  id: 'memory_list',
  description:
    'List documents in a specific folder. Returns paths, titles, and tags for documents within the folder hierarchy. Use this to browse the folder structure.',
  inputSchema: z.object({
    folder: z
      .string()
      .describe('Folder path to list, e.g., "/work" or "/personal/notes"'),
    recursive: z
      .boolean()
      .optional()
      .describe(
        'If true, include documents in subfolders. If false, only direct children. (default: true)'
      ),
    limit: z
      .number()
      .optional()
      .describe('Maximum documents to return (default: 50)'),
    offset: z.number().optional().describe('Offset for pagination (default: 0)'),
  }),
  execute: async ({ context }) => {
    const db = getDb();

    // Get documents in the folder
    const result = await getDocumentIndex(db, {
      folder: context.folder,
      limit: context.limit ?? 50,
      offset: context.offset ?? 0,
      orderBy: 'path',
    });

    // If not recursive, filter to only direct children
    let documents = result.documents;
    if (context.recursive === false) {
      const folderDepth = context.folder.split('/').filter(Boolean).length;
      documents = documents.filter((doc) => {
        const docDepth = doc.path.split('/').filter(Boolean).length;
        return docDepth === folderDepth + 1;
      });
    }

    // Get immediate subfolders
    const subfolders = result.folders.filter((f) => {
      const folderDepth = context.folder.split('/').filter(Boolean).length;
      const subDepth = f.split('/').filter(Boolean).length;
      return f.startsWith(context.folder) && subDepth === folderDepth + 1;
    });

    return {
      folder: context.folder,
      documents: documents.map((doc) => ({
        path: doc.path,
        title: doc.title,
        tags: doc.tags,
        updatedAt: doc.updatedAt.toISOString(),
      })),
      subfolders,
      total: documents.length,
      latencyMs: result.latencyMs,
    };
  },
});
