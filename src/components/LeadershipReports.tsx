import React, { useState, useMemo } from "react";
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  Filter, 
  Search, 
  CheckCircle2, 
  Clock, 
  Building2, 
  User, 
  BarChart3, 
  Sparkles,
  PieChart,
  MapPin,
  FileText,
  ChevronDown,
  ArrowDownToLine,
  Layers,
  Award
} from "lucide-react";
import { 
  LeadershipActivity, 
  UserProfile, 
  AppLanguage, 
  ActivityCategory, 
  ActivityStatus 
} from "../types";
import { 
  getCategoryLabel, 
  getStatusLabel, 
  getPriorityLabel, 
  PROVINCIAL_DEPARTMENTS 
} from "../lib/activityHelper";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";

interface LeadershipReportsProps {
  activities: LeadershipActivity[];
  userProfile: UserProfile;
  language: AppLanguage;
}

export default function LeadershipReports({
  activities,
  userProfile,
  language
}: LeadershipReportsProps) {
  const isLao = language === "lo";

  // Granularity: "weekly" | "monthly" | "yearly"
  const [granularity, setGranularity] = useState<"weekly" | "monthly" | "yearly">("monthly");

  // Selected date parameters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Account / User Filter (Crucial requirement: ຕິດຕາມວ່າບັນຊີຜູ້ໃຊ້ດັ່ງກ່າວເຄື່ອນໄຫວວຽກຫຍັງແດ່)
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Unique users for dropdown
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; dept: string }>();
    activities.forEach(a => {
      if (a.userId && a.userName) {
        map.set(a.userId, { id: a.userId, name: a.userName, dept: a.department });
      }
    });
    return Array.from(map.values());
  }, [activities]);

  // Calculate Start and End dates based on selected granularity
  const { startDateStr, endDateStr, periodTitle } = useMemo(() => {
    if (granularity === "weekly") {
      const baseDate = new Date(selectedWeekDate);
      const day = baseDate.getDay();
      const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(baseDate.setDate(diff));
      const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
      
      const start = monday.toISOString().split("T")[0];
      const end = sunday.toISOString().split("T")[0];
      const title = isLao 
        ? `ປະຈຳອາທິດ: ວັນທີ ${start} ຫາ ${end}` 
        : `Weekly: ${start} to ${end}`;
      return { startDateStr: start, endDateStr: end, periodTitle: title };
    }

    if (granularity === "monthly") {
      const monthStr = String(selectedMonth).padStart(2, "0");
      const start = `${selectedYear}-${monthStr}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const end = `${selectedYear}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
      
      const laoMonthNames = [
        "ມັງກອນ (1)", "ກຸມພາ (2)", "ມີນາ (3)", "ເມສາ (4)", "ພຶດສະພາ (5)", "ມິຖຸນາ (6)",
        "ກໍລະກົດ (7)", "ສິງຫາ (8)", "ກັນຍາ (9)", "ຕຸລາ (10)", "ພະຈິກ (11)", "ທັນວາ (12)"
      ];
      const title = isLao 
        ? `ປະຈຳເດືອນ ${laoMonthNames[selectedMonth - 1]} ປີ ${selectedYear}` 
        : `Monthly: Month ${selectedMonth}, ${selectedYear}`;
      return { startDateStr: start, endDateStr: end, periodTitle: title };
    }

    // Yearly
    const start = `${selectedYear}-01-01`;
    const end = `${selectedYear}-12-31`;
    const title = isLao 
      ? `ປະຈຳປີ ${selectedYear}` 
      : `Yearly: ${selectedYear}`;
    return { startDateStr: start, endDateStr: end, periodTitle: title };
  }, [granularity, selectedYear, selectedMonth, selectedWeekDate, isLao]);

  // Filter activities matching the selected period and filters
  const reportActivities = useMemo(() => {
    return activities.filter(act => {
      // Date range overlap check
      const actStart = act.startDate;
      const actEnd = act.endDate || act.startDate;

      if (actStart > endDateStr || actEnd < startDateStr) return false;

      // User filter
      if (selectedUser !== "all" && act.userId !== selectedUser) return false;

      // Department filter
      if (selectedDept !== "all" && act.department !== selectedDept) return false;

      // Category filter
      if (selectedCategory !== "all" && act.category !== selectedCategory) return false;

      // Status filter
      if (selectedStatus !== "all" && act.status !== selectedStatus) return false;

      return true;
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [activities, startDateStr, endDateStr, selectedUser, selectedDept, selectedCategory, selectedStatus]);

  // Statistics
  const totalCount = reportActivities.length;
  const completedCount = reportActivities.filter(a => a.status === "completed").length;
  const inProgressCount = reportActivities.filter(a => a.status === "in_progress").length;
  const scheduledCount = reportActivities.filter(a => a.status === "scheduled").length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Breakdown by Category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reportActivities.forEach(a => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [reportActivities]);

  // Selected User Object
  const targetUserObj = selectedUser !== "all" 
    ? uniqueUsers.find(u => u.id === selectedUser) 
    : null;

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (reportActivities.length === 0) return;

    const headers = isLao
      ? ["ລຳດັບ", "ວັນທີເລີ່ມ", "ເວລາເລີ່ມ", "ວັນທີສິ້ນສຸດ", "ເວລາສິ້ນສຸດ", "ຫົວຂໍ້ການເຄື່ອນໄຫວວຽກ", "ຜູ້ຮັບຜິດຊອບ", "ຕຳແໜ່ງ/ໜ້າທີ່", "ພະແນກ/ຂະແໜງ", "ສະຖານທີ່", "ປະເພດວຽກ", "ລະດັບຄວາມສຳຄັນ", "ສະຖານະ", "ຜູ້ເຂົ້າຮ່ວມ", "ຜົນການປະຕິບັດງານ"]
      : ["No", "Start Date", "Start Time", "End Date", "End Time", "Activity Title", "Officer", "Role Title", "Department", "Location", "Category", "Priority", "Status", "Participants", "Outcome"];

    const rows = reportActivities.map((act, index) => {
      const cat = getCategoryLabel(act.category, isLao).label;
      const stat = getStatusLabel(act.status, isLao).label;
      const pri = getPriorityLabel(act.priority, isLao).label;

      return [
        index + 1,
        `"${act.startDate}"`,
        `"${act.startTime}"`,
        `"${act.endDate || act.startDate}"`,
        `"${act.endTime}"`,
        `"${(act.title || "").replace(/"/g, '""')}"`,
        `"${(act.userName || "").replace(/"/g, '""')}"`,
        `"${(act.roleTitle || "").replace(/"/g, '""')}"`,
        `"${(act.department || "").replace(/"/g, '""')}"`,
        `"${(act.location || "").replace(/"/g, '""')}"`,
        `"${cat}"`,
        `"${pri}"`,
        `"${stat}"`,
        `"${(act.participants || "").replace(/"/g, '""')}"`,
        `"${(act.outcome || "").replace(/"/g, '""')}"`
      ].join(",");
    });

    // UTF-8 BOM for Excel support
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Houaphanh_Leadership_Report_${granularity}_${startDateStr}_${endDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner (hidden in print) */}
      <div className="print:hidden relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-[11px] font-black text-amber-300 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLao ? "ລະບົບສັງລວມ ແລະ ອອກບົດລາຍງານ" : "Executive Reporting System"}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isLao ? "ບົດລາຍງານການເຄື່ອນໄຫວວຽກງານ (ອາທິດ, ເດືອນ, ປີ)" : "Leadership Activity Reports (Weekly, Monthly, Yearly)"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
                {isLao 
                  ? "ຕິດຕາມກວດກາ ແລະ ສັງລວມຜົນການເຄື່ອນໄຫວວຽກຂອງຄະນະ, ຫົວໜ້າພະແນກ ຫຼື ແຕ່ລະບັນຊີຜູ້ໃຊ້ ພ້ອມພິມບົດລາຍງານທາງການ"
                  : "Comprehensive analytics and official reporting for leadership, department heads, and specific user accounts."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={reportActivities.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isLao ? "ສົ່ງອອກ Excel/CSV" : "Export CSV"}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={reportActivities.length === 0}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>{isLao ? "ພິມບົດລາຍງານທາງການ" : "Print Official Report"}</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ວຽກງານທັງໝົດ" : "Total Activities"}</span>
            <span className="text-xl font-black text-white">{totalCount}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ສຳເລັດແລ້ວ" : "Completed"}</span>
            <span className="text-xl font-black text-emerald-300">{completedCount}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ພວມຈັດຕັ້ງປະຕິບັດ" : "In Progress"}</span>
            <span className="text-xl font-black text-amber-300">{inProgressCount}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ອັດຕາຄວາມສຳເລັດ" : "Completion Rate"}</span>
            <span className="text-xl font-black text-cyan-300">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Report Configuration & Filters Bar (hidden in print) */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        
        {/* Row 1: Granularity Selector (Weekly, Monthly, Yearly) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {isLao ? "ໄລຍະເວລາລາຍງານ:" : "Period:"}
            </span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <button
                onClick={() => setGranularity("weekly")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  granularity === "weekly"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {isLao ? "ລາຍງານປະຈຳອາທິດ (Weekly)" : "Weekly"}
              </button>
              <button
                onClick={() => setGranularity("monthly")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  granularity === "monthly"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {isLao ? "ລາຍງານປະຈຳເດືອນ (Monthly)" : "Monthly"}
              </button>
              <button
                onClick={() => setGranularity("yearly")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  granularity === "yearly"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {isLao ? "ລາຍງານປະຈຳປີ (Yearly)" : "Yearly"}
              </button>
            </div>
          </div>

          {/* Granularity specific pickers */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {granularity === "weekly" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">{isLao ? "ເລືອກອາທິດ:" : "Week date:"}</span>
                <input
                  type="date"
                  value={selectedWeekDate}
                  onChange={(e) => setSelectedWeekDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            )}

            {granularity === "monthly" && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value={1}>{isLao ? "ເດືອນ 1 (ມັງກອນ)" : "Jan (1)"}</option>
                  <option value={2}>{isLao ? "ເດືອນ 2 (ກຸມພາ)" : "Feb (2)"}</option>
                  <option value={3}>{isLao ? "ເດືອນ 3 (ມີນາ)" : "Mar (3)"}</option>
                  <option value={4}>{isLao ? "ເດືອນ 4 (ເມສາ)" : "Apr (4)"}</option>
                  <option value={5}>{isLao ? "ເດືອນ 5 (ພຶດສະພາ)" : "May (5)"}</option>
                  <option value={6}>{isLao ? "ເດືອນ 6 (ມິຖຸນາ)" : "Jun (6)"}</option>
                  <option value={7}>{isLao ? "ເດືອນ 7 (ກໍລະກົດ)" : "Jul (7)"}</option>
                  <option value={8}>{isLao ? "ເດືອນ 8 (ສິງຫາ)" : "Aug (8)"}</option>
                  <option value={9}>{isLao ? "ເດືອນ 9 (ກັນຍາ)" : "Sep (9)"}</option>
                  <option value={10}>{isLao ? "ເດືອນ 10 (ຕຸລາ)" : "Oct (10)"}</option>
                  <option value={11}>{isLao ? "ເດືອນ 11 (ພະຈິກ)" : "Nov (11)"}</option>
                  <option value={12}>{isLao ? "ເດືອນ 12 (ທັນວາ)" : "Dec (12)"}</option>
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                    <option key={y} value={y}>{isLao ? `ປີ ${y}` : y}</option>
                  ))}
                </select>
              </div>
            )}

            {granularity === "yearly" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">{isLao ? "ເລືອກປີ:" : "Select Year:"}</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                    <option key={y} value={y}>{isLao ? `ປີ ${y}` : y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Account & Category Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-medium">
          
          {/* USER / ACCOUNT FILTER */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {isLao ? "ບັນຊີຜູ້ໃຊ້ / ຄະນະ *" : "User / Official Account *"}
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">{isLao ? "ທຸກບັນຊີຜູ້ໃຊ້ (All Users)" : "All Users"}</option>
              {uniqueUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.dept ? u.dept.replace("ຂະແໜງ", "").trim() : "ຫ້ອງວ່າການ"})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {isLao ? "ພະແນກ / ຂະແໜງ" : "Department"}
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">{isLao ? "ທຸກພະແນກ / ຂະແໜງ" : "All Departments"}</option>
              {PROVINCIAL_DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {isLao ? "ປະເພດວຽກ" : "Category"}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">{isLao ? "ທຸກປະເພດວຽກ" : "All Categories"}</option>
              <option value="meeting">{isLao ? "ກອງປະຊຸມ" : "Meeting"}</option>
              <option value="mission">{isLao ? "ລົງເຄື່ອນໄຫວ/ພາລະກິດ" : "Mission"}</option>
              <option value="inspection">{isLao ? "ລົງກວດກາ/ຕິດຕາມວຽກ" : "Inspection"}</option>
              <option value="ceremony">{isLao ? "ພິທີການ/ຕ້ອນຮັບ" : "Ceremony"}</option>
              <option value="internal">{isLao ? "ວຽກພາຍໃນຫ້ອງການ" : "Internal Office"}</option>
              <option value="training">{isLao ? "ຝຶກອົບຮົມ/ສຳມະນາ" : "Training"}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {isLao ? "ສະຖານະ" : "Status"}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">{isLao ? "ທຸກສະຖານະ" : "All Status"}</option>
              <option value="scheduled">{isLao ? "ມີແຜນກຳນົດ" : "Scheduled"}</option>
              <option value="in_progress">{isLao ? "ພວມປະຕິບັດ" : "In Progress"}</option>
              <option value="completed">{isLao ? "ສຳເລັດແລ້ວ" : "Completed"}</option>
            </select>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL REPORT DOCUMENT VIEW (Styled for both Screen & Print) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm print:shadow-none print:border-0 print:p-0 print:m-0 space-y-6">
        
        {/* OFFICIAL LAO NATIONAL HEADER */}
        <div className="text-center space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800 print:border-black">
          <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 print:text-black tracking-wide">
            ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
          </p>
          <p className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 print:text-black">
            ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
          </p>
          
          <div className="py-2 flex justify-center">
            <div className="w-14 h-14 print:w-16 print:h-16">
              <img
                src={emblemLogo}
                alt="Emblem"
                className="w-full h-full object-contain"
                onError={(e) => {
                  if (e.currentTarget.src !== emblemSvg) {
                    e.currentTarget.src = emblemSvg;
                  }
                }}
              />
            </div>
          </div>

          <div className="flex justify-between items-end text-xs font-bold text-slate-600 dark:text-slate-400 print:text-black pt-1 px-2">
            <div className="text-left space-y-0.5">
              <p>ແຂວງຫົວພັນ</p>
              <p className="font-black">ຫ້ອງວ່າການແຂວງ</p>
            </div>
            <div className="text-right space-y-0.5">
              <p>ເລກທີ: ........../ຫວຂ.ຫພ</p>
              <p>ຊຳເໜືອ, ວັນທີ: {new Date().toLocaleDateString("lo-LA")}</p>
            </div>
          </div>
        </div>

        {/* REPORT TITLE BANNER */}
        <div className="text-center space-y-1.5">
          <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white print:text-black uppercase tracking-tight">
            {isLao 
              ? `ບົດລາຍງານການເຄື່ອນໄຫວວຽກງານ ${periodTitle}` 
              : `OFFICIAL DUTY ACTIVITY REPORT - ${periodTitle}`}
          </h2>
          {targetUserObj && (
            <p className="text-xs sm:text-sm font-black text-indigo-600 dark:text-amber-400 print:text-black">
              {isLao ? `ບັນຊີຜູ້ໃຊ້: ທ່ານ ${(targetUserObj.name || "").replace(/^(ທ່ານ\s*)+/g, "").trim()} (${targetUserObj.dept})` : `User Account: ${targetUserObj.name} (${targetUserObj.dept})`}
            </p>
          )}
        </div>

        {/* EXECUTIVE KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 print:border-black text-center">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">{isLao ? "ຍອດລວມກິດຈະກຳວຽກ" : "Total Tasks"}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white print:text-black">{totalCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 print:border-black text-center">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 block mb-1">{isLao ? "ສຳເລັດແລ້ວ" : "Completed"}</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-300 print:text-black">{completedCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 print:border-black text-center">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 block mb-1">{isLao ? "ພວມຈັດຕັ້ງປະຕິບັດ" : "In Progress"}</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-300 print:text-black">{inProgressCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 print:border-black text-center">
            <span className="text-[11px] font-bold text-cyan-800 dark:text-cyan-400 block mb-1">{isLao ? "ອັດຕາຄວາມສຳເລັດ" : "Completion Rate"}</span>
            <span className="text-xl font-black text-cyan-600 dark:text-cyan-300 print:text-black">{completionRate}%</span>
          </div>
        </div>

        {/* DETAILED DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 border-y border-slate-200 dark:border-slate-700 print:border-black text-slate-800 dark:text-slate-200 print:text-black font-black">
                <th className="py-2.5 px-2 text-center w-10">#</th>
                <th className="py-2.5 px-3 min-w-[100px]">{isLao ? "ວັນທີ / ເວລາ" : "Date & Time"}</th>
                <th className="py-2.5 px-3 min-w-[180px]">{isLao ? "ຫົວຂໍ້ການເຄື່ອນໄຫວວຽກ" : "Activity Title"}</th>
                <th className="py-2.5 px-3 min-w-[130px]">{isLao ? "ຜູ້ຮັບຜິດຊອບ / ຄະນະ" : "Officer / Lead"}</th>
                <th className="py-2.5 px-3 min-w-[120px]">{isLao ? "ສະຖານທີ່" : "Location"}</th>
                <th className="py-2.5 px-2.5 text-center min-w-[90px]">{isLao ? "ປະເພດ" : "Category"}</th>
                <th className="py-2.5 px-2.5 text-center min-w-[85px]">{isLao ? "ສະຖານະ" : "Status"}</th>
                <th className="py-2.5 px-3 min-w-[160px]">{isLao ? "ຜົນການປະຕິບັດງານ" : "Outcome"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black">
              {reportActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {isLao ? "ບໍ່ພົບຂໍ້ມູນການເຄື່ອນໄຫວວຽກໃນໄລຍະເວລານີ້" : "No activity records found"}
                  </td>
                </tr>
              ) : (
                reportActivities.map((act, idx) => {
                  const cat = getCategoryLabel(act.category, isLao);
                  const stat = getStatusLabel(act.status, isLao);

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 print:hover:bg-transparent">
                      <td className="py-2.5 px-2 text-center font-bold text-slate-400 print:text-black">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black block">
                          {act.startDate}
                        </span>
                        <span className="text-[10px] text-slate-500 print:text-black block">
                          {act.startTime} - {act.endTime}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white print:text-black">
                        <div>{act.title}</div>
                        {act.description && (
                          <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400 print:text-black line-clamp-1 mt-0.5">
                            {act.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-black text-slate-800 dark:text-slate-200 print:text-black block">
                          {act.userName}
                        </span>
                        <span className="text-[10px] text-slate-500 print:text-black block">
                          {act.roleTitle || act.department}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 print:text-black">
                        {act.location}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${cat.bg} ${cat.color} ${cat.border} print:border-black print:text-black`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${stat.bg} ${stat.color} ${stat.border} print:border-black print:text-black`}>
                          {stat.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 print:text-black">
                        {act.outcome || (
                          <span className="text-slate-400 italic print:text-slate-600 text-[11px]">
                            {isLao ? "ຍັງບໍ່ທັນບັນທຶກ" : "Pending outcome"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* OFFICIAL SIGNATURE BLOCK FOR PRINT */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-800 dark:text-slate-200 print:text-black">
          <div className="space-y-16">
            <p className="font-black">{isLao ? "ຜູ້ສັງລວມບົດລາຍງານ" : "Prepared by"}</p>
            <p>..................................................</p>
          </div>

          <div className="space-y-16">
            <p className="font-black">{isLao ? "ຫົວໜ້າຫ້ອງວ່າການແຂວງຫົວພັນ" : "Head of Provincial Office"}</p>
            <p>..................................................</p>
          </div>
        </div>

      </div>

    </div>
  );
}
