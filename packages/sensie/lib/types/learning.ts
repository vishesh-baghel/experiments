import type {
  Topic as PrismaTopic,
  Subtopic as PrismaSubtopic,
  Concept as PrismaConcept,
  Question as PrismaQuestion,
  Answer as PrismaAnswer,
  TopicStatus,
  QuestionType,
  AnswerDepth,
} from '@prisma/client';

// Re-export Prisma enums
export { TopicStatus, QuestionType, AnswerDepth };

// Extended types with relations
export type Topic = PrismaTopic & {
  subtopics?: Subtopic[];
};

export type Subtopic = PrismaSubtopic & {
  concepts?: Concept[];
};

export type Concept = PrismaConcept & {
  questions?: Question[];
};

export type Question = PrismaQuestion;
export type Answer = PrismaAnswer;

// Learning Path types
export interface LearningPath {
  topicName: string;
  domain: 'technical' | 'soft-skills' | 'career';
  estimatedHours: number;
  subtopics: LearningPathSubtopic[];
}

export interface LearningPathSubtopic {
  name: string;
  description: string;
  order: number;
  concepts: LearningPathConcept[];
}

export interface LearningPathConcept {
  name: string;
  keyPoints: string[];
}

// Socratic types
export interface SocraticContext {
  topicId: string;
  subtopicId: string;
  conceptId: string;
  userLevel: number;
  previousAnswers: Answer[];
  hintsUsed: number;
}

export interface SocraticQuestion {
  id?: string;
  text: string;
  type: QuestionType;
  difficulty: number;
  expectedElements: string[];
  hints: string[];
  followUpPrompts: string[];
}

export interface AnswerEvaluation {
  isCorrect: boolean;
  depth: AnswerDepth;
  feedback: string;
  missingElements: string[];
  followUpQuestion?: SocraticQuestion;
}

export interface KnowledgeGap {
  concept: string;
  severity: 'minor' | 'moderate' | 'critical';
  evidence: string;
  prerequisitesNeeded: string[];
}

// Performance tracking
export interface PerformanceMetrics {
  totalQuestions: number;
  correctAnswers: number;
  hintsUsed: number;
  averageTimeToAnswer: number;
  recentAccuracy: number; // Last 10 questions
}

// Content types
export interface TeachingContent {
  conceptId: string;
  introduction: string;
  explanation: string;
  codeExamples: CodeExample[];
  analogies: string[];
  keyPoints: string[];
}

export interface CodeExample {
  language: string;
  code: string;
  explanation: string;
}

export interface CachedContent {
  conceptId: string;
  coreExplanation: string;
  keyPoints: string[];
  commonMisconceptions: string[];
  prerequisites: string[];
  cachedAt: Date;
}
