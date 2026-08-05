#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataRoot = path.join(repoRoot, 'public', 'data');
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

async function collectJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectJsonFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.json') ? [fullPath] : [];
  }));
  return files.flat().sort();
}

function formatPath(file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, '/');
}

function structuralValidate(json, file) {
  if (json === null || typeof json !== 'object') {
    throw new Error(`${formatPath(file)} must contain a JSON object or array`);
  }
}

function createSchemas(z) {
  const nonEmptyString = z.string().min(1);
  const stringArray = z.array(z.string());

  const flashcardSchema = z.array(z.object({
    front: nonEmptyString,
    back: z.object({
      definition: nonEmptyString,
      phonetic: z.string(),
      example: nonEmptyString,
      synonyms: stringArray,
      antonyms: stringArray,
      level: nonEmptyString,
      frequency: nonEmptyString,
      audio: z.string(),
    }),
    topic: nonEmptyString,
  }));

  const vocabSchema = z.object({
    words: z.array(z.object({
      word: nonEmptyString,
      pronunciation: z.string(),
      partOfSpeech: nonEmptyString,
      definition: nonEmptyString,
      indonesian: nonEmptyString,
      level: nonEmptyString,
      ieltsBand: nonEmptyString,
      example: nonEmptyString,
      collocations: stringArray,
      synonyms: stringArray,
    })),
  });

  const grammarSchema = z.object({
    grammarChart: z.object({
      title: nonEmptyString,
      sections: z.array(z.record(z.string(), z.string())),
    }),
    explanation: nonEmptyString,
    keyRules: z.array(z.object({ rule: nonEmptyString, example: nonEmptyString })),
    examples: z.array(z.object({ sentence: nonEmptyString, explanation: nonEmptyString })),
  }).passthrough();

  const readingSchema = z.array(z.object({
    title: nonEmptyString,
    topic: nonEmptyString,
    difficulty: nonEmptyString,
    passage: nonEmptyString,
    vocabulary: z.array(z.object({ word: nonEmptyString, definition: nonEmptyString })),
    questions: z.array(z.object({
      id: z.union([z.string(), z.number()]),
      type: nonEmptyString,
      question: nonEmptyString,
    }).passthrough()),
  }).passthrough());

  const manifestSchema = z.object({
    generatedAt: nonEmptyString,
    savedCount: z.number().int().nonnegative(),
    errors: stringArray,
    providers: z.record(z.string(), z.boolean()),
  });

  return { flashcardSchema, vocabSchema, grammarSchema, readingSchema, manifestSchema };
}

function schemaForFile(file, schemas) {
  const relative = formatPath(file);
  if (relative === 'public/data/manifest.json') return schemas.manifestSchema;
  if (relative.startsWith('public/data/flashcards/')) return schemas.flashcardSchema;
  if (relative.startsWith('public/data/vocab/')) return schemas.vocabSchema;
  if (relative.startsWith('public/data/grammar/')) return schemas.grammarSchema;
  if (relative.startsWith('public/data/reading/')) return schemas.readingSchema;
  return null;
}

async function loadZod() {
  try {
    return await import('zod');
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    if (isCI) {
      throw new Error('Zod dependency is required for CI content validation. Run npm install before npm run validate:content.');
    }
    console.warn('Warning: Zod dependency is unavailable; running local structural JSON checks only. CI must install dependencies and run full Zod validation.');
    return null;
  }
}

const jsonFiles = await collectJsonFiles(dataRoot);
const zodModule = await loadZod();
const schemas = zodModule ? createSchemas(zodModule.z ?? zodModule) : null;
let failures = 0;

for (const file of jsonFiles) {
  try {
    const raw = await readFile(file, 'utf8');
    const json = JSON.parse(raw);
    if (!schemas) {
      structuralValidate(json, file);
    } else {
      const schema = schemaForFile(file, schemas);
      if (schema) schema.parse(json);
      else structuralValidate(json, file);
    }
  } catch (error) {
    failures += 1;
    console.error(`Invalid content in ${formatPath(file)}:`);
    console.error(error instanceof Error ? error.message : error);
  }
}

if (failures > 0) {
  console.error(`Content validation failed with ${failures} error(s).`);
  process.exit(1);
}

const mode = schemas ? 'full Zod validation' : 'local structural fallback';
console.log(`Validated ${jsonFiles.length} content file(s) with ${mode}.`);
