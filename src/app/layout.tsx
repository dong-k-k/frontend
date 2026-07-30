import type { Metadata } from "next";
import "./globals.css";
import { WizardProvider } from "@/context/wizard-context";

export const metadata: Metadata = {
  title: "FX Mate — AI 외환 리스크 매니저",
  description: "체결한 계약의 환율 위험을 진단하고 대응 전략과 금융상품을 추천받으세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body className="min-h-screen">
        <WizardProvider>
          <main className="flex min-h-screen items-start justify-center px-6 py-10">
            {children}
          </main>
        </WizardProvider>
      </body>
    </html>
  );
}
