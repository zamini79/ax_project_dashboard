import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AX 과제 대시보드",
  description: "AX추진실 AX 과제 진행현황 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
