import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getDueReviews } from '@/app/api/review/due/route';
import { POST as startReview } from '@/app/api/review/start/route';
import { POST as recordReview } from '@/app/api/review/record/route';

describe('review API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/review/due', () => {
    it('should return due reviews', async () => {
      const request = new NextRequest('http://localhost:3000/api/review/due');
      await expect(getDueReviews(request)).rejects.toThrow('Not implemented');
    });

    it('should limit reviews to 20', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/review/due?limit=20'
      );
      await expect(getDueReviews(request)).rejects.toThrow('Not implemented');
    });

    it('should order by oldest due first', async () => {
      const request = new NextRequest('http://localhost:3000/api/review/due');
      await expect(getDueReviews(request)).rejects.toThrow('Not implemented');
    });
  });

  describe('POST /api/review/start', () => {
    it('should start review session', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/review/start',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(startReview(request)).rejects.toThrow('Not implemented');
    });

    it('should return first review item', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/review/start',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(startReview(request)).rejects.toThrow('Not implemented');
    });
  });

  describe('POST /api/review/record', () => {
    it('should record rating 1 (Again)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/review/record',
        {
          method: 'POST',
          body: JSON.stringify({ reviewId: 'review-123', rating: 1 }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(recordReview(request)).rejects.toThrow('Not implemented');
    });

    it('should record rating 2 (Hard)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/review/record',
        {
          method: 'POST',
          body: JSON.stringify({ reviewId: 'review-123', rating: 2 }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(recordReview(request)).rejects.toThrow('Not implemented');
    });

    it('should record rating 3 (Good)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/review/record',
        {
          method: 'POST',
          body: JSON.stringify({ reviewId: 'review-123', rating: 3 }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(recordReview(request)).rejects.toThrow('Not implemented');
    });

    it('should record rating 4 (Easy)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/review/record',
        {
          method: 'POST',
          body: JSON.stringify({ reviewId: 'review-123', rating: 4 }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(recordReview(request)).rejects.toThrow('Not implemented');
    });

    it('should return next review date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/review/record',
        {
          method: 'POST',
          body: JSON.stringify({ reviewId: 'review-123', rating: 3 }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await expect(recordReview(request)).rejects.toThrow('Not implemented');
    });
  });
});
