import React, { useState } from "react";
import { createPortal } from "react-dom";
import { RoomBooking, MeetingRoom, AppLanguage } from "../types";
import { translations } from "../lib/translations";
import { 
  FileSpreadsheet, 
  Printer, 
  CalendarDays, 
  Filter, 
  Building, 
  Users, 
  FileText, 
  Settings, 
  Check, 
  Eye, 
  X 
} from "lucide-react";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";

interface ReportSystemProps {
  bookings: RoomBooking[];
  rooms: MeetingRoom[];
  language: AppLanguage;
}

export default function ReportSystem({ bookings, rooms, language }: ReportSystemProps) {
  const t = translations[language];
  const isLao = language === "lo";

  // Reporting State
  const [reportPeriod, setReportPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [reportDate, setReportDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10);
  });
  const [reportRoomId, setReportRoomId] = useState<string>("all");
  const [reportStatus, setReportStatus] = useState<string>("all");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Official Lao Report Form Configurations
  const [provinceName, setProvinceName] = useState("ແຂວງຫົວພັນ");
  const [officeNameState, setOfficeNameState] = useState("ຫ້ອງວ່າການແຂວງຫົວພັນ");
  const [docNumber, setDocNumber] = useState("108/ຫວກ.ຫພ");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [compilerName, setCompilerName] = useState("ທ່ານ ສົມໄຊ ວິໄລພອນ");
  const [compilerTitle, setCompilerTitle] = useState("ວິຊາການ ຂະແໜງເຕັກໂນໂລຊີ-ສັງລວມ");
  const [approverName, setApproverName] = useState("ທ່ານ ສົມພອນ ບຸນມະນີ");
  const [approverTitle, setApproverTitle] = useState("ຫົວໜ້າຫ້ອງວ່າການແຂວງຫົວພັນ");
  const [showSeal, setShowSeal] = useState(true);
  const [showDistribution, setShowDistribution] = useState(true);
  const [customPreface, setCustomPreface] = useState(
    "ເພື່ອເປັນການສະຫຼຸບ, ສັງເຄາະ ແລະ ຕິດຕາມການນຳໃຊ້ຫ້ອງປະຊຸມຂອງບັນດາພະແນກການ ແລະ ອົງການອ້ອມຂ້າງແຂວງ, ຫ້ອງວ່າການແຂວງຫົວພັນ ຂໍສະຫຼຸບສັງລວມຕົວເລກສະຖິຕິການຈອງ ແລະ ນຳໃຊ້ຫ້ອງປະຊຸມ ດັ່ງມີລາຍລະອຽດລຸ່ມນີ້:"
  );

  // Helper for computing week start/end dates
  const getWeekRange = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().substring(0, 10),
      end: sunday.toISOString().substring(0, 10)
    };
  };

  // Filter bookings based on report parameters
  const filteredReportBookings = bookings.filter((b) => {
    // Room Filter
    if (reportRoomId !== "all" && b.roomId !== reportRoomId) return false;
    
    // Status Filter
    if (reportStatus !== "all" && b.status !== reportStatus) return false;

    // Period Filter
    if (reportPeriod === "day") {
      return b.date === reportDate;
    } else if (reportPeriod === "week") {
      const { start, end } = getWeekRange(reportDate);
      return b.date >= start && b.date <= end;
    } else if (reportPeriod === "month") {
      const targetMonth = reportDate.substring(0, 7);
      return b.date.startsWith(targetMonth);
    } else if (reportPeriod === "year") {
      const targetYear = reportDate.substring(0, 4);
      return b.date.startsWith(targetYear);
    }
    return true;
  });

  // Calculate report summary statistics
  const rTotal = filteredReportBookings.length;
  const rApproved = filteredReportBookings.filter(b => b.status === "approved").length;
  const rPending = filteredReportBookings.filter(b => b.status === "pending").length;
  const rRejected = filteredReportBookings.filter(b => b.status === "rejected").length;

  // Most active room in filtered subset
  const roomCountMap: Record<string, number> = {};
  filteredReportBookings.forEach(b => {
    roomCountMap[b.roomName] = (roomCountMap[b.roomName] || 0) + 1;
  });
  let rMostPopularRoom = isLao ? "ບໍ່ມີຂໍ້ມູນ" : "N/A";
  let maxRoomCount = 0;
  Object.entries(roomCountMap).forEach(([name, count]) => {
    if (count > maxRoomCount) {
      maxRoomCount = count;
      rMostPopularRoom = name;
    }
  });

  // Most active department in filtered subset
  const deptCountMap: Record<string, number> = {};
  filteredReportBookings.forEach(b => {
    const dept = b.department || (isLao ? "ທົ່ວໄປ" : "General");
    deptCountMap[dept] = (deptCountMap[dept] || 0) + 1;
  });
  let rMostActiveDept = isLao ? "ບໍ່ມີຂໍ້ມູນ" : "N/A";
  let maxDeptCount = 0;
  Object.entries(deptCountMap).forEach(([dept, count]) => {
    if (count > maxDeptCount) {
      maxDeptCount = count;
      rMostActiveDept = dept;
    }
  });

  // Formatted date for doc
  const formattedDocDate = (() => {
    const parts = docDate.split("-");
    if (parts.length === 3) {
      return `ວັນທີ ${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return docDate;
  })();

  return (
    <div id="reporting-page" className="space-y-6 font-sans pb-12">
      
      {/* 1. MODERN INTERACTIVE REPORTING & STATISTICS SYSTEM */}
      <div id="reporting-panel" className="bg-white dark:bg-[#1e293b] p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-200/80 dark:border-white/10 border-t-4 border-t-indigo-600 space-y-6">
        
        {/* Banner header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 sm:p-6 rounded-2xl shadow-md text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-white animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-white tracking-tight">
                {t.rpTitle || "ລະບົບລາຍງານ ແລະ ສະຫຼຸບສະຖິຕິ"}
              </h3>
              <p className="text-xs text-indigo-100 font-semibold mt-0.5">
                {isLao ? "ສະຫຼຸບຜົນການຈອງເປັນລາຍວັນ, ອາທິດ, ເດືອນ, ປີ ແລະ ສັ່ງພິມເອກະສານໄດ້ທັນທີ" : "Summarize bookings by day, week, month, year, and export/print instantly"}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-indigo-700 active:scale-95 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer shrink-0 group border border-white/40"
          >
            <Printer className="w-4 h-4 transition-transform group-hover:rotate-12 text-indigo-600" />
            <span>{t.rpPrint || "ພິມລາຍງານສະຫຼຸບ"}</span>
          </button>
        </div>

        {/* Filters Box */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10">
          
          {/* Period selector tabs */}
          <div className="md:col-span-4 flex flex-col space-y-1.5">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isLao ? "ຮູບແບບການສະຫຼຸບ" : "Summary Period"}</span>
            </label>
            <div className="grid grid-cols-4 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl gap-1">
              {(["day", "week", "month", "year"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setReportPeriod(period)}
                  className={`py-2 px-1 rounded-lg text-xs font-black transition-all text-center cursor-pointer capitalize ${
                    reportPeriod === period
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  }`}
                >
                  {period === "day" ? (isLao ? "ລາຍວັນ" : "Day") :
                   period === "week" ? (isLao ? "ອາທິດ" : "Week") :
                   period === "month" ? (isLao ? "ລາຍເດືອນ" : "Month") :
                   (isLao ? "ລາຍປີ" : "Year")}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div className="md:col-span-3 flex flex-col space-y-1.5">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">
              {isLao ? "ວັນທີ / ເດືອນ / ປີ ທີ່ອ້າງອີງ" : "Reference Date"}
            </label>
            {reportPeriod === "year" ? (
              <select
                value={reportDate.substring(0, 4)}
                onChange={(e) => setReportDate(`${e.target.value}-01-01`)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 h-10"
              >
                {Array.from({ length: 6 }, (_, i) => 2024 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            ) : reportPeriod === "month" ? (
              <input
                type="month"
                value={reportDate.substring(0, 7)}
                onChange={(e) => setReportDate(`${e.target.value}-01`)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 h-10"
              />
            ) : (
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 h-10"
              />
            )}
          </div>

          {/* Room filter */}
          <div className="md:col-span-3 flex flex-col space-y-1.5">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t.rpRoomFilter || "ເລືອກຫ້ອງປະຊຸມ"}</span>
            </label>
            <select
              value={reportRoomId}
              onChange={(e) => setReportRoomId(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 h-10"
            >
              <option value="all">{isLao ? "ທຸກຫ້ອງປະຊຸມ" : "All Meeting Rooms"}</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="md:col-span-2 flex flex-col space-y-1.5">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">
              {t.rpStatusFilter || "ເລືອກສະຖານະ"}
            </label>
            <select
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 h-10"
            >
              <option value="all">{isLao ? "ທຸກສະຖານະ" : "All Status"}</option>
              <option value="approved">{t.bkStatusApproved}</option>
              <option value="pending">{t.bkStatusPending}</option>
              <option value="rejected">{t.bkStatusRejected}</option>
            </select>
          </div>

        </div>

        {/* Period descriptive title badge */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
            <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
              {isLao ? "ບົດລາຍງານຜົນສັງລວມ" : "Period Summary Result"}:{" "}
              <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-500/30 underline-offset-4">
                {reportPeriod === "day" && `${isLao ? "ວັນທີ" : "Date"} ${reportDate}`}
                {reportPeriod === "week" && `${isLao ? "ອາທິດຂອງວັນທີ" : "Week of"} ${getWeekRange(reportDate).start} → ${getWeekRange(reportDate).end}`}
                {reportPeriod === "month" && `${isLao ? "ເດືອນ" : "Month"} ${reportDate.substring(0, 7)}`}
                {reportPeriod === "year" && `${isLao ? "ປີ" : "Year"} ${reportDate.substring(0, 4)}`}
              </span>
            </h4>
          </div>
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 border border-indigo-500/20 px-3 py-1 rounded-xl">
            {rTotal} {isLao ? "ລາຍການພົບເຫັນ" : "found"}
          </span>
        </div>

        {/* Dynamic Micro Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 text-center shadow-xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold block mb-1 uppercase tracking-wider">{isLao ? "ຈຳນວນຈອງທັງໝົດ" : "Total Bookings"}</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{rTotal}</span>
          </div>

          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-center shadow-xs">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold block mb-1 uppercase tracking-wider">{t.bkStatusApproved}</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{rApproved}</span>
          </div>

          <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 text-center shadow-xs">
            <span className="text-[10px] text-blue-700 dark:text-blue-400 font-extrabold block mb-1 uppercase tracking-wider">{t.bkStatusPending}</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{rPending}</span>
          </div>

          <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20 text-center col-span-1 shadow-xs">
            <span className="text-[10px] text-purple-700 dark:text-purple-400 font-extrabold block mb-1 uppercase tracking-wider leading-tight truncate">{t.rpPopularRoom || "ຫ້ອງທີ່ໃຊ້ຫຼາຍສຸດ"}</span>
            <span className="text-xs font-black text-purple-700 dark:text-purple-300 block truncate mt-1">{rMostPopularRoom}</span>
          </div>

          <div className="bg-pink-500/10 p-4 rounded-2xl border border-pink-500/20 text-center col-span-2 md:col-span-1 lg:col-span-1 shadow-xs">
            <span className="text-[10px] text-pink-700 dark:text-pink-400 font-extrabold block mb-1 uppercase tracking-wider leading-tight truncate">{t.rpActiveDept || "ພາກສ່ວນຈອງຫຼາຍສຸດ"}</span>
            <span className="text-xs font-black text-pink-700 dark:text-pink-300 block truncate mt-1">{rMostActiveDept}</span>
          </div>

        </div>

        {/* Mini report bookings table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-white/10">
                <th className="py-3 px-4">{t.rmRoomName}</th>
                <th className="py-3 px-4">{t.bkMeetingTitle}</th>
                <th className="py-3 px-4">{t.bkDate}</th>
                <th className="py-3 px-4">{t.dbTimeRange}</th>
                <th className="py-3 px-4">{t.bkDepartment}</th>
                <th className="py-3 px-4">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredReportBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center opacity-70 font-bold text-slate-500">
                    {t.noData}
                  </td>
                </tr>
              ) : (
                filteredReportBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{booking.roomName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-[220px] truncate">{booking.title}</td>
                    <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">{booking.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{booking.startTime} - {booking.endTime}</td>
                    <td className="py-3 px-4 font-extrabold text-indigo-600 dark:text-indigo-400">{booking.department || (isLao ? "ທົ່ວໄປ" : "General")}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        booking.status === "approved" 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : booking.status === "rejected" 
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      }`}>
                        {booking.status === "approved" ? t.bkStatusApproved :
                         booking.status === "rejected" ? t.bkStatusRejected : t.bkStatusPending}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 2. OFFICIAL LAO REPORT CONFIGURATOR & PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:hidden">
          <div className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-7xl flex flex-col h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Printer className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 dark:text-white text-base sm:text-lg">
                    {isLao ? "ປັບແຕ່ງ ແລະ ພິມລາຍງານສະຫຼຸບທາງການ" : "Official Report Customizer"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {isLao ? "ປັບແຕ່ງຂໍ້ມູນຫົວຂໍ້, ເລກທີເອກະສານ, ຜູ້ລົງລາຍເຊັນ ແລະ ກວດສອບໃບຕົວຢ່າງກ່ອນສັ່ງພິມ" : "Configure titles, references, sign-offs, and inspect live preview"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Left Form, Right Document Preview) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              
              {/* Left Column: Config Form */}
              <div className="lg:col-span-5 p-5 sm:p-6 overflow-y-auto space-y-6 bg-white dark:bg-[#131b2e] border-r border-slate-200 dark:border-white/10">
                
                {/* Section I: Admin Metadata */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-1">
                    <Building className="w-4 h-4" />
                    <span>{isLao ? "1. ຂໍ້ມູນສະຖາບັນ & ເລກທີເອກະສານ" : "1. Organization & Document Refs"}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ແຂວງອ້າງອີງ" : "Province Name"}</label>
                      <input
                        type="text"
                        value={provinceName}
                        onChange={(e) => setProvinceName(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຫ້ອງການ / ພະແນກ" : "Office/Department"}</label>
                      <input
                        type="text"
                        value={officeNameState}
                        onChange={(e) => setOfficeNameState(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ເລກທີເອກະສານ" : "Document Reference Number"}</label>
                      <input
                        type="text"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ວັນທີສະຫຼຸບ" : "Reference Date"}</label>
                      <input
                        type="date"
                        value={docDate}
                        onChange={(e) => setDocDate(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section II: Signatories */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-1">
                    <Users className="w-4 h-4" />
                    <span>{isLao ? "2. ຜູ້ລົງນາມ & ວິຊາການ" : "2. Signatures & Staff"}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ສະຫຼຸບລາຍງານ" : "Compiler Name"}</label>
                      <input
                        type="text"
                        value={compilerName}
                        onChange={(e) => setCompilerName(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ສະຫຼຸບ" : "Compiler Title"}</label>
                      <input
                        type="text"
                        value={compilerTitle}
                        onChange={(e) => setCompilerTitle(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ມີອຳນາດອະນຸມັດ" : "Approver Name"}</label>
                      <input
                        type="text"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ອະນຸມັດ" : "Approver Title"}</label>
                      <input
                        type="text"
                        value={approverTitle}
                        onChange={(e) => setApproverTitle(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section III: Custom Preface Paragraph */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-1">
                    <FileText className="w-4 h-4" />
                    <span>{isLao ? "3. ຄຳກ່າວເບື້ອງຕົ້ນ / ບົດນຳ" : "3. Introduction/Preface Paragraph"}</span>
                  </h4>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຄຳເກີ່ນນຳໃນເອກະສານ" : "Preface text paragraph"}</label>
                    <textarea
                      value={customPreface}
                      onChange={(e) => setCustomPreface(e.target.value)}
                      rows={3}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-none"
                    />
                  </div>
                </div>

                {/* Section IV: Visual Toggles */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-1">
                    <Settings className="w-4 h-4" />
                    <span>{isLao ? "4. ການສະແດງຜົນເພີ່ມເຕີມ" : "4. Display & Styling Toggles"}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowSeal(!showSeal)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        showSeal
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{isLao ? "ກາປະທັບທາງການ" : "Official Seal"}</span>
                        <span className="text-[9px] opacity-80">{isLao ? "ສະແດງກາປະທັບສີແດງ" : "Show round stamp seal"}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${showSeal ? "bg-indigo-600 text-white" : "bg-slate-300 dark:bg-slate-700"}`}>
                        {showSeal && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    <button
                      onClick={() => setShowDistribution(!showDistribution)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        showDistribution
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{isLao ? "ບ່ອນນຳສົ່ງ" : "Distribution List"}</span>
                        <span className="text-[9px] opacity-80">{isLao ? "ສະແດງບັນຊີບ່ອນນຳສົ່ງ" : "Show copy-to lists"}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${showDistribution ? "bg-indigo-600 text-white" : "bg-slate-300 dark:bg-slate-700"}`}>
                        {showDistribution && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Paper Document Preview */}
              <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-200 dark:bg-slate-950 overflow-y-auto flex flex-col items-center justify-start">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest mb-3 flex items-center gap-1.5 self-start">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  <span>{isLao ? "ຕົວຢ່າງເອກະສານທີ່ຈະພິມ (Live A4 Preview)" : "Live Print Sheet Preview"}</span>
                </div>

                {/* Highly polished, responsive official paper frame mockup */}
                <div className="w-full bg-white text-slate-950 shadow-2xl rounded-3xl p-6 sm:p-10 border border-slate-300 relative overflow-hidden select-none text-left flex flex-col justify-between" style={{ minHeight: "840px" }}>
                  
                  {/* Glowing vertical stamp indicating live preview only */}
                  <div className="absolute right-4 top-24 origin-top-right rotate-95 text-[9px] font-black tracking-widest text-indigo-500/10 dark:text-indigo-400/10 select-none pointer-events-none uppercase">
                    LIVE SYSTEM PREVIEW • LIVE SYSTEM PREVIEW
                  </div>

                  {/* Top National Header block */}
                  <div>
                    <div className="pb-4 mb-4 text-center font-sans">
                      {/* Centered Emblem Logo and National Motto */}
                      <div className="flex flex-col items-center justify-center mb-2">
                        <img
                          src={emblemLogo}
                          alt="Laos National Emblem"
                          className="w-16 h-16 object-contain filter mb-1.5"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            if (e.currentTarget.src !== emblemSvg) {
                              e.currentTarget.src = emblemSvg;
                            } else {
                              e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Emblem_of_Laos_%282025-%29.svg/800px-Emblem_of_Laos_%282025-%29.svg.png";
                            }
                          }}
                        />
                        <h4 className="text-[10px] sm:text-[11px] font-black tracking-wide text-slate-950 uppercase leading-none">
                          ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
                        </h4>
                        <h5 className="text-[8px] sm:text-[9px] font-bold text-slate-800 tracking-tight leading-normal mt-1">
                          ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
                        </h5>
                      </div>

                      {/* Left and Right Administrative details */}
                      <div className="flex justify-between items-end text-slate-900 text-[9px] font-bold mt-4 px-1">
                        <div className="text-left space-y-0.5">
                          <p className="uppercase text-slate-950 text-[10px]">{provinceName}</p>
                          <p className="text-slate-800 text-[10px]">{officeNameState}</p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="text-indigo-600 font-extrabold text-[10px]">ເລກທີ: {docNumber}</p>
                          <p className="text-slate-800 text-[10px]">ວັນທີ: {formattedDocDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Report Title */}
                    <div className="text-center my-5 space-y-1.5">
                      <h2 className="text-base font-black text-slate-950 uppercase tracking-wide">
                        {isLao ? "ໃບສະຫຼຸບລາຍງານ" : "SUMMARY REPORT"}
                      </h2>
                      <h3 className="text-[11px] font-extrabold text-slate-800 leading-relaxed max-w-xl mx-auto">
                        {isLao 
                          ? "ການນໍາໃຊ້ລະບົບການຈອງຫ້ອງປະຊຸມທັນສະໄໝ ຫ້ອງວ່າການແຂວງຫົວພັນ" 
                          : "Utilization of the Modern Meeting Room Booking System, Houaphanh Provincial Office"}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-500 italic">
                        {reportPeriod === "day" && `( ປະຈຳວັນທີ: ${reportDate} )`}
                        {reportPeriod === "week" && `( ປະຈຳອາທິດ: ວັນທີ ${getWeekRange(reportDate).start} ຫາ ວັນທີ ${getWeekRange(reportDate).end} )`}
                        {reportPeriod === "month" && `( ປະຈຳເດືອນ: ${reportDate.substring(0, 7)} )`}
                        {reportPeriod === "year" && `( ປະຈຳປີ: ${reportDate.substring(0, 4)} )`}
                      </p>
                    </div>

                    {/* Report Preface */}
                    <div className="mb-4 text-[10px] text-slate-700 leading-relaxed text-justify">
                      <p>{customPreface}</p>
                    </div>

                    {/* I. Statistics Table */}
                    <div className="mb-4 space-y-1">
                      <h4 className="text-[9px] font-black text-slate-900 border-l-2 border-slate-900 pl-1.5 uppercase">
                        I. ຕົວເລກສະຖິຕິສັງລວມ (CONSOLIDATED STATISTICS)
                      </h4>
                      <div className="grid grid-cols-3 gap-0 border border-slate-400 text-[9px] text-slate-900 bg-slate-50/40">
                        <div className="border-r border-b border-slate-400 p-2 text-center">
                          <p className="font-bold text-slate-500 uppercase text-[8px]">{isLao ? "ການຈອງທັງໝົດ" : "Total Bookings"}</p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">{rTotal} ລາຍການ</p>
                        </div>
                        <div className="border-r border-b border-slate-400 p-2 text-center">
                          <p className="font-bold text-slate-500 uppercase text-[8px]">{t.bkStatusApproved}</p>
                          <p className="text-sm font-black text-emerald-700 mt-0.5">{rApproved} ລາຍການ</p>
                        </div>
                        <div className="border-b border-slate-400 p-2 text-center">
                          <p className="font-bold text-slate-500 uppercase text-[8px]">{isLao ? "ລໍຖ້າ / ປະຕິເສດ" : "Pending/Rejected"}</p>
                          <p className="text-sm font-black text-slate-700 mt-0.5">{rPending} / {rRejected} ລາຍການ</p>
                        </div>
                        <div className="col-span-1 border-r border-slate-400 p-2">
                          <p className="font-bold text-slate-500 uppercase text-[8px]">{isLao ? "ຫ້ອງທີ່ໃຊ້ຫຼາຍສຸດ" : "Most Utilized Room"}</p>
                          <p className="font-bold text-[10px] mt-0.5 text-indigo-700 truncate">{rMostPopularRoom}</p>
                        </div>
                        <div className="col-span-2 p-2">
                          <p className="font-bold text-slate-500 uppercase text-[8px]">{isLao ? "ພາກສ່ວນຈອງຫຼາຍສຸດ" : "Most Active Dept"}</p>
                          <p className="font-bold text-[10px] mt-0.5 text-slate-900 truncate">{rMostActiveDept}</p>
                        </div>
                      </div>
                    </div>

                    {/* II. Detailed table */}
                    <div className="mb-4 space-y-1">
                      <h4 className="text-[9px] font-black text-slate-900 border-l-2 border-slate-900 pl-1.5 uppercase">
                        II. ບັນຊີລາຍລະອຽດການເຄື່ອນໄຫວ (DETAILED REGISTRY)
                      </h4>
                      <table className="w-full text-left border-collapse border border-slate-400 text-[8px] text-slate-900">
                        <thead>
                          <tr className="bg-slate-100 text-slate-950 border-b border-slate-400 font-bold">
                            <th className="py-1 px-1 border-r border-slate-400 text-center w-8">ລຳດັບ</th>
                            <th className="py-1 px-1.5 border-r border-slate-400 w-16">ຫ້ອງປະຊຸມ</th>
                            <th className="py-1 px-1.5 border-r border-slate-400">ຫົວຂໍ້ກອງປະຊຸມ</th>
                            <th className="py-1 px-1 border-r border-slate-400 text-center w-16">ວັນທີປະຊຸມ</th>
                            <th className="py-1 px-1 border-r border-slate-400 text-center w-14">ເວລາ</th>
                            <th className="py-1 px-1.5 border-r border-slate-400 w-20">ພາກສ່ວນຈອງ</th>
                            <th className="py-1 px-1 text-center w-14">ສະຖານະ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReportBookings.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-4 text-center text-slate-400">{t.noData}</td>
                            </tr>
                          ) : (
                            filteredReportBookings.slice(0, 8).map((b, idx) => (
                              <tr key={b.id} className="border-b border-slate-400">
                                <td className="py-1 px-1 border-r border-slate-400 text-center">{idx + 1}</td>
                                <td className="py-1 px-1.5 border-r border-slate-400 font-bold truncate max-w-[70px]">{b.roomName}</td>
                                <td className="py-1 px-1.5 border-r border-slate-400 truncate max-w-[150px]">{b.title}</td>
                                <td className="py-1 px-1 border-r border-slate-400 text-center text-[7px]">{b.date}</td>
                                <td className="py-1 px-1 border-r border-slate-400 text-center text-[7px]">{b.startTime}-{b.endTime}</td>
                                <td className="py-1 px-1.5 border-r border-slate-400 font-bold truncate max-w-[80px]">{b.department || "ທົ່ວໄປ"}</td>
                                <td className="py-1 px-1 text-center font-semibold text-[7px]">
                                  {b.status === "approved" ? "ອະນຸມັດ" : b.status === "rejected" ? "ປະຕິເສດ" : "ລໍຖ້າ"}
                                </td>
                              </tr>
                            ))
                          )}
                          {filteredReportBookings.length > 8 && (
                            <tr>
                              <td colSpan={7} className="py-1 text-center text-[7px] bg-slate-50 italic text-slate-500">
                                {isLao ? `... ແລະ ມີອີກ ${filteredReportBookings.length - 8} ລາຍການອື່ນໆ ທີ່ສະແດງໃນສະບັບພິມເຕັມ ...` : `... and ${filteredReportBookings.length - 8} more entries showing in the full print document ...`}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* III. Sign-off Blocks */}
                  <div className="flex justify-between items-start text-[8px] text-slate-900 font-sans pt-4 border-t border-slate-200">
                    
                    {/* Distribution */}
                    <div className="w-[45%] text-left space-y-1">
                      {showDistribution ? (
                        <div>
                          <p className="font-bold underline uppercase text-[7px]">ບ່ອນນຳສົ່ງ (Distribution):</p>
                          <ul className="text-[7px] list-none pl-0 space-y-0.5 text-slate-600 mt-1">
                            <li>- ທ່ານເຈົ້າແຂວງ{provinceName}</li>
                            <li>- ຫ້ອງວ່າການ{provinceName}</li>
                            <li>- ຂະແໜງເຕັກໂນໂລຊີ</li>
                            <li>- ເກັບມ້ຽນສຳເນົາ</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="h-6"></div>
                      )}
                      
                      <div className="pt-4">
                        <p className="font-bold">{isLao ? "ຜູ້ສະຫຼຸບລາຍງານ" : "Report Compiler"}</p>
                        <div className="h-6"></div>
                        <p className="font-semibold text-slate-400">......................................................</p>
                        <p className="font-bold text-slate-800">{compilerName}</p>
                        <p className="text-[7px] text-slate-500">{compilerTitle}</p>
                      </div>
                    </div>

                    {/* Approver & Seal */}
                    <div className="w-[45%] text-center flex flex-col items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-bold uppercase text-[9px] text-slate-950">{approverTitle}</p>
                        <p className="text-[7px] text-slate-400">{isLao ? "(ເຊັນ ແລະ ປະທັບຕາເປັນທາງການ)" : "(Signature & Seal)"}</p>
                      </div>
                      
                      {/* Red Stamp mockup representation in Live Preview */}
                      {showSeal ? (
                        <div className="relative my-2 scale-75 select-none">
                          <div className="w-16 h-16 rounded-full border-2 border-dashed border-red-500/50 flex flex-col items-center justify-center p-0.5">
                            <div className="w-14 h-14 rounded-full border border-double border-red-500/60 flex flex-col items-center justify-center text-center">
                              <span className="text-[5px] text-red-500 font-bold">ຫ້ອງວ່າການ</span>
                              <span className="text-[6px] text-red-500 font-black tracking-tighter leading-none my-0.5">ແຂວງຫົວພັນ</span>
                              <span className="text-[4px] text-red-500">STAMP SEAL</span>
                            </div>
                          </div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[6px] text-red-500 font-bold border border-red-500/30 px-1 rotate-[-12deg] bg-white/95">
                            APPROVED
                          </div>
                        </div>
                      ) : (
                        <div className="h-10"></div>
                      )}

                      <div className="pt-1">
                        <p className="font-semibold text-slate-400">......................................................</p>
                        <p className="font-bold text-slate-900 text-[9px]">{approverName}</p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center sm:text-left leading-relaxed font-bold max-w-lg">
                * {isLao 
                  ? "ຂໍ້ມູນທັງໝົດຈະຖືກສັງເຄາະຈາກຖານຂໍ້ມູນຈິງໃນລະບົບ ໂດຍອີງໃສ່ຕົວເລືອກໄລຍະເວລາ ແລະ ການກອງຂໍ້ມູນທີ່ທ່ານເລືອກໄວ້ຫຼ້າສຸດ."
                  : "All statistical records are generated directly from live system storage based on your selected active filter values."}
              </p>
              
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-black transition-all cursor-pointer w-1/2 sm:w-auto text-center"
                >
                  {isLao ? "ຍົກເລີກ" : "Cancel"}
                </button>
                <button
                  onClick={() => {
                    setIsPrintModalOpen(false);
                    setTimeout(() => {
                      window.print();
                    }, 250);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 w-1/2 sm:w-auto"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isLao ? "ສັ່ງພິມລາຍງານທາງການ" : "Print Official Report"}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PRINT-ONLY OFFICIAL LAO DOCUMENT */}
      {typeof document !== "undefined" && createPortal(
        <div id="print-report-sheet" className="hidden print:block bg-white text-slate-950 p-6 min-h-screen font-sans">
          
          {/* LAO PDR NATIONAL EMBLEM & FORMAL ADMINISTRATIVE HEADER */}
          <div className="pb-5 mb-6 text-center font-sans">
            <div className="flex flex-col items-center justify-center mb-2">
              <img
                src={emblemLogo}
                alt="Laos National Emblem"
                className="w-16 h-16 object-contain filter mb-1.5"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== emblemSvg) {
                    e.currentTarget.src = emblemSvg;
                  } else {
                    e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Emblem_of_Laos_%282025-%29.svg/800px-Emblem_of_Laos_%282025-%29.svg.png";
                  }
                }}
              />
              <h4 className="text-[10px] sm:text-[11px] font-black tracking-wide text-slate-950 uppercase leading-none">
                ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
              </h4>
              <h5 className="text-[8px] sm:text-[9px] font-bold text-slate-800 tracking-tight leading-normal mt-1">
                ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
              </h5>
            </div>

            <div className="flex justify-between items-end text-slate-900 text-[9px] font-bold mt-4 px-1">
              <div className="text-left space-y-0.5">
                <p className="uppercase text-slate-950 text-[10px]">{provinceName}</p>
                <p className="text-slate-800 text-[10px]">{officeNameState}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-indigo-600 font-extrabold text-[10px]">ເລກທີ: {docNumber}</p>
                <p className="text-slate-800 text-[10px]">ວັນທີ: {formattedDocDate}</p>
              </div>
            </div>
          </div>

          {/* DOCUMENT TITLE & SUBTITLE */}
          <div className="text-center my-6 space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-slate-950">ໃບສະຫຼຸບລາຍງານ ແລະ ສະຖິຕິ</h2>
            <h3 className="text-sm font-bold text-slate-800">ການນຳໃຊ້ ແລະ ຈອງຫ້ອງປະຊຸມ {officeNameState}</h3>
            <p className="text-xs font-semibold text-slate-700 italic">
              {reportPeriod === "day" && `( ປະຈຳວັນທີ: ${reportDate} )`}
              {reportPeriod === "week" && `( ປະຈຳອາທິດ: ວັນທີ ${getWeekRange(reportDate).start} ຫາ ວັນທີ ${getWeekRange(reportDate).end} )`}
              {reportPeriod === "month" && `( ປະຈຳເດືອນ: ${reportDate.substring(0, 7)} )`}
              {reportPeriod === "year" && `( ປະຈຳປີ: ${reportDate.substring(0, 4)} )`}
            </p>
          </div>

          {/* Preface Text */}
          <div className="mb-6 text-xs text-slate-800 leading-relaxed text-justify font-medium">
            <p>{customPreface}</p>
          </div>

          {/* SECTION I: CONSOLIDATED STATISTICS */}
          <div className="mb-6 space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-950 border-l-4 border-slate-950 pl-2">
              I. ຕົວເລກສະຖິຕິສັງລວມ (CONSOLIDATED STATISTICS SUMMARY)
            </h3>
            <div className="grid grid-cols-3 gap-0 border border-slate-950 text-xs text-slate-950 bg-white">
              <div className="border-r border-b border-slate-950 p-3 bg-slate-50 text-center">
                <p className="font-bold text-[10px] text-slate-600 uppercase">ການຈອງທັງໝົດ</p>
                <p className="text-base font-extrabold mt-1">{rTotal} ລາຍການ</p>
              </div>
              <div className="border-r border-b border-slate-950 p-3 bg-slate-50 text-center">
                <p className="font-bold text-[10px] text-slate-600 uppercase">ອະນຸມັດ</p>
                <p className="text-base font-extrabold mt-1 text-emerald-800">{rApproved} ລາຍການ</p>
              </div>
              <div className="border-b border-slate-950 p-3 bg-slate-50 text-center">
                <p className="font-bold text-[10px] text-slate-600 uppercase">ລໍຖ້າກວດສອບ / ປະຕິເສດ</p>
                <p className="text-base font-extrabold mt-1">{rPending} / {rRejected} ລາຍການ</p>
              </div>
              <div className="col-span-1 border-r border-slate-950 p-3">
                <p className="font-bold text-[10px] text-slate-600 uppercase">ຫ້ອງປະຊຸມທີ່ມີການນຳໃຊ້ຫຼາຍທີ່ສຸດ</p>
                <p className="font-bold text-xs mt-1 text-indigo-700">{rMostPopularRoom}</p>
              </div>
              <div className="col-span-2 p-3">
                <p className="font-bold text-[10px] text-slate-600 uppercase">ພາກສ່ວນ/ພະແນກ ທີ່ມີການເຄື່ອນໄຫວສູງສຸດ</p>
                <p className="font-bold text-xs mt-1 text-slate-900">{rMostActiveDept}</p>
              </div>
            </div>
          </div>

          {/* SECTION II: DETAILED REGISTRY */}
          <div className="mb-6 space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-950 border-l-4 border-slate-950 pl-2">
              II. ບັນຊີລາຍລະອຽດການເຄື່ອນໄຫວ (DETAILED MEETING BOOKING REGISTRY)
            </h3>
            <table className="w-full text-left border-collapse border border-slate-950 text-[10px] text-slate-950">
              <thead>
                <tr className="bg-slate-100 text-slate-950 border-b border-slate-950 font-bold">
                  <th className="py-2 px-1 border-r border-slate-950 text-center w-10">ລຳດັບ</th>
                  <th className="py-2 px-2 border-r border-slate-950 w-24">ຫ້ອງປະຊຸມ</th>
                  <th className="py-2 px-2 border-r border-slate-950">ຫົວຂໍ້ກອງປະຊຸມ / ເນື້ອໃນຈຸດປະສົງ</th>
                  <th className="py-2 px-2 border-r border-slate-950 text-center w-24">ວັນທີປະຊຸມ</th>
                  <th className="py-2 px-2 border-r border-slate-950 text-center w-20">ເວລາປະຊຸມ</th>
                  <th className="py-2 px-2 border-r border-slate-950 w-32">ພາກສ່ວນຂໍຈອງ</th>
                  <th className="py-2 px-1 text-center w-20">ສະຖານະ</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center font-bold text-slate-500">ບໍ່ມີຂໍ້ມູນລາຍການຈອງໃນຊ່ວງເວລານີ້</td>
                  </tr>
                ) : (
                  filteredReportBookings.map((b, idx) => (
                    <tr key={b.id} className="border-b border-slate-950">
                      <td className="py-2.5 px-1 border-r border-slate-950 text-center">{idx + 1}</td>
                      <td className="py-2.5 px-2 border-r border-slate-950 font-bold">{b.roomName}</td>
                      <td className="py-2.5 px-2 border-r border-slate-950 font-medium">{b.title}</td>
                      <td className="py-2.5 px-2 border-r border-slate-950 text-center">{b.date}</td>
                      <td className="py-2.5 px-2 border-r border-slate-950 text-center">{b.startTime} - {b.endTime}</td>
                      <td className="py-2.5 px-2 border-r border-slate-950 font-bold">{b.department || "ທົ່ວໄປ"}</td>
                      <td className="py-2.5 px-1 text-center font-bold">
                        {b.status === "approved" ? "ອະນຸມັດ" : b.status === "rejected" ? "ປະຕິເສດ" : "ລໍຖ້າກວດສອບ"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* SECTION III: AUTHENTIC ADMINISTRATIVE SIGN-OFF & OFFICIAL SEAL */}
          <div className="mt-8 flex justify-between items-start text-xs text-slate-950 font-sans">
            
            <div className="w-[45%] text-left space-y-1 flex flex-col justify-between min-h-[220px]">
              <div>
                {showDistribution ? (
                  <div>
                    <p className="font-bold underline text-[10px] uppercase">ບ່ອນນຳສົ່ງ (Distribution List):</p>
                    <ul className="text-[9px] list-none pl-0 space-y-0.5 font-medium text-slate-700 mt-1.5">
                      <li>- ທ່ານເຈົ້າແຂວງ{provinceName} (ເພື່ອລາຍງານ)</li>
                      <li>- ຫ້ອງວ່າການ{provinceName} (ເພື່ອຕິດຕາມ)</li>
                      <li>- ບັນດາພະແນກການອ້ອມຂ້າງ (ເພື່ອຊາບ)</li>
                      <li>- ເກັບມ້ຽນສຳເນົາ (ຂະແໜງເຕັກໂນໂລຊີ)</li>
                    </ul>
                  </div>
                ) : (
                  <div className="h-10"></div>
                )}
              </div>
              
              <div className="pt-6">
                <p className="font-bold">ຜູ້ສະຫຼຸບ ແລະ ບັນທຶກລາຍງານ</p>
                <div className="h-14"></div>
                <p className="font-bold text-slate-800">......................................................</p>
                <p className="font-bold text-slate-900">{compilerName}</p>
                <p className="text-[9px] text-slate-500 font-medium">{compilerTitle}</p>
              </div>
            </div>

            <div className="w-[45%] text-center flex flex-col items-center justify-between min-h-[220px]">
              <div className="space-y-1 text-center">
                <p className="font-bold uppercase tracking-wide">{approverTitle}</p>
                <p className="text-[10px] text-slate-500 font-medium">(ເຊັນ ແລະ ປະທັບຕາເປັນທາງການ)</p>
              </div>
              
              {showSeal ? (
                <div className="relative my-3 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-red-500/40 flex flex-col items-center justify-center p-1 select-none pointer-events-none">
                    <div className="w-20 h-20 rounded-full border-2 border-double border-red-500/50 flex flex-col items-center justify-center text-center">
                      <span className="text-[7px] text-red-500 font-bold leading-none">ຫ້ອງວ່າການ</span>
                      <span className="text-[8px] text-red-500 font-black leading-tight my-0.5">ແຂວງຫົວພັນ</span>
                      <span className="text-[6px] text-red-500 font-semibold leading-none">OFFICIAL SEAL</span>
                    </div>
                  </div>
                  <div className="absolute text-[8px] text-red-500 font-bold border border-red-500/30 px-1 py-0.5 rotate-[-12deg] bg-white/95">
                    ບ່ອນປະທັບຕາ
                  </div>
                </div>
              ) : (
                <div className="h-16"></div>
              )}

              <div className="pt-2 text-center">
                <p className="font-bold text-slate-800">......................................................</p>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">( {approverName} )</p>
              </div>
            </div>

          </div>

        </div>,
        document.body
      )}

    </div>
  );
}
