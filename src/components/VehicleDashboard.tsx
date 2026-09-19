import React, { useState, useMemo } from "react";
import { 
  Car, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  AlertCircle, 
  CalendarDays, 
  Users, 
  MapPin, 
  ArrowRight, 
  UserCheck, 
  Phone, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Check, 
  X, 
  Filter,
  Fuel,
  Shield,
  Activity
} from "lucide-react";
import { Vehicle, VehicleBooking, AppLanguage, UserRole } from "../types";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

interface VehicleDashboardProps {
  vehicles: Vehicle[];
  bookings: VehicleBooking[];
  language: AppLanguage;
  userRole: UserRole;
  onNavigateToBooking: () => void;
  onNavigateToManagement?: () => void;
  onNavigateToAdminBookings?: () => void;
}

export default function VehicleDashboard({
  vehicles,
  bookings,
  language,
  userRole,
  onNavigateToBooking,
  onNavigateToManagement,
  onNavigateToAdminBookings
}: VehicleDashboardProps) {
  const isLao = language === "lo";

  // Selected date for calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateDetails, setSelectedDateDetails] = useState<string | null>(null);

  // Status Filter for Daily Fleet Report
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "in_use" | "maintenance">("all");

  // Summary Metrics
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === "available").length;
  const inUseVehicles = vehicles.filter(v => v.status === "in_use").length;
  const maintenanceVehicles = vehicles.filter(v => v.status === "maintenance").length;

  const pendingBookingsCount = bookings.filter(b => b.status === "pending").length;
  const approvedBookingsCount = bookings.filter(b => b.status === "approved").length;
  
  // Today's Date
  const todayStr = new Date().toISOString().split("T")[0];

  // Approved trips active today
  const todaysActiveTrips = useMemo(() => {
    return bookings.filter(b => {
      if (b.status !== "approved") return false;
      const start = b.startDate;
      const end = b.endDate || b.startDate;
      return todayStr >= start && todayStr <= end;
    });
  }, [bookings, todayStr]);

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthNamesLao = [
    "ມັງກອນ (1)", "ກຸມພາ (2)", "ມີນາ (3)", "ເມສາ (4)", "ພຶດສະພາ (5)", "ມິຖຸນາ (6)",
    "ກໍລະກົດ (7)", "ສິງຫາ (8)", "ກັນຍາ (9)", "ຕຸລາ (10)", "ພະຈິກ (11)", "ທັນວາ (12)"
  ];
  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = isLao ? monthNamesLao[month] : monthNamesEn[month];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Map of bookings by date
  const bookingsByDate = useMemo(() => {
    const map: { [dateStr: string]: VehicleBooking[] } = {};
    for (const b of bookings) {
      if (b.status === "approved" || b.status === "pending") {
        const start = new Date(b.startDate);
        const end = new Date(b.endDate || b.startDate);

        // Fill all days between start and end
        let curr = new Date(start);
        while (curr <= end) {
          const dateKey = curr.toISOString().split("T")[0];
          if (!map[dateKey]) {
            map[dateKey] = [];
          }
          map[dateKey].push(b);
          curr.setDate(curr.getDate() + 1);
        }
      }
    }
    return map;
  }, [bookings]);

  // Filter vehicles for the daily report
  const filteredVehicles = useMemo(() => {
    if (statusFilter === "all") return vehicles;
    return vehicles.filter(v => v.status === statusFilter);
  }, [vehicles, statusFilter]);

  // Selected date trips for Modal
  const selectedDayTrips = selectedDateDetails ? (bookingsByDate[selectedDateDetails] || []) : [];

  return (
    <div id="vehicle-dashboard-view" className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header & Overview Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Car className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLao ? "ໜ້າລາຍງານສະຖິຕິ & ຕິດຕາມລົດບໍລິຫານ" : "Vehicle Fleet Dashboard"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isLao 
              ? "ສະຖິຕິການໃຊ້ງານລວມ, ຄວາມພ້ອມຂອງລົດທັງໝົດ, ປະຕິທິນຕິດຕາມການນຳໃຊ້ ແລະ ລາຍງານລົດປະຈຳວັນ" 
              : "Overview of vehicle fleet availability, mission dispatch, usage calendar, and daily status"}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToBooking}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>{isLao ? "+ ຈອງລົດດ່ວນ" : "+ Book Vehicle"}</span>
          </button>
          
          {userRole === "admin" && onNavigateToAdminBookings && pendingBookingsCount > 0 && (
            <button
              onClick={onNavigateToAdminBookings}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer animate-pulse"
            >
              <Shield className="w-4 h-4" />
              <span>{pendingBookingsCount} {isLao ? "ຄຳຂໍລໍຖ້າອະນຸມັດ" : "pending requests"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Cards (ສະຖິຕິການໃຊ້ງານລວມ, ຄວາມພ້ອມ/ສະຖານະຂອງລົດທັງໝົດ) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total vehicles */}
        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isLao ? "ລົດທັງໝົດ" : "Total Fleet"}</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{totalVehicles}</span>
            <span className="text-xs font-bold text-slate-400">{isLao ? "ຄັນ" : "units"}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-slate-400 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Available vehicles */}
        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-emerald-500/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{isLao ? "ລົດຫວ່າງພ້ອມໃຊ້" : "Available"}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">{availableVehicles}</span>
            <span className="text-xs font-bold text-emerald-600/70">
              {totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-emerald-100 dark:bg-emerald-950 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full" 
              style={{ width: `${totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0}%` }} 
            />
          </div>
        </div>

        {/* In use vehicles */}
        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-blue-500/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{isLao ? "ກຳລັງນຳໃຊ້ (ບໍ່ຫວ່າງ)" : "In Use"}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300">{inUseVehicles}</span>
            <span className="text-xs font-bold text-blue-600/70">
              {totalVehicles > 0 ? Math.round((inUseVehicles / totalVehicles) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-blue-100 dark:bg-blue-950 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full" 
              style={{ width: `${totalVehicles > 0 ? (inUseVehicles / totalVehicles) * 100 : 0}%` }} 
            />
          </div>
        </div>

        {/* Under maintenance */}
        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-amber-500/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{isLao ? "ຢູ່ລະຫວ່າງສ້ອມແປງ" : "Maintenance"}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300">{maintenanceVehicles}</span>
            <span className="text-xs font-bold text-amber-600/70">
              {totalVehicles > 0 ? Math.round((maintenanceVehicles / totalVehicles) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-amber-100 dark:bg-amber-950 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full" 
              style={{ width: `${totalVehicles > 0 ? (maintenanceVehicles / totalVehicles) * 100 : 0}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 3. Grid: Calendar Tracker & Today's Active Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Calendar Tracker (8 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isLao ? "ປະຕິທິນຕິດຕາມການນຳໃຊ້ລົດ" : "Vehicle Usage Calendar"}
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  {isLao ? "ກົດທີ່ວັນທີເພື່ອເບິ່ງລາຍລະອຽດການຈອງລົດໃນມື້ນັ້ນ" : "Click a date to see vehicle trips scheduled"}
                </span>
              </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToday}
                className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                {isLao ? "ມື້ນີ້" : "Today"}
              </button>
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 px-2 min-w-[120px] text-center">
                {currentMonthName} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900/50 text-center py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5">
              <span>{isLao ? "ອາທິດ" : "Sun"}</span>
              <span>{isLao ? "ຈັນ" : "Mon"}</span>
              <span>{isLao ? "ອັງຄານ" : "Tue"}</span>
              <span>{isLao ? "ພຸດ" : "Wed"}</span>
              <span>{isLao ? "ພະຫັດ" : "Thu"}</span>
              <span>{isLao ? "ສຸກ" : "Fri"}</span>
              <span>{isLao ? "ເສົາ" : "Sat"}</span>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {/* Padding empty cells */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[75px] bg-slate-50/40 dark:bg-slate-950/20 p-1.5" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isToday = formattedDate === todayStr;
                const dayTrips = bookingsByDate[formattedDate] || [];
                const approvedTrips = dayTrips.filter(t => t.status === "approved");
                const pendingTrips = dayTrips.filter(t => t.status === "pending");

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => {
                      if (dayTrips.length > 0) {
                        setSelectedDateDetails(formattedDate);
                      }
                    }}
                    className={`min-h-[75px] p-1.5 flex flex-col justify-between transition-colors relative ${
                      isToday ? "bg-amber-50/40 dark:bg-amber-950/20" : "bg-white dark:bg-[#1e293b]"
                    } ${dayTrips.length > 0 ? "cursor-pointer hover:bg-amber-50/80 dark:hover:bg-slate-800" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isToday 
                          ? "bg-amber-500 text-white shadow-sm" 
                          : "text-slate-700 dark:text-slate-300"
                      }`}>
                        {dayNum}
                      </span>

                      {dayTrips.length > 0 && (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/50 px-1.5 py-0.2 rounded-full">
                          {dayTrips.length}
                        </span>
                      )}
                    </div>

                    {/* Indicators of trips */}
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {approvedTrips.slice(0, 2).map((trip) => (
                        <div
                          key={trip.id}
                          className="truncate text-[10px] font-semibold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                          title={`${trip.vehicleName}: ${trip.destination}`}
                        >
                          🚗 {trip.vehiclePlate.split(" ")[0]}
                        </div>
                      ))}
                      {pendingTrips.slice(0, 1).map((trip) => (
                        <div
                          key={trip.id}
                          className="truncate text-[10px] font-semibold px-1 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                          title={`ລໍຖ້າ: ${trip.destination}`}
                        >
                          ⏳ {trip.vehiclePlate.split(" ")[0]}
                        </div>
                      ))}
                      {dayTrips.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400 block text-right">
                          +{dayTrips.length - 3} {isLao ? "ອີກ" : "more"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Active Trips & Quick Stats (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Today's Active Vehicles / Missions */}
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isLao ? "ລົດທີ່ກຳລັງປະຕິບັດງານມື້ນີ້" : "Active Missions Today"}
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {todaysActiveTrips.length} {isLao ? "ລາຍການ" : "trips"}
              </span>
            </div>

            {todaysActiveTrips.length === 0 ? (
              <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Car className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isLao ? "ມື້ນີ້ບໍ່ມີລົດອອກປະຕິບັດງານທາງໄກ" : "No vehicle missions dispatched today"}
                </p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                  {isLao ? `ມີລົດຫວ່າງ ${availableVehicles} ຄັນ ພ້ອມໃຫ້ບໍລິການ` : `${availableVehicles} vehicles ready for dispatch`}
                </span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {todaysActiveTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {trip.vehicleName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-[10px] border border-amber-500/20">
                        {trip.vehiclePlate}
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="text-slate-400">{isLao ? "ຈຸດໝາຍ:" : "Dest:"}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-slate-400">{isLao ? "ຜູ້ຈອງ:" : "User:"}</span>
                        <span>{trip.userName} ({trip.department})</span>
                      </div>
                      {trip.assignedDriver && (
                        <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                          <UserCheck className="w-3.5 h-3.5 shrink-0" />
                          <span className="opacity-70">{isLao ? "ຄົນຂັບ:" : "Driver:"}</span>
                          <span className="font-bold">{trip.assignedDriver}</span>
                          {trip.driverPhone && <span className="opacity-80">({trip.driverPhone})</span>}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{trip.startDate} ({trip.startTime} - {trip.endTime})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                        {isLao ? "ອະນຸມັດແລ້ວ" : "Approved"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-3xl p-5 border border-amber-500/20 space-y-2 text-xs">
            <h4 className="font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isLao ? "ລະບຽບການນຳໃຊ້ລົດບໍລິຫານ" : "Vehicle Policy Notice"}</span>
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {isLao
                ? "ການຂໍນຳໃຊ້ລົດລັດຖະການ ຕ້ອງສົ່ງຄຳຂໍລ່ວງໜ້າຢ່າງໜ້ອຍ 24 ຊົ່ວໂມງ ເພື່ອໃຫ້ຫ້ອງວ່າການແຂວງສາມາດອະນຸມັດ ແລະ ແຕ່ງຕັ້ງພະນັກງານຂັບລົດໄດ້ຢ່າງທັນການ."
                : "Official trips require advance booking at least 24 hours prior to dispatch for administrative approval and driver allocation."}
            </p>
          </div>

        </div>

      </div>

      {/* 4. Daily Fleet Status Report (ລາຍງານລົດປະຈຳວັນ: ລົດຄັນໃດກຳລັງໃຊ້ / ຫວ່າງ / ສ້ອມແປງ) */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {isLao ? "ລາຍງານລົດປະຈຳວັນ (ສະຖານະລົດແຕ່ລະຄັນ)" : "Daily Vehicle Fleet Status"}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {isLao 
                ? "ກວດສອບລົດຄັນໃດຫວ່າງ, ກຳລັງນຳໃຊ້ ຫຼື ຢູ່ລະຫວ່າງສ້ອມແປງ" 
                : "Real-time readiness and current deployment status of every vehicle"}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              {isLao ? "ທັງໝົດ" : "All"} ({vehicles.length})
            </button>
            <button
              onClick={() => setStatusFilter("available")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === "available"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              {isLao ? "ຫວ່າງ" : "Available"} ({availableVehicles})
            </button>
            <button
              onClick={() => setStatusFilter("in_use")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === "in_use"
                  ? "bg-blue-500 text-white shadow-xs"
                  : "text-slate-500 hover:text-blue-600"
              }`}
            >
              {isLao ? "ກຳລັງໃຊ້" : "In Use"} ({inUseVehicles})
            </button>
            <button
              onClick={() => setStatusFilter("maintenance")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === "maintenance"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-500 hover:text-amber-600"
              }`}
            >
              {isLao ? "ສ້ອມແປງ" : "Repair"} ({maintenanceVehicles})
            </button>
          </div>
        </div>

        {/* Vehicles Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            // Check if this vehicle has an active trip today
            const activeTripToday = todaysActiveTrips.find(t => t.vehicleId === vehicle.id);

            return (
              <div
                key={vehicle.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between transition-all bg-white dark:bg-slate-900/40 ${
                  vehicle.status === "available"
                    ? "border-emerald-500/30 hover:border-emerald-500"
                    : vehicle.status === "in_use"
                    ? "border-blue-500/30 hover:border-blue-500"
                    : "border-amber-500/30 hover:border-amber-500"
                }`}
              >
                <div className="space-y-4">
                  {/* Photo or Illustration */}
                  <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {vehicle.imageUrl ? (
                      <img
                        src={vehicle.imageUrl}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Car className="w-16 h-16" />
                      </div>
                    )}

                    {/* Status Badge Over Image */}
                    <div className="absolute top-3 right-3">
                      {vehicle.status === "available" && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-md flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isLao ? "ຫວ່າງພ້ອມໃຊ້" : "Available"}</span>
                        </span>
                      )}
                      {vehicle.status === "in_use" && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-md flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          <span>{isLao ? "ກຳລັງນຳໃຊ້" : "In Use"}</span>
                        </span>
                      )}
                      {vehicle.status === "maintenance" && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-md flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{isLao ? "ຢູ່ລະຫວ່າງສ້ອມແປງ" : "Under Repair"}</span>
                        </span>
                      )}
                    </div>

                    {/* Plate number floating pill */}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-mono font-black border border-amber-400/40">
                      {vehicle.plateNumber}
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                      {vehicle.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="capitalize">{vehicle.type.toUpperCase()}</span>
                      <span>•</span>
                      <span>{vehicle.capacity} {isLao ? "ບ່ອນນັ່ງ" : "Seats"}</span>
                      <span>•</span>
                      <span>{vehicle.fuelType}</span>
                    </div>
                  </div>

                  {/* Driver / Mission info */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 space-y-1 text-xs">
                    {vehicle.defaultDriver && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400">{isLao ? "ຄົນຂັບປະຈຳ:" : "Driver:"}</span>
                        <span className="font-bold">{vehicle.defaultDriver}</span>
                      </div>
                    )}
                    {vehicle.driverPhone && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400">{isLao ? "ເບີໂທ:" : "Phone:"}</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">{vehicle.driverPhone}</span>
                      </div>
                    )}
                    {activeTripToday && (
                      <div className="mt-1 pt-1.5 border-t border-slate-200 dark:border-white/5 text-blue-600 dark:text-blue-400 font-semibold">
                        📍 {isLao ? "ກຳລັງໄປ:" : "Mission:"} {activeTripToday.destination}
                      </div>
                    )}
                    {vehicle.status === "maintenance" && vehicle.notes && (
                      <div className="mt-1 pt-1.5 border-t border-slate-200 dark:border-white/5 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                        ⚠️ {vehicle.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5">
                  {vehicle.status === "available" ? (
                    <button
                      onClick={onNavigateToBooking}
                      className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 hover:text-white dark:text-amber-300 dark:hover:text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{isLao ? "ເລືອກຈອງລົດຄັນນີ້" : "Book This Vehicle"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs cursor-not-allowed text-center"
                    >
                      {vehicle.status === "in_use" 
                        ? (isLao ? "ກຳລັງຕິດພາລະກິດ" : "Currently Dispatched")
                        : (isLao ? "ງົດໃຊ້ງານຊົ່ວຄາວ (ສ້ອມແປງ)" : "Temporarily Out of Service")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pop-up Modal for Daily Trips Details */}
      {selectedDateDetails && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-white/10 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isLao ? "ລາຍການຈອງລົດປະຈຳວັນທີ:" : "Bookings for:"} {selectedDateDetails}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {selectedDayTrips.length} {isLao ? "ລາຍການ" : "scheduled trips"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDateDetails(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
              {selectedDayTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                        {trip.vehicleName}
                      </span>
                      <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {trip.vehiclePlate}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      trip.status === "approved"
                        ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                    }`}>
                      {trip.status === "approved" ? (isLao ? "ອະນຸມັດແລ້ວ" : "Approved") : (isLao ? "ລໍຖ້າອະນຸມັດ" : "Pending")}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600 dark:text-slate-300">
                    <p><strong>{isLao ? "ຈຸດໝາຍ:" : "Destination:"}</strong> {trip.destination}</p>
                    <p><strong>{isLao ? "ຈຸດປະສົງ:" : "Purpose:"}</strong> {trip.purpose}</p>
                    <p><strong>{isLao ? "ເວລາ:" : "Time:"}</strong> {trip.startTime} - {trip.endTime} ({trip.startDate} {isLao ? "ຫາ" : "to"} {trip.endDate})</p>
                    <p><strong>{isLao ? "ຜູ້ຂໍຈອງ:" : "Requester:"}</strong> {trip.userName} ({trip.department} - {trip.phone})</p>
                    {trip.assignedDriver && (
                      <p className="text-emerald-600 dark:text-emerald-400">
                        <strong>{isLao ? "ຄົນຂັບ:" : "Driver:"}</strong> {trip.assignedDriver} ({trip.driverPhone})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedDateDetails(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                {isLao ? "ປິດໜ້າຕ່າງ" : "Close"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
