"use client";
import React, { useState, useRef, useEffect } from "react";
import { getFallbackGrammar, getFallbackVocab } from "../lib/fallback-content";
import { buildSeed, deriveLearningInsights, safePostJSON } from "../lib/learning-flow";
import {
  Home, MessageSquare, BookOpen, FileText, Send, RefreshCw,
  CheckCircle, XCircle, ChevronRight, Lightbulb, Trophy,
  Flame, GraduationCap, Layers, Award, Zap,
} from "lucide-react";

// Chat uses AI API; Grammar/Vocab/Reading use low-bandwidth hybrid generation + static fallback
const callAI = async (prompt, max = 800) => {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, max }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.text || "";
};

const getConversationLibraryContext = async (text) => {
  try {
    const out = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "conversation", text })
    }).then((r) => (r.ok ? r.json() : null));

    return out?.items || [];
  } catch {
    return [];
  }
};

const SYS_CHAT = `You are an expert English tutor for an Indonesian speaker who graduated from English Literature but hasn't actively used English for years — refreshing for IELTS Band 7+. Use Betty S. Azar's correction style. Gently annotate errors inline. Use 2024-2025 examples. Add Indonesian notes only if essential. Keep replies to 3-4 sentences + correction. Plain text only.`;

const LEVELS = [
  { n: 1, name: "A1 Starter",           emoji: "🌱", min: 0    },
  { n: 2, name: "A2 Elementary",        emoji: "📗", min: 200  },
  { n: 3, name: "B1 Pre-Intermediate",  emoji: "📘", min: 500  },
  { n: 4, name: "B2 Intermediate",      emoji: "📙", min: 1000 },
  { n: 5, name: "B2+ Upper",            emoji: "📕", min: 1700 },
  { n: 6, name: "C1 Advanced",          emoji: "🔮", min: 2500 },
  { n: 7, name: "C1+ IELTS Ready",      emoji: "👑", min: 3500 },
];
const getLvl = (xp) => {
  let l = LEVELS[0];
  for (const x of LEVELS) if (xp >= x.min) l = x;
  const ni = LEVELS.findIndex((x) => x.n === l.n) + 1;
  const nxt = LEVELS[ni] || l;
  return { lvl: l, nxt, pct: l.n === 7 ? 100 : Math.round(((xp - l.min) / (nxt.min - l.min)) * 100) };
};

const BADGES = [
  { id: "first_chat",   icon: "💬", name: "First Word",      desc: "Send your first message",    xpR: 10  },
  { id: "chat_10",      icon: "🗣", name: "Chatterbox",      desc: "Send 10 messages",           xpR: 35  },
  { id: "grammar_1",    icon: "📐", name: "Grammar Starter", desc: "Complete 1 grammar lesson",  xpR: 25  },
  { id: "grammar_5",    icon: "🏆", name: "Grammar Master",  desc: "Complete 5 lessons",         xpR: 75  },
  { id: "perfect_quiz", icon: "⭐", name: "Perfect Score",   desc: "Score 5/5 on any quiz",      xpR: 50  },
  { id: "vocab_10",     icon: "📚", name: "Word Collector",  desc: "Learn 10 vocab words",       xpR: 30  },
  { id: "vocab_40",     icon: "📖", name: "Vocab Expert",    desc: "Learn 40 vocab words",       xpR: 80  },
  { id: "reading_1",    icon: "📰", name: "First Read",      desc: "Complete 1 passage",         xpR: 25  },
  { id: "reading_5",    icon: "🎓", name: "IELTS Reader",    desc: "Complete 5 passages",        xpR: 75  },
  { id: "streak_3",     icon: "🔥", name: "On Fire",         desc: "3-day streak",               xpR: 40  },
  { id: "streak_7",     icon: "⚡", name: "Week Warrior",    desc: "7-day streak",               xpR: 100 },
  { id: "level_4",      icon: "🌟", name: "Intermediate!",   desc: "Reach B2 Intermediate",      xpR: 100 },
];

const G_TOPICS = [
  { id: "articles",         label: "Articles",              sub: "a, an, the & zero article",    icon: "📝", band: "5.0–6.5", col: "blue"    },
  { id: "present_perfect",  label: "Present Perfect",       sub: "have/has + past participle",   icon: "⏳", band: "5.5–6.5", col: "violet"  },
  { id: "passive_voice",    label: "Passive Voice",         sub: "is/was/has been + V3",         icon: "🔄", band: "6.0–7.0", col: "emerald" },
  { id: "conditionals",     label: "Conditionals",          sub: "0, 1st, 2nd, 3rd types",      icon: "🔀", band: "6.5–7.5", col: "amber"   },
  { id: "relative_clauses", label: "Relative Clauses",      sub: "who, which, that, where",      icon: "🔗", band: "6.5–7.0", col: "pink"    },
  { id: "modal_verbs",      label: "Modal Verbs",           sub: "can, could, must, should…",   icon: "💡", band: "6.0–7.0", col: "orange"  },
  { id: "reported_speech",  label: "Reported Speech",       sub: "He said that…",               icon: "💬", band: "6.5–7.5", col: "cyan"    },
  { id: "gerunds_inf",      label: "Gerunds & Infinitives", sub: "enjoy doing vs want to do",   icon: "🎯", band: "6.0–7.0", col: "rose"    },
];

const V_CATS = [
  { id: "ielts_academic", label: "IELTS Academic",     icon: "🎓", desc: "Academic Word List (AWL)"   },
  { id: "daily_convo",    label: "Daily Conversation", icon: "💬", desc: "Natural everyday English"    },
  { id: "tech_ai",        label: "Tech & AI",          icon: "🤖", desc: "Current digital vocabulary"  },
  { id: "environment",    label: "Environment",        icon: "🌍", desc: "Climate & sustainability"    },
  { id: "social_issues",  label: "Social Issues",      icon: "🤝", desc: "IELTS Writing Task 2 topics" },
  { id: "business",       label: "Business & Work",    icon: "💼", desc: "Professional English"        },
];

