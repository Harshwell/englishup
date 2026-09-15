import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyProgress,
  recordActivity,
  restoreProgress,
  localDay,
  streakFor,
  longestStreak,
} from "../lib/study-progress.mjs";

const event = { kind: "grammar", key: "articles", label: "Articles", xp: 20 };
test("first visit creates a versioned empty record", () => {
  assert.deepEqual(restoreProgress(null, null), emptyProgress());
});
test("legacy migration keeps XP, unique lessons and activity counters", () => {
  const result = restoreProgress(
    null,
    JSON.stringify({
      xp: 340,
      doneL: ["articles", "articles"],
      vocabN: 12,
      readN: 3,
      chatN: 4,
      activeDates: ["2026-09-14"],
    }),
  );
  assert.equal(result.xp, 340);
  assert.deepEqual(result.completedLessons, ["articles"]);
  assert.equal(result.legacyWords, 12);
  assert.equal(result.legacyReading, 3);
  assert.equal(result.legacyChat, 4);
});
test("same lesson cannot grant XP twice in one day, including after reload", () => {
  const now = new Date(2026, 8, 15, 10);
  const first = recordActivity(emptyProgress(), event, now);
  const restored = restoreProgress(JSON.stringify(first), null);
  const second = recordActivity(restored, event, now);
  assert.equal(second.xp, 20);
  assert.equal(second.activities.length, 1);
  assert.equal(second.dailyXp[localDay(now)], 20);
  assert.deepEqual(second.completedLessons, ["articles"]);
});
test("another day rewards review but does not duplicate completion", () => {
  const first = recordActivity(
    emptyProgress(),
    event,
    new Date(2026, 8, 14, 10),
  );
  const second = recordActivity(first, event, new Date(2026, 8, 15, 10));
  assert.equal(second.xp, 40);
  assert.equal(second.completedLessons.length, 1);
});
test("yesterday's streak remains valid before today's first activity", () => {
  assert.equal(
    streakFor(["2026-09-13", "2026-09-14"], new Date(2026, 8, 15, 10)),
    2,
  );
  assert.equal(streakFor(["2026-09-13"], new Date(2026, 8, 15, 10)), 0);
  assert.equal(longestStreak(["2026-08-01", "2026-08-02", "2026-08-03"]), 3);
});
test("invalid storage is rejected rather than silently overwritten", () => {
  assert.throws(() => restoreProgress('{"version":2,"xp":-1}', null));
  assert.throws(() => restoreProgress(null, '{"xp":"not a number"}'));
});
