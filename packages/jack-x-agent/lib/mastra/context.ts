/**
 * Context building utilities for agent prompts
 */

import type { IdeaContext, OutlineContext, TrendingTopic, ContentIdea } from './schemas';

interface UserWithRelations {
  id: string;
  projects?: Array<{ name: string; description?: string | null; status: string }>;
  creators?: Array<{ xHandle: string; isActive: boolean }>;
  toneConfig?: {
    lowercase: boolean;
    noEmojis: boolean;
    noHashtags: boolean;
    showFailures: boolean;
    includeNumbers: boolean;
    learnedPatterns: Record<string, unknown>;
  } | null;
}

interface GoodPost {
  content: string;
  contentPillar: string;
  contentType: string;
  markedGoodAt: Date | null;
}

/**
 * Build context for idea generation
 */
export async function buildIdeaContext(
  user: UserWithRelations,
  trendingTopics: TrendingTopic[],
  goodPosts: GoodPost[] = []
): Promise<IdeaContext> {
  const projects = (user.projects || []).map((p) => ({
    name: p.name,
    description: p.description || '',
    status: p.status,
  }));

  const toneConfig = user.toneConfig || {
    lowercase: true,
    noEmojis: true,
    noHashtags: true,
    showFailures: true,
    includeNumbers: true,
    learnedPatterns: {},
  };

  return {
    topics: trendingTopics,
    projects,
    tone: toneConfig,
    goodPosts: goodPosts.map((p) => ({
      content: p.content,
      pillar: p.contentPillar,
      type: p.contentType,
    })),
  };
}

/**
 * Build context for outline generation
 */
export async function buildOutlineContext(
  idea: ContentIdea,
  user: UserWithRelations,
  goodPosts: GoodPost[] = []
): Promise<OutlineContext> {
  const toneConfig = user.toneConfig || {
    lowercase: true,
    noEmojis: true,
    noHashtags: true,
    showFailures: true,
    includeNumbers: true,
    learnedPatterns: {},
  };

  return {
    idea,
    tone: toneConfig,
    goodPosts: goodPosts.map((p) => ({
      content: p.content,
      pillar: p.contentPillar,
      type: p.contentType,
    })),
  };
}

/**
 * Format context for prompt injection
 */
export function formatContextForPrompt(context: IdeaContext | OutlineContext): Record<string, string> {
  if ('topics' in context) {
    // IdeaContext
    return {
      topics: context.topics.map((t) => `${t.name} (${t.mentions} mentions)`).join(', '),
      projects: context.projects.map((p) => `${p.name}: ${p.description}`).join('\n'),
      toneConfig: JSON.stringify(context.tone, null, 2),
      learnedPatterns: JSON.stringify(context.tone.learnedPatterns, null, 2),
      goodPosts: context.goodPosts.map((p) => `[${p.pillar}] ${p.content.substring(0, 100)}...`).join('\n\n'),
      recentIdeas: '', // Will be populated from DB
    };
  } else {
    // OutlineContext
    return {
      idea: JSON.stringify(context.idea, null, 2),
      format: context.idea.suggestedFormat,
      toneConfig: JSON.stringify(context.tone, null, 2),
      learnedPatterns: JSON.stringify(context.tone.learnedPatterns, null, 2),
      goodPosts: context.goodPosts.map((p) => `[${p.pillar}] ${p.content.substring(0, 100)}...`).join('\n\n'),
      avgPostLength: String(context.tone.learnedPatterns?.avgPostLength || 180),
    };
  }
}
