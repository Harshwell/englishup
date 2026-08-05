import { NextResponse } from "next/server";
import { getConversationContext, getTrustedArticles, lookupDictionary, recordArticleFeedback } from "../../../lib/api-library";
import { dictionaryResponseSchema, feedbackResponseSchema, libraryItemsResponseSchema, parseOrNull } from "../../../lib/schemas/englishup-schemas.mjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const type = String(body?.type || "").toLowerCase();

    if (type === "articles") {
      const query = String(body?.query || "education");
      const limit = Math.min(6, Math.max(1, Number(body?.limit || 4)));
      const topicKey = String(body?.topicKey || "");
      const cefr = String(body?.cefr || "intermediate");
      const items = await getTrustedArticles(query, limit, { topicKey, cefr });
      return NextResponse.json(parseOrNull(libraryItemsResponseSchema, { items }) || { items: [] });
    }

    if (type === "dictionary") {
      const word = String(body?.word || "study");
      const item = await lookupDictionary(word);
      return NextResponse.json(parseOrNull(dictionaryResponseSchema, { item }) || { item: { word, definition: "", phonetic: "", example: "", synonyms: [] } });
    }

    if (type === "conversation") {
      const text = String(body?.text || "");
      const items = await getConversationContext(text);
      return NextResponse.json(parseOrNull(libraryItemsResponseSchema, { items }) || { items: [] });
    }

    if (type === "feedback") {
      const topicKey = String(body?.topicKey || "default");
      const signal = String(body?.signal || "click");
      const metrics = recordArticleFeedback({ topicKey, signal });
      return NextResponse.json(parseOrNull(feedbackResponseSchema, { ok: true, metrics }) || { ok: true, metrics: {} });
    }

    return NextResponse.json({ error: "Unsupported library type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
