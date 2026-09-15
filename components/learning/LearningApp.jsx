"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  MessageSquare,
  Layers,
  FileText,
  Award,
  Flame,
  Check,
  ChevronRight,
  ArrowUpRight,
  GraduationCap,
  PenLine,
  Menu,
  X,
  Target,
  LockKeyhole,
} from "lucide-react";
import { TOPICS, CATEGORIES } from "../../lib/study-content";
import {
  localDay,
  streakFor,
  longestStreak,
} from "../../lib/study-progress.mjs";
import useStudyProgress from "./useStudyProgress";
import { ProgressBar, Loading } from "./StudyUI";
import {
  GrammarPractice,
  VocabularyPractice,
  ReadingPractice,
  ConversationPractice,
  WritingPractice,
} from "./Practice";

import Resources from "./Resources";
const NAV = [
  { id: "home", title: "Jalur belajar", icon: BookOpen },
  { id: "vocabulary", title: "Vocabulary", icon: Layers },
  { id: "reading", title: "Reading", icon: FileText },
  { id: "conversation", title: "Conversation", icon: MessageSquare },
  { id: "writing", title: "Writing lab", icon: PenLine },
  { id: "resources", title: "Resources", icon: BookOpen },
  { id: "progress", title: "Progres saya", icon: Award },
];
function WeekActivity({ dates }) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return (
    <div className="week-activity">
      {["S", "S", "R", "K", "J", "S", "M"].map((label, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const key = localDay(date),
          active = dates.includes(key),
          today = key === localDay(now);
        return (
          <div
            key={key}
            className={today ? "today" : ""}
            title={`${key}: ${active ? "sudah belajar" : "belum ada aktivitas"}`}
          >
            <span>{label}</span>
            <span
              className={`day-stamp ${active ? "active" : ""}`}
              aria-label={`${key}, ${active ? "sudah belajar" : "belum belajar"}`}
            >
              {active ? <Check size={15} /> : date.getDate()}
            </span>
            {today && <small>Hari ini</small>}
          </div>
        );
      })}
    </div>
  );
}
function MilestoneSeal({ earned = false, size = 44 }) {
  return (
    <span
      className={`milestone-seal ${earned ? "earned" : ""}`}
      style={{ width: size, height: size }}
    >
      <Award size={size * 0.51} strokeWidth={1.8} />
    </span>
  );
}
export default function LearningApp({ initialView = "home" }) {
  const { progress, ready, storageError, record, setGoal } = useStudyProgress();
  const [view, setView] = useState(initialView);
  const [topic, setTopic] = useState(null);
  const [category, setCategory] = useState(null);
  const [menu, setMenu] = useState(false);
  const mainRef = useRef(null);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const [toast, setToast] = useState("");
  const day = localDay();
  const dailyXp = progress.dailyXp[day] || 0;
  const streak = streakFor(progress.activeDates);
  const nextTopic =
    TOPICS.find((t) => !progress.completedLessons.includes(t.id)) || TOPICS[0];
  const level = Math.floor(progress.xp / 250) + 1;
  const words = progress.words.length + progress.legacyWords;
  function navigate(id) {
    setView(id);
    setTopic(null);
    setCategory(null);
    setMenu(false);
  }
  function startLesson(t) {
    setTopic(t);
    setView("grammar");
  }
  function celebrate(event) {
    const already = progress.rewarded.includes(
      `${localDay()}:${event.kind}:${event.key}`,
    );
    record(event);
    setToast(
      already
        ? "Latihan tercatat hari ini. Ulangi sesukamu untuk memperkuat pemahaman."
        : `+${event.xp} XP · ${event.label}`,
    );
  }
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (NAV.some((n) => n.id === id)) setView(id);
    const onHash = () => {
      const v = window.location.hash.slice(1);
      if (NAV.some((n) => n.id === v)) navigate(v);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (view !== "grammar")
      history.replaceState(null, "", `${location.pathname}#${view}`);
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [view, topic, category]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector("button")?.focus();
    const close = (event) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButtonRef.current?.focus();
      }
      if (event.key === "Tab") {
        const items = [...menuRef.current.querySelectorAll("button, a")];
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
          event.preventDefault();
          items[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menu]);
  const title =
    view === "grammar"
      ? "Grammar studio"
      : NAV.find((n) => n.id === view)?.title;
  const badges = [
    {
      title: "Langkah pertama",
      detail: "Selesaikan satu lesson grammar",
      done: progress.completedLessons.length >= 1,
    },
    {
      title: "Word collector",
      detail: "Review 10 kata berbeda",
      done: words >= 10,
    },
    {
      title: "Keep showing up",
      detail: "Belajar 3 hari berturut-turut",
      done: longestStreak(progress.activeDates) >= 3,
    },
    {
      title: "Read between lines",
      detail: "Selesaikan satu reading passage",
      done: progress.reading.length + progress.legacyReading >= 1,
    },
    {
      title: "Grammar explorer",
      detail: "Selesaikan semua 8 topik grammar",
      done: TOPICS.every((t) => progress.completedLessons.includes(t.id)),
    },
    {
      title: "A week of progress",
      detail: "Belajar 7 hari berturut-turut",
      done: longestStreak(progress.activeDates) >= 7,
    },
  ];
  return (
    <div className="learning-app">
      <a href="#study-main" className="skip-link">
        Langsung ke materi
      </a>
      {menu && (
        <div
          className="menu-backdrop"
          onClick={() => {
            setMenu(false);
            menuButtonRef.current?.focus();
          }}
        />
      )}
      <aside
        className={`study-sidebar ${menu ? "is-open" : ""}`}
        ref={menuRef}
        aria-label="Navigasi belajar"
        role={menu ? "dialog" : undefined}
        aria-modal={menu ? true : undefined}
      >
        <Link href="/" className="wordmark" aria-label="EnglishUp beranda">
          English<span>Up</span>
          <span className="wordmark-period">.</span>
        </Link>
        <button
          className="icon-button close-menu"
          onClick={() => {
            setMenu(false);
            menuButtonRef.current?.focus();
          }}
          aria-label="Tutup navigasi"
        >
          <X />
        </button>
        <div className="workspace-label">Ruang belajar pribadi</div>
        <nav>
          {NAV.map(({ id, title: label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id || (id === "home" && view === "grammar") ? "is-active" : ""}`}
              aria-current={
                view === id || (id === "home" && view === "grammar")
                  ? "page"
                  : undefined
              }
              onClick={() => navigate(id)}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{label}</span>
              {id === "home" && (
                <span className="nav-count">{TOPICS.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="placement-note">
            <GraduationCap size={26} />
            <h3>Mulai dari titik yang tepat.</h3>
            <p>Kenali fondasimu lewat 8 pertanyaan singkat.</p>
            <Link href="/pretest">
              Cek level awal <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="local-profile">
            <span className="profile-mark">
              <BookOpen size={18} />
            </span>
            <div>
              <strong>Personal workspace</strong>
              <span>Progres di browser ini</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="study-workspace" inert={menu ? "" : undefined}>
        <header className="study-topbar">
          <div className="topbar-location">
            <button
              className="icon-button mobile-menu"
              ref={menuButtonRef}
              aria-label="Buka navigasi"
              aria-expanded={menu}
              onClick={() => setMenu(true)}
            >
              <Menu size={22} />
            </button>
            <span className="topbar-product">Workspace</span>
            <span className="topbar-divider">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-progress">
            <span className="streak-mini">
              <Flame size={19} />
              {streak}
              <span className="desktop-label"> hari</span>
            </span>
            <span className="xp-mini">
              {progress.xp.toLocaleString("id-ID")} XP
            </span>
            <span
              className="level-mini"
              title="Level aktivitas, bukan estimasi CEFR"
            >
              Lv. {level}
            </span>
          </div>
        </header>
        <main
          id="study-main"
          className="study-main"
          tabIndex={-1}
          ref={mainRef}
        >
          {storageError && (
            <p className="notice warning" role="alert">
              {storageError}
            </p>
          )}
          {!ready ? (
            <Loading label="Membuka ruang belajarmu…" />
          ) : (
            <>
              {view === "home" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">
                        Sedikit setiap hari. Lebih jauh setiap minggu.
                      </p>
                      <h1>Your next chapter.</h1>
                      <p>
                        Bangun bahasa Inggris yang siap dipakai, satu latihan
                        setiap hari.
                      </p>
                    </div>
                    <Link
                      href="/pretest"
                      className="button secondary placement-header"
                    >
                      Placement test <ArrowUpRight size={16} />
                    </Link>
                  </div>
                  <div className="dashboard-columns">
                    <div className="path-column">
                      <section className="continue-lesson">
                        <div className="continue-copy">
                          <span className="course-label">
                            English foundations <span>Grammar</span>
                          </span>
                          <p className="lesson-kicker">
                            {progress.completedLessons.length
                              ? "Lanjutkan perjalananmu"
                              : "Langkah pertamamu dimulai di sini"}
                          </p>
                          <h2>{nextTopic.title}</h2>
                          <p>{nextTopic.detail}</p>
                          <button
                            className="button bright"
                            onClick={() => startLesson(nextTopic)}
                          >
                            {progress.completedLessons.length
                              ? "Lanjut belajar"
                              : "Mulai lesson"}
                            <ChevronRight size={18} />
                          </button>
                          <span className="lesson-footnote">
                            Materi ringkas · Quiz interaktif · +20 XP
                          </span>
                        </div>
                        <div className="grammar-art" aria-hidden="true">
                          <span className="art-guide">
                            The small words
                            <br />
                            make a big difference.
                          </span>
                          <div className="word-tile tile-a">
                            a<span>indefinite</span>
                          </div>
                          <div className="word-tile tile-an">
                            an<span>vowel sound</span>
                          </div>
                          <div className="word-tile tile-the">
                            the<span>definite</span>
                          </div>
                        </div>
                      </section>
                      <section className="learning-path">
                        <div className="section-title">
                          <div>
                            <p className="eyebrow">Learning path</p>
                            <h2>Fondasi yang bikin percaya diri.</h2>
                          </div>
                          <span className="completion-count">
                            {
                              TOPICS.filter((t) =>
                                progress.completedLessons.includes(t.id),
                              ).length
                            }{" "}
                            / {TOPICS.length} selesai
                          </span>
                        </div>
                        <div className="unit-heading">
                          <span className="unit-label">Unit 01</span>
                          <div>
                            <h3>Build your sentence</h3>
                            <p>
                              Pahami struktur. Latih akurasi. Pakai dalam
                              konteks.
                            </p>
                          </div>
                        </div>
                        <ol className="lesson-path">
                          {TOPICS.map((t, i) => {
                            const done = progress.completedLessons.includes(
                                t.id,
                              ),
                              current = t.id === nextTopic.id;
                            return (
                              <li
                                key={t.id}
                                className={`${done ? "is-complete" : ""} ${current ? "is-current" : ""}`}
                              >
                                <span className="path-node" aria-hidden="true">
                                  {done ? (
                                    <Check size={22} />
                                  ) : (
                                    String(i + 1).padStart(2, "0")
                                  )}
                                </span>
                                <button
                                  className="lesson-row"
                                  onClick={() => startLesson(t)}
                                >
                                  <div>
                                    <span className="lesson-row-title">
                                      {t.title}
                                      {current && (
                                        <span className="current-label">
                                          Berikutnya
                                        </span>
                                      )}
                                    </span>
                                    <span className="lesson-form">
                                      {t.form}
                                    </span>
                                  </div>
                                  <span className="lesson-row-end">
                                    {done ? "Review" : "+20 XP"}
                                    <ChevronRight size={17} />
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ol>
                        <div className="path-finish">
                          <MilestoneSeal earned={badges[4].done} />
                          <div>
                            <strong>Sentence builder</strong>
                            <p>
                              Selesaikan 8 topik untuk mencapai milestone ini.
                            </p>
                          </div>
                        </div>
                      </section>
                      <section className="practice-strip">
                        <div>
                          <p className="eyebrow">Put it into practice</p>
                          <h2>Dari tahu menjadi terbiasa.</h2>
                        </div>
                        <button onClick={() => navigate("conversation")}>
                          <MessageSquare size={22} />
                          <span>
                            <strong>Mulai percakapan</strong>
                            <small>
                              Latih satu ide, perbaiki satu kalimat.
                            </small>
                          </span>
                          <ArrowUpRight size={18} />
                        </button>
                      </section>
                    </div>
                    <aside
                      className="daily-column"
                      aria-label="Target dan aktivitas"
                    >
                      <section className="daily-goal">
                        <div className="section-title">
                          <h2>Target hari ini</h2>
                          <Target size={20} />
                        </div>
                        <div
                          className={`goal-ring ${dailyXp >= progress.goal ? "goal-complete" : ""}`}
                          style={{
                            "--completion": `${Math.min(100, (dailyXp / progress.goal) * 100)}%`,
                          }}
                        >
                          <div>
                            <strong>{dailyXp}</strong>
                            <span>dari {progress.goal} XP</span>
                          </div>
                        </div>
                        <p className="goal-message">
                          {dailyXp >= progress.goal
                            ? "Target tercapai. Kerja bagus hari ini."
                            : dailyXp
                              ? "Sedikit lagi untuk menjaga momentum."
                              : "Satu langkah kecil tetap sebuah langkah."}
                        </p>
                        <label htmlFor="daily-goal">Sesuaikan ritmemu</label>
                        <select
                          id="daily-goal"
                          value={progress.goal}
                          onChange={(e) => setGoal(Number(e.target.value))}
                        >
                          <option value={20}>Santai · 20 XP / hari</option>
                          <option value={40}>Konsisten · 40 XP / hari</option>
                          <option value={60}>Intensif · 60 XP / hari</option>
                        </select>
                      </section>
                      <section className="streak-panel">
                        <div className="section-title">
                          <h2>Keep the streak.</h2>
                          <Flame size={23} />
                        </div>
                        <p>
                          <strong>{streak}</strong> hari berturut-turut
                        </p>
                        <WeekActivity dates={progress.activeDates} />
                        <span className="small-note">
                          Selesaikan latihan untuk menandai harimu.
                        </span>
                      </section>
                      <section className="next-milestone">
                        <MilestoneSeal earned={badges[0].done} size={56} />
                        <p className="eyebrow">Milestone pertama</p>
                        <h3>{badges[0].title}</h3>
                        <p>
                          {badges[0].done
                            ? "Satu lesson selesai. Fondasimu mulai terbentuk."
                            : "Satu lesson grammar. Satu pencapaian yang jadi milikmu."}
                        </p>
                        <button
                          className="text-button"
                          onClick={() => navigate("progress")}
                        >
                          Lihat pencapaian <ChevronRight size={15} />
                        </button>
                      </section>
                      <p className="workspace-footnote">
                        Dibuat untuk perjalanan B2–C1.
                        <br />
                        XP menunjukkan aktivitas, bukan skor IELTS.
                      </p>
                    </aside>
                  </div>
                </>
              )}
              {view === "resources" && <Resources />}
              {view === "grammar" && topic && (
                <GrammarPractice
                  key={topic.id}
                  topic={topic}
                  onBack={() => navigate("home")}
                  onComplete={celebrate}
                />
              )}
              {view === "vocabulary" &&
                (category ? (
                  <VocabularyPractice
                    key={category.id}
                    category={category}
                    onBack={() => setCategory(null)}
                    onComplete={celebrate}
                  />
                ) : (
                  <>
                    <div className="page-heading">
                      <div>
                        <p className="eyebrow">Vocabulary studio</p>
                        <h1>Make every word count.</h1>
                        <p>Ingat maknanya, temukan konteksnya, lalu ucapkan.</p>
                      </div>
                      <span className="completion-count">
                        {words} kata direview
                      </span>
                    </div>
                    <div className="deck-grid">
                      {CATEGORIES.map((c, i) => (
                        <button
                          key={c.id}
                          className="deck-card"
                          onClick={() => setCategory(c)}
                        >
                          <span
                            className={`deck-mark deck-${i % 3}`}
                            aria-hidden="true"
                          >
                            {c.mark}
                          </span>
                          <h2>{c.title}</h2>
                          <p>{c.detail}</p>
                          <span className="deck-cta">
                            Buka deck <ChevronRight size={17} />
                          </span>
                        </button>
                      ))}
                      <button
                        className="deck-card compact-deck"
                        onClick={() =>
                          setCategory({
                            id: "b2",
                            title: "B2 Core",
                            flashcards: true,
                          })
                        }
                      >
                        <h2>B2 Core</h2>
                        <p>Deck flashcards CEFR B2</p>
                        <ChevronRight />
                      </button>
                      <button
                        className="deck-card compact-deck"
                        onClick={() =>
                          setCategory({
                            id: "c1",
                            title: "C1 Advanced",
                            flashcards: true,
                          })
                        }
                      >
                        <h2>C1 Advanced</h2>
                        <p>Deck flashcards CEFR C1</p>
                        <ChevronRight />
                      </button>
                    </div>
                  </>
                ))}
              {view === "reading" && <ReadingPractice onComplete={celebrate} />}
              {view === "conversation" && (
                <ConversationPractice onComplete={celebrate} />
              )}
              {view === "writing" && <WritingPractice onComplete={celebrate} />}
              {view === "progress" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">Your learning record</p>
                      <h1>Look how far you go.</h1>
                      <p>
                        Setiap latihan dihitung. Tidak perlu membandingkan
                        dengan siapa pun.
                      </p>
                    </div>
                  </div>
                  <section className="progress-summary">
                    <div>
                      <span>Level aktivitas</span>
                      <strong>{level}</strong>
                      <p>{progress.xp} XP terkumpul</p>
                    </div>
                    <div>
                      <h2>Langkah kecil, progres nyata.</h2>
                      <p>
                        {250 - (progress.xp % 250)} XP menuju level {level + 1}.
                        Level ini mengukur aktivitas, bukan kemampuan CEFR.
                      </p>
                      <ProgressBar
                        value={progress.xp % 250}
                        max={250}
                        label="Progres level aktivitas"
                      />
                    </div>
                  </section>
                  <div className="milestone-grid">
                    {badges.map((b) => (
                      <article
                        key={b.title}
                        className={`milestone-card ${b.done ? "unlocked" : ""}`}
                      >
                        <MilestoneSeal earned={b.done} size={64} />
                        <h2>{b.title}</h2>
                        <p>{b.detail}</p>
                        <span>
                          {b.done ? (
                            <>
                              <Check size={14} />
                              Tercapai
                            </>
                          ) : (
                            <>
                              <LockKeyhole size={14} />
                              Belum tercapai
                            </>
                          )}
                        </span>
                      </article>
                    ))}
                  </div>
                  <section className="activity-section">
                    <div className="section-title">
                      <h2>Catatan latihan</h2>
                      <span className="small-note">
                        Aktivitas terbaru di browser ini
                      </span>
                    </div>
                    {progress.activities.length ? (
                      <ol className="activity-list">
                        {progress.activities.slice(0, 15).map((a) => (
                          <li key={a.id}>
                            <span className="activity-check">
                              <Check size={17} />
                            </span>
                            <div>
                              <strong>{a.label}</strong>
                              <span>
                                {new Date(a.at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                })}
                              </span>
                            </div>
                            <strong>+{a.xp} XP</strong>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="empty-history">
                        <BookOpen size={30} />
                        <h3>Halaman pertamamu masih kosong.</h3>
                        <p>
                          Selesaikan satu lesson. Catatan latihanmu akan muncul
                          di sini.
                        </p>
                        <button
                          className="button primary"
                          onClick={() => startLesson(nextTopic)}
                        >
                          Mulai lesson pertama
                        </button>
                      </div>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </main>
        <footer className="study-footer">
          <span>EnglishUp · A little better, every day.</span>
          <span>Personal learning workspace</span>
        </footer>
      </div>
      <div
        className={`xp-toast ${toast ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <Check size={18} />
            {toast}
          </>
        )}
      </div>
    </div>
  );
}
