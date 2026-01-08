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
