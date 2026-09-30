import React from "react";
import { 
  Building2, 
  Car, 
  CalendarDays, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Compass, 
  Briefcase, 
  FileSpreadsheet, 
  Award,
  Lock,
  Unlock,
  ShieldAlert
} from "lucide-react";
import { 
  MeetingRoom, 
  RoomBooking, 
  Vehicle, 
  VehicleBooking, 
  LeadershipActivity, 
  AppLanguage, 
  UserProfile,
  hasPermission,
  countSystemPermissions
} from "../types";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";
import { motion } from "motion/react";

interface SystemPortalProps {
  language: AppLanguage;
  userProfile: UserProfile;
  rooms: MeetingRoom[];
  roomBookings: RoomBooking[];
  vehicles: Vehicle[];
  vehicleBookings: VehicleBooking[];
  activities?: LeadershipActivity[];
  onSelectSystem: (system: "meeting" | "vehicle" | "leadership", tab?: string) => void;
}

export default function SystemPortal({
  language,
  userProfile,
  rooms,
  roomBookings,
  vehicles,
  vehicleBookings,
  activities = [],
  onSelectSystem
}: SystemPortalProps) {
  const isLao = language === "lo";

  // Granular Permission Checks for the 3 Systems
  const canAccessMeeting = hasPermission(userProfile, "meetingAccess");
  const canBookMeeting = hasPermission(userProfile, "meetingBook");
  const canApproveMeeting = hasPermission(userProfile, "meetingApprove");

  const canAccessVehicle = hasPermission(userProfile, "vehicleAccess");
  const canBookVehicle = hasPermission(userProfile, "vehicleBook");
  const canApproveVehicle = hasPermission(userProfile, "vehicleApprove");

  const canAccessLeadership = hasPermission(userProfile, "leadershipAccess");
  const canLogDuty = hasPermission(userProfile, "leadershipLogOwn");
  const canDutyReports = hasPermission(userProfile, "leadershipReports");

  const permSummary = countSystemPermissions(userProfile);

  // Calculations for meeting rooms
  const pendingRoomBookings = roomBookings.filter(b => b.status === "pending").length;
  const approvedRoomBookings = roomBookings.filter(b => b.status === "approved").length;

  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRoomMeetings = roomBookings.filter(
    b => b.status === "approved" && b.date <= todayStr && (b.endDate || b.date) >= todayStr
  ).length;

  // Calculations for vehicles
  const availableVehicles = vehicles.filter(v => v.status === "available").length;
  const inUseVehicles = vehicles.filter(v => v.status === "in_use").length;
  const pendingVehicleBookings = vehicleBookings.filter(b => b.status === "pending").length;

  // Calculations for leadership activities
  const todayActivities = activities.filter(a => a.startDate <= todayStr && a.endDate >= todayStr).length;
  const completedActivities = activities.filter(a => a.status === "completed").length;
  const myActivitiesCount = activities.filter(a => a.userId === userProfile.uid).length;

  return (
    <div id="system-portal-hub" className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner / Welcome with National Emblem */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-rose-500 rounded-2xl blur-md opacity-50" />
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 bg-slate-900/90 rounded-2xl border border-amber-400/60 p-2 flex items-center justify-center shadow-lg">
                <img
                  src={emblemLogo}
                  alt="Emblem"
                  className="w-full h-full object-contain filter drop-shadow-md"
                  onError={(e) => {
                    if (e.currentTarget.src !== emblemSvg) {
                      e.currentTarget.src = emblemSvg;
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 backdrop-blur-md border border-amber-400/40 text-xs font-black text-amber-300 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
                <span>{isLao ? "ສູນຄວບຄຸມລະບົບທັງໝົດ" : "System Control Center"}</span>
                <span>•</span>
                <span>{isLao ? "ຫ້ອງວ່າການແຂວງຫົວພັນ" : "Houaphanh Provincial Office"}</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                {isLao ? `ສະບາຍດີ, ທ່ານ ${userProfile.displayName}` : `Welcome, ${userProfile.displayName}`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                {isLao 
                  ? "ກະລຸນາເລືອກລະບົບວຽກງານທີ່ທ່ານຕ້ອງການເຂົ້າໃຊ້ງານ ໂດຍມີ 3 ລະບົບຫຼັກໃຫ້ບໍລິການດັ່ງລຸ່ມນີ້:"
                  : "Please select the management system you wish to access from the three core administrative services below:"}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{isLao ? "ສິດເຂົ້າໃຊ້ງານ" : "Role"}:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                userProfile.role === "admin" 
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}>
                {userProfile.role === "admin" ? (isLao ? "ຜູ້ດູແລລະບົບ (Admin)" : "Administrator") : (isLao ? "ພະນັກງານ (User)" : "User")}
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-300/90 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
              {isLao ? `ສິດທິ 3 ລະບົບ: ${permSummary.totalEnabled}/${permSummary.totalFeatures} ຟັງຊັນ` : `Permissions: ${permSummary.totalEnabled}/${permSummary.totalFeatures}`}
            </span>
          </div>

        </div>
      </div>

      {/* The 3 Main Systems Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7">
        
        {/* ================================================================= */}
        {/* SYSTEM 1: ລະບົບຈອງຫ້ອງປະຊຸມທັນສະໄໝ */}
        {/* ================================================================= */}
        <motion.div
          whileHover={canAccessMeeting ? { y: -4, scale: 1.01 } : {}}
          transition={{ duration: 0.2 }}
          className={`group relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 border-2 flex flex-col justify-between overflow-hidden transition-all ${
            canAccessMeeting
              ? "border-indigo-500/30 dark:border-indigo-500/20 hover:border-indigo-500 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10"
              : "border-slate-200 dark:border-white/5 opacity-80 shadow-sm"
          }`}
        >
          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${canAccessMeeting ? "from-indigo-500 via-blue-500 to-purple-500" : "from-slate-400 to-slate-500"}`} />
          {canAccessMeeting && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all pointer-events-none" />}

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0 ${
                canAccessMeeting
                  ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-500/30"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400"
              }`}>
                <Building2 className="w-7 h-7" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {isLao ? "ລະບົບທີ 1" : "System #1"}
                </span>
                {canAccessMeeting ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{isLao ? "ໄດ້ຮັບສິດ" : "Authorized"}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-500" />
                    <span>{isLao ? "ຈຳກັດສິດ" : "Restricted"}</span>
                  </span>
                )}
                {pendingRoomBookings > 0 && userProfile.role === "admin" && canAccessMeeting && (
                  <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {pendingRoomBookings} {isLao ? "ລໍຖ້າອະນຸມັດ" : "pending"}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                1. ລະບົບຈອງຫ້ອງປະຊຸມທັນສະໄໝ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {isLao
                  ? "ຄຸ້ມຄອງ, ກວດສອບຕາຕະລາງປະຕິທິນ, ຈອງຫ້ອງປະຊຸມ, ອະນຸມັດ ແລະ ສ້າງບົດລາຍງານ."
                  : "Meeting room reservations, schedule calendar, approval workflows, and reports."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 text-center">
                <span className="text-[9px] text-slate-400 font-bold block">{isLao ? "ຫ້ອງທັງໝົດ" : "Rooms"}</span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{rooms.length}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center">
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold block">{isLao ? "ປະຊຸມມື້ນີ້" : "Today"}</span>
                <span className="text-sm sm:text-base font-black text-indigo-700 dark:text-indigo-300">{todayRoomMeetings}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">{isLao ? "ອະນຸມັດ" : "Approved"}</span>
                <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300">{approvedRoomBookings}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
            {canAccessMeeting ? (
              <>
                <button
                  onClick={() => onSelectSystem("meeting", "dashboard")}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 group-hover:shadow-indigo-600/40 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <span>{isLao ? "ເຂົ້າສູ່ລະບົບຈອງຫ້ອງປະຊຸມ" : "Enter Meeting Room System"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Quick direct sub-actions */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {canBookMeeting ? (
                    <button
                      onClick={() => onSelectSystem("meeting", "booking")}
                      className="py-1.5 px-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold text-center transition-colors cursor-pointer border border-indigo-200/50 dark:border-indigo-800/40 truncate"
                    >
                      + {isLao ? "ຈອງຫ້ອງໃໝ່" : "Book Room"}
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectSystem("meeting", "dashboard")}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] font-bold text-center transition-colors cursor-pointer border border-slate-200/60 dark:border-white/5 truncate"
                    >
                      {isLao ? "ຕາຕະລາງ" : "Calendar"}
                    </button>
                  )}
                  <button
                    onClick={() => onSelectSystem("meeting", canApproveMeeting ? "admin-bookings" : "dashboard")}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] font-bold text-center transition-colors cursor-pointer border border-slate-200/60 dark:border-white/5 truncate"
                  >
                    {canApproveMeeting 
                      ? (isLao ? "ສູນອະນຸມັດ" : "Approvals") 
                      : (isLao ? "ຕາຕະລາງ" : "Calendar")}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-rose-500 dark:text-rose-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isLao ? "ບໍ່ໄດ້ຮັບສິດເຂົ້າເຖິງລະບົບນີ້" : "No Access Granted"}</span>
                </div>
                <p className="text-[10.5px] text-slate-400">
                  {isLao ? "ຕິດຕໍ່ຜູ້ດູແລລະບົບເພື່ອຂໍເປີດສິດການໃຊ້ງານ" : "Contact admin to grant permissions"}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ================================================================= */}
        {/* SYSTEM 2: ລະບົບການຈັດການລົດບໍລິຫານ */}
        {/* ================================================================= */}
        <motion.div
          whileHover={canAccessVehicle ? { y: -4, scale: 1.01 } : {}}
          transition={{ duration: 0.2 }}
          className={`group relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 border-2 flex flex-col justify-between overflow-hidden transition-all ${
            canAccessVehicle
              ? "border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500 shadow-lg hover:shadow-2xl hover:shadow-amber-500/10"
              : "border-slate-200 dark:border-white/5 opacity-80 shadow-sm"
          }`}
        >
          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${canAccessVehicle ? "from-amber-500 via-orange-500 to-rose-500" : "from-slate-400 to-slate-500"}`} />
          {canAccessVehicle && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all pointer-events-none" />}

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0 ${
                canAccessVehicle
                  ? "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white shadow-amber-500/30"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400"
              }`}>
                <Car className="w-7 h-7" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {isLao ? "ລະບົບທີ 2" : "System #2"}
                </span>
                {canAccessVehicle ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{isLao ? "ໄດ້ຮັບສິດ" : "Authorized"}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-500" />
                    <span>{isLao ? "ຈຳກັດສິດ" : "Restricted"}</span>
                  </span>
                )}
                {pendingVehicleBookings > 0 && userProfile.role === "admin" && canAccessVehicle && (
                  <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {pendingVehicleBookings} {isLao ? "ລໍຖ້າອະນຸມັດ" : "pending"}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                2. ລະບົບການຈັດການລົດບໍລິຫານ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {isLao
                  ? "ຕິດຕາມສະຖານະລົດ, ຈອງລົດລັດຖະການ, ແຕ່ງຕັ້ງຄົນຂັບ, ປະຕິທິນການເດີນທາງ ແລະ ລາຍງານ."
                  : "Vehicle dispatch, official trip booking, driver assignment, and usage reports."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">{isLao ? "ລົດຫວ່າງ" : "Available"}</span>
                <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300">{availableVehicles} {isLao ? "ຄັນ" : ""}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center">
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold block">{isLao ? "ໃຊ້ງານ" : "In Use"}</span>
                <span className="text-sm sm:text-base font-black text-blue-700 dark:text-blue-300">{inUseVehicles} {isLao ? "ຄັນ" : ""}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-center">
                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold block">{isLao ? "ຄຳຂໍ" : "Requests"}</span>
                <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-300">{vehicleBookings.length}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
            {canAccessVehicle ? (
              <>
                <button
                  onClick={() => onSelectSystem("vehicle", "vehicle-dashboard")}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 group-hover:shadow-amber-600/40 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <span>{isLao ? "ເຂົ້າສູ່ລະບົບລົດບໍລິຫານ" : "Enter Vehicle System"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Quick direct sub-actions */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {canBookVehicle ? (
                    <button
                      onClick={() => onSelectSystem("vehicle", "vehicle-booking")}
                      className="py-1.5 px-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[11px] font-bold text-center transition-colors cursor-pointer border border-amber-200/50 dark:border-amber-800/40 truncate"
                    >
                      + {isLao ? "ຈອງລົດລັດຖະການ" : "Book Trip"}
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectSystem("vehicle", "vehicle-dashboard")}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] font-bold text-center transition-colors cursor-pointer border border-slate-200/60 dark:border-white/5 truncate"
                    >
                      {isLao ? "ສະຖານະລົດ" : "Fleet Status"}
                    </button>
                  )}
                  <button
                    onClick={() => onSelectSystem("vehicle", canApproveVehicle ? "vehicle-admin-bookings" : "vehicle-dashboard")}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] font-bold text-center transition-colors cursor-pointer border border-slate-200/60 dark:border-white/5 truncate"
                  >
                    {canApproveVehicle 
                      ? (isLao ? "ສູນອະນຸມັດລົດ" : "Approvals") 
                      : (isLao ? "ສະຖານະລົດ" : "Fleet Status")}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-rose-500 dark:text-rose-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isLao ? "ບໍ່ໄດ້ຮັບສິດເຂົ້າເຖິງລະບົບນີ້" : "No Access Granted"}</span>
                </div>
                <p className="text-[10.5px] text-slate-400">
                  {isLao ? "ຕິດຕໍ່ຜູ້ດູແລລະບົບເພື່ອຂໍເປີດສິດການໃຊ້ງານ" : "Contact admin to grant permissions"}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ================================================================= */}
        {/* SYSTEM 3: ລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກຂອງຄະນະ & ຫົວໜ້າຂະແໜງ */}
        {/* ================================================================= */}
        <motion.div
          whileHover={canAccessLeadership ? { y: -4, scale: 1.01 } : {}}
          transition={{ duration: 0.2 }}
          className={`group relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 border-2 flex flex-col justify-between overflow-hidden transition-all ${
            canAccessLeadership
              ? "border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10"
              : "border-slate-200 dark:border-white/5 opacity-80 shadow-sm"
          }`}
        >
          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${canAccessLeadership ? "from-emerald-500 via-teal-500 to-cyan-500" : "from-slate-400 to-slate-500"}`} />
          {canAccessLeadership && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all pointer-events-none" />}

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0 ${
                canAccessLeadership
                  ? "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-emerald-500/30"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400"
              }`}>
                <Briefcase className="w-7 h-7" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {isLao ? "ລະບົບທີ 3" : "System #3"}
                </span>
                {canAccessLeadership ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{isLao ? "ໄດ້ຮັບສິດ" : "Authorized"}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-500" />
                    <span>{isLao ? "ຈຳກັດສິດ" : "Restricted"}</span>
                  </span>
                )}
                <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                  {activities.length} {isLao ? "ວຽກງານ" : "tasks"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                3. ລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {isLao
                  ? "ຕິດຕາມວຽກຂອງຄະນະ & ຫົວໜ້າຂະແໜງ, ລະບົບປະຕິທິນ, ບັນທຶກວຽກຕົນເອງ ແລະ ລາຍງານ ອາທິດ/ເດືອນ/ປີ."
                  : "Track executive & department head activities, interactive calendar, self duty logging, and periodic reports."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 text-center">
                <span className="text-[9px] text-slate-400 font-bold block">{isLao ? "ມື້ນີ້" : "Today"}</span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{todayActivities}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">{isLao ? "ສຳເລັດ" : "Done"}</span>
                <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300">{completedActivities}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 text-center">
                <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold block">{isLao ? "ວຽກຂ້ອຍ" : "My Work"}</span>
                <span className="text-sm sm:text-base font-black text-cyan-700 dark:text-cyan-300">{myActivitiesCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
            {canAccessLeadership ? (
              <>
                <button
                  onClick={() => onSelectSystem("leadership", "leadership-calendar")}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 group-hover:shadow-emerald-600/40 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <span>{isLao ? "ເຂົ້າສູ່ລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກ" : "Enter Duty Tracker"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Quick direct sub-actions */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {canLogDuty ? (
                    <button
                      onClick={() => onSelectSystem("leadership", "leadership-my-activities")}
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold text-center transition-colors cursor-pointer border border-emerald-200/50 dark:border-emerald-800/40 truncate"
                    >
                      + {isLao ? "ບັນທຶກວຽກຂ້ອຍ" : "My Activities"}
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectSystem("leadership", "leadership-calendar")}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] font-bold text-center transition-colors cursor-pointer border border-slate-200/60 dark:border-white/5 truncate"
                    >
                      {isLao ? "ປະຕິທິນວຽກ" : "Calendar"}
                    </button>
                  )}
                  <button
                    onClick={() => onSelectSystem("leadership", canDutyReports ? "leadership-reports" : "leadership-calendar")}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] font-bold text-center transition-colors cursor-pointer border border-slate-200/60 dark:border-white/5 truncate"
                  >
                    {canDutyReports ? (isLao ? "ລາຍງານ ອາທິດ/ເດືອນ" : "Reports") : (isLao ? "ປະຕິທິນວຽກ" : "Calendar")}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-rose-500 dark:text-rose-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isLao ? "ບໍ່ໄດ້ຮັບສິດເຂົ້າເຖິງລະບົບນີ້" : "No Access Granted"}</span>
                </div>
                <p className="text-[10.5px] text-slate-400">
                  {isLao ? "ຕິດຕໍ່ຜູ້ດູແລລະບົບເພື່ອຂໍເປີດສິດການໃຊ້ງານ" : "Contact admin to grant permissions"}
                </p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Highlights Footer */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200/60 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{isLao ? "ຖານຂໍ້ມູນຮ່ວມກັນ" : "Unified Database"}</span>
            <span className="text-[11px] text-slate-400">{isLao ? "ໃຊ້ບັນຊີດຽວກັນທັງ 3 ລະບົບ" : "Single Account Sign-on"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{isLao ? "ລະບົບປະຕິທິນທັນສະໄໝ" : "Interactive Calendars"}</span>
            <span className="text-[11px] text-slate-400">{isLao ? "ເບິ່ງວຽກ, ຫ້ອງປະຊຸມ, ລົດ" : "Duty, room, and fleet schedules"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{isLao ? "ຕິດຕາມວຽກຕົນເອງ" : "My Work Progress"}</span>
            <span className="text-[11px] text-slate-400">{isLao ? "ບັນທຶກ ແລະ ກວດກາຜົນງານ" : "Self-tracking and achievements"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{isLao ? "ບົດລາຍງານ ອາທິດ/ເດືອນ/ປີ" : "Comprehensive Reports"}</span>
            <span className="text-[11px] text-slate-400">{isLao ? "ສັງລວມ ແລະ ພິມເອກະສານ" : "Formal printable summaries"}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
