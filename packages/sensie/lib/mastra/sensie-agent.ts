import { generateObject, generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type {
  SocraticContext,
  SocraticQuestion,
  AnswerEvaluation,
  QuestionType,
} from '@/lib/types';
import { prisma } from '@/lib/db/client';
import {
  SENSIE_SYSTEM_PROMPT,
  ANSWER_EVALUATION_PROMPT,
  CONCEPT_CONTEXT_PROMPT,
  PROMPT_TEMPLATES,
} from './prompts';
import {
  SocraticQuestionSchema,
  AnswerEvaluationSchema,
  EncouragementSchema,
  ProgressSummarySchema,
} from './schemas';
import { generateQuestion, evaluateAnswer as socraticEvaluate } from '@/lib/learning/socratic-engine';
import { getPerformanceSummary, getTopicCompletionContext, getStreakContext } from './context';
import { ENCOURAGEMENT, BREAK_MESSAGES } from '@/lib/personality/constants';

/**
 * SensieAgent - Main teaching agent with Socratic method
 *
 * Personality: Master Roshi (wise, eccentric, demanding but encouraging)
 * Teaching style: Questions, not answers. Guide through understanding.
 */

/**
 * Result from teaching a concept
 */
export interface TeachingContent {
  conceptId: string;
  introduction: string;
  contextSetting: string;
  initialQuestion: SocraticQuestion;
}

/**
 * Result from Socratic questioning
 */
export interface SocraticResponse {
  question: SocraticQuestion;
  encouragement?: string;
  conceptContext?: string;
}

/**
 * Evaluation result from answer assessment
 */
export interface EvaluationResult {
  evaluation: AnswerEvaluation;
  feedback: string;
  nextAction: 'next_concept' | 'follow_up' | 'guide' | 'hint';
  guidingQuestion?: SocraticQuestion;
}

/**
 * Suggestion for next concept to study
 */
export interface NextConceptSuggestion {
  conceptId: string;
  reason: string;
  confidence: number;
}

/**
 * Teach a concept - introduces context and asks first question
 */
export async function teachConcept(conceptId: string): Promise<TeachingContent> {
  // Get concept with full context
  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    include: {
      subtopic: {
        include: {
          topic: true,
        },
      },
    },
  });

  if (!concept) {
    throw new Error('Concept not found');
  }

  // Generate context-setting introduction
  const contextSchema = z.object({
    introduction: z.string().describe('Brief hook to engage the student (1-2 sentences)'),
    contextSetting: z.string().describe('Set the stage for the concept (2-3 sentences)'),
  });

  const { object: contextContent } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: contextSchema,
    system: `${SENSIE_SYSTEM_PROMPT}\n\n${CONCEPT_CONTEXT_PROMPT}`,
    prompt: `Introduce this concept to a student:

Topic: ${concept.subtopic.topic.name}
Subtopic: ${concept.subtopic.name}
Concept: ${concept.name}
${concept.explanation ? `Explanation: ${concept.explanation}` : ''}

Create an engaging introduction that:
1. Hooks their interest
2. Sets context without explaining
3. Makes them curious to learn more
4. Uses Master Roshi's voice`,
  });

  // Generate initial Socratic question
  const socraticContext: SocraticContext = {
    topicId: concept.subtopic.topicId,
    subtopicId: concept.subtopicId,
    conceptId: concept.id,
    userLevel: 1, // Will be adjusted based on user
    previousAnswers: [],
    hintsUsed: 0,
  };

  const initialQuestion = await generateQuestion(socraticContext);

  return {
    conceptId,
    introduction: contextContent.introduction,
    contextSetting: contextContent.contextSetting,
    initialQuestion,
  };
}

/**
 * Ask a Socratic question within context
 */
export async function askSocraticQuestion(
  context: SocraticContext
): Promise<SocraticResponse> {
  // Generate the question using Socratic engine
  const question = await generateQuestion(context);

  // Maybe add encouragement based on context
  let encouragement: string | undefined;
  if (context.previousAnswers.length > 0) {
    const lastAnswer = context.previousAnswers[context.previousAnswers.length - 1];
    if (lastAnswer.isCorrect) {
      encouragement = await generateEncouragement('correct');
    }
  }

  // Get concept context for additional grounding
  const concept = await prisma.concept.findUnique({
    where: { id: context.conceptId },
    select: { name: true, explanation: true },
  });

  return {
    question,
    encouragement,
    conceptContext: concept?.name,
  };
}

