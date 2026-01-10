/**
 * Chat Command Handler
 *
 * Processes slash commands from the chat interface.
 * Commands provide quick actions without interrupting the learning flow.
 */

import type { SessionCommand } from '@/lib/types/session';
import { getTopicsByUser, getActiveTopics, getTopicById } from '@/lib/db/topics';
import { getSessionById, endSession, getActiveSessionsByUser, getSessionMessages } from '@/lib/db/sessions';
import { countReviewsDue, getReviewsDue } from '@/lib/db/reviews';
import { getUserProgress, getTodayAnalytics } from '@/lib/db/progress';
import { generateProgressReport, generateQuiz, handleCommand as agentHandleCommand } from '@/lib/mastra/agents/sensie';
import { prisma } from '@/lib/db/client';
import type { SocraticContext } from '@/lib/types';

// All supported commands
export const SUPPORTED_COMMANDS = [
  '/hint',
  '/skip',
  '/progress',
  '/topics',
  '/review',
  '/quiz',
  '/break',
  '/continue',
] as const;

export type SupportedCommand = (typeof SUPPORTED_COMMANDS)[number];

export interface CommandContext {
  userId: string;
  topicId?: string;
  sessionId?: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  action?: 'navigate' | 'display' | 'stream';
  navigateTo?: string;
}

/**
 * Check if a message is a command
 */
export function isCommand(message: string): boolean {
  const trimmed = message.trim().toLowerCase();
  return SUPPORTED_COMMANDS.some((cmd) => trimmed.startsWith(cmd));
}

/**
 * Parse command from message
 */
export function parseCommand(message: string): {
  command: SupportedCommand | null;
  args: string;
} {
  const trimmed = message.trim().toLowerCase();

  for (const cmd of SUPPORTED_COMMANDS) {
    if (trimmed.startsWith(cmd)) {
      return {
        command: cmd as SupportedCommand,
        args: message.slice(cmd.length).trim(),
      };
    }
  }

  return { command: null, args: '' };
}

/**
 * Execute a command and return the result
 */
export async function executeCommand(
  command: SupportedCommand,
  context: CommandContext,
  args: string = ''
): Promise<CommandResult> {
  switch (command) {
    case '/hint':
      return handleHintCommand(context);

    case '/skip':
      return handleSkipCommand(context);

    case '/progress':
      return handleProgressCommand(context);

    case '/topics':
      return handleTopicsCommand(context);

    case '/review':
      return handleReviewCommand(context);

    case '/quiz':
      return handleQuizCommand(context);

    case '/break':
      return handleBreakCommand(context);

    case '/continue':
      return handleContinueCommand(context);

    default:
      return {
        success: false,
        message: `Unknown command. Try: ${SUPPORTED_COMMANDS.join(', ')}`,
      };
  }
}

/**
 * /hint - Get a hint for the current question
 */
async function handleHintCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.sessionId) {
    return {
      success: false,
      message: "Hohoho! You need to be in a learning session to get hints. Start learning a topic first!",
    };
  }

  const session = await getSessionById(context.sessionId);
  if (!session) {
    return {
      success: false,
      message: "Session not found. Start a new learning session!",
    };
  }

  const MAX_HINTS = 3;
  if (session.hintsUsed >= MAX_HINTS) {
    return {
      success: false,
      message: "Hohoho! You've used all 3 hints for this question. Trust your training, young one!",
      data: { hintsUsed: session.hintsUsed, maxHints: MAX_HINTS },
    };
  }

  // Get current question if available
  if (!session.currentQuestionId) {
    return {
      success: false,
      message: "No active question to give hints for. Answer the current question first!",
    };
  }

  const question = await prisma.question.findUnique({
    where: { id: session.currentQuestionId },
    include: { concept: true },
  });

  if (!question) {
    return {
      success: false,
      message: "Question not found. Let's move on to a new question!",
    };
  }

  // Get hint based on usage
  const hints = question.hints || [];
  const hintIndex = session.hintsUsed;
  const currentHint = hints[hintIndex] || hints[hints.length - 1] || "Think about the core principle here...";

  // Update hints used
  await prisma.learningSession.update({
    where: { id: context.sessionId },
    data: { hintsUsed: session.hintsUsed + 1 },
  });

  return {
    success: true,
    message: `**Hint ${hintIndex + 1}/${MAX_HINTS}:** ${currentHint}`,
    data: {
      hint: currentHint,
      hintNumber: hintIndex + 1,
      hintsRemaining: MAX_HINTS - (hintIndex + 1),
    },
  };
}

