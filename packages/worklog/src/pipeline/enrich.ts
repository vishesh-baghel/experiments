import { generateText, createGateway } from 'ai';
import type { NormalizedSession, EnrichmentResult, PublicEntry, ContextDocument } from '../types.js';

const SYSTEM_PROMPT = `You are a worklog processor. You analyze coding session transcripts and produce two outputs:

1. A PUBLIC ENTRY (if the session is significant enough) — a concise summary showcasing engineering skill
2. A CONTEXT DOCUMENT — structured notes capturing the full session context

SIGNIFICANCE CRITERIA (skip public entry if none apply):
- Architectural decisions were made
- A non-trivial feature was implemented
- A meaningful bug was solved
- A design trade-off was evaluated
- Something novel was learned or applied

SKIP public entry if:
- Session has fewer than 3 meaningful actions
- Only trivial work: typo fixes, formatting, single-line changes
- Session was purely exploratory with no concrete outcome
- Session was abandoned or very short

PRIVACY: If any turn mentions proprietary work concepts, internal tools, or company-specific systems that aren't clearly part of a personal open-source project, exclude those turns from your analysis entirely.

Respond with valid JSON only.`;

const buildPrompt = (session: NormalizedSession): string => {
  const turnsSummary = session.turns
    .map(t => `[${t.role}]: ${t.content.slice(0, 500)}`)
    .join('\n\n');

  return `Analyze this coding session and produce the outputs.

PROJECT: ${session.project}
BRANCH: ${session.gitBranch}
SESSION SUMMARY: ${session.summary}
DURATION: ${session.startTime} to ${session.endTime}

CONVERSATION:
${turnsSummary}

Respond with this exact JSON structure:
{
  "isSignificant": true/false,
  "entry": {
    "summary": "What was done (max 120 chars, 1 sentence)",
    "decision": "Engineering reasoning and trade-offs (2-4 sentences, or null)",
    "problem": "What problem was being solved (1 sentence, or null)",
    "tags": ["category", "domain1", "domain2"]
  },
  "context": {
    "title": "Session title",
    "promptsAndIntent": "What the user was trying to achieve",
    "keyDecisions": [
      { "title": "Decision title", "reasoning": "Why this approach..." }
    ],
    "problemsSolved": ["Problem → solution"],
    "insights": ["Learnings and patterns"]
  }
}

If NOT significant, set "entry" to null but still include "context".
For tags, use categories: architecture, performance, feature, fix, refactor, docs, testing, DX
For domains: frontend, backend, infra, ai, data, tooling`;
};

interface LLMResponse {
  isSignificant: boolean;
  entry: {
    summary: string;
    decision: string | null;
    problem: string | null;
    tags: string[];
  } | null;
  context: {
    title: string;
    promptsAndIntent: string;
    keyDecisions: Array<{ title: string; reasoning: string }>;
    problemsSolved: string[];
    insights: string[];
  };
}

const formatContextMarkdown = (
  session: NormalizedSession,
  context: LLMResponse['context']
): string => {
  const sections: string[] = [];

  sections.push(`# Session: ${context.title}`);
  sections.push('');
  sections.push(`**Source**: claude-code`);
  sections.push(`**Project**: ${session.project}`);
  sections.push(`**Branch**: ${session.gitBranch}`);
  sections.push(`**Date**: ${session.startTime.split('T')[0]}`);
  sections.push('');

  sections.push('## Prompts & Intent');
  sections.push('');
  sections.push(context.promptsAndIntent);
  sections.push('');

  if (context.keyDecisions.length > 0) {
    sections.push('## Key Decisions');
    sections.push('');
    for (const decision of context.keyDecisions) {
      sections.push(`### ${decision.title}`);
      sections.push(decision.reasoning);
      sections.push('');
    }
  }

  if (context.problemsSolved.length > 0) {
    sections.push('## Problems Solved');
    sections.push('');
    for (const problem of context.problemsSolved) {
      sections.push(`- ${problem}`);
    }
    sections.push('');
  }

  if (context.insights.length > 0) {
    sections.push('## Insights');
    sections.push('');
    for (const insight of context.insights) {
      sections.push(`- ${insight}`);
    }
    sections.push('');
  }

  return sections.join('\n');
};

export const enrich = async (
  session: NormalizedSession,
  apiKey: string,
  model: string
): Promise<EnrichmentResult> => {
  const gateway = createGateway({ apiKey });

  const { text } = await generateText({
    model: gateway(model),
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(session),
    temperature: 0.3,
  });

  if (!text) {
    throw new Error('Empty response from LLM');
  }

  // Strip markdown code blocks if present
  let jsonText = text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7);
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3);
  }
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3);
  }
  jsonText = jsonText.trim();

  const parsed: LLMResponse = JSON.parse(jsonText);

  const contextDoc: ContextDocument = {
    title: parsed.context.title,
    content: formatContextMarkdown(session, parsed.context),
    topics: parsed.entry?.tags || [],
  };

  const publicEntry: PublicEntry | null = parsed.isSignificant && parsed.entry
    ? {
        summary: parsed.entry.summary,
        decision: parsed.entry.decision,
        problem: parsed.entry.problem,
        tags: parsed.entry.tags,
        links: null,
      }
    : null;

  return {
    isSignificant: parsed.isSignificant,
    entry: publicEntry,
    context: contextDoc,
  };
};
