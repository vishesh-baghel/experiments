/**
 * Generate 100 benchmark queries using GPT-4
 * Cost: ~$0.50 one-time
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

interface BenchmarkQuery {
  id: number;
  query: string;
  expectedComplexity: 'simple' | 'moderate' | 'complex' | 'reasoning';
  category: string;
}

async function generateQueries() {
  console.log('='.repeat(80));
  console.log('GENERATING 100 BENCHMARK QUERIES');
  console.log('='.repeat(80));
  console.log();

  const queries: BenchmarkQuery[] = [];
  let id = 1;

  // Generate 25 queries for each complexity level
  const complexityLevels: Array<{
    level: 'simple' | 'moderate' | 'complex' | 'reasoning';
    count: number;
  }> = [
    { level: 'simple', count: 25 },
    { level: 'moderate', count: 25 },
    { level: 'complex', count: 25 },
    { level: 'reasoning', count: 25 },
  ];

  for (const { level, count } of complexityLevels) {
    console.log(`Generating ${count} ${level} queries...`);

    const prompt = getPromptForComplexity(level, count);

    const { text } = await generateText({
      model: openai('gpt-4o-mini'), // Cheaper model for generation
      prompt,
      temperature: 0.8, // More diverse queries
    });

    // Parse the generated queries
    const lines = text.split('\n').filter((line) => line.trim());
    
    for (const line of lines) {
      // Expected format: "1. Query text | category"
      const match = line.match(/^\d+\.\s*(.+?)\s*\|\s*(.+)$/);
      if (match && queries.length < id + count - 1) {
        queries.push({
          id: id++,
          query: match[1].trim(),
          expectedComplexity: level,
          category: match[2].trim(),
        });
      }
    }

    console.log(`  Generated ${queries.filter(q => q.expectedComplexity === level).length} queries`);
  }

  console.log();
  console.log('='.repeat(80));
  console.log(`TOTAL QUERIES GENERATED: ${queries.length}`);
  console.log('='.repeat(80));

  // Save to file
  const outputPath = join(__dirname, 'queries.json');
  writeFileSync(outputPath, JSON.stringify(queries, null, 2));
  console.log(`Saved to: ${outputPath}`);

  // Also generate TypeScript file
  const tsContent = `/**
 * Auto-generated benchmark queries
 * Generated: ${new Date().toISOString()}
 * Total: ${queries.length} queries
 */

export interface BenchmarkQuery {
  id: number;
  query: string;
  expectedComplexity: 'simple' | 'moderate' | 'complex' | 'reasoning';
  category: string;
}

export const benchmarkQueries: BenchmarkQuery[] = ${JSON.stringify(queries, null, 2)};
`;

  const tsPath = join(__dirname, 'queries.ts');
  writeFileSync(tsPath, tsContent);
  console.log(`Saved to: ${tsPath}`);
}

function getPromptForComplexity(
  level: 'simple' | 'moderate' | 'complex' | 'reasoning',
  count: number
): string {
  const basePrompt = `Generate exactly ${count} realistic customer support queries for the "${level}" complexity level.

Format each query as:
1. Query text | category

`;

  switch (level) {
    case 'simple':
      return (
        basePrompt +
        `
Simple queries are:
- Factual questions with direct answers
- Yes/no questions
- Status checks
- Basic procedural questions
- Single-step tasks

Examples:
1. What are your business hours? | hours
2. Do you ship internationally? | shipping
3. How do I reset my password? | account

Generate ${count} diverse simple queries covering: hours, shipping, returns, account, pricing, availability, contact info, policies.
`
      );

    case 'moderate':
      return (
        basePrompt +
        `
Moderate queries are:
- Multi-part questions
- Require explanation or context
- Involve 2-3 steps
- Compare options
- Troubleshooting basic issues

Examples:
1. I received a damaged product. What are my options for replacement or refund? | returns
2. Can you explain the difference between your Standard and Premium plans? | pricing
3. My order hasn't arrived yet. How can I track it and what should I do if it's lost? | shipping

Generate ${count} diverse moderate queries covering: product issues, plan comparisons, troubleshooting, multi-step processes, policy clarifications.
`
      );

    case 'complex':
      return (
        basePrompt +
        `
Complex queries are:
- Technical problems
- Multiple constraints
- Require detailed analysis
- Integration or compatibility questions
- Advanced feature usage

Examples:
1. I'm trying to integrate your API with my React app but getting CORS errors. Can you help debug? | technical
2. What's the best way to migrate 10,000 users from our legacy system to your platform without downtime? | migration
3. Can you explain how your pricing scales with usage and what optimizations we can make for high-volume scenarios? | pricing-technical

Generate ${count} diverse complex queries covering: API integration, technical debugging, migrations, scalability, advanced features, architecture decisions.
`
      );

    case 'reasoning':
      return (
        basePrompt +
        `
Reasoning queries require:
- Multi-step logical thinking
- Trade-off analysis
- Strategic planning
- Problem-solving with constraints
- Optimization decisions

Examples:
1. We're deciding between building in-house vs using your platform. Can you help analyze the trade-offs considering our team size, budget, and timeline? | strategy
2. Our system needs to handle 1M requests/day with <100ms latency. How should we architect this using your services? | architecture
3. Given our compliance requirements (GDPR, HIPAA) and need for real-time analytics, what's the optimal data pipeline design? | compliance-architecture

Generate ${count} diverse reasoning queries covering: build vs buy decisions, architecture design, optimization strategies, compliance planning, cost-benefit analysis, scaling strategies.
`
      );
  }
}

generateQueries().catch(console.error);
