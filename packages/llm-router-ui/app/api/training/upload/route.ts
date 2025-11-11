import { NextResponse } from 'next/server';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Index } from '@upstash/vector';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TrainingExample {
  query: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'reasoning';
}

// Load training data from source file
async function loadTrainingData() {
  const TRAINING_DATA_PATH = path.join(process.cwd(), '../llm-router/src/classifier/training-data.ts');
  const fileContent = await fs.readFile(TRAINING_DATA_PATH, 'utf-8');
  
  // Extract training data array from the file
  const match = fileContent.match(/export const trainingData[^=]*=\s*\[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('Could not parse training data');
  }
  
  // Parse the array content
  const arrayContent = '[' + match[1] + ']';
  const trainingData = new Function('return ' + arrayContent)();
  
  return trainingData;
}

export async function POST() {
  try {
    // Check environment variables
    if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
      return NextResponse.json(
        { error: 'Upstash Vector credentials not configured' },
        { status: 500 }
      );
    }

    // Load training data
    const trainingData = await loadTrainingData();

    // Initialize Upstash Vector
    const vectorDb = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });

    console.log('[Training Upload] Starting upload of', trainingData.length, 'examples');

    // Generate embeddings and upload in batches
    const batchSize = 10;
    let uploaded = 0;

    for (let i = 0; i < trainingData.length; i += batchSize) {
      const batch = trainingData.slice(i, i + batchSize);
      
      // Generate embeddings for batch
      const vectors = await Promise.all(
        batch.map(async (example: TrainingExample, batchIndex: number) => {
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small', {
              dimensions: 384, // Match Upstash Vector dimensions
            }),
            value: example.query,
            maxRetries: 3,
          });

          return {
            id: `training_${example.complexity}_${i + batchIndex}`,
            vector: embedding,
            metadata: {
              query: example.query,
              complexity: example.complexity,
              type: 'training',
            },
          };
        })
      );

      // Upload batch to Upstash
      await vectorDb.upsert(vectors);
      uploaded += vectors.length;
      
      console.log(`[Training Upload] Uploaded ${uploaded}/${trainingData.length} examples`);
    }

    console.log('[Training Upload] ✓ Upload complete');

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploaded} training examples to Upstash Vector`,
      count: uploaded,
    });
  } catch (error) {
    console.error('[Training Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload training data', details: String(error) },
      { status: 500 }
    );
  }
}
