import type {
  SocraticContext,
  SocraticQuestion,
  AnswerEvaluation,
  Concept,
  Topic,
} from '@/lib/types';

/**
 * SensieAgent - Main teaching agent with Socratic method
 *
 * Personality: Master Roshi (wise, eccentric, demanding but encouraging)
 * Teaching style: Questions, not answers. Guide through understanding.
 */

/**
 * Result from teaching a concept
 */
export interface TeachingContent {
  conceptId: string;
  introduction: string;
  contextSetting: string;
  initialQuestion: SocraticQuestion;
}

/**
 * Result from Socratic questioning
 */
export interface SocraticResponse {
  question: SocraticQuestion;
  encouragement?: string;
  conceptContext?: string;
}

/**
 * Evaluation result from answer assessment
 */
export interface EvaluationResult {
  evaluation: AnswerEvaluation;
  feedback: string;
  nextAction: 'next_concept' | 'follow_up' | 'guide' | 'hint';
  guidingQuestion?: SocraticQuestion;
}

/**
 * Suggestion for next concept to study
 */
export interface NextConceptSuggestion {
  conceptId: string;
  reason: string;
  confidence: number;
}

/**
 * Teach a concept - introduces context and asks first question
 */
export async function teachConcept(conceptId: string): Promise<TeachingContent> {
  throw new Error('Not implemented');
}

/**
 * Ask a Socratic question within context
 */
export async function askSocraticQuestion(
  context: SocraticContext
): Promise<SocraticResponse> {
  throw new Error('Not implemented');
}

/**
 * Evaluate user's answer to a question
 */
export async function evaluateAnswer(
  answer: string,
  question: SocraticQuestion,
  context: SocraticContext
): Promise<EvaluationResult> {
  throw new Error('Not implemented');
}

/**
 * Suggest the next concept to study
 */
export async function suggestNextConcept(
  topicId: string,
  userId: string
): Promise<NextConceptSuggestion> {
  throw new Error('Not implemented');
}

/**
 * Generate encouragement in Master Roshi style
 */
export async function generateEncouragement(
  context: 'correct' | 'incorrect' | 'progress' | 'struggle'
): Promise<string> {
  throw new Error('Not implemented');
}

/**
 * Handle special commands from user
 */
export async function handleCommand(
  command: string,
  context: SocraticContext
): Promise<string> {
  throw new Error('Not implemented');
}

/**
 * Generate a break message
 */
export async function generateBreakMessage(
  sessionDuration: number,
  questionsAnswered: number
): Promise<string> {
  throw new Error('Not implemented');
}

/**
 * Generate progress report in Sensie's voice
 */
export async function generateProgressReport(
  topicId: string,
  userId: string
): Promise<string> {
  throw new Error('Not implemented');
}
