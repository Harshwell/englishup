"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global UI error:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <main className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">Application Error</p>
          <h1 className="text-2xl font-black text-slate-900">Terjadi error di client.</h1>
          <p className="text-sm text-slate-600">
            State atau data kemungkinan tidak valid. Coba refresh ulang, atau tekan tombol retry.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Retry
            </button>
            <a
              href="/"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
