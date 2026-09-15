"use client";
import { useEffect, useState } from "react";
import {
  emptyProgress,
  PROGRESS_KEY,
  recordActivity,
  restoreProgress,
} from "../../lib/study-progress.mjs";

export default function useStudyProgress() {
  const [progress, setProgress] = useState(emptyProgress);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [canSave, setCanSave] = useState(false);
  useEffect(() => {
    try {
      setProgress(
        restoreProgress(
          localStorage.getItem(PROGRESS_KEY),
          localStorage.getItem("englishup.v1.progress"),
        ),
      );
      setCanSave(true);
    } catch {
      setStorageError(
        "Progres tersimpan tidak dapat dibaca. Latihan tetap bisa berjalan untuk sesi ini; data lama tetap disimpan.",
      );
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    if (!ready || !canSave) return;
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      setStorageError(
        "Browser tidak mengizinkan penyimpanan. Progres sesi ini akan hilang saat halaman ditutup.",
      );
    }
  }, [progress, ready, canSave]);
  return {
    progress,
    ready,
    storageError,
    record: (event) => setProgress((p) => recordActivity(p, event)),
    setGoal: (goal) => setProgress((p) => ({ ...p, goal })),
  };
}
