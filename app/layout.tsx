import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AiAnalysisProvider } from "@/context/AiAnalysisContext";
import { ThemeProvider } from "next-themes";
import AiAnalysisModal from "@/components/AiAnalysisModal";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INU 2026-1 Course Dashboard",
  description: "인천대학교 2026학년도 1학기 전체 교과목 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className={`${inter.className} h-screen overflow-hidden bg-[#E8ECF2] dark:bg-[#0F172A] p-5 flex items-stretch text-[#1A1A2E] dark:text-[#F1F5F9] transition-all duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AiAnalysisProvider>
            {/* Outer white card container wrapping sidebar + main */}
            <div className="flex-1 bg-white dark:bg-[#1E293B] border border-transparent dark:border-[#334155] rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex overflow-hidden transition-all duration-300">
              {/* Sidebar */}
              <Sidebar />
              
              {/* Main layout container (Header + Main Content + Footer) */}
              <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-[#F8FAFC] dark:bg-[#0F172A] transition-all duration-300">
                {/* Top Header */}
                <Header />

                {/* Main Content Area */}
                <main className="flex-1 p-8 md:p-10">
                  {children}
                </main>

                {/* Footer */}
                <Footer />
              </div>
            </div>

            {/* AI Analysis Modal Window */}
            <AiAnalysisModal />
          </AiAnalysisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



