/**
 * End-to-End API Tests
 *
 * These tests make REAL HTTP calls to the running dev server.
 * They test actual user flows including LLM calls for topic creation.
 *
 * Run with: pnpm test:e2e
 *
 * Prerequisites:
 * - Dev server must be running on localhost:3000
 * - Database must be accessible
 * - API keys must be set (ANTHROPIC_API_KEY or AI_GATEWAY_API_KEY)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Store cookies for authenticated requests
let sessionCookie: string | null = null;
let testTopicId: string | null = null;
let serverAvailable = true;

// Helper to make authenticated requests
async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (sessionCookie) {
    (headers as Record<string, string>)['Cookie'] = sessionCookie;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Capture session cookie from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }

  return response;
}

// Check if server is running
async function isServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/setup`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

describe('E2E API Flows', () => {
  const TEST_TIMEOUT = 120000; // 2 minutes for LLM calls

  beforeAll(async () => {
    serverAvailable = await isServerRunning();
    if (!serverAvailable) {
      console.warn('⚠️  Dev server not running on', BASE_URL);
      console.warn('   Start it with: pnpm dev');
      console.warn('   Skipping E2E tests...');
    }
  }, 10000);

  beforeEach(async ({ skip }) => {
    if (!serverAvailable) {
      skip();
    }
  });

  describe('Authentication Flow', () => {
    it('should check if owner exists', async () => {
      const response = await apiRequest('/api/auth/setup');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(typeof data.ownerExists).toBe('boolean');
    });

    it('should login as visitor', async () => {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ mode: 'visitor' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe('visitor');
      expect(sessionCookie).toBeTruthy();

      console.log('✅ Logged in as visitor:', data.user.id);
    });

    it('should get current session', async () => {
      const response = await apiRequest('/api/auth/session');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.authenticated).toBe(true);
      expect(data.session).toBeDefined();
    });
  });

  describe('Topics Flow', () => {
    it('should list topics (empty for new user)', async () => {
      const response = await apiRequest('/api/topics');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.topics)).toBe(true);

      console.log('📋 Current topics count:', data.topics.length);
    });

    it('should create a topic with auto-generated subtopics', async () => {
      const response = await apiRequest('/api/topics', {
        method: 'POST',
        body: JSON.stringify({
          name: 'TypeScript Basics',
          goal: 'Learn type safety for web development',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.topic).toBeDefined();
      expect(data.topic.id).toBeDefined();
      expect(data.topic.name).toBe('TypeScript Basics');
      expect(data.topic.subtopics).toBeDefined();
      expect(Array.isArray(data.topic.subtopics)).toBe(true);
      expect(data.topic.subtopics.length).toBeGreaterThan(0);

      testTopicId = data.topic.id;

      console.log('✅ Created topic:', data.topic.name);
      console.log('   Subtopics generated:', data.topic.subtopics.length);
      console.log('   Subtopics:', data.topic.subtopics.map((s: { name: string }) => s.name).join(', '));
    }, TEST_TIMEOUT);

    it('should get a single topic with subtopics', async () => {
      if (!testTopicId) {
        console.warn('Skipping - no test topic created');
        return;
      }

      const response = await apiRequest(`/api/topics/${testTopicId}`);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.topic).toBeDefined();
      expect(data.topic.id).toBe(testTopicId);
      expect(data.topic.subtopics).toBeDefined();

      console.log('✅ Fetched topic details');
    });

    it('should update topic status to COMPLETED', async () => {
      if (!testTopicId) {
        console.warn('Skipping - no test topic created');
        return;
      }

      const response = await apiRequest(`/api/topics/${testTopicId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.topic).toBeDefined();
      expect(data.topic.status).toBe('COMPLETED');

      console.log('✅ Marked topic as COMPLETED');
    });

    it('should archive a topic', async () => {
      if (!testTopicId) {
        console.warn('Skipping - no test topic created');
        return;
      }

      const response = await apiRequest(`/api/topics/${testTopicId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.topic).toBeDefined();
      expect(data.topic.status).toBe('ARCHIVED');

      console.log('✅ Archived topic');
    });

    it('should filter topics by status', async () => {
      const response = await apiRequest('/api/topics?status=ARCHIVED');

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.topics)).toBe(true);
      data.topics.forEach((topic: { status: string }) => {
        expect(topic.status).toBe('ARCHIVED');
      });

      console.log('✅ Filtered topics by ARCHIVED status:', data.topics.length);
    });
  });

  describe('Topic Creation with LLM', () => {
    let newTopicId: string | null = null;

    it('should create a technical topic with proper domain detection', async () => {
      const response = await apiRequest('/api/topics', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Rust Programming',
          goal: 'Build CLI tools',
        }),
      });

      // Could be 201 (created) or 403 (limit reached for visitor)
      if (response.status === 403) {
        console.log('⚠️  Topic limit reached for visitor (expected)');
        return;
      }

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.topic.subtopics.length).toBeGreaterThanOrEqual(3);
      expect(data.topic.subtopics.length).toBeLessThanOrEqual(12);

      newTopicId = data.topic.id;

      console.log('✅ Created technical topic with', data.topic.subtopics.length, 'subtopics');
    }, TEST_TIMEOUT);

    afterAll(async () => {
      // Cleanup: archive the test topic
      if (newTopicId) {
        await apiRequest(`/api/topics/${newTopicId}`, { method: 'DELETE' });
        console.log('🧹 Cleaned up test topic');
      }
    });
  });

  describe('Error Handling', () => {
    it('should reject empty topic name', async () => {
      const response = await apiRequest('/api/topics', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 404 for non-existent topic', async () => {
      const response = await apiRequest('/api/topics/non-existent-id');

      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated request', async () => {
      // Clear session cookie
      const oldCookie = sessionCookie;
      sessionCookie = null;

      const response = await fetch(`${BASE_URL}/api/topics`);

      expect(response.status).toBe(401);

      // Restore session
      sessionCookie = oldCookie;
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully', async () => {
      const response = await apiRequest('/api/auth/logout', {
        method: 'POST',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      console.log('✅ Logged out successfully');
    });

    it('should not access protected routes after logout', async () => {
      // Session cookie should be invalidated
      const response = await apiRequest('/api/topics');

      expect(response.status).toBe(401);
    });
  });
});

describe('Topic Start Flow', () => {
  const TEST_TIMEOUT = 120000;
  let topicId: string | null = null;

  beforeAll(async () => {
    // Login as visitor
    await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mode: 'visitor' }),
    });
  });

  it('should create and start a topic', async () => {
    // Create topic
    const createResponse = await apiRequest('/api/topics', {
      method: 'POST',
      body: JSON.stringify({
        name: 'JavaScript Closures',
        goal: 'Understand closures deeply',
      }),
    });

    if (createResponse.status === 403) {
      console.log('⚠️  Topic limit reached, skipping start test');
      return;
    }

    expect(createResponse.status).toBe(201);
    const createData = await createResponse.json();
    topicId = createData.topic.id;

    // Start the topic
    const startResponse = await apiRequest(`/api/topics/${topicId}/start`, {
      method: 'POST',
    });

    expect(startResponse.status).toBe(200);
    const startData = await startResponse.json();

    expect(startData.success).toBe(true);
    expect(startData.session).toBeDefined();
    expect(startData.teaching).toBeDefined();

    console.log('✅ Started learning session');
    console.log('   First concept introduction:', startData.teaching?.introduction?.substring(0, 100) + '...');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (topicId) {
      await apiRequest(`/api/topics/${topicId}`, { method: 'DELETE' });
    }
    await apiRequest('/api/auth/logout', { method: 'POST' });
  });
});

describe('Complete Learning Flow', () => {
  const TEST_TIMEOUT = 180000; // 3 minutes for LLM calls
  let topicId: string | null = null;
  let sessionId: string | null = null;

  beforeAll(async () => {
    serverAvailable = await isServerRunning();
    if (!serverAvailable) {
      return;
    }
    // Login as visitor
    await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mode: 'visitor' }),
    });
  });

  beforeEach(async ({ skip }) => {
    if (!serverAvailable) {
      skip();
    }
  });

  it('should complete a full learning cycle: create topic -> start -> chat -> get progress', async () => {
    // Step 1: Create topic
    const createResponse = await apiRequest('/api/topics', {
      method: 'POST',
      body: JSON.stringify({
        name: 'React Hooks',
        goal: 'Learn useState and useEffect',
      }),
    });

    if (createResponse.status === 403) {
      console.log('⚠️  Topic limit reached, skipping learning flow test');
      return;
    }

    expect(createResponse.status).toBe(201);
    const createData = await createResponse.json();
    topicId = createData.topic.id;
    expect(createData.topic.subtopics.length).toBeGreaterThan(0);

    console.log('✅ Step 1: Created topic with', createData.topic.subtopics.length, 'subtopics');

    // Step 2: Start learning session
    const startResponse = await apiRequest(`/api/topics/${topicId}/start`, {
      method: 'POST',
    });

    expect(startResponse.status).toBe(200);
    const startData = await startResponse.json();
    sessionId = startData.session?.id;
    expect(startData.success).toBe(true);
    expect(startData.teaching).toBeDefined();

    console.log('✅ Step 2: Started learning session');

    // Step 3: Send a chat message about the topic
    const chatResponse = await apiRequest('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Can you explain what useState does in React?' }
        ],
        topicId,
      }),
    });

    expect(chatResponse.status).toBe(200);
    // Response is a stream, just verify it's valid
    const contentType = chatResponse.headers.get('content-type');
    expect(contentType).toBeTruthy();

    console.log('✅ Step 3: Sent chat message and received streamed response');

    // Step 4: Get progress
    const progressResponse = await apiRequest(`/api/progress?topicId=${topicId}`);

    expect(progressResponse.status).toBe(200);
    const progressData = await progressResponse.json();
    expect(progressData.progress).toBeDefined();

    console.log('✅ Step 4: Retrieved progress');
    console.log('   Topic mastery:', progressData.progress.topicMastery + '%');

  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (topicId) {
      await apiRequest(`/api/topics/${topicId}`, { method: 'DELETE' });
      console.log('🧹 Cleaned up test topic');
    }
    await apiRequest('/api/auth/logout', { method: 'POST' });
  });
});

describe('Review Session Flow', () => {
  const TEST_TIMEOUT = 120000;

  beforeAll(async () => {
    serverAvailable = await isServerRunning();
    if (!serverAvailable) {
      return;
    }
    // Login as visitor
    await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mode: 'visitor' }),
    });
  });

  beforeEach(async ({ skip }) => {
    if (!serverAvailable) {
      skip();
    }
  });

  it('should get due reviews (may be empty for new user)', async () => {
    const response = await apiRequest('/api/review/due');

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.reviews).toBeDefined();
    expect(Array.isArray(data.reviews)).toBe(true);

    console.log('✅ Retrieved due reviews:', data.reviews.length);
  });

  it('should handle starting a review session', async () => {
    // First check if there are reviews due
    const dueResponse = await apiRequest('/api/review/due');
    const dueData = await dueResponse.json();

    if (dueData.reviews.length === 0) {
      console.log('⚠️  No reviews due, skipping start review test');
      return;
    }

    const response = await apiRequest('/api/review/start', {
      method: 'POST',
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.review).toBeDefined();

    console.log('✅ Started review session');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  });
});

describe('Topic Limits Enforcement E2E', () => {
  const TEST_TIMEOUT = 180000;
  const createdTopicIds: string[] = [];

  beforeAll(async () => {
    serverAvailable = await isServerRunning();
    if (!serverAvailable) {
      return;
    }
    // Login as visitor (1 active topic limit)
    await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mode: 'visitor' }),
    });
  });

  beforeEach(async ({ skip }) => {
    if (!serverAvailable) {
      skip();
    }
  });

  it('should enforce topic limits for visitor (1 active max)', async () => {
    // Create first topic - should succeed
    const firstResponse = await apiRequest('/api/topics', {
      method: 'POST',
      body: JSON.stringify({
        name: 'First Topic',
        goal: 'Test topic limits',
      }),
    });

    if (firstResponse.status === 403) {
      console.log('⚠️  User already has active topics, skipping limit test');
      return;
    }

    expect(firstResponse.status).toBe(201);
    const firstData = await firstResponse.json();
    createdTopicIds.push(firstData.topic.id);

    console.log('✅ Created first topic (ACTIVE)');

    // Create second topic - should be QUEUED for visitor
    const secondResponse = await apiRequest('/api/topics', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Second Topic',
        goal: 'Should be queued',
      }),
    });

    // Visitor max is 1, so this should either be queued (201) or rejected (403)
    expect([201, 403]).toContain(secondResponse.status);

    if (secondResponse.status === 201) {
      const secondData = await secondResponse.json();
      createdTopicIds.push(secondData.topic.id);

      // For visitor, second topic should be QUEUED
      expect(secondData.topic.status).toBe('QUEUED');
      console.log('✅ Second topic created as QUEUED');
    } else {
      console.log('✅ Second topic rejected (topic limit reached)');
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup all created topics
    for (const topicId of createdTopicIds) {
      await apiRequest(`/api/topics/${topicId}`, { method: 'DELETE' });
    }
    if (createdTopicIds.length > 0) {
      console.log('🧹 Cleaned up', createdTopicIds.length, 'test topics');
    }
    await apiRequest('/api/auth/logout', { method: 'POST' });
  });
});
