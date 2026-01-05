import { prisma } from './client';
import type { Subtopic } from '@prisma/client';

/**
 * Create subtopics for a topic (batch create)
 */
export async function createSubtopics(
  topicId: string,
  subtopics: Array<{
    name: string;
    description?: string;
    order: number;
    isLocked?: boolean;
  }>
): Promise<Subtopic[]> {
  throw new Error('Not implemented');
}

/**
 * Get all subtopics for a topic (ordered)
 */
export async function getSubtopicsByTopic(topicId: string): Promise<Subtopic[]> {
  throw new Error('Not implemented');
}

/**
 * Get subtopic by ID with optional concepts
 */
export async function getSubtopicById(
  subtopicId: string,
  includeConcepts?: boolean
): Promise<Subtopic | null> {
  throw new Error('Not implemented');
}

/**
 * Get the next locked subtopic for a topic
 */
export async function getNextLockedSubtopic(
  topicId: string
): Promise<Subtopic | null> {
  throw new Error('Not implemented');
}

/**
 * Unlock a subtopic
 */
export async function unlockSubtopic(subtopicId: string): Promise<Subtopic> {
  throw new Error('Not implemented');
}

/**
 * Update subtopic mastery percentage
 */
export async function updateSubtopicMastery(
  subtopicId: string,
  masteryPercentage: number
): Promise<Subtopic> {
  throw new Error('Not implemented');
}

/**
 * Complete a subtopic
 */
export async function completeSubtopic(subtopicId: string): Promise<Subtopic> {
  throw new Error('Not implemented');
}

/**
 * Calculate subtopic mastery from concepts
 */
export async function calculateSubtopicMastery(
  subtopicId: string
): Promise<number> {
  throw new Error('Not implemented');
}
