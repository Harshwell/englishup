import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ status: "ERROR", reason: "ANTHROPIC_API_KEY not set" });

  // Only show first/last 4 chars for safety
  const masked = key.slice(0, 10) + "..." + key.slice(-4);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 20,
        messages: [{ role: "user", content: "Say: OK" }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ status: "API_ERROR", detail: data?.error, key: masked });
    return NextResponse.json({ status: "OK", key: masked, reply: data.content?.[0]?.text });
  } catch (e) {
    return NextResponse.json({ status: "FETCH_ERROR", detail: e.message, key: masked });
  }
}
