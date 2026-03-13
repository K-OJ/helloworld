import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Auto-QA | 제약 데이터 정합성 검수',
  description: '월간 제약 처방 데이터의 정합성을 AI로 자동 검수하는 대시보드',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-50 font-sans">
        {children}
      </body>
    </html>
  );
}