/**
 * /skip - Skip the current question
 */
async function handleSkipCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.sessionId) {
    return {
      success: false,
      message: "You need to be in a learning session to skip questions!",
    };
  }

  const session = await getSessionById(context.sessionId);
  if (!session) {
    return {
      success: false,
      message: "Session not found!",
    };
  }

  const MAX_SKIPS = 3;
  if (session.skipsUsed >= MAX_SKIPS) {
    return {
      success: false,
      message: "Hohoho! No skips remaining. A true master faces every challenge!",
      data: { skipsUsed: session.skipsUsed, maxSkips: MAX_SKIPS },
    };
  }

  if (!session.currentQuestionId) {
    return {
      success: false,
      message: "No active question to skip!",
    };
  }

  // Update session with skip
  await prisma.learningSession.update({
    where: { id: context.sessionId },
    data: {
      skipsUsed: session.skipsUsed + 1,
      skippedQuestionIds: [...session.skippedQuestionIds, session.currentQuestionId],
      currentQuestionId: null,
    },
  });

  return {
    success: true,
    message: `Question skipped. You have ${MAX_SKIPS - session.skipsUsed - 1} skip(s) remaining. Remember, this concept will return later!`,
    data: {
      skipsUsed: session.skipsUsed + 1,
      skipsRemaining: MAX_SKIPS - session.skipsUsed - 1,
    },
  };
}

/**
 * /progress - Show detailed progress
 */
async function handleProgressCommand(context: CommandContext): Promise<CommandResult> {
  const [userProgress, todayAnalytics, topics, reviewsDue] = await Promise.all([
    getUserProgress(context.userId),
    getTodayAnalytics(context.userId),
    getTopicsByUser(context.userId),
    countReviewsDue(context.userId),
  ]);

  const activeTopics = topics.filter((t) => t.status === 'ACTIVE');
  const completedTopics = topics.filter((t) => t.status === 'COMPLETED');
  const totalMastery = topics.length > 0
    ? Math.round(topics.reduce((sum, t) => sum + t.masteryPercentage, 0) / topics.length)
    : 0;

  let message = `**Your Training Progress**\n\n`;
  message += `**Level ${userProgress.currentLevel}** | ${userProgress.totalXP} XP\n`;
  message += `Current streak: ${userProgress.currentStreak} days | Longest: ${userProgress.longestStreak} days\n\n`;

  message += `**Topics**\n`;
  message += `- Active: ${activeTopics.length}/3\n`;
  message += `- Completed: ${completedTopics.length}\n`;
  message += `- Average mastery: ${totalMastery}%\n\n`;

  if (activeTopics.length > 0) {
    message += `**Active Topics:**\n`;
    for (const topic of activeTopics) {
      message += `- ${topic.name}: ${topic.masteryPercentage}%\n`;
    }
    message += '\n';
  }

  message += `**Today:**\n`;
  message += `- Questions answered: ${todayAnalytics.questionsAnswered}\n`;
  message += `- Correct: ${todayAnalytics.questionsCorrect}\n`;
  message += `- XP earned: ${todayAnalytics.xpEarned}\n\n`;

  if (reviewsDue > 0) {
    message += `**${reviewsDue} review${reviewsDue === 1 ? '' : 's'} due** - Use \`/review\` to start!\n`;
  }

  return {
    success: true,
    message,
    data: {
      userProgress,
      todayAnalytics,
      topics: topics.map((t) => ({ name: t.name, status: t.status, mastery: t.masteryPercentage })),
      reviewsDue,
    },
  };
}

/**
 * /topics - List all learning topics
 */
