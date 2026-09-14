import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  getStudyContent,
  TOPICS,
  CATEGORIES,
  normalizeQuestions,
  isCorrectAnswer,
} from "../lib/study-content.js";

test("all shipped grammar, reading and vocabulary payloads load with validated answers", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (path) => {
    try {
      const body = await readFile(
        new URL(`../public${path}`, import.meta.url),
        "utf8",
      );
      return new Response(body);
    } catch {
      return new Response("", { status: 404 });
    }
  };
  try {
    for (const topic of TOPICS) {
      const result = await getStudyContent("grammar", topic.id);
      assert.ok(result.data.quiz.length > 0, topic.id);
      if (["articles", "present_perfect", "passive_voice"].includes(topic.id))
        assert.equal(result.source, "static");
    }
    for (const category of CATEGORIES)
      assert.equal(
        (await getStudyContent("vocabulary", category.id)).source,
        "static",
      );
    const reading = await getStudyContent("reading", "all");
    assert.equal(reading.source, "static");
    assert.equal(reading.data.length, 2);
    assert.equal(reading.data[0].questions.length, 7);
    assert.equal(reading.data[1].questions.length, 5);
  } finally {
    globalThis.fetch = original;
  }
});
test("string, letter and multi-blank answers map to the correct choices", () => {
  const qs = normalizeQuestions([
    { question: "An article", options: ["a", "an", "the", "-"], answer: "an" },
    { question: "Passive", options: ["Wrong", "Right"], answer: "B" },
    {
      question: "Two blanks",
      options: ["a", "an", "the", "-"],
      answer: ["the", "an"],
    },
  ]);
  assert.equal(qs[0].options[qs[0].answer], "an");
  assert.equal(qs[1].answer, 1);
  assert.equal(qs[2].options[qs[2].answer], "the / an");
});
test("short answers accept listed alternatives, capitalization and final punctuation", () => {
  const [question] = normalizeQuestions([
    { question: "What kind of model?", answer: "A hybrid model / Mixed model" },
  ]);
  assert.ok(isCorrectAnswer(question, "Hybrid model."));
  assert.ok(isCorrectAnswer(question, "mixed model"));
  assert.equal(isCorrectAnswer(question, "a different model"), false);
});
test("core content degrades to a validated local lesson on network failure", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("offline");
  };
  try {
    for (const kind of ["grammar", "vocabulary", "reading"])
      assert.equal(
        (
          await getStudyContent(
            kind,
            kind === "grammar" ? "articles" : "ielts_academic",
          )
        ).source,
        "fallback",
      );
  } finally {
    globalThis.fetch = original;
  }
});
