"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";

const QUESTIONS = [
  {
    type: "grammar",
    question: "Choose the best sentence.",
    options: [
      "I have finished the report yesterday.",
      "I finished the report yesterday.",
      "I have finish the report yesterday.",
      "I finishing the report yesterday."
    ],
    answer: 1,
    explanation: "Finished past time such as yesterday normally takes simple past."
  },
  {
    type: "vocab",
    question: "What is the closest meaning of 'allocate' in academic English?",
    options: ["to ignore", "to distribute for a purpose", "to complain", "to delay forever"],
    answer: 1,
    explanation: "Allocate means assign or distribute resources, time, or money."
  },
  {
    type: "reading",
    question: "In IELTS reading, what should you do first for a heading-matching task?",
    options: ["Translate every word", "Read all answer choices only", "Identify the main idea of each paragraph", "Skip the passage entirely"],
    answer: 2,
    explanation: "Heading tasks depend on the main idea, not every detail."
  },
  {
    type: "grammar",
    question: "Which sentence uses an article correctly?",
    options: ["She bought an university guide.", "She bought a university guide.", "She bought university guide.", "She bought the university guide generally."],
    answer: 1,
    explanation: "University begins with a /ju:/ sound, so 'a' is correct."
  },
  {
    type: "vocab",
    question: "Which word best fits this sentence: 'Researchers need ___ data before drawing conclusions.'",
    options: ["reliable", "awkward", "casual", "tiny"],
    answer: 0,
    explanation: "Reliable data means trustworthy data."
  },
  {
    type: "reading",
    question: "True / False / Not Given questions are tricky because...",
    options: ["all statements are always true", "you must separate contradiction from missing information", "the passage uses only pictures", "grammar does not matter"],
    answer: 1,
    explanation: "The hardest part is distinguishing false from not given."
  },
  {
    type: "grammar",
    question: "Choose the best passive sentence.",
    options: ["The report was submit last night.", "The report was submitted last night.", "The report submitted was last night.", "The report was submitting last night."],
    answer: 1,
    explanation: "Passive voice needs be + past participle."
  },
  {
    type: "vocab",
    question: "Which pair is closest in meaning?",
    options: ["significant = important", "bias = fairness", "enhance = reduce", "resilience = weakness"],
    answer: 0,
    explanation: "Significant usually means important or noticeable."
  }
];

function getBand(score) {
  if (score <= 2) return { level: "A2-B1", note: "Fondasi ada, tapi masih bocor di grammar dan reading dasar.", focus: ["Articles", "Present Perfect", "daily_convo", "Beginner Reading"] };
  if (score <= 4) return { level: "B1-B2", note: "Sudah punya basis yang layak, tapi konsistensi dan ketelitian masih perlu naik.", focus: ["Passive Voice", "IELTS Academic Vocab", "Intermediate Reading", "Conversation"] };
  if (score <= 6) return { level: "B2", note: "Cukup kuat untuk latihan IELTS yang lebih serius, tapi precision masih perlu diasah.", focus: ["Conditionals", "Tech & AI Vocab", "Advanced Reading", "Writing Feedback"] };
  return { level: "B2+-C1", note: "Fondasi sudah bagus. Sekarang fokus ke refinement, range, dan IELTS pressure performance.", focus: ["Reported Speech", "Business Vocab", "Advanced Reading", "Timed Practice"] };
}

export default function PretestPage() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => QUESTIONS.filter((q, i) => Number(answers[i]) === q.answer).length, [answers]);
  const result = getBand(score);

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <section className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-800 to-indigo-800 text-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">EnglishUp Placement</p>
          <h1 className="mt-2 text-3xl font-black">Quick Placement Pretest</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200 leading-relaxed">Tes cepat ini dipakai untuk memetakan level awal secara praktis. Bukan tes akademik formal, tapi cukup untuk nentuin starting point yang masuk akal.</p>
        </header>

        <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-5">
          {QUESTIONS.map((q, i) => (
            <article key={i} className="space-y-3 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{q.type}</div>
                <h2 className="mt-1 text-base font-bold text-slate-900">{i + 1}. {q.question}</h2>
              </div>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  let cls = "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50";
                  if (Number(answers[i]) === oi) cls = "border-indigo-500 bg-indigo-50 text-indigo-800";
                  if (submitted) {
                    if (oi === q.answer) cls = "border-emerald-500 bg-emerald-50 text-emerald-800";
                    else if (Number(answers[i]) === oi) cls = "border-rose-400 bg-rose-50 text-rose-700";
                    else cls = "border-slate-100 text-slate-400";
                  }
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers((prev) => ({ ...prev, [i]: oi }))}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">💡 {q.explanation}</p>}
            </article>
          ))}

          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length < QUESTIONS.length}
              className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-40 hover:bg-slate-800"
            >
              Submit Pretest
            </button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl bg-indigo-50 border border-indigo-200 p-5">
                <div className="text-sm font-bold text-indigo-700 uppercase tracking-[0.18em]">Result</div>
                <div className="mt-2 text-4xl font-black text-slate-900">{score}/{QUESTIONS.length}</div>
                <div className="mt-2 text-lg font-bold text-indigo-700">Estimated level: {result.level}</div>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">{result.note}</p>
              </div>

              <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
                <h3 className="text-base font-black text-slate-900">Recommended next focus</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {result.focus.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/" className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Back to EnglishUp</Link>
                <Link href="/flashcards" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Open Flashcards</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
