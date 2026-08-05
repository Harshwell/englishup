import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const readJson = async (relativePath) => JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
const failures = [];
const check = (label, fn) => {
  try {
    fn();
    console.log(`✓ ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
    console.error(`✗ ${label}: ${error.message}`);
  }
};

let readingPassageSchema;
try {
  ({ readingPassageSchema } = await import("../lib/schemas/englishup-schemas.mjs"));
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
  if (process.env.CI === "true") {
    console.error("Zod is required for CI content validation. Run npm install before npm run validate:content.");
    process.exit(1);
  }
  console.warn("⚠ Zod is not installed in node_modules; using local-only structural validation fallback. CI will fail without Zod.");
}

const reading = await readJson("public/data/reading/passages.json");
check("reading passages match runtime schema", () => {
  if (readingPassageSchema) {
    readingPassageSchema.array().min(1).parse(reading);
    return;
  }
  if (!Array.isArray(reading) || reading.length < 1) throw new Error("expected reading passage array");
  for (const [index, passage] of reading.entries()) {
    if (!passage.title || !passage.topic || !passage.passage || !Array.isArray(passage.questions)) {
      throw new Error(`passage ${index} is missing title, topic, passage, or questions`);
    }
  }
});

const flashcardFiles = ["b2.json", "c1.json"];
let flashcardCount = 0;
for (const file of flashcardFiles) {
  const cards = await readJson(`public/data/flashcards/${file}`);
  flashcardCount += cards.length;
  check(`flashcards/${file} has usable cards`, () => {
    if (!Array.isArray(cards) || cards.length < 1) throw new Error("expected at least 1 card");
    for (const [index, card] of cards.entries()) {
      if (!card.front || !card.back?.definition) throw new Error(`card ${index} is missing front/back.definition`);
    }
  });
}

const grammarFiles = ["articles.json", "passive_voice.json", "present_perfect.json"];
for (const file of grammarFiles) {
  const lesson = await readJson(`public/data/grammar/${file}`);
  check(`grammar/${file} has static lesson structure`, () => {
    if (!lesson.explanation || !Array.isArray(lesson.examples) || !Array.isArray(lesson.quiz)) {
      throw new Error("expected explanation, examples, and quiz");
    }
  });
}

check("minimum static seed count per implemented skill", () => {
  if (flashcardCount < 10) throw new Error("expected at least 10 existing flashcards before normalization phase");
  if (reading.length < 1) throw new Error("expected at least 1 reading passage");
});

if (failures.length) {
  console.error("\nContent validation failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
