"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProgressBar, QuizQuestion } from "../../components/learning/StudyUI";

const QUESTIONS = [
  {
    type: "Grammar",
    question: "Choose the best sentence.",
    options: [
      "I have finished the report yesterday.",
      "I finished the report yesterday.",
      "I have finish the report yesterday.",
      "I finishing the report yesterday.",
    ],
    answer: 1,
    explanation:
      "Finished past time such as yesterday normally takes simple past.",
  },
  {
    type: "Vocabulary",
    question: "What is the closest meaning of 'allocate' in academic English?",
    options: [
      "to ignore",
      "to distribute for a purpose",
      "to complain",
      "to delay forever",
    ],
    answer: 1,
    explanation:
      "Allocate means assign or distribute resources, time, or money.",
  },
  {
    type: "Reading",
    question:
      "In IELTS reading, what should you do first for a heading-matching task?",
    options: [
      "Translate every word",
      "Read all answer choices only",
      "Identify the main idea of each paragraph",
      "Skip the passage entirely",
    ],
    answer: 2,
    explanation: "Heading tasks depend on the main idea, not every detail.",
  },
  {
    type: "Grammar",
    question: "Which sentence uses an article correctly?",
    options: [
      "She bought an university guide.",
      "She bought a university guide.",
      "She bought university guide.",
      "She bought the university guide generally.",
    ],
    answer: 1,
    explanation: "University begins with a /ju:/ sound, so 'a' is correct.",
  },
  {
    type: "Vocabulary",
    question:
      "Which word best fits this sentence: 'Researchers need ___ data before drawing conclusions.'",
    options: ["reliable", "awkward", "casual", "tiny"],
    answer: 0,
    explanation: "Reliable data means trustworthy data.",
  },
  {
    type: "Reading",
    question: "True / False / Not Given questions are tricky because...",
    options: [
      "all statements are always true",
      "you must separate contradiction from missing information",
      "the passage uses only pictures",
      "grammar does not matter",
    ],
    answer: 1,
    explanation:
      "Distinguish a contradiction (False) from information the passage does not mention (Not Given).",
  },
  {
    type: "Grammar",
    question: "Choose the best passive sentence.",
    options: [
      "The report was submit last night.",
      "The report was submitted last night.",
      "The report submitted was last night.",
      "The report was submitting last night.",
    ],
    answer: 1,
    explanation: "Passive voice needs be + past participle.",
  },
  {
    type: "Vocabulary",
    question: "Which pair is closest in meaning?",
    options: [
      "significant = important",
      "bias = fairness",
      "enhance = reduce",
      "resilience = weakness",
    ],
    answer: 0,
    explanation: "Significant usually means important or noticeable.",
  },
];
export default function PretestPage() {
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [review, setReview] = useState(false);
  const questionRef = useRef(null);
  useEffect(() => {
    questionRef.current?.focus({ preventScroll: true });
  }, [index, submitted, review]);
  const score = QUESTIONS.filter((q, i) => answers[i] === q.answer).length;
  const focus =
    score <= 4
      ? [
          "Articles dan penanda tense",
          "Vocabulary dalam konteks",
          "Ide utama dalam reading",
        ]
      : [
          "Kalimat kompleks yang akurat",
          "Argumen dan bukti pendukung",
          "Revisi tulisan dengan feedback",
        ];
  return (
    <main className="placement-page">
      <header className="placement-top">
        <Link href="/" className="wordmark">
          English<span>Up</span>.
        </Link>
        <Link className="back-button" href="/">
          <ChevronLeft size={17} />
          Ruang belajar
        </Link>
      </header>
      <section className="placement-intro">
        <p className="eyebrow">Placement check · 8 pertanyaan</p>
        <h1>A good place to start.</h1>
        <p>
          Kenali fondasi grammar, vocabulary, dan reading-mu. Hasil ini membantu
          memilih fokus latihan, bukan sertifikasi CEFR atau skor IELTS.
        </p>
      </section>
      <section className="placement-quiz" ref={questionRef} tabIndex={-1}>
        {submitted && !review ? (
          <div className="placement-result">
            <p className="eyebrow">Titik awalmu</p>
            <span className="result-score">
              {score}
              <small> / {QUESTIONS.length}</small>
            </span>
            <h2>
              {score <= 4
                ? "Let's build your foundation."
                : "Ready to go a little further."}
            </h2>
            <p>
              {score <= 4
                ? "Mulai dengan struktur inti dan latihan singkat yang konsisten."
                : "Dasar yang baik. Gunakan materi dalam argumen, percakapan, dan tulisan."}
            </p>
            <ul>
              {focus.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="small-note">
              Delapan pertanyaan tidak cukup untuk menilai kemampuan bahasa
              secara menyeluruh. Gunakan hasil ini sebagai panduan latihan saja.
            </p>
            <div className="button-row">
              <Link className="button primary" href="/">
                Buka jalur belajar
              </Link>
              <button
                className="button secondary"
                onClick={() => {
                  setReview(true);
                  setIndex(0);
                }}
              >
                Review jawaban
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="section-title">
              <span className="eyebrow">{QUESTIONS[index].type}</span>
              <span className="small-note">
                {index + 1} / {QUESTIONS.length}
              </span>
            </div>
            <ProgressBar
              value={Object.keys(answers).length}
              max={QUESTIONS.length}
              label="Progres placement check"
            />
            <QuizQuestion
              question={QUESTIONS[index]}
              index={index}
              answer={answers[index]}
              onAnswer={(value) =>
                setAnswers((a) => ({ ...a, [index]: value }))
              }
              checked={submitted}
            />
            <div className="button-row">
              <button
                className="button secondary"
                onClick={() => setIndex((i) => i - 1)}
                disabled={index === 0}
              >
                <ChevronLeft size={17} />
                Sebelumnya
              </button>
              {index < QUESTIONS.length - 1 ? (
                <button
                  className="button primary"
                  disabled={answers[index] === undefined}
                  onClick={() => setIndex((i) => i + 1)}
                >
                  Berikutnya
                  <ChevronRight size={17} />
                </button>
              ) : (
                <button
                  className="button primary"
                  disabled={Object.keys(answers).length !== QUESTIONS.length}
                  onClick={() => {
                    setSubmitted(true);
                    setReview(false);
                  }}
                >
                  Lihat hasil
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
