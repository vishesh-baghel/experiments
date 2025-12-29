/**
 * Pattern Learning Service
 * Triggers automatic pattern analysis when posts are marked as good
 */

import { analyzeGoodPosts } from '@/lib/mastra/pattern-analyzer';
import { getGoodPostsForLearning } from './posts';
import { prisma } from './client';
import type { Prisma } from '@prisma/client';

/**
 * Trigger pattern learning for a user
 * Analyzes their good posts and updates learned patterns
 */
export async function triggerPatternLearning(userId: string) {
  try {
    console.log(`Starting pattern learning for user ${userId}...`);

    // Get recent good posts
    const goodPosts = await getGoodPostsForLearning(userId, 20);

    if (goodPosts.length < 3) {
      console.log(`Insufficient good posts for user ${userId} (${goodPosts.length}/3 minimum)`);
      return null;
    }

    console.log(`Analyzing ${goodPosts.length} good posts...`);

    // Analyze patterns using LLM
    const patterns = await analyzeGoodPosts(goodPosts);

    // Get existing tone config
    const toneConfig = await prisma.toneConfig.findUnique({
      where: { userId },
    });

    if (!toneConfig) {
      console.log(`No tone config found for user ${userId}, creating one...`);
      // Create tone config if it doesn't exist
      await prisma.toneConfig.create({
        data: {
          userId,
          learnedPatterns: {},
        },
      });
    }

    const existingPatterns = (toneConfig?.learnedPatterns as Record<string, unknown>) || {};

    // Merge patterns (new patterns override old ones)
    const updatedPatterns: Prisma.InputJsonValue = {
      ...existingPatterns,
      ...patterns,
      lastUpdated: new Date().toISOString(),
      totalGoodPosts: goodPosts.length,
    };

    // Save to database
    await prisma.toneConfig.update({
      where: { userId },
      data: {
        learnedPatterns: updatedPatterns,
      },
    });

    console.log(`Pattern learning complete for user ${userId}`);

    return updatedPatterns;
  } catch (error) {
    console.error(`Pattern learning error for user ${userId}:`, error);
    // Don't throw - graceful degradation (background operation)
    return null;
  }
}
