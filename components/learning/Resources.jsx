"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import {
  dictionaryResultSchema,
  resourceCatalog,
} from "../../lib/resources.mjs";

export default function Resources() {
  const [word, setWord] = useState("");
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const active = useRef(null);
  useEffect(() => () => active.current?.abort(), []);
  async function search(event) {
    event.preventDefault();
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const timer = setTimeout(() => controller.abort(), 10000);
    setLoading(true);
    setError("");
    setItem(null);
    try {
      const response = await fetch(
        `/api/resources?word=${encodeURIComponent(word.trim())}`,
        { signal: controller.signal },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? "Kata belum tersedia. Periksa ejaan atau coba bentuk dasarnya."
            : "Kamus belum bisa diakses. Coba lagi atau gunakan deck lokal.",
        );
      setItem(dictionaryResultSchema.parse(data.item));
    } catch (e) {
      if (active.current === controller)
        setError(
          e.name === "AbortError"
            ? "Pencarian terlalu lama. Silakan coba lagi."
            : e.message?.startsWith("K")
              ? e.message
              : "Respons kamus tidak valid. Silakan coba lagi.",
        );
    } finally {
      clearTimeout(timer);
      if (active.current === controller) setLoading(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Resource room</p>
          <h1>Follow your curiosity.</h1>
          <p>Kamus dan bacaan terbuka untuk memperluas latihan harianmu.</p>
        </div>
      </div>
      <section
        className="resource-dictionary"
        aria-labelledby="dictionary-title"
      >
        <p className="eyebrow">Free Dictionary API · tanpa akun</p>
        <h2 id="dictionary-title">Satu kata, lebih banyak konteks.</h2>
        <form onSubmit={search}>
          <label htmlFor="dictionary-word">Kata bahasa Inggris</label>
          <div className="resource-search">
            <input
              id="dictionary-word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. resilience"
              required
              maxLength={50}
              pattern="[a-zA-Z]+([-'][a-zA-Z]+)*"
              autoComplete="off"
            />
            <button className="button primary" disabled={loading} type="submit">
              <Search size={18} />
              {loading ? "Mencari…" : "Cari kata"}
            </button>
          </div>
        </form>
        <p className="resource-note">
          Kata pencarian dikirim ke DictionaryAPI.dev. Materi inti tetap
          tersedia jika kamus sedang offline.
        </p>
        {loading && <p role="status">Mengambil definisi…</p>}
        {error && <p role="alert">{error}</p>}
        {item && (
          <div className="dictionary-result" aria-live="polite">
            <h3>
              {item.word} <small>{item.phonetic}</small>
            </h3>
            <ol>
              {item.definitions.map((d, i) => (
                <li key={i}>
                  <strong>{d.partOfSpeech}</strong>
                  <p>{d.definition}</p>
                </li>
              ))}
            </ol>
            <p>
              Definisi dari DictionaryAPI.dev.{" "}
              <a
                href={item.license.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.license.name} ↗
              </a>
            </p>
            {item.sourceUrls.map((url, i) => (
              <a
                className="resource-source"
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Sumber & kontributor {i + 1} ↗
              </a>
            ))}
          </div>
        )}
      </section>
      <div className="page-heading">
        <div>
          <h2>Baca di luar lesson.</h2>
          <p>
            Referensi eksternal; kontennya dikelola komunitas masing-masing.
          </p>
        </div>
      </div>
      <div className="resource-grid">
        {resourceCatalog.map((resource) => (
          <article className="resource-card" key={resource.title}>
            <p className="eyebrow">{resource.tag}</p>
            <h3>{resource.title}</h3>
            <p>{resource.detail}</p>
            <small>{resource.license}</small>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              Buka sumber <ArrowUpRight size={17} />
              <span className="sr-only"> di tab baru</span>
            </a>
          </article>
        ))}
      </div>
    </>
  );
}
