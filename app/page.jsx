"use client";
import Link from "next/link";
import EnglishUp from "../components/EnglishUp";

export default function Page() {
  return (
    <>
      <EnglishUp />
      <div className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2">
        <Link
          href="/flashcards"
          className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700"
        >
          Open Flashcards
        </Link>
        <Link
          href="/pretest"
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
        >
          Start Placement Pretest
        </Link>
      </div>
    </>
  );
}
