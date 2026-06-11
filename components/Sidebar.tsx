"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, usePathname } from "next/navigation";
import { Home, Building2, BookOpen, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const COLLEGES = [
  {
    name: "기초교육원",
    departments: ["교양"]
  },
  {
    name: "인문대학",
    departments: ["국어국문학과", "독어독문학과", "불어불문학과", "영어영문학과", "일본지역문화학과", "중어중국학과"]
  },
  {
    name: "자연과학대학",
    departments: ["물리학과", "수학과", "패션산업학과", "해양학과", "화학과"]
  },
  {
    name: "사회과학대학",
    departments: ["문헌정보학과", "미디어컴뉴니케이션학과", "사회복지학과", "창의인재개발학과"]
  },
  {
    name: "글로벌정경대학",
    departments: ["Global Trade & Service학부", "경제학과", "경제학과(야)", "무역학부(야)", "소비자학과", "정치외교학과", "행정학과"]
  },
  {
    name: "공과대학",
    departments: ["기계공학과", "바이오-로봇시스템공학과", "반도체융합전공", "산업경영공학과", "신소재공학과", "안전공학과", "에너지화학공학과", "전기공학과", "전자공학과", "전자공학부", "전자공학전공"]
  },
  {
    name: "정보기술대학",
    departments: ["임베디드시스템공학과", "정보통신공학과", "컴퓨터공학부"]
  },
  {
    name: "경영대학",
    departments: ["경영학부", "데이터과학과", "세무회계학과"]
  },
  {
    name: "예술체육대학",
    departments: ["공연예술학과", "디자인학부", "서양화전공", "스포츠과학부", "운동건강학부", "조형예술학부", "한국화전공"]
  },
  {
    name: "사범대학",
    departments: ["국어교육과", "수학교육과", "역사교육과", "영어교육과", "유아교육과", "윤리교육과", "일어교육과", "체육교육과"]
  },
  {
    name: "도시과학대학",
    departments: ["건설환경공학전공", "건축공학전공", "도시건축학부", "도시건축학전공", "도시공학과", "도시행정학과", "도시환경공학부", "환경공학전공"]
  },
  {
    name: "생명과학기술대학",
    departments: ["나노바이오공학전공", "분자의생명전공", "생명공학부", "생명공학전공", "생명과학부", "생명과학전공"]
  },
  {
    name: "융합자유전공대학",
    departments: ["자유전공학부"]
  },
  {
    name: "동북아국제통상물류학부",
    departments: ["IBE전공", "동북아국제통상전공", "스마트물류공학전공"]
  },
  {
    name: "법학부",
    departments: ["법학부"]
  }
];

function SidebarMenu() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentCollege = searchParams.get("college");
  const currentDept = searchParams.get("department");
  const isHomeActive = pathname === "/" && !currentCollege && !currentDept;

  return (
    <nav className="flex flex-col gap-5">
      {/* Home / Overall Dashboard */}
      <div>
        <Link
          href="/"
          className={`flex items-center gap-3 py-2 text-sm font-semibold transition-all duration-300 ${
            isHomeActive
              ? "bg-[#EEF3FB] dark:bg-[rgba(26,79,160,0.3)] text-[#1A4FA0] dark:text-[#60A5FA] border-l-[3px] border-[#1A4FA0] dark:border-[#60A5FA] rounded-r-lg rounded-l-none pl-[9px] pr-3"
              : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1A1A2E] dark:hover:text-[#F1F5F9] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] px-3 rounded-lg"
          }`}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span>전체 대시보드</span>
        </Link>
      </div>

      {/* College List */}
      <div className="flex flex-col gap-4">
        <span className="px-3 text-[11px] font-bold text-[#9CA3AF] dark:text-[#64748B] uppercase tracking-wider transition-all duration-300">
          대학 / 학부
        </span>

        <div className="flex flex-col gap-3">
          {COLLEGES.map((college) => {
            const isCollegeActive = currentCollege === college.name && !currentDept;

            return (
              <div key={college.name} className="flex flex-col gap-1">
                {/* College Link */}
                <Link
                  href={`/?college=${encodeURIComponent(college.name)}`}
                  className={`flex items-center gap-2 py-1.5 text-xs font-bold transition-all duration-300 ${
                    isCollegeActive
                      ? "bg-[#EEF3FB] dark:bg-[rgba(26,79,160,0.3)] text-[#1A4FA0] dark:text-[#60A5FA] border-l-[3px] border-[#1A4FA0] dark:border-[#60A5FA] rounded-r-[8px] rounded-l-none pl-[9px] pr-3"
                      : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1A1A2E] dark:hover:text-[#F1F5F9] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] px-3 rounded-[8px]"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{college.name}</span>
                </Link>

                {/* Always-Expanded Departments */}
                <div className="pl-2 border-l border-[#E5E7EB] dark:border-[#334155] ml-3 flex flex-col gap-0.5 mt-0.5 transition-all duration-300">
                  {college.departments.map((dept) => {
                    const isDeptActive = currentDept === dept;
 
                    return (
                      <Link
                        key={dept}
                        href={`/?college=${encodeURIComponent(college.name)}&department=${encodeURIComponent(dept)}`}
                        className={`text-[11px] font-semibold py-1 px-2.5 transition-all duration-300 truncate flex items-center gap-2 ${
                          isDeptActive
                            ? "border-l-[3px] border-[#1A4FA0] dark:border-[#60A5FA] text-[#1A4FA0] dark:text-[#60A5FA] bg-[#EEF3FB] dark:bg-[rgba(26,79,160,0.3)] rounded-r-md"
                            : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1A1A2E] dark:hover:text-[#F1F5F9] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] rounded-md"
                        }`}
                      >
                        <BookOpen className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{dept}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function Sidebar() {
  const [imageError, setImageError] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && theme === "dark";

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <aside className="w-[240px] flex-shrink-0 h-full bg-white dark:bg-[#1E293B] flex flex-col justify-between overflow-hidden transition-all duration-300">
      {/* Top Brand Logo Area */}
      <div className="px-4 py-5 border-b border-[#E5E7EB] dark:border-[#334155] flex items-center gap-2.5 transition-all duration-300">
        {!imageError ? (
          <div className="w-10 h-10 flex-shrink-0 relative">
            <Image
              src="/logo.png"
              alt="INU Logo"
              width={40}
              height={40}
              className="object-contain"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[#1A4FA0]/10 flex items-center justify-center text-[#1A4FA0] font-bold text-lg shadow-inner flex-shrink-0">
            🎓
          </div>
        )}
        <div>
          <h1 className="text-sm font-bold text-[#1A1A2E] dark:text-[#F1F5F9] tracking-tight leading-snug transition-all duration-300">Incheon National University</h1>
          <span className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] font-normal leading-normal transition-all duration-300">2026-1 Course Dashboard</span>
        </div>
      </div>

      {/* Main Navigation - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
        <Suspense fallback={<div className="text-xs text-[#6B7280] p-4">메뉴 불러오는 중...</div>}>
          <SidebarMenu />
        </Suspense>
      </div>

      {/* Dark Mode Toggle */}
      <div className="px-4 py-3 border-t border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2.5 text-[#6B7280] dark:text-[#94A3B8] transition-all duration-300">
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-[#F5B700] transition-all duration-300" />
          ) : (
            <Moon className="w-4 h-4 transition-all duration-300" />
          )}
          <span className="text-xs font-semibold transition-all duration-300">
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </div>
        {/* Toggle Switch */}
        <div
          onClick={toggleTheme}
          className={`w-9 h-5 rounded-full p-0.5 cursor-pointer flex items-center transition-all duration-300 ${
            isDarkMode ? "bg-[#1A4FA0]" : "bg-[#E5E7EB] dark:bg-[#334155]"
          }`}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
              isDarkMode ? "translate-x-4" : "translate-x-0"
            }`}
          ></div>
        </div>
      </div>
 
      {/* User Info / Footer */}
      <div className="px-4 py-3 border-t border-[#E5E7EB] dark:border-[#334155] flex items-center gap-3 bg-white dark:bg-[#1E293B] transition-all duration-300">
        <div className="w-8.5 h-8.5 rounded-full bg-[#F0F2F5] dark:bg-[#0F172A] flex items-center justify-center text-[#1A1A2E] dark:text-[#F1F5F9] font-semibold text-xs border border-[#E5E7EB] dark:border-[#334155] transition-all duration-300">
          U
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-semibold text-[#1A1A2E] dark:text-[#F1F5F9] truncate transition-all duration-300">최유정 사용자</p>
          <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] truncate transition-all duration-300">user@inu.ac.kr</p>
        </div>
      </div>
    </aside>
  );
}
