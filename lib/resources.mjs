import { z } from "zod";

const httpsUrl = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === "https:");
export const dictionaryResultSchema = z.object({
  word: z.string().min(1).max(100),
  phonetic: z.string().max(200),
  definitions: z
    .array(
      z.object({
        partOfSpeech: z.string().max(80),
        definition: z.string().min(1).max(3000),
      }),
    )
    .min(1)
    .max(6),
  license: z.object({ name: z.string().min(1).max(100), url: httpsUrl }),
  sourceUrls: z.array(httpsUrl).min(1).max(5),
});
export const wordQuerySchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[a-zA-Z]+(?:[-'][a-zA-Z]+)*$/);
export function normalizeDictionary(raw) {
  const entry = z
    .array(
      z.object({
        word: z.string(),
        phonetic: z.string().optional(),
        license: z.object({ name: z.string(), url: z.string() }),
        sourceUrls: z.array(z.string()),
        meanings: z.array(
          z.object({
            partOfSpeech: z.string(),
            definitions: z.array(z.object({ definition: z.string() })),
          }),
        ),
      }),
    )
    .min(1)
    .parse(raw)[0];
  return dictionaryResultSchema.parse({
    word: entry.word,
    phonetic: entry.phonetic || "",
    license: entry.license,
    sourceUrls: entry.sourceUrls.slice(0, 5),
    definitions: entry.meanings
      .flatMap((m) =>
        m.definitions.slice(0, 2).map((d) => ({
          partOfSpeech: m.partOfSpeech,
          definition: d.definition,
        })),
      )
      .slice(0, 6),
  });
}
export async function fetchDictionary(word, fetcher = fetch) {
  const query = wordQuerySchema.parse(word).toLowerCase();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetcher(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`,
      { signal: controller.signal, cache: "no-store" },
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("dictionary_unavailable");
    return normalizeDictionary(await response.json());
  } finally {
    clearTimeout(timer);
  }
}
export const resourceCatalog = [
  {
    title: "Wikibooks · English",
    tag: "Grammar & reading",
    url: "https://en.wikibooks.org/wiki/English",
    detail:
      "Buku kolaboratif untuk mengeksplorasi struktur bahasa. Pilih satu bagian, lalu tulis rangkuman dengan kata-katamu sendiri.",
    license: "Konten terbuka; cek atribusi dan lisensi pada halaman sumber.",
  },
  {
    title: "Tatoeba",
    tag: "Sentences in context",
    url: "https://tatoeba.org/en/sentences/search?from=eng&to=ind&query=",
    detail:
      "Cari contoh kalimat Inggris dan bandingkan konteksnya. Terjemahan komunitas perlu dibaca secara kritis.",
    license:
      "Teks umumnya CC BY 2.0 FR; lisensi audio berbeda per kontributor.",
  },
  {
    title: "Simple English Wikipedia",
    tag: "Extensive reading",
    url: "https://simple.wikipedia.org/wiki/Main_Page",
    detail:
      "Bacaan ensiklopedia dengan bahasa lebih sederhana. Catat lima kata baru dan satu gagasan utama setelah membaca.",
    license:
      "Cek lisensi halaman dan riwayat kontributor; level bukan penilaian CEFR.",
  },
];
