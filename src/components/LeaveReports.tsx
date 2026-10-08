import React, { useState, useMemo } from "react";
import { 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Building2, 
  Filter, 
  Users, 
  CheckCircle2, 
  Calendar, 
  Award, 
  Clock, 
  Eye, 
  X, 
  Download,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Settings,
  Stamp,
  Upload,
  Trash2,
  Check,
  RotateCcw
} from "lucide-react";
import { LeaveRequest, CivilServant, AppLanguage, LeaveType } from "../types";
import { printReportDocument } from "../lib/printHelper";
import { ANNUAL_LEAVE_QUOTA, calculateStaffLeaveBalance } from "../lib/leaveHelper";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";

interface LeaveReportsProps {
  leaves: LeaveRequest[];
  employees: CivilServant[];
  language: AppLanguage;
}

export default function LeaveReports({ leaves, employees, language }: LeaveReportsProps) {
  const isLao = language === "lo";
  const currentYear = new Date().getFullYear();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedStaffHistory, setSelectedStaffHistory] = useState<CivilServant | null>(null);

  // Official Lao Report Form Configurations (Model from ReportSystem)
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [provinceName, setProvinceName] = useState("ແຂວງຫົວພັນ");
  const [officeName, setOfficeName] = useState("ຫ້ອງວ່າການແຂວງ");
  const [docNumber, setDocNumber] = useState("111/ຫວຂ.ຫພ");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Signatories
  const [approverTitle, setApproverTitle] = useState("ຫົວໜ້າຫ້ອງວ່າການແຂວງ");
  const [approverName, setApproverName] = useState("");
  const [compilerTitle, setCompilerTitle] = useState("ຜູ້ສະຫຼຸບ ແລະ ບັນທຶກລາຍງານ");
  const [compilerName, setCompilerName] = useState("");

  // Seal & Stamp
  const [showSeal, setShowSeal] = useState(true);
  const [sealMode, setSealMode] = useState<"default" | "custom">("default");
  const [customSealUrl, setCustomSealUrl] = useState<string | null>(null);

  // Distribution Form (ບ່ອນນຳສົ່ງ)
  const [showDistribution, setShowDistribution] = useState(true);
  const [distributionText, setDistributionText] = useState(
    `- ທ່ານເຈົ້າແຂວງ (ເພື່ອລາຍງານ)\n- ຫ້ອງວ່າການແຂວງ (ເພື່ອຕິດຕາມ)\n- ຄະນະຈັດຕັ້ງແຂວງ (ເພື່ອຊາບ)\n- ເກັບມ້ຽນສຳເນົາ`
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

  // Departments list
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Aggregate balance for each employee
  const staffBalances = useMemo(() => {
    return employees.map(emp => {
      const bal = calculateStaffLeaveBalance(emp.id, leaves, selectedYear);
      const staffRequests = leaves.filter(l => 
        l.staffId === emp.id && 
        (l.year === selectedYear || new Date(l.startDate).getFullYear() === selectedYear)
      );

      return {
        employee: emp,
        balance: bal,
        totalRequests: staffRequests.length,
        approvedRequests: staffRequests.filter(r => r.status === "approved").length,
        requests: staffRequests
      };
    });
  }, [employees, leaves, selectedYear]);

  // Filtered data based on search and department
  const filteredData = useMemo(() => {
    return staffBalances.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = q === "" ||
        item.employee.fullName.toLowerCase().includes(q) ||
        item.employee.staffCode.toLowerCase().includes(q) ||
        item.employee.position.toLowerCase().includes(q) ||
        item.employee.department.toLowerCase().includes(q);

      const matchDept = departmentFilter === "all" || item.employee.department === departmentFilter;

      return matchQuery && matchDept;
    });
  }, [staffBalances, searchQuery, departmentFilter]);

  // Overall Statistics
  const totalEmployeesCount = filteredData.length;
  const totalDaysTaken = filteredData.reduce((sum, item) => sum + item.balance.approvedDays, 0);
  const totalRemainingDays = filteredData.reduce((sum, item) => sum + item.balance.remainingDays, 0);
  const quotaUsedFullyCount = filteredData.filter(item => item.balance.remainingDays <= 0).length;

  // Print Report Handler
  const handlePrint = () => {
    printReportDocument(
      "leave-print-sheet",
      isLao ? "ບົດລາຍງານການລາພັກ_ຫ້ອງວ່າການແຂວງ" : "Staff_Leave_Report"
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. TOP HEADER & ACTIONS (Hidden in Print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-black">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isLao ? "ລະບົບລາຍງານສະຖິຕິການລາພັກ" : "Leave Quota Analytics"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isLao ? "ບົດລາຍງານການລາພັກ ແລະ ໂຄຕ້າ 15 ວັນຂອງພະນັກງານ" : "Staff Leave Quota & History Report"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isLao 
              ? "ສັງລວມຂໍ້ມູນການລາພັກຂອງພະນັກງານລັດຖະກອນ, ຈຳນວນວັນທີ່ລາພັກໄປແລ້ວ, ວັນທີ່ຍັງເຫຼືອ ແລະ ບັນຊີຜູ້ອະນຸມັດ."
              : "Summary of statutory 15-day annual leave balances, used days, and authorized approvers."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isLao ? "ພິມບົດລາຍງານທາງການ" : "Print Report"}</span>
          </button>
        </div>
      </div>

      {/* 2. STATS KPI OVERVIEW (Hidden in Print) */}
      <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
            {isLao ? "ຈຳນວນພະນັກງານໃນບົດລາຍງານ" : "Staff Count"}
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {totalEmployeesCount} <span className="text-xs font-bold text-slate-400">{isLao ? "ທ່ານ" : "staff"}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{isLao ? `ສົກປີ ${selectedYear}` : `Year ${selectedYear}`}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-sm">
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
            {isLao ? "ລາພັກໄປແລ້ວລວມທັງໝົດ" : "Total Days Used"}
          </span>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {totalDaysTaken} <span className="text-xs font-bold text-amber-500/80">{isLao ? "ວັນລັດຖະການ" : "days"}</span>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">{isLao ? "ລວມທຸກຂະແໜງການ" : "Across all departments"}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/40 shadow-sm">
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
            {isLao ? "ວັນລາພັກທີ່ຍັງເຫຼືອລວມ" : "Total Remaining"}
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {totalRemainingDays} <span className="text-xs font-bold text-emerald-500/80">{isLao ? "ວັນ" : "days"}</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">{isLao ? "ໂຄຕ້າທີ່ຍັງສາມາດຂໍໄດ້" : "Available balance"}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase text-teal-600 tracking-wider">
            {isLao ? "ໂຄຕ້າຕໍ່ທ່ານ" : "Quota Cap"}
          </span>
          <div className="mt-2 text-2xl font-black text-slate-800 dark:text-white">
            15 <span className="text-xs font-bold text-teal-600">{isLao ? "ວັນ/ປີ" : "days/yr"}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{isLao ? "ກົດໝາຍລັດຖະກອນ" : "Statutory allocation"}</p>
        </div>
      </div>

      {/* 3. FILTER BAR (Hidden in Print) */}
      <div className="print:hidden p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isLao ? "ຄົ້ນຫາຕາມຊື່, ລະຫັດລັດຖະກອນ, ຕຳແໜ່ງ, ພະແນກ..." : "Search staff name, code, department..."}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-64">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">{isLao ? "ທຸກພະແນກ / ຂະແໜງການ" : "All Departments"}</option>
            {departmentsList.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div className="w-full md:w-36">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value={currentYear}>{isLao ? `ສົກປີ ${currentYear}` : `Year ${currentYear}`}</option>
            <option value={currentYear - 1}>{isLao ? `ສົກປີ ${currentYear - 1}` : `Year ${currentYear - 1}`}</option>
          </select>
        </div>

      </div>

      {/* CONFIGURATION & DISTRIBUTION FORM (print:hidden) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>{isLao ? "ຟອມປັບປຸງຮ່າງບົດລາຍງານ & ບ່ອນນຳສົ່ງ (Report Draft & Distribution Setup)" : "Report Draft & Distribution Setup"}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ເລກທີເອກະສານ" : "Doc Number"}</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ລົງວັນທີ" : "Reference Date"}</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ມີອຳນາດອະນຸມັດ" : "Approver Title"}</label>
                <input
                  type="text"
                  value={approverTitle}
                  onChange={(e) => setApproverTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ມີອຳນາດອະນຸມັດ" : "Approver Name"}</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder={isLao ? "ປະວ່າງຫາກບໍ່ຕ້ອງການໃສ່ຊື່" : "Leave empty if not required"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ສັງລວມ/ບັນທຶກ" : "Compiler Title"}</label>
                <input
                  type="text"
                  value={compilerTitle}
                  onChange={(e) => setCompilerTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ສັງລວມ/ບັນທຶກ" : "Compiler Name"}</label>
                <input
                  type="text"
                  value={compilerName}
                  onChange={(e) => setCompilerName(e.target.value)}
                  placeholder={isLao ? "ປະວ່າງຫາກບໍ່ຕ້ອງການໃສ່ຊື່" : "Leave empty if not required"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Seal Toggle */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowSeal(!showSeal)}
                  className={`w-full p-2 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                    showSeal 
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold" 
                      : "border-slate-200 dark:border-slate-700 text-slate-500"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    <Stamp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isLao ? "ກາປະທັບທາງການ" : "Official Stamp"}</span>
                  </span>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${showSeal ? "bg-emerald-600 text-white" : "bg-slate-300"}`}>
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
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    {showDistribution ? (isLao ? "[ເຊື່ອງບ່ອນນຳສົ່ງ]" : "[Hide]") : (isLao ? "[ສະແດງບ່ອນນຳສົ່ງ]" : "[Show]")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDistributionText(`- ທ່ານເຈົ້າແຂວງ (ເພື່ອລາຍງານ)\n- ຫ້ອງວ່າການແຂວງ (ເພື່ອຕິດຕາມ)\n- ຄະນະຈັດຕັ້ງແຂວງ (ເພື່ອຊາບ)\n- ເກັບມ້ຽນສຳເນົາ`)}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
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
                      { label: "- ຄະນະຈັດຕັ້ງແຂວງ", text: "- ຄະນະຈັດຕັ້ງແຂວງ (ເພື່ອຊາບ)" },
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
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 transition-colors cursor-pointer"
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
                    className="w-full text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-none"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. PRINTABLE REPORT DOCUMENT CONTAINER */}
      <div 
        id="leave-print-sheet"
        className="print-report-sheet p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6"
      >
        
        {/* OFFICIAL GOVERNMENT HEADER (VISIBLE IN PRINT & VIEW) */}
        <div className="text-center space-y-2 border-b-2 border-slate-900 pb-5">
          <div className="w-16 h-16 mx-auto mb-2">
            <img
              src={emblemLogo}
              alt="National Emblem"
              className="w-full h-full object-contain mx-auto"
              onError={(e) => {
                if (e.currentTarget.src !== emblemSvg) {
                  e.currentTarget.src = emblemSvg;
                }
              }}
            />
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
          </p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
          </p>
          <div className="w-24 h-0.5 bg-slate-900 mx-auto my-1" />

          {/* Administrative details */}
          <div className="flex justify-between items-end text-xs font-bold pt-2 px-1">
            <div className="text-left space-y-0.5">
              <p className="text-slate-800 dark:text-slate-200">{provinceName}</p>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">{officeName}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-emerald-700 dark:text-emerald-400 font-extrabold">ເລກທີ: {docNumber}</p>
              <p className="text-slate-700 dark:text-slate-300">ຊຳເໜືອ, ລົງວັນທີ: {formattedDocDate}</p>
            </div>
          </div>

          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white pt-2">
            {isLao 
              ? `ບົດລາຍງານການລາພັກ ແລະ ໂຄຕ້າ 15 ວັນຂອງພະນັກງານລັດຖະກອນ ປະຈຳສົກປີ ${selectedYear}`
              : `Official Staff Leave Quota Roster & Utilization Report - Year ${selectedYear}`}
          </h1>
          <p className="text-[11px] text-slate-500">
            {isLao ? `(ສະຫຼຸບການລາພັກ • ${officeName})` : `(Staff Leave Quota Summary • ${officeName})`}
          </p>
        </div>

        {/* REPORT TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                <th className="py-3 px-3 font-black text-center w-12">#</th>
                <th className="py-3 px-3 font-black w-16 text-center">{isLao ? "ຮູບ 4x6" : "Photo"}</th>
                <th className="py-3 px-3 font-black">{isLao ? "ລະຫັດ" : "Code"}</th>
                <th className="py-3 px-3 font-black">{isLao ? "ຊື່ ແລະ ນາມສະກຸນ" : "Full Name"}</th>
                <th className="py-3 px-3 font-black">{isLao ? "ຕຳແໜ່ງ & ພະແນກ" : "Position & Dept"}</th>
                <th className="py-3 px-3 font-black text-center">{isLao ? "ໂຄຕ້າທັງໝົດ" : "Quota"}</th>
                <th className="py-3 px-3 font-black text-center text-amber-700 dark:text-amber-400">
                  {isLao ? "ລາພັກໄປແລ້ວ" : "Days Used"}
                </th>
                <th className="py-3 px-3 font-black text-center text-emerald-700 dark:text-emerald-400">
                  {isLao ? "ຍັງເຫຼືອ" : "Remaining"}
                </th>
                <th className="py-3 px-3 font-black w-28 text-center">{isLao ? "ອັດຕາການໃຊ້" : "Usage"}</th>
                <th className="py-3 px-3 font-black text-center print:hidden">{isLao ? "ປະຫວັດ" : "History"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-bold">
                    {isLao ? "ບໍ່ພົບຂໍ້ມູນຕາມເງື່ອນໄຂການຄົ້ນຫາ" : "No records found matching search"}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const percentUsed = Math.min(100, Math.round((item.balance.approvedDays / ANNUAL_LEAVE_QUOTA) * 100));
                  return (
                    <tr 
                      key={item.employee.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-500">
                        {index + 1}
                      </td>

                      {/* Photo 4*6 */}
                      <td className="py-2 px-3 text-center">
                        <div className="w-10 h-13 mx-auto rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 shadow-2xs">
                          {item.employee.officialPhotoUrl ? (
                            <img
                              src={item.employee.officialPhotoUrl}
                              alt={item.employee.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400">
                              4x6
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                        {item.employee.staffCode}
                      </td>

                      <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                        {item.employee.fullName}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        <div className="font-bold">{item.employee.position}</div>
                        <div className="text-[10px] text-slate-400">{item.employee.department}</div>
                      </td>

                      {/* Quota Total */}
                      <td className="py-3 px-3 text-center font-black text-slate-700 dark:text-slate-300">
                        15 {isLao ? "ວັນ" : "d"}
                      </td>

                      {/* Days Used */}
                      <td className="py-3 px-3 text-center font-black text-amber-600 dark:text-amber-400 text-sm">
                        {item.balance.approvedDays} {isLao ? "ວັນ" : "d"}
                      </td>

                      {/* Days Remaining */}
                      <td className="py-3 px-3 text-center font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {item.balance.remainingDays} {isLao ? "ວັນ" : "d"}
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>{percentUsed}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percentUsed >= 100 
                                  ? "bg-rose-500" 
                                  : percentUsed > 60 
                                  ? "bg-amber-500" 
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action Button: View individual history modal */}
                      <td className="py-3 px-3 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedStaffHistory(item.employee)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isLao ? "ກວດສອບ" : "View"}</span>
                        </button>
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
              <p className="font-bold uppercase text-xs text-slate-950 dark:text-white">{approverTitle}</p>
              
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
                {approverName && <p className="font-bold text-slate-900 dark:text-white text-xs mt-1">{approverName}</p>}
              </div>
            </div>

            {/* Distribution List (ບ່ອນນຳສົ່ງ) Underneath Approver */}
            {showDistribution && (
              <div className="pt-4 mt-4 border-t border-dashed border-slate-300 dark:border-slate-700 text-left">
                <span className="font-bold underline text-[11px] block uppercase text-slate-900 dark:text-white">
                  ບ່ອນນຳສົ່ງ (Distribution List):
                </span>
                <div className="text-[10px] text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium pl-1 mt-1">
                  {distributionText || (isLao ? "(ບໍ່ມີຂໍ້ມູນບ່ອນນຳສົ່ງ)" : "(No distribution text)")}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Report Compiler */}
          <div className="text-center flex flex-col items-center justify-between">
            <div className="space-y-1 w-full">
              <p className="font-bold uppercase text-xs text-slate-950 dark:text-white">{compilerTitle}</p>
            </div>

            {/* Signature spacing matching standard official height */}
            <div className="min-h-[85px] flex items-center justify-center" />

            <div className="pt-1 text-center w-full">
              <p className="font-bold text-slate-400">......................................................</p>
              {compilerName && <p className="font-bold text-slate-900 dark:text-white text-xs mt-1">{compilerName}</p>}
            </div>
          </div>

        </div>

      </div>

      {/* 5. INDIVIDUAL LEAVE HISTORY MODAL */}
      {selectedStaffHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-18 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm shrink-0">
                  {selectedStaffHistory.officialPhotoUrl ? (
                    <img
                      src={selectedStaffHistory.officialPhotoUrl}
                      alt={selectedStaffHistory.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-xs">
                      4x6
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedStaffHistory.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStaffHistory.staffCode} • {selectedStaffHistory.position}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedStaffHistory.department}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStaffHistory(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Individual Quota Summary */}
            {(() => {
              const b = calculateStaffLeaveBalance(selectedStaffHistory.id, leaves, selectedYear);
              const historyList = leaves.filter(l => 
                l.staffId === selectedStaffHistory.id && 
                (l.year === selectedYear || new Date(l.startDate).getFullYear() === selectedYear)
              );

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{isLao ? "ໂຄຕ້າທັງໝົດ" : "Quota"}</span>
                      <p className="text-xl font-black text-slate-800 dark:text-white mt-1">15 ວັນ</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] text-amber-700 font-bold uppercase">{isLao ? "ລາພັກໄປແລ້ວ" : "Days Used"}</span>
                      <p className="text-xl font-black text-amber-600 mt-1">{b.approvedDays} ວັນ</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase">{isLao ? "ຍັງເຫຼືອ" : "Remaining"}</span>
                      <p className="text-xl font-black text-emerald-600 mt-1">{b.remainingDays} ວັນ</p>
                    </div>
                  </div>

                  {/* History Items with Approver Account Stamps */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {isLao ? `ລາຍການລາພັກທັງໝົດໃນສົກປີ ${selectedYear}:` : `Leave Requests in ${selectedYear}:`}
                    </h4>

                    {historyList.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-400 font-bold">
                        {isLao ? "ບໍ່ມີປະຫວັດການຂໍລາພັກໃນປີນີ້" : "No leave history for this year"}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {historyList.map(item => (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 dark:text-white text-sm">
                                {item.title}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                item.status === "approved" ? "bg-emerald-100 text-emerald-700 border border-emerald-300" :
                                item.status === "rejected" ? "bg-rose-100 text-rose-700 border border-rose-300" :
                                "bg-amber-100 text-amber-700 border border-amber-300"
                              }`}>
                                {item.status === "approved" ? "ອະນຸມັດແລ້ວ" : item.status === "rejected" ? "ປະຕິເສດ" : "ລໍຖ້າອະນຸມັດ"}
                              </span>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300">
                              🗓️ <b>{isLao ? "ກຳນົດວັນທີ:" : "Dates:"}</b> {item.startDate} ຫາ {item.endDate} ({item.workingDaysCount} ວັນລັດຖະການ)
                            </p>

                            <p className="text-slate-600 dark:text-slate-300">
                              📝 <b>{isLao ? "ເຫດຜົນ:" : "Reason:"}</b> {item.reason}
                            </p>

                            {/* Approver Audit Stamp */}
                            {item.status === "approved" && item.approvedByName && (
                              <div className="p-2.5 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] space-y-0.5">
                                <div className="font-black flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{isLao ? "ບັນຊີຜູ້ອະນຸມັດ:" : "Approved By:"} {item.approvedByName}</span>
                                </div>
                                <div className="text-[10px] text-emerald-700/80">
                                  {item.approvedByRole} • {item.approvedAt ? new Date(item.approvedAt).toLocaleString() : ""}
                                </div>
                                {item.approvalRemarks && (
                                  <div className="italic text-[10px]">
                                    "{item.approvalRemarks}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedStaffHistory(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                {isLao ? "ປິດໜ້າຕ່າງ" : "Close"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
