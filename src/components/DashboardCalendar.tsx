import { useState } from "react";
import { createPortal } from "react-dom";
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
  MapPin,
  Sparkles,
  X,
  PlusCircle,
  Paperclip,
  Maximize2,
  CalendarCheck2,
  Share2,
  ShieldCheck,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppLanguage, RoomBooking, MeetingRoom } from "../types";

interface DashboardCalendarProps {
  bookings: RoomBooking[];
  rooms: MeetingRoom[];
  language: AppLanguage;
  onNavigateToBooking?: () => void;
}

export default function DashboardCalendar({ 
  bookings, 
  rooms, 
  language,
  onNavigateToBooking 
}: DashboardCalendarProps) {
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

  // Modal State for viewing full date details popup
  const [isDayModalOpen, setIsDayModalOpen] = useState<boolean>(false);
  const [modalDateStr, setModalDateStr] = useState<string>(todayStr);
  const [roomFilterId, setRoomFilterId] = useState<string>("all");

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
    statusApproved: isLao ? "ອະນຸມັດ" : "Approved",
    statusPending: isLao ? "ລໍຖ້າກວດສອບ" : "Pending",
    statusRejected: isLao ? "ປະຕິເສດ" : "Rejected",
    legendApproved: isLao ? "ອະນຸມັດ" : "Approved",
    legendPending: isLao ? "ລໍຖ້າກວດສອບ" : "Pending",
    legendRejected: isLao ? "ປະຕິເສດ" : "Rejected",
    viewModalBtn: isLao ? "ເບິ່ງລາຍລະອຽດເຕັມ (ປັອບອັບ)" : "View Full Details Popup",
    openModalHint: isLao ? "ຄລິກເພື່ອເບິ່ງລາຍລະອຽດເຕັມ" : "Click to view full day details",
    allRooms: isLao ? "ທຸກຫ້ອງປະຊຸມ" : "All Rooms",
    totalBookings: isLao ? "ລາຍການຈອງທັງໝົດ" : "Total Bookings",
    approvedBookings: isLao ? "ອະນຸມັດແລ້ວ" : "Approved",
    pendingBookings: isLao ? "ລໍຖ້າກວດສອບ" : "Pending",
    rejectedBookings: isLao ? "ປະຕິເສດ" : "Rejected",
    bookForThisDay: isLao ? "ຈອງຫ້ອງປະຊຸມສຳລັບວັນທີນີ້" : "Book a room for this date",
    closeModal: isLao ? "ປິດໜ້າຕ່າງ" : "Close",
    prevDay: isLao ? "ມື້ກ່ອນໜ້າ" : "Previous Day",
    nextDay: isLao ? "ມື້ຕໍ່ໄປ" : "Next Day",
    roomAvailable: isLao ? "ຫ້ອງປະຊຸມວ່າງທຸກຫ້ອງ ພ້ອມໃຫ້ບໍລິການ" : "All meeting rooms are available for scheduling",
    multiDayMeeting: isLao ? "ກອງປະຊຸມຕໍ່ເນື່ອງຫຼາຍວັນ" : "Multi-day Meeting",
    attachment: isLao ? "ເອກະສານຕິດຄັດ" : "Attached File",
    downloadAttachment: isLao ? "ດາວໂຫຼດເອກະສານ" : "Download File",
    duration: isLao ? "ໄລຍະເວລາ" : "Duration",
    hours: isLao ? "ຊົ່ວໂມງ" : "hours",
    timelineView: isLao ? "ຕາຕະລາງເວລາການໃຊ້ຫ້ອງໃນວັນນີ້" : "Today's Room Usage Timeline",
    roomSchedule: isLao ? "ຕາຕະລາງນຳໃຊ້ຫ້ອງ" : "Room Schedule"
  };

  const laMonths = [
    "ມັງກອນ", "ກຸມພາ", "ມີນາ", "ເມສາ", "ພຶດສະພາ", "ມິຖຸນາ",
    "ກໍລະກົດ", "ສິງຫາ", "ກັນຍາ", "ຕຸລາ", "ພະຈິກ", "ທັນວາ"
  ];

  const enMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const laFullWeekdays = ["ວັນອາທິດ", "ວັນຈັນ", "ວັນອັງຄານ", "ວັນພຸດ", "ວັນພະຫັດ", "ວັນສຸກ", "ວັນເສົາ"];
  const enFullWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
    setModalDateStr(todayStr);
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

  // Helper to check bookings on a given date (supporting multi-day spans)
  const getBookingsForDate = (dateStr: string) => {
    return bookings
      .filter(b => b.date <= dateStr && (b.endDate || b.date) >= dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Bookings for selected date
  const selectedBookings = getBookingsForDate(selectedDateStr);

  // Bookings for modal active date
  const modalBookings = getBookingsForDate(modalDateStr);

  // Filtered modal bookings
  const filteredModalBookings = roomFilterId === "all"
    ? modalBookings
    : modalBookings.filter(b => b.roomId === roomFilterId);

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

  // Format date with full weekday name (e.g. ວັນອັງຄານ, 25 ສິງຫາ 2026)
  const formatFullDisplayDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const d = parseInt(parts[2]);
      const dateObj = new Date(y, m, d);
      const weekdayIdx = dateObj.getDay();
      
      if (isLao) {
        return `${laFullWeekdays[weekdayIdx]}, ວັນທີ ${d} ${laMonths[m]} ${y + 543}`;
      } else {
        return `${enFullWeekdays[weekdayIdx]}, ${enMonths[m]} ${d}, ${y}`;
      }
    } catch {
      return dateStr;
    }
  };

  // Modal day navigations
  const handleModalPrevDay = () => {
    try {
      const parts = modalDateStr.split("-");
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      d.setDate(d.getDate() - 1);
      const nextStr = formatDateString(d);
      setModalDateStr(nextStr);
      setSelectedDateStr(nextStr);
      // Auto adjust month view if went outside
      if (d.getMonth() !== viewDate.getMonth()) {
        setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleModalNextDay = () => {
    try {
      const parts = modalDateStr.split("-");
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      d.setDate(d.getDate() + 1);
      const nextStr = formatDateString(d);
      setModalDateStr(nextStr);
      setSelectedDateStr(nextStr);
      // Auto adjust month view if went outside
      if (d.getMonth() !== viewDate.getMonth()) {
        setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle clicking a day cell on the calendar
  const handleDayClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setModalDateStr(dateStr);
    setRoomFilterId("all");
    setIsDayModalOpen(true);
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
            <p className="text-[11px] text-amber-100 font-medium flex items-center gap-1.5 mt-0.5">
              <span>{isLao ? "ຄລິກທີ່ວັນທີໃນປະຕິທິນເພື່ອເປີດໜ້າຕ່າງປັອບອັບເບິ່ງລາຍລະອຽດ" : "Click on any date to open detailed pop-up viewer"}</span>
              <span className="inline-flex items-center px-1.5 py-0.2 bg-white/20 rounded-md text-[9px] font-bold uppercase tracking-wider">
                {isLao ? "ປັອບອັບໃໝ່" : "Interactive"}
              </span>
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
            className="px-3.5 py-1.5 bg-white text-orange-700 hover:bg-orange-50 font-black text-xs rounded-xl transition-all shadow-sm cursor-pointer shrink-0 active:scale-95"
          >
            {labels.todayBtn}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Calendar Month Picker */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Month Controller header */}
          <div className="flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5 shadow-xs text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                {isLao ? `${laMonths[currentMonth]} ${currentYear + 543}` : `${enMonths[currentMonth]} ${currentYear}`}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {isLao ? `ຄ.ສ ${currentYear}` : `B.E. ${currentYear + 543}`}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5 shadow-xs text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Next Month"
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
                  idx === 0 ? "text-red-500 font-extrabold" : idx === 6 ? "text-blue-500 font-extrabold" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              const dateBookings = getBookingsForDate(cell.dateStr);
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayStr;

              // Booking status breakdown
              const hasApproved = dateBookings.some(b => b.status === "approved");
              const hasPending = dateBookings.some(b => b.status === "pending");
              const hasRejected = dateBookings.some(b => b.status === "rejected");
              const count = dateBookings.length;

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(cell.dateStr)}
                  title={`${cell.dateStr} - ${count} ${isLao ? "ກອງປະຊຸມ (ຄລິກເພື່ອເບິ່ງປັອບອັບ)" : "bookings (Click to open popup)"}`}
                  className={`relative flex flex-col items-center justify-between min-h-[64px] p-1.5 rounded-2xl border transition-all text-xs cursor-pointer group hover:scale-[1.03] active:scale-[0.98] ${
                    isSelected 
                      ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/40" 
                      : isToday 
                      ? "bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400 dark:bg-amber-950/20 font-bold" 
                      : cell.isCurrentMonth 
                      ? "bg-white dark:bg-[#1e293b] hover:bg-indigo-50/60 dark:hover:bg-slate-800/80 border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 font-medium shadow-2xs" 
                      : "bg-slate-50/40 dark:bg-slate-900/10 border-transparent text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  }`}
                >
                  {/* Top Bar inside cell: Day Number & Today label or count badge */}
                  <div className="w-full flex items-center justify-between">
                    <span className={`text-[11px] sm:text-xs font-black ${isSelected ? "text-white" : ""}`}>
                      {cell.dayNum}
                    </span>
                    {isToday && !isSelected && (
                      <span className="text-[8px] bg-amber-500 text-white px-1 py-0.2 rounded-md font-extrabold leading-none">
                        {isLao ? "ມື້ນີ້" : "Today"}
                      </span>
                    )}
                    {count > 0 && !isToday && !isSelected && (
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold px-1 rounded-md">
                        {count}
                      </span>
                    )}
                  </div>

                  {/* Meeting Snippet Preview for larger displays */}
                  {count > 0 && (
                    <div className="w-full my-0.5 hidden sm:block">
                      <div className={`text-[8px] truncate px-1 py-0.5 rounded-md font-bold leading-tight ${
                        isSelected 
                          ? "bg-white/20 text-white" 
                          : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                      }`}>
                        {dateBookings[0].roomName}
                      </div>
                    </div>
                  )}

                  {/* Indicator Dots container */}
                  <div className="flex gap-1 items-center justify-center h-2 mt-auto">
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

          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-500/10 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
            <span className="text-[11px] font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{labels.openModalHint}</span>
            </span>
            <button
              onClick={() => {
                setModalDateStr(selectedDateStr);
                setIsDayModalOpen(true);
              }}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
              <span>{labels.viewModalBtn}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual detail cards for selected date's bookings */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-50/60 dark:bg-slate-900/30 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/5 flex-1 flex flex-col min-h-[300px]">
            
            {/* Header displaying selected date */}
            <div className="border-b border-slate-100 dark:border-white/5 pb-3 mb-4 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                  {labels.detailsHeader}:
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {formatDisplayDate(selectedDateStr)}
                </span>
              </div>
              <button
                onClick={() => {
                  setModalDateStr(selectedDateStr);
                  setIsDayModalOpen(true);
                }}
                className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title={labels.viewModalBtn}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isLao ? "ເບິ່ງປັອບອັບ" : "Open Popup"}</span>
              </button>
            </div>

            {/* List of bookings for the selected date */}
            <div className="flex-1 overflow-y-auto max-h-[360px] space-y-3.5 pr-1">
              <AnimatePresence mode="popLayout">
                {selectedBookings.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center py-12 text-center opacity-75 h-full space-y-3"
                  >
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400">
                      <CalendarCheck2 className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        {labels.noBookings}
                      </p>
                      <p className="text-[10px] text-slate-400 max-w-[220px]">
                        {labels.roomAvailable}
                      </p>
                    </div>
                    {onNavigateToBooking && (
                      <button
                        onClick={onNavigateToBooking}
                        className="mt-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-[11px] font-extrabold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{labels.bookForThisDay}</span>
                      </button>
                    )}
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
                        transition={{ delay: index * 0.04 }}
                        onClick={() => {
                          setModalDateStr(selectedDateStr);
                          setIsDayModalOpen(true);
                        }}
                        className="p-3.5 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-white/10 shadow-2xs space-y-2.5 hover:border-indigo-500/40 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      >
                        {/* Booking Title & Status Badge */}
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {booking.title}
                          </h4>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-extrabold border flex items-center gap-1 uppercase ${
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

                        {/* Room and Time parameters */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate text-slate-700 dark:text-slate-300 font-bold">
                              {booking.roomName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                        </div>

                        {/* Booker and Attendees parameters */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-t border-slate-50 dark:border-white/5 pt-2">
                          <span className="truncate max-w-[150px]">
                            {booking.userName} ({booking.department})
                          </span>
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-700 dark:text-slate-300">
                            {booking.attendeesCount} {labels.people}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* BEAUTIFUL POPUP MODAL: DAY DETAILS VIEWER (ໜ້າຕ່າງປັອບອັບລາຍລະອຽດວັນທີ)     */}
      {/* ========================================================================= */}
      {isDayModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          
          {/* Modal Container */}
          <div 
            className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                  <CalendarDays className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
                      {formatFullDisplayDate(modalDateStr)}
                    </h3>
                    {modalDateStr === todayStr && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] uppercase shadow-xs">
                        {labels.todayBtn}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-indigo-100 font-medium mt-0.5">
                    {isLao ? `ຕາຕະລາງການນຳໃຊ້ຫ້ອງປະຊຸມປະຈຳວັນ (ມີທັງໝົດ ${modalBookings.length} ລາຍການ)` : `Daily Meeting Room Schedule (Total: ${modalBookings.length} bookings)`}
                  </p>
                </div>
              </div>

              {/* Day Navigators & Close Button */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center bg-black/20 backdrop-blur-md rounded-xl p-0.5 border border-white/10">
                  <button
                    onClick={handleModalPrevDay}
                    className="p-1.5 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                    title={labels.prevDay}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-bold px-2 text-white">
                    {modalDateStr}
                  </span>
                  <button
                    onClick={handleModalNextDay}
                    className="p-1.5 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                    title={labels.nextDay}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setIsDayModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
                  title={labels.closeModal}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Header: Statistics & Room Filters */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
              
              {/* Stat Chips */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs font-extrabold flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">{labels.totalBookings}:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm">{modalBookings.length}</span>
                </div>

                <div className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 font-extrabold text-[11px] flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{modalBookings.filter(b => b.status === "approved").length} {labels.approvedBookings}</span>
                </div>

                <div className="px-2.5 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20 font-extrabold text-[11px] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{modalBookings.filter(b => b.status === "pending").length} {labels.pendingBookings}</span>
                </div>

                {modalBookings.some(b => b.status === "rejected") && (
                  <div className="px-2.5 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl border border-red-500/20 font-extrabold text-[11px] flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{modalBookings.filter(b => b.status === "rejected").length} {labels.rejectedBookings}</span>
                  </div>
                )}
              </div>

              {/* Room Filter Selector */}
              {rooms.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">
                    <Building className="w-3.5 h-3.5 inline mr-1" />
                    {isLao ? "ກອງຕາມຫ້ອງ:" : "Room filter:"}
                  </span>
                  <select
                    value={roomFilterId}
                    onChange={(e) => setRoomFilterId(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">{labels.allRooms} ({modalBookings.length})</option>
                    {rooms.map(room => {
                      const count = modalBookings.filter(b => b.roomId === room.id).length;
                      return (
                        <option key={room.id} value={room.id}>
                          {room.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* Modal Body: Scrollable detailed list */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              
              {filteredModalBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                    <CalendarCheck2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                      {labels.noBookings}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {labels.roomAvailable}
                    </p>
                  </div>

                  {onNavigateToBooking && (
                    <button
                      onClick={() => {
                        setIsDayModalOpen(false);
                        onNavigateToBooking();
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{labels.bookForThisDay}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Visual timeline bar */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{labels.timelineView}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">08:00 - 17:30</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredModalBookings.map((b) => (
                        <div 
                          key={b.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            b.status === "approved" 
                              ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-900 dark:text-emerald-300"
                              : b.status === "rejected"
                              ? "bg-red-50/60 dark:bg-red-950/20 border-red-500/20 text-red-900 dark:text-red-300"
                              : "bg-blue-50/60 dark:bg-blue-950/20 border-blue-500/20 text-blue-900 dark:text-blue-300"
                          }`}
                        >
                          <div className="truncate mr-2">
                            <span className="font-extrabold block truncate">{b.roomName}</span>
                            <span className="text-[10px] opacity-80 truncate block">{b.title}</span>
                          </div>
                          <span className="font-black text-[10px] shrink-0 bg-white/70 dark:bg-slate-900/70 px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/5">
                            {b.startTime} - {b.endTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Cards for each meeting */}
                  <div className="space-y-4">
                    {filteredModalBookings.map((booking, idx) => {
                      const roomInfo = rooms.find(r => r.id === booking.roomId);
                      const isApproved = booking.status === "approved";
                      const isRejected = booking.status === "rejected";

                      return (
                        <div
                          key={booking.id}
                          className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-white/10 p-5 shadow-xs space-y-4 hover:border-indigo-500/40 transition-all"
                        >
                          {/* Card Header: Room + Status + Sequence */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                                #{idx + 1}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                  <Building className="w-4 h-4 text-indigo-500" />
                                  <span>{booking.roomName}</span>
                                </h4>
                                {roomInfo && roomInfo.location && (
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                    <MapPin className="w-3 h-3" />
                                    <span>{roomInfo.location}</span>
                                    {roomInfo.capacity && (
                                      <span>• {isLao ? `ຮອງຮັບ ${roomInfo.capacity} ບ່ອນນັ່ງ` : `Cap: ${roomInfo.capacity} seats`}</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 uppercase ${
                              isApproved 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs" 
                                : isRejected 
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" 
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 animate-pulse"
                            }`}>
                              {isApproved ? <CheckCircle className="w-3.5 h-3.5" /> : 
                               isRejected ? <XCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                              <span>
                                {booking.status === "approved" ? labels.statusApproved :
                                 booking.status === "rejected" ? labels.statusRejected : labels.statusPending}
                              </span>
                            </span>
                          </div>

                          {/* Meeting Title & Multi-Day banner */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              {labels.meetingTitle}:
                            </span>
                            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-relaxed">
                              {booking.title}
                            </h3>

                            {booking.endDate && booking.endDate !== booking.date && (
                              <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border border-indigo-500/20 w-fit">
                                <CalendarDays className="w-4 h-4 text-indigo-500" />
                                <span>
                                  {labels.multiDayMeeting}: {booking.date} → {booking.endDate}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Primary Metadata Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 text-xs">
                            
                            {/* Time Slot */}
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                {labels.time}
                              </span>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                {booking.startTime} - {booking.endTime}
                              </p>
                            </div>

                            {/* Booker & Department */}
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3 text-indigo-500" />
                                {labels.organizer}
                              </span>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                                {booking.userName}
                              </p>
                              <p className="text-[10px] text-slate-500 font-semibold truncate">
                                {booking.department}
                              </p>
                            </div>

                            {/* Attendees */}
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3 text-emerald-500" />
                                {labels.attendees}
                              </span>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                {booking.attendeesCount} {labels.people}
                              </p>
                            </div>

                          </div>

                          {/* Purpose / Agenda */}
                          {booking.purpose && (
                            <div className="space-y-1 bg-slate-50/70 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 text-xs">
                              <span className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1.5 uppercase">
                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                {labels.purpose}:
                              </span>
                              <p className="font-semibold text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
                                {booking.purpose}
                              </p>
                            </div>
                          )}

                          {/* Notes / Remarks */}
                          {booking.notes && (
                            <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-500/20 text-xs">
                              <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase">
                                <Info className="w-3.5 h-3.5" />
                                {labels.notes}:
                              </span>
                              <p className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic pl-5">
                                {booking.notes}
                              </p>
                            </div>
                          )}

                          {/* Attachment Document if present */}
                          {booking.attachmentName && booking.attachmentData && (
                            <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-500/20 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                                  <Paperclip className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[10px] font-bold text-slate-400 block">
                                    {labels.attachment}
                                  </span>
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate block">
                                    {booking.attachmentName}
                                  </span>
                                </div>
                              </div>

                              <a
                                href={booking.attachmentData}
                                download={booking.attachmentName}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-extrabold text-[11px] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{labels.downloadAttachment}</span>
                              </a>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] font-medium text-slate-500">
                {isLao ? `ວັນທີເລືອກ: ${formatDisplayDate(modalDateStr)}` : `Selected: ${formatDisplayDate(modalDateStr)}`}
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {onNavigateToBooking && (
                  <button
                    onClick={() => {
                      setIsDayModalOpen(false);
                      onNavigateToBooking();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer w-1/2 sm:w-auto justify-center"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{labels.bookForThisDay}</span>
                  </button>
                )}

                <button
                  onClick={() => setIsDayModalOpen(false)}
                  className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer w-1/2 sm:w-auto text-center"
                >
                  {labels.closeModal}
                </button>
              </div>
            </div>

          </div>

        </div>,
        document.body
      )}

    </div>
  );
}
