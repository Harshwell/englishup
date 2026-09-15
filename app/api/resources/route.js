import { NextResponse } from "next/server";
import { fetchDictionary, wordQuerySchema } from "../../../lib/resources.mjs";
export async function GET(request) {
  const parsed = wordQuerySchema.safeParse(
    new URL(request.url).searchParams.get("word"),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Masukkan satu kata Inggris (maksimal 50 karakter)." },
      { status: 400 },
    );
  try {
    const item = await fetchDictionary(parsed.data);
    if (!item)
      return NextResponse.json(
        {
          error:
            "Kata belum tersedia. Periksa ejaan atau coba bentuk dasarnya.",
        },
        { status: 404 },
      );
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json(
      {
        error:
          "Kamus belum bisa diakses. Coba lagi atau lanjutkan dengan deck lokal.",
      },
      { status: 503 },
    );
  }
}
