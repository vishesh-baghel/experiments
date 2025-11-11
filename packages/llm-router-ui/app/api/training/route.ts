import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TrainingExample {
  query: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'reasoning';
}

// Load training data from source file
const TRAINING_DATA_PATH = path.join(process.cwd(), '../llm-router/src/classifier/training-data.ts');

async function loadTrainingData() {
  const fileContent = await fs.readFile(TRAINING_DATA_PATH, 'utf-8');
  
  // Extract training data array from the file
  const match = fileContent.match(/export const trainingData[^=]*=\s*\[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('Could not parse training data');
  }
  
  // Parse the array content
  const arrayContent = '[' + match[1] + ']';
  // Use Function constructor to safely evaluate the array
  const trainingData = new Function('return ' + arrayContent)();
  
  return trainingData;
}

// GET - Fetch all training data
export async function GET() {
  try {
    const trainingData = await loadTrainingData();
    
    const stats = {
      total: trainingData.length,
      simple: trainingData.filter((e: TrainingExample) => e.complexity === 'simple').length,
      moderate: trainingData.filter((e: TrainingExample) => e.complexity === 'moderate').length,
      complex: trainingData.filter((e: TrainingExample) => e.complexity === 'complex').length,
      reasoning: trainingData.filter((e: TrainingExample) => e.complexity === 'reasoning').length,
    };

    return NextResponse.json({
      examples: trainingData,
      stats,
    });
  } catch (error) {
    console.error('[Training API] Error fetching training data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training data' },
      { status: 500 }
    );
  }
}

// POST - Add new training example
export async function POST(request: Request) {
  try {
    const { query, complexity } = await request.json();

    if (!query || !complexity) {
      return NextResponse.json(
        { error: 'Query and complexity are required' },
        { status: 400 }
      );
    }

    // Read current file
    const fileContent = await fs.readFile(TRAINING_DATA_PATH, 'utf-8');
    
    // Find the last entry and add new one before the closing bracket
    const newEntry = `  { query: ${JSON.stringify(query)}, complexity: '${complexity}' },\n];`;
    const updatedContent = fileContent.replace(/\];$/, newEntry);

    // Write back to file
    await fs.writeFile(TRAINING_DATA_PATH, updatedContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Training API] Error adding training example:', error);
    return NextResponse.json(
      { error: 'Failed to add training example' },
      { status: 500 }
    );
  }
}

// DELETE - Remove training example
export async function DELETE(request: Request) {
  try {
    const { index } = await request.json();

    if (typeof index !== 'number') {
      return NextResponse.json(
        { error: 'Index is required' },
        { status: 400 }
      );
    }

    // Read current file
    const fileContent = await fs.readFile(TRAINING_DATA_PATH, 'utf-8');
    
    // Parse and remove the example at index
    const lines = fileContent.split('\n');
    const dataStartIndex = lines.findIndex((line) => line.includes('export const trainingData'));
    
    // Find the line with the example to delete
    let exampleCount = 0;
    let lineToDelete = -1;
    
    for (let i = dataStartIndex; i < lines.length; i++) {
      if (lines[i].trim().startsWith('{ query:')) {
        if (exampleCount === index) {
          lineToDelete = i;
          break;
        }
        exampleCount++;
      }
    }

    if (lineToDelete !== -1) {
      lines.splice(lineToDelete, 1);
      const updatedContent = lines.join('\n');
      await fs.writeFile(TRAINING_DATA_PATH, updatedContent, 'utf-8');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Training API] Error deleting training example:', error);
    return NextResponse.json(
      { error: 'Failed to delete training example' },
      { status: 500 }
    );
  }
}