async function handleTopicsCommand(context: CommandContext): Promise<CommandResult> {
  const topics = await getTopicsByUser(context.userId);

  const active = topics.filter((t) => t.status === 'ACTIVE');
  const completed = topics.filter((t) => t.status === 'COMPLETED');
  const queued = topics.filter((t) => t.status === 'QUEUED');

  let message = `**Your Learning Topics**\n\n`;

  if (active.length > 0) {
    message += `**Active (${active.length}/3):**\n`;
    for (const topic of active) {
      message += `- ${topic.name} (${topic.masteryPercentage}%)\n`;
      if (topic.subtopics && topic.subtopics.length > 0) {
        const inProgress = topic.subtopics.find((st) => !st.isLocked && st.masteryPercentage < 100);
        if (inProgress) {
          message += `  ↳ Current: ${inProgress.name}\n`;
        }
      }
    }
    message += '\n';
  }

  if (completed.length > 0) {
    message += `**Completed (${completed.length}):**\n`;
    for (const topic of completed) {
      message += `- ${topic.name} ✓\n`;
    }
    message += '\n';
  }

  if (queued.length > 0) {
    message += `**Queued (${queued.length}):**\n`;
    for (const topic of queued) {
      message += `- ${topic.name}\n`;
    }
    message += '\n';
  }

  if (topics.length === 0) {
    message = "No topics yet! What would you like to learn?";
  } else {
    message += `\nUse \`/continue\` to resume your last topic, or navigate to Topics page to manage them.`;
  }

  return {
    success: true,
    message,
    data: { topics: topics.map((t) => ({ id: t.id, name: t.name, status: t.status, mastery: t.masteryPercentage })) },
    action: 'display',
  };
}

/**
 * /review - Start spaced repetition review
 */
async function handleReviewCommand(context: CommandContext): Promise<CommandResult> {
  const reviewsDue = await countReviewsDue(context.userId);

  if (reviewsDue === 0) {
    return {
      success: true,
      message: "Hohoho! No reviews due right now. Great work keeping up with your training!",
      data: { reviewsDue: 0 },
    };
  }

  const reviews = await getReviewsDue(context.userId, 5);

  let message = `**${reviewsDue} Review${reviewsDue === 1 ? '' : 's'} Due**\n\n`;
  message += `Ready to strengthen your knowledge?\n\n`;
  message += `Preview of due items:\n`;

  for (const review of reviews.slice(0, 5)) {
    const concept = review.conceptId
      ? await prisma.concept.findUnique({
          where: { id: review.conceptId },
          select: { name: true },
        })
      : null;
    if (concept) {
      message += `- ${concept.name}\n`;
    }
  }

  if (reviewsDue > 5) {
    message += `...and ${reviewsDue - 5} more\n`;
  }

  message += `\nNavigate to the Review page to start your session!`;

  return {
    success: true,
    message,
    data: { reviewsDue, reviews: reviews.slice(0, 5) },
    action: 'navigate',
    navigateTo: '/review',
  };
}

/**
 * /quiz - Start a quiz on current topic
 */
async function handleQuizCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.topicId) {
    // Get most recent active topic
    const activeTopics = await getActiveTopics(context.userId);
    if (activeTopics.length === 0) {
      return {
        success: false,
        message: "No active topics for a quiz! Start learning a topic first.",
      };
    }

    const topic = activeTopics[0];
    return {
      success: true,
      message: `**Quiz Time!**\n\nA quiz on "${topic.name}" is ready. Navigate to the quiz page or I can ask you questions here!\n\nReady to test your knowledge?`,
      data: { topicId: topic.id, topicName: topic.name },
      action: 'display',
    };
  }

  const topic = await getTopicById(context.topicId);
  if (!topic) {
    return {
      success: false,
      message: "Topic not found!",
    };
  }

  return {
    success: true,
    message: `**Quiz Time!**\n\nA quiz on "${topic.name}" is ready. Navigate to the quiz page or I can ask you questions here!\n\nReady to test your knowledge?`,
    data: { topicId: topic.id, topicName: topic.name },
    action: 'display',
  };
}

/**
 * /break - Save progress and take a break
 */
