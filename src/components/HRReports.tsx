import React, { useState, useMemo } from "react";
import { 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Building2, 
  Download, 
  Filter, 
  Users, 
  CheckCircle2, 
  GraduationCap, 
  Calendar,
  Award,
  Settings,
  Stamp,
  Upload,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from "lucide-react";
import { CivilServant, AppLanguage } from "../types";
import { printReportDocument } from "../lib/printHelper";
import { PROVINCIAL_DEPARTMENTS, OFFICIAL_POSITIONS } from "../lib/hrHelper";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";

interface HRReportsProps {
  employees: CivilServant[];
  language: AppLanguage;
}

export default function HRReports({ employees, language }: HRReportsProps) {
  const isLao = language === "lo";

  // Filter criteria
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [degreeFilter, setDegreeFilter] = useState("all");
  const [theoryFilter, setTheoryFilter] = useState("all");

  // Official Lao Report Form Configurations (Model from ReportSystem)
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [provinceName, setProvinceName] = useState("ແຂວງຫົວພັນ");
  const [officeName, setOfficeName] = useState("ຫ້ອງວ່າການແຂວງ");
  const [docNumber, setDocNumber] = useState("110/ຫວຂ.ຫພ");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Signatories
  const [approverTitle, setApproverTitle] = useState("ຫົວໜ້າຫ້ອງວ່າການແຂວງ");
  const [approverName, setApproverName] = useState("");
  const [compilerTitle, setCompilerTitle] = useState("ຫົວໜ້າຂະແໜງຈັດຕັ້ງ ແລະ ພະນັກງານ");
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

  // Filtered staff list
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = q === "" ||
      emp.fullName.toLowerCase().includes(q) ||
      emp.staffCode.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.phone.includes(q);

    const matchDept = departmentFilter === "all" || emp.department === departmentFilter;
    const matchType = typeFilter === "all" || emp.type === typeFilter;
    const matchGender = genderFilter === "all" || emp.gender === genderFilter;
    const matchDegree = degreeFilter === "all" || (emp.educationDegree && emp.educationDegree.includes(degreeFilter));
    const matchTheory = theoryFilter === "all" || emp.politicalTheory === theoryFilter;

    return matchQuery && matchDept && matchType && matchGender && matchDegree && matchTheory;
  });

  // Summary counts for filtered list
  const filteredTotal = filteredEmployees.length;
  const filteredMale = filteredEmployees.filter(e => e.gender === "male").length;
  const filteredFemale = filteredEmployees.filter(e => e.gender === "female").length;
  const filteredPermanent = filteredEmployees.filter(e => e.type === "full").length;
  const filteredProbation = filteredEmployees.filter(e => e.type === "probation").length;

  const handlePrint = () => {
    printReportDocument(
      "printable-civil-servant-report",
      isLao ? "ບົດລາຍງານບັນຊີພະນັກງານລັດຖະກອນ_ຫ້ອງວ່າການແຂວງ" : "Civil_Servants_HR_Report"
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "ລຳດັບ",
      "ລະຫັດລັດຖະກອນ",
      "ຊື່ ແລະ ນາມສະກຸນ",
      "ເພດ",
      "ວັນເດືອນປີເກີດ",
      "ຕຳແໜ່ງ",
      "ພະແນກ/ຂະແໜງ",
      "ປະເພດ",
      "ຊັ້ນ/ຂັ້ນ",
      "ວັນເຂົ້າລັດ",
      "ວຸດທິການສຶກສາ",
      "ສາຂາ",
      "ທິດສະດີການເມືອງ",
      "ເບີໂທ"
    ];

    const rows = filteredEmployees.map((e, idx) => [
      idx + 1,
      e.staffCode,
      `"${e.fullName}"`,
      e.gender === "female" ? "ຍິງ" : "ຊາຍ",
      e.dateOfBirth,
      `"${e.position}"`,
      `"${e.department}"`,
      e.type === "full" ? "ລັດຖະກອນສົມບູນ" : e.type === "probation" ? "ທົດລອງງານ" : "ສັນຍາ",
      e.salaryGrade || "",
      e.dateJoinedState,
      `"${e.educationDegree}"`,
      `"${e.majorField || ""}"`,
      `"${e.politicalTheory || ""}"`,
      `"${e.phone}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
      [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Civil_Servants_Houaphanh_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStrLao = new Date().toLocaleDateString("lo-LA", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. FILTER & EXPORT ACTIONS (Hidden on print) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              <span>{isLao ? "ລະບົບລາຍງານບັນຊີພະນັກງານລັດຖະກອນ" : "Civil Servant Reporting System"}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLao ? "ຄົ້ນຫາ, ຄັດຕອງຕາມເງື່ອນໄຂ, ສົ່ງອອກ CSV ແລະ ພິມໃບລາຍງານທາງການ" : "Search, filter, export and print formal staff roster"}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-600" />
              <span>{isLao ? "ດາວໂຫຼດ Excel (CSV)" : "Export CSV"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isLao ? "ພິມໃບລາຍງານທາງການ" : "Print Official Report"}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
          
          {/* Keyword Search */}
          <div className="sm:col-span-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isLao ? "ຄົ້ນຫາຊື່, ລະຫັດ, ຕຳແໜ່ງ..." : "Search keyword..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-medium focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-medium"
            >
              <option value="all">{isLao ? "ທຸກຂະແໜງ" : "All Divisions"}</option>
              {PROVINCIAL_DEPARTMENTS.map((d, i) => (
                <option key={i} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-medium"
            >
              <option value="all">{isLao ? "ທຸກປະເພດ" : "All Types"}</option>
              <option value="full">{isLao ? "ລັດຖະກອນສົມບູນ" : "Permanent"}</option>
              <option value="probation">{isLao ? "ທົດລອງງານ" : "Probation"}</option>
              <option value="contract">{isLao ? "ສັນຍາ" : "Contract"}</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-medium"
            >
              <option value="all">{isLao ? "ທຸກເພດ" : "All Genders"}</option>
              <option value="female">{isLao ? "ຍິງ" : "Female"}</option>
              <option value="male">{isLao ? "ຊາຍ" : "Male"}</option>
            </select>
          </div>

          {/* Theory */}
          <div>
            <select
              value={theoryFilter}
              onChange={(e) => setTheoryFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-medium"
            >
              <option value="all">{isLao ? "ທິດສະດີທັງໝົດ" : "All Theory"}</option>
              <option value="ຊັ້ນສູງ">ຊັ້ນສູງ</option>
              <option value="ຊັ້ນກາງ">ຊັ້ນກາງ</option>
              <option value="ຊັ້ນຕົ້ນ">ຊັ້ນຕົ້ນ</option>
            </select>
          </div>

        </div>

        {/* Filter KPI Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold">
            {isLao ? `ລວມທັງໝົດ: ${filteredTotal} ທ່ານ` : `Total: ${filteredTotal}`}
          </span>
          <span className="px-3 py-1 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 font-bold">
            {isLao ? `ຍິງ: ${filteredFemale} ທ່ານ` : `Female: ${filteredFemale}`}
          </span>
          <span className="px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
            {isLao ? `ຊາຍ: ${filteredMale} ທ່ານ` : `Male: ${filteredMale}`}
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
            {isLao ? `ລັດຖະກອນສົມບູນ: ${filteredPermanent} ທ່ານ` : `Permanent: ${filteredPermanent}`}
          </span>
          {filteredProbation > 0 && (
            <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
              {isLao ? `ທົດລອງງານ: ${filteredProbation} ທ່ານ` : `Probation: ${filteredProbation}`}
            </span>
          )}
        </div>
      </div>

      {/* CONFIGURATION & DISTRIBUTION FORM (print:hidden) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white">
            <Settings className="w-4 h-4 text-purple-600" />
            <span>{isLao ? "ຟອມປັບປຸງຮ່າງບົດລາຍງານ & ບ່ອນນຳສົ່ງ (Report Draft & Distribution Setup)" : "Report Draft & Distribution Setup"}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer"
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
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ເລກທີເອກະສານ" : "Doc Number"}</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ລົງວັນທີ" : "Reference Date"}</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ມີອຳນາດອະນຸມັດ" : "Approver Title"}</label>
                <input
                  type="text"
                  value={approverTitle}
                  onChange={(e) => setApproverTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ມີອຳນາດອະນຸມັດ" : "Approver Name"}</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder={isLao ? "ປະວ່າງຫາກບໍ່ຕ້ອງການໃສ່ຊື່" : "Leave empty if not required"}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ສັງລວມ/ບັນທຶກ" : "Compiler Title"}</label>
                <input
                  type="text"
                  value={compilerTitle}
                  onChange={(e) => setCompilerTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ສັງລວມ/ບັນທຶກ" : "Compiler Name"}</label>
                <input
                  type="text"
                  value={compilerName}
                  onChange={(e) => setCompilerName(e.target.value)}
                  placeholder={isLao ? "ປະວ່າງຫາກບໍ່ຕ້ອງການໃສ່ຊື່" : "Leave empty if not required"}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Seal Toggle */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowSeal(!showSeal)}
                  className={`w-full p-2 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                    showSeal 
                      ? "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold" 
                      : "border-slate-200 dark:border-white/10 text-slate-500"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    <Stamp className="w-3.5 h-3.5 text-purple-600" />
                    <span>{isLao ? "ກາປະທັບທາງການ" : "Official Stamp"}</span>
                  </span>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${showSeal ? "bg-purple-600 text-white" : "bg-slate-300"}`}>
                    {showSeal && <Check className="w-3 h-3" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Sub-Section: Distribution List Form (ບ່ອນນຳສົ່ງ ໃຫ້ສ້າງເປັນຟອມ ເພື່ອສາມາດປັບປ່ຽນໄດ້) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800 dark:text-white text-xs">
                    {isLao ? "ຟອມປັບປຸງບ່ອນນຳສົ່ງ (Distribution List Form):" : "Distribution List Form:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDistribution(!showDistribution)}
                    className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
                  >
                    {showDistribution ? (isLao ? "[ເຊື່ອງບ່ອນນຳສົ່ງ]" : "[Hide]") : (isLao ? "[ສະແດງບ່ອນນຳສົ່ງ]" : "[Show]")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDistributionText(`- ທ່ານເຈົ້າແຂວງ (ເພື່ອລາຍງານ)\n- ຫ້ອງວ່າການແຂວງ (ເພື່ອຕິດຕາມ)\n- ຄະນະຈັດຕັ້ງແຂວງ (ເພື່ອຊາບ)\n- ເກັບມ້ຽນສຳເນົາ`)}
                  className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
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
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 transition-colors cursor-pointer"
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
                    className="w-full text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-none"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. FORMAL PRINTABLE REPORT PAPER */}
      <div 
        id="printable-civil-servant-report"
        className="print-report-sheet bg-white text-slate-950 p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-md print:border-none print:shadow-none print:p-0 print:m-0 space-y-6"
      >
        {/* National Motto & Header */}
        <div className="text-center space-y-1">
          <p className="font-extrabold text-sm sm:text-base tracking-wide">
            ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
          </p>
          <p className="font-bold text-xs sm:text-sm text-slate-700">
            ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
          </p>
          <p className="text-xs text-slate-400">--- 000 ---</p>
        </div>

        {/* Office and Document Title */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 shrink-0">
              <img src={emblemLogo} alt="Emblem" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = emblemSvg; }} />
            </div>
            <div>
              <p className="font-black text-sm text-slate-900 uppercase">{provinceName}</p>
              <p className="font-black text-base text-purple-900">{officeName}</p>
              <p className="text-[11px] text-slate-500">ຂະແໜງຈັດຕັ້ງ ແລະ ພະນັກງານ</p>
            </div>
          </div>

          <div className="text-right text-xs space-y-0.5">
            <p className="font-semibold text-slate-600">ເລກທີ: {docNumber}</p>
            <p className="text-slate-500">ຊຳເໜືອ, ລົງວັນທີ: {formattedDocDate}</p>
          </div>
        </div>

        {/* Big Report Title */}
        <div className="text-center py-2 space-y-1">
          <h2 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-tight">
            ໃບລາຍງານ ບັນຊີພະນັກງານ-ລັດຖະກອນ ປະຈຳການ
          </h2>
          <p className="text-xs font-semibold text-slate-600">
            {isLao ? `(ບັນຊີລັດຖະກອນ • ${officeName})` : "(Civil Servant Roster - Provincial Office)"}
          </p>
        </div>

        {/* Official Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-800 border-b border-slate-300">
                <th className="py-2.5 px-2 border-r border-slate-300 text-center w-10">ລ/ດ</th>
                <th className="py-2.5 px-2 border-r border-slate-300 text-center w-14">ຮູບ 4x6</th>
                <th className="py-2.5 px-2 border-r border-slate-300">ລະຫັດ</th>
                <th className="py-2.5 px-2 border-r border-slate-300">ຊື່ ແລະ ນາມສະກຸນ</th>
                <th className="py-2.5 px-2 border-r border-slate-300 text-center w-12">ເພດ</th>
                <th className="py-2.5 px-2 border-r border-slate-300">ຕຳແໜ່ງ</th>
                <th className="py-2.5 px-2 border-r border-slate-300">ພະແນກ / ຂະແໜງການ</th>
                <th className="py-2.5 px-2 border-r border-slate-300 text-center">ຊັ້ນ/ຂັ້ນ</th>
                <th className="py-2.5 px-2 border-r border-slate-300">ວຸດທິການສຶກສາ</th>
                <th className="py-2.5 px-2 text-center">ເບີໂທລະສັບ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEmployees.map((emp, idx) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="py-2 px-2 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                  <td className="py-1.5 px-1.5 text-center border-r border-slate-200">
                    <div className="w-9 h-12 mx-auto rounded overflow-hidden bg-slate-900 border border-slate-300">
                      <img src={emp.officialPhotoUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="py-2 px-2 font-black text-purple-900 border-r border-slate-200 whitespace-nowrap">{emp.staffCode}</td>
                  <td className="py-2 px-2 font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">{emp.fullName}</td>
                  <td className="py-2 px-2 text-center border-r border-slate-200 font-semibold">{emp.gender === "female" ? "ຍິງ" : "ຊາຍ"}</td>
                  <td className="py-2 px-2 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">{emp.position}</td>
                  <td className="py-2 px-2 text-slate-700 border-r border-slate-200">{emp.department}</td>
                  <td className="py-2 px-2 text-center font-extrabold text-amber-800 border-r border-slate-200 whitespace-nowrap">{emp.salaryGrade || "-"}</td>
                  <td className="py-2 px-2 text-slate-700 border-r border-slate-200">{emp.educationDegree}</td>
                  <td className="py-2 px-2 text-center font-bold text-slate-800 whitespace-nowrap">{emp.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistical Summary Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-4 font-semibold text-slate-700">
          <span>ສັງລວມທັງໝົດ: <b>{filteredTotal}</b> ທ່ານ (ຍິງ: <b>{filteredFemale}</b>, ຊາຍ: <b>{filteredMale}</b>)</span>
          <span>ລັດຖະກອນສົມບູນ: <b>{filteredPermanent}</b> ທ່ານ | ທົດລອງງານ: <b>{filteredProbation}</b> ທ່ານ</span>
        </div>

        {/* OFFICIAL SIGN-OFF BLOCK: (Approver on Left with seal, Compiler on Right, Distribution underneath - Modeled after ReportSystem) */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-xs font-sans">
          
          {/* Left Column: Approver with seal + Distribution underneath */}
          <div className="flex flex-col justify-between">
            <div className="text-center space-y-1">
              <p className="font-bold uppercase text-xs text-slate-950">{approverTitle}</p>
              
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
                    <div className="absolute text-[7px] text-red-500 font-bold border border-red-500/30 px-1 py-0.5 rotate-[-12deg] bg-white/95">
                      ບ່ອນປະທັບຕາ
                    </div>
                  </div>
                )
              ) : (
                <div className="h-20" />
              )}

              <div className="pt-1 text-center w-full">
                <p className="font-bold text-slate-400">......................................................</p>
                {approverName && <p className="font-bold text-slate-900 text-xs mt-1">{approverName}</p>}
              </div>
            </div>

            {/* Distribution List (ບ່ອນນຳສົ່ງ) Underneath Approver */}
            {showDistribution && (
              <div className="pt-4 mt-4 border-t border-dashed border-slate-300 text-left">
                <span className="font-bold underline text-[11px] block uppercase text-slate-900">
                  ບ່ອນນຳສົ່ງ (Distribution List):
                </span>
                <div className="text-[10px] text-slate-700 whitespace-pre-line leading-relaxed font-medium pl-1 mt-1">
                  {distributionText || (isLao ? "(ບໍ່ມີຂໍ້ມູນບ່ອນນຳສົ່ງ)" : "(No distribution text)")}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Report Compiler */}
          <div className="text-center flex flex-col items-center justify-between">
            <div className="space-y-1 w-full">
              <p className="font-bold uppercase text-xs text-slate-950">{compilerTitle}</p>
            </div>

            {/* Signature spacing matching standard official height */}
            <div className="min-h-[85px] flex items-center justify-center" />

            <div className="pt-1 text-center w-full">
              <p className="font-bold text-slate-400">......................................................</p>
              {compilerName && <p className="font-bold text-slate-900 text-xs mt-1">{compilerName}</p>}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
