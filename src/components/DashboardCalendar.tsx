import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Clock, 
  Users, 
  Building, 
  Info, 
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppLanguage, RoomBooking, MeetingRoom } from "../types";

interface DashboardCalendarProps {
  bookings: RoomBooking[];
  rooms: MeetingRoom[];
  language: AppLanguage;
}

export default function DashboardCalendar({ bookings, rooms, language }: DashboardCalendarProps) {
  const today = new Date();
  
  // Format dates consistently to YYYY-MM-DD in local time
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateString(today);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [viewDate, setViewDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));

  // Localized Strings
  const isLao = language === "lo";

  const labels = {
    title: isLao ? "ປະຕິທີນການຈອງຫ້ອງປະຊຸມ" : "Meeting Room Booking Calendar",
    todayBtn: isLao ? "ມື້ນີ້" : "Today",
    noBookings: isLao ? "ບໍ່ມີການຈອງຫ້ອງປະຊຸມໃນວັນທີນີ້" : "No bookings for this date",
    meetingTitle: isLao ? "ຫົວຂໍ້ກອງປະຊຸມ" : "Meeting Title",
    time: isLao ? "ເວລາ" : "Time",
    room: isLao ? "ຫ້ອງ" : "Room",
    organizer: isLao ? "ຜູ້ຈອງ" : "Booker",
    attendees: isLao ? "ຜູ້ເຂົ້າຮ່ວມ" : "Attendees",
    purpose: isLao ? "ຈຸດປະສົງ" : "Purpose",
    notes: isLao ? "ໝາຍເຫດ" : "Notes",
    people: isLao ? "ຄົນ" : "people",
    detailsHeader: isLao ? "ລາຍລະອຽດການຈອງວັນທີ" : "Booking Details for",
    statusApproved: isLao ? "ອະນຸມັດແລ້ວ" : "Approved",
    statusPending: isLao ? "ລໍຖ້າກວດສອບ" : "Pending",
    statusRejected: isLao ? "ປະຕີເສດແລ້ວ" : "Rejected",
    legendApproved: isLao ? "ອະນຸມັດແລ້ວ" : "Approved",
    legendPending: isLao ? "ລໍຖ້າກວດສອບ" : "Pending",
    legendRejected: isLao ? "ປະຕີເສດແລ້ວ" : "Rejected"
  };

  const laMonths = [
    "ມັງກອນ", "ກຸມພາ", "ມີນາ", "ເມສາ", "ພຶດສະພາ", "ມິຖຸນາ",
    "ກໍລະກົດ", "ສິງຫາ", "ກັນຍາ", "ຕຸລາ", "ພະຈິກ", "ທັນວາ"
  ];

  const enMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const laWeekdays = ["ອາ.", "ຈ.", "ອ.", "ພ.", "ພຫ.", "ສ.", "ເສົາ"];
  const enWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(todayStr);
  };

  // Calendar math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  
  // Grid items array
  const calendarCells: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // 1. Previous month padded days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const padYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const padMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const day = prevMonthDays - i;
    const mStr = String(padMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    calendarCells.push({
      dayNum: day,
      dateStr: `${padYear}-${mStr}-${dStr}`,
      isCurrentMonth: false
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    calendarCells.push({
      dayNum: day,
      dateStr: `${currentYear}-${mStr}-${dStr}`,
      isCurrentMonth: true
    });
  }

  // 3. Next month padded days to complete grid (usually 35 or 42 cells)
  const remainingCells = (calendarCells.length % 7 === 0) ? 0 : 7 - (calendarCells.length % 7);
  for (let day = 1; day <= remainingCells; day++) {
    const padYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const padMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const mStr = String(padMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    calendarCells.push({
      dayNum: day,
      dateStr: `${padYear}-${mStr}-${dStr}`,
      isCurrentMonth: false
    });
  }

  // Filter bookings for the selected date (supporting multi-day meeting ranges)
  const selectedBookings = bookings
    .filter(b => b.date <= selectedDateStr && (b.endDate || b.date) >= selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Helper to check bookings on a given date for dots
  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter(b => b.date <= dateStr && (b.endDate || b.date) >= dateStr);
  };

  // Format date display nicely (e.g., 01 ກໍລະກົດ 2026 or July 1, 2026)
  const formatDisplayDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const d = parseInt(parts[2]);
      
      if (isLao) {
        return `ວັນທີ ${d} ${laMonths[m]} ${y + 543}`; // Buddhist Era
      } else {
        return `${enMonths[m]} ${d}, ${y}`;
      }
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="calendar-dashboard-section" className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-white/5 border-t-4 border-t-amber-500 shadow-xs space-y-6">
      
      {/* Title & Today Control (Amber/Orange Gradient Banner) */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-4 sm:p-5 rounded-2xl shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm shrink-0">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
              {labels.title}
            </h3>
            <p className="text-[11px] text-amber-100 font-medium">
              {isLao ? "ກວດສອບຕາຕະລາງການໃຊ້ຫ້ອງປະຊຸມທັງໝົດໃນລະບົບ" : "Verify room scheduling calendar in the system"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Legend dots */}
          <div className="flex items-center gap-3 text-[10px] text-white font-bold uppercase mr-1 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs" />
              <span>{labels.legendApproved}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse shadow-xs" />
              <span>{labels.legendPending}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 shadow-xs" />
              <span>{labels.legendRejected}</span>
            </div>
          </div>

          <button
            onClick={handleGoToToday}
            className="px-3.5 py-1.5 bg-white text-orange-700 hover:bg-orange-50 font-black text-xs rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
          >
            {labels.todayBtn}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Calendar Month Picker */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Month Controller header */}
          <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-100/50 dark:border-white/5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5 shadow-xs text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isLao ? `${laMonths[currentMonth]} ${currentYear + 543}` : `${enMonths[currentMonth]} ${currentYear}`}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5 shadow-xs text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday Titles */}
          <div className="grid grid-cols-7 text-center">
            {(isLao ? laWeekdays : enWeekdays).map((day, idx) => (
              <span 
                key={idx} 
                className={`text-[10px] font-bold uppercase tracking-wider py-1.5 ${
                  idx === 0 ? "text-red-500/80" : idx === 6 ? "text-blue-500/80" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const dateBookings = getBookingsForDate(cell.dateStr);
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayStr;

              // Booking dot states
              const hasApproved = dateBookings.some(b => b.status === "approved");
              const hasPending = dateBookings.some(b => b.status === "pending");
              const hasRejected = dateBookings.some(b => b.status === "rejected");

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`relative flex flex-col items-center justify-between min-h-[56px] p-1 rounded-2xl border transition-all text-xs cursor-pointer group ${
                    isSelected 
                      ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20" 
                      : isToday 
                      ? "bg-indigo-50/50 border-indigo-500/30 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-500/40 font-bold" 
                      : cell.isCurrentMonth 
                      ? "bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 font-medium" 
                      : "bg-slate-50/30 dark:bg-slate-900/10 border-transparent text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  }`}
                >
                  {/* Day Number */}
                  <span className={`text-[11px] sm:text-xs ${isSelected ? "text-white" : ""}`}>
                    {cell.dayNum}
                  </span>

                  {/* Indicator Dots container */}
                  <div className="flex gap-1 items-center justify-center h-2 mt-1">
                    {hasApproved && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`} />
                    )}
                    {hasPending && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white animate-pulse" : "bg-blue-500"}`} />
                    )}
                    {hasRejected && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-red-500"}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visual detail cards for selected date's bookings */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl p-4 border border-slate-100 dark:border-white/5 flex-1 flex flex-col min-h-[300px]">
            
            {/* Header displaying selected date */}
            <div className="border-b border-slate-100 dark:border-white/5 pb-3 mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {labels.detailsHeader}:
              </span>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                {formatDisplayDate(selectedDateStr)}
              </span>
            </div>

            {/* List of bookings for the selected date */}
            <div className="flex-1 overflow-y-auto max-h-[340px] space-y-4 pr-1">
              <AnimatePresence mode="popLayout">
                {selectedBookings.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center py-16 text-center opacity-60 h-full"
                  >
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-full mb-3 text-slate-400">
                      <Clock className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {labels.noBookings}
                    </p>
                  </motion.div>
                ) : (
                  selectedBookings.map((booking, index) => {
                    const roomInfo = rooms.find(r => r.id === booking.roomId);
                    const isApproved = booking.status === "approved";
                    const isRejected = booking.status === "rejected";

                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-white/10 shadow-xs space-y-3 hover:border-indigo-500/30 transition-all duration-200"
                      >
                        {/* Booking Title & Status Badge */}
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                            {booking.title}
                          </h4>
                          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 uppercase ${
                            isApproved 
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                              : isRejected 
                              ? "bg-red-500/10 text-red-500 border-red-500/20" 
                              : "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse"
                          }`}>
                            {isApproved ? <CheckCircle className="w-2.5 h-2.5" /> : 
                             isRejected ? <XCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                            <span>
                              {booking.status === "approved" ? labels.statusApproved :
                               booking.status === "rejected" ? labels.statusRejected : labels.statusPending}
                            </span>
                          </span>
                        </div>

                        {/* Room, Date Range and Time parameters */}
                        {booking.endDate && booking.endDate !== booking.date && (
                          <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 mt-1 border border-indigo-500/20">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>
                              {booking.date} → {booking.endDate} ({isLao ? "ປະຊຸມຫຼາຍວັນ" : "Multi-day"})
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          <div className="flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate text-slate-700 dark:text-slate-300 font-bold">
                              {booking.roomName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                        </div>

                        {/* Booker and Attendees parameters */}
                        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold border-t border-slate-50 dark:border-white/5 pt-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">
                              {booking.userName} <span className="opacity-60">({booking.department})</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {booking.attendeesCount} {labels.people}
                            </span>
                          </div>
                        </div>

                        {/* Purpose Details */}
                        {booking.purpose && (
                          <div className="text-[10px] bg-slate-50/70 dark:bg-slate-900/50 rounded-xl p-2.5 space-y-1 border border-slate-100/50 dark:border-white/5">
                            <div className="flex items-center gap-1.5 opacity-60 font-bold">
                              <FileText className="w-3 h-3" />
                              <span>{labels.purpose}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                              {booking.purpose}
                            </p>
                          </div>
                        )}

                        {/* Notes Details */}
                        {booking.notes && (
                          <div className="text-[10px] bg-amber-50/40 dark:bg-amber-950/5 rounded-xl p-2.5 space-y-1 border border-amber-500/10">
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 opacity-80 font-bold">
                              <Info className="w-3 h-3" />
                              <span>{labels.notes}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 font-semibold leading-relaxed italic">
                              {booking.notes}
                            </p>
                          </div>
                        )}

                        {/* Room Location snippet if available */}
                        {roomInfo && roomInfo.location && (
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-semibold italic">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{roomInfo.location}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
