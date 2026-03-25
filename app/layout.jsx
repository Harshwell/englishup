import "./globals.css";

export const metadata = {
  title: "EnglishUp — IELTS Prep",
  description: "Data-backed English learning for Indonesian speakers targeting IELTS Band 7+",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
