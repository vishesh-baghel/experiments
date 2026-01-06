import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type {
  Concept,
  SocraticQuestion,
  QuestionType,
  Quiz,
  QuizQuestion,
} from '@/lib/types';
import { prisma } from '@/lib/db/client';
import {
  SENSIE_SYSTEM_PROMPT,
  QUESTION_GENERATION_PROMPT,
  FOLLOW_UP_PROMPT,
  GUIDING_QUESTION_PROMPT,
  QUIZ_GENERATION_PROMPT,
} from './prompts';
import {
  SocraticQuestionSchema,
  QuizSchema,
} from './schemas';

/**
 * QuestionAgent - Generates Socratic questions at appropriate difficulty
 *
 * Question types:
 * - UNDERSTANDING: Test conceptual understanding
 * - APPLICATION: Apply knowledge to scenarios
 * - ANALYSIS: Break down complex problems
 * - SYNTHESIS: Combine concepts
 * - EVALUATION: Judge and compare approaches
 */

/**
 * Options for question generation
 */
export interface QuestionGenerationOptions {
  difficulty: number; // 1-5
  type?: QuestionType;
  focusElements?: string[];
  avoidElements?: string[];
}

/**
 * Generated questions batch
 */
export interface GeneratedQuestions {
  questions: SocraticQuestion[];
  conceptId: string;
  difficulty: number;
}

/**
 * Quiz generation options
 */
export interface QuizOptions {
  questionCount: number;
  difficulty?: number;
  includeReview?: boolean;
  timeLimit?: number; // minutes
}

/**
 * Generate questions for a concept
 */
export async function generateQuestions(
  concept: Concept,
  options: QuestionGenerationOptions
): Promise<SocraticQuestion[]> {
  const questionsSchema = z.object({
    questions: z.array(SocraticQuestionSchema).min(1).max(5),
  });

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: questionsSchema,
    system: `${SENSIE_SYSTEM_PROMPT}\n\n${QUESTION_GENERATION_PROMPT}`,
    prompt: `Generate 3 Socratic questions for this concept:

Concept: ${concept.name}
${concept.explanation ? `Explanation: ${concept.explanation}` : ''}

Requirements:
- Target difficulty: ${options.difficulty}/5
${options.type ? `- Question type: ${options.type}` : '- Vary question types'}
${options.focusElements?.length ? `- Focus on: ${options.focusElements.join(', ')}` : ''}
${options.avoidElements?.length ? `- Avoid: ${options.avoidElements.join(', ')}` : ''}

Generate questions that require THINKING, not just recall. Each question should:
1. Have clear expected elements for evaluation
2. Include 3 progressive hints
3. Have potential follow-up questions`,
  });

  return object.questions.map(q => ({
    text: q.text,
    type: q.type as QuestionType,
    difficulty: q.difficulty,
    expectedElements: q.expectedElements,
    hints: q.hints,
    followUpPrompts: q.followUpPrompts,
  }));
}

/**
 * Generate a follow-up question based on user's answer
 */
export async function generateFollowUp(
  originalQuestion: SocraticQuestion,
  userAnswer: string,
  missingElements: string[]
): Promise<SocraticQuestion> {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: SocraticQuestionSchema,
    system: `${SENSIE_SYSTEM_PROMPT}\n\n${FOLLOW_UP_PROMPT}`,
    prompt: `Generate a follow-up question to push deeper understanding.

Original Question: ${originalQuestion.text}
Student's Answer: "${userAnswer}"
Missing Elements: ${missingElements.join(', ')}

The follow-up should:
1. Acknowledge their correct understanding
2. Probe into the missing elements
3. Connect to broader implications
4. Maintain the same difficulty level (${originalQuestion.difficulty}/5)`,
  });

  return {
    text: object.text,
    type: object.type as QuestionType,
    difficulty: originalQuestion.difficulty,
    expectedElements: object.expectedElements,
    hints: object.hints,
    followUpPrompts: object.followUpPrompts,
  };
}

/**
 * Generate a quiz for a topic
 */
