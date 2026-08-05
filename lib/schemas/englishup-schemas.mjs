const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const stringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");

function result(ok, data, error = "Invalid payload") {
  return ok ? { success: true, data } : { success: false, error };
}

export const quizItemSchema = {
  safeParse(value) {
    const options = Array.isArray(value?.options) ? value.options : [];
    const answerIndex = Number(value?.answer);
    const hasAnswerIndex = Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex < options.length;
    const correctAnswer = value?.correctAnswer ?? value?.correct_answer ?? (typeof value?.answer === "string" ? value.answer : undefined);
    const hasCorrectAnswer = typeof correctAnswer === "string" && options.includes(correctAnswer);
    const ok = isObject(value)
      && nonEmpty(value.question)
      && options.length >= 2
      && options.every((item) => typeof item === "string" && item.trim())
      && (hasAnswerIndex || hasCorrectAnswer);
    return result(ok, value, "Invalid quiz item");
  }
};

export const grammarLessonSchema = {
  safeParse(value) {
    const ok = isObject(value)
      && nonEmpty(value.explanation)
      && Array.isArray(value.examples)
      && value.examples.length > 0
      && value.examples.every((item) => isObject(item) && nonEmpty(item.sentence))
      && Array.isArray(value.quiz)
      && value.quiz.length > 0
      && value.quiz.every((item) => quizItemSchema.safeParse(item).success);
    return result(ok, value, "Invalid grammar lesson");
  }
};

export const vocabWordSchema = {
  safeParse(value) {
    const ok = isObject(value)
      && nonEmpty(value.word)
      && nonEmpty(value.definition)
      && nonEmpty(value.example);
    return result(ok, value, "Invalid vocabulary word");
  }
};

export const vocabPayloadSchema = {
  safeParse(value) {
    const ok = isObject(value)
      && Array.isArray(value.words)
      && value.words.length > 0
      && value.words.every((item) => vocabWordSchema.safeParse(item).success);
    return result(ok, value, "Invalid vocabulary payload");
  }
};

export const flashcardSchema = {
  safeParse(value) {
    const ok = isObject(value)
      && nonEmpty(value.front)
      && isObject(value.back)
      && nonEmpty(value.back.definition)
      && nonEmpty(value.back.example);
    return result(ok, value, "Invalid flashcard");
  }
};

export const flashcardDeckSchema = {
  safeParse(value) {
    const ok = Array.isArray(value) && value.length > 0 && value.every((item) => flashcardSchema.safeParse(item).success);
    return result(ok, value, "Invalid flashcard deck");
  }
};

export const contentVocabResponseSchema = {
  safeParse(value) {
    const ok = isObject(value)
      && Array.isArray(value.items)
      && value.items.length > 0
      && value.items.every((item) => flashcardSchema.safeParse(item).success);
    return result(ok, value, "Invalid generated vocabulary response");
  }
};

export const readingQuestionSchema = {
  safeParse(value) {
    const hasPrompt = isObject(value) && nonEmpty(value.question);
    if (!hasPrompt) return result(false, value, "Invalid reading question");
    if (Array.isArray(value.options)) return quizItemSchema.safeParse(value);
    const hasFreeAnswer = value.answer !== undefined || value.correctAnswer !== undefined || value.correct_answer !== undefined || Array.isArray(value.mapping);
    return result(hasFreeAnswer, value, "Invalid reading question");
  }
};

export const readingPassageSchema = {
  safeParse(value) {
    const ok = isObject(value)
      && nonEmpty(value.title)
      && nonEmpty(value.passage)
      && Array.isArray(value.questions)
      && value.questions.length > 0
      && value.questions.every((item) => readingQuestionSchema.safeParse(item).success);
    return result(ok, value, "Invalid reading passage");
  }
};

export const readingPoolSchema = {
  safeParse(value) {
    const ok = Array.isArray(value) && value.length > 0 && value.every((item) => readingPassageSchema.safeParse(item).success);
    return result(ok, value, "Invalid reading pool");
  }
};

export const contentReadingResponseSchema = {
  safeParse(value) {
    const ok = isObject(value)
      && Array.isArray(value.items)
      && value.items.length > 0
      && value.items.every((item) => readingPassageSchema.safeParse(item).success);
    return result(ok, value, "Invalid generated reading response");
  }
};

export const contentGrammarResponseSchema = grammarLessonSchema;

export const aiGatewayResultSchema = {
  safeParse(value) {
    const ok = isObject(value) && nonEmpty(value.text) && nonEmpty(value.provider);
    return result(ok, value, "Invalid AI gateway result");
  }
};

export const evaluationResponseSchema = {
  safeParse(value) {
    const scoreKeys = ["cohesion", "syntax", "vocabulary", "grammar", "conventions"];
    const ok = isObject(value)
      && nonEmpty(value.provider)
      && isObject(value.scores)
      && scoreKeys.every((key) => Number.isInteger(Number(value.scores[key])) && Number(value.scores[key]) >= 1 && Number(value.scores[key]) <= 5)
      && Array.isArray(value.recommendations)
      && value.recommendations.length >= 1
      && value.recommendations.every((item) => typeof item === "string" && item.trim());
    return result(ok, value, "Invalid evaluation response");
  }
};

export const libraryItemsResponseSchema = {
  safeParse(value) {
    const ok = isObject(value) && Array.isArray(value.items);
    return result(ok, value, "Invalid library items response");
  }
};

export const dictionaryResponseSchema = {
  safeParse(value) {
    const ok = isObject(value) && isObject(value.item) && nonEmpty(value.item.word);
    return result(ok, value, "Invalid dictionary response");
  }
};

export const feedbackResponseSchema = {
  safeParse(value) {
    const ok = isObject(value) && value.ok === true && isObject(value.metrics);
    return result(ok, value, "Invalid feedback response");
  }
};

export function parseOrNull(schema, value) {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
