import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as submitAnswer } from '@/app/api/questions/answer/route';
import { POST as getHint } from '@/app/api/questions/hint/route';

function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/questions/answer', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('questions API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/questions/answer', () => {
    it('should evaluate answer and return result', async () => {
      const request = createMockRequest({
        questionId: 'q-123',
        answer: 'Ownership means the value has a single owner...',
        sessionId: 'session-123',
      });
      await expect(submitAnswer(request)).rejects.toThrow('Not implemented');
    });

    it('should handle correct answer', async () => {
      const request = createMockRequest({
        questionId: 'q-123',
        answer: 'Correct detailed answer...',
        sessionId: 'session-123',
      });
      await expect(submitAnswer(request)).rejects.toThrow('Not implemented');
    });

    it('should handle incorrect answer', async () => {
      const request = createMockRequest({
        questionId: 'q-123',
        answer: 'Wrong answer',
        sessionId: 'session-123',
      });
      await expect(submitAnswer(request)).rejects.toThrow('Not implemented');
    });

    it('should reject gibberish answers', async () => {
      const request = createMockRequest({
        questionId: 'q-123',
        answer: 'asdfghjkl',
        sessionId: 'session-123',
      });
      await expect(submitAnswer(request)).rejects.toThrow('Not implemented');
    });
  });

  describe('POST /api/questions/hint', () => {
    it('should return hint level 1', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/questions/hint',
        {
          method: 'POST',
          body: JSON.stringify({
            questionId: 'q-123',
            hintLevel: 1,
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(getHint(request)).rejects.toThrow('Not implemented');
    });

    it('should return hint level 2', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/questions/hint',
        {
          method: 'POST',
          body: JSON.stringify({
            questionId: 'q-123',
            hintLevel: 2,
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(getHint(request)).rejects.toThrow('Not implemented');
    });

    it('should return hint level 3', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/questions/hint',
        {
          method: 'POST',
          body: JSON.stringify({
            questionId: 'q-123',
            hintLevel: 3,
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(getHint(request)).rejects.toThrow('Not implemented');
    });

    it('should not return hints beyond level 3', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/questions/hint',
        {
          method: 'POST',
          body: JSON.stringify({
            questionId: 'q-123',
            hintLevel: 4,
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(getHint(request)).rejects.toThrow('Not implemented');
    });
  });
});
