import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: "EnglishUp — IELTS Prep",
  description: "Gamified English learning for Indonesian speakers targeting IELTS Band 7+",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ height: "100vh", overflow: "hidden" }}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
