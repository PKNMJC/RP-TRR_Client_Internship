import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TRR IT Support | ระบบแจ้งซ่อมออนไลน์",
  description:
    "ระบบแจ้งซ่อมอุปกรณ์ IT สำหรับพนักงาน TRR - รวดเร็ว สะดวก ติดตามสถานะได้ตลอดเวลา",
  keywords: "IT Support, ระบบแจ้งซ่อม, TRR, Help Desk",
  authors: [{ name: "TRR Internship Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