export async function generateQuiz(
  topicId: string,
  options: QuizOptions
): Promise<Quiz> {
  // Get topic with concepts
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subtopics: {
        where: { isLocked: false },
        include: {
          concepts: {
            where: { isMastered: false },
          },
        },
      },
    },
  });

  if (!topic) {
    throw new Error('Topic not found');
  }

  // Collect concept names for quiz context
  const conceptNames = topic.subtopics.flatMap(st =>
    st.concepts.map(c => c.name)
  );

  if (conceptNames.length === 0) {
    // All concepts mastered - quiz on everything
    const allConcepts = await prisma.concept.findMany({
      where: {
        subtopic: { topicId },
      },
      select: { name: true },
    });
    conceptNames.push(...allConcepts.map(c => c.name));
  }

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: QuizSchema,
    system: `${SENSIE_SYSTEM_PROMPT}\n\n${QUIZ_GENERATION_PROMPT}`,
    prompt: `Generate a quiz for the topic "${topic.name}".

Concepts to cover: ${conceptNames.join(', ')}

Requirements:
- Number of questions: ${options.questionCount}
${options.difficulty ? `- Target difficulty: ${options.difficulty}/5` : '- Progressive difficulty (easier to harder)'}
${options.includeReview ? '- Include some review questions from previously mastered material' : ''}
${options.timeLimit ? `- Time limit: ${options.timeLimit} minutes` : ''}

Create questions that test understanding, not memorization. Include variety in question types.`,
  });

  return {
    title: object.title,
    description: object.description,
    questions: object.questions.map(q => ({
      question: q.question,
      type: q.type as 'UNDERSTANDING' | 'APPLICATION' | 'ANALYSIS',
      difficulty: q.difficulty,
      expectedAnswer: q.expectedAnswer,
      scoringCriteria: q.scoringCriteria,
    })),
    totalPoints: object.totalPoints,
    passingScore: object.passingScore,
    timeLimit: object.timeLimit,
  };
}

/**
 * Generate hints for a question
 */
export async function generateHints(
  question: SocraticQuestion,
  concept: Concept
): Promise<string[]> {
  // If question already has hints, return them
  if (question.hints && question.hints.length >= 3) {
    return question.hints;
  }

  const hintsSchema = z.object({
    hints: z.array(z.string()).length(3).describe('Three progressive hints'),
  });

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: hintsSchema,
    system: SENSIE_SYSTEM_PROMPT,
    prompt: `Generate 3 progressive hints for this question about "${concept.name}":

Question: ${question.text}
Expected Elements: ${question.expectedElements.join(', ')}

Hint 1 (subtle): Remind them of a related concept without revealing the answer
Hint 2 (moderate): Suggest the structure of a good answer
Hint 3 (strong): Provide a key insight that still requires connecting the dots

Keep hints brief (1-2 sentences each). Use Master Roshi's voice.`,
  });

  return object.hints;
}

/**
 * Adjust question difficulty
 */
export async function adjustQuestionDifficulty(
  question: SocraticQuestion,
  targetDifficulty: number
): Promise<SocraticQuestion> {
  // If already at target difficulty, return as-is
  if (question.difficulty === targetDifficulty) {
    return question;
  }

  const direction = targetDifficulty > question.difficulty ? 'harder' : 'easier';

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: SocraticQuestionSchema,
    system: SENSIE_SYSTEM_PROMPT,
    prompt: `Adjust this question to be ${direction} (target difficulty: ${targetDifficulty}/5):

Original Question: ${question.text}
Current Difficulty: ${question.difficulty}/5
Question Type: ${question.type}
Expected Elements: ${question.expectedElements.join(', ')}

Make the question ${direction} while:
1. Maintaining the core concept being tested
2. Adjusting complexity/scope appropriately
3. Updating expected elements if needed
4. Adjusting hints to match new difficulty`,
  });

  return {
    text: object.text,
    type: object.type as QuestionType,
    difficulty: targetDifficulty,
    expectedElements: object.expectedElements,
    hints: object.hints,
    followUpPrompts: object.followUpPrompts,
  };
}

/**
 * Generate guiding question for incorrect answer
 */
