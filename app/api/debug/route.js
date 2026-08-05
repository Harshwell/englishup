import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ status: "DISABLED" }, { status: 404 });
  }

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  return NextResponse.json({
    status: "OK",
    env: {
      geminiConfigured: hasGeminiKey,
      secondaryAiConfigured: false
    }
  });
}
