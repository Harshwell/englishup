# EnglishUp

EnglishUp adalah aplikasi belajar bahasa Inggris berbasis web yang dirancang untuk pembelajar Indonesia yang ingin membangun ulang fondasi grammar, vocabulary, reading, dan writing secara lebih terstruktur, modern, dan relevan untuk target seperti IELTS Band 7+.

Aplikasi ini tidak bergantung penuh pada AI sebagai sumber materi. AI dipakai sebagai pengolah dan pengembang materi, sedangkan fondasi sistem diarahkan ke pendekatan data-backed: konten statis, fallback lokal, workflow pembaruan otomatis, serta rute evaluasi yang lebih terukur.

## Tujuan utama

EnglishUp dibangun untuk tiga hal:

1. memberikan materi yang lebih kaya daripada sekadar chatbot,
2. menjaga aplikasi tetap usable walaupun provider AI gagal,
3. menyiapkan fondasi yang bisa tumbuh ke arah produk belajar yang lebih serius.

## Fitur utama

### 1. Conversation Practice

Fitur conversation dipakai untuk latihan interaksi bahasa Inggris secara aktif.

- endpoint utama: `/api/chat`
- provider: Gemini sebagai primary, OpenRouter sebagai fallback
- output diarahkan untuk tutor-style feedback, bukan jawaban generik yang terdengar pintar tapi kosong

### 2. Grammar

Materi grammar dimuat dari file JSON statis di `public/data/grammar/`.

Target desainnya:
- penjelasan berbahasa Indonesia yang jelas,
- fokus pada form, meaning, use,
- contoh kalimat yang realistis,
- kesalahan umum pembelajar Indonesia,
- tips aplikasi ke IELTS.

### 3. Vocabulary

Vocabulary dimuat dari `public/data/vocab/`.

Setiap entri idealnya memuat:
- kata,
- pronunciation,
- part of speech,
- definisi,
- contoh kalimat,
- collocation,
- sinonim,
- level CEFR,
- estimasi band IELTS.

### 4. Reading

Reading passage dimuat dari `public/data/reading/passages.json`.

Arah pengembangan:
- level bertahap,
- pertanyaan reading style IELTS,
- vocabulary support,
- reading strategies,
- variasi topik yang lebih modern dan akademik.

### 5. Flashcards

Flashcards tersedia melalui halaman `/flashcards`.

Fitur ini dibuat untuk mempercepat memorisasi vocabulary tanpa mengorbankan konteks. Setiap kartu berisi:
- kata di sisi depan,
- definisi, phonetic, example, synonym, antonym, level, frequency, dan audio di sisi belakang.

Sumber data flashcard saat ini:
- file JSON di `public/data/flashcards/`
- fallback lokal bila file belum ada

### 6. Writing Feedback

Endpoint `/api/evaluate` dipakai untuk mengevaluasi tulisan pengguna.

Tujuan utama fitur ini:
- memberi penilaian cepat pada cohesion, syntax, vocabulary, grammar, dan conventions,
- mengembalikan rekomendasi tindakan yang bisa langsung dipakai,
- menjaga aplikasi tetap usable dengan fallback meskipun evaluasi AI tidak tersedia.

## Arsitektur aplikasi

### Frontend

Framework utama:
- Next.js App Router
- React
- Tailwind CSS
- lucide-react untuk ikon

Shell UI utama berada di komponen baru:
- `components/EnglishUpEnhanced.jsx`

Halaman utama:
- `app/page.jsx`

Halaman flashcards:
- `app/flashcards/page.jsx`

### Backend routes

Route penting saat ini:
- `app/api/chat/route.js`
- `app/api/evaluate/route.js`

### Data layer

Konten statis berada di:
- `public/data/grammar/`
- `public/data/vocab/`
- `public/data/reading/`
- `public/data/flashcards/`
- `public/data/manifest.json`

## Prinsip desain sistem

EnglishUp memakai prinsip berikut:

