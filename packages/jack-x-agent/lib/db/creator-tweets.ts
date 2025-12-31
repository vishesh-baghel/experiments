/**
 * Creator Tweets database queries
 */

import { prisma } from './client';
import type { TweetData } from '@/lib/apify/twitter-scraper';

/**
 * Store creator tweets in database
 * Uses upsert to avoid duplicates (based on unique tweetId)
 */
export async function storeCreatorTweets(creatorId: string, tweets: TweetData[]) {
  if (tweets.length === 0) {
    return;
  }

  // Store tweets using upsert to prevent duplicates
  const promises = tweets.map((tweet) =>
    prisma.creatorTweet.upsert({
      where: { tweetId: tweet.tweetId },
      update: {
        content: tweet.content,
        metrics: tweet.metrics,
        scrapedAt: new Date(),
      },
      create: {
        creatorId,
        tweetId: tweet.tweetId,
        content: tweet.content,
        authorHandle: tweet.authorHandle,
        publishedAt: tweet.publishedAt,
        metrics: tweet.metrics,
      },
    })
  );

  await Promise.all(promises);

  // Update creator's lastScrapedAt timestamp
  await prisma.creator.update({
    where: { id: creatorId },
    data: { lastScrapedAt: new Date() },
  });
}

/**
 * Get all creator tweets for a user (from all active creators)
 */
export async function getAllCreatorTweets(
  userId: string,
  options?: {
    limit?: number;
    daysBack?: number;
  }
) {
  const { limit = 50, daysBack = 30 } = options || {};

  // Calculate date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysBack);

  return prisma.creatorTweet.findMany({
    where: {
      creator: {
        userId,
        isActive: true,
      },
      publishedAt: {
        gte: dateThreshold,
      },
    },
    include: {
      creator: {
        select: {
          xHandle: true,
        },
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get creators that need scraping (stale or never scraped)
 */
export async function getCreatorsNeedingScraping(
  userId: string,
  hoursStale = 24
) {
  const staleThreshold = new Date();
  staleThreshold.setHours(staleThreshold.getHours() - hoursStale);

  return prisma.creator.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { lastScrapedAt: null },
        { lastScrapedAt: { lt: staleThreshold } },
      ],
    },
    select: {
      id: true,
      xHandle: true,
      isActive: true,
      tweetCount: true,
      lastScrapedAt: true,
    },
    orderBy: {
      lastScrapedAt: 'asc',
    },
  });
}

/**
 * Get tweets for a specific creator
 */
export async function getCreatorTweets(
  creatorId: string,
  options?: {
    limit?: number;
    daysBack?: number;
  }
) {
  const { limit = 50, daysBack = 30 } = options || {};

  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysBack);

  return prisma.creatorTweet.findMany({
    where: {
      creatorId,
      publishedAt: {
        gte: dateThreshold,
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Delete old tweets (cleanup function for data retention)
 * Default: Keep tweets for 7 days to minimize database costs
 */
export async function deleteOldTweets(daysToKeep = 7) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysToKeep);

  console.log(`[CLEANUP] Deleting tweets published before ${threshold.toISOString()}`);

  const result = await prisma.creatorTweet.deleteMany({
    where: {
      publishedAt: {
        lt: threshold,
      },
    },
  });

  console.log(`[CLEANUP] Deleted ${result.count} old tweets`);

  return result.count;
}
