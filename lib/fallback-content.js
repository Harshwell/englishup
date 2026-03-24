const grammarMeta = {
  articles: { label: "Articles", sub: "a, an, the & zero article" },
  present_perfect: { label: "Present Perfect", sub: "have/has + past participle" },
  passive_voice: { label: "Passive Voice", sub: "is/was/has been + V3" },
  conditionals: { label: "Conditionals", sub: "0, 1st, 2nd, 3rd types" },
  relative_clauses: { label: "Relative Clauses", sub: "who, which, that, where" },
  modal_verbs: { label: "Modal Verbs", sub: "can, could, must, should" },
  reported_speech: { label: "Reported Speech", sub: "He said that..." },
  gerunds_inf: { label: "Gerunds & Infinitives", sub: "enjoy doing vs want to do" },
};

const vocabMeta = {
  ielts_academic: { label: "IELTS Academic", theme: "academic study and formal argument" },
  daily_convo: { label: "Daily Conversation", theme: "natural daily conversation" },
  tech_ai: { label: "Tech & AI", theme: "technology and artificial intelligence" },
  environment: { label: "Environment", theme: "climate and sustainability" },
  social_issues: { label: "Social Issues", theme: "public policy and social debate" },
  business: { label: "Business & Work", theme: "professional communication" },
};

