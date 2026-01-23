import type { NormalizedSession, EnrichmentResult, MemoryWritePayload } from '../types.js';

export const buildMemoryPayload = (
  session: NormalizedSession,
  result: EnrichmentResult
): MemoryWritePayload => {
  const date = session.startTime.split('T')[0];

  return {
    path: `/worklog/${date}/${session.id}`,
    title: result.context.title,
    content: result.context.content,
    tags: ['worklog', session.project, ...result.context.topics],
    metadata: {
      source: 'claude-code',
      sessionId: session.id,
      project: session.project,
      date,
      public: result.isSignificant,
      summary: result.entry?.summary || null,
      decision: result.entry?.decision || null,
      problem: result.entry?.problem || null,
      entryTags: result.entry?.tags || [],
      links: result.entry?.links || null,
    },
  };
};

export const publishToMemory = async (
  payload: MemoryWritePayload,
  memoryUrl: string,
  apiKey: string
): Promise<void> => {
  const response = await fetch(`${memoryUrl}/api/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: payload.path,
      title: payload.title,
      content: payload.content,
      tags: payload.tags,
      metadata: payload.metadata,
      source: 'worklog-cli',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Memory write failed (${response.status}): ${error}`);
  }
};
