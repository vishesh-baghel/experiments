import { NextResponse } from 'next/server';
import { Index } from '@upstash/vector';

export async function POST() {
  try {
    if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Upstash Vector not configured' },
        { status: 500 }
      );
    }

    const vectorDb = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });
    
    // Get count before clearing
    const info = await vectorDb.info();
    const count = info.vectorCount || 0;
    
    // Clear all vectors
    await vectorDb.reset();
    console.log(`[Cache] Cleared ${count} semantic cache entries`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${count} cache entries`,
      count 
    });
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
