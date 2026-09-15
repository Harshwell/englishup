import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchDictionary,
  normalizeDictionary,
  wordQuerySchema,
} from "../lib/resources.mjs";
import { extraGrammar } from "../lib/extra-grammar.mjs";
const entry = {
  word: "study",
  license: {
    name: "CC BY-SA 3.0",
    url: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  sourceUrls: ["https://en.wiktionary.org/wiki/study"],
  meanings: [
    {
      partOfSpeech: "noun",
      definitions: [{ definition: "Learning through attention." }],
    },
  ],
};
test("dictionary preserves attribution and rejects unsafe or missing metadata", () => {
  assert.equal(normalizeDictionary([entry]).sourceUrls[0], entry.sourceUrls[0]);
  assert.throws(() => normalizeDictionary([{ ...entry, license: undefined }]));
  assert.throws(() =>
    normalizeDictionary([{ ...entry, sourceUrls: ["javascript:alert(1)"] }]),
  );
  assert.equal(wordQuerySchema.safeParse("../admin").success, false);
});
test("dictionary distinguishes not found, outages and valid results", async () => {
  assert.equal(
    await fetchDictionary(
      "unknown",
      async () => new Response("", { status: 404 }),
    ),
    null,
  );
  await assert.rejects(
    fetchDictionary("study", async () => new Response("", { status: 500 })),
  );
  const data = await fetchDictionary("study", async (url) => {
    assert.ok(url.endsWith("/study"));
    return Response.json([entry]);
  });
  assert.equal(data.word, "study");
});
test("five original lessons contain contextual questions and valid answer indexes", () => {
  assert.equal(Object.keys(extraGrammar).length, 5);
  for (const lesson of Object.values(extraGrammar)) {
    assert.equal(lesson.quiz.length, 4);
    for (const q of lesson.quiz) {
      assert.ok(q.options[q.answer]);
      assert.ok(q.explanation.length > 20);
    }
  }
});
