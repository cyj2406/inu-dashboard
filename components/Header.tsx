"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAiAnalysis } from "@/context/AiAnalysisContext";


function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAnalysis, dashboardData } = useAiAnalysis();

  const college = searchParams.get("college");
  const department = searchParams.get("department");

  const handleHomeClick = () => {
    router.push("/");
  };

  const handleCollegeClick = () => {
    if (college) {
      router.push(`/?college=${encodeURIComponent(college)}`);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-between gap-4 transition-all duration-300 h-full">
      {/* Left Area: Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#94A3B8] transition-all duration-300">
          {!college ? (
            <span className="text-[#1A1A2E] dark:text-[#F1F5F9] font-bold cursor-default transition-all duration-300">홈</span>
          ) : (
            <>
              <span
                onClick={handleHomeClick}
                className="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1A4FA0] dark:hover:text-[#60A5FA] hover:underline cursor-pointer transition-colors duration-150 font-medium"
              >
                홈
              </span>
              <span className="text-[#6B7280]/60 dark:text-[#94A3B8]/60">&gt;</span>
              {!department ? (
                <span className="text-[#1A1A2E] dark:text-[#F1F5F9] font-bold cursor-default transition-all duration-300">{college}</span>
              ) : (
                <>
                  <span
                    onClick={handleCollegeClick}
                    className="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1A4FA0] dark:hover:text-[#60A5FA] hover:underline cursor-pointer transition-colors duration-150 font-medium"
                  >
                    {college}
                  </span>
                  <span className="text-[#6B7280]/60 dark:text-[#94A3B8]/60">&gt;</span>
                  <span className="text-[#1A1A2E] dark:text-[#F1F5F9] font-bold cursor-default transition-all duration-300">{department}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Area: Action Buttons */}
      <div className="flex items-center gap-3.5">
        {/* AI Analysis Button */}
        <button
          onClick={openAnalysis}
          disabled={!dashboardData}
          className="flex items-center justify-center gap-1.5 bg-gradient-to-br from-[#1A4FA0] to-[#2563EB] hover:opacity-95 disabled:bg-gray-400 text-white text-xs font-semibold h-10 px-4 rounded-[8px] transition-all shadow-md active:scale-95"
        >
          <span>✨</span>
          <span>AI 강의 분석</span>
        </button>
      </div>
    </div>
  );
}

export default function Header() {
  return (
    <header 
      className="bg-white dark:bg-[#1E293B] border-b border-[#E5E7EB] dark:border-b-gray-800 sticky top-0 z-10 mb-14 transition-all duration-300"
      style={{
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: "32px",
        paddingRight: "32px",
        flexShrink: 0,
      }}
    >
      <Suspense fallback={<div className="flex-1 flex justify-between items-center text-xs text-[#6B7280] dark:text-[#94A3B8]">불러오는 중...</div>}>
        <HeaderContent />
      </Suspense>
    </header>
  );
}
