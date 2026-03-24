import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
    }

    const { prompt, max = 1200 } = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: max,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", JSON.stringify(data));
      return NextResponse.json({ error: data?.error?.message || "Anthropic API error" }, { status: response.status });
    }

    const text = data.content?.map((b) => (b.type === "text" ? b.text : "")).join("") || "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Route exception:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
