import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isCommand,
  parseCommand,
  executeCommand,
  SUPPORTED_COMMANDS,
  type SupportedCommand,
  type CommandContext,
} from '@/lib/chat/commands';

// Mock all database modules
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

vi.mock('@/lib/db/topics', () => ({
  getTopicsByUser: vi.fn(),
  getActiveTopics: vi.fn(),
  getTopicById: vi.fn(),
}));

vi.mock('@/lib/db/sessions', () => ({
  getSessionById: vi.fn(),
  endSession: vi.fn(),
  getActiveSessionsByUser: vi.fn(),
}));

vi.mock('@/lib/db/reviews', () => ({
  countReviewsDue: vi.fn(),
  getReviewsDue: vi.fn(),
}));

vi.mock('@/lib/db/progress', () => ({
  getUserProgress: vi.fn(),
  getTodayAnalytics: vi.fn(),
}));

vi.mock('@/lib/mastra/agents/sensie', () => ({
  generateProgressReport: vi.fn(),
  generateQuiz: vi.fn(),
  handleCommand: vi.fn(),
}));

describe('Chat Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isCommand', () => {
    it('should return true for valid commands', () => {
      expect(isCommand('/hint')).toBe(true);
      expect(isCommand('/skip')).toBe(true);
      expect(isCommand('/progress')).toBe(true);
      expect(isCommand('/topics')).toBe(true);
      expect(isCommand('/review')).toBe(true);
      expect(isCommand('/quiz')).toBe(true);
      expect(isCommand('/break')).toBe(true);
      expect(isCommand('/continue')).toBe(true);
    });

    it('should return true for commands with trailing text', () => {
      expect(isCommand('/hint please')).toBe(true);
      expect(isCommand('/progress detailed')).toBe(true);
    });

    it('should return true for commands with different casing', () => {
      expect(isCommand('/HINT')).toBe(true);
      expect(isCommand('/Progress')).toBe(true);
      expect(isCommand('/CONTINUE')).toBe(true);
    });

    it('should return true for commands with leading/trailing whitespace', () => {
      expect(isCommand('  /hint  ')).toBe(true);
      expect(isCommand('\n/progress\n')).toBe(true);
    });

    it('should return false for regular messages', () => {
      expect(isCommand('Hello Sensie')).toBe(false);
      expect(isCommand('What is ownership?')).toBe(false);
      expect(isCommand('I think the answer is...')).toBe(false);
    });

    it('should return false for messages containing command text but not starting with it', () => {
      expect(isCommand('I need a /hint')).toBe(false);
      expect(isCommand('Show me /progress')).toBe(false);
    });

    it('should return false for unknown commands', () => {
      expect(isCommand('/unknown')).toBe(false);
      expect(isCommand('/help')).toBe(false);
      expect(isCommand('/exit')).toBe(false);
    });

    it('should return false for empty or whitespace-only messages', () => {
      expect(isCommand('')).toBe(false);
      expect(isCommand('   ')).toBe(false);
      expect(isCommand('\n\t')).toBe(false);
    });
  });

  describe('parseCommand', () => {
    it('should parse valid commands correctly', () => {
      expect(parseCommand('/hint')).toEqual({ command: '/hint', args: '' });
      expect(parseCommand('/skip')).toEqual({ command: '/skip', args: '' });
      expect(parseCommand('/progress')).toEqual({ command: '/progress', args: '' });
      expect(parseCommand('/continue')).toEqual({ command: '/continue', args: '' });
    });

    it('should extract arguments after command', () => {
      expect(parseCommand('/quiz topic-123')).toEqual({ command: '/quiz', args: 'topic-123' });
      expect(parseCommand('/hint please')).toEqual({ command: '/hint', args: 'please' });
    });

    it('should handle case-insensitive commands', () => {
      expect(parseCommand('/HINT')).toEqual({ command: '/hint', args: '' });
      expect(parseCommand('/Progress')).toEqual({ command: '/progress', args: '' });
    });

    it('should return null for unknown commands', () => {
      expect(parseCommand('/unknown')).toEqual({ command: null, args: '' });
      expect(parseCommand('/help')).toEqual({ command: null, args: '' });
    });

    it('should return null for non-command messages', () => {
      expect(parseCommand('Hello')).toEqual({ command: null, args: '' });
      expect(parseCommand('What is this?')).toEqual({ command: null, args: '' });
    });
  });

  describe('executeCommand', () => {
    const mockContext: CommandContext = {
      userId: 'user-123',
      topicId: 'topic-123',
      sessionId: 'session-123',
    };

    describe('/hint command', () => {
      it('should require a session', async () => {
        const result = await executeCommand('/hint', { userId: 'user-123' });

        expect(result.success).toBe(false);
        expect(result.message).toContain('need to be in a learning session');
      });

      it('should check for max hints used', async () => {
        const { getSessionById } = await import('@/lib/db/sessions');
        (getSessionById as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'session-123',
          hintsUsed: 3,
          currentQuestionId: 'q-123',
        });

        const result = await executeCommand('/hint', mockContext);

        expect(result.success).toBe(false);
        expect(result.message).toContain("You've used all 3 hints");
      });

      it('should require an active question', async () => {
        const { getSessionById } = await import('@/lib/db/sessions');
        (getSessionById as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'session-123',
          hintsUsed: 0,
          currentQuestionId: null,
        });

        const result = await executeCommand('/hint', mockContext);

        expect(result.success).toBe(false);
        expect(result.message).toContain('No active question');
      });

      it('should return a hint when available', async () => {
        const { getSessionById } = await import('@/lib/db/sessions');
        const { prisma } = await import('@/lib/db/client');

        (getSessionById as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'session-123',
          hintsUsed: 0,
          currentQuestionId: 'q-123',
        });

        (prisma.question.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'q-123',
          hints: ['First hint', 'Second hint', 'Third hint'],
          concept: { id: 'c-123' },
        });

        (prisma.learningSession.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await executeCommand('/hint', mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Hint 1/3');
        expect(result.message).toContain('First hint');
      });
    });

    describe('/skip command', () => {
      it('should require a session', async () => {
        const result = await executeCommand('/skip', { userId: 'user-123' });

        expect(result.success).toBe(false);
        expect(result.message).toContain('need to be in a learning session');
      });

      it('should check for max skips used', async () => {
        const { getSessionById } = await import('@/lib/db/sessions');
        (getSessionById as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'session-123',
          skipsUsed: 3,
          skippedQuestionIds: ['q-1', 'q-2', 'q-3'],
          currentQuestionId: 'q-4',
        });

        const result = await executeCommand('/skip', mockContext);

        expect(result.success).toBe(false);
        expect(result.message).toContain('No skips remaining');
      });

      it('should skip question when valid', async () => {
        const { getSessionById } = await import('@/lib/db/sessions');
        const { prisma } = await import('@/lib/db/client');

        (getSessionById as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'session-123',
          skipsUsed: 1,
          skippedQuestionIds: ['q-1'],
          currentQuestionId: 'q-2',
        });

        (prisma.learningSession.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await executeCommand('/skip', mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('skipped');
        expect(result.data).toEqual({
          skipsUsed: 2,
          skipsRemaining: 1,
        });
      });
    });

    describe('/progress command', () => {
      it('should return progress data', async () => {
        const { getUserProgress, getTodayAnalytics } = await import('@/lib/db/progress');
        const { getTopicsByUser } = await import('@/lib/db/topics');
        const { countReviewsDue } = await import('@/lib/db/reviews');

        (getUserProgress as ReturnType<typeof vi.fn>).mockResolvedValue({
          currentLevel: 5,
          totalXP: 1250,
          currentStreak: 3,
          longestStreak: 7,
        });

        (getTodayAnalytics as ReturnType<typeof vi.fn>).mockResolvedValue({
          questionsAnswered: 10,
          questionsCorrect: 8,
          xpEarned: 50,
        });

        (getTopicsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([
          { id: 't-1', name: 'Rust', status: 'ACTIVE', masteryPercentage: 75, subtopics: [] },
          { id: 't-2', name: 'Go', status: 'COMPLETED', masteryPercentage: 95, subtopics: [] },
        ]);

        (countReviewsDue as ReturnType<typeof vi.fn>).mockResolvedValue(3);

        const result = await executeCommand('/progress', mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Level 5');
        expect(result.message).toContain('1250 XP');
        expect(result.message).toContain('Active: 1/3');
        expect(result.message).toContain('Completed: 1');
        expect(result.message).toContain('3 reviews due');
      });
    });

    describe('/topics command', () => {
      it('should list all topics grouped by status', async () => {
        const { getTopicsByUser } = await import('@/lib/db/topics');

        (getTopicsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([
          { id: 't-1', name: 'Rust', status: 'ACTIVE', masteryPercentage: 75, subtopics: [] },
          { id: 't-2', name: 'Go', status: 'COMPLETED', masteryPercentage: 95, subtopics: [] },
          { id: 't-3', name: 'Python', status: 'QUEUED', masteryPercentage: 0, subtopics: [] },
        ]);

        const result = await executeCommand('/topics', mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Active');
        expect(result.message).toContain('Rust');
        expect(result.message).toContain('Completed');
        expect(result.message).toContain('Go');
        expect(result.message).toContain('Queued');
        expect(result.message).toContain('Python');
      });

      it('should show message when no topics exist', async () => {
        const { getTopicsByUser } = await import('@/lib/db/topics');
        (getTopicsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        const result = await executeCommand('/topics', mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('No topics yet');
      });
    });

    describe('/review command', () => {
      it('should show message when no reviews due', async () => {
        const { countReviewsDue } = await import('@/lib/db/reviews');
        (countReviewsDue as ReturnType<typeof vi.fn>).mockResolvedValue(0);

        const result = await executeCommand('/review', mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('No reviews due');
      });

      it('should show review count and preview', async () => {
        const { countReviewsDue, getReviewsDue } = await import('@/lib/db/reviews');
        const { prisma } = await import('@/lib/db/client');

        (countReviewsDue as ReturnType<typeof vi.fn>).mockResolvedValue(5);
        (getReviewsDue as ReturnType<typeof vi.fn>).mockResolvedValue([
          { id: 'r-1', conceptId: 'c-1' },
          { id: 'r-2', conceptId: 'c-2' },
        ]);
        (prisma.concept.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
          name: 'Test Concept',
        });

        const result = await executeCommand('/review', mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('5 Reviews Due');
        expect(result.action).toBe('navigate');
        expect(result.navigateTo).toBe('/review');
      });
    });

    describe('/quiz command', () => {
      it('should prompt for quiz when no topic specified', async () => {
        const { getActiveTopics } = await import('@/lib/db/topics');
        (getActiveTopics as ReturnType<typeof vi.fn>).mockResolvedValue([
          { id: 't-1', name: 'Rust', masteryPercentage: 50 },
        ]);

        const result = await executeCommand('/quiz', { userId: 'user-123' });

        expect(result.success).toBe(true);
        expect(result.message).toContain('Quiz Time');
        expect(result.message).toContain('Rust');
      });

      it('should show error when no active topics', async () => {
        const { getActiveTopics } = await import('@/lib/db/topics');
        (getActiveTopics as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        const result = await executeCommand('/quiz', { userId: 'user-123' });

        expect(result.success).toBe(false);
        expect(result.message).toContain('No active topics');
      });
    });

    describe('/break command', () => {
      it('should save progress and show summary', async () => {
        const { getSessionById } = await import('@/lib/db/sessions');
        const { prisma } = await import('@/lib/db/client');

        (getSessionById as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'session-123',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        });

        (prisma.message.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
          { role: 'USER' },
          { role: 'USER' },
          { role: 'USER' },
        ]);

        (prisma.learningSession.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await executeCommand('/break', mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('/continue');
        expect(result.data).toHaveProperty('sessionDuration');
        expect(result.data).toHaveProperty('questionsAnswered');
      });
    });

    describe('/continue command', () => {
      it('should resume most recent session', async () => {
        const { getActiveSessionsByUser } = await import('@/lib/db/sessions');
        const { getTopicById } = await import('@/lib/db/topics');

        (getActiveSessionsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([
          { id: 'session-123', topicId: 'topic-123', currentSubtopicId: 'sub-1' },
        ]);

        (getTopicById as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'topic-123',
          name: 'Rust Programming',
          masteryPercentage: 65,
        });

        const result = await executeCommand('/continue', mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Resuming: Rust Programming');
        expect(result.message).toContain('65%');
        expect(result.action).toBe('navigate');
        expect(result.navigateTo).toContain('topic=topic-123');
      });

      it('should fall back to active topic when no session', async () => {
        const { getActiveSessionsByUser } = await import('@/lib/db/sessions');
        const { getActiveTopics } = await import('@/lib/db/topics');

        (getActiveSessionsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (getActiveTopics as ReturnType<typeof vi.fn>).mockResolvedValue([
          { id: 't-1', name: 'Go Basics', masteryPercentage: 30 },
        ]);

        const result = await executeCommand('/continue', mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Go Basics');
        expect(result.action).toBe('navigate');
      });

      it('should show message when nothing to continue', async () => {
        const { getActiveSessionsByUser } = await import('@/lib/db/sessions');
        const { getActiveTopics } = await import('@/lib/db/topics');

        (getActiveSessionsByUser as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (getActiveTopics as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        const result = await executeCommand('/continue', mockContext);

        expect(result.success).toBe(false);
        expect(result.message).toContain('No active topics');
        expect(result.navigateTo).toBe('/topics');
      });
    });
  });

  describe('SUPPORTED_COMMANDS', () => {
    it('should contain all expected commands', () => {
      expect(SUPPORTED_COMMANDS).toContain('/hint');
      expect(SUPPORTED_COMMANDS).toContain('/skip');
      expect(SUPPORTED_COMMANDS).toContain('/progress');
      expect(SUPPORTED_COMMANDS).toContain('/topics');
      expect(SUPPORTED_COMMANDS).toContain('/review');
      expect(SUPPORTED_COMMANDS).toContain('/quiz');
      expect(SUPPORTED_COMMANDS).toContain('/break');
      expect(SUPPORTED_COMMANDS).toContain('/continue');
    });

    it('should have 8 commands total', () => {
      expect(SUPPORTED_COMMANDS.length).toBe(8);
    });
  });
});
