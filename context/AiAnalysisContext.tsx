"use client";

import React, { createContext, useContext, useState } from "react";

export interface AiAnalysisData {
  college: string | null;
  department: string | null;
  stats: {
    totalCourses: number;
    totalStudents: number;
    avgEnrollmentRate: number;
    foreignLanguageRatio: number;
  };
  categories: { name: string; count: number; avgStudents: number }[];
  methods: { name: string; value: number }[];
  credits: { name: string; value: number }[];
  days: { name: string; count: number }[];
  times: { name: string; count: number }[];
}

interface AiAnalysisContextType {
  isOpen: boolean;
  dashboardData: AiAnalysisData | null;
  setDashboardData: (data: AiAnalysisData) => void;
  openAnalysis: () => void;
  closeAnalysis: () => void;
}

const AiAnalysisContext = createContext<AiAnalysisContextType | undefined>(undefined);

export function AiAnalysisProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<AiAnalysisData | null>(null);

  const openAnalysis = () => setIsOpen(true);
  const closeAnalysis = () => setIsOpen(false);

  return (
    <AiAnalysisContext.Provider
      value={{
        isOpen,
        dashboardData,
        setDashboardData,
        openAnalysis,
        closeAnalysis,
      }}
    >
      {children}
    </AiAnalysisContext.Provider>
  );
}

export function useAiAnalysis() {
  const context = useContext(AiAnalysisContext);
  if (!context) {
    throw new Error("useAiAnalysis must be used within an AiAnalysisProvider");
  }
  return context;
}
