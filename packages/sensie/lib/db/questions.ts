import { prisma } from './client';
import type { Question, QuestionType } from '@prisma/client';

/**
 * Create a question for a concept
 */
export async function createQuestion(data: {
  conceptId: string;
  text: string;
  type: QuestionType;
  difficulty?: number;
  expectedElements?: string[];
  hints?: string[];
  followUpPrompts?: string[];
}): Promise<Question> {
  throw new Error('Not implemented');
}

/**
 * Create multiple questions for a concept (batch)
 */
export async function createQuestions(
  conceptId: string,
  questions: Array<{
    text: string;
    type: QuestionType;
    difficulty?: number;
    expectedElements?: string[];
    hints?: string[];
    followUpPrompts?: string[];
  }>
): Promise<Question[]> {
  throw new Error('Not implemented');
}

/**
 * Get all questions for a concept
 */
export async function getQuestionsByConcept(
  conceptId: string,
  difficulty?: number
): Promise<Question[]> {
  throw new Error('Not implemented');
}

/**
 * Get question by ID
 */
export async function getQuestionById(
  questionId: string
): Promise<Question | null> {
  throw new Error('Not implemented');
}

/**
 * Get a random question for a concept at given difficulty
 */
export async function getRandomQuestion(
  conceptId: string,
  difficulty: number
): Promise<Question | null> {
  throw new Error('Not implemented');
}

/**
 * Get questions for a quiz (random selection)
 */
export async function getQuestionsForQuiz(
  conceptIds: string[],
  count: number
): Promise<Question[]> {
  throw new Error('Not implemented');
}

/**
 * Get question with its hints
 */
export async function getQuestionWithHints(
  questionId: string
): Promise<Question | null> {
  throw new Error('Not implemented');
}