1. **AI bukan database utama**
   AI dipakai untuk menghasilkan variasi, penjelasan, kuis, atau enrichment. Source of truth idealnya tetap berasal dari data terstruktur.

2. **Graceful degradation**
   Bila provider AI gagal, aplikasi tetap harus bisa dipakai lewat fallback lokal.

3. **Static-first**
   Materi belajar sebisa mungkin tersedia dari file statis agar cepat, murah, dan stabil.

4. **Accessibility-first**
   Scroll tidak dikunci, struktur heading jelas, navigasi semantik, dan focus state harus terlihat.

## Pipeline konten v3

Pipeline v3 adalah arah pengembangan utama untuk materi yang lebih kaya.

### Sumber data yang ditargetkan

- CEFR-J / Open Language Profiles
- Words-CEFR Dataset
- SUBTLEX-US
- Tatoeba
- DictionaryAPI.dev
- Datamuse
- ELLIPSE Corpus

### Fungsi AI dalam pipeline

AI dipakai untuk:
- menyusun lesson dari data mentah,
- membuat variasi latihan,
- menghasilkan pertanyaan reading,
- menulis penjelasan grammar dalam bahasa Indonesia,
- memberi feedback writing yang lebih terarah.

### Workflow pembaruan

Workflow utama untuk v3:
- `.github/workflows/content-refresh-v3.yml`

Script generator utama:
- `scripts/generate-content-v3.mjs`

## Environment variables

Minimal yang direkomendasikan:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openrouter/free
OPENALEX_EMAIL=you@example.com
```

Aplikasi tetap bisa hidup sebagian tanpa semua env di atas, tetapi fitur AI akan turun kualitas atau memakai fallback.
`OPENALEX_EMAIL` opsional (API OpenAlex gratis tanpa registrasi), tapi disarankan untuk polite pool dan stabilitas rate limit.

## Menjalankan aplikasi secara lokal

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Generate konten v3:

```bash
npm run generate:v3
```

Build production:

```bash
npm run build
npm run start
```

## Struktur repo yang penting

- `app/` → routing dan API routes
- `components/` → komponen UI utama
- `public/data/` → materi statis
- `scripts/` → generator dan extractor data
- `data_sources/` → lokasi untuk dataset mentah dan catatan sumber data
- `.github/workflows/` → workflow otomatis GitHub Actions

## Catatan lisensi dan kepatuhan

EnglishUp diposisikan sebagai proyek personal dan free-to-use. Namun begitu, setiap sumber data tetap harus dihormati sesuai lisensi masing-masing.

Poin penting:
- CEFR-J perlu atribusi yang jelas
- SUBTLEX-US memiliki lisensi CC BY-SA
- ELLIPSE menggunakan CC BY-NC-SA 4.0, sehingga tidak aman untuk komersialisasi tanpa izin
- Tatoeba dan sumber kamus harus tetap dicantumkan bila dipakai sebagai bagian dari pipeline data

## Roadmap pengembangan

Prioritas pengembangan berikutnya:

1. extractor nyata untuk CEFR-J, Words-CEFR, SUBTLEX, dan Tatoeba,
2. deck flashcards bertingkat per level dan tema,
3. evaluasi writing yang lebih stabil dan transparan,
4. pengayaan materi grammar dan reading yang lebih kompleks,
5. dashboard progres yang lebih kuat,
6. audit aksesibilitas dan performa production.

## Ringkasan operasional

Kalau ingin memahami EnglishUp secara singkat:

- ini adalah aplikasi web belajar bahasa Inggris,
- materi utamanya tidak boleh bertumpu penuh pada AI,
- AI dipakai sebagai accelerator, bukan satu-satunya otak sistem,
- UI harus ringan, cepat, aksesibel, dan tahan gagal,
- workflow konten harus bisa diperbarui otomatis dari GitHub Actions.

Kalau sistem ini dikembangkan dengan disiplin, EnglishUp bisa naik kelas dari sekadar “chat app dengan beberapa tab” menjadi platform belajar yang jauh lebih matang, stabil, dan layak dipakai terus-menerus.