export async function generateGuidingQuestion(
  incorrectAnswer: string,
  originalQuestion: SocraticQuestion,
  knowledgeGap: string
): Promise<SocraticQuestion> {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: SocraticQuestionSchema,
    system: `${SENSIE_SYSTEM_PROMPT}\n\n${GUIDING_QUESTION_PROMPT}`,
    prompt: `Generate a guiding question to help the student understand.

Original Question: ${originalQuestion.text}
Student's Incorrect Answer: "${incorrectAnswer}"
Knowledge Gap: ${knowledgeGap}

The guiding question should:
1. NOT reveal the correct answer
2. Point them toward the right direction
3. Break down the problem into smaller parts
4. Build on what they DO understand
5. Be simpler than the original (difficulty: ${Math.max(1, originalQuestion.difficulty - 1)}/5)`,
  });

  return {
    text: object.text,
    type: object.type as QuestionType,
    difficulty: Math.max(1, originalQuestion.difficulty - 1),
    expectedElements: object.expectedElements,
    hints: object.hints,
    followUpPrompts: object.followUpPrompts,
  };
}

/**
 * Generate expected elements for a question
 */
export async function generateExpectedElements(
  question: string,
  concept: Concept
): Promise<string[]> {
  const elementsSchema = z.object({
    elements: z.array(z.string()).min(2).max(6).describe('Expected answer elements'),
    reasoning: z.string().describe('Why these elements are important'),
  });

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: elementsSchema,
    system: SENSIE_SYSTEM_PROMPT,
    prompt: `Identify the key elements expected in a good answer to this question.

Concept: ${concept.name}
${concept.explanation ? `Explanation: ${concept.explanation}` : ''}

Question: ${question}

List 3-5 key elements that a good answer should include. These will be used to evaluate student responses.`,
  });

  return object.elements;
}

/**
 * Select best question for current context
 */
export async function selectBestQuestion(
  questions: SocraticQuestion[],
  userPerformance: { accuracy: number; hintsUsed: number }
): Promise<SocraticQuestion> {
  if (questions.length === 0) {
    throw new Error('No questions provided');
  }

  if (questions.length === 1) {
    return questions[0];
  }

  // Calculate target difficulty based on performance
  let targetDifficulty: number;
  if (userPerformance.accuracy >= 0.8 && userPerformance.hintsUsed < 1) {
    // High performer - challenge them
    targetDifficulty = 4;
  } else if (userPerformance.accuracy >= 0.6) {
    // Good performer - moderate difficulty
    targetDifficulty = 3;
  } else if (userPerformance.accuracy >= 0.4) {
    // Struggling - easier questions
    targetDifficulty = 2;
  } else {
    // Really struggling - start simple
    targetDifficulty = 1;
  }

  // Find question closest to target difficulty
  const sorted = [...questions].sort((a, b) => {
    const aDiff = Math.abs(a.difficulty - targetDifficulty);
    const bDiff = Math.abs(b.difficulty - targetDifficulty);
    return aDiff - bDiff;
  });

  return sorted[0];
}

/**
 * Validate question quality
 */
export function validateQuestion(question: SocraticQuestion): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check text
  if (!question.text || question.text.trim().length < 10) {
    issues.push('Question text is too short or empty');
  }

  if (!question.text.includes('?')) {
    issues.push('Question should end with a question mark');
  }

  // Check type
  const validTypes: QuestionType[] = ['RECALL', 'UNDERSTANDING', 'APPLICATION', 'ANALYSIS', 'SYNTHESIS'];
  if (!validTypes.includes(question.type)) {
    issues.push(`Invalid question type: ${question.type}`);
  }

  // Check difficulty
  if (question.difficulty < 1 || question.difficulty > 5) {
    issues.push(`Difficulty should be 1-5, got ${question.difficulty}`);
  }

  // Check expected elements
  if (!question.expectedElements || question.expectedElements.length < 1) {
    issues.push('Question should have at least 1 expected element');
  }

  // Check hints
  if (!question.hints || question.hints.length < 1) {
    issues.push('Question should have at least 1 hint');
  } else if (question.hints.length > 3) {
    issues.push('Question should have at most 3 hints');
  }

  // Check for direct answer leakage in question text
  const lowerText = question.text.toLowerCase();
  if (lowerText.includes('the answer is') || lowerText.includes('you should')) {
    issues.push('Question should not contain direct answers or instructions');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