const readingPassages = [
  {
    title: "AI Tools in the Classroom",
    topic: "Artificial Intelligence and Education",
    difficulty: "intermediate",
    passage: "Universities are increasingly integrating artificial intelligence tools into classroom practice. Supporters argue that such systems can provide rapid feedback, personalised exercises, and more efficient administrative support. Critics, however, warn that over-reliance on AI may weaken independent thinking if students begin to treat automated output as unquestionable. In practice, the educational value of AI depends less on the tool itself than on how teachers design learning tasks. When students are asked to compare, evaluate, or revise AI-generated material, they may develop stronger analytical skills. By contrast, when the technology is used merely to produce quick answers, it can encourage superficial engagement. As a result, many educators now see AI not as a replacement for instruction, but as a device that must be carefully managed within it.",
    vocabulary: [
      { word: "integrating", definition: "combining into an existing system", indonesian: "mengintegrasikan" },
      { word: "over-reliance", definition: "depending on something too much", indonesian: "ketergantungan berlebihan" },
      { word: "superficial", definition: "not deep or thorough", indonesian: "dangkal" },
    ],
    questions: [
      { question: "What is the main idea of the passage?", options: ["A) AI should replace teachers", "B) AI is always harmful in education", "C) AI is useful only when applied thoughtfully", "D) Students reject AI in universities"], answer: 2, explanation: "The passage argues that AI's value depends on how it is used by teachers and students." },
      { question: "Which concern do critics raise?", options: ["A) AI makes classrooms quieter", "B) AI may reduce independent thinking", "C) AI is too expensive for schools", "D) AI cannot give feedback"], answer: 1, explanation: "The passage explicitly mentions weaker independent thinking as a risk." },
      { question: "Teachers can strengthen analytical skills by asking students to...", options: ["A) memorise AI responses", "B) avoid all digital tools", "C) compare and revise AI output", "D) submit work without discussion"], answer: 2, explanation: "The text states that comparing, evaluating, and revising AI material can improve analysis." },
      { question: "True/False/Not Given: The author believes AI should be banned from universities.", options: ["A) True", "B) False", "C) Not Given", "D) Both true and false"], answer: 1, explanation: "The author does not support a ban; instead, the author supports careful use." },
      { question: "The word 'managed' is closest in meaning to...", options: ["A) controlled", "B) ignored", "C) copied", "D) simplified"], answer: 0, explanation: "In context, 'managed' means directed or controlled effectively." },
    ],
    ieltsTips: ["Read the question stem first so you know what detail to scan for.", "Do not choose an answer just because it repeats words from the passage; check the meaning."],
  },
  {
    title: "Remote Work and Output",
    topic: "Remote Work and Productivity",
    difficulty: "beginner",
    passage: "Remote work became more common after many companies realised that employees could remain productive outside a traditional office. Some workers appreciate the flexibility because it allows them to save commuting time and organise their day more efficiently. Others find remote work challenging because home environments can include distractions, limited space, or weak boundaries between personal and professional life. Researchers therefore suggest that productivity depends on routine, clear expectations, and communication systems rather than location alone. A worker with a structured schedule and realistic goals may perform well at home, while someone without those conditions may struggle in either setting.",
    vocabulary: [
      { word: "flexibility", definition: "the ability to adjust easily", indonesian: "fleksibilitas" },
      { word: "commuting", definition: "travelling regularly to work", indonesian: "perjalanan ke tempat kerja" },
      { word: "routine", definition: "a regular way of doing things", indonesian: "rutinitas" },
    ],
    questions: [
      { question: "Why do some workers like remote work?", options: ["A) It removes all meetings", "B) It gives more flexibility", "C) It increases office space", "D) It reduces communication"], answer: 1, explanation: "The passage says some workers value flexibility and saved commuting time." },
      { question: "What can make remote work difficult?", options: ["A) Too much office noise", "B) Lack of internet worldwide", "C) Distractions at home", "D) Fewer emails"], answer: 2, explanation: "The passage lists distractions and limited space as problems." },
      { question: "According to researchers, productivity depends mainly on...", options: ["A) city size", "B) location alone", "C) routine and clear expectations", "D) working at night"], answer: 2, explanation: "The text states productivity depends on routine, expectations, and communication systems." },
      { question: "True/False/Not Given: Everyone works better at home.", options: ["A) True", "B) False", "C) Not Given", "D) Depends"], answer: 1, explanation: "The passage says some people perform well at home, but not everyone." },
      { question: "The word 'structured' is closest in meaning to...", options: ["A) organised", "B) expensive", "C) private", "D) tiring"], answer: 0, explanation: "A structured schedule is an organised one." },
    ],
    ieltsTips: ["In easier passages, focus on sentence meaning rather than translating every word.", "For True/False/Not Given, separate contradiction from absence of information."],
  },
  {
    title: "Cities and Climate Planning",
    topic: "Climate Change and Urban Planning",
    difficulty: "advanced",
    passage: "Urban planners increasingly recognise that climate adaptation must be embedded in long-term development rather than treated as a separate emergency response. Rising temperatures, irregular rainfall, and intensified flooding can all disrupt transport, housing, and public health. Consequently, many cities are redesigning drainage systems, expanding green infrastructure, and revising land-use regulations. Yet the challenge is not purely technical. Adaptation policies often require political coordination, sustained investment, and public acceptance, all of which can be difficult to secure over time. Moreover, planners must weigh immediate economic pressures against long-term environmental resilience. A city that delays adaptation may reduce short-term expenditure, but it often incurs greater costs when future climate impacts become more severe.",
    vocabulary: [
      { word: "embedded", definition: "firmly included as part of something", indonesian: "tertanam / melekat" },
      { word: "drainage", definition: "systems that remove water", indonesian: "drainase" },
      { word: "resilience", definition: "ability to recover from difficulty", indonesian: "ketahanan" },
    ],
    questions: [
      { question: "What is the writer's main argument?", options: ["A) Climate adaptation should be part of long-term planning", "B) Flooding is no longer a city problem", "C) Cities should avoid green infrastructure", "D) Public health is unrelated to climate"], answer: 0, explanation: "The first sentence states the main argument directly." },
      { question: "Why is adaptation difficult?", options: ["A) It is purely a technical issue", "B) It requires coordination and investment", "C) Citizens always reject it", "D) It only affects transport"], answer: 1, explanation: "The passage says the problem is not purely technical and needs coordination, money, and acceptance." },
      { question: "What may happen if a city delays adaptation?", options: ["A) It will certainly become richer", "B) It will avoid all future risk", "C) It may face higher future costs", "D) It will reduce rainfall"], answer: 2, explanation: "The final sentence explains that delaying action often leads to greater long-term costs." },
      { question: "True/False/Not Given: The passage states that green infrastructure alone can solve climate adaptation.", options: ["A) True", "B) False", "C) Not Given", "D) Irrelevant"], answer: 1, explanation: "The writer presents green infrastructure as one measure, not a complete solution." },
      { question: "The phrase 'weigh immediate economic pressures' suggests planners must...", options: ["A) ignore budgets", "B) compare competing priorities", "C) count buildings", "D) reduce public input"], answer: 1, explanation: "'Weigh' here means compare and judge competing concerns." },
    ],
    ieltsTips: ["In advanced texts, identify concession signals such as yet, however, and moreover.", "Main-idea questions often depend on the first and last sentences of a paragraph."],
  },
];