/**
 * Evaluate user's answer to a question
 */
export async function evaluateAnswer(
  answer: string,
  question: SocraticQuestion,
  context: SocraticContext
): Promise<EvaluationResult> {
  // Use the Socratic engine for evaluation
  const evaluation = await socraticEvaluate(answer, question, context);

  // Determine next action based on evaluation
  let nextAction: 'next_concept' | 'follow_up' | 'guide' | 'hint';
  let guidingQuestion: SocraticQuestion | undefined;

  if (!evaluation.isCorrect) {
    // Wrong answer (NONE depth) - need to guide them
    nextAction = 'guide';
    if (evaluation.missingElements.length > 0) {
      guidingQuestion = evaluation.followUpQuestion;
    }
  } else if (evaluation.depth === 'SHALLOW') {
    // Correct but shallow - follow up for deeper understanding
    nextAction = 'follow_up';
    guidingQuestion = evaluation.followUpQuestion;
  } else {
    // Deep understanding - move to next concept
    nextAction = 'next_concept';
  }

  return {
    evaluation,
    feedback: evaluation.feedback,
    nextAction,
    guidingQuestion,
  };
}

/**
 * Suggest the next concept to study
 */
export async function suggestNextConcept(
  topicId: string,
  userId: string
): Promise<NextConceptSuggestion> {
  // Get topic with all subtopics and concepts
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subtopics: {
        orderBy: { order: 'asc' },
        include: {
          concepts: {
            orderBy: { id: 'asc' },
          },
        },
      },
    },
  });

  if (!topic) {
    throw new Error('Topic not found');
  }

  // Find first non-mastered concept in unlocked subtopics
  for (const subtopic of topic.subtopics) {
    if (subtopic.isLocked) continue;

    for (const concept of subtopic.concepts) {
      if (!concept.isMastered) {
        // Check user's history with this concept
        const answerCount = await prisma.answer.count({
          where: {
            userId,
            question: { conceptId: concept.id },
          },
        });

        // Prioritize concepts with some attempts but not mastered
        const confidence = answerCount > 0 ? 0.9 : 0.7;

        return {
          conceptId: concept.id,
          reason: answerCount > 0
            ? `You've worked on "${concept.name}" before - let's continue building that understanding.`
            : `Time to explore "${concept.name}" - an important piece of ${subtopic.name}.`,
          confidence,
        };
      }
    }
  }

  // All concepts mastered in unlocked subtopics - suggest unlocking next
  const nextLockedSubtopic = topic.subtopics.find(st => st.isLocked);
  if (nextLockedSubtopic && nextLockedSubtopic.concepts.length > 0) {
    return {
      conceptId: nextLockedSubtopic.concepts[0].id,
      reason: `You've mastered the previous section! Ready to unlock "${nextLockedSubtopic.name}"?`,
      confidence: 0.95,
    };
  }

  // All done - suggest review
  const firstConcept = topic.subtopics[0]?.concepts[0];
  return {
    conceptId: firstConcept?.id || '',
    reason: 'Hohoho! You\'ve mastered all concepts in this topic! Time for some review to keep it fresh.',
    confidence: 1.0,
  };
}

/**
 * Generate encouragement in Master Roshi style
 */
export async function generateEncouragement(
  context: 'correct' | 'incorrect' | 'progress' | 'struggle'
): Promise<string> {
  // Use pre-defined phrases for consistency and speed
  const contextMap: Record<string, keyof typeof ENCOURAGEMENT> = {
    'correct': 'CORRECT_ANSWER',
    'incorrect': 'STRUGGLE',
    'progress': 'PROGRESS',
    'struggle': 'STRUGGLE',
  };
  const key = contextMap[context];
  const phrases = key ? ENCOURAGEMENT[key] : undefined;
  if (phrases && phrases.length > 0) {
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  // Fallback to LLM for variety
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: EncouragementSchema,
    system: SENSIE_SYSTEM_PROMPT,
    prompt: `Generate an encouraging message for a student who just ${context === 'correct' ? 'answered correctly' : context === 'incorrect' ? 'got an answer wrong' : context === 'progress' ? 'made progress' : 'is struggling'}.

Keep it brief (1-2 sentences). Use Master Roshi's voice - wise, a bit eccentric, but genuinely supportive.`,
  });

  return object.message;
}

/**
 * Handle special commands from user
 */
