"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { useAiAnalysis } from "@/context/AiAnalysisContext";


interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  avgEnrollmentRate: number;
  foreignLanguageRatio: number;
}

interface CategoryStats {
  name: string;
  count: number;
  avgStudents: number;
}

interface MethodStats {
  name: string;
  value: number;
}

interface CreditStats {
  name: string;
  value: number;
}

interface DayStats {
  name: string;
  count: number;
}

interface CourseRow {
  code: string;
  name: string;
  classification: string;
  credits: number;
  professor: string;
  schedule: string;
  students: number;
  capacity: number;
  classroom: string;
  timeSchedule: string;
  method: string;
  foreignLang: string;
  maleStudents: number;
  femaleStudents: number;
}

interface CollegeSummary {
  college: string;
  courseCount: number;
  totalStudents: number;
  avgEnrollmentRate: number;
}

const DONUT_COLORS = ["#1A4FA0", "#F5B700", "#3B82F6", "#93C5FD", "#FCD34D"];

function DashboardContent() {
  const searchParams = useSearchParams();
  const college = searchParams.get("college");
  const department = searchParams.get("department");

  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    avgEnrollmentRate: 0,
    foreignLanguageRatio: 0,
  });
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [methods, setMethods] = useState<MethodStats[]>([]);
  const [credits, setCredits] = useState<CreditStats[]>([]);
  const [days, setDays] = useState<DayStats[]>([]);
  const [times, setTimes] = useState<{ name: string; count: number }[]>([]);
  const [collegeSummaries, setCollegeSummaries] = useState<CollegeSummary[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  const { setDashboardData } = useAiAnalysis();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedCourse(null);
  }, [college, department]);

  useEffect(() => {
    if (!loading) {
      setDashboardData({
        college,
        department,
        stats,
        categories,
        methods,
        credits,
        days,
        times
      });
    }
  }, [loading, college, department, stats, categories, methods, credits, days, times]);

  useEffect(() => {
    async function fetchAllData(supabase: any) {
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('inu-dashboard')
          .select("학수번호, 교과목명, 담당교수, 이수구분, 수강, 정원, 원어강의, 수업방법, 학점, \"시간표(교시)\", \"시간표(시간)\", 강의실, \"수강(남)\", \"수강(여)\", 대학:\"대학(원)\", 학과:\"학과(부)\"")
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        page++;
      }
      
      return allData;
    }

    async function fetchStats() {
      setLoading(true);
      try {
        const supabase = createClient();
        
        let data = await fetchAllData(supabase);
        
        let dbCollege = college;
        if (college === "기초교육원") {
          dbCollege = "교양";
        }

        if (dbCollege) {
          data = data.filter((row: any) => row.대학 === dbCollege);
        }
        if (department) {
          data = data.filter((row: any) => row.학과 === department);
        }

        const totalCourses = data.length;
        let totalStudents = 0;
        let foreignLangCount = 0;
        let rateSum = 0;
        let rateCount = 0;

        // Aggregations
        const categoryMap: Record<string, { count: number; studentsSum: number }> = {};
        const methodMap: Record<string, number> = {};
        const creditMap: Record<string, number> = {};
        const dayMap: Record<string, number> = {
          "월": 0, "화": 0, "수": 0, "목": 0, "금": 0, "토": 0
        };
        const timeMap: Record<string, number> = {
          "오전 9-12시": 0,
          "12-15시": 0,
          "15-18시": 0,
          "야간 18시~": 0
        };
        const collegeMap: Record<string, { count: number; enrolledSum: number; rateSum: number; rateCount: number }> = {};

        data.forEach((row: any) => {
          const enrolled = Number(row.수강) || 0;
          const capacity = Number(row.정원) || 0;
          totalStudents += enrolled;

          if (capacity > 0) {
            rateSum += (enrolled / capacity) * 100;
            rateCount++;
          }

          if (row.원어강의 === "Y" || row.원어강의 === "Yes") {
            foreignLangCount++;
          }

          // Aggregate 이수구분
          const category = row.이수구분 || "기타";
          if (!categoryMap[category]) {
            categoryMap[category] = { count: 0, studentsSum: 0 };
          }
          categoryMap[category].count += 1;
          categoryMap[category].studentsSum += enrolled;

          // Aggregate 수업방법
          const method = row.수업방법 || "대면수업";
          methodMap[method] = (methodMap[method] || 0) + 1;

          // Aggregate 학점
          const rawCredit = Number(row.학점);
          if (!isNaN(rawCredit)) {
            const crName = `${rawCredit}학점`;
            creditMap[crName] = (creditMap[crName] || 0) + 1;
          }

          // Aggregate 요일별 수업
          const schedule = row["시간표(교시)"] || "";
          ["월", "화", "수", "목", "금", "토"].forEach(d => {
            if (schedule.includes(d)) {
              dayMap[d]++;
            }
          });

          // Aggregate 수업시간별
          const timeStr = row["시간표(시간)"] || "";
          const timeMatch = timeStr.match(/(\d{2}):(\d{2})/);
          if (timeMatch) {
            const hour = parseInt(timeMatch[1], 10);
            if (hour < 12) {
              timeMap["오전 9-12시"]++;
            } else if (hour < 15) {
              timeMap["12-15시"]++;
            } else if (hour < 18) {
              timeMap["15-18시"]++;
            } else {
              timeMap["야간 18시~"]++;
            }
          }

          // Aggregate 대학(원)
          const collegeName = row.대학 ? row.대학.trim() : "";
          const excludeColleges = ["", "기타", "교직", "군사학"];
          if (collegeName && !excludeColleges.includes(collegeName)) {
            if (!collegeMap[collegeName]) {
              collegeMap[collegeName] = { count: 0, enrolledSum: 0, rateSum: 0, rateCount: 0 };
            }
            collegeMap[collegeName].count++;
            collegeMap[collegeName].enrolledSum += enrolled;
            if (capacity > 0) {
              collegeMap[collegeName].rateSum += (enrolled / capacity) * 100;
              collegeMap[collegeName].rateCount++;
            }
          }
        });

        setStats({
          totalCourses,
          totalStudents,
          avgEnrollmentRate: rateCount > 0 ? Math.round((rateSum / rateCount) * 10) / 10 : 0,
          foreignLanguageRatio: totalCourses > 0 ? Math.round((foreignLangCount / totalCourses) * 1000) / 10 : 0,
        });

        // Sort and set categories
        const categoryList = Object.entries(categoryMap).map(([name, item]) => ({
          name,
          count: item.count,
          avgStudents: item.count > 0 ? Math.round((item.studentsSum / item.count) * 10) / 10 : 0
        })).sort((a, b) => b.count - a.count);
        setCategories(categoryList);

        // Set methods
        const methodList = Object.entries(methodMap).map(([name, count]) => ({
          name,
          value: count
        })).sort((a, b) => b.value - a.value);
        setMethods(methodList);

        // Set credits
        const creditList = Object.entries(creditMap).map(([name, count]) => ({
          name,
          value: count
        })).sort((a, b) => b.value - a.value);
        setCredits(creditList);

        // Set days
        const dayList = ["월", "화", "수", "목", "금", "토"].map(name => ({
          name,
          count: dayMap[name] || 0
        }));
        setDays(dayList);

        // Set times
        const timeList = ["오전 9-12시", "12-15시", "15-18시", "야간 18시~"].map(name => ({
          name,
          count: timeMap[name] || 0
        }));
        setTimes(timeList);

        // Set college summaries
        const summariesList: CollegeSummary[] = Object.entries(collegeMap).map(([col, item]) => ({
          college: col,
          courseCount: item.count,
          totalStudents: item.enrolledSum,
          avgEnrollmentRate: item.rateCount > 0 ? Math.round((rateSum / item.rateCount) * 10) / 10 : 0
        })).sort((a, b) => b.avgEnrollmentRate - a.avgEnrollmentRate);
        setCollegeSummaries(summariesList);

        // Get all courses with detailed info
        const courseList = data.map((row: any) => ({
          code: row.학수번호 || "00000000",
          name: row.교과목명 || "알 수 없는 강좌",
          classification: row.이수구분 || "교양",
          credits: Number(row.학점) || 0,
          professor: row.담당교수 || "미지정",
          schedule: row["시간표(교시)"] || "미지정",
          students: Number(row.수강) || 0,
          capacity: Number(row.정원) || 0,
          classroom: row.강의실 || "미지정",
          timeSchedule: row["시간표(시간)"] || "미지정",
          method: row.수업방법 || "대면수업",
          foreignLang: row.원어강의 || "N",
          maleStudents: Number(row["수강(남)"]) || 0,
          femaleStudents: Number(row["수강(여)"]) || 0
        }));
        setCourses(courseList);
        setIsFallback(false);
      } catch (err) {
        console.warn("Supabase query failed, using responsive fallback mock data.", err);
        generateFallbackStats(college, department);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [college, department]);

  // Generate realistic, stable mock data based on selected filters to simulate a working DB
  function generateFallbackStats(selectedCollege: string | null, selectedDept: string | null) {
    setIsFallback(true);
    
    // Base values
    let seed = 0;
    if (selectedCollege) {
      seed += selectedCollege.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    }
    if (selectedDept) {
      seed += selectedDept.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    }

    const collegeNames = ["인문대학", "자연과학대학", "사회과학대학", "공과대학", "정보기술대학", "경영대학"];
    const profs = ["김교수", "이교수", "박교수", "최교수", "정교수", "강교수", "조교수", "윤교수"];
    const classifs = ["전공선택", "핵심교양", "전공필수", "심화교양", "일반선택"];
    const subjectBases = ["개론", "세미나", "연구", "실습", "의 이해", "원론", "분석", "특강"];

    if (!selectedCollege && !selectedDept) {
      // Overall Dashboard Base Stats
      setStats({
        totalCourses: 1248,
        totalStudents: 38420,
        avgEnrollmentRate: 88.5,
        foreignLanguageRatio: 12.4,
      });

      setCategories([
        { name: "전공선택", count: 512, avgStudents: 34.2 },
        { name: "핵심교양", count: 324, avgStudents: 45.8 },
        { name: "전공필수", count: 218, avgStudents: 38.5 },
        { name: "심화교양", count: 116, avgStudents: 42.1 },
        { name: "일반선택", count: 78, avgStudents: 24.6 }
      ]);

      setMethods([
        { name: "대면수업", value: 923 },
        { name: "이러닝", value: 184 },
        { name: "블렌디드", value: 92 },
        { name: "실시간화상", value: 49 }
      ]);

      setCredits([
        { name: "3학점", value: 811 },
        { name: "2학점", value: 250 },
        { name: "1학점", value: 125 },
        { name: "기타", value: 62 }
      ]);

      setDays([
        { name: "월", count: 420 },
        { name: "화", count: 510 },
        { name: "수", count: 470 },
        { name: "목", count: 490 },
        { name: "금", count: 210 },
        { name: "토", count: 12 }
      ]);

      setTimes([
        { name: "오전 9-12시", count: 580 },
        { name: "12-15시", count: 410 },
        { name: "15-18시", count: 218 },
        { name: "야간 18시~", count: 40 }
      ]);

      setCollegeSummaries([
        { college: "경영대학", courseCount: 120, totalStudents: 4500, avgEnrollmentRate: 94.2 },
        { college: "정보기술대학", courseCount: 140, totalStudents: 4800, avgEnrollmentRate: 92.5 },
        { college: "글로벌정치국제대학", courseCount: 95, totalStudents: 2900, avgEnrollmentRate: 91.8 },
        { college: "인문대학", courseCount: 165, totalStudents: 5200, avgEnrollmentRate: 89.4 },
        { college: "사회과학대학", courseCount: 110, totalStudents: 3600, avgEnrollmentRate: 88.7 },
        { college: "공과대학", courseCount: 210, totalStudents: 6800, avgEnrollmentRate: 87.3 },
        { college: "자연과학대학", courseCount: 115, totalStudents: 3400, avgEnrollmentRate: 85.1 },
        { college: "예술체육대학", courseCount: 80, totalStudents: 2100, avgEnrollmentRate: 83.9 },
        { college: "도시과학대학", courseCount: 90, totalStudents: 2500, avgEnrollmentRate: 81.2 },
        { college: "생명과학대학", courseCount: 75, totalStudents: 1900, avgEnrollmentRate: 79.6 }
      ].sort((a, b) => b.avgEnrollmentRate - a.avgEnrollmentRate));

      // Generate 50 fallback courses for pagination
      const fallbackCoursesList: CourseRow[] = [];
      for (let i = 0; i < 50; i++) {
        const itemSeed = seed + i;
        const collegeIndex = itemSeed % collegeNames.length;
        const col = collegeNames[collegeIndex];
        const deptName = `${col} 학과 ${(itemSeed % 3) + 1}`;
        const name = `${deptName} ${subjectBases[itemSeed % subjectBases.length]} ${i + 1}`;
        const classification = classifs[itemSeed % classifs.length];
        const credits = (itemSeed % 2) === 0 ? 3 : 2;
        const professor = profs[itemSeed % profs.length];
        const daysOfWeek = ["월", "화", "수", "목", "금"];
        const day1 = daysOfWeek[itemSeed % daysOfWeek.length];
        const day2 = daysOfWeek[(itemSeed + 2) % daysOfWeek.length];
        const schedule = `${day1}(${(itemSeed % 5) + 1}), ${day2}(${((itemSeed + 1) % 5) + 1})`;
        
        const capacity = 30 + (itemSeed % 40);
        let students = Math.round(capacity * (0.6 + (itemSeed % 6) / 10));
        if (itemSeed % 10 === 0) {
          students = capacity + 5; // > 100% rate
        }

        const classroom = `제15호관 강의실-${100 + (itemSeed % 20)}`;
        const timeSchedule = ` [15-100:월(09:00~10:15)]`;
        const method = itemSeed % 2 === 0 ? "대면수업" : "이러닝";
        const foreignLang = itemSeed % 8 === 0 ? "Y" : "N";
        const maleStudents = Math.round(students * 0.45);
        const femaleStudents = students - maleStudents;

        fallbackCoursesList.push({
          code: `000${100000 + i}`,
          name,
          classification,
          credits,
          professor,
          schedule,
          students,
          capacity,
          classroom,
          timeSchedule,
          method,
          foreignLang,
          maleStudents,
          femaleStudents
        });
      }
      setCourses(fallbackCoursesList);
    } else {
      // Vary stats deterministically based on filters to look realistic
      const totalCourses = 30 + (seed % 90);
      const avgEnrollmentRate = 75 + (seed % 20) + (seed % 10) / 10;
      const totalStudents = Math.round(totalCourses * 32 * (avgEnrollmentRate / 100));
      const foreignLanguageRatio = 5 + (seed % 25) + (seed % 10) / 10;

      setStats({
        totalCourses,
        totalStudents,
        avgEnrollmentRate: Math.round(avgEnrollmentRate * 10) / 10,
        foreignLanguageRatio: Math.round(foreignLanguageRatio * 10) / 10,
      });

      // Distribute total courses into classifications dynamically
      const majorElective = Math.round(totalCourses * 0.4);
      const generalCore = Math.round(totalCourses * 0.25);
      const majorRequired = Math.round(totalCourses * 0.2);
      const generalAdvanced = Math.round(totalCourses * 0.1);
      const generalElective = totalCourses - (majorElective + generalCore + majorRequired + generalAdvanced);

      // Average students count per classification
      const avgMajElective = 25 + (seed % 15);
      const avgGenCore = 40 + (seed % 20);
      const avgMajRequired = 30 + (seed % 15);
      const avgGenAdvanced = 35 + (seed % 15);
      const avgGenElective = 20 + (seed % 10);

      setCategories([
        { name: "전공선택", count: majorElective, avgStudents: avgMajElective },
        { name: "핵심교양", count: generalCore, avgStudents: avgGenCore },
        { name: "전공필수", count: majorRequired, avgStudents: avgMajRequired },
        { name: "심화교양", count: generalAdvanced, avgStudents: avgGenAdvanced },
        { name: "일반선택", count: Math.max(0, generalElective), avgStudents: avgGenElective }
      ].sort((a, b) => b.count - a.count));

      // Class methods
      const inPerson = Math.round(totalCourses * 0.75);
      const elearning = Math.round(totalCourses * 0.15);
      const blended = Math.round(totalCourses * 0.07);
      const zoom = totalCourses - (inPerson + elearning + blended);

      setMethods([
        { name: "대면수업", value: inPerson },
        { name: "이러닝", value: elearning },
        { name: "블렌디드", value: blended },
        { name: "실시간화상", value: Math.max(0, zoom) }
      ].sort((a, b) => b.value - a.value));

      // Credits distribution
      const c3 = Math.round(totalCourses * 0.65);
      const c2 = Math.round(totalCourses * 0.2);
      const c1 = Math.round(totalCourses * 0.1);
      const cOther = totalCourses - (c3 + c2 + c1);

      setCredits([
        { name: "3학점", value: c3 },
        { name: "2학점", value: c2 },
        { name: "1학점", value: c1 },
        { name: "기타", value: Math.max(0, cOther) }
      ].sort((a, b) => b.value - a.value));

      // Day of week distribution
      const d1 = Math.round(totalCourses * 0.35);
      const d2 = Math.round(totalCourses * 0.42);
      const d3 = Math.round(totalCourses * 0.38);
      const d4 = Math.round(totalCourses * 0.40);
      const d5 = Math.round(totalCourses * 0.22);
      const d6 = Math.round(totalCourses * 0.02);

      setDays([
        { name: "월", count: d1 },
        { name: "화", count: d2 },
        { name: "수", count: d3 },
        { name: "목", count: d4 },
        { name: "금", count: d5 },
        { name: "토", count: d6 }
      ]);

      // Time of day distribution
      const t1 = Math.round(totalCourses * 0.45);
      const t2 = Math.round(totalCourses * 0.33);
      const t3 = Math.round(totalCourses * 0.18);
      const t4 = Math.max(0, totalCourses - (t1 + t2 + t3));

      setTimes([
        { name: "오전 9-12시", count: t1 },
        { name: "12-15시", count: t2 },
        { name: "15-18시", count: t3 },
        { name: "야간 18시~", count: t4 }
      ]);

      setCollegeSummaries([
        {
          college: selectedCollege || "인문대학",
          courseCount: totalCourses,
          totalStudents: totalStudents,
          avgEnrollmentRate: Math.round(avgEnrollmentRate * 10) / 10
        }
      ]);

      // Generate totalCourses fallback courses
      const fallbackCoursesList: CourseRow[] = [];
      for (let i = 0; i < totalCourses; i++) {
        const itemSeed = seed + i;
        const col = selectedCollege || "인문대학";
        const deptName = selectedDept || `${col} 학과 ${(itemSeed % 3) + 1}`;
        const name = `${deptName} ${subjectBases[itemSeed % subjectBases.length]} ${i + 1}`;
        const classification = classifs[itemSeed % classifs.length];
        const credits = (itemSeed % 2) === 0 ? 3 : 2;
        const professor = profs[itemSeed % profs.length];
        const daysOfWeek = ["월", "화", "수", "목", "금"];
        const day1 = daysOfWeek[itemSeed % daysOfWeek.length];
        const day2 = daysOfWeek[(itemSeed + 2) % daysOfWeek.length];
        const schedule = `${day1}(${(itemSeed % 5) + 1}), ${day2}(${((itemSeed + 1) % 5) + 1})`;
        
        const capacity = 30 + (itemSeed % 40);
        let students = Math.round(capacity * (0.6 + (itemSeed % 6) / 10));
        if (itemSeed % 10 === 0) {
          students = capacity + 5;
        }

        const classroom = `제15호관 강의실-${100 + (itemSeed % 20)}`;
        const timeSchedule = ` [15-100:월(09:00~10:15)]`;
        const method = itemSeed % 2 === 0 ? "대면수업" : "이러닝";
        const foreignLang = itemSeed % 8 === 0 ? "Y" : "N";
        const maleStudents = Math.round(students * 0.45);
        const femaleStudents = students - maleStudents;

        fallbackCoursesList.push({
          code: `000${200000 + i}`,
          name,
          classification,
          credits,
          professor,
          schedule,
          students,
          capacity,
          classroom,
          timeSchedule,
          method,
          foreignLang,
          maleStudents,
          femaleStudents
        });
      }
      setCourses(fallbackCoursesList);
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(num);
  };

  // Find maximum values to highlight in gold
  const maxCount = categories.length > 0 ? Math.max(...categories.map(c => c.count)) : 0;
  const maxAvgStudents = categories.length > 0 ? Math.max(...categories.map(c => c.avgStudents)) : 0;
  const maxDayCount = days.length > 0 ? Math.max(...days.map(d => d.count)) : 0;
  const maxTimeCount = times.length > 0 ? Math.max(...times.map(t => t.count)) : 0;

  // Pagination calculations
  const itemsPerPage = 10;
  const totalCoursesCount = courses.length;
  const totalPages = Math.ceil(totalCoursesCount / itemsPerPage);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCourses = courses.slice(indexOfFirstItem, indexOfLastItem);
  
  const startNum = totalCoursesCount > 0 ? indexOfFirstItem + 1 : 0;
  const endNum = Math.min(indexOfLastItem, totalCoursesCount);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex gap-6 items-start relative min-h-full">
      {/* Left Column: Main Dashboard Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Fallback Banner Indicator */}
        {isFallback && (
          <div className="mb-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <span>⚠️</span>
            <span>Supabase <code>inu-dashboard</code> 테이블이 아직 준비되지 않아 실시간 데모용 시뮬레이션 데이터를 표시하고 있습니다.</span>
          </div>
        )}

        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-[#1A1A2E]">
            {department ? `${department} 대시보드` : college ? `${college} 대시보드` : "전체 교과목 대시보드"}
          </h2>
          <p className="text-xs text-[#6B7280]">
            {department ? `${college} > ${department}의 교과목 분석 정보입니다.` : college ? `${college}의 교과목 분석 정보입니다.` : "인천대학교 2026학년도 1학기 전체 개설 강좌 현황입니다."}
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI 1: Total Courses */}
          <div className="bg-white p-6 rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col justify-between h-[120px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B7280]">총 강좌 수</span>
              <span className="text-lg text-[#6B7280]">📚</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
                  {loading ? "..." : formatNumber(stats.totalCourses)}
                </span>
                <span className="text-xs font-medium text-[#6B7280]">개</span>
              </div>
              <p className="text-[10px] text-[#6B7280] mt-1">2026학년도 1학기 기준</p>
            </div>
          </div>

          {/* KPI 2: Total Students */}
          <div className="bg-white p-6 rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col justify-between h-[120px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B7280]">총 수강인원</span>
              <span className="text-lg text-[#6B7280]">👤</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
                  {loading ? "..." : formatNumber(stats.totalStudents)}
                </span>
                <span className="text-xs font-medium text-[#6B7280]">명</span>
              </div>
              <p className="text-[10px] text-[#6B7280] mt-1">실시간 수강 신청 완료 기준</p>
            </div>
          </div>

          {/* KPI 3: Average Enrollment Rate */}
          <div className="bg-white p-6 rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col justify-between h-[120px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B7280]">평균 수강률</span>
              <span className="text-lg text-[#6B7280]">📈</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
                  {loading ? "..." : stats.avgEnrollmentRate}
                </span>
                <span className="text-xs font-medium text-[#6B7280]">%</span>
              </div>
              <p className="text-[10px] text-[#6B7280] mt-1">정원이 개설된 강좌 대상</p>
            </div>
          </div>

          {/* KPI 4: Foreign Language Ratio */}
          <div className="bg-white p-6 rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col justify-between h-[120px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B7280]">원어강의 비율</span>
              <span className="text-lg text-[#6B7280]">🌐</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
                  {loading ? "..." : stats.foreignLanguageRatio}
                </span>
                <span className="text-xs font-medium text-[#6B7280]">%</span>
              </div>
              <p className="text-[10px] text-[#6B7280] mt-1">영어 및 다국어 수업 포함</p>
            </div>
          </div>
        </div>

        {/* Main Grid: Bar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course classification Horizontal Bar Chart */}
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col card-container transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
            <div className="flex items-center justify-between card-header">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1A4FA0]"></span>
                <h3 className="text-sm font-bold text-[#1A1A2E]">이수구분별 강좌 수</h3>
              </div>
            </div>

            <div className="card-content">
              <div className="w-full h-[240px]">
                {mounted && categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categories}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#1A4FA0" />
                        </linearGradient>
                        <linearGradient id="barMaxGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FCD34D" />
                          <stop offset="100%" stopColor="#F5B700" />
                        </linearGradient>
                      </defs>
                      <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#1A1A2E"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(243, 244, 246, 0.6)" }}
                        contentStyle={{
                          backgroundColor: "#1A1A2E",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 12px",
                        }}
                        itemStyle={{ color: "#FFFFFF", fontSize: "11px", fontWeight: "600" }}
                        labelStyle={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px", marginBottom: "4px" }}
                        formatter={(value) => [`${value}개`, "강좌 수"]}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                        {categories.map((entry, index) => {
                          const isMax = entry.count === maxCount;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={isMax ? "url(#barMaxGradient)" : "url(#barGradient)"}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#6B7280]">
                    차트를 불러오는 중...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Average Enrollment Horizontal Bar Chart */}
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col card-container transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
            <div className="flex items-center justify-between card-header">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1A4FA0]"></span>
                <h3 className="text-sm font-bold text-[#1A1A2E]">이수구분별 평균 수강인원</h3>
              </div>
            </div>

            <div className="card-content">
              <div className="w-full h-[240px]">
                {mounted && categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categories}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#1A4FA0" />
                        </linearGradient>
                        <linearGradient id="barMaxGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FCD34D" />
                          <stop offset="100%" stopColor="#F5B700" />
                        </linearGradient>
                      </defs>
                      <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#1A1A2E"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(243, 244, 246, 0.6)" }}
                        contentStyle={{
                          backgroundColor: "#1A1A2E",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 12px",
                        }}
                        itemStyle={{ color: "#FFFFFF", fontSize: "11px", fontWeight: "600" }}
                        labelStyle={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px", marginBottom: "4px" }}
                        formatter={(value) => [`${value}명`, "평균 수강인원"]}
                      />
                      <Bar dataKey="avgStudents" radius={[0, 4, 4, 0]} barSize={16}>
                        {categories.map((entry, index) => {
                          const isMax = entry.avgStudents === maxAvgStudents;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={isMax ? "url(#barMaxGradient)" : "url(#barGradient)"}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#6B7280]">
                    차트를 불러오는 중...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3 Grid: Donut Charts (2 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart 1: Class Method */}
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col card-container transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
            <div className="flex items-center justify-between card-header">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1A4FA0]"></span>
                <h3 className="text-sm font-bold text-[#1A1A2E]">수업방법 유형 분포</h3>
              </div>
            </div>

            <div className="card-content flex flex-col gap-4">
              <div className="relative w-full h-[200px] flex items-center justify-center">
                {mounted && methods.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={methods}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {methods.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1A1A2E",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 10px",
                          }}
                          itemStyle={{ color: "#FFFFFF", fontSize: "11px", fontWeight: "600" }}
                          formatter={(value) => [`${value}개`, "강좌 수"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center text */}
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL</span>
                      <span className="text-xl font-bold text-[#1A1A2E]">
                        {loading ? "..." : formatNumber(stats.totalCourses)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-[#6B7280]">도넛 차트를 불러오는 중...</div>
                )}
              </div>

              {/* Custom Legends */}
              <div className="flex flex-col gap-2 mt-2">
                {methods.map((item, index) => {
                  const percentage = stats.totalCourses > 0 ? Math.round((item.value / stats.totalCourses) * 1000) / 10 : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                        ></span>
                        <span className="font-semibold text-[#1A1A2E]">{item.name}</span>
                      </div>
                      <span className="font-semibold text-[#6B7280]">{item.value}개 ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Donut Chart 2: Credits Composition */}
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col card-container transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
            <div className="flex items-center justify-between card-header">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1A4FA0]"></span>
                <h3 className="text-sm font-bold text-[#1A1A2E]">학점 구성 비율</h3>
              </div>
            </div>

            <div className="card-content flex flex-col gap-4">
              <div className="relative w-full h-[200px] flex items-center justify-center">
                {mounted && credits.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={credits}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {credits.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1A1A2E",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 10px",
                          }}
                          itemStyle={{ color: "#FFFFFF", fontSize: "11px", fontWeight: "600" }}
                          formatter={(value) => [`${value}개`, "강좌 수"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center text */}
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">COURSES</span>
                      <span className="text-xl font-bold text-[#1A1A2E]">
                        {loading ? "..." : formatNumber(stats.totalCourses)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-[#6B7280]">도넛 차트를 불러오는 중...</div>
                )}
              </div>

              {/* Custom Legends */}
              <div className="flex flex-col gap-2 mt-2">
                {credits.map((item, index) => {
                  const percentage = stats.totalCourses > 0 ? Math.round((item.value / stats.totalCourses) * 1000) / 10 : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                        ></span>
                        <span className="font-semibold text-[#1A1A2E]">{item.name}</span>
                      </div>
                      <span className="font-semibold text-[#6B7280]">{item.value}개 ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Row 4 Grid: Day of Week Chart (1/2 width) & Class Time Chart (1/2 width) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day of Week Chart Card */}
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col card-container transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
            <div className="flex items-center justify-between card-header">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1A4FA0]"></span>
                <h3 className="text-sm font-bold text-[#1A1A2E]">요일별 수업 강좌 수</h3>
              </div>
            </div>

            <div className="card-content">
              <div className="w-full h-[220px]">
                {mounted && days.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={days}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#1A4FA0" />
                        </linearGradient>
                        <linearGradient id="barMaxGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FCD34D" />
                          <stop offset="100%" stopColor="#F5B700" />
                        </linearGradient>
                      </defs>
                      <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#1A1A2E"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(243, 244, 246, 0.6)" }}
                        contentStyle={{
                          backgroundColor: "#1A1A2E",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 12px",
                        }}
                        itemStyle={{ color: "#FFFFFF", fontSize: "11px", fontWeight: "600" }}
                        labelStyle={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px", marginBottom: "4px" }}
                        formatter={(value) => [`${value}개`, "강좌 수"]}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                        {days.map((entry, index) => {
                          const isMax = entry.count === maxDayCount;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={isMax ? "url(#barMaxGradient)" : "url(#barGradient)"}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#6B7280]">
                    차트를 불러오는 중...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Course Time Chart Card */}
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col card-container transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
            <div className="flex items-center justify-between card-header">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1A4FA0]"></span>
                <h3 className="text-sm font-bold text-[#1A1A2E]">수업 시간별 강좌 수</h3>
              </div>
            </div>

            <div className="card-content">
              <div className="w-full h-[220px]">
                {mounted && times.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={times}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#1A4FA0" />
                        </linearGradient>
                        <linearGradient id="barMaxGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FCD34D" />
                          <stop offset="100%" stopColor="#F5B700" />
                        </linearGradient>
                      </defs>
                      <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#1A1A2E"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(243, 244, 246, 0.6)" }}
                        contentStyle={{
                          backgroundColor: "#1A1A2E",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 12px",
                        }}
                        itemStyle={{ color: "#FFFFFF", fontSize: "11px", fontWeight: "600" }}
                        labelStyle={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px", marginBottom: "4px" }}
                        formatter={(value) => [`${value}개`, "강좌 수"]}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                        {times.map((entry, index) => {
                          const isMax = entry.count === maxTimeCount;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={isMax ? "url(#barMaxGradient)" : "url(#barGradient)"}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#6B7280]">
                    차트를 불러오는 중...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* College/Graduate School Lecture Analysis Summary Table Card */}
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col card-container transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
          <div className="flex items-center justify-between card-header">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1A4FA0]"></span>
              <h3 className="text-sm font-bold text-[#1A1A2E]">대학(원)별 강좌 분석 요약</h3>
            </div>
          </div>

          <div className="card-content">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 flex items-center justify-center text-xs text-[#6B7280]">
                  데이터를 불러오는 중...
                </div>
              ) : collegeSummaries.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] text-[12px] font-medium text-[#6B7280]">
                      <th className="py-3 px-4 rounded-l-lg font-medium">순번</th>
                      <th className="py-3 px-4 font-medium">대학명</th>
                      <th className="py-3 px-4 text-right font-medium">강좌 수(개)</th>
                      <th className="py-3 px-4 text-right font-medium">수강인원 합계(명)</th>
                      <th className="py-3 px-4 text-right rounded-r-lg font-medium">평균 수강률(%)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-[#E5E7EB]/50">
                    {collegeSummaries.map((summary, index) => {
                      const isTopRank = index < 3;
                      return (
                        <tr key={summary.college} className="hover:bg-[#EEF3FB] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#6B7280]">{index + 1}</td>
                          <td className="py-3 px-4 font-bold text-[#1A1A2E]">{summary.college}</td>
                          <td className="py-3 px-4 text-right font-semibold text-[#6B7280]">
                            {formatNumber(summary.courseCount)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-[#6B7280]">
                            {formatNumber(summary.totalStudents)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#1A1A2E]">
                            <div className="flex items-center justify-end gap-2">
                              <span>{summary.avgEnrollmentRate}%</span>
                              {isTopRank && (
                                <span className="bg-[#FEF3C7] text-[#F5B700] text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  {index + 1}위
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 flex items-center justify-center text-xs text-[#6B7280]">
                  대학(원)별 요약 정보가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 6: Detailed Course Table (full width) */}
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(26,79,160,0.06),0_4px_16px_rgba(26,79,160,0.08)] flex flex-col card-container transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(26,79,160,0.12),0_12px_32px_rgba(26,79,160,0.16)]">
          <div className="flex justify-between items-center card-header">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1A4FA0]"></span>
              <h3 className="text-sm font-bold text-[#1A1A2E]">상세 강좌 정보</h3>
            </div>
            <div className="text-xs font-semibold text-[#6B7280]">
              총 {formatNumber(totalCoursesCount)}개 중 {startNum}-{endNum}번째 표시
            </div>
          </div>

          <div className="card-content">
            <div className="flex gap-6 items-start">
              <div className="flex-1 min-w-0 flex flex-col gap-4">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="py-12 flex items-center justify-center text-xs text-[#6B7280]">
                      강좌 목록을 불러오는 중...
                    </div>
                  ) : currentCourses.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F9FAFB] text-[12px] font-medium text-[#6B7280]">
                          <th className="py-3 px-4 rounded-l-lg font-medium">교과목명</th>
                          <th className="py-3 px-4 font-medium">이수구분</th>
                          <th className="py-3 px-4 font-medium text-center">학점</th>
                          <th className="py-3 px-4 font-medium">담당교수</th>
                          <th className="py-3 px-4 font-medium">시간표(교시)</th>
                          <th className="py-3 px-4 font-medium text-right">수강 / 정원</th>
                          <th className="py-3 px-4 rounded-r-lg font-medium text-right">수강률(%)</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {currentCourses.map((c) => {
                          const rate = c.capacity > 0 ? Math.round((c.students / c.capacity) * 100) : 0;
                          const isOverLimit = rate > 100;
                          const isSelected = selectedCourse?.code === c.code;
                          return (
                            <tr
                              key={c.code}
                              onClick={() => setSelectedCourse(c)}
                              className={`hover:bg-[#EEF3FB] transition-colors cursor-pointer border-b border-[#E5E7EB]/50 last:border-b-0 ${
                                isSelected ? "bg-[#EEF3FB]" : ""
                              }`}
                            >
                              <td className="py-3.5 px-4 font-bold text-[#1A1A2E]">
                                <div className="flex flex-col">
                                  <span>{c.name}</span>
                                  <span className="text-[10px] text-[#6B7280] font-normal">{c.code}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.classification === "전공필수" || c.classification === "전공선택"
                                    ? "bg-blue-50 text-[#1A4FA0]"
                                    : "bg-amber-50 text-amber-800"
                                }`}>
                                  {c.classification}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-semibold text-[#1A1A2E]">{c.credits}학점</td>
                              <td className="py-3.5 px-4 font-semibold text-[#6B7280]">{c.professor}</td>
                              <td className="py-3.5 px-4 font-semibold text-[#6B7280] max-w-[150px] truncate" title={c.schedule}>
                                {c.schedule}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#1A1A2E] text-right">
                                {formatNumber(c.students)} / {formatNumber(c.capacity)}
                              </td>
                              <td className={`py-3.5 px-4 text-right ${
                                isOverLimit ? "font-bold text-[#1A4FA0]" : "font-semibold text-[#1A1A2E]"
                              }`}>
                                {rate}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-12 flex items-center justify-center text-xs text-[#6B7280]">
                      개설된 강좌 정보가 없습니다.
                    </div>
                  )}
                </div>

                {/* Pagination controls */}
                {!loading && totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-4 mt-2">
                    <div className="text-xs text-[#6B7280]">
                      페이지 {currentPage} / {totalPages}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPage(prev => Math.max(prev - 1, 1));
                        }}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#1A1A2E] hover:bg-[#F0F2F5]/50 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                      >
                        이전
                      </button>
                      
                      {getPageNumbers().map(page => {
                        const isActive = page === currentPage;
                        return (
                          <button
                            key={page}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentPage(page);
                            }}
                            className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                              isActive
                                ? "bg-[#1A4FA0] text-white rounded-[6px]"
                                : "border border-[#E5E7EB] rounded-lg text-[#1A1A2E] hover:bg-[#F0F2F5]/50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPage(prev => Math.min(prev + 1, totalPages));
                        }}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#1A1A2E] hover:bg-[#F0F2F5]/50 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Sliding Detailed Course Panel inside table container */}
              {selectedCourse && (
                <div className="w-[280px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[14px] p-5 flex flex-col gap-5 flex-shrink-0 animate-fadeIn transition-all duration-300">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB]/60 pb-3">
                    <h4 className="text-sm font-bold text-[#1A1A2E] flex items-center gap-1.5">
                      <span>📋</span> 강좌 상세 정보
                    </h4>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="text-xs text-[#9CA3AF] hover:text-[#1A1A2E] font-semibold border border-[#E5E7EB] px-2 py-1 rounded hover:bg-white transition-all"
                    >
                      닫기
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-[#6B7280] font-bold tracking-wide">{selectedCourse.code}</span>
                    <h5 className="text-sm font-bold text-[#1A1A2E] leading-snug">{selectedCourse.name}</h5>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        selectedCourse.classification === "전공필수" || selectedCourse.classification === "전공선택"
                          ? "bg-blue-50 text-[#1A4FA0]"
                          : "bg-amber-50 text-amber-800"
                      }`}>
                        {selectedCourse.classification}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 text-xs border-y border-[#E5E7EB]/60 py-4">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">담당교수</span>
                      <span className="font-semibold text-[#1A1A2E]">{selectedCourse.professor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">학점</span>
                      <span className="font-semibold text-[#1A1A2E]">{selectedCourse.credits}학점</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">정원 / 수강</span>
                      <span className="font-semibold text-[#1A1A2E]">
                        {formatNumber(selectedCourse.capacity)}명 / {formatNumber(selectedCourse.students)}명
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">수강률</span>
                      <span className="font-bold text-[#1A4FA0]">
                        {selectedCourse.capacity > 0 ? Math.round((selectedCourse.students / selectedCourse.capacity) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-[#6B7280] text-[10px]">강의실</span>
                      <span className="font-medium text-[#1A1A2E] truncate" title={selectedCourse.classroom}>
                        {selectedCourse.classroom}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#6B7280] text-[10px]">시간표</span>
                      <span className="font-medium text-[#1A1A2E] text-[10px] leading-tight" title={selectedCourse.timeSchedule}>
                        {selectedCourse.timeSchedule}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">수업방법</span>
                      <span className="font-semibold text-[#1A1A2E]">{selectedCourse.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">원어강의 여부</span>
                      <span className="font-semibold text-[#1A1A2E]">
                        {selectedCourse.foreignLang === "Y" || selectedCourse.foreignLang === "Yes" ? "대상" : "비대상"}
                      </span>
                    </div>
                  </div>

                  {/* Gender Mini Bar Chart */}
                  <div className="flex flex-col gap-2">
                    <h6 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">수강생 성비 구성</h6>
                    <div className="flex items-center justify-between text-[10px] text-[#6B7280] font-semibold">
                      <span>남학생: {selectedCourse.maleStudents}명</span>
                      <span>여학생: {selectedCourse.femaleStudents}명</span>
                    </div>
                    <div className="w-full h-3.5 bg-[#F0F2F5] rounded-full overflow-hidden flex shadow-inner">
                      {/* Male Bar */}
                      <div
                        style={{ width: `${selectedCourse.students > 0 ? (selectedCourse.maleStudents / selectedCourse.students) * 100 : 50}%` }}
                        className="h-full bg-gradient-to-r from-[#1A4FA0] to-[#2563EB]"
                        title="남학생 비율"
                      ></div>
                      {/* Female Bar */}
                      <div
                        style={{ width: `${selectedCourse.students > 0 ? (selectedCourse.femaleStudents / selectedCourse.students) * 100 : 50}%` }}
                        className="h-full bg-[#F5B700]"
                        title="여학생 비율"
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-xs text-[#6B7280]">대시보드 데이터를 계산하는 중...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
