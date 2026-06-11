"use client";

import React, { useEffect, useState } from "react";
import { useAiAnalysis } from "@/context/AiAnalysisContext";
import ReactMarkdown from "react-markdown";

export default function AiAnalysisModal() {
  const { isOpen, closeAnalysis, dashboardData } = useAiAnalysis();
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const data = dashboardData;
    if (!isOpen || !data) return;

    async function generateReport(currentData: NonNullable<typeof dashboardData>) {
      setLoading(true);
      setError("");
      setReportText("");

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        setError("Gemini API 키가 설정되지 않았습니다. .env.local 파일을 확인해 주세요.");
        setLoading(false);
        return;
      }

      const targetLabel = currentData.department
        ? `${currentData.college} > ${currentData.department}`
        : currentData.college
        ? currentData.college
        : "전체 교과목 대시보드";

      const todayString = new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const systemPrompt = `
당신은 대학 교육과정 및 강좌 운영 분석 전문가입니다.
아래 인천대학교 2026학년도 1학기 강좌 데이터를 분석하여
다음 형식으로 보고서를 작성해주세요.

보고서 형식:
=== AI 강의 데이터 분석 보고서 ===
분석 대상: ${targetLabel}
일자: ${todayString}
작성 모델: Gemini 3.1 Flash-Lite

# [분석 보고서] 제목

## 1. 데이터 요약
제공된 수치 통계(총 강좌 수, 수강인원, 평균 수강률, 원어강의 비율 등)를 기반으로 간결하게 요약해 주세요.

## 2. 주요 특징 및 트렌드 분석
   ### 1) 이수구분 및 학점 구성 특성
   이수구분별 강좌 수, 평균 수강인원 및 학점 비율 통계를 토대로 특징을 서술해 주세요.
   ### 2) 수업방법 비중 및 시사점
   대면수업, 이러닝, 블렌디드 등 수업방법 편성 비중과 분석적 시사점을 적어주세요.
   ### 3) 요일 및 시간대별 강좌 배치 현황
   요일별/시간대별 강좌 배치 밀집도와 학사 일정 편성에 관한 분석 내용을 적어주세요.

## 3. 문제점 및 개선 아이디어 제언
통계 데이터를 근거로 과밀 수업, 요일 편중 등 발생 가능한 운영상 문제점을 짚어내고, 학사 운영 고도화를 위한 실질적 개선 아이디어를 제언해 주세요.

마크다운 구조를 충실히 따르고 전문적이고 깔끔한 어조로 작성해 주세요.
`;

      const userPrompt = `
다음 데이터 통계를 분석해 주세요:

분석 대상: ${targetLabel}
총 강좌 수: ${currentData.stats.totalCourses}개
총 수강인원: ${currentData.stats.totalStudents}명
평균 수강률: ${currentData.stats.avgEnrollmentRate}%
원어강의 비율: ${currentData.stats.foreignLanguageRatio}%

이수구분별 분포:
${currentData.categories.map(c => `- ${c.name}: 강좌 수 ${c.count}개, 평균 수강인원 ${c.avgStudents}명`).join("\n")}

수업방법 분포:
${currentData.methods.map(m => `- ${m.name}: ${m.value}개`).join("\n")}

학점 구성 비율:
${currentData.credits.map(c => `- ${c.name}: ${c.value}개`).join("\n")}

요일별 강의 편성:
${currentData.days.map(d => `- ${d.name}요일: ${d.count}개`).join("\n")}

수업 시작 시간대별 편성:
${currentData.times.map(t => `- ${t.name}: ${t.count}개`).join("\n")}
`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    { text: userPrompt }
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
              },
            }),
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || "Gemini API 호출에 실패했습니다.");
        }

        const resData = await response.json();
        const generated = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (generated) {
          setReportText(generated);
        } else {
          throw new Error("보고서 텍스트 생성 결과가 비어있습니다.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "보고서 생성 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    generateReport(data);
  }, [isOpen, dashboardData]);

  if (!isOpen) return null;

  const targetLabel = dashboardData?.department
    ? `${dashboardData.college} > ${dashboardData.department}`
    : dashboardData?.college
    ? dashboardData.college
    : "전체 교과목 대시보드";

  const downloadReport = () => {
    if (!reportText) return;
    const blob = new Blob([reportText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const targetName = dashboardData?.department || dashboardData?.college || "전체";
    link.setAttribute("download", `INU_강의_분석_보고서_${targetName}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
      <div className="bg-white w-full max-w-3xl h-[80vh] rounded-2xl shadow-2xl flex flex-col border border-[#E5E7EB] overflow-hidden transform scale-100 transition-transform duration-300 animate-scaleUp">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] bg-[#1A4FA0]/10 text-[#1A4FA0] px-2.5 py-0.5 rounded-full font-bold self-start">
              AI 통계 분석
            </span>
            <h2 className="text-sm font-bold text-[#1A1A2E] mt-1.5">
              분석 대상: {targetLabel}
            </h2>
          </div>
          <span className="text-xs text-[#6B7280]">
            {new Date().toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-white">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 py-12">
              <div className="w-10 h-10 border-4 border-[#1A4FA0]/20 border-t-[#1A4FA0] rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-[#6B7280]">
                Gemini 3.1 Flash-Lite 모델이 통계를 분석 중입니다...
              </p>
            </div>
          ) : error ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center py-12">
              <span className="text-3xl">⚠️</span>
              <p className="text-xs font-semibold text-red-600 max-w-md leading-relaxed">
                {error}
              </p>
            </div>
          ) : reportText ? (
            <div className="prose prose-sm max-w-none text-xs text-[#1A1A2E] leading-relaxed markdown-report">
              <ReactMarkdown>{reportText}</ReactMarkdown>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#6B7280]">
              분석을 시작하지 못했습니다.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <button
            onClick={downloadReport}
            disabled={!reportText || loading}
            className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#1A1A2E] text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:hover:bg-white active:scale-95"
          >
            <span>📥</span>
            <span>보고서 다운로드 (.md)</span>
          </button>

          <button
            onClick={closeAnalysis}
            className="bg-[#1A1A2E] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
