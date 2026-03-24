import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { prompt, max = 1200 } = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: max,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const text = data.content?.map((b) => (b.type === "text" ? b.text : "")).join("") || "";
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
