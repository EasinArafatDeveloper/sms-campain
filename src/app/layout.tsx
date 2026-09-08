import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMSPro - Trackable SMS Marketing & Customer Engagement Platform",
  description:
    "Enterprise SaaS platform for trackable SMS marketing, link attribution, real-time engagement intelligence, and high-intent lead retargeting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
