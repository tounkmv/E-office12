import React, { useState } from "react";
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
  Award
} from "lucide-react";
import { CivilServant, AppLanguage } from "../types";
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
    window.print();
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

      {/* 2. FORMAL PRINTABLE REPORT PAPER */}
      <div 
        id="printable-civil-servant-report"
        className="bg-white text-slate-950 p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-md print:border-none print:shadow-none print:p-0 print:m-0 space-y-6"
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
              <p className="font-black text-sm text-slate-900 uppercase">ແຂວງຫົວພັນ</p>
              <p className="font-black text-base text-purple-900">ຫ້ອງວ່າການແຂວງຫົວພັນ</p>
              <p className="text-[11px] text-slate-500">ຂະແໜງຈັດຕັ້ງ ແລະ ພະນັກງານ</p>
            </div>
          </div>

          <div className="text-right text-xs space-y-0.5">
            <p className="font-semibold text-slate-600">ເລກທີ: ......./ຫວຂ.ຫພ</p>
            <p className="text-slate-500">ຊຳເໜືອ, ວັນທີ {todayStrLao}</p>
          </div>
        </div>

        {/* Big Report Title */}
        <div className="text-center py-2 space-y-1">
          <h2 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-tight">
            ໃບລາຍງານ ບັນຊີພະນັກງານ-ລັດຖະກອນ ປະຈຳການ
          </h2>
          <p className="text-xs font-semibold text-slate-600">
            (Civil Servant Roster - Houaphanh Provincial Governor Office)
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

        {/* Official Signatures Footer */}
        <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
          <div className="space-y-16">
            <p className="font-extrabold text-slate-800">ຫົວໜ້າຫ້ອງວ່າການແຂວງ</p>
            <p className="font-bold text-slate-900 underline">ທ່ານ ຄຳຕຸ່ນ ຄໍາມະວົງ</p>
          </div>

          <div className="space-y-16">
            <p className="font-extrabold text-slate-800">ຫົວໜ້າຂະແໜງຈັດຕັ້ງ ແລະ ພະນັກງານ</p>
            <p className="font-bold text-slate-900 underline">ທ່ານ ນາງ ດາວອນ ໄຊຍະວົງ</p>
          </div>

          <div className="space-y-16">
            <p className="font-extrabold text-slate-800">ຜູ້ສັງລວມບົດລາຍງານ</p>
            <p className="font-bold text-slate-900 underline">ທ່ານ ບຸນມີ ພົມມະສານ</p>
          </div>
        </div>

      </div>

    </div>
  );
}
