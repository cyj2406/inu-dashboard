import React from "react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E5E7EB] bg-white py-6 px-6 md:px-8 text-xs text-[#6B7280]">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Top section: Title and Links */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2 font-medium">
            <span>📖</span>
            <span>Incheon National University Course Dashboard</span>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a
              href="https://www.inu.ac.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1A4FA0] transition-colors duration-200"
            >
              인천대학교 홈페이지
            </a>
            <a
              href="https://portal.inu.ac.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1A4FA0] transition-colors duration-200"
            >
              INU 포털
            </a>
            <a
              href="https://cyber.inu.ac.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1A4FA0] transition-colors duration-200"
            >
              이러닝
            </a>
          </div>
        </div>

        {/* Bottom section: Developer info and Copyright */}
        <div className="border-t border-[#E5E7EB]/60 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] text-[#9CA3AF]">
          <span>Designed & Developed by 202301910 최유정</span>
          <span>© 2026 Incheon National University.</span>
        </div>
      </div>
    </footer>
  );
}
