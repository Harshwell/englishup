import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { generateGrammarFromBase, generateGrammarLesson, generateReadingSet, generateVocabularySet } from "../../../lib/content-generation";
import { getFallbackVocab } from "../../../lib/fallback-content";
import { getTrustedArticles, lookupDictionary } from "../../../lib/api-library";

const CONTENT_ROOT = path.join(process.cwd(), "public", "data");

async function readJson(relativePath) {
  try {
    const fullPath = path.join(CONTENT_ROOT, relativePath);
    const raw = await fs.readFile(fullPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const type = String(body?.type || "").toLowerCase();
    const seed = String(body?.seed || Date.now());

    if (type === "reading") {
      const difficulty = String(body?.difficulty || "intermediate");
      const size = Math.min(3, Math.max(1, Number(body?.size || 1)));
      const passages = (await readJson("reading/passages.json")) || [];
      const payload = generateReadingSet({ passages, difficulty, size, seed });

      const enriched = await Promise.all(
        payload.map(async (item) => {
          const refs = await getTrustedArticles(item?.topic || item?.title || "education", 3);
          return {
            ...item,
            generatedMeta: {
              ...(item.generatedMeta || {}),
              references: refs.map((ref) => ({
                label: `${ref.source} — ${ref.title}`,
                url: ref.url
              }))
            }
          };
        })
      );

      return NextResponse.json({ items: enriched });
    }

    if (type === "vocab") {
      const category = String(body?.category || "ielts_academic");
      const count = Math.min(20, Math.max(5, Number(body?.count || 10)));
      const vocab = (await readJson(`vocab/${category}.json`)) || getFallbackVocab(category);
      const payload = generateVocabularySet({ vocab, category, count, seed });

      const enriched = await Promise.all(
        payload.map(async (item, idx) => {
          if (idx > 5) return item;
          const dict = await lookupDictionary(item.front);
          return {
            ...item,
            back: {
              ...item.back,
              definition: dict.definition || item.back.definition,
              phonetic: dict.phonetic || item.back.phonetic,
              example: dict.example || item.back.example,
              synonyms: dict.synonyms?.length ? dict.synonyms : item.back.synonyms
            }
          };
        })
      );

      return NextResponse.json({ items: enriched });
    }

    if (type === "grammar") {
      const topicId = String(body?.topicId || "articles");
      const staticData = await readJson(`grammar/${topicId}.json`);
      const payload = staticData
        ? generateGrammarFromBase({ base: staticData, topicId, seed })
        : generateGrammarLesson({ topicId, seed });

      const refs = await getTrustedArticles(topicId.replace(/_/g, " "), 2);

      return NextResponse.json({
        ...payload,
        generatedMeta: {
          ...(payload.generatedMeta || {}),
          references: refs.map((ref) => ({ label: `${ref.source} — ${ref.title}`, url: ref.url }))
        }
      });
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
