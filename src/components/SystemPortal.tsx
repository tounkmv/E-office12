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
  Wrench, 
  Layers,
  Fuel,
  Compass
} from "lucide-react";
import { MeetingRoom, RoomBooking, Vehicle, VehicleBooking, AppLanguage, UserProfile } from "../types";
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
  onSelectSystem: (system: "meeting" | "vehicle") => void;
}

export default function SystemPortal({
  language,
  userProfile,
  rooms,
  roomBookings,
  vehicles,
  vehicleBookings,
  onSelectSystem
}: SystemPortalProps) {
  const isLao = language === "lo";

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
  const maintenanceVehicles = vehicles.filter(v => v.status === "maintenance").length;
  const pendingVehicleBookings = vehicleBookings.filter(b => b.status === "pending").length;

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
                <span>{isLao ? "ລະບົບບໍລິຫານທັນສະໄໝ" : "Modern Administration System"}</span>
                <span>•</span>
                <span>{isLao ? "ຫ້ອງວ່າການແຂວງຫົວພັນ" : "Houaphanh Provincial Office"}</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                {isLao ? `ສະບາຍດີ, ທ່ານ ${userProfile.displayName}` : `Welcome, ${userProfile.displayName}`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                {isLao 
                  ? "ກະລຸນາເລືອກລະບົບວຽກງານທີ່ທ່ານຕ້ອງການເຂົ້າໃຊ້ງານ ໂດຍມີ 2 ລະບົບຫຼັກໃຫ້ບໍລິການດັ່ງລຸ່ມນີ້:"
                  : "Please select the management system you wish to access from the two core administrative services below:"}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{isLao ? "ສິດເຂົ້າໃຊ້ງານ" : "User Role"}:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
              userProfile.role === "admin" 
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}>
              {userProfile.role === "admin" ? (isLao ? "ຜູ້ດູແລລະບົບ (Admin)" : "Administrator") : (isLao ? "ພະນັກງານທົ່ວໄປ (User)" : "General User")}
            </span>
          </div>

        </div>
      </div>

      {/* The 2 Main Windows / Systems Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        
        {/* ================================================================= */}
        {/* WINDOW 1: ລະບົບຈອງຫ້ອງປະຊຸມທັນສະໄໝ (Modern Meeting Room Booking System) */}
        {/* ================================================================= */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="group relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border-2 border-indigo-500/30 dark:border-indigo-500/20 hover:border-indigo-500 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden transition-all"
        >
          {/* Top color gradient glow */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all pointer-events-none" />

          <div className="space-y-5">
            {/* Header with Icon and Badge */}
            <div className="flex items-start justify-between gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="flex flex-col items-end">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {isLao ? "ລະບົບທີ 1" : "System #1"}
                </span>
                {pendingRoomBookings > 0 && userProfile.role === "admin" && (
                  <span className="mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {pendingRoomBookings} {isLao ? "ລໍຖ້າອະນຸມັດ" : "pending"}
                  </span>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                1. ລະບົບຈອງຫ້ອງປະຊຸມທັນສະໄໝ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {isLao
                  ? "ຄຸ້ມຄອງ, ກວດສອບຕາຕະລາງປະຕິທິນ, ຈອງຫ້ອງປະຊຸມອອນລາຍ, ອະນຸມັດກອງປະຊຸມ, ແຈ້ງເຕືອນຜ່ານອີເມວ ແລະ ສ້າງບົດລາຍງານທາງການ."
                  : "Comprehensive online meeting room reservation, interactive calendar, approval workflows, email alerts, and official reporting."}
              </p>
            </div>

            {/* Mini Stats Breakdown */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block">{isLao ? "ຫ້ອງທັງໝົດ" : "Rooms"}</span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{rooms.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center space-y-0.5">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">{isLao ? "ປະຊຸມມື້ນີ້" : "Today"}</span>
                <span className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-300">{todayRoomMeetings}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center space-y-0.5">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">{isLao ? "ອະນຸມັດແລ້ວ" : "Approved"}</span>
                <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300">{approvedRoomBookings}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/5">
            <button
              onClick={() => onSelectSystem("meeting")}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 group-hover:shadow-indigo-600/40 transition-all cursor-pointer active:scale-[0.99]"
            >
              <span>{isLao ? "ເຂົ້າສູ່ລະບົບຈອງຫ້ອງປະຊຸມ" : "Enter Meeting Room System"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* ================================================================= */}
        {/* WINDOW 2: ລະບົບການຈັດການລົດບໍລິຫານ (Administrative Vehicle Management System) */}
        {/* ================================================================= */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="group relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border-2 border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500 shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between overflow-hidden transition-all"
        >
          {/* Top color gradient glow */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all pointer-events-none" />

          <div className="space-y-5">
            {/* Header with Icon and Badge */}
            <div className="flex items-start justify-between gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform shrink-0">
                <Car className="w-8 h-8" />
              </div>
              <div className="flex flex-col items-end">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {isLao ? "ລະບົບທີ 2 (ໃໝ່)" : "System #2 (New)"}
                </span>
                {pendingVehicleBookings > 0 && userProfile.role === "admin" && (
                  <span className="mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {pendingVehicleBookings} {isLao ? "ຄຳຂໍລໍຖ້າອະນຸມັດ" : "pending"}
                  </span>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                2. ລະບົບການຈັດການລົດບໍລິຫານ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {isLao
                  ? "ຕິດຕາມສະຖານະລົດ (ຫວ່າງ, ກຳລັງໃຊ້, ສ້ອມແປງ), ຈອງລົດລັດຖະການ, ແຕ່ງຕັ້ງຄົນຂັບ, ປະຕິທິນຕິດຕາມການເດີນທາງ ແລະ ລາຍງານສະຫຼຸບ."
                  : "Track vehicle availability, fleet dispatch, administrative trip bookings, driver assignments, mission calendar, and exportable usage reports."}
              </p>
            </div>

            {/* Mini Stats Breakdown */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center space-y-0.5">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">{isLao ? "ລົດຫວ່າງ" : "Available"}</span>
                <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300">{availableVehicles} {isLao ? "ຄັນ" : ""}</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center space-y-0.5">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">{isLao ? "ກຳລັງໃຊ້ງານ" : "In Use"}</span>
                <span className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-300">{inUseVehicles} {isLao ? "ຄັນ" : ""}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-center space-y-0.5">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">{isLao ? "ສ້ອມແປງ" : "Repair"}</span>
                <span className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300">{maintenanceVehicles} {isLao ? "ຄັນ" : ""}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/5">
            <button
              onClick={() => onSelectSystem("vehicle")}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-sm shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 group-hover:shadow-amber-600/40 transition-all cursor-pointer active:scale-[0.99]"
            >
              <span>{isLao ? "ເຂົ້າສູ່ລະບົບການຈັດການລົດບໍລິຫານ" : "Enter Vehicle Management System"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

      </div>

      {/* Feature Comparison / Highlights Footer */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200/60 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{isLao ? "ຖານຂໍ້ມູນຮ່ວມກັນ" : "Unified Database"}</span>
            <span className="text-[11px] text-slate-400">{isLao ? "ໃຊ້ບັນຊີດຽວກັນທັງ 2 ລະບົບ" : "Single Account Sign-on"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{isLao ? "ສະຫຼັບລະບົບງ່າຍດາຍ" : "Quick Switch"}</span>
            <span className="text-[11px] text-slate-400">{isLao ? "ກົດປ່ຽນລະບົບໄດ້ທຸກເວລາ" : "Seamless toggle between systems"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{isLao ? "ຕິດຕາມແບບ Real-time" : "Live Tracking"}</span>
            <span className="text-[11px] text-slate-400">{isLao ? "ປະຕິທິນຕິດຕາມລົດ & ຫ້ອງປະຊຸມ" : "Live calendars & statuses"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{isLao ? "ລະບົບອະນຸມັດທາງການ" : "Official Approvals"}</span>
            <span className="text-[11px] text-slate-400">{isLao ? "ການແຕ່ງຕັ້ງຄົນຂັບ & ບົດລາຍງານ" : "Driver dispatch & formal exports"}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
