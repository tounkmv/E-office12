import React from "react";
import { 
  CalendarClock, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Calendar, 
  UserCheck, 
  Sparkles, 
  Plus, 
  FileSpreadsheet, 
  ArrowRight, 
  Building2, 
  User, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  Award,
  ChevronRight,
  PieChart as PieChartIcon
} from "lucide-react";
import { LeaveRequest, CivilServant, AppLanguage, UserProfile } from "../types";
import { ANNUAL_LEAVE_QUOTA } from "../lib/leaveHelper";
import { motion } from "motion/react";

interface LeaveDashboardProps {
  leaves: LeaveRequest[];
  employees: CivilServant[];
  language: AppLanguage;
  userProfile?: UserProfile | null;
  onNavigateToApply: () => void;
  onNavigateToApprovals?: () => void;
  onNavigateToReports: () => void;
  onQuickApprove?: (leave: LeaveRequest) => void;
  onQuickReject?: (leave: LeaveRequest) => void;
}

export default function LeaveDashboard({
  leaves,
  employees,
  language,
  userProfile,
  onNavigateToApply,
  onNavigateToApprovals,
  onNavigateToReports,
  onQuickApprove,
  onQuickReject
}: LeaveDashboardProps) {
  const isLao = language === "lo";
  const currentYear = new Date().getFullYear();

  // Filter requests for current year
  const currentYearLeaves = leaves.filter(l => 
    l.year === currentYear || new Date(l.startDate).getFullYear() === currentYear
  );

  const pendingLeaves = currentYearLeaves.filter(l => l.status === "pending");
  const approvedLeaves = currentYearLeaves.filter(l => l.status === "approved");
  const rejectedLeaves = currentYearLeaves.filter(l => l.status === "rejected");

  // Total annual leave days used across organization
  const totalAnnualDaysUsed = approvedLeaves
    .filter(l => l.leaveType === "annual")
    .reduce((sum, l) => sum + (Number(l.workingDaysCount) || 0), 0);

  // Leave types breakdown
  const leaveTypesStats = {
    annual: approvedLeaves.filter(l => l.leaveType === "annual").reduce((sum, l) => sum + (Number(l.workingDaysCount) || 0), 0),
    sick: approvedLeaves.filter(l => l.leaveType === "sick").reduce((sum, l) => sum + (Number(l.workingDaysCount) || 0), 0),
    maternity: approvedLeaves.filter(l => l.leaveType === "maternity").reduce((sum, l) => sum + (Number(l.workingDaysCount) || 0), 0),
    emergency: approvedLeaves.filter(l => l.leaveType === "emergency").reduce((sum, l) => sum + (Number(l.workingDaysCount) || 0), 0),
    study: approvedLeaves.filter(l => l.leaveType === "study").reduce((sum, l) => sum + (Number(l.workingDaysCount) || 0), 0),
    other: approvedLeaves.filter(l => l.leaveType === "other").reduce((sum, l) => sum + (Number(l.workingDaysCount) || 0), 0),
  };

  // Check if current user is an approver (admin or Chief of Admin/Protocol/Finance)
  const isApprover = userProfile?.role === "admin" || 
    userProfile?.department?.includes("ບໍລິຫານ") || 
    userProfile?.department?.includes("ການເງິນ") || 
    userProfile?.displayName?.includes("ມະນີວອນ");

  // Get matching employee record for current user if applicable
  const myEmployeeRecord = employees.find(e => 
    (userProfile?.email && e.email && e.email.toLowerCase() === userProfile.email.toLowerCase()) ||
    (userProfile?.displayName && e.fullName.includes(userProfile.displayName.replace(/^ທ່ານ\s*/, "")))
  );

  // Current user's leave balance
  const myLeaves = currentYearLeaves.filter(l => 
    (myEmployeeRecord && l.staffId === myEmployeeRecord.id) ||
    (userProfile?.uid && l.userId === userProfile.uid)
  );
  const myUsedAnnualDays = myLeaves
    .filter(l => l.status === "approved" && l.leaveType === "annual")
    .reduce((sum, l) => sum + (Number(l.workingDaysCount) || 0), 0);
  const myRemainingAnnualDays = Math.max(0, ANNUAL_LEAVE_QUOTA - myUsedAnnualDays);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. TOP HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/20 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-xs font-black text-emerald-300 shadow-sm">
              <CalendarClock className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isLao ? "ລະບົບຕິດຕາມການລາພັກຂອງພະນັກງານ • ຫ້ອງວ່າການແຂວງຫົວພັນ" : "Staff Leave Tracking System • Houaphanh Provincial Office"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{isLao ? "ພາບລວມການລາພັກລັດຖະກອນ" : "Leave Management Dashboard"}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold hidden sm:inline-block">
                {currentYear}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              {isLao 
                ? "ຕິດຕາມໂຄຕ້າລາພັກປະຈຳປີ 15 ວັນທາງລັດຖະການຕໍ່ 1 ປີ, ຍື່ນຄຳຮ້ອງຂໍລາພັກ, ອະນຸມັດໂດຍຫົວໜ້າຫ້ອງບໍລິຫານ-ການເງິນ ແລະ ກວດສອບປະຫວັດການລາພັກ."
                : "Track statutory 15 working days annual leave quota, submit requests, approve through Chief of Administration & Finance, and inspect full leave history."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {pendingLeaves.length > 0 && (
              <button
                type="button"
                id="btn-approvals-leave-hero"
                onClick={onNavigateToApprovals || onNavigateToApply}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95 animate-pulse"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{isLao ? "ສູນອະນຸມັດຄຳຮ້ອງ" : "Approval Center"}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white text-orange-600 font-black text-[11px]">
                  {pendingLeaves.length}
                </span>
              </button>
            )}

            <button
              type="button"
              id="btn-apply-leave-hero"
              onClick={onNavigateToApply}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isLao ? "ຍື່ນແບບຟອມຂໍລາພັກ" : "Apply for Leave"}</span>
            </button>
            <button
              type="button"
              id="btn-reports-leave-hero"
              onClick={onNavigateToReports}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-extrabold text-xs backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>{isLao ? "ບົດລາຍງານສະຖິຕິ" : "Leave Reports"}</span>
            </button>
          </div>
        </div>

        {/* User Quota Quick Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-black">
              15
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-bold">{isLao ? "ໂຄຕ້າລາພັກປະຈຳປີ" : "Annual Quota"}</p>
              <p className="text-xs font-black text-white">{isLao ? "15 ວັນລັດຖະການ / 1 ປີ" : "15 working days/yr"}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black">
              {myUsedAnnualDays}
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-bold">{isLao ? "ທ່ານລາພັກໄປແລ້ວ" : "Days Used by You"}</p>
              <p className="text-xs font-black text-amber-300">{myUsedAnnualDays} {isLao ? "ວັນທາງລັດຖະການ" : "working days"}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-black">
              {myRemainingAnnualDays}
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-bold">{isLao ? "ວັນລາພັກທີ່ຍັງເຫຼືອຂອງທ່ານ" : "Remaining Balance"}</p>
              <p className="text-xs font-black text-teal-300">{myRemainingAnnualDays} {isLao ? "ວັນ (ພ້ອມຍື່ນຂໍ)" : "days available"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATISTICAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Requests */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isLao ? "ຄຳຮ້ອງທັງໝົດ" : "Total Requests"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 dark:text-white">
              {currentYearLeaves.length}
            </span>
            <span className="text-xs font-extrabold text-slate-400">{isLao ? "ລາຍການ" : "items"}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {isLao ? `ທັງໝົດໃນສົກປີ ${currentYear}` : `All requests in ${currentYear}`}
          </p>
        </div>

        {/* Pending Approvals */}
        <div 
          onClick={onNavigateToApprovals || onNavigateToApply}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-sm hover:shadow-md transition-all relative overflow-hidden cursor-pointer group hover:border-amber-400 active:scale-[0.99]"
          title={isLao ? "ກົດເພື່ອເປີດສູນອະນຸມັດຄຳຮ້ອງ" : "Click to open Approval Center"}
        >
          {pendingLeaves.length > 0 && (
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500 animate-pulse" />
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider group-hover:underline flex items-center gap-1">
              <span>{isLao ? "ລໍຖ້າອະນຸມັດ" : "Pending Review"}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {pendingLeaves.length}
            </span>
            <span className="text-xs font-extrabold text-amber-500/80">{isLao ? "ລາຍການ" : "items"}</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600/90 dark:text-amber-400/80 font-medium">
            {isLao ? "ລໍຖ້າຫົວໜ້າຫ້ອງ/ແອດມິນອະນຸມັດ (ກົດເພື່ອເບິ່ງ)" : "Awaiting supervisor action (click to view)"}
          </p>
        </div>

        {/* Approved Leaves */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {isLao ? "ອະນຸມັດແລ້ວ" : "Approved"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {approvedLeaves.length}
            </span>
            <span className="text-xs font-extrabold text-slate-400">{isLao ? "ລາຍການ" : "items"}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {isLao ? `ລວມທັງໝົດ ${totalAnnualDaysUsed} ວັນລັດຖະການ` : `${totalAnnualDaysUsed} working days`}
          </p>
        </div>

        {/* Quota Compliance */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              {isLao ? "ໂຄຕ້າຕໍ່ທ່ານ" : "Max Quota / Staff"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 dark:text-white">
              15
            </span>
            <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">{isLao ? "ວັນ/ປີ" : "days/yr"}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {isLao ? "ກົດໝາຍວ່າດ້ວຍລັດຖະກອນ" : "Statutory annual allowance"}
          </p>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: PENDING ACTION LIST & LEAVE TYPES BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending Requests Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                {isLao ? "ຄຳຮ້ອງທີ່ລໍຖ້າການອະນຸມັດ" : "Pending Approvals"}
              </h2>
              {pendingLeaves.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                  {pendingLeaves.length}
                </span>
              )}
            </div>
            <button
              onClick={onNavigateToApprovals || onNavigateToApply}
              className="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isLao ? "ເບິ່ງທັງໝົດໃນສູນອະນຸມັດ" : "View All Approvals"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                {isLao ? "ບໍ່ມີຄຳຮ້ອງທີ່ລໍຖ້າການອະນຸມັດໃນຂະນະນີ້" : "No pending leave requests at this time"}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isLao ? "ທຸກຄຳຮ້ອງຂໍລາພັກໄດ້ຮັບການກວດກາ ແລະ ອະນຸມັດຮຽບຮ້ອຍແລ້ວ." : "All submitted requests have been reviewed."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.slice(0, 5).map(leave => (
                <div
                  key={leave.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700/50 shadow-sm transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black text-sm">
                        {leave.staffName.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">
                          {leave.staffName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {leave.staffPosition} • {leave.staffDepartment}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{isLao ? "ລໍຖ້າອະນຸມັດ" : "Pending"}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {leave.workingDaysCount} {isLao ? "ວັນລັດຖະການ" : "days"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      📌 {leave.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      🗓️ {isLao ? "ກຳນົດວັນທີ:" : "Date:"} <span className="font-bold text-slate-700 dark:text-slate-300">{leave.startDate} ຫາ {leave.endDate}</span>
                    </p>
                    {leave.handoverPerson && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        🤝 {isLao ? "ຜູ້ມອບໝາຍວຽກແທນ:" : "Handover:"} <span className="font-medium text-slate-700 dark:text-slate-300">{leave.handoverPerson} ({leave.handoverPhone || "ບໍ່ມີເບີ"})</span>
                      </p>
                    )}
                  </div>

                  {isApprover && onQuickApprove && onQuickReject && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => onQuickReject(leave)}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        {isLao ? "ປະຕິເສດ" : "Reject"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickApprove(leave)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                      >
                        {isLao ? "ອະນຸມັດ" : "Approve"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Leave Types Breakdown & Quota Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <PieChartIcon className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
              {isLao ? "ຈຳແນກຕາມປະເພດການລາພັກ" : "Leave Types Breakdown"}
            </h2>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            
            {/* Annual */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {isLao ? "ລາພັກປະຈຳປີ (15 ວັນ)" : "Annual Leave"}
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {leaveTypesStats.annual} {isLao ? "ວັນ" : "days"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${Math.min(100, (leaveTypesStats.annual / Math.max(1, totalAnnualDaysUsed || 1)) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Sick */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  {isLao ? "ລາພັກປ່ວຍ (Sick)" : "Sick Leave"}
                </span>
                <span className="font-black text-rose-600 dark:text-rose-400">
                  {leaveTypesStats.sick} {isLao ? "ວັນ" : "days"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full" 
                  style={{ width: `${Math.min(100, (leaveTypesStats.sick / Math.max(1, totalAnnualDaysUsed || 1)) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Maternity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  {isLao ? "ລາເກີດລູກ/ຄອດລູກ" : "Maternity"}
                </span>
                <span className="font-black text-purple-600 dark:text-purple-400">
                  {leaveTypesStats.maternity} {isLao ? "ວັນ" : "days"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${Math.min(100, (leaveTypesStats.maternity / Math.max(1, totalAnnualDaysUsed || 1)) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Emergency */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  {isLao ? "ລາກິດສຸກເສີນ/ຄອບຄົວ" : "Emergency"}
                </span>
                <span className="font-black text-amber-600 dark:text-amber-400">
                  {leaveTypesStats.emergency} {isLao ? "ວັນ" : "days"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${Math.min(100, (leaveTypesStats.emergency / Math.max(1, totalAnnualDaysUsed || 1)) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Study */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  {isLao ? "ລາໄປຮຽນ/ຝຶກອົບຮົມ" : "Training / Study"}
                </span>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {leaveTypesStats.study} {isLao ? "ວັນ" : "days"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${Math.min(100, (leaveTypesStats.study / Math.max(1, totalAnnualDaysUsed || 1)) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Quota Policy Note */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isLao ? "ນະໂຍບາຍການລາພັກລັດຖະການ:" : "Statutory Policy:"}</span>
              </div>
              <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                {isLao 
                  ? "ພະນັກງານລັດຖະກອນສົມບູນ 1 ຄົນ ສາມາດລາພັກປະຈຳປີໄດ້ສູງສຸດ 15 ວັນທາງລັດຖະການຕໍ່ 1 ປີ. ການຍື່ນຄຳຮ້ອງຕ້ອງໄດ້ຮັບການອະນຸມັດຈາກ ຫົວໜ້າຫ້ອງ ບໍລິຫານ, ພິທີການ ແລະ ການເງິນ ຫຼື ແອັດມີນ."
                  : "Each permanent civil servant is entitled to up to 15 working days annual leave per year. Approvals are granted by the Chief of Administration, Protocol & Finance or Admin."}
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