function buildGrammar(id) {
  const meta = grammarMeta[id];
  if (!meta) return null;
  return {
    grammarChart: `TOPIC | ${meta.label}\nFORM | Core pattern for ${meta.sub}\nUSE | Use it to express accurate meaning in context\nCHECK | Notice subject, verb form, and supporting words`,
    explanation: `${meta.label} is a high-value grammar area for learners preparing for IELTS. Focus first on the form, then on the meaning, and finally on the situations where the structure sounds natural. Indonesian learners often understand the idea but skip small grammatical markers, which is exactly where band scores quietly bleed out.\n\nA useful strategy is to compare one correct sentence with one incorrect sentence and explain why the form changes. That habit builds control instead of vague familiarity.`,
    keyRules: [
      `Memorise the core form for ${meta.label}.`,
      `Check meaning before choosing a structure mechanically.`,
      `Watch small grammar signals such as articles, auxiliaries, or clause markers.`,
      `Use the pattern in speaking and writing, not only in isolated drills.`,
    ],
    azarNotes: [
      `Treat ${meta.label} as a form-meaning-use system, not as a translation exercise.`,
      `Common Indonesian learner issue: meaning is clear, but the grammar marker is missing or misused.`,
    ],
    examples: [
      { sentence: `I reviewed ${meta.label.toLowerCase()} before my IELTS study session.`, note: `Model sentence showing controlled use of ${meta.label}.`, indonesian: `Saya meninjau ${meta.label.toLowerCase()} sebelum sesi belajar IELTS.` },
      { sentence: `My tutor corrected the structure because one small form changed the meaning.`, note: `Small grammar details often affect clarity and score.`, indonesian: `Tutor saya mengoreksi strukturnya karena satu bentuk kecil mengubah maknanya.` },
    ],
    commonMistakes: [
      { wrong: `Learner uses ${meta.label} without checking the required form.`, right: `Learner checks the structure, then writes the sentence accurately.`, why: `Many errors come from guessing based on meaning alone.` },
      { wrong: `Learner copies a memorised pattern into the wrong context.`, right: `Learner matches the form to the intended meaning and context.`, why: `Grammar choice depends on use, not only memorisation.` },
    ],
    ieltsTip: `${meta.label} often affects both grammatical range and accuracy. In IELTS Writing and Speaking, one accurate sentence is worth more than five messy ones pretending to be advanced.`,
    quiz: [
      { question: `Which option best reflects controlled use of ${meta.label}?`, type: "choose-form", options: ["A) The form matches the meaning and context", "B) Any advanced-looking sentence is acceptable", "C) Translation is enough", "D) Grammar markers do not matter"], answer: 0, explanation: `Correct grammar depends on form, meaning, and use.` },
      { question: `What should you check first in ${meta.label}?`, type: "choose-form", options: ["A) The core pattern", "B) The font", "C) The paragraph length", "D) The topic title"], answer: 0, explanation: `Start with the grammatical form.` },
      { question: `Why do Indonesian learners often lose marks here?`, type: "choose-form", options: ["A) They know too many rules", "B) They omit small but necessary grammar signals", "C) They write too slowly", "D) They always use British spelling"], answer: 1, explanation: `Small markers are often the weak point.` },
      { question: `The best learning method is to...`, type: "choose-form", options: ["A) memorise only definitions", "B) avoid examples", "C) compare correct and incorrect sentences", "D) skip practice"], answer: 2, explanation: `Comparison builds control.` },
      { question: `In IELTS, the safest strategy is to...`, type: "choose-form", options: ["A) force complex grammar everywhere", "B) use one accurate structure clearly", "C) ignore grammar in speaking", "D) rely only on vocabulary"], answer: 1, explanation: `Accuracy beats fake complexity.` },
    ],
  };
}