async function handleBreakCommand(context: CommandContext): Promise<CommandResult> {
  let sessionDuration = 0;
  let questionsAnswered = 0;

  if (context.sessionId) {
    const session = await getSessionById(context.sessionId, true);
    if (session) {
      // Calculate session duration in minutes (using createdAt as session start)
      sessionDuration = Math.round(
        (Date.now() - new Date(session.createdAt).getTime()) / (1000 * 60)
      );

      // Count user messages as proxy for questions answered
      const messages = await prisma.message.findMany({
        where: { sessionId: context.sessionId, role: 'USER' },
      });
      questionsAnswered = messages.length;

      // Mark session as inactive but don't end it (can be resumed)
      await prisma.learningSession.update({
        where: { id: context.sessionId },
        data: { lastActivity: new Date() },
      });
    }
  }

  const breakMessages = [
    "Rest well, young one. Even the mightiest warriors need time to recover!",
    "Hohoho! Good work today. Your brain needs time to consolidate what you've learned.",
    "Time for a break! Remember, true mastery is built one session at a time.",
    "Taking a rest is wisdom, not weakness. See you soon, apprentice!",
    "Your progress has been saved. Go stretch those legs!",
  ];

  const message = breakMessages[Math.floor(Math.random() * breakMessages.length)];

  let summary = `**${message}**\n\n`;
  if (sessionDuration > 0 || questionsAnswered > 0) {
    summary += `This session:\n`;
    summary += `- Duration: ${sessionDuration} minutes\n`;
    summary += `- Questions tackled: ${questionsAnswered}\n\n`;
  }
  summary += `Your progress is saved. Use \`/continue\` when you're ready to resume!`;

  return {
    success: true,
    message: summary,
    data: { sessionDuration, questionsAnswered },
  };
}

/**
 * /continue - Continue the last studied topic
 *
 * This command finds the user's most recent learning session or active topic
 * and provides a response that triggers navigation to the topic chat.
 * The navigation is handled by the frontend which detects the "Resuming:" or
 * "Ready to continue:" pattern in the response.
 */
async function handleContinueCommand(context: CommandContext): Promise<CommandResult> {
  // First, check for active sessions
  const activeSessions = await getActiveSessionsByUser(context.userId);

  if (activeSessions.length > 0) {
    // Get the most recent session
    const latestSession = activeSessions[0];
    const topic = await getTopicById(latestSession.topicId, true);

    if (topic) {
      let message = `**Resuming: ${topic.name}**\n\n`;
      message += `Mastery: ${topic.masteryPercentage}%\n`;

      // Find current subtopic if available
      if (latestSession.currentSubtopicId) {
        const subtopic = await prisma.subtopic.findUnique({
          where: { id: latestSession.currentSubtopicId },
        });
        if (subtopic) {
          message += `Current subtopic: ${subtopic.name}\n`;
        }
      }

      // Get message count to show in summary
      const dbMessages = await getSessionMessages(latestSession.id);
      if (dbMessages.length > 0) {
        message += `Conversation history: ${dbMessages.length} messages\n`;
      }

      message += `\nWelcome back, apprentice! Let's continue your training. Navigating now...`;

      return {
        success: true,
        message,
        data: {
          topicId: topic.id,
          topicName: topic.name,
          sessionId: latestSession.id,
          mastery: topic.masteryPercentage,
        },
        action: 'navigate',
        navigateTo: `/chat?topic=${topic.id}`,
      };
    }
  }

  // No active sessions, check for active topics
  const activeTopics = await getActiveTopics(context.userId);

  if (activeTopics.length > 0) {
    const topic = activeTopics[0];
    let message = `**Ready to continue: ${topic.name}**\n\n`;
    message += `Mastery: ${topic.masteryPercentage}%\n`;
    message += `\nWelcome back! Let's pick up where you left off. Navigating now...`;

    return {
      success: true,
      message,
      data: {
        topicId: topic.id,
        topicName: topic.name,
        mastery: topic.masteryPercentage,
      },
      action: 'navigate',
      navigateTo: `/chat?topic=${topic.id}`,
    };
  }

  // No active topics at all
  return {
    success: false,
    message: "No active topics to continue! What would you like to learn? Go to Topics to start something new.",
    action: 'navigate',
    navigateTo: '/topics',
  };
}
