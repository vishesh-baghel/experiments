/**
 * Integration tests for chat commands
 *
 * These tests verify that commands work correctly through the full
 * chat API route, including authentication and response formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as messageHandler } from '@/app/api/chat/message/route';
import type { SessionData } from '@/lib/auth/auth';

// Mock authentication modules
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
  isSessionExpired: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/auth/auth', () => ({
  requireAuth: vi.fn().mockReturnValue({ authorized: true }),
}));

// Mock database modules
vi.mock('@/lib/db/client', () => ({
  prisma: {
    question: {
      findUnique: vi.fn(),
    },
    learningSession: {
      update: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
    subtopic: {
      findUnique: vi.fn(),
    },
    concept: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db/sessions', () => ({
  getActiveSession: vi.fn(),
  createSession: vi.fn(),
  addMessage: vi.fn(),
  getSessionById: vi.fn(),
  endSession: vi.fn(),
  getActiveSessionsByUser: vi.fn(),
}));

vi.mock('@/lib/db/topics', () => ({
  getTopicById: vi.fn(),
  getTopicsByUser: vi.fn(),
  getActiveTopics: vi.fn(),
}));

vi.mock('@/lib/db/reviews', () => ({
  countReviewsDue: vi.fn(),
  getReviewsDue: vi.fn(),
}));

vi.mock('@/lib/db/progress', () => ({
  getUserProgress: vi.fn(),
  getTodayAnalytics: vi.fn(),
}));

vi.mock('@/lib/mastra/prompts', () => ({
  SENSIE_SYSTEM_PROMPT: 'You are Sensie, a wise teacher...',
}));

// Mock sensieAgent for non-command messages
vi.mock('@/lib/mastra/agents/sensie', () => ({
  sensieAgent: {
    stream: vi.fn().mockImplementation(() =>
      Promise.resolve({
        toUIMessageStreamResponse: vi.fn().mockReturnValue(
          new Response('data: {"type":"text-delta","delta":"Hello from Sensie!"}\n\ndata: [DONE]\n', {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
          })
        ),
      })
    ),
  },
  generateProgressReport: vi.fn(),
  generateQuiz: vi.fn(),
  handleCommand: vi.fn(),
}));

function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/chat/message', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

const mockSession: SessionData = {
  userId: 'user-123',
  role: 'owner',
  createdAt: Date.now(),
  expiresAt: Date.now() + 60 * 60 * 24 * 7 * 1000,
};

describe('Chat Commands Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getSession } = await import('@/lib/auth/session');
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
    const { requireAuth } = await import('@/lib/auth/auth');
    (requireAuth as ReturnType<typeof vi.fn>).mockReturnValue({ authorized: true });
  });

  describe('Command Detection', () => {
    it('should detect and handle /progress command', async () => {
      const { getUserProgress, getTodayAnalytics } = await import('@/lib/db/progress');
      const { getTopicsByUser } = await import('@/lib/db/topics');
      const { countReviewsDue } = await import('@/lib/db/reviews');

      (getUserProgress as ReturnType<typeof vi.fn>).mockResolvedValue({
        currentLevel: 3,
        totalXP: 500,
        currentStreak: 2,
        longestStreak: 5,
      });

      (getTodayAnalytics as ReturnType<typeof vi.fn>).mockResolvedValue({
        questionsAnswered: 5,
        questionsCorrect: 4,
        xpEarned: 25,
      });

      (getTopicsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 't-1', name: 'Rust', status: 'ACTIVE', masteryPercentage: 50 },
      ]);

      (countReviewsDue as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/progress' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('Level 3');
      expect(text).toContain('500 XP');
    });

    it('should detect and handle /topics command', async () => {
      const { getTopicsByUser } = await import('@/lib/db/topics');

      (getTopicsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 't-1', name: 'Rust Programming', status: 'ACTIVE', masteryPercentage: 75, subtopics: [] },
        { id: 't-2', name: 'Go Basics', status: 'QUEUED', masteryPercentage: 0, subtopics: [] },
      ]);

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/topics' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('Rust Programming');
      expect(text).toContain('Go Basics');
    });

    it('should detect and handle /continue command', async () => {
      const { getActiveSessionsByUser } = await import('@/lib/db/sessions');
      const { getTopicById } = await import('@/lib/db/topics');

      (getActiveSessionsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 's-1', topicId: 't-1', currentSubtopicId: null },
      ]);

      (getTopicById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 't-1',
        name: 'TypeScript Mastery',
        masteryPercentage: 60,
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/continue' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('TypeScript Mastery');
      expect(text).toContain('60%');
    });

    it('should detect and handle /review command', async () => {
      const { countReviewsDue, getReviewsDue } = await import('@/lib/db/reviews');
      const { prisma } = await import('@/lib/db/client');

      (countReviewsDue as ReturnType<typeof vi.fn>).mockResolvedValue(3);
      (getReviewsDue as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'r-1', conceptId: 'c-1' },
      ]);
      (prisma.concept.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        name: 'Memory Management',
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/review' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('3 Reviews Due');
    });

    it('should detect and handle /break command', async () => {
      const { getActiveSession, getSessionById } = await import('@/lib/db/sessions');
      const { prisma } = await import('@/lib/db/client');
      const { getTopicById } = await import('@/lib/db/topics');

      (getTopicById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 't-1',
        userId: 'user-123',
        name: 'Rust',
      });

      (getActiveSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 's-1',
        topicId: 't-1',
      });

      (getSessionById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 's-1',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      });

      (prisma.message.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { role: 'USER' },
        { role: 'USER' },
      ]);

      (prisma.learningSession.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/break' }],
        topicId: 't-1',
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('/continue');
    });

    it('should detect and handle /quiz command', async () => {
      const { getActiveTopics } = await import('@/lib/db/topics');

      (getActiveTopics as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 't-1', name: 'Python Fundamentals', masteryPercentage: 40 },
      ]);

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/quiz' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('Quiz Time');
      expect(text).toContain('Python Fundamentals');
    });
  });

  describe('Command with Topic Context', () => {
    it('should handle /hint command with topic context', async () => {
      const { getTopicById } = await import('@/lib/db/topics');
      const { getActiveSession, getSessionById } = await import('@/lib/db/sessions');
      const { prisma } = await import('@/lib/db/client');

      (getTopicById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 't-1',
        userId: 'user-123',
        name: 'Rust',
      });

      (getActiveSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 's-1',
        topicId: 't-1',
      });

      (getSessionById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 's-1',
        hintsUsed: 1,
        currentQuestionId: 'q-1',
      });

      (prisma.question.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'q-1',
        hints: ['Hint 1', 'Hint 2', 'Hint 3'],
        concept: { id: 'c-1' },
      });

      (prisma.learningSession.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/hint' }],
        topicId: 't-1',
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('Hint 2');
    });

    it('should handle /skip command with topic context', async () => {
      const { getTopicById } = await import('@/lib/db/topics');
      const { getActiveSession, getSessionById } = await import('@/lib/db/sessions');
      const { prisma } = await import('@/lib/db/client');

      (getTopicById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 't-1',
        userId: 'user-123',
        name: 'Go',
      });

      (getActiveSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 's-1',
        topicId: 't-1',
      });

      (getSessionById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 's-1',
        skipsUsed: 0,
        skippedQuestionIds: [],
        currentQuestionId: 'q-1',
      });

      (prisma.learningSession.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/skip' }],
        topicId: 't-1',
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('skipped');
      expect(text).toContain('2 skip');
    });
  });

  describe('Non-command Messages', () => {
    it('should route regular messages to Sensie agent', async () => {
      const { sensieAgent } = await import('@/lib/mastra/agents/sensie');

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello Sensie!' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);
      expect(sensieAgent.stream).toHaveBeenCalled();
    });

    it('should not treat messages with / in the middle as commands', async () => {
      const { sensieAgent } = await import('@/lib/mastra/agents/sensie');

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'What does the /etc/passwd file contain?' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);
      expect(sensieAgent.stream).toHaveBeenCalled();
    });

    it('should route AI SDK v6 format messages correctly', async () => {
      const { sensieAgent } = await import('@/lib/mastra/agents/sensie');

      const request = createMockRequest({
        messages: [{
          role: 'user',
          parts: [{ type: 'text', text: 'What is ownership in Rust?' }],
        }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);
      expect(sensieAgent.stream).toHaveBeenCalled();
    });
  });

  describe('Command Response Format', () => {
    it('should return AI SDK compatible stream format for commands', async () => {
      const { getTopicsByUser } = await import('@/lib/db/topics');
      (getTopicsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/topics' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
      expect(response.headers.get('X-Vercel-AI-Data-Stream')).toBe('v1');

      const text = await response.text();
      // Should contain stream format markers
      expect(text).toContain('d:');
      expect(text).toContain('0:');
    });
  });

  describe('Command Error Handling', () => {
    it('should handle unknown commands gracefully', async () => {
      // Unknown commands should still be processed by the command handler
      // but return an error message
      const request = createMockRequest({
        messages: [{ role: 'user', content: '/unknowncommand' }],
      });

      const response = await messageHandler(request);

      // Unknown commands fall through to agent
      expect(response.status).toBe(200);
    });

    it('should require authentication for commands', async () => {
      const { getSession } = await import('@/lib/auth/session');
      const { requireAuth } = await import('@/lib/auth/auth');

      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (requireAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        authorized: false,
        error: 'Not authenticated',
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/progress' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle uppercase commands', async () => {
      const { getUserProgress, getTodayAnalytics } = await import('@/lib/db/progress');
      const { getTopicsByUser } = await import('@/lib/db/topics');
      const { countReviewsDue } = await import('@/lib/db/reviews');

      (getUserProgress as ReturnType<typeof vi.fn>).mockResolvedValue({
        currentLevel: 1,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
      });

      (getTodayAnalytics as ReturnType<typeof vi.fn>).mockResolvedValue({
        questionsAnswered: 0,
        questionsCorrect: 0,
        xpEarned: 0,
      });

      (getTopicsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (countReviewsDue as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/PROGRESS' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('Progress');
    });

    it('should handle mixed case commands', async () => {
      const { getTopicsByUser } = await import('@/lib/db/topics');
      (getTopicsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const request = createMockRequest({
        messages: [{ role: 'user', content: '/Topics' }],
      });

      const response = await messageHandler(request);

      expect(response.status).toBe(200);
    });
  });
});
