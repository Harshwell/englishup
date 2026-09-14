"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  Send,
  Volume2,
} from "lucide-react";
import {
  getStudyContent,
  chatResponseSchema,
  writingResponseSchema,
  postPractice,
  privateActivityKey,
  isCorrectAnswer,
} from "../../lib/study-content";
import {
  BackButton,
  ErrorState,
  Loading,
  ProgressBar,
  QuizQuestion,
  RichText,
} from "./StudyUI";

function useContent(kind, id) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    setError(false);
    getStudyContent(kind, id, controller.signal)
      .then(setResult)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [kind, id, attempt]);
  return { result, error, retry: () => setAttempt((a) => a + 1) };
}
function SourceNote({ source }) {
  return source === "fallback" ? (
    <p className="notice">
      Materi cadangan aktif. Latihan dan progres tetap bisa digunakan.
    </p>
  ) : null;
}
function PracticeQuiz({ questions, onComplete, onExit }) {
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const resultRef = useRef(null);
  const score = questions.filter((q, i) =>
    isCorrectAnswer(q, answers[i]),
  ).length;
  const answered = Object.values(answers).filter(
    (a) => typeof a === "number" || a.trim(),
  ).length;
  function submit(e) {
    e.preventDefault();
    if (checked || answered !== questions.length) return;
    setChecked(true);
    onComplete(score, questions.length);
  }
  useEffect(() => {
    if (checked) resultRef.current?.focus();
  }, [checked]);
  return (
    <form className="practice-quiz" onSubmit={submit}>
      <div className="section-title">
        <h2>Check your understanding</h2>
        <span className="small-note">
          {answered} / {questions.length} dijawab
        </span>
      </div>
      <ProgressBar
        value={answered}
        max={questions.length}
        label="Pertanyaan terjawab"
      />
      {questions.map((q, i) => (
        <QuizQuestion
          key={i}
          question={q}
          index={i}
          answer={answers[i]}
          onAnswer={(value) => setAnswers((a) => ({ ...a, [i]: value }))}
          checked={checked}
        />
      ))}
      {checked ? (
        <div className="quiz-result" ref={resultRef} tabIndex={-1}>
          <span className="result-score">
            {score}
            <small> / {questions.length}</small>
          </span>
          <h2>
            {score === questions.length
              ? "That's a clean finish."
              : "Sekarang kamu tahu bagian yang perlu diulang."}
          </h2>
          <p>
            Latihan selesai. Baca penjelasan di atas untuk memahami setiap
            jawaban.
          </p>
          <div className="button-row">
            <button type="button" className="button primary" onClick={onExit}>
              Selesai belajar
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setChecked(false);
                setAnswers({});
              }}
            >
              Ulangi quiz
            </button>
          </div>
          <p className="small-note">
            XP diberikan sekali per materi per hari. Review tetap tersedia.
          </p>
        </div>
      ) : (
        <button
          className="button primary"
          disabled={answered !== questions.length}
        >
          Periksa jawaban
        </button>
      )}
    </form>
  );
}
export function GrammarPractice({ topic, onBack, onComplete }) {
  const { result, error, retry } = useContent("grammar", topic.id);
  const quizRef = useRef(null);
  if (error) return <ErrorState retry={retry} />;
  if (!result) return <Loading label={`Membuka ${topic.title}…`} />;
  const data = result.data;
  return (
    <div className="lesson-page">
      <BackButton onClick={onBack}>Jalur belajar</BackButton>
      <div className="lesson-heading">
        <p className="eyebrow">Grammar studio · English foundations</p>
        <h1>{topic.title}</h1>
        <p>{topic.form}</p>
        <button
          className="button secondary"
          onClick={() => {
            quizRef.current?.scrollIntoView({ behavior: "smooth" });
            quizRef.current?.focus({ preventScroll: true });
          }}
        >
          Langsung ke quiz <ChevronRight size={17} />
        </button>
      </div>
      <SourceNote source={result.source} />
      <div className="lesson-body">
        <article className="lesson-notes">
          <p className="eyebrow">01 / Understand</p>
          <h2>Form, meaning & use.</h2>
          <p className="prose">
            <RichText>{data.explanation}</RichText>
          </p>
          {data.chart.length > 0 && (
            <details className="learning-details">
              <summary>Ringkasan struktur grammar</summary>
              <dl>
                {data.chart.map((row, i) => (
                  <div key={i}>
                    <dt>{row.title}</dt>
                    <dd>
                      <strong>{row.form}</strong>
                    </dd>
                    <dd>{row.meaning}</dd>
                    <dd>{row.use}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
          <ol className="rule-list">
            {data.keyRules.map((r, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                <p>
                  <RichText>{r}</RichText>
                </p>
              </li>
            ))}
          </ol>
          <h3>In a sentence</h3>
          <div className="example-list">
            {data.examples.map((e, i) => (
              <blockquote key={i}>
                <p lang="en">
                  <RichText>{e.sentence}</RichText>
                </p>
                <footer>
                  <RichText>{e.note}</RichText>
                </footer>
              </blockquote>
            ))}
          </div>
          {data.notes.length > 0 && (
            <details className="learning-details">
              <summary>Catatan untuk pembelajar Indonesia</summary>
              {data.notes.map((n, i) => (
                <p key={i}>
                  <RichText>{n}</RichText>
                </p>
              ))}
            </details>
          )}
          {data.mistakes.length > 0 && (
            <details className="learning-details">
              <summary>Kesalahan yang sering terjadi</summary>
              {data.mistakes.map((m, i) => (
                <div className="mistake-pair" key={i}>
                  {m.wrong && (
                    <p>
                      <span>Hindari</span>
                      <s>{m.wrong}</s>
                    </p>
                  )}
                  {m.right && (
                    <p>
                      <span>Gunakan</span>
                      <strong>{m.right}</strong>
                    </p>
                  )}
                  <p>
                    <RichText>{m.why}</RichText>
                  </p>
                </div>
              ))}
            </details>
          )}
          {data.tip && (
            <div className="practice-tip">
              <BookOpen size={20} />
              <p>
                <RichText>{data.tip}</RichText>
              </p>
            </div>
          )}
        </article>
        <section className="quiz-column" ref={quizRef} tabIndex={-1}>
          <PracticeQuiz
            questions={data.quiz}
            onComplete={() =>
              onComplete({
                kind: "grammar",
                key: topic.id,
                label: topic.title,
                xp: 20,
              })
            }
            onExit={onBack}
          />
        </section>
      </div>
    </div>
  );
}
const flashcardSchema = z
  .array(
    z.object({
      front: z.string().min(1),
      back: z.object({
        definition: z.string(),
        example: z.string(),
        phonetic: z.string().optional(),
        level: z.string().optional(),
        synonyms: z.array(z.string()).optional(),
        audio: z.string().optional(),
      }),
    }),
  )
  .min(1);
export function VocabularyPractice({ category, onBack, onComplete }) {
  const [cards, setCards] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState([]);
  const [source, setSource] = useState("static");
  const [audioNote, setAudioNote] = useState("");
  const [canSpeak, setCanSpeak] = useState(false);
  const wordRef = useRef(null);
  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setCards(null);
    setError(false);
    async function load() {
      try {
        if (category.flashcards) {
          const response = await fetch(`/data/flashcards/${category.id}.json`, {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("deck_unavailable");
          const deck = flashcardSchema.parse(await response.json());
          setCards(
            deck.map((c) => ({
              word: c.front,
              definition: c.back.definition,
              example: c.back.example,
              pronunciation: c.back.phonetic,
              level: c.back.level,
              synonyms: c.back.synonyms || [],
              audio: c.back.audio,
            })),
          );
        } else {
          const out = await getStudyContent(
            "vocabulary",
            category.id,
            controller.signal,
          );
          setCards(out.data);
          setSource(out.source);
        }
      } catch {
        if (controller.signal.aborted) return;
        try {
          const out = await getStudyContent(
            "vocabulary",
            "ielts_academic",
            controller.signal,
          );
          setCards(out.data);
          setSource("fallback");
        } catch {
          if (!controller.signal.aborted) setError(true);
        }
      }
    }
    load();
    return () => controller.abort();
  }, [category.id, category.flashcards, attempt]);
  function go(next) {
    setIndex(next);
    setFlipped(false);
    setAudioNote("");
    wordRef.current?.focus({ preventScroll: true });
  }
  function mark() {
    onComplete({
      kind: "vocabulary",
      key: cards[index].word.toLowerCase(),
      label: cards[index].word,
      xp: 5,
    });
    setReviewed((r) => [...new Set([...r, index])]);
    if (index < cards.length - 1) go(index + 1);
  }
  function speak() {
    setAudioNote("");
    if (cards[index].audio) {
      new Audio(cards[index].audio)
        .play()
        .catch(() =>
          setAudioNote(
            "Audio tidak dapat diputar. Coba lagi saat koneksi tersedia.",
          ),
        );
      return;
    }
    if (canSpeak) {
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(cards[index].word);
      speech.lang = "en-GB";
      speech.rate = 0.85;
      speech.onerror = () =>
        setAudioNote("Suara bahasa Inggris belum tersedia di browser ini.");
      window.speechSynthesis.speak(speech);
    }
  }
  if (error) return <ErrorState retry={() => setAttempt((a) => a + 1)} />;
  if (!cards) return <Loading label="Menyiapkan deck vocabulary…" />;
  const word = cards[index];
  return (
    <div className="vocabulary-page">
      <BackButton onClick={onBack}>Semua deck</BackButton>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Vocabulary studio</p>
          <h1>{category.title}</h1>
          <p>Coba ingat maknanya sebelum membalik kartu.</p>
        </div>
        <span className="completion-count">
          {reviewed.length} / {cards.length} direview
        </span>
      </div>
      <SourceNote source={source} />
      <div className="flashcard-area">
        <div className="card-toolbar">
          <span>
            Kartu {index + 1} dari {cards.length}
          </span>
          <span>{word.level || "Vocabulary"}</span>
        </div>
        <ProgressBar
          value={reviewed.length}
          max={cards.length}
          label="Kartu direview"
        />
        <article className={`word-card ${flipped ? "flipped" : ""}`}>
          <div className="word-front">
            <p className="eyebrow">Recall the meaning</p>
            <h2 ref={wordRef} tabIndex={-1} lang="en">
              {word.word}
            </h2>
            <p>{word.pronunciation}</p>
            {(canSpeak || word.audio) && (
              <button className="text-button" onClick={speak}>
                <Volume2 size={18} />
                Dengarkan
              </button>
            )}
            {audioNote && (
              <p className="small-note" role="status">
                {audioNote}
              </p>
            )}
          </div>
          {flipped ? (
            <div className="word-back">
              <p className="definition">{word.definition}</p>
              {word.indonesian && <p>{word.indonesian}</p>}
              <blockquote lang="en">{word.example}</blockquote>
              {word.collocations?.length > 0 && (
                <p>
                  <strong>Collocations</strong>
                  <br />
                  {word.collocations.join(" · ")}
                </p>
              )}
              {word.synonyms?.length > 0 && (
                <p>
                  <strong>Synonyms</strong>
                  <br />
                  {word.synonyms.join(" · ")}
                </p>
              )}
            </div>
          ) : (
            <button className="reveal-card" onClick={() => setFlipped(true)}>
              Tampilkan makna <ChevronRight size={18} />
            </button>
          )}
        </article>
        <div className="flashcard-actions">
          <button
            className="button secondary"
            onClick={() => go(Math.max(0, index - 1))}
            disabled={index === 0}
          >
            <ChevronLeft size={17} />
            Sebelumnya
          </button>
          <button
            className="button primary"
            disabled={!flipped || reviewed.includes(index)}
            onClick={mark}
          >
            {reviewed.includes(index) ? "Sudah direview" : "Sudah paham"}
            <Check size={17} />
          </button>
          <button
            className="button secondary"
            onClick={() => go(Math.min(cards.length - 1, index + 1))}
            disabled={index === cards.length - 1}
          >
            Lewati
            <ChevronRight size={17} />
          </button>
        </div>
        {reviewed.length === cards.length && (
          <div className="quiz-result">
            <h2>One deck closer.</h2>
            <p>Semua kartu di deck ini sudah direview.</p>
            <button className="button primary" onClick={onBack}>
              Pilih deck berikutnya
            </button>
          </div>
        )}
        <p className="small-note centered">
          +5 XP per kata, sekali per hari. Buka makna sebelum menandai sudah
          paham.
        </p>
      </div>
    </div>
  );
}
export function ReadingPractice({ onComplete }) {
  const { result, error, retry } = useContent("reading", "all");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  if (error) return <ErrorState retry={retry} />;
  if (!result) return <Loading label="Membuka perpustakaan reading…" />;
  const passage = selected === null ? null : result.data[selected];
  return (
    <div className="reading-page">
      {passage ? (
        <>
          <BackButton onClick={() => setSelected(null)}>
            Reading library
          </BackButton>
          <div className="lesson-heading">
            <p className="eyebrow">Reading studio · {passage.difficulty}</p>
            <h1>{passage.title}</h1>
            <p>{passage.topic}</p>
          </div>
          <SourceNote source={result.source} />
          <div className="lesson-body reading-body">
            <article className="reading-text">
              <p className="eyebrow">Read for meaning</p>
              {passage.passage
                .split(/\n\s*\n|\n/)
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i} lang="en">
                    {p}
                  </p>
                ))}
              {passage.vocabulary.length > 0 && (
                <details className="learning-details">
                  <summary>Vocabulary dalam bacaan</summary>
                  <dl>
                    {passage.vocabulary.map((w, i) => (
                      <div key={i}>
                        <dt>{w.word}</dt>
                        <dd>{w.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </article>
            <section className="quiz-column">
              <PracticeQuiz
                key={selected}
                questions={passage.questions}
                onComplete={() =>
                  onComplete({
                    kind: "reading",
                    key: passage.title,
                    label: passage.title,
                    xp: 25,
                  })
                }
                onExit={() => setSelected(null)}
              />
            </section>
          </div>
        </>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">Reading studio</p>
              <h1>Read beyond the words.</h1>
              <p>Temukan ide utama. Periksa bukti. Pahami sudut pandangnya.</p>
            </div>
          </div>
          <SourceNote source={result.source} />
          <div className="filter-bar">
            <label htmlFor="reading-level">Level bacaan</label>
            <select
              id="reading-level"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Semua level</option>
              {[
                ...new Set(result.data.map((p) => p.difficulty.toLowerCase())),
              ].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span>
              {
                result.data.filter(
                  (p) =>
                    filter === "all" || p.difficulty.toLowerCase() === filter,
                ).length
              }{" "}
              bacaan tersedia
            </span>
          </div>
          <div className="reading-list">
            {result.data.map((p, i) =>
              filter !== "all" &&
              p.difficulty.toLowerCase() !== filter ? null : (
                <button
                  key={i}
                  className="reading-item"
                  onClick={() => setSelected(i)}
                >
                  <span className="reading-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <span className="eyebrow">
                      {p.difficulty} · {p.questions.length} pertanyaan
                    </span>
                    <h2>{p.title}</h2>
                    <p>{p.topic}</p>
                  </div>
                  <ArrowUpRight size={22} />
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
const SCENARIOS = [
  {
    id: "work",
    name: "At work",
    prompt: "Tell me about a decision you made at work. What did you consider?",
  },
  {
    id: "opinion",
    name: "Make your case",
    prompt:
      "Should cities make public transport free? Explain your view with one example.",
  },
  {
    id: "daily",
    name: "Everyday life",
    prompt:
      "Describe a habit you would like to build. Why does it matter to you?",
  },
];
export function ConversationPractice({ onComplete }) {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastReply = useRef(null);
  useEffect(() => {
    lastReply.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);
  async function send(e) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const userText = input.trim(),
      next = [...messages, { role: "user", text: userText }];
    setBusy(true);
    setError("");
    try {
      const history = next
        .slice(-4)
        .map(
          (m) =>
            `${m.role === "user" ? "Student" : "Tutor"}: ${m.text.slice(0, 1000)}`,
        )
        .join("\n");
      const reply = await postPractice(
        "/api/chat",
        {
          prompt: `You are an English tutor for an Indonesian learner preparing for B2-C1 communication. Discuss: ${scenario.prompt} Give 1-2 priority corrections and a follow-up question. Use Indonesian notes if helpful. Never claim an IELTS score.\nConversation:\n${history}`,
          max: 600,
        },
        chatResponseSchema,
      );
      setMessages([
        ...next,
        {
          role: "tutor",
          text: reply.text,
          fallback: reply.provider === "fallback",
        },
      ]);
      setInput("");
      onComplete({
        kind: "conversation",
        key: await privateActivityKey(`${scenario.id}:${userText}`),
        label: `Conversation · ${scenario.name}`,
        xp: 5,
      });
    } catch {
      setError(
        "Tutor belum bisa merespons. Pesanmu tetap di kotak teks. Coba kirim lagi, atau revisi satu kalimat secara mandiri.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="conversation-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Conversation studio</p>
          <h1>Find your own voice.</h1>
          <p>
            Latihan percakapan tertulis. Satu ide, satu koreksi, satu langkah
            maju.
          </p>
        </div>
      </div>
      <div className="conversation-layout">
        <aside className="scenario-panel">
          <h2>Pilih konteks</h2>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              disabled={busy}
              aria-pressed={scenario.id === s.id}
              className={scenario.id === s.id ? "selected" : ""}
              onClick={() => {
                setScenario(s);
                setMessages([]);
                setError("");
              }}
            >
              <MessageSquare size={19} />
              {s.name}
              <ChevronRight size={15} />
            </button>
          ))}
          <p>
            Percakapan tetap tersedia dalam mode latihan cadangan saat tutor AI
            tidak terhubung. Isi sesi tidak disimpan setelah pindah halaman.
          </p>
        </aside>
        <section className="conversation-room">
          <div className="conversation-intro">
            <span className="tutor-mark">
              <MessageSquare size={22} />
            </span>
            <div>
              <h2>{scenario.name}</h2>
              <p lang="en">{scenario.prompt}</p>
            </div>
          </div>
          <div className="conversation-messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="conversation-empty">
                <p>Mulai dengan 2–3 kalimat dalam bahasa Inggris.</p>
                <p className="small-note">
                  Tidak harus sempurna. Beri tutor sesuatu untuk dikembangkan.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <article className={`message ${m.role}`} key={i}>
                <strong>
                  {m.role === "user"
                    ? "Kamu"
                    : m.fallback
                      ? "Latihan mandiri · mode cadangan"
                      : "EnglishUp tutor"}
                </strong>
                <p>{m.text}</p>
              </article>
            ))}
            {busy && (
              <p role="status" className="small-note">
                Tutor sedang membaca pesanmu…
              </p>
            )}
            <div ref={lastReply} />
          </div>
          {error && (
            <p className="notice warning" role="alert">
              {error}
            </p>
          )}
          <form className="message-form" onSubmit={send}>
            <label htmlFor="conversation-input" className="sr-only">
              Pesan bahasa Inggris
            </label>
            <textarea
              id="conversation-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write your thoughts in English…"
              maxLength={1000}
              rows={3}
              disabled={busy}
            />
            <div>
              <span>{input.length} / 1000</span>
              <button
                className="button primary"
                disabled={busy || !input.trim()}
              >
                <Send size={17} />
                Kirim pesan
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
export function WritingPractice({ onComplete }) {
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function evaluate(e) {
    e.preventDefault();
    if (busy || !essay.trim()) return;
    setBusy(true);
    setError("");
    setFeedback(null);
    try {
      const response = await postPractice(
        "/api/evaluate",
        { text: essay.trim() },
        writingResponseSchema,
      );
      setFeedback(response);
      onComplete({
        kind: "writing",
        key: await privateActivityKey(essay),
        label: "Writing review",
        xp: 15,
      });
    } catch {
      setError(
        "Feedback belum tersedia. Tulisanmu tetap ada. Coba lagi atau gunakan checklist di samping untuk review mandiri.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="writing-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Writing lab</p>
          <h1>Good writing is rewriting.</h1>
          <p>Tulis satu paragraf. Temukan bagian yang perlu diperjelas.</p>
        </div>
      </div>
      <div className="writing-layout">
        <form className="writing-editor" onSubmit={evaluate}>
          <label htmlFor="essay">Your draft</label>
          <textarea
            id="essay"
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            rows={16}
            maxLength={15000}
            placeholder="Write or paste your paragraph in English…"
            disabled={busy}
          />
          <div className="editor-footer">
            <span>
              {essay.trim() ? essay.trim().split(/\s+/).length : 0} kata
            </span>
            <button className="button primary" disabled={!essay.trim() || busy}>
              {busy ? "Membaca tulisan…" : "Review tulisan"}
            </button>
          </div>
          {error && (
            <p className="notice warning" role="alert">
              {error}
            </p>
          )}
        </form>
        <aside className="writing-checklist">
          <FileText size={26} />
          <h2>Before you hit review.</h2>
          <ul>
            <li>Satu ide utama per paragraf.</li>
            <li>Berikan contoh yang mendukung argumen.</li>
            <li>Periksa article dan tense.</li>
            <li>Hubungkan kalimat secara logis.</li>
          </ul>
          <p>
            Feedback otomatis adalah panduan latihan, bukan penilaian IELTS
            resmi. Draft tetap di sesi ini dan tidak tersimpan setelah pindah
            halaman.
          </p>
        </aside>
      </div>
      {feedback && (
        <section className="writing-feedback" aria-live="polite">
          <p className="eyebrow">
            {feedback.provider === "fallback"
              ? "Checklist cadangan"
              : "Feedback latihan"}
          </p>
          <h2>Your next revision.</h2>
          {feedback.provider === "fallback" ? (
            <p>
              Tutor AI belum tersedia. Saran berikut bersifat umum, bukan
              evaluasi personal atas kualitas tulisanmu.
            </p>
          ) : (
            <>
              <p>Indikator latihan skala 1–5. Bukan IELTS band score.</p>
              <div className="rubric-scores">
                {Object.entries(feedback.scores).map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>
                      {value}
                      <small> / 5</small>
                    </strong>
                  </div>
                ))}
              </div>
            </>
          )}
          <ol className="rule-list">
            {feedback.recommendations.map((r, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                <p>{r}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
