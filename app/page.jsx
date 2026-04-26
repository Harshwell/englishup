"use client";
import Link from "next/link";
import { useState } from "react";
import { GraduationCap, PanelRightClose, PanelRightOpen } from "lucide-react";
import EnglishUp from "../components/EnglishUp";

export default function Page() {
  const [openQuickMenu, setOpenQuickMenu] = useState(false);

  return (
    <>
      <EnglishUp />
      <div className="fixed bottom-5 right-5 z-[120] flex flex-col items-end gap-2">
        {openQuickMenu && (
          <>
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
          </>
        )}
        <button
          type="button"
          onClick={() => setOpenQuickMenu((v) => !v)}
          aria-label="Toggle quick menu"
          className="rounded-full bg-indigo-600 p-3 text-white shadow-lg hover:bg-indigo-700"
        >
          <span className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {openQuickMenu ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </span>
        </button>
      </div>
    </>
  );
}
