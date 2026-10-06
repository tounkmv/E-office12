import React from "react";
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  Building2, 
  Award, 
  Plus, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  Briefcase,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  Sparkles,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import { CivilServant, AppLanguage } from "../types";
import { motion } from "motion/react";

interface HRDashboardProps {
  employees: CivilServant[];
  language: AppLanguage;
  userRole: string;
  onNavigateToDirectory: () => void;
  onNavigateToReports: () => void;
  onOpenAddModal: () => void;
}

export default function HRDashboard({
  employees,
  language,
  userRole,
  onNavigateToDirectory,
  onNavigateToReports,
  onOpenAddModal
}: HRDashboardProps) {
  const isLao = language === "lo";

  // Statistical calculations
  const totalStaff = employees.length;
  const fullStaff = employees.filter(e => e.type === "full").length;
  const probationStaff = employees.filter(e => e.type === "probation").length;
  const contractStaff = employees.filter(e => e.type === "contract" || e.type === "assigned").length;
  const maleCount = employees.filter(e => e.gender === "male").length;
  const femaleCount = employees.filter(e => e.gender === "female").length;
  const femalePercentage = totalStaff > 0 ? Math.round((femaleCount / totalStaff) * 100) : 0;
  const malePercentage = totalStaff > 0 ? 100 - femalePercentage : 0;

  // Degrees breakdown
  const masterCount = employees.filter(e => e.educationDegree?.includes("ປະລິນຍາໂທ") || e.educationDegree?.includes("Master")).length;
  const bachelorCount = employees.filter(e => e.educationDegree?.includes("ປະລິນຍາຕີ") || e.educationDegree?.includes("Bachelor")).length;
  const otherDegreeCount = totalStaff - (masterCount + bachelorCount);

  // High political theory
  const highTheoryCount = employees.filter(e => e.politicalTheory === "ຊັ້ນສູງ").length;

  // Department breakdown
  const deptCounts: Record<string, number> = {};
  employees.forEach(e => {
    const dept = e.department || (isLao ? "ອື່ນໆ" : "Other");
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. TOP HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-500/20 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 backdrop-blur-md border border-purple-400/30 text-xs font-black text-purple-300 shadow-sm">
              <Users className="w-3.5 h-3.5 text-purple-300" />
              <span>{isLao ? "ລະບົບຈັດການບັນຊີພະນັກງານ • ຫ້ອງວ່າການແຂວງຫົວພັນ" : "Civil Servant Directory • Houaphanh Provincial Office"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{isLao ? "ພາບລວມບັນຊີພະນັກງານລັດຖະກອນ" : "Staff Directory Overview"}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 font-extrabold hidden sm:inline-block">
                {totalStaff} {isLao ? "ທ່ານ" : "Staff"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              {isLao 
                ? "ຄຸ້ມຄອງຂໍ້ມູນຊີວະປະຫວັດ, ຮູບຖ່າຍທາງການ 4x6, ຊັ້ນ-ຂັ້ນເງິນເດືອນ, ລະດັບການສຶກສາ, ຕຳແໜ່ງ ແລະ ສັງລວມບົດລາຍງານພະນັກງານລັດຖະກອນທົ່ວອົງກອນ."
                : "Manage civil servant biographical profiles, official 4x6 photographs, salary grades, educational credentials, and organizational staff roster."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {userRole === "admin" && (
              <button
                type="button"
                id="btn-add-employee-hero"
                onClick={onOpenAddModal}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isLao ? "ເພີ່ມບັນຊີພະນັກງານໃໝ່" : "Add New Staff"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToReports}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-300" />
              <span>{isLao ? "ບົດລາຍງານ & ພິມເອກະສານ" : "Reports & Print"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total Staff */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isLao ? "ພະນັກງານທັງໝົດ" : "Total Staff"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{totalStaff}</span>
            <span className="text-xs font-bold text-slate-400">{isLao ? "ທ່ານ" : "persons"}</span>
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
            {isLao ? "ບັນທຶກໃນລະບົບຫ້ອງວ່າການ" : "Registered civil servants"}
          </p>
        </div>

        {/* Permanent vs Probation */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isLao ? "ລັດຖະກອນສົມບູນ" : "Permanent Staff"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{fullStaff}</span>
            <span className="text-xs font-bold text-slate-400">/ {totalStaff} {isLao ? "ທ່ານ" : ""}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {isLao ? `ທົດລອງງານ ${probationStaff} ທ່ານ • ສັນຍາ ${contractStaff} ທ່ານ` : `Probation: ${probationStaff}, Contract: ${contractStaff}`}
          </p>
        </div>

        {/* Gender Breakdown */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-fuchsia-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isLao ? "ອັດຕາສ່ວນ ຍິງ-ຊາຍ" : "Gender Ratio"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-xl sm:text-2xl font-black text-fuchsia-600">{femaleCount}</span>
              <span className="text-[10px] font-bold text-slate-400 block">{isLao ? "ຍິງ" : "Female"} ({femalePercentage}%)</span>
            </div>
            <span className="text-slate-300 font-bold">•</span>
            <div>
              <span className="text-xl sm:text-2xl font-black text-indigo-600">{maleCount}</span>
              <span className="text-[10px] font-bold text-slate-400 block">{isLao ? "ຊາຍ" : "Male"} ({malePercentage}%)</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden flex">
            <div style={{ width: `${femalePercentage}%` }} className="bg-fuchsia-500 h-full" />
            <div style={{ width: `${malePercentage}%` }} className="bg-indigo-500 h-full" />
          </div>
        </div>

        {/* Education & Political Theory */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isLao ? "ວຸດທິການສຶກສາ" : "Credentials"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{bachelorCount + masterCount}</span>
            <span className="text-xs font-bold text-slate-400">{isLao ? "ປ.ຕີ - ປ.ໂທ" : "Higher Edu"}</span>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
            {isLao ? `ທິດສະດີຊັ້ນສູງ: ${highTheoryCount} ທ່ານ` : `High Political Theory: ${highTheoryCount}`}
          </p>
        </div>

      </div>

      {/* 3. DEPARTMENT BREAKDOWN & RECENT STAFF HIGHLIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Distribution */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>{isLao ? "ຈຳນວນພະນັກງານຕາມຂະແໜງ" : "Staff by Division"}</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{Object.keys(deptCounts).length} {isLao ? "ຂະແໜງ" : "units"}</span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(deptCounts).map(([dept, count], idx) => {
              const pct = totalStaff > 0 ? Math.round((count / totalStaff) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={dept}>
                      {dept}
                    </span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400">
                      {count} {isLao ? "ທ່ານ" : ""} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Registered Staff Cards */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>{isLao ? "ລາຍຊື່ພະນັກງານລັດຖະກອນຫຼ້າສຸດ" : "Recent Staff Profiles"}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isLao ? "ຮູບຖ່າຍທາງການ 4x6, ລະຫັດລັດຖະກອນ ແລະ ຕຳແໜ່ງ" : "Official 4x6 photos and credentials"}
              </p>
            </div>
            <button
              onClick={onNavigateToDirectory}
              className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isLao ? "ເບິ່ງທັງໝົດ" : "View All"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {employees.slice(0, 4).map((emp) => (
              <div 
                key={emp.id} 
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/5 hover:border-purple-400/50 transition-all flex items-center gap-3.5 group"
              >
                {/* 4x6 Official Portrait Thumbnail */}
                <div className="w-14 h-18 rounded-xl overflow-hidden bg-slate-800 border-2 border-purple-400/30 shadow-sm shrink-0 relative">
                  {emp.officialPhotoUrl ? (
                    <img 
                      src={emp.officialPhotoUrl} 
                      alt={emp.fullName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">4x6</div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-slate-950/75 text-[8px] font-black text-center text-purple-300 py-0.5">
                    {emp.gender === "female" ? (isLao ? "ຍິງ" : "F") : (isLao ? "ຊາຍ" : "M")}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      {emp.staffCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold ${
                      emp.type === "full" ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                    }`}>
                      {emp.type === "full" ? (isLao ? "ສົມບູນ" : "Permanent") : (isLao ? "ທົດລອງງານ" : "Probation")}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                    {emp.fullName}
                  </h4>

                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                    {emp.position}
                  </p>

                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-purple-500 shrink-0" />
                    <span>{emp.department}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
