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
  ChevronUp,
  ArrowDownToLine,
  Layers,
  Award,
  Settings,
  Stamp,
  Upload,
  Trash2,
  Check,
  RotateCcw
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
import { printReportDocument } from "../lib/printHelper";
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

  // Official Lao Report Form Configurations (Model from ReportSystem)
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [provinceName, setProvinceName] = useState("ແຂວງຫົວພັນ");
  const [officeName, setOfficeName] = useState("ຫ້ອງວ່າການແຂວງ");
  const [docNumber, setDocNumber] = useState("112/ຫວຂ.ຫພ");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Signatories
  const [approverTitle, setApproverTitle] = useState("ຫົວໜ້າຫ້ອງວ່າການແຂວງ");
  const [approverName, setApproverName] = useState("");
  const [compilerTitle, setCompilerTitle] = useState("ຜູ້ສັງລວມບົດລາຍງານ");
  const [compilerName, setCompilerName] = useState("");

  // Seal & Stamp
  const [showSeal, setShowSeal] = useState(true);
  const [sealMode, setSealMode] = useState<"default" | "custom">("default");
  const [customSealUrl, setCustomSealUrl] = useState<string | null>(null);

  // Distribution Form (ບ່ອນນຳສົ່ງ)
  const [showDistribution, setShowDistribution] = useState(true);
  const [distributionText, setDistributionText] = useState(
    `- ທ່ານເຈົ້າແຂວງ (ເພື່ອລາຍງານ)\n- ຫ້ອງວ່າການແຂວງ (ເພື່ອຕິດຕາມ)\n- ບັນດາພະແນກການອ້ອມຂ້າງ (ເພື່ອຊາບ)\n- ເກັບມ້ຽນສຳເນົາ`
  );

  const handleSealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomSealUrl(event.target.result as string);
          setSealMode("custom");
          setShowSeal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formattedDocDate = useMemo(() => {
    const parts = docDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return docDate;
  }, [docDate]);

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
    printReportDocument(
      "leadership-print-sheet",
      isLao ? "ບົດລາຍງານການເຄື່ອນໄຫວວຽກການນຳ_ຫ້ອງວ່າການແຂວງ" : "Leadership_Activities_Report"
    );
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

      {/* CONFIGURATION & DISTRIBUTION FORM (print:hidden) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white">
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>{isLao ? "ຟອມປັບປຸງຮ່າງບົດລາຍງານ & ບ່ອນນຳສົ່ງ (Report Draft & Distribution Setup)" : "Report Draft & Distribution Setup"}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>{isConfigOpen ? (isLao ? "ຫຍໍ້ລົງ" : "Collapse") : (isLao ? "ຂະຫຍາຍຟອມ" : "Expand")}</span>
            {isConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isConfigOpen && (
          <div className="space-y-4 text-xs pt-1 animate-in fade-in duration-200">
            {/* Grid: Admin and signatory controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ອົງການຈັດຕັ້ງ" : "Office Name"}</label>
                <input
                  type="text"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ເລກທີເອກະສານ" : "Doc Number"}</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ລົງວັນທີ" : "Reference Date"}</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ມີອຳນາດອະນຸມັດ" : "Approver Title"}</label>
                <input
                  type="text"
                  value={approverTitle}
                  onChange={(e) => setApproverTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ມີອຳນາດອະນຸມັດ" : "Approver Name"}</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder={isLao ? "ປະວ່າງຫາກບໍ່ຕ້ອງການໃສ່ຊື່" : "Leave empty if not required"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ສັງລວມ/ບັນທຶກ" : "Compiler Title"}</label>
                <input
                  type="text"
                  value={compilerTitle}
                  onChange={(e) => setCompilerTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ສັງລວມ/ບັນທຶກ" : "Compiler Name"}</label>
                <input
                  type="text"
                  value={compilerName}
                  onChange={(e) => setCompilerName(e.target.value)}
                  placeholder={isLao ? "ປະວ່າງຫາກບໍ່ຕ້ອງການໃສ່ຊື່" : "Leave empty if not required"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Seal Toggle */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowSeal(!showSeal)}
                  className={`w-full p-2 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                    showSeal 
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold" 
                      : "border-slate-200 dark:border-slate-700 text-slate-500"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    <Stamp className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isLao ? "ກາປະທັບທາງການ" : "Official Stamp"}</span>
                  </span>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${showSeal ? "bg-indigo-600 text-white" : "bg-slate-300"}`}>
                    {showSeal && <Check className="w-3 h-3" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Sub-Section: Distribution List Form (ບ່ອນນຳສົ່ງ ໃຫ້ສ້າງເປັນຟອມ ເພື່ອສາມາດປັບປ່ຽນໄດ້) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800 dark:text-white text-xs">
                    {isLao ? "ຟອມປັບປຸງບ່ອນນຳສົ່ງ (Distribution List Form):" : "Distribution List Form:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDistribution(!showDistribution)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    {showDistribution ? (isLao ? "[ເຊື່ອງບ່ອນນຳສົ່ງ]" : "[Hide]") : (isLao ? "[ສະແດງບ່ອນນຳສົ່ງ]" : "[Show]")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDistributionText(`- ທ່ານເຈົ້າແຂວງ (ເພື່ອລາຍງານ)\n- ຫ້ອງວ່າການແຂວງ (ເພື່ອຕິດຕາມ)\n- ບັນດາພະແນກການອ້ອມຂ້າງ (ເພື່ອຊາບ)\n- ເກັບມ້ຽນສຳເນົາ`)}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isLao ? "ຄືນຄ່າມາດຕະຖານ" : "Reset Default"}</span>
                </button>
              </div>

              {showDistribution && (
                <>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400 font-semibold">{isLao ? "ເພີ່ມດ່ວນ:" : "Quick add:"}</span>
                    {[
                      { label: "- ທ່ານເຈົ້າແຂວງ", text: "- ທ່ານເຈົ້າແຂວງ (ເພື່ອລາຍງານ)" },
                      { label: "- ຫ້ອງວ່າການແຂວງ", text: "- ຫ້ອງວ່າການແຂວງ (ເພື່ອຕິດຕາມ)" },
                      { label: "- ບັນດາພະແນກການ", text: "- ບັນດາພະແນກການອ້ອມຂ້າງ (ເພື່ອຊາບ)" },
                      { label: "- ເກັບມ້ຽນສຳເນົາ", text: "- ເກັບມ້ຽນສຳເນົາ" }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!distributionText.includes(chip.text)) {
                            setDistributionText(prev => prev ? `${prev}\n${chip.text}` : chip.text);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        + {chip.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={distributionText}
                    onChange={(e) => setDistributionText(e.target.value)}
                    placeholder={isLao ? "ປ້ອນບັນຊີບ່ອນນຳສົ່ງ (ແຍກແຕ່ລະແຖວ)..." : "Type distribution list (line by line)..."}
                    className="w-full text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL REPORT DOCUMENT VIEW (Styled for both Screen & Print) */}
      {/* ========================================================================= */}
      <div 
        id="leadership-print-sheet"
        className="print-report-sheet bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm print:shadow-none print:border-0 print:p-0 print:m-0 space-y-6"
      >
        
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
              <p>{provinceName}</p>
              <p className="font-black text-sm text-slate-900 dark:text-white print:text-black">{officeName}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p>ເລກທີ: {docNumber}</p>
              <p>ຊຳເໜືອ, ລົງວັນທີ: {formattedDocDate}</p>
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

        {/* OFFICIAL SIGN-OFF BLOCK: (Approver on Left with seal, Compiler on Right, Distribution underneath - Modeled after ReportSystem) */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-xs font-sans">
          
          {/* Left Column: Approver with seal + Distribution underneath */}
          <div className="flex flex-col justify-between">
            <div className="text-center space-y-1">
              <p className="font-bold uppercase text-xs text-slate-950 dark:text-white print:text-black">{approverTitle}</p>
              
              {/* Space for Seal Stamp */}
              {showSeal ? (
                sealMode === "custom" && customSealUrl ? (
                  <div className="my-2 flex items-center justify-center min-h-[75px]">
                    <img
                      src={customSealUrl}
                      alt="Official Seal"
                      className="w-20 h-20 object-contain filter select-none"
                    />
                  </div>
                ) : (
                  <div className="relative my-2 flex items-center justify-center min-h-[75px] select-none">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-500/50 flex flex-col items-center justify-center p-1 text-center">
                      <span className="text-[6px] text-red-500 font-bold leading-none">{officeName}</span>
                      <span className="text-[7px] text-red-500 font-black leading-tight my-0.5">{provinceName}</span>
                      <span className="text-[5px] text-red-500">OFFICIAL SEAL</span>
                    </div>
                    <div className="absolute text-[7px] text-red-500 font-bold border border-red-500/30 px-1 py-0.5 rotate-[-12deg] bg-white/95 text-red-500">
                      ບ່ອນປະທັບຕາ
                    </div>
                  </div>
                )
              ) : (
                <div className="h-20" />
              )}

              <div className="pt-1 text-center w-full">
                <p className="font-bold text-slate-400">......................................................</p>
                {approverName && <p className="font-bold text-slate-900 dark:text-white print:text-black text-xs mt-1">{approverName}</p>}
              </div>
            </div>

            {/* Distribution List (ບ່ອນນຳສົ່ງ) Underneath Approver */}
            {showDistribution && (
              <div className="pt-4 mt-4 border-t border-dashed border-slate-300 dark:border-slate-700 print:border-black text-left">
                <span className="font-bold underline text-[11px] block uppercase text-slate-900 dark:text-white print:text-black">
                  ບ່ອນນຳສົ່ງ (Distribution List):
                </span>
                <div className="text-[10px] text-slate-700 dark:text-slate-300 print:text-black whitespace-pre-line leading-relaxed font-medium pl-1 mt-1">
                  {distributionText || (isLao ? "(ບໍ່ມີຂໍ້ມູນບ່ອນນຳສົ່ງ)" : "(No distribution text)")}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Report Compiler */}
          <div className="text-center flex flex-col items-center justify-between">
            <div className="space-y-1 w-full">
              <p className="font-bold uppercase text-xs text-slate-950 dark:text-white print:text-black">{compilerTitle}</p>
            </div>

            {/* Signature spacing matching standard official height */}
            <div className="min-h-[85px] flex items-center justify-center" />

            <div className="pt-1 text-center w-full">
              <p className="font-bold text-slate-400">......................................................</p>
              {compilerName && <p className="font-bold text-slate-900 dark:text-white print:text-black text-xs mt-1">{compilerName}</p>}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
