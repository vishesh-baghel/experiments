/**
 * API Route: Manual Scrape Creator Tweets
 * POST /api/creators/[id]/scrape
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { scrapeTwitterUser } from '@/lib/apify/twitter-scraper';
import { storeCreatorTweets } from '@/lib/db/creator-tweets';
import { blockGuestWrite } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    // Get creator
    const creator = await prisma.creator.findUnique({
      where: { id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Scrape tweets
    const tweets = await scrapeTwitterUser(creator.xHandle);

    // Store in database
    await storeCreatorTweets(id, tweets);

    return NextResponse.json({
      success: true,
      count: tweets.length,
      creator: creator.xHandle,
    });
  } catch (error) {
    console.error('Error scraping creator tweets:', error);

    return NextResponse.json(
      {
        error: 'Failed to scrape creator tweets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
