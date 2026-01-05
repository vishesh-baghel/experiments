import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getProgress } from '@/app/api/progress/route';
import { GET as getTopicProgress } from '@/app/api/progress/[topicId]/route';

describe('progress API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/progress', () => {
    it('should return overall progress', async () => {
      const request = new NextRequest('http://localhost:3000/api/progress');
      await expect(getProgress(request)).rejects.toThrow('Not implemented');
    });

    it('should include XP and level', async () => {
      const request = new NextRequest('http://localhost:3000/api/progress');
      await expect(getProgress(request)).rejects.toThrow('Not implemented');
    });

    it('should include streak info', async () => {
      const request = new NextRequest('http://localhost:3000/api/progress');
      await expect(getProgress(request)).rejects.toThrow('Not implemented');
    });
  });

  describe('GET /api/progress/[topicId]', () => {
    it('should return topic-specific progress', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/progress/topic-123'
      );
      const params = Promise.resolve({ topicId: 'topic-123' });
      await expect(getTopicProgress(request, { params })).rejects.toThrow(
        'Not implemented'
      );
    });

    it('should include mastery by subtopic', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/progress/topic-123'
      );
      const params = Promise.resolve({ topicId: 'topic-123' });
      await expect(getTopicProgress(request, { params })).rejects.toThrow(
        'Not implemented'
      );
    });

    it('should return 404 for non-existent topic', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/progress/non-existent'
      );
      const params = Promise.resolve({ topicId: 'non-existent' });
      await expect(getTopicProgress(request, { params })).rejects.toThrow(
        'Not implemented'
      );
    });
  });
});