function buildVocab(id) {
  const meta = vocabMeta[id];
  if (!meta) return null;
  return {
    words: [
      { word: "significant", pronunciation: "/sɪgˈnɪf.ɪ.kənt/", partOfSpeech: "adjective", definition: `important or noticeable in ${meta.theme}`, indonesian: "signifikan / penting", level: "B2", ieltsBand: "6.5-7.0", example: `A significant trend in ${meta.theme} is careful decision-making based on evidence.`, collocations: ["significant change", "significant impact", "significant factor"], synonyms: ["important", "notable"] },
      { word: "maintain", pronunciation: "/meɪnˈteɪn/", partOfSpeech: "verb", definition: "to continue something at the same level or condition", indonesian: "mempertahankan", level: "B2", ieltsBand: "6.5-7.0", example: `Learners must maintain consistent practice if they want stable progress.`, collocations: ["maintain standards", "maintain quality", "maintain focus"], synonyms: ["preserve", "sustain"] },
      { word: "approach", pronunciation: "/əˈprəʊtʃ/", partOfSpeech: "noun", definition: "a method of dealing with something", indonesian: "pendekatan", level: "B2", ieltsBand: "6.5-7.0", example: `A practical approach usually works better than vague motivation.`, collocations: ["practical approach", "systematic approach", "balanced approach"], synonyms: ["method", "strategy"] },
      { word: "allocate", pronunciation: "/ˈæl.ə.keɪt/", partOfSpeech: "verb", definition: "to give time, money, or resources for a purpose", indonesian: "mengalokasikan", level: "C1", ieltsBand: "7.0-7.5", example: `Many learners fail because they do not allocate enough time for review.`, collocations: ["allocate resources", "allocate time", "allocate funding"], synonyms: ["assign", "distribute"] },
      { word: "reliable", pronunciation: "/rɪˈlaɪ.ə.bəl/", partOfSpeech: "adjective", definition: "able to be trusted or depended on", indonesian: "andal / dapat dipercaya", level: "B2", ieltsBand: "6.5-7.0", example: `A reliable source is more valuable than ten random opinions online.`, collocations: ["reliable data", "reliable source", "reliable system"], synonyms: ["dependable", "trustworthy"] },
      { word: "enhance", pronunciation: "/ɪnˈhɑːns/", partOfSpeech: "verb", definition: "to improve the quality or value of something", indonesian: "meningkatkan", level: "C1", ieltsBand: "7.0-7.5", example: `Targeted feedback can enhance both accuracy and confidence.`, collocations: ["enhance performance", "enhance quality", "enhance understanding"], synonyms: ["improve", "boost"] },
      { word: "constraint", pronunciation: "/kənˈstreɪnt/", partOfSpeech: "noun", definition: "a limitation or restriction", indonesian: "kendala / batasan", level: "C1", ieltsBand: "7.0-7.5", example: `Time is a real constraint for most working adults.`, collocations: ["major constraint", "financial constraint", "under constraint"], synonyms: ["limitation", "restriction"] },
      { word: "outcome", pronunciation: "/ˈaʊt.kʌm/", partOfSpeech: "noun", definition: "the result of an action or process", indonesian: "hasil", level: "B2", ieltsBand: "6.5-7.0", example: `The outcome usually depends on consistency more than intensity.`, collocations: ["positive outcome", "desired outcome", "learning outcome"], synonyms: ["result", "consequence"] },
    ],
  };
}

export function getFallbackGrammar(id) {
  return buildGrammar(id);
}

export function getFallbackVocab(id) {
  return buildVocab(id);
}

export function getFallbackReadingPool() {
  return readingPassages;
}