const C = {
  blue:    { bg: "bg-blue-50",    br: "border-blue-200",    tx: "text-blue-700",    tg: "bg-blue-100 text-blue-800"     },
  violet:  { bg: "bg-violet-50",  br: "border-violet-200",  tx: "text-violet-700",  tg: "bg-violet-100 text-violet-800" },
  emerald: { bg: "bg-emerald-50", br: "border-emerald-200", tx: "text-emerald-700", tg: "bg-emerald-100 text-emerald-800"},
  amber:   { bg: "bg-amber-50",   br: "border-amber-200",   tx: "text-amber-700",   tg: "bg-amber-100 text-amber-800"   },
  pink:    { bg: "bg-pink-50",    br: "border-pink-200",    tx: "text-pink-700",    tg: "bg-pink-100 text-pink-800"     },
  orange:  { bg: "bg-orange-50",  br: "border-orange-200",  tx: "text-orange-700",  tg: "bg-orange-100 text-orange-800" },
  cyan:    { bg: "bg-cyan-50",    br: "border-cyan-200",    tx: "text-cyan-700",    tg: "bg-cyan-100 text-cyan-800"     },
  rose:    { bg: "bg-rose-50",    br: "border-rose-200",    tx: "text-rose-700",    tg: "bg-rose-100 text-rose-800"     },
};

const DAILIES = [
  { task: "Complete the Articles grammar lesson and score 4/5 or higher", xp: 60, tab: "grammar" },
  { task: "Learn all 8 IELTS Academic vocabulary words today",            xp: 50, tab: "vocab"   },
  { task: "Read a Climate Change passage and answer 4/5 correctly",       xp: 70, tab: "reading" },
  { task: "Send 5 messages in conversation practice",                     xp: 45, tab: "chat"    },
  { task: "Complete the Conditionals lesson — key for IELTS Task 2",      xp: 60, tab: "grammar" },
];
const STORAGE_KEY = "englishup.v1.progress";
const CHAT_SEED_MESSAGE = { role: "ai", id: 0, text: "Hello! Selamat datang di EnglishUp 👋\n\nSebagai lulusan Sastra Inggris yang me-refresh kemampuannya, kita fokus pada grammar detail (metode Azar), vocabulary kaya, dan reading comprehension ala IELTS.\n\nCoba tulis beberapa kalimat tentang dirimu dalam Bahasa Inggris — aku akan berikan detailed feedback!" };

function normalizeQuizOptions(options = []) {
  if (!Array.isArray(options)) return [];
  return options.map((opt) => {
    if (typeof opt === "string") return opt;
    if (opt && typeof opt === "object") return String(opt.text || opt.label || opt.value || "Option");
    return String(opt || "Option");
  });
}

function readText(value, keys = []) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    for (const key of keys) {
      if (value[key] !== undefined && value[key] !== null) return String(value[key]);
    }
  }
  return "";
}

