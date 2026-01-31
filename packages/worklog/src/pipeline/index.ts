import type { SessionIndexEntry, WorklogConfig, EnrichmentResult, MemoryWritePayload } from '../types.js';
import { readSessionEntries } from '../adapters/claude-code.js';
import { normalize } from './normalize.js';
import { sanitizeRuleBased } from './sanitize.js';
import { enrich } from './enrich.js';
import { buildMemoryPayload, publishToMemory } from './publish.js';

export interface PipelineOptions {
  work?: boolean;
}

export interface PipelineResult {
  sessionId: string;
  project: string;
  date: string;
  isSignificant: boolean;
  summary: string | null;
  published: boolean;
  skippedReason?: string;
}

export const processSession = async (
  entry: SessionIndexEntry,
  config: WorklogConfig,
  options: PipelineOptions = {}
): Promise<PipelineResult> => {
  const date = entry.created.split('T')[0];
  const baseResult = {
    sessionId: entry.sessionId,
    project: entry.projectPath.split('/').pop() || entry.projectPath,
    date,
    isSignificant: false,
    summary: null as string | null,
    published: false,
  };

  // 1. Read raw entries
  const rawEntries = await readSessionEntries(entry);

  // 2. Normalize
  const normalized = normalize(entry, rawEntries);

  // Override project name for work projects
  if (options.work) {
    normalized.project = 'work';
  }

  if (normalized.turns.length < 3) {
    return { ...baseResult, skippedReason: 'Too few turns after normalization' };
  }

  // 3. Rule-based sanitization
  const sanitized = sanitizeRuleBased(normalized, config.sanitization);

  if (!sanitized) {
    return { ...baseResult, skippedReason: 'Filtered by sanitization rules (blocked project or content)' };
  }

  if (sanitized.turns.length < 2) {
    return { ...baseResult, skippedReason: 'Too few turns after sanitization' };
  }

  // 4. LLM enrichment (includes LLM-based sanitization + significance check)
  let enrichmentResult: EnrichmentResult;
  try {
    enrichmentResult = await enrich(
      sanitized,
      config.enrichment.apiKey,
      config.enrichment.model,
      config.sanitization.redactedTerms
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ...baseResult, skippedReason: `Enrichment failed: ${message}` };
  }

  // 5. Build and publish to Memory
  const payload: MemoryWritePayload = buildMemoryPayload(sanitized, enrichmentResult);

  try {
    await publishToMemory(payload, config.memory.url, config.memory.apiKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...baseResult,
      isSignificant: enrichmentResult.isSignificant,
      summary: enrichmentResult.entry?.summary || null,
      skippedReason: `Publish failed: ${message}`,
    };
  }

  return {
    ...baseResult,
    isSignificant: enrichmentResult.isSignificant,
    summary: enrichmentResult.entry?.summary || entry.summary,
    published: true,
  };
};
