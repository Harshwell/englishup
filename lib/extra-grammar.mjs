// Original practice material. Editorial review pending; not an official exam bank.
const lesson = (explanation, rules, examples, questions) => ({
  explanation,
  keyRules: rules,
  examples: examples.map(([sentence, note]) => ({ sentence, note })),
  quiz: questions.map(([question, options, answer, explanation]) => ({
    question,
    options,
    answer,
    explanation,
  })),
  azarNotes: ["Materi latihan orisinal EnglishUp; belum ditinjau pengajar."],
  commonMistakes: [],
  ieltsTip:
    "Saat mereview jawaban, jelaskan makna dan bentuknya sebelum mencoba ulang.",
});
export const extraGrammar = {
  conditionals: lesson(
    "Conditionals menghubungkan syarat dengan hasil. Pilih bentuk berdasarkan apakah situasinya kebiasaan, kemungkinan nyata, bayangan sekarang, atau masa lalu yang tidak terjadi.",
    [
      "Zero: if + present, present untuk kebiasaan atau hubungan umum.",
      "First: if + present, will + verb untuk kemungkinan masa depan.",
      "Second: if + past, would + verb untuk situasi hipotetis sekarang atau nanti.",
      "Third: if + had + V3, would have + V3 untuk masa lalu yang berbeda dari kenyataan.",
    ],
    [
      [
        "If the library is busy, I study at home.",
        "Kebiasaan: zero conditional.",
      ],
      ["If I finish early, I will join the call.", "Kemungkinan nyata nanti."],
      [
        "If I had more time, I would learn another language.",
        "Waktu sekarang terbatas.",
      ],
      [
        "If we had booked earlier, we would have paid less.",
        "Kami tidak memesan lebih awal.",
      ],
    ],
    [
      [
        "If it rains tomorrow, we ___ indoors.",
        ["will train", "would have trained", "trained"],
        0,
        "If memakai present untuk syarat masa depan; hasilnya will + verb.",
      ],
      [
        "I do not own a car. If I ___ one, I would drive to work.",
        ["have", "had", "will have"],
        1,
        "Situasi bertentangan dengan keadaan sekarang: if + past.",
      ],
      [
        "We missed the bus. If we had left earlier, we ___ it.",
        ["catch", "will catch", "would have caught"],
        2,
        "Third conditional membayangkan hasil masa lalu yang berbeda.",
      ],
      [
        "Which sentence describes a routine?",
        [
          "If I miss lunch, I feel tired.",
          "If I missed lunch tomorrow, I would feel tired.",
          "If I had missed lunch, I would have felt tired.",
        ],
        0,
        "Present + present menunjukkan hubungan yang berulang.",
      ],
    ],
  ),
  relative_clauses: lesson(
    "Relative clauses menjelaskan orang, benda, atau tempat. Defining clauses menentukan yang dimaksud; non-defining clauses menambah informasi dan dipisahkan koma.",
    [
      "Who untuk orang; which untuk benda; that bisa dipakai pada defining clauses.",
      "Where menjelaskan tempat ketika maknanya in/at that place.",
      "Jangan pakai that setelah koma dalam non-defining clauses.",
      "Kata penghubung boleh dihilangkan jika menjadi objek dalam defining clause, tetapi bukan jika menjadi subjek.",
    ],
    [
      [
        "The tutor who teaches on Fridays is new.",
        "Who menjadi subjek teaches; jangan dihilangkan.",
      ],
      [
        "The book I borrowed is useful.",
        "That/which sebagai objek borrowed boleh dihilangkan.",
      ],
      [
        "Our office, which opened in May, is near the station.",
        "Informasi tambahan memakai koma.",
      ],
    ],
    [
      [
        "The colleague ___ helped me works upstairs.",
        ["who", "where", "whose"],
        0,
        "Who menggantikan orang dan menjadi subjek helped.",
      ],
      [
        "Our lab, ___ opened last year, has six desks.",
        ["that", "which", "where"],
        1,
        "Non-defining clause untuk benda menggunakan which.",
      ],
      [
        "Which sentence can omit 'that'?",
        [
          "The app that crashed is old.",
          "The app that I installed is useful.",
          "The app that runs here is free.",
        ],
        1,
        "I adalah subjek installed; that menjadi objek sehingga bisa dihilangkan.",
      ],
      [
        "This is the room ___ we hold workshops.",
        ["who", "which", "where"],
        2,
        "Where berarti in which; clause sudah memiliki subjek dan objek.",
      ],
    ],
  ),
  modal_verbs: lesson(
    "Modal verbs menunjukkan kemampuan, kemungkinan, saran, atau kewajiban. Makna must not berbeda tajam dari do not have to: larangan dibanding tidak wajib.",
    [
      "Modal + bentuk dasar: she can swim, bukan can swims.",
      "Should memberi saran; must menyatakan kewajiban kuat atau deduksi kuat sesuai konteks.",
      "Must not berarti dilarang; do not have to berarti boleh, tetapi tidak wajib.",
      "Might menunjukkan kemungkinan; cannot dapat menyatakan sesuatu tidak mungkin.",
    ],
    [
      ["You must not share your password.", "Larangan."],
      ["You do not have to print the ticket.", "Mencetak tiket opsional."],
      ["She might join us later.", "Belum pasti."],
      ["You should check the figures.", "Saran."],
    ],
    [
      [
        "Printing is optional. You ___ print the form.",
        ["must not", "do not have to", "cannot"],
        1,
        "Tidak wajib bukan berarti dilarang.",
      ],
      [
        "For security, visitors ___ enter the locked archive.",
        ["must not", "do not have to", "might"],
        0,
        "Aturan keamanan ini melarang masuk.",
      ],
      [
        "Which form is correct?",
        [
          "She can speaks clearly.",
          "She can to speak clearly.",
          "She can speak clearly.",
        ],
        2,
        "Setelah can gunakan bentuk dasar tanpa to atau -s.",
      ],
      [
        "I am not sure, but the train ___ be delayed.",
        ["must", "might", "has to"],
        1,
        "Might cocok dengan ketidakpastian yang disebutkan.",
      ],
    ],
  ),
  reported_speech: lesson(
    "Reported speech menyampaikan ucapan tanpa mengutip persis. Dalam laporan dengan said pada masa lalu, tense sering bergeser ke belakang. Pronoun dan penunjuk waktu menyesuaikan siapa yang berbicara serta kapan laporan dibuat.",
    [
      "Present sering berubah menjadi past; will menjadi would.",
      "Present perfect dapat berubah menjadi past perfect.",
      "Told memerlukan objek orang: she told me; said tidak: she said that.",
      "Pertanyaan tidak langsung memakai urutan pernyataan: asked where I lived.",
      "Backshift tidak selalu perlu jika informasi masih benar atau berupa fakta umum.",
    ],
    [
      [
        "Lina said that she was tired.",
        "Lina: 'I am tired.' Laporan dibuat kemudian.",
      ],
      [
        "He told me that he would call the next day.",
        "Will menjadi would; tomorrow bergantung waktu pelaporan.",
      ],
      ["She asked where I worked.", "Bukan where did I work."],
    ],
    [
      [
        "Yesterday, Rafi said, 'I will call tonight.' Reporting it today: Rafi said he ___ call that night.",
        ["will", "would", "has"],
        1,
        "Laporan masa lalu mengubah will menjadi would.",
      ],
      [
        "Which sentence is correct?",
        [
          "She told that she was busy.",
          "She said me she was busy.",
          "She told me she was busy.",
        ],
        2,
        "Told memerlukan objek orang.",
      ],
      [
        "He asked where ___.",
        ["I lived", "did I live", "do I live"],
        0,
        "Pertanyaan tidak langsung memakai subjek + verb.",
      ],
      [
        "The lecturer said that water boils at 100°C at standard atmospheric pressure. Why can 'boils' stay present?",
        [
          "Reported speech never changes tense.",
          "It expresses a general fact that remains true.",
          "Said must always be followed by present.",
        ],
        1,
        "Fakta yang tetap benar tidak wajib mengalami backshift.",
      ],
    ],
  ),
  gerunds_inf: lesson(
    "Sebagian verb diikuti -ing, sebagian diikuti to + verb. Beberapa menerima keduanya dengan perbedaan makna. Belajar melalui pasangan verb dan konteks lebih berguna daripada menebak dari terjemahan.",
    [
      "Enjoy, avoid, dan finish diikuti -ing.",
      "Want, decide, dan hope diikuti to + verb.",
      "Setelah preposition gunakan -ing: interested in learning.",
      "Stop doing berarti menghentikan aktivitas; stop to do berarti berhenti untuk melakukan aktivitas lain.",
      "Remember doing mengingat kejadian lampau; remember to do mengingat tugas yang harus dilakukan.",
    ],
    [
      ["I enjoy explaining new ideas.", "Enjoy + -ing."],
      ["We decided to revise the schedule.", "Decide + to + verb."],
      [
        "They stopped talking to listen to the announcement.",
        "Menghentikan pembicaraan untuk mendengarkan.",
      ],
      ["Remember to save your work.", "Pengingat tugas."],
    ],
    [
      [
        "I enjoy ___ with my study group.",
        ["to practice", "practicing", "practice"],
        1,
        "Enjoy diikuti gerund.",
      ],
      [
        "We decided ___ the meeting.",
        ["rescheduling", "reschedule", "to reschedule"],
        2,
        "Decide diikuti infinitive dengan to.",
      ],
      [
        "She is interested in ___ abroad.",
        ["studying", "to study", "study"],
        0,
        "In adalah preposition; sesudahnya gunakan -ing.",
      ],
      [
        "He stopped to drink some water. What happened?",
        [
          "He gave up drinking water.",
          "He paused another activity so he could drink.",
          "He forgot his drink.",
        ],
        1,
        "Stop to do menyatakan tujuan berhenti dari aktivitas sebelumnya.",
      ],
    ],
  ),
};
