/**
 * Training script for ML classifier
 * Run this to pre-train the classifier and evaluate accuracy
 */

import { config } from 'dotenv';
import { MLClassifier } from './ml-classifier';
import { trainingData } from './training-data';

config()

async function main() {
  console.log('='.repeat(80));
  console.log('ML CLASSIFIER TRAINING');
  console.log('='.repeat(80));
  console.log();

  const classifier = new MLClassifier();

  // Split data: 80% train, 20% test
  const shuffled = [...trainingData].sort(() => Math.random() - 0.5);
  const splitIndex = Math.floor(shuffled.length * 0.8);
  const trainData = shuffled.slice(0, splitIndex);
  const testData = shuffled.slice(splitIndex);

  console.log(`Total examples: ${trainingData.length}`);
  console.log(`Training set: ${trainData.length}`);
  console.log(`Test set: ${testData.length}`);
  console.log();

  // Train classifier
  console.log('Training classifier...');
  await classifier.loadTrainingData(trainData);
  console.log();

  // Get training stats
  const stats = classifier.getTrainingStats();
  console.log('Training Statistics:');
  console.log(`  Total examples: ${stats.totalExamples}`);
  console.log(`  Simple: ${stats.examplesByLevel.simple}`);
  console.log(`  Moderate: ${stats.examplesByLevel.moderate}`);
  console.log(`  Complex: ${stats.examplesByLevel.complex}`);
  console.log(`  Reasoning: ${stats.examplesByLevel.reasoning}`);
  console.log();

  // Evaluate on test set
  console.log('Evaluating on test set...');
  const results = await classifier.evaluateAccuracy(testData);
  
  console.log();
  console.log('='.repeat(80));
  console.log('EVALUATION RESULTS');
  console.log('='.repeat(80));
  console.log(`Accuracy: ${(results.accuracy * 100).toFixed(2)}%`);
  console.log(`Correct: ${results.correct}/${results.total}`);
  console.log();

  console.log('Confusion Matrix:');
  console.log('                 Predicted →');
  console.log('Actual ↓     Simple  Moderate  Complex  Reasoning');
  console.log('-'.repeat(60));
  
  const levels: Array<'simple' | 'moderate' | 'complex' | 'reasoning'> = [
    'simple',
    'moderate',
    'complex',
    'reasoning',
  ];
  
  for (const actual of levels) {
    const row = levels.map((pred) => 
      results.confusionMatrix[actual][pred].toString().padStart(7)
    ).join('  ');
    console.log(`${actual.padEnd(12)} ${row}`);
  }
  console.log();

  // Test on sample queries
  console.log('='.repeat(80));
  console.log('SAMPLE CLASSIFICATIONS');
  console.log('='.repeat(80));
  console.log();

  const sampleQueries = [
    'What are your hours?',
    'Can you explain the difference between your plans?',
    'I was charged twice and cannot access my account',
    'What is the best plan for a growing startup?',
  ];

  for (const query of sampleQueries) {
    const result = await classifier.classify(query);
    console.log(`Query: "${query}"`);
    console.log(`  Level: ${result.level}`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  Reasoning: ${result.reasoning}`);
    console.log();
  }

  console.log('='.repeat(80));
  console.log('Training complete!');
  console.log('='.repeat(80));
}

main().catch(console.error);
