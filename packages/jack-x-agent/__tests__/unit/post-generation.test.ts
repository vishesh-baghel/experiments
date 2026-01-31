/**
 * Unit tests for Post Generation feature
 * Tests context building, schemas, prompts, and API route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies before imports
vi.mock('@/lib/db/client');
vi.mock('@/lib/db/creator-tweets', () => ({
  getAllCreatorTweets: vi.fn(() => Promise.resolve([])),
}));
vi.mock('@/lib/observability/langfuse', () => ({
  createIdeaTrace: vi.fn(() => ({
    span: vi.fn(() => ({ end: vi.fn() })),
    update: vi.fn(),
  })),
  createOutlineTrace: vi.fn(() => ({
    span: vi.fn(() => ({ end: vi.fn() })),
    update: vi.fn(),
  })),
  createPostGenerationTrace: vi.fn(() => ({
    span: vi.fn(() => ({ end: vi.fn() })),
    update: vi.fn(),
  })),
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => ({
    modelId: 'gpt-4o',
    provider: 'openai',
  })),
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUserId: vi.fn(),
  blockGuestWrite: vi.fn(),
  getDataUserId: vi.fn(),
  isGuestUser: vi.fn(),
}));

vi.mock('@/lib/db/users', () => ({
  getUserWithRelations: vi.fn(),
}));

vi.mock('@/lib/db/posts', () => ({
  getGoodPostsForLearning: vi.fn(),
}));

vi.mock('@/lib/db/outlines', () => ({
  getOutlineById: vi.fn(),
}));

vi.mock('@/lib/mastra/agent', () => ({
  generatePost: vi.fn(),
}));

vi.mock('@/lib/mastra/context', () => ({
  buildPostContext: vi.fn(),
}));

import { blockGuestWrite } from '@/lib/auth';
import { getUserWithRelations } from '@/lib/db/users';
import { getGoodPostsForLearning } from '@/lib/db/posts';
import { getOutlineById } from '@/lib/db/outlines';
import { generatePost } from '@/lib/mastra/agent';
import { buildPostContext } from '@/lib/mastra/context';

const createMockRequest = (body: object) => {
  return {
    method: 'POST',
    url: 'http://localhost:3000/api/posts/generate',
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
};

describe('Post Generation Schemas', () => {
  it('should validate GeneratedPostVariationSchema', async () => {
    const { GeneratedPostVariationSchema } = await import('@/lib/mastra/schemas');

    const valid = { content: 'some post content', tone: 'direct and punchy' };
    expect(() => GeneratedPostVariationSchema.parse(valid)).not.toThrow();
  });

  it('should reject empty content in GeneratedPostVariationSchema', async () => {
    const { GeneratedPostVariationSchema } = await import('@/lib/mastra/schemas');

    const invalid = { content: '', tone: 'some tone' };
    expect(() => GeneratedPostVariationSchema.parse(invalid)).toThrow();
  });

  it('should validate GeneratedPostSchema with 2-3 variations', async () => {
    const { GeneratedPostSchema } = await import('@/lib/mastra/schemas');

    const valid = {
      variations: [
        { content: 'variation 1 content', tone: 'direct' },
        { content: 'variation 2 content', tone: 'story-driven' },
      ],
    };
    expect(() => GeneratedPostSchema.parse(valid)).not.toThrow();
  });

  it('should reject GeneratedPostSchema with less than 2 variations', async () => {
    const { GeneratedPostSchema } = await import('@/lib/mastra/schemas');

    const invalid = {
      variations: [{ content: 'only one', tone: 'direct' }],
    };
    expect(() => GeneratedPostSchema.parse(invalid)).toThrow();
  });

  it('should reject GeneratedPostSchema with more than 3 variations', async () => {
    const { GeneratedPostSchema } = await import('@/lib/mastra/schemas');

    const invalid = {
      variations: [
        { content: 'v1', tone: 't1' },
        { content: 'v2', tone: 't2' },
        { content: 'v3', tone: 't3' },
        { content: 'v4', tone: 't4' },
      ],
    };
    expect(() => GeneratedPostSchema.parse(invalid)).toThrow();
  });

  it('should validate PostContextSchema', async () => {
    const { PostContextSchema } = await import('@/lib/mastra/schemas');

    const valid = {
      outline: {
        format: 'post',
        sections: [{
          heading: 'the hook',
          keyPoints: ['point 1', 'point 2', 'point 3'],
          toneGuidance: 'punchy',
          examples: ['example 1'],
        }],
        estimatedLength: '280',
        toneReminders: ['lowercase only'],
      },
      idea: {
        title: 'test idea',
        description: 'test description',
        contentPillar: 'engineering',
      },
      projects: [],
      goodPosts: [],
      tone: {
        lowercase: true,
        noEmojis: true,
        noHashtags: true,
        showFailures: true,
        includeNumbers: true,
        customRules: [],
        learnedPatterns: {},
      },
    };
    expect(() => PostContextSchema.parse(valid)).not.toThrow();
  });
});

describe('Post Generation Prompt', () => {
  it('should have post generation prompt', async () => {
    const { POST_GENERATION_PROMPT } = await import('@/lib/mastra/prompts');

    expect(POST_GENERATION_PROMPT).toBeDefined();
    expect(typeof POST_GENERATION_PROMPT).toBe('string');
    expect(POST_GENERATION_PROMPT).toContain('variations');
    expect(POST_GENERATION_PROMPT).toContain('outline');
    expect(POST_GENERATION_PROMPT).toContain('GeneratedPost');
  });

  it('should mention format handling for posts, threads, and long_form', async () => {
    const { POST_GENERATION_PROMPT } = await import('@/lib/mastra/prompts');

    expect(POST_GENERATION_PROMPT).toContain('post');
    expect(POST_GENERATION_PROMPT).toContain('thread');
    expect(POST_GENERATION_PROMPT).toContain('long_form');
  });

  it('should mention tone config enforcement', async () => {
    const { POST_GENERATION_PROMPT } = await import('@/lib/mastra/prompts');

    expect(POST_GENERATION_PROMPT).toContain('tone');
    expect(POST_GENERATION_PROMPT).toContain('lowercase');
  });
});

describe('Post Generation Context Building', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build context with outline and user data', async () => {
    // Import the real buildPostContext (not mocked for this test)
    vi.doUnmock('@/lib/mastra/context');
    const { buildPostContext: realBuildPostContext } = await import('@/lib/mastra/context');

    const mockOutline = {
      format: 'thread',
      sections: [{
        heading: 'the hook',
        keyPoints: ['point 1', 'point 2', 'point 3'],
        toneGuidance: 'punchy opening',
        examples: ['example 1'],
      }],
      estimatedLength: '1200',
      toneReminders: ['lowercase only', 'no emojis'],
    };

    const mockIdea = {
      title: 'building in public',
      description: 'sharing the journey of building a SaaS product',
      contentPillar: 'build_progress',
    };

    const mockUser = {
      id: 'u1',
      projects: [{ name: 'Jack', description: 'X agent', status: 'active' }],
      toneConfig: {
        lowercase: true,
        noEmojis: true,
        noHashtags: true,
        showFailures: true,
        includeNumbers: true,
        learnedPatterns: { avgPostLength: 200 },
      },
    };

    const context = await realBuildPostContext(mockOutline, mockIdea, mockUser, []);

    expect(context.outline.format).toBe('thread');
    expect(context.outline.sections).toHaveLength(1);
    expect(context.idea.title).toBe('building in public');
    expect(context.tone.lowercase).toBe(true);
    expect(context.projects).toHaveLength(1);
    expect(context.goodPosts).toEqual([]);

    // Re-mock for other tests
    vi.doMock('@/lib/mastra/context', () => ({
      buildPostContext: vi.fn(),
    }));
  });
});

describe('POST /api/posts/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(blockGuestWrite).mockResolvedValue(null);
  });

  it('should generate post variations successfully', async () => {
    const mockUser = { id: 'user-123', toneConfig: { lowercase: true } };
    const mockOutline = {
      id: 'outline-123',
      format: 'post',
      sections: [{ heading: 'hook', keyPoints: ['p1', 'p2', 'p3'], toneGuidance: 'punchy', examples: ['ex1'] }],
      estimatedLength: '280',
      toneReminders: ['lowercase'],
      contentIdea: {
        title: 'test idea',
        description: 'test description',
        contentPillar: 'engineering',
      },
    };
    const mockContext = { outline: mockOutline, idea: mockOutline.contentIdea, tone: {}, projects: [], goodPosts: [] };
    const mockVariations = {
      variations: [
        { content: 'variation 1', tone: 'direct' },
        { content: 'variation 2', tone: 'story-driven' },
      ],
    };

    vi.mocked(getUserWithRelations).mockResolvedValue(mockUser as never);
    vi.mocked(getOutlineById).mockResolvedValue(mockOutline as never);
    vi.mocked(getGoodPostsForLearning).mockResolvedValue([] as never);
    vi.mocked(buildPostContext).mockResolvedValue(mockContext as never);
    vi.mocked(generatePost).mockResolvedValue(mockVariations as never);

    const { POST } = await import('@/app/api/posts/generate/route');
    const request = createMockRequest({ userId: 'user-123', outlineId: 'outline-123' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.variations).toHaveLength(2);
    expect(data.variations[0].content).toBe('variation 1');
    expect(data.variations[1].tone).toBe('story-driven');
  });

  it('should return 404 if user not found', async () => {
    vi.mocked(getUserWithRelations).mockResolvedValue(null as never);
    vi.mocked(getOutlineById).mockResolvedValue({ id: 'o1', contentIdea: {} } as never);
    vi.mocked(getGoodPostsForLearning).mockResolvedValue([] as never);

    const { POST } = await import('@/app/api/posts/generate/route');
    const request = createMockRequest({ userId: 'nonexistent', outlineId: 'outline-123' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 404 if outline not found', async () => {
    vi.mocked(getUserWithRelations).mockResolvedValue({ id: 'user-123' } as never);
    vi.mocked(getOutlineById).mockResolvedValue(null as never);
    vi.mocked(getGoodPostsForLearning).mockResolvedValue([] as never);

    const { POST } = await import('@/app/api/posts/generate/route');
    const request = createMockRequest({ userId: 'user-123', outlineId: 'nonexistent' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Outline not found');
  });

  it('should return 400 for invalid request body', async () => {
    const { POST } = await import('@/app/api/posts/generate/route');
    const request = createMockRequest({ invalid: 'data' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should block guest write operations', async () => {
    vi.mocked(blockGuestWrite).mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'Write operations are not allowed in guest mode' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const { POST } = await import('@/app/api/posts/generate/route');
    const request = createMockRequest({ userId: 'guest-123', outlineId: 'outline-123' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('guest mode');
  });
});
