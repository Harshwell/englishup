"use client";
import React, { useEffect, useState } from "react";
import { Award, BookOpen, FileText, GraduationCap, Layers, MessageSquare, Send, Target } from "lucide-react";
import Flashcards from "./Flashcards";
import { getFallbackGrammar, getFallbackReadingPool, getFallbackVocab } from "../lib/fallback-content";

const NAV = [
  { id: "home", label: "Home", icon: GraduationCap },
  { id: "chat", label: "Conversation", icon: MessageSquare },
  { id: "grammar", label: "Grammar", icon: BookOpen },
  { id: "vocab", label: "Vocabulary", icon: Layers },
  { id: "reading", label: "Reading", icon: FileText },
  { id: "flashcards", label: "Flashcards", icon: Award },
  { id: "feedback", label: "Feedback", icon: Target }
];

async function chat(prompt) {
  const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, max: 700 }) });
  return await res.json();
}

async function evaluate(text) {
  const res = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  return await res.json();
}

export default function EnglishUpEnhanced() {
  const [tab, setTab] = useState("home");
  const [messages, setMessages] = useState([{ role: "ai", text: "Halo. Kita fokus ke English yang relevan untuk IELTS Band 7+, bukan jawaban AI yang rapi tapi kosong." }]);
  const [input, setInput] = useState("");
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [grammar, setGrammar] = useState(null);
  const [vocab, setVocab] = useState(null);
  const [reading, setReading] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const g = await fetch("/data/grammar/articles.json").then(r => r.ok ? r.json() : null);
        setGrammar(g || getFallbackGrammar("articles"));
      } catch { setGrammar(getFallbackGrammar("articles")); }
      try {
        const v = await fetch("/data/vocab/ielts_academic.json").then(r => r.ok ? r.json() : null);
        setVocab(v || getFallbackVocab("ielts_academic"));
      } catch { setVocab(getFallbackVocab("ielts_academic")); }
      try {
        const r = await fetch("/data/reading/passages.json").then(x => x.ok ? x.json() : null);
        setReading((r && r[0]) || getFallbackReadingPool()[0]);
      } catch { setReading(getFallbackReadingPool()[0]); }
    })();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const next = [...messages, { role: "user", text: input }];
    setMessages(next);
    setInput("");
    try {
      const joined = next.map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`).join("\n");
      const out = await chat(`You are an IELTS-focused English tutor for an Indonesian learner.\n\n${joined}`);
      setMessages((prev) => [...prev, { role: "ai", text: out.text || out.error || "No response" }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", text: `Error: ${e.message}` }]);
    }
  };

  const runEvaluate = async () => {
    if (!essay.trim()) return;
    const out = await evaluate(essay);
    setFeedback(out);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <header className="rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-sky-800 text-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-200">EnglishUp v3</p>
          <h1 className="text-3xl font-black mt-2">Data-backed IELTS practice</h1>
          <p className="mt-2 max-w-2xl text-sm text-indigo-100 leading-relaxed">Materi statis, fallback lokal, chat Gemini/OpenRouter, flashcards, dan evaluasi tulisan berbasis rubrik.</p>
        </header>
        <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Primary" className="rounded-3xl bg-white border border-slate-200 p-3 h-fit shadow-sm">
            <ul className="space-y-1">{NAV.map((item) => { const Icon = item.icon; const active = tab === item.id; return <li key={item.id}><button onClick={() => setTab(item.id)} className={`w-full rounded-2xl px-3 py-3 text-left flex items-center gap-3 ${active ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}><Icon className="w-4 h-4" /><span className="text-sm font-semibold">{item.label}</span></button></li>; })}</ul>
          </nav>
          <section className="space-y-4">
            {tab === "home" && <div className="grid gap-4 md:grid-cols-3"><div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm"><h2 className="text-lg font-black text-slate-900">System</h2><p className="mt-2 text-sm text-slate-600">Pipeline v3, flashcards, evaluate route, better accessibility, and non-blocking fallback content.</p></div><div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm"><h2 className="text-lg font-black text-slate-900">Grammar</h2><p className="mt-2 text-sm text-slate-600">Lessons are loaded from static JSON first, then safely fall back to local curated content.</p></div><div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm"><h2 className="text-lg font-black text-slate-900">Feedback</h2><p className="mt-2 text-sm text-slate-600">Writing feedback is structured around cohesion, syntax, vocabulary, grammar, and conventions.</p></div></div>}
            {tab === "chat" && <section className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden"><header className="border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-black text-slate-900">Conversation</h2></header><div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">{messages.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"}`}>{m.text}</div></div>)}</div><div className="border-t border-slate-100 p-4 flex gap-2"><input aria-label="Conversation input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Write in English..." className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm" /><button onClick={sendMessage} className="rounded-2xl bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700"><Send className="w-4 h-4" /></button></div></section>}
            {tab === "grammar" && <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 space-y-4"><h2 className="text-lg font-black text-slate-900">Grammar</h2><div className="rounded-2xl bg-slate-50 p-4 border border-slate-100"><h3 className="text-sm font-bold text-slate-800 mb-2">Explanation</h3><p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{grammar?.explanation}</p></div></section>}
            {tab === "vocab" && <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 space-y-4"><h2 className="text-lg font-black text-slate-900">Vocabulary</h2><div className="grid gap-3 md:grid-cols-2">{(vocab?.words || []).slice(0, 6).map((word) => <article key={word.word} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-base font-black text-slate-900">{word.word}</h3><span className="rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-1">{word.level}</span></div><p className="mt-2 text-sm text-slate-700">{word.definition}</p><p className="mt-2 text-sm italic text-slate-500">"{word.example}"</p></article>)}</div></section>}
            {tab === "reading" && <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 space-y-4"><h2 className="text-lg font-black text-slate-900">Reading</h2><article className="rounded-2xl bg-slate-50 p-4 border border-slate-100"><h3 className="text-sm font-bold text-slate-800 mb-3">{reading?.title}</h3><p className="text-sm text-slate-700 leading-loose whitespace-pre-line">{reading?.passage}</p></article></section>}
            {tab === "flashcards" && <Flashcards />}
            {tab === "feedback" && <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 space-y-4"><h2 className="text-lg font-black text-slate-900">Writing feedback</h2><textarea aria-label="Essay input" value={essay} onChange={(e) => setEssay(e.target.value)} rows={10} placeholder="Paste a paragraph or short essay here..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" /><button onClick={runEvaluate} className="rounded-2xl bg-slate-900 px-4 py-3 text-white font-semibold hover:bg-slate-800">Evaluate text</button>{feedback && <div className="grid gap-4 md:grid-cols-2"><article className="rounded-2xl bg-slate-50 p-4 border border-slate-100"><h3 className="text-sm font-bold text-slate-800 mb-2">Scores</h3><pre className="text-xs text-slate-700 whitespace-pre-wrap">{JSON.stringify(feedback.scores || feedback, null, 2)}</pre></article><article className="rounded-2xl bg-slate-50 p-4 border border-slate-100"><h3 className="text-sm font-bold text-slate-800 mb-2">Next steps</h3><ul className="space-y-2 text-sm text-slate-700">{(feedback.recommendations || []).map((item) => <li key={item}>• {item}</li>)}</ul></article></div>}</section>}
          </section>
        </div>
      </div>
    </main>
  );
}
