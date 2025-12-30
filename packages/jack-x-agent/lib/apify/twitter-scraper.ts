/**
 * Apify Twitter Scraper Integration
 * Uses apidojo/tweet-scraper actor to fetch tweets from creators
 */

import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_API_KEY,
});

export interface TweetData {
  tweetId: string;
  content: string;
  authorHandle: string;
  publishedAt: Date;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };
}

/**
 * Scrape recent tweets from a Twitter user
 * @param handle Twitter handle (with or without @)
 * @returns Array of tweet data
 */
export async function scrapeTwitterUser(handle: string): Promise<TweetData[]> {
  if (!process.env.APIFY_API_KEY) {
    console.error('[APIFY] API key not configured');
    return [];
  }

  console.log(`[APIFY] Scraping tweets for ${handle}`);

  // Normalize handle (remove @ if present)
  const normalizedHandle = handle.startsWith('@') ? handle.substring(1) : handle;

  try {
    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Run the tweet scraper actor
    const run = await client.actor('apidojo/tweet-scraper').call({
      twitterHandles: [normalizedHandle],
      maxItems: 50,
      sort: 'Latest',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });

    // Fetch results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Normalize data to our schema
    const tweets: TweetData[] = (items as any[]).map((item: any) => ({
      tweetId: item.id || item.tweetId || String(item.id_str),
      content: item.text || item.full_text || '',
      authorHandle: `@${item.author?.userName || normalizedHandle}`,
      publishedAt: new Date(item.createdAt || item.created_at || Date.now()),
      metrics: {
        likes: item.likes || item.favorite_count || 0,
        retweets: item.retweets || item.retweet_count || 0,
        replies: item.replies || item.reply_count || 0,
        views: item.views || item.viewCount || undefined,
      },
    }));

    console.log(`[APIFY] Successfully fetched ${tweets.length} tweets for ${handle}`);
    return tweets;
  } catch (error) {
    console.error(`[APIFY] Error scraping tweets for ${handle}:`, error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to scrape tweets. The account may be private, suspended, or the handle is invalid.'
    );
  }
}

/**
 * Validate a Twitter handle exists and is accessible
 * @param handle Twitter handle (with or without @)
 * @returns Validation result with userId if valid
 */
export async function validateTwitterHandle(handle: string): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  if (!process.env.APIFY_API_KEY) {
    return {
      valid: false,
      error: 'Twitter scraper not configured. Please add APIFY_API_KEY to environment variables.',
    };
  }

  // Normalize handle
  const normalizedHandle = handle.startsWith('@') ? handle.substring(1) : handle;

  // Basic validation
  if (!/^[\w]+$/.test(normalizedHandle)) {
    return {
      valid: false,
      error: 'Invalid Twitter handle format. Use only letters, numbers, and underscores.',
    };
  }

  try {
    // Try to scrape 1 tweet to verify account exists
    const run = await client.actor('apidojo/tweet-scraper').call({
      twitterHandles: [normalizedHandle],
      maxItems: 1,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items.length === 0) {
      return {
        valid: false,
        error: 'Twitter account not found or has no tweets. Verify the handle is correct.',
      };
    }

    // Extract user ID from first tweet
    const firstItem = items[0] as any;
    const userId = firstItem?.author?.id || firstItem?.author?.id_str || undefined;

    return {
      valid: true,
      userId: userId ? String(userId) : undefined,
    };
  } catch (error) {
    console.error(`Error validating handle ${handle}:`, error);
    return {
      valid: false,
      error:
        'Unable to validate Twitter handle. The account may be private, suspended, or temporarily unavailable.',
    };
  }
}
