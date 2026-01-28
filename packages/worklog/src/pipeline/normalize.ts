import type {
  RawEntry,
  ContentBlock,
  NormalizedSession,
  ConversationTurn,
  SessionIndexEntry,
} from '../types.js';

const COMMAND_TAG_REGEX = /<command-(?:message|name|args)>.*?<\/command-(?:message|name|args)>/gs;

const extractTextFromContent = (content: string | ContentBlock[]): string => {
  if (typeof content === 'string') {
    return content.replace(COMMAND_TAG_REGEX, '').trim();
  }

  return content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .replace(COMMAND_TAG_REGEX, '')
    .trim();
};

export const normalize = (
  entry: SessionIndexEntry,
  rawEntries: RawEntry[]
): NormalizedSession => {
  const turns: ConversationTurn[] = [];

  for (const raw of rawEntries) {
    if (raw.isSidechain) continue;
    if (raw.type !== 'user' && raw.type !== 'assistant') continue;
    if (!raw.message) continue;

    const text = extractTextFromContent(raw.message.content);
    if (!text) continue;

    turns.push({
      role: raw.message.role,
      content: text,
      timestamp: raw.timestamp,
    });
  }

  const projectName = entry.projectPath.split('/').pop() || entry.projectPath;

  return {
    id: entry.sessionId,
    turns,
    project: projectName,
    startTime: entry.created,
    endTime: entry.modified,
    summary: entry.summary,
    gitBranch: entry.gitBranch,
  };
};
