/**
 * Upload pre-computed training embeddings to Upstash Vector
 * Run once to initialize the training data in Upstash
 */

import { config } from 'dotenv';
import { Index } from '@upstash/vector';
import * as fs from 'fs/promises';
import * as path from 'path';

config();

async function main() {
  console.log('='.repeat(80));
  console.log('UPLOADING TRAINING EMBEDDINGS TO UPSTASH VECTOR');
  console.log('='.repeat(80));
  console.log();

  // Check environment variables
  if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    console.error('❌ Error: UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN must be set');
    process.exit(1);
  }

  // Initialize Upstash Vector
  const vectorDb = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });

  console.log('✓ Connected to Upstash Vector');
  console.log();

  // Load precomputed embeddings
  const embeddingsPath = path.join(__dirname, 'precomputed-embeddings.json');
  const data = JSON.parse(await fs.readFile(embeddingsPath, 'utf-8'));

  console.log(`Total training examples: ${data.totalExamples}`);
  console.log(`Model: ${data.model}`);
  console.log(`Dimensions: ${data.dimensions}`);
  console.log();

  // Upload embeddings in batches
  const batchSize = 100;
  const embeddings = data.embeddings;
  let uploaded = 0;

  console.log('Uploading embeddings...');
  
  for (let i = 0; i < embeddings.length; i += batchSize) {
    const batch = embeddings.slice(i, i + batchSize);
    
    // Prepare batch for upsert
    const vectors = batch.map((item: any) => ({
      id: `training_${item.complexity}_${i + batch.indexOf(item)}`,
      vector: item.embedding,
      metadata: {
        query: item.query,
        complexity: item.complexity,
        type: 'training',
      },
    }));

    await vectorDb.upsert(vectors);
    uploaded += vectors.length;
    console.log(`  Uploaded ${uploaded}/${embeddings.length} embeddings`);
  }

  console.log();
  console.log('='.repeat(80));
  console.log('✓ UPLOAD COMPLETE');
  console.log('='.repeat(80));
  console.log();
  console.log('Training embeddings are now stored in Upstash Vector');
  console.log('The ML classifier will load them on startup');
  console.log();
  console.log('Next steps:');
  console.log('1. Update MLClassifier to load from Upstash instead of JSON file');
  console.log('2. Remove precomputed-embeddings.json from build process');
  console.log('3. Deploy without worrying about file copying!');
}

main().catch(console.error);
