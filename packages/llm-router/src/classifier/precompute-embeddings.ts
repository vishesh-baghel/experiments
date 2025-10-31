/**
 * Script to pre-compute embeddings for training data
 * Run this once, save to file, load on startup
 * Saves cost and improves startup time
 */

import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { trainingData } from './training-data';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function precomputeEmbeddings() {
  console.log('='.repeat(80));
  console.log('PRE-COMPUTING EMBEDDINGS FOR TRAINING DATA');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total examples: ${trainingData.length}`);
  console.log('Using: text-embedding-3-small with 256 dimensions');
  console.log();

  const startTime = Date.now();
  let processed = 0;
  let totalCost = 0;

  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < trainingData.length; i += batchSize) {
    const batch = trainingData.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (example) => {
        try {
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small', {
              dimensions: 256, // Reduced from 1536
            }),
            value: example.query,
          });
          
          example.embedding = embedding;
          processed++;
          
          // Rough cost estimate: $0.00002 per 1K tokens, ~10 tokens per query
          totalCost += 0.0000002;
          
          if (processed % 10 === 0) {
            console.log(`  Processed ${processed}/${trainingData.length} embeddings`);
          }
        } catch (error) {
          console.error(`Failed to embed: "${example.query}"`, error);
          throw error;
        }
      })
    );
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log();
  console.log('='.repeat(80));
  console.log('COMPLETE');
  console.log('='.repeat(80));
  console.log(`Processed: ${processed} embeddings`);
  console.log(`Duration: ${duration}s`);
  console.log(`Estimated cost: $${totalCost.toFixed(6)}`);
  console.log();

  // Save to file
  const outputPath = join(__dirname, 'precomputed-embeddings.json');
  const data = {
    version: '1.0',
    model: 'text-embedding-3-small',
    dimensions: 256,
    generatedAt: new Date().toISOString(),
    totalExamples: trainingData.length,
    estimatedCost: totalCost,
    embeddings: trainingData.map((example) => ({
      query: example.query,
      complexity: example.complexity,
      embedding: example.embedding,
    })),
  };

  writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Saved to: ${outputPath}`);
  console.log();
  console.log('Next steps:');
  console.log('1. Commit precomputed-embeddings.json to git');
  console.log('2. ML classifier will load instantly on startup');
  console.log('3. No API calls needed for training');
  console.log();
}

precomputeEmbeddings().catch(console.error);
