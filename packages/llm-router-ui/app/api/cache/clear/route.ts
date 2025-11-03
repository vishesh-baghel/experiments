import { createClient } from 'redis';
import { NextResponse } from 'next/server';

// Initialize Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    
    redisClient.on('error', (err) => console.error('[Redis] Client Error:', err));
    
    await redisClient.connect();
  }
  return redisClient;
}

export async function POST() {
  try {
    const redis = await getRedisClient();
    
    // Get all cache keys
    const keys = await redis.keys('llm-cache:*');
    
    if (keys.length > 0) {
      // Delete all cache keys
      await redis.del(keys);
      console.log(`[Cache] Cleared ${keys.length} cache entries`);
      
      return NextResponse.json({ 
        success: true, 
        message: `Cleared ${keys.length} cache entries`,
        count: keys.length 
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'Cache was already empty',
        count: 0 
      });
    }
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
