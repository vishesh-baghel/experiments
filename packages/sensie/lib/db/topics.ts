import { prisma } from './client';
import type { Topic, TopicStatus } from '@prisma/client';

/**
 * Create a new topic for a user
 */
export async function createTopic(data: {
  userId: string;
  name: string;
  description?: string;
}): Promise<Topic> {
  throw new Error('Not implemented');
}

/**
 * Get all topics for a user
 */
export async function getTopicsByUser(
  userId: string,
  status?: TopicStatus
): Promise<Topic[]> {
  throw new Error('Not implemented');
}

/**
 * Get topic by ID with optional subtopics
 */
export async function getTopicById(
  topicId: string,
  includeSubtopics?: boolean
): Promise<Topic | null> {
  throw new Error('Not implemented');
}

/**
 * Get active topics for a user (max 3)
 */
export async function getActiveTopics(userId: string): Promise<Topic[]> {
  throw new Error('Not implemented');
}

/**
 * Count active topics for a user
 */
export async function countActiveTopics(userId: string): Promise<number> {
  throw new Error('Not implemented');
}

/**
 * Update topic status
 */
export async function updateTopicStatus(
  topicId: string,
  status: TopicStatus
): Promise<Topic> {
  throw new Error('Not implemented');
}

/**
 * Update topic mastery percentage
 */
export async function updateTopicMastery(
  topicId: string,
  masteryPercentage: number
): Promise<Topic> {
  throw new Error('Not implemented');
}

/**
 * Start a topic (set status to ACTIVE, set startedAt)
 */
export async function startTopic(topicId: string): Promise<Topic> {
  throw new Error('Not implemented');
}

/**
 * Complete a topic (set status to COMPLETED, set completedAt)
 */
export async function completeTopic(topicId: string): Promise<Topic> {
  throw new Error('Not implemented');
}

/**
 * Archive a topic
 */
export async function archiveTopic(topicId: string): Promise<Topic> {
  throw new Error('Not implemented');
}

/**
 * Delete a topic and all related data
 */
export async function deleteTopic(topicId: string): Promise<void> {
  throw new Error('Not implemented');
}
