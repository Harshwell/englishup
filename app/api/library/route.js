import { NextResponse } from "next/server";
import { getConversationContext, getTrustedArticles, lookupDictionary } from "../../../lib/api-library";

export async function POST(req) {
  try {
    const body = await req.json();
    const type = String(body?.type || "").toLowerCase();

    if (type === "articles") {
      const query = String(body?.query || "education");
      const limit = Math.min(6, Math.max(1, Number(body?.limit || 4)));
      const items = await getTrustedArticles(query, limit);
      return NextResponse.json({ items });
    }

    if (type === "dictionary") {
      const word = String(body?.word || "study");
      const item = await lookupDictionary(word);
      return NextResponse.json({ item });
    }

    if (type === "conversation") {
      const text = String(body?.text || "");
      const items = await getConversationContext(text);
      return NextResponse.json({ items });
    }

    return NextResponse.json({ error: "Unsupported library type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
