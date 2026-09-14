import "./globals.css";

export const metadata = {
  title: "EnglishUp | A little better, every day",
  description:
    "Ruang belajar bahasa Inggris untuk pembelajar Indonesia. Grammar, vocabulary, reading, dan latihan menulis dengan progres harian yang nyata.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
