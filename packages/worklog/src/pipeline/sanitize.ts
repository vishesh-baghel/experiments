import type {
  NormalizedSession,
  ConversationTurn,
  SanitizationConfig,
} from "../types.js";

const SECRET_PATTERNS = [
  /(?:api[_-]?key|token|secret|password|auth|credential)\s*[:=]\s*['"]?\S+['"]?/gi,
  /(?:sk|pk|rk|ak|Bearer)\s*[-_]?\s*[A-Za-z0-9_\-]{20,}/g,
  /ghp_[A-Za-z0-9_]{36,}/g,
  /eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+/g, // JWT
];

const IP_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const INTERNAL_URL_PATTERN =
  /https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)[^\s)"]*/g;

const redactSecrets = (text: string): string => {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  result = result.replace(IP_PATTERN, "[REDACTED_IP]");
  result = result.replace(INTERNAL_URL_PATTERN, "[REDACTED_URL]");
  return result;
};

const redactTerms = (
  text: string,
  redactedTerms: Record<string, string>,
): string => {
  let result = text;
  for (const [term, replacement] of Object.entries(redactedTerms)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), replacement);
  }
  return result;
};

const containsBlockedPath = (
  text: string,
  blockedPaths: string[],
): boolean => {
  return blockedPaths.some((p) => text.includes(p));
};

const containsBlockedProject = (
  text: string,
  blockedProjects: string[],
): boolean => {
  const lowerText = text.toLowerCase();
  return blockedProjects.some((p) => lowerText.includes(p.toLowerCase()));
};

const containsBlockedDomain = (
  text: string,
  blockedDomains: string[],
): boolean => {
  return blockedDomains.some((d) => text.includes(d));
};

const sanitizeTurn = (
  turn: ConversationTurn,
  config: SanitizationConfig,
): ConversationTurn | null => {
  // Apply term redaction before blocked checks
  let content = redactTerms(turn.content, config.redactedTerms);

  if (containsBlockedPath(content, config.blockedPaths)) return null;
  if (containsBlockedProject(content, config.blockedProjects)) return null;
  if (containsBlockedDomain(content, config.blockedDomains)) return null;

  return {
    ...turn,
    content: redactSecrets(content),
  };
};

export const sanitizeRuleBased = (
  session: NormalizedSession,
  config: SanitizationConfig,
): NormalizedSession | null => {
  // Redact terms in session-level fields
  const redactedProject = redactTerms(session.project, config.redactedTerms);
  const redactedSummary = redactTerms(session.summary, config.redactedTerms);

  const sanitizedTurns: ConversationTurn[] = [];
  for (const turn of session.turns) {
    const sanitized = sanitizeTurn(turn, config);
    if (sanitized) {
      sanitizedTurns.push(sanitized);
    }
  }

  if (sanitizedTurns.length === 0) return null;

  return {
    ...session,
    project: redactedProject,
    summary: redactedSummary,
    turns: sanitizedTurns,
  };
};
