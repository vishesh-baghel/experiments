/**
 * Outline database queries
 */

import { prisma } from './client';
import type { ContentOutline } from '@/lib/mastra/schemas';

/**
 * Create an outline for a content idea
 */
export async function createOutline(
  contentIdeaId: string,
  outline: ContentOutline
) {
  return prisma.outline.create({
    data: {
      contentIdeaId,
      format: outline.format,
      sections: outline.sections as unknown as Record<string, unknown>, // Prisma Json type
      estimatedLength: outline.estimatedLength,
      toneReminders: outline.toneReminders,
    },
  });
}

/**
 * Get outline by ID with related content idea
 */
export async function getOutlineById(outlineId: string) {
  return prisma.outline.findUnique({
    where: { id: outlineId },
    include: {
      contentIdea: true,
      drafts: true,
    },
  });
}

/**
 * Get outlines for a content idea
 */
export async function getOutlinesForIdea(contentIdeaId: string) {
  return prisma.outline.findMany({
    where: { contentIdeaId },
    orderBy: { createdAt: 'desc' },
  });
}
