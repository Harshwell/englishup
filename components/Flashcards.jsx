"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Volume2,
} from "lucide-react";

const FALLBACK = [
  {
    front: "significant",
    back: {
      definition: "important or noticeable",
      phonetic: "/sɪgˈnɪf.ɪ.kənt/",
      example: "There has been a significant rise in online learning.",
      synonyms: ["important", "notable"],
      antonyms: ["minor"],
      level: "B2",
      frequency: "high",
      audio: "",
    },
  },
  {
    front: "allocate",
    back: {
      definition: "to give time, money, or resources for a purpose",
      phonetic: "/ˈæl.ə.keɪt/",
      example: "Students should allocate time for daily review.",
      synonyms: ["assign", "distribute"],
      antonyms: ["withhold"],
      level: "C1",
      frequency: "medium",
      audio: "",
    },
  },
];

async function loadDeck(level) {
  for (const path of [`/data/flashcards/${level}.json`, `/data/flashcards/b2.json`]) {
    try {
      const res = await fetch(path);
      if (res.ok) return await res.json();
    } catch {}
  }
  return FALLBACK;
}

export default function Flashcards({ standalone = false }) {
  const [level, setLevel] = useState("b2");
  const [cards, setCards] = useState(FALLBACK);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [memorized, setMemorized] = useState([]);

  const current = cards[index] || FALLBACK[0];

  useEffect(() => {
    loadDeck(level).then((data) => {
      setCards(Array.isArray(data) && data.length ? data : FALLBACK);
      setIndex(0);
      setFlipped(false);
    });
  }, [level]);

  const progress = useMemo(() => {
    if (!cards.length) return 0;
    return Math.round(((index + 1) / cards.length) * 100);
  }, [cards.length, index]);

  const speak = () => {
    const url = current?.back?.audio;
    if (url) new Audio(url).play().catch(() => {});
  };

  const markMemorized = () => {
    setMemorized((prev) =>
      prev.includes(current.front) ? prev : [...prev, current.front]
    );
    setFlipped(false);
    setIndex((prev) => (prev < cards.length - 1 ? prev + 1 : prev));
  };

  return (
    <main className={standalone ? "min-h-screen bg-slate-50 p-6" : "h-full"}>
      <section className="mx-auto max-w-4xl space-y-4">
        {standalone && (
          <header className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900">Flashcards</h1>
            <p className="text-sm text-slate-500">
              Vocabulary memorization with quick review flow.
            </p>
          </header>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700" htmlFor="deck-level">
            Deck
          </label>
          <select
            id="deck-level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
          >
            <option value="b2">B2 Core</option>
            <option value="c1">C1 Advanced</option>
          </select>
          <div className="ml-auto text-sm text-slate-500">
            {memorized.length} memorized · {progress}% viewed
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-100 mb-2">
              Flashcard
            </div>
            <div className="text-4xl font-black">{current?.front}</div>
            <div className="mt-2 text-emerald-100 text-sm">
              {current?.back?.phonetic}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {!flipped ? (
              <button
                onClick={() => setFlipped(true)}
                className="w-full rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 transition-colors"
                aria-label="Flip card"
              >
                Show meaning
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
                    Definition
                  </div>
                  <p className="text-sm text-slate-700">{current?.back?.definition}</p>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
                    Example
                  </div>
                  <p className="text-sm italic text-slate-700">
                    "{current?.back?.example}"
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">
                      Synonyms
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(current?.back?.synonyms || []).map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-1"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">
                      Antonyms
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(current?.back?.antonyms || []).map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs px-2.5 py-1"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2.5 py-1">
                    {current?.back?.level}
                  </span>
                  <span className="rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs px-2.5 py-1">
                    {current?.back?.frequency}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setFlipped((v) => !v)}
                className="flex-1 min-w-36 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                Flip
              </button>
              <button
                onClick={speak}
                className="flex-1 min-w-36 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Volume2 className="w-4 h-4 inline mr-2" />
                Audio
              </button>
              <button
                onClick={markMemorized}
                className="flex-1 min-w-36 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Mark memorized
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setIndex((i) => Math.max(0, i - 1));
                  setFlipped(false);
                }}
                disabled={index === 0}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Prev
              </button>

              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <button
                onClick={() => {
                  setIndex((i) => Math.min(cards.length - 1, i + 1));
                  setFlipped(false);
                }}
                disabled={index >= cards.length - 1}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>

              <button
                onClick={() => {
                  setIndex(0);
                  setFlipped(false);
                  setMemorized([]);
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
