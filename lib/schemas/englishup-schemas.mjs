import { z } from "zod";

export const cefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export const reviewStatusSchema = z.enum([
  "AI_GENERATED_PENDING",
  "AI_GENERATED_APPROVED",
  "VERIFIED_GOLD",
  "FLAGGED_ISSUE",
]);
export const fallbackReasonSchema = z.enum([
  "api_down",
  "quota_exceeded",
  "timeout",
  "invalid_response",
  "circuit_open",
]);

export const grammarQuestionSchema = z.object({
  id: z.string().min(1),
  examType: z.string().default("EnglishUp"),
  skill: z.literal("grammar"),
  subskill: z.string().min(1),
  topic: z.string().min(1),
  cefr: cefrLevelSchema,
  questionType: z.enum(["multiple_choice", "fill_blank", "sentence_correction", "short_answer"]),
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().min(1),
  indonesianLearnerMistake: z.string().min(1),
  pedagogicalPattern: z.string().min(1),
  sourceReference: z.string().min(1),
  copyrightStatus: z.enum(["original", "public_domain", "licensed", "private_reference_only"]),
  reviewStatus: reviewStatusSchema,
});

export const vocabularyCardSchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  ipa: z.string().optional().default(""),
  definition: z.string().min(1),
  cefr: cefrLevelSchema,
  pos: z.string().min(1),
  example: z.string().min(1),
  collocations: z.array(z.string()).default([]),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  category: z.enum([
    "IELTS Academic",
    "Daily Conversation",
    "Tech & AI",
    "Environment",
    "Social Issues",
    "Business & Work",
  ]),
  fsrs: z.object({
    due: z.string(),
    stability: z.number().nonnegative(),
    difficulty: z.number().nonnegative(),
    elapsedDays: z.number().int().nonnegative(),
    scheduledDays: z.number().int().nonnegative(),
    reps: z.number().int().nonnegative(),
    lapses: z.number().int().nonnegative(),
    state: z.enum(["New", "Learning", "Review", "Relearning"]),
    lastReview: z.string().optional(),
  }).optional(),
});

const readingQuestionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.array(z.string())]).optional(),
  correct_answer: z.string().optional(),
  explanation: z.string().optional(),
  evidence: z.string().optional(),
});

export const readingPassageSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.string().min(1),
  cefr: cefrLevelSchema.optional(),
  estimatedMinutes: z.number().positive().optional(),
  passage: z.string().min(80),
  vocabulary: z.array(z.record(z.string(), z.unknown())).default([]),
  strategyTip: z.string().optional(),
  questions: z.array(readingQuestionSchema).min(1),
  sourceView: z.object({
    attribution: z.string(),
    url: z.string().url().optional(),
    copyrightStatus: z.string(),
  }).optional(),
  ieltsTips: z.array(z.union([z.string(), z.record(z.string(), z.unknown())])).default([]),
});

export const writingPromptSchema = z.object({
  id: z.string().min(1),
  taskType: z.enum(["task_1_academic", "task_1_general", "task_2"]),
  cefr: cefrLevelSchema,
  prompt: z.string().min(1),
  rubric: z.object({
    taskAchievement: z.string(),
    coherenceCohesion: z.string(),
    lexicalResource: z.string(),
    grammaticalRangeAccuracy: z.string(),
  }),
  fallbackEvaluation: z.string().min(1),
  reviewStatus: reviewStatusSchema,
});

export const conversationScenarioSchema = z.object({
  id: z.string().min(1),
  cefr: cefrLevelSchema,
  title: z.string().min(1),
  context: z.string().min(1),
  learnerGoal: z.string().min(1),
  tutorRole: z.string().min(1),
  priorityCorrectionsPerTurn: z.number().int().min(1).max(2).default(2),
  successCriteria: z.array(z.string()).min(1),
  fallbackTurns: z.array(z.string()).min(1),
});

export const progressStateSchema = z.object({
  version: z.literal(1),
  xp: z.number().int().nonnegative(),
  level: z.string().min(1),
  activeDates: z.array(z.string()),
  streak: z.object({ current: z.number().int().nonnegative(), longest: z.number().int().nonnegative(), freezesAvailable: z.number().int().nonnegative() }),
  completedLessons: z.array(z.string()),
  quizAttempts: z.array(z.record(z.string(), z.unknown())),
  fsrsCards: z.record(z.string(), z.record(z.string(), z.unknown())),
  readingResults: z.array(z.record(z.string(), z.unknown())),
  writingHistory: z.array(z.record(z.string(), z.unknown())),
  conversationHistory: z.array(z.record(z.string(), z.unknown())),
  achievements: z.array(z.string()),
  settings: z.record(z.string(), z.unknown()),
});

export const enrichmentResultSchema = z.object({
  query: z.string().min(1),
  word: z.string().min(1),
  source: z.literal("api_enrichment"),
  aiUsed: z.literal(false),
  fallbackReason: fallbackReasonSchema.optional(),
  dictionary: z.object({
    word: z.string(),
    phonetic: z.string().optional(),
    audio: z.string().optional(),
    definition: z.string(),
    example: z.string().optional(),
    synonyms: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    collocations: z.array(z.string()).default([]),
    sources: z.array(z.string()).default([]),
    ok: z.boolean().optional(),
    cached: z.boolean().optional(),
    latencyMs: z.number().nonnegative().optional(),
    failureReason: fallbackReasonSchema.optional(),
  }),
  wikipedia: z.object({
    title: z.string(),
    url: z.string().url(),
    source: z.literal("Wikipedia"),
    snippet: z.string(),
    license: z.string(),
    ok: z.boolean().optional(),
    cached: z.boolean().optional(),
    latencyMs: z.number().nonnegative().optional(),
  }).nullable().optional(),
  articles: z.array(z.object({
    title: z.string(),
    url: z.string(),
    source: z.string(),
    snippet: z.string().optional(),
    year: z.number().optional(),
  })).default([]),
  sources: z.array(z.object({
    source: z.string(),
    ok: z.boolean(),
    latencyMs: z.number().nonnegative().optional(),
    cached: z.boolean().optional(),
  })).default([]),
  tts: z.object({
    provider: z.string(),
    browserRequired: z.boolean(),
    cost: z.string(),
  }),
});

export const aiGatewayResultSchema = z.object({
  ok: z.boolean(),
  source: z.enum(["ai", "static", "rule_based"]),
  endpoint: z.string().min(1),
  promptVersion: z.string().min(1).optional(),
  cacheKey: z.string().optional(),
  latencyMs: z.number().nonnegative(),
  tokenUsage: z.record(z.string(), z.number()).optional(),
  failureReason: fallbackReasonSchema.optional(),
  data: z.unknown(),
});
