import { Check, ChevronLeft } from "lucide-react";
import { isCorrectAnswer } from "../../lib/study-content";

export function ProgressBar({ value, max = 100, label }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.min(value, max)}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span
        style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }}
      />
    </div>
  );
}
export function BackButton({ onClick, children = "Kembali" }) {
  return (
    <button className="back-button" onClick={onClick}>
      <ChevronLeft size={17} />
      {children}
    </button>
  );
}
export function Loading({ label = "Menyiapkan materi belajar…" }) {
  return (
    <div className="study-state" role="status">
      <span className="loading-line" />
      <h2>{label}</h2>
      <p>Materi inti tetap tersedia tanpa layanan AI.</p>
    </div>
  );
}
export function ErrorState({ retry }) {
  return (
    <div className="study-state" role="alert">
      <h2>Materi belum bisa dibuka</h2>
      <p>File materi dan cadangan tidak dapat dibaca. Coba muat ulang.</p>
      <button className="button primary" onClick={retry}>
        Coba lagi
      </button>
    </div>
  );
}
export function RichText({ children = "" }) {
  return String(children)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}
export function QuizQuestion({ question, index, answer, onAnswer, checked }) {
  if (!question.options.length)
    return (
      <fieldset className="quiz-question">
        <legend>
          <span className="question-number">
            {String(index + 1).padStart(2, "0")}
          </span>
          {question.question}
        </legend>
        <label className="short-answer-label" htmlFor={`answer-${index}`}>
          Jawaban singkat
        </label>
        <input
          className="short-answer"
          id={`answer-${index}`}
          value={answer || ""}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={checked}
          autoComplete="off"
        />
        {checked && (
          <p className="answer-explanation">
            {isCorrectAnswer(question, answer)
              ? "Sesuai acuan. "
              : "Bandingkan dengan acuan. "}
            {question.explanation}
          </p>
        )}
      </fieldset>
    );
  return (
    <fieldset className="quiz-question">
      <legend>
        <span className="question-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        {question.question}
      </legend>
      <div className="answer-list">
        {question.options.map((option, i) => {
          const state = checked
            ? i === question.answer
              ? "correct"
              : answer === i
                ? "incorrect"
                : ""
            : answer === i
              ? "selected"
              : "";
          return (
            <label key={i} className={`answer-option ${state}`}>
              <input
                type="radio"
                name={`question-${index}`}
                value={i}
                checked={answer === i}
                disabled={checked}
                onChange={() => onAnswer(i)}
              />
              <span className="option-letter">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{option}</span>
              {checked && i === question.answer && (
                <Check size={18} aria-label="Jawaban benar" />
              )}
            </label>
          );
        })}
      </div>
      {checked && (
        <p className="answer-explanation">
          {answer === question.answer ? "Benar. " : "Perlu diulang. "}
          {question.explanation}
        </p>
      )}
    </fieldset>
  );
}