export async function handleCommand(
  command: string,
  context: SocraticContext
): Promise<string> {
  const cmd = command.toLowerCase().trim();

  // Handle specific commands
  switch (cmd) {
    case '/hint':
    case 'hint':
      if (context.hintsUsed >= 3) {
        return "Hohoho! You've used all your hints for this question. Time to trust your training and give it your best shot!";
      }
      return `Hint ${context.hintsUsed + 1}/3 coming up... Remember, every hint used is a chance to learn to think independently!`;

    case '/skip':
    case 'skip':
      return "Skipping this one? That's fine - even the greatest warriors know when to retreat and regroup. We'll come back to this concept later.";

    case '/break':
    case 'break':
      return await generateBreakMessage(30, context.previousAnswers.length);

    case '/progress':
    case 'progress':
      return "Let me check your training progress... One moment, young one.";

    case '/topics':
    case 'topics':
      return "Ah, you want to see your training grounds? Let me show you what you're working on.";

    case '/review':
    case 'review':
      return "Time for review training! The mark of a true master is not just learning, but REMEMBERING. Let's see what needs refreshing.";

    case '/quiz':
    case 'quiz':
      return "A quiz, you say? Hohoho! You want to test yourself? I like that fighting spirit! Let me prepare some questions...";

    default:
      return "Hmm? I don't recognize that command. Try /hint, /skip, /break, /progress, /topics, /review, or /quiz.";
  }
}

/**
 * Generate a break message
 */
export async function generateBreakMessage(
  sessionDuration: number,
  questionsAnswered: number
): Promise<string> {
  // Use pre-defined messages for speed
  if (BREAK_MESSAGES && BREAK_MESSAGES.length > 0) {
    const base = BREAK_MESSAGES[Math.floor(Math.random() * BREAK_MESSAGES.length)];
    return `${base} You answered ${questionsAnswered} questions in ${Math.round(sessionDuration)} minutes. Good training session!`;
  }

  // Fallback to LLM
  const breakSchema = z.object({
    message: z.string().describe('Break message in Master Roshi voice'),
  });

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: breakSchema,
    system: SENSIE_SYSTEM_PROMPT,
    prompt: `Generate a break message for a student who has been studying for ${sessionDuration} minutes and answered ${questionsAnswered} questions.

Acknowledge their effort, encourage rest, and remind them to come back. Keep it brief (2-3 sentences). Use Master Roshi's voice.`,
  });

  return object.message;
}

/**
 * Generate progress report in Sensie's voice
 */
export async function generateProgressReport(
  topicId: string,
  userId: string
): Promise<string> {
  // Get performance data
  const [performance, completion, streak] = await Promise.all([
    getPerformanceSummary(userId, topicId),
    getTopicCompletionContext(topicId, userId),
    getStreakContext(userId),
  ]);

  // Get topic name
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { name: true },
  });

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: ProgressSummarySchema,
    system: SENSIE_SYSTEM_PROMPT,
    prompt: `Generate a progress report for a student studying "${topic?.name || 'this topic'}".

Performance Data:
- Total questions answered: ${performance.totalQuestions}
- Correct answers: ${performance.correctAnswers}
- Hints used: ${performance.hintsUsed}
- Recent accuracy: ${Math.round(performance.recentAccuracy * 100)}%

Topic Completion:
- Completed subtopics: ${completion.completedSubtopics}/${completion.totalSubtopics}
- Mastered concepts: ${completion.masteredConcepts}/${completion.totalConcepts}
- Overall mastery: ${Math.round(completion.overallMastery)}%

Streak:
- Current streak: ${streak.currentStreak} days
- Longest streak: ${streak.longestStreak} days
${streak.isAtRisk ? '- STREAK AT RISK! Train today to keep it going!' : ''}

Generate an encouraging progress report in Master Roshi's voice that:
1. Acknowledges their specific achievements
2. Identifies areas to improve (without being harsh)
3. Gives clear recommendation for what to focus on next
4. Motivates them to continue`,
  });

  // Format the response
  let report = `📊 **Your Training Progress**\n\n`;
  report += `${object.overview}\n\n`;

  if (object.strengths.length > 0) {
    report += `**Strengths:**\n`;
    object.strengths.forEach(s => report += `✅ ${s}\n`);
    report += '\n';
  }

  if (object.areasToImprove.length > 0) {
    report += `**Areas to Develop:**\n`;
    object.areasToImprove.forEach(a => report += `🎯 ${a}\n`);
    report += '\n';
  }

  report += `**Next Steps:** ${object.recommendation}\n\n`;
  report += `💪 ${object.motivation}`;

  return report;
}
