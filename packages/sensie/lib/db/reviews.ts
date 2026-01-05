import { prisma } from './client';
import type { Review, ReviewType, ReviewStatus } from '@prisma/client';

/**
 * Create a new review item
 */
export async function createReview(data: {
  userId: string;
  topicId: string;
  subtopicId?: string;
  conceptId?: string;
  type: ReviewType;
  nextReview: Date;
}): Promise<Review> {
  throw new Error('Not implemented');
}

/**
 * Get reviews due for a user
 */
export async function getReviewsDue(
  userId: string,
  limit?: number
): Promise<Review[]> {
  throw new Error('Not implemented');
}

/**
 * Get review by ID
 */
export async function getReviewById(reviewId: string): Promise<Review | null> {
  throw new Error('Not implemented');
}

/**
 * Count reviews due for a user
 */
export async function countReviewsDue(userId: string): Promise<number> {
  throw new Error('Not implemented');
}

/**
 * Update review after rating (FSRS algorithm)
 */
export async function updateReviewAfterRating(
  reviewId: string,
  data: {
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    reps: number;
    lapses: number;
    state: number;
    lastReviewed: Date;
    nextReview: Date;
    lastRating: number;
    status: ReviewStatus;
  }
): Promise<Review> {
  throw new Error('Not implemented');
}

/**
 * Get reviews by status
 */
export async function getReviewsByStatus(
  userId: string,
  status: ReviewStatus
): Promise<Review[]> {
  throw new Error('Not implemented');
}

/**
 * Check if review exists for item
 */
export async function reviewExistsForItem(
  userId: string,
  topicId: string,
  subtopicId?: string,
  conceptId?: string
): Promise<boolean> {
  throw new Error('Not implemented');
}

/**
 * Get review stats for user
 */
export async function getReviewStats(userId: string): Promise<{
  totalReviews: number;
  dueToday: number;
  completed: number;
  averageRetention: number;
}> {
  throw new Error('Not implemented');
}
