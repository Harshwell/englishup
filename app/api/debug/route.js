import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ status: "DISABLED" }, { status: 404 });
  }

  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY);

  return NextResponse.json({
    status: "OK",
    env: {
      anthropicConfigured: hasAnthropicKey,
      geminiConfigured: hasGeminiKey,
      openRouterConfigured: hasOpenRouterKey
    }
  });
}