function rotateOptions(question, seedValue = "seed") {
  const options = Array.isArray(question.options) ? [...question.options] : [];
  if (options.length <= 1) return question;
  const offset = Math.abs(seedValue.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % options.length;
  if (!offset) return question;
  const rotated = options.map((_, i) => options[(i + offset) % options.length]);
  const nextAnswer = (question.answer - offset + options.length) % options.length;
  return { ...question, options: rotated, answer: nextAnswer };
}

function normalizeGrammarData(raw = null, topicLabel = "this grammar topic", variantSeed = "") {
  if (!raw || typeof raw !== "object") return null;
  const quiz = Array.isArray(raw.quiz)
    ? raw.quiz
      .filter((item) => item && typeof item === "object")
      .map((item, idx) => rotateOptions({
        question: readText(item.question || item, ["question", "text"]) || `Question ${idx + 1}`,
        options: normalizeQuizOptions(item.options),
        answer: Number.isInteger(Number(item.answer)) ? Number(item.answer) : 0,
        explanation: readText(item.explanation || item, ["explanation", "reason"]) || "Review the explanation and retry."
      }, `${variantSeed}-${idx}`))
    : [];

  const examples = Array.isArray(raw.examples)
    ? raw.examples.map((item) => ({
      sentence: readText(item, ["sentence", "text", "example"]),
      indonesian: readText(item, ["indonesian", "translation"]),
      note: readText(item, ["note", "explanation"])
    }))
    : [];

  const nonEmptyExamples = examples.filter((item) => item.sentence.trim());
  if (!nonEmptyExamples.length) {
    nonEmptyExamples.push(
      { sentence: `I reviewed ${topicLabel.toLowerCase()} before class.`, indonesian: "", note: "Simple accurate model sentence." },
      { sentence: `My tutor corrected one small form in my ${topicLabel.toLowerCase()} sentence.`, indonesian: "", note: "Small markers can change meaning." }
    );
  }

  const commonMistakes = Array.isArray(raw.commonMistakes)
    ? raw.commonMistakes.map((item) => ({
      wrong: readText(item, ["wrong", "incorrect"]),
      right: readText(item, ["right", "correct"]),
      why: readText(item, ["why", "reason"])
    })).filter((item) => item.wrong || item.right)
    : [];

  if (!commonMistakes.length) {
    commonMistakes.push({
      wrong: "Using structure without checking form marker.",
      right: "Check article/tense marker before finalizing sentence.",
      why: "Most grammar score loss comes from missing small markers."
    });
  }

  return {
    ...raw,
    grammarChart: readText(raw.grammarChart || raw, ["grammarChart", "chart"]),
    explanation: readText(raw.explanation || raw, ["explanation", "summary"]) || `${topicLabel} needs form, meaning, and use control. Focus on small markers and context accuracy.`,
    keyRules: Array.isArray(raw.keyRules) ? raw.keyRules.map((x) => readText(x, ["text", "rule"])).filter(Boolean) : [],
    azarNotes: Array.isArray(raw.azarNotes) ? raw.azarNotes.map((x) => readText(x, ["text", "note"])).filter(Boolean) : [],
    examples: nonEmptyExamples,
    commonMistakes,
    ieltsTip: readText(raw.ieltsTip || raw, ["ieltsTip", "tip"]) || `Use one accurate ${topicLabel.toLowerCase()} sentence instead of forcing complex but wrong grammar.`,
    studyCase: raw.studyCase && typeof raw.studyCase === "object"
      ? {
        context: readText(raw.studyCase.context || raw.studyCase, ["context", "text"]),
        task: readText(raw.studyCase.task || raw.studyCase, ["task", "instruction"]),
        checklist: Array.isArray(raw.studyCase.checklist) ? raw.studyCase.checklist.map((x) => readText(x, ["text", "item"])).filter(Boolean) : []
      }
      : null,
    quiz
  };
}

function classifyTopicKeyClient(text = "") {
  const q = String(text).toLowerCase();
  if (/(education|classroom|student|school|university)/.test(q)) return "education";
  if (/(technology|ai|digital|data|software)/.test(q)) return "technology";
  if (/(climate|environment|carbon|green|sustainab)/.test(q)) return "climate";
  if (/(work|job|employment|career|productivity)/.test(q)) return "work";
  return "default";
}

export default function EnglishUp() {
  const [tab, setTab] = useState("home");
  const [xp, setXp] = useState(0);
  const [earned, setEarned] = useState([]);
  const [doneL, setDoneL] = useState(new Set());
  const [vocabN, setVocabN] = useState(0);
  const [readN, setReadN] = useState(0);
  const [chatN, setChatN] = useState(0);
  const [xpToast, setXpToast] = useState(null);
  const [notif, setNotif] = useState(null);
  const streak = 7;
  const unlockedRef = useRef(new Set());
  const prevLvRef = useRef(1);
  const t1 = useRef(null);
  const t2 = useRef(null);
  const saveRef = useRef(null);

  // Chat
  const [msgs, setMsgs] = useState([CHAT_SEED_MESSAGE]);
  const [chatIn, setChatIn] = useState("");
  const [chatLoad, setChatLoad] = useState(false);
  const chatEnd = useRef(null);
  const [historyLog, setHistoryLog] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Grammar — loads from static JSON
  const [gTopic, setGTopic] = useState(null);
  const [gData, setGData] = useState(null);
  const [gLoad, setGLoad] = useState(false);
  const [gError, setGError] = useState(false);
  const [qAns, setQAns] = useState({});
  const [qDone, setQDone] = useState(false);

  // Vocab — loads from static JSON
  const [vCat, setVCat] = useState(null);
  const [vWords, setVWords] = useState(null);
  const [vLoad, setVLoad] = useState(false);
  const [vError, setVError] = useState(false);
  const [vIdx, setVIdx] = useState(0);
  const [vFlip, setVFlip] = useState(false);

  // Reading — loads from static JSON pool
  const [rPassages, setRPassages] = useState(null);
  const [rData, setRData] = useState(null);
  const [rLoad, setRLoad] = useState(false);
  const [rError, setRError] = useState(false);
  const [rDiff, setRDiff] = useState("intermediate");
  const [rAns, setRAns] = useState({});
  const [rDone, setRDone] = useState(false);

  const { lvl, nxt, pct } = getLvl(xp);
  const daily = DAILIES[new Date().getDate() % DAILIES.length];
  const learningInsights = deriveLearningInsights({
    grammarCompleted: doneL.size,
    grammarTotal: G_TOPICS.length,
    vocabLearned: vocabN,
    readingCompleted: readN,
    chatMessages: chatN,
    streak,
    xp
  });

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      setXp(Number(saved?.xp || 0));
      setEarned(Array.isArray(saved?.earned) ? saved.earned : []);
      setDoneL(new Set(Array.isArray(saved?.doneL) ? saved.doneL : []));
      setVocabN(Number(saved?.vocabN || 0));
      setReadN(Number(saved?.readN || 0));
      setChatN(Number(saved?.chatN || 0));
      const safeMsgs = Array.isArray(saved?.msgs)
        ? saved.msgs
          .filter((item) => item && typeof item === "object")
          .map((item, idx) => ({
            id: item.id || `saved-${idx}`,
            role: item.role === "user" ? "user" : "ai",
            text: String(item.text || "")
          }))
          .slice(-30)
        : [];
      setMsgs(safeMsgs.length ? safeMsgs : [CHAT_SEED_MESSAGE]);

      const safeHistory = Array.isArray(saved?.historyLog)
        ? saved.historyLog
          .filter((item) => item && typeof item === "object")
          .map((item, idx) => ({
            id: item.id || `hist-${idx}`,
            type: String(item.type || "event"),
            label: String(item.label || "-"),
            value: String(item.value || ""),
            at: String(item.at || "")
          }))
          .slice(0, 30)
        : [];
      setHistoryLog(safeHistory);
      if (Array.isArray(saved?.earned)) {
        unlockedRef.current = new Set(saved.earned);
      }
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    clearTimeout(saveRef.current);
    const payload = {
      xp,
      earned,
      doneL: Array.from(doneL),
      vocabN,
      readN,
      chatN,
      msgs: msgs.slice(-30),
      historyLog: historyLog.slice(0, 30)
    };
    saveRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {}
    }, 200);
    return () => clearTimeout(saveRef.current);
  }, [hydrated, xp, earned, doneL, vocabN, readN, chatN, msgs, historyLog]);
  useEffect(() => {
    const { lvl: l } = getLvl(xp);
    if (l.n > prevLvRef.current) { prevLvRef.current = l.n; showNotif({ type: "levelup", data: l }); if (l.n >= 4) tryUnlock("level_4"); }
  }, [xp]);
  useEffect(() => { if (chatN >= 1) tryUnlock("first_chat"); if (chatN >= 10) tryUnlock("chat_10"); }, [chatN]);
  useEffect(() => { if (doneL.size >= 1) tryUnlock("grammar_1"); if (doneL.size >= 5) tryUnlock("grammar_5"); }, [doneL.size]);
  useEffect(() => { if (vocabN >= 10) tryUnlock("vocab_10"); if (vocabN >= 40) tryUnlock("vocab_40"); }, [vocabN]);
  useEffect(() => { if (readN >= 1) tryUnlock("reading_1"); if (readN >= 5) tryUnlock("reading_5"); }, [readN]);
  useEffect(() => { const id = setTimeout(() => { if (streak >= 3) tryUnlock("streak_3"); if (streak >= 7) tryUnlock("streak_7"); }, 2000); return () => clearTimeout(id); }, []);

  const addXP = (amt, label = "") => {
    setXp((p) => p + amt);
    if (label) {
      setHistoryLog((prev) => [
        { id: `xp-${Date.now()}`, type: "xp", label, value: amt, at: new Date().toISOString() },
        ...prev
      ].slice(0, 30));
    }
    clearTimeout(t1.current);
    setXpToast({ amt, label });
    t1.current = setTimeout(() => setXpToast(null), 2200);
  };
  const showNotif = (data) => { clearTimeout(t2.current); setNotif(data); t2.current = setTimeout(() => setNotif(null), 3500); };
  const tryUnlock = (id) => {
    if (unlockedRef.current.has(id)) return;
    const b = BADGES.find((x) => x.id === id); if (!b) return;
    unlockedRef.current.add(id); setEarned((p) => [...p, id]); setXp((p) => p + b.xpR);
    setTimeout(() => showNotif({ type: "badge", data: b }), 500);
  };

  // ── CHAT (AI) ─────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatIn.trim() || chatLoad) return;
    const m = { role: "user", text: chatIn, id: Date.now() };
    const next = [...msgs, m];
    setMsgs(next); setChatIn(""); setChatLoad(true);
    setChatN((p) => p + 1); addXP(5, "Conversation");
    try {
      const hist = next.slice(-8).map((x) => `${x.role === "user" ? "Student" : "Tutor"}: ${x.text}`).join("\n");
      const libContext = await getConversationLibraryContext(chatIn);
      const contextBlock = libContext.length
        ? `\n\nLibrary context:\n${libContext.map((item) => `- ${item.word}: ${item.definition}`).join("\n")}`
        : "";
      const reply = await callAI(`${SYS_CHAT}\n\nConversation:\n${hist}${contextBlock}`);
      setMsgs((p) => [...p, { role: "ai", text: reply, id: Date.now() }]);
      setHistoryLog((prev) => [
        { id: `chat-${Date.now()}`, type: "chat", label: "Conversation session", value: "+1", at: new Date().toISOString() },
        ...prev
      ].slice(0, 30));
    } catch (e) {
      setMsgs((p) => [...p, { role: "ai", text: `Error: ${e.message}`, id: Date.now() }]);
    } finally { setChatLoad(false); }
  };

  // ── GRAMMAR (static JSON) ─────────────────────────────────────────
  const loadGrammar = async (t) => {
    setGTopic(t); setGData(null); setGLoad(true); setGError(false); setQAns({}); setQDone(false);
    const seed = buildSeed("grammar");

    try {
      const generated = await safePostJSON("/api/content", { type: "grammar", topicId: t.id, seed }, { retries: 1 });

      if (generated?.quiz?.length) {
        setGData(normalizeGrammarData(generated, t.label, seed));
        return;
      }

      const res = await fetch(`/data/grammar/${t.id}.json`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      setGData(normalizeGrammarData(data, t.label, seed));
    } catch {
      const fallback = getFallbackGrammar(t.id);
      if (fallback) setGData(normalizeGrammarData(fallback, t.label, seed));
      else setGError(true);
    } finally { setGLoad(false); }
  };

  const submitGrammar = () => {
    if (!gData?.quiz) return; setQDone(true);
    const sc = gData.quiz.filter((q, i) => Number(qAns[i]) === q.answer).length;
    addXP(sc * 8 + (sc === gData.quiz.length ? 20 : 0), `Grammar ${sc}/${gData.quiz.length}`);
    if (sc === gData.quiz.length) tryUnlock("perfect_quiz");
    setDoneL((p) => new Set([...p, gTopic.id]));
    setHistoryLog((prev) => [
      { id: `grammar-${Date.now()}`, type: "grammar", label: gTopic.label, value: `${sc}/${gData.quiz.length}`, at: new Date().toISOString() },
      ...prev
    ].slice(0, 30));
    fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "feedback", topicKey: classifyTopicKeyClient(gTopic?.label || ""), signal: "complete" })
    }).catch(() => {});
  };

  // ── VOCAB (static JSON) ───────────────────────────────────────────
  const loadVocab = async (cat) => {
    setVCat(cat); setVWords(null); setVLoad(true); setVError(false); setVIdx(0); setVFlip(false);
    const seed = buildSeed("vocab");

    try {
      const generated = await safePostJSON("/api/content", { type: "vocab", category: cat.id, count: 12, seed }, { retries: 1 });

      if (generated?.items?.length) {
        const normalized = generated.items.map((card) => ({
          word: card.front,
          pronunciation: card.back?.phonetic || "",
          partOfSpeech: "word",
          definition: card.back?.definition,
          indonesian: "",
          level: card.back?.level || "B2",
          ieltsBand: card.back?.level?.startsWith("C") ? "7+" : "6.5+",
          example: card.back?.example,
          collocations: [],
          synonyms: card.back?.synonyms || []
        }));
        setVWords(normalized);
        return;
      }

      const res = await fetch(`/data/vocab/${cat.id}.json`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      setVWords(data.words);
    } catch {
      const fallback = getFallbackVocab(cat.id);
      if (fallback?.words?.length) setVWords(fallback.words);
      else setVError(true);
    } finally { setVLoad(false); }
  };

  const nextCard = () => {
    addXP(5, "Vocabulary"); setVocabN((p) => p + 1);
    if (vIdx < (vWords?.length ?? 0) - 1) { setVIdx((p) => p + 1); setVFlip(false); }
    else { addXP(15, "Session done! 🎉"); setVCat(null); setVWords(null); }
  };

  // ── READING (static JSON pool) ────────────────────────────────────
  const loadReadingPassages = async () => {
    if (rPassages) return rPassages;
    setRLoad(true); setRError(false);
    try {
      const res = await fetch("/data/reading/passages.json");
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      setRPassages(data); return data;
    } catch {
      setRError(true); return null;
    } finally { setRLoad(false); }
  };

  const pickPassage = async () => {
    setRData(null); setRAns({}); setRDone(false);
    const seed = buildSeed("reading");

    try {
      const generated = await safePostJSON("/api/content", { type: "reading", difficulty: rDiff, size: 1, seed }, { retries: 1 });

      const item = generated?.items?.[0];
      if (item) {
        setRData(item);
        return;
      }
    } catch {}

    const pool = await loadReadingPassages();
    if (!pool) return;
    const filtered = pool.filter((p) => String(p.difficulty || "").toLowerCase() === rDiff);
    const source = filtered.length > 0 ? filtered : pool;
    const pick = source[Math.floor(Math.random() * source.length)];
    setRData(pick);
  };

  const submitReading = () => {
    if (!rData?.questions) return; setRDone(true);
    const sc = rData.questions.filter((q, i) => Number(rAns[i]) === q.answer).length;
    addXP(sc * 8 + (sc === rData.questions.length ? 20 : 0), `Reading ${sc}/${rData.questions.length}`);
    if (sc === rData.questions.length) tryUnlock("perfect_quiz");
    setReadN((p) => p + 1);
    setHistoryLog((prev) => [
      { id: `reading-${Date.now()}`, type: "reading", label: rData.title, value: `${sc}/${rData.questions.length}`, at: new Date().toISOString() },
      ...prev
    ].slice(0, 30));
    fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "feedback", topicKey: classifyTopicKeyClient(rData?.topic || rData?.title || ""), signal: "complete" })
    }).catch(() => {});
  };

  const trackRefClick = (topicText = "") => {
    fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "feedback", topicKey: classifyTopicKeyClient(topicText), signal: "click" })
    }).catch(() => {});
  };

  // ── Shared micro-components ───────────────────────────────────────
  const Back = ({ onClick }) => (
    <button onClick={onClick} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
      <ChevronRight className="w-4 h-4 rotate-180 text-gray-600" />
    </button>
  );
  const Spin = ({ c = "indigo", msg = "" }) => {
    const borderColorClass = {
      indigo: "border-indigo-500",
      violet: "border-violet-500",
      emerald: "border-emerald-500",
      amber: "border-amber-500",
    }[c] || "border-indigo-500";

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
        <div className={`w-10 h-10 border-4 ${borderColorClass} border-t-transparent rounded-full animate-spin`} />
        {msg && <p className="text-gray-400 text-sm text-center max-w-xs leading-relaxed">{msg}</p>}
      </div>
    );
  };
  const NotReady = ({ onBack }) => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-4xl">⏳</div>
      <p className="font-bold text-gray-700">Konten sedang disiapkan</p>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
        Materi akan tersedia setelah GitHub Actions selesai generate. Biasanya 5–10 menit setelah pertama kali setup.
      </p>
      <button onClick={onBack} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-200 transition-colors">← Kembali</button>
    </div>
  );
  const QBlock = ({ q, qi, ans, setAns, done }) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-800">{qi + 1}. {q.question}</p>
      <div className="space-y-1.5">
        {q.options?.map((opt, oi) => {
          let cls = "border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50";
          if (Number(ans[qi]) === oi) cls = "border-indigo-500 bg-indigo-50 text-indigo-800";
          if (done) {
            if (oi === q.answer) cls = "border-emerald-500 bg-emerald-50 text-emerald-800";
            else if (Number(ans[qi]) === oi) cls = "border-red-400 bg-red-50 text-red-700 line-through";
            else cls = "border-gray-100 text-gray-400";
          }
          return <button key={oi} disabled={done} onClick={() => setAns((p) => ({ ...p, [qi]: oi }))} className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-colors ${cls}`}>{String(opt || "")}</button>;
        })}
      </div>
      {done && <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">💡 {q.explanation}</p>}
    </div>
  );
  const ScoreCard = ({ score, total, onRetry }) => (
    <div className="space-y-2 mt-4">
      <div className={`rounded-2xl p-4 text-center ${score === total ? "bg-emerald-50 text-emerald-800" : score >= total * 0.8 ? "bg-blue-50 text-blue-800" : score >= total * 0.6 ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"}`}>
        <div className="text-3xl font-black">{score}/{total}</div>
        <div className="text-sm mt-1">{score === total ? "🎉 Perfect! Outstanding." : score >= total * 0.8 ? "👍 Excellent — minor review needed." : score >= total * 0.6 ? "📖 Good try. Review the mistakes." : "🔄 Study the material and retry."}</div>
      </div>
      {onRetry && <button onClick={onRetry} className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" />Try Again</button>}
    </div>
  );

  const navItems = [
    { id: "home",         icon: <Home className="w-4 h-4" />,          label: "Home"         },
    { id: "chat",         icon: <MessageSquare className="w-4 h-4" />, label: "Conversation" },
    { id: "grammar",      icon: <BookOpen className="w-4 h-4" />,      label: "Grammar"      },
    { id: "vocab",        icon: <Layers className="w-4 h-4" />,        label: "Vocabulary"   },
    { id: "reading",      icon: <FileText className="w-4 h-4" />,      label: "Reading"      },
    { id: "achievements", icon: <Award className="w-4 h-4" />,         label: "Achievements" },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden" style={{ fontFamily: "system-ui, sans-serif", position: "relative" }}>

      {xpToast && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 100 }} className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg">
          <Zap className="w-4 h-4 text-yellow-300" /><span className="font-bold text-sm">+{xpToast.amt} XP</span>
          {xpToast.label && <span className="text-indigo-200 text-xs">· {xpToast.label}</span>}
        </div>
      )}
      {notif && (
        <div style={{ position: "fixed", top: 64, right: 16, zIndex: 100 }} className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 min-w-52">
          {notif.type === "badge" ? (<>
            <p className="text-xs font-bold text-yellow-600 uppercase tracking-wide mb-2">🏅 Badge Unlocked!</p>
            <div className="flex items-center gap-2.5"><span className="text-3xl">{notif.data.icon}</span><div>
              <p className="font-bold text-gray-800 text-sm">{notif.data.name}</p>
              <p className="text-xs text-gray-400">{notif.data.desc}</p>
              <p className="text-xs text-indigo-600 font-semibold mt-0.5">+{notif.data.xpR} XP</p>
            </div></div>
          </>) : (<>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">🎉 Level Up!</p>
            <p className="font-bold text-gray-800 text-base">{notif.data.emoji} {notif.data.name}</p>
            <p className="text-xs text-gray-400">You reached Level {notif.data.n}!</p>
          </>)}
        </div>
      )}

      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 flex flex-col" style={{ background: "linear-gradient(160deg,#1e1b4b,#312e81 60%,#1e3a5f)" }}>
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
          <div><div className="text-white font-black text-sm">EnglishUp</div><div className="text-indigo-400 text-xs">IELTS Prep</div></div>
        </div>
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex justify-between mb-1.5">
            <span className="text-indigo-200 text-xs font-semibold truncate max-w-28">{lvl.emoji} {lvl.name}</span>
            <span className="text-white text-xs font-bold">{xp} XP</span>
          </div>
          <div className="w-full bg-indigo-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-400 to-violet-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          {lvl.n < 7 && <p className="text-indigo-400 text-xs mt-1">{nxt.min - xp} XP → Lv.{lvl.n + 1}</p>}
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-white/15 text-white" : "text-slate-400 hover:text-white hover:bg-white/10"}`}>
              {item.icon}<span>{item.label}</span>
              {item.id === "achievements" && earned.length > 0 && <span className="ml-auto text-xs bg-yellow-400 text-yellow-900 rounded-full px-1.5 font-bold">{earned.length}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-3 flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-orange-400" />
            <div><p className="text-white font-black text-lg leading-none">{streak} days</p><p className="text-indigo-300 text-xs">Streak</p></div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HOME */}
        {tab === "home" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81,#1e3a5f)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Selamat belajar!</p>
                  <h2 className="text-xl font-black">{lvl.emoji} {lvl.name}</h2>
                  <p className="text-indigo-300 text-sm mt-0.5">{xp} XP · {earned.length} badges</p>
                </div>
                <div className="text-right"><div className="text-3xl font-black">Lv.{lvl.n}</div><div className="text-indigo-400 text-xs">of 7</div></div>
              </div>
              <div className="flex justify-between text-xs text-indigo-300 mb-1.5">
                <span>{lvl.name}</span>
                {lvl.n < 7 && <span>{nxt.name} · {nxt.min - xp} XP to go</span>}
              </div>
              <div className="w-full bg-indigo-900 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-400 to-violet-300 h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { icon: <Flame className="w-4 h-4" />,    v: streak,      u: "d",             label: "Streak",  bg: "bg-orange-50", tc: "text-orange-500"  },
                { icon: <Award className="w-4 h-4" />,    v: earned.length, u: `/${BADGES.length}`, label: "Badges", bg: "bg-yellow-50", tc: "text-yellow-600" },
                { icon: <Layers className="w-4 h-4" />,   v: vocabN,      u: "",              label: "Vocab",   bg: "bg-emerald-50", tc: "text-emerald-600" },
                { icon: <BookOpen className="w-4 h-4" />, v: doneL.size,  u: `/${G_TOPICS.length}`, label: "Lessons", bg: "bg-indigo-50", tc: "text-indigo-600" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
                  <div className={`w-8 h-8 ${s.bg} ${s.tc} rounded-xl flex items-center justify-center mx-auto mb-2`}>{s.icon}</div>
                  <div className="text-lg font-black text-gray-800 leading-none">{s.v}<span className="text-xs font-normal text-gray-400">{s.u}</span></div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-800">Learning Flow Health</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  learningInsights.momentum === "strong"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : learningInsights.momentum === "stable"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {learningInsights.momentum}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Grammar Coverage</p>
                  <p className="text-lg font-black text-slate-800">{learningInsights.grammarCoverage}%</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Consistency Score</p>
                  <p className="text-lg font-black text-slate-800">{learningInsights.consistencyScore}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Weakest Area</p>
                  <p className="text-sm font-bold text-slate-800 capitalize">{learningInsights.weakest}</p>
                </div>
              </div>
              <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">System Recommendation</p>
                <ul className="space-y-1.5">
                  {learningInsights.recommendations.map((item) => (
                    <li key={item} className="text-sm text-indigo-900 leading-relaxed">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-amber-500" /></div>
                <p className="font-bold text-gray-800 text-sm">Daily Challenge</p>
                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">+{daily.xp} XP</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{daily.task}</p>
              <button onClick={() => setTab(daily.tab)} className="mt-3 w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold transition-colors">Start Challenge →</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { t: "chat",    e: "💬", title: "Conversation", desc: "AI chat + real-time feedback",  g1: "from-blue-500",   g2: "to-indigo-600" },
                { t: "grammar", e: "📐", title: "Grammar",      desc: "Azar method · quiz · XP",      g1: "from-violet-500", g2: "to-purple-600" },
                { t: "vocab",   e: "📚", title: "Vocabulary",   desc: "IELTS AWL · flip cards",       g1: "from-emerald-500",g2: "to-teal-600"   },
                { t: "reading", e: "📰", title: "Reading",      desc: "IELTS passages · strategies",  g1: "from-amber-500",  g2: "to-orange-500" },
              ].map((a, i) => (
                <button key={i} onClick={() => setTab(a.t)} className={`bg-gradient-to-br ${a.g1} ${a.g2} rounded-2xl p-4 text-left text-white hover:opacity-95 transition-all shadow-sm`}>
                  <div className="text-2xl mb-2">{a.e}</div>
                  <div className="font-bold text-sm">{a.title}</div>
                  <div className="text-white/70 text-xs mt-0.5">{a.desc}</div>
                </button>
              ))}
            </div>
            {earned.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Badges</p>
                  <button onClick={() => setTab("achievements")} className="text-xs text-indigo-600 font-medium">All →</button>
                </div>
                <div className="flex gap-2">
                  {earned.slice(-4).map((id) => { const b = BADGES.find((x) => x.id === id); return b ? (
                    <div key={id} className="flex-1 bg-white border border-gray-100 rounded-xl p-2.5 text-center shadow-sm">
                      <div className="text-xl">{b.icon}</div>
                      <div className="text-xs text-gray-500 font-medium mt-1 leading-tight">{b.name}</div>
                    </div>
                  ) : null; })}
                </div>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
              <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">IELTS Tip Hari Ini</p>
                <p className="text-sm text-blue-700 leading-relaxed">Dalam IELTS Writing Task 2, hindari <em>"I think / I believe"</em> berulang. Gunakan <em>"It can be argued that…"</em> atau <em>"Evidence suggests that…"</em>.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-800">Recent Learning History</p>
                <span className="text-xs text-gray-400">tersimpan otomatis</span>
              </div>
              {historyLog.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada history. Mulai chat atau quiz, progress akan tersimpan saat app ditutup.</p>
              ) : (
                <div className="space-y-2">
                  {historyLog.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm border border-gray-100 rounded-xl px-3 py-2">
                      <span className="font-semibold text-gray-800 capitalize min-w-20">{String(item.type || "event")}</span>
                      <span className="text-gray-600 truncate">{String(item.label || "-")}</span>
                      <span className="ml-auto text-xs font-bold text-indigo-600">{String(item.value || "")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAT */}
        {tab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
              <div><p className="font-bold text-gray-800 text-sm">Conversation Practice</p><p className="text-xs text-gray-400">+5 XP per message · Azar-style inline corrections</p></div>
              <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">{chatN} sent</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-4/5 rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${m.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"}`}>
                    {m.role === "ai" && <span className="block text-xs font-semibold text-indigo-500 mb-1">AI Tutor</span>}
                    {String(m.text || "")}
                  </div>
                </div>
              ))}
              {chatLoad && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">{[0,1,2].map((i) => <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i*0.12}s` }} />)}</div>
                  </div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
              <input value={chatIn} onChange={(e) => setChatIn(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Type in English… (Enter to send)" disabled={chatLoad}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
              <button onClick={sendChat} disabled={chatLoad || !chatIn.trim()} className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* GRAMMAR */}
        {tab === "grammar" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {gLoad ? <Spin c="violet" msg="Loading lesson…" /> :
             gError ? <NotReady onBack={() => { setGTopic(null); setGError(false); }} /> :
             gTopic && gData ? (
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
                  <Back onClick={() => { setGTopic(null); setGData(null); }} />
                  <div className="min-w-0"><p className="font-bold text-gray-800 text-sm truncate">{gTopic.label}</p><p className="text-xs text-gray-400">{gTopic.sub}</p></div>
                  <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${C[gTopic.col]?.tg}`}>IELTS {gTopic.band}</span>
                </div>
                <div className="p-5 space-y-4">
                  {gData.grammarChart && (
                    <div className="bg-indigo-950 rounded-2xl p-4 border border-indigo-800">
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">📊 Azar Grammar Chart</p>
                      <pre className="text-indigo-100 text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">{gData.grammarChart}</pre>
                    </div>
                  )}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm"><BookOpen className="w-4 h-4 text-indigo-500" />Form · Meaning · Use</h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{gData.explanation}</p>
                    <div className="space-y-2">
                      {gData.keyRules?.map((r, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                          <p className="text-sm text-gray-700">{r}</p>
                        </div>
                      ))}
                    </div>
                    {gData.azarNotes?.length > 0 && (
                      <div className="border-t border-gray-100 pt-3 space-y-1.5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">📌 Notes</p>
                        {gData.azarNotes.map((n, i) => <p key={i} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{n}</p>)}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm mb-3"><Lightbulb className="w-4 h-4 text-amber-400" />Contoh Kalimat</h3>
                    <div className="space-y-3">
                      {gData.examples?.map((ex, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1">
                          <p className="text-sm font-semibold text-indigo-700">"{ex.sentence}"</p>
                          <p className="text-xs text-gray-400 italic">{ex.indonesian}</p>
                          <p className="text-xs text-gray-500">→ {ex.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm mb-3"><XCircle className="w-4 h-4 text-red-400" />Kesalahan Umum Pelajar Indonesia</h3>
                    <div className="space-y-3">
                      {gData.commonMistakes?.map((m, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2 text-sm"><XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" /><span className="text-red-500 line-through">{m.wrong}</span></div>
                          <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /><span className="text-emerald-700 font-medium">{m.right}</span></div>
                          <p className="text-xs text-gray-400 pl-5">{m.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                    <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div><p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">IELTS Tip</p><p className="text-sm text-amber-700">{gData.ieltsTip}</p></div>
                  </div>
                  {gData.studyCase && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Dynamic Study Case</p>
                      <p className="text-sm font-semibold text-slate-800">{gData.studyCase.context}</p>
                      <p className="text-sm text-slate-600 mt-1">{gData.studyCase.task}</p>
                      <ul className="mt-3 space-y-1 text-xs text-slate-600">
                        {(gData.studyCase.checklist || []).map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                  )}
                  {gData.generatedMeta?.references?.map((ref) => (
                    <div key={ref.url} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700">
                      🔗 <a href={ref.url} target="_blank" rel="noreferrer" onClick={() => trackRefClick(gTopic?.label || "")} className="text-indigo-700 hover:underline">{ref.label}</a>
                    </div>
                  ))}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm"><GraduationCap className="w-4 h-4 text-indigo-500" />Quiz · Azar Style</h3>
                      {qDone && <span className="text-sm font-bold text-indigo-600">{gData.quiz?.filter((q,i)=>Number(qAns[i])===q.answer).length}/{gData.quiz?.length}</span>}
                    </div>
                    <div className="space-y-5">{gData.quiz?.map((q, qi) => <QBlock key={qi} q={q} qi={qi} ans={qAns} setAns={setQAns} done={qDone} />)}</div>
                    {!qDone
                      ? <button onClick={submitGrammar} disabled={Object.keys(qAns).length < (gData.quiz?.length ?? 5)} className="mt-5 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors">Submit Jawaban</button>
                      : <ScoreCard score={gData.quiz.filter((q,i)=>Number(qAns[i])===q.answer).length} total={gData.quiz.length} onRetry={() => { setQAns({}); setQDone(false); }} />
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5">
                <p className="font-bold text-gray-800 mb-0.5">Grammar Lessons</p>
                <p className="text-sm text-gray-400 mb-5">Azar method · Grammar Chart · Form/Meaning/Use · Quiz</p>
                <div className="grid grid-cols-2 gap-3">
                  {G_TOPICS.map((t) => { const c = C[t.col] || C.blue; const done = doneL.has(t.id); return (
                    <button key={t.id} onClick={() => loadGrammar(t)} className={`${c.bg} border ${c.br} rounded-2xl p-4 text-left hover:shadow-md transition-all relative`}>
                      {done && <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-emerald-500" />}
                      <div className="text-2xl mb-2">{t.icon}</div>
                      <div className={`font-bold text-sm ${c.tx}`}>{t.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{t.sub}</div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.tg} inline-block mt-2`}>IELTS {t.band}</span>
                    </button>
                  ); })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VOCAB */}
        {tab === "vocab" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {vLoad ? <Spin c="emerald" msg="Loading vocabulary…" /> :
             vError ? <NotReady onBack={() => { setVCat(null); setVError(false); }} /> :
             vCat && vWords ? (() => { const w = vWords[vIdx]; if (!w) return null; return (
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
                  <Back onClick={() => { setVCat(null); setVWords(null); }} />
                  <div><p className="font-bold text-gray-800 text-sm">{vCat.label}</p><p className="text-xs text-gray-400">{vIdx+1}/{vWords.length} · +5 XP per card</p></div>
                  <button onClick={() => loadVocab(vCat)} className="ml-auto w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="p-5">
                  <div className="flex gap-1.5 mb-4 justify-center">
                    {vWords.map((_, i) => <div key={i} onClick={() => { setVIdx(i); setVFlip(false); }} className={`h-2 rounded-full cursor-pointer transition-all ${i===vIdx?"w-6 bg-emerald-500":"w-2 bg-gray-200"}`} />)}
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-center text-white">
                      <div className="text-4xl font-black">{w.word}</div>
                      <div className="text-emerald-200 text-sm mt-1 font-mono">{w.pronunciation}</div>
                      <div className="flex justify-center gap-2 mt-3 flex-wrap">
                        {[w.partOfSpeech, w.level, `IELTS ${w.ieltsBand}`].map((tag, i) => <span key={i} className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">{tag}</span>)}
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Definition</p><p className="text-gray-800 text-sm leading-relaxed">{w.definition}</p></div>
                      <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bahasa Indonesia</p><p className="text-gray-500 text-sm italic">{w.indonesian}</p></div>
                      {vFlip ? (<>
                        <div className="border-t border-gray-100 pt-4"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Example (2024–25)</p><p className="text-gray-700 text-sm italic leading-relaxed">"{w.example}"</p></div>
                        {w.collocations?.length > 0 && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Collocations</p><div className="flex flex-wrap gap-1.5">{w.collocations.map((col,i) => <span key={i} className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">{col}</span>)}</div></div>}
                        {w.synonyms?.length > 0 && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Synonyms</p><div className="flex flex-wrap gap-1.5">{w.synonyms.map((s,i) => <span key={i} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">{s}</span>)}</div></div>}
                        <div className="flex gap-2 pt-2">
                          <button disabled={vIdx===0} onClick={() => { setVIdx(p=>p-1); setVFlip(false); }} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors">← Prev</button>
                          <button onClick={nextCard} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors">{vIdx<vWords.length-1?"Next +5 XP →":"Done ✓ +15 XP"}</button>
                        </div>
                      </>) : <button onClick={() => setVFlip(true)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors">Show Example & Details →</button>}
                    </div>
                  </div>
                </div>
              </div>
            ); })() : (
              <div className="flex-1 overflow-y-auto p-5">
                <p className="font-bold text-gray-800 mb-0.5">Vocabulary Builder</p>
                <p className="text-sm text-gray-400 mb-5">8 words/session · definition, collocations, synonyms · +5 XP per card</p>
                <div className="grid grid-cols-2 gap-3">
                  {V_CATS.map((cat) => (
                    <button key={cat.id} onClick={() => loadVocab(cat)} className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:shadow-md hover:border-emerald-300 transition-all">
                      <div className="text-2xl mb-2">{cat.icon}</div>
                      <div className="font-bold text-sm text-gray-800">{cat.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* READING */}
        {tab === "reading" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {rLoad ? <Spin c="amber" msg="Loading passage…" /> :
             rError ? <NotReady onBack={() => setRError(false)} /> :
             rData ? (
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
                  <Back onClick={() => { setRData(null); setRAns({}); setRDone(false); }} />
                  <div className="min-w-0"><p className="font-bold text-gray-800 text-sm truncate">{rData.title}</p><p className="text-xs text-gray-400 capitalize">{rData.difficulty} · IELTS Academic</p></div>
                  {rDone && <span className="ml-auto text-sm font-bold text-amber-600 flex-shrink-0">{rData.questions?.filter((q,i)=>Number(rAns[i])===q.answer).length}/{rData.questions?.length}</span>}
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm mb-3"><FileText className="w-4 h-4 text-amber-500" />Reading Passage</h3>
                    <p className="text-sm text-gray-700 leading-loose whitespace-pre-line">{rData.passage}</p>
                  </div>
                  {rData.vocabulary?.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3">Key Vocabulary</p>
                      <div className="space-y-2">
                        {rData.vocabulary.map((v, i) => (
                          <div key={i} className="flex items-baseline gap-2 text-sm flex-wrap">
                            <span className="font-bold text-amber-700">{v.word}</span>
                            <span className="text-gray-600 flex-1">{v.definition}</span>
                            <span className="text-gray-400 italic text-xs">{v.indonesian}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm mb-4"><GraduationCap className="w-4 h-4 text-indigo-500" />Comprehension Questions</h3>
                    <div className="space-y-5">{rData.questions?.map((q, qi) => <QBlock key={qi} q={q} qi={qi} ans={rAns} setAns={setRAns} done={rDone} />)}</div>
                    {!rDone
                      ? <button onClick={submitReading} disabled={Object.keys(rAns).length < (rData.questions?.length ?? 5)} className="mt-5 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 transition-colors">Submit Jawaban</button>
                      : <div>
                          <ScoreCard score={rData.questions.filter((q,i)=>Number(rAns[i])===q.answer).length} total={rData.questions.length} />
                          {rData.generatedMeta?.references?.map((ref) => (
                            <div key={ref.url} className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
                              🔗 <a href={ref.url} target="_blank" rel="noreferrer" onClick={() => trackRefClick(rData?.topic || rData?.title || "")} className="text-indigo-700 hover:underline">{ref.label}</a>
                            </div>
                          ))}
                          {rData.ieltsTips?.map((tip,i) => <div key={i} className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">💡 {tip}</div>)}
                          <button onClick={() => { setRData(null); setRAns({}); setRDone(false); pickPassage(); }} className="mt-3 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors">Another Passage</button>
                        </div>
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5">
                <p className="font-bold text-gray-800 mb-0.5">Reading Comprehension</p>
                <p className="text-sm text-gray-400 mb-5">IELTS Academic passages · 5 questions · key vocab · strategies · XP</p>
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{v:"beginner",l:"Beginner",b:"Band 5–6"},{v:"intermediate",l:"Intermediate",b:"Band 6–7"},{v:"advanced",l:"Advanced",b:"Band 7–8"}].map((d) => (
                        <button key={d.v} onClick={() => setRDiff(d.v)} className={`p-3 rounded-xl border text-sm font-medium transition-all text-center ${rDiff===d.v?"border-amber-500 bg-amber-50 text-amber-800":"border-gray-200 text-gray-600 hover:border-amber-300"}`}>
                          <div>{d.l}</div><div className="text-xs text-gray-400 mt-0.5">{d.b}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={pickPassage} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white rounded-2xl font-bold text-base transition-opacity shadow-sm">
                    Start Reading →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {tab === "achievements" && (
          <div className="flex-1 overflow-y-auto p-5">
            <p className="font-bold text-gray-800 mb-0.5">Achievements</p>
            <p className="text-sm text-gray-400 mb-4">{earned.length}/{BADGES.length} unlocked · {xp} XP total</p>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">{lvl.emoji} {lvl.name} — Level {lvl.n}</span>
                {lvl.n < 7 && <span className="text-gray-400">{nxt.min - xp} XP to go</span>}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                {LEVELS.map((l) => <span key={l.n} className={l.n===lvl.n?"text-indigo-600 font-bold":""}>{l.emoji}</span>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BADGES.map((b) => { const isEarned = earned.includes(b.id); return (
                <div key={b.id} className={`rounded-2xl p-4 border transition-all ${isEarned?"bg-white border-gray-200 shadow-sm":"bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl ${!isEarned?"grayscale opacity-40":""}`}>{b.icon}</div>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm ${isEarned?"text-gray-800":"text-gray-400"}`}>{b.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">{b.desc}</p>
                      <p className={`text-xs font-semibold mt-1 ${isEarned?"text-indigo-600":"text-gray-400"}`}>{isEarned?`✓ +${b.xpR} XP earned`:`+${b.xpR} XP`}</p>
                    </div>
                  </div>
                </div>
              ); })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
