import { prisma } from './client';
import type { LearningSession, Message, MessageRole } from '@prisma/client';

/**
 * Create a new learning session
 */
export async function createSession(data: {
  userId: string;
  topicId: string;
  currentSubtopicId?: string;
  currentConceptId?: string;
}): Promise<LearningSession> {
  throw new Error('Not implemented');
}

/**
 * Get session by ID with optional messages
 */
export async function getSessionById(
  sessionId: string,
  includeMessages?: boolean
): Promise<LearningSession | null> {
  throw new Error('Not implemented');
}

/**
 * Get active session for a topic
 */
export async function getActiveSession(
  topicId: string
): Promise<LearningSession | null> {
  throw new Error('Not implemented');
}

/**
 * Get active sessions for a user
 */
export async function getActiveSessionsByUser(
  userId: string
): Promise<LearningSession[]> {
  throw new Error('Not implemented');
}

/**
 * Update session state
 */
export async function updateSessionState(
  sessionId: string,
  data: {
    currentSubtopicId?: string;
    currentConceptId?: string;
    currentQuestionId?: string;
    currentAttempts?: number;
    hintsUsed?: number;
  }
): Promise<LearningSession> {
  throw new Error('Not implemented');
}

/**
 * Use a skip in session
 */
export async function useSkip(
  sessionId: string,
  questionId: string
): Promise<LearningSession> {
  throw new Error('Not implemented');
}

/**
 * End a session
 */
export async function endSession(sessionId: string): Promise<LearningSession> {
  throw new Error('Not implemented');
}

/**
 * Add a message to session
 */
export async function addMessage(data: {
  sessionId: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<Message> {
  throw new Error('Not implemented');
}

/**
 * Get messages for a session
 */
export async function getSessionMessages(
  sessionId: string,
  limit?: number
): Promise<Message[]> {
  throw new Error('Not implemented');
}

/**
 * Reset skip count (for new subtopic)
 */
export async function resetSkips(sessionId: string): Promise<LearningSession> {
  throw new Error('Not implemented');
}

/**
 * Update last activity timestamp
 */
export async function updateLastActivity(
  sessionId: string
): Promise<LearningSession> {
  throw new Error('Not implemented');
}
