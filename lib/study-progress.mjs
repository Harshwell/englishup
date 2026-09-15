import { z } from "zod";

export const PROGRESS_KEY = "englishup.v2.progress";
const count = z.number().int().nonnegative();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const activity = z.object({
  id: z.string(),
  kind: z.enum(["grammar", "vocabulary", "reading", "conversation", "writing"]),
  label: z.string(),
  xp: count,
  at: z.string().datetime(),
  key: z.string(),
});
export const studyProgressSchema = z.object({
  version: z.literal(2),
  xp: count,
  activeDates: z.array(day),
  completedLessons: z.array(z.string()),
  words: z.array(z.string()),
  reading: z.array(z.string()),
  activities: z.array(activity),
  dailyXp: z.record(day, count),
  rewarded: z.array(z.string()),
  goal: z.union([z.literal(20), z.literal(40), z.literal(60)]),
  legacyWords: count.default(0),
  legacyReading: count.default(0),
  legacyChat: count.default(0),
});
export const emptyProgress = () => ({
  version: 2,
  xp: 0,
  activeDates: [],
  completedLessons: [],
  words: [],
  reading: [],
  activities: [],
  dailyXp: {},
  rewarded: [],
  goal: 40,
  legacyWords: 0,
  legacyReading: 0,
  legacyChat: 0,
});
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function streakFor(dates, now = new Date()) {
  const days = new Set(dates);
  const cursor = new Date(now);
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
export function longestStreak(dates) {
  return dates.reduce(
    (longest, date) =>
      Math.max(longest, streakFor(dates, new Date(`${date}T12:00:00`))),
    0,
  );
}
const legacySchema = z.object({
  xp: count.default(0),
  doneL: z.array(z.string()).default([]),
  activeDates: z.array(day).default([]),
  vocabN: count.default(0),
  readN: count.default(0),
  chatN: count.default(0),
});
export function restoreProgress(current, legacy) {
  if (current) return studyProgressSchema.parse(JSON.parse(current));
  if (!legacy) return emptyProgress();
  const old = legacySchema.parse(JSON.parse(legacy));
  return {
    ...emptyProgress(),
    xp: old.xp,
    activeDates: [...new Set(old.activeDates)],
    completedLessons: [...new Set(old.doneL)],
    legacyWords: old.vocabN,
    legacyReading: old.readN,
    legacyChat: old.chatN,
  };
}
export function recordActivity(progress, event, now = new Date()) {
  const date = localDay(now);
  const key = `${date}:${event.kind}:${event.key}`;
  // A reviewed item earns XP once per local day, including after a reload.
  if (progress.rewarded.includes(key)) return progress;
  const entry = activity.parse({
    ...event,
    id: key,
    key,
    at: now.toISOString(),
  });
  return studyProgressSchema.parse({
    ...progress,
    xp: progress.xp + entry.xp,
    activeDates: [...new Set([...progress.activeDates, date])],
    dailyXp: {
      ...progress.dailyXp,
      [date]: (progress.dailyXp[date] || 0) + entry.xp,
    },
    rewarded: [...progress.rewarded, key],
    activities: [entry, ...progress.activities].slice(0, 200),
    completedLessons:
      event.kind === "grammar"
        ? [...new Set([...progress.completedLessons, event.key])]
        : progress.completedLessons,
    words:
      event.kind === "vocabulary"
        ? [...new Set([...progress.words, event.key])]
        : progress.words,
    reading:
      event.kind === "reading"
        ? [...new Set([...progress.reading, event.key])]
        : progress.reading,
  });
}
