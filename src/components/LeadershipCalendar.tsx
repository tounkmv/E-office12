import React, { useState, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  ListOrdered, 
  CalendarDays,
  MoreHorizontal,
  Edit2,
  Trash2,
  X,
  Tag,
  Briefcase
} from "lucide-react";
import { 
  LeadershipActivity, 
  UserProfile, 
  AppLanguage, 
  ActivityCategory, 
  ActivityStatus 
} from "../types";
import { 
  getCategoryLabel, 
  getStatusLabel, 
  getPriorityLabel, 
  deleteLeadershipActivity,
  PROVINCIAL_DEPARTMENTS 
} from "../lib/activityHelper";
import LeadershipActivityForm from "./LeadershipActivityForm";

interface LeadershipCalendarProps {
  activities: LeadershipActivity[];
  userProfile: UserProfile;
  language: AppLanguage;
  onRefresh?: () => void;
}

export default function LeadershipCalendar({
  activities,
  userProfile,
  language,
  onRefresh
}: LeadershipCalendarProps) {
  const isLao = language === "lo";

  // Current Calendar state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">("month");

  // Filter states
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("all");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialDate, setFormInitialDate] = useState<string>("");
  const [editingActivity, setEditingActivity] = useState<LeadershipActivity | null>(null);
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<LeadershipActivity | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Week navigation
  const prevWeek = () => {
    const newD = new Date(currentDate);
    newD.setDate(newD.getDate() - 7);
    setCurrentDate(newD);
  };
  const nextWeek = () => {
    const newD = new Date(currentDate);
    newD.setDate(newD.getDate() + 7);
    setCurrentDate(newD);
  };

  // Format month and year
  const laoMonths = [
    "ມັງກອນ (1)", "ກຸມພາ (2)", "ມີນາ (3)", "ເມສາ (4)", "ພຶດສະພາ (5)", "ມິຖຸນາ (6)",
    "ກໍລະກົດ (7)", "ສິງຫາ (8)", "ກັນຍາ (9)", "ຕຸລາ (10)", "ພະຈິກ (11)", "ທັນວາ (12)"
  ];
  const enMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = isLao ? laoMonths[currentDate.getMonth()] : enMonths[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Extract unique users from activities
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach(a => {
      if (a.userName) map.set(a.userId, a.userName);
    });
    return Array.from(map.entries()).map(([userId, userName]) => ({ userId, userName }));
  }, [activities]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (selectedDept !== "all" && act.department !== selectedDept) return false;
      if (selectedCategory !== "all" && act.category !== selectedCategory) return false;
      if (selectedStatus !== "all" && act.status !== selectedStatus) return false;
      if (selectedUser !== "all" && act.userId !== selectedUser) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchUser = act.userName.toLowerCase().includes(q);
        const matchLoc = act.location.toLowerCase().includes(q);
        const matchDesc = (act.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchUser && !matchLoc && !matchDesc) return false;
      }
      return true;
    });
  }, [activities, selectedDept, selectedCategory, selectedStatus, selectedUser, searchQuery]);

  // Month Grid Calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    // Previous month padding
    for (let i = firstDayIndex; i > 0; i--) {
      const d = prevLastDate - i + 1;
      const prevMonthNum = month === 0 ? 12 : month;
      const prevYearNum = month === 0 ? year - 1 : year;
      const dateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // Current month days
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthNum = month === 11 ? 1 : month + 2;
      const nextYearNum = month === 11 ? year + 1 : year;
      const dateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    return days;
  }, [currentDate]);

  // Map activities by date string
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, LeadershipActivity[]>();
    filteredActivities.forEach(act => {
      // Activity may span from startDate to endDate
      const start = act.startDate;
      const end = act.endDate || act.startDate;

      // Add to start date
      if (!map.has(start)) map.set(start, []);
      map.get(start)!.push(act);

      // If span is more than 1 day
      if (end !== start) {
        if (!map.has(end)) map.set(end, []);
        if (!map.get(end)!.some(a => a.id === act.id)) {
          map.get(end)!.push(act);
        }
      }
    });
    return map;
  }, [filteredActivities]);

  // Week View Days calculation (Mon to Sun)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(curr.setDate(diff));

    const days: { dateStr: string; dayNum: number; monthName: string; dayName: string; isToday: boolean }[] = [];
    const laoDayNames = ["ຈັນ", "ອັງຄານ", "ພຸດ", "ພະຫັດ", "ສຸກ", "ເສົາ", "ອາທິດ"];
    const enDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const todayStr = new Date().toISOString().split("T")[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        dateStr,
        dayNum: d.getDate(),
        monthName: isLao ? laoMonths[d.getMonth()].split(" ")[0] : enMonths[d.getMonth()].slice(0, 3),
        dayName: isLao ? laoDayNames[i] : enDayNames[i],
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [currentDate, isLao]);

  // KPI calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = activities.filter(a => a.startDate <= todayStr && a.endDate >= todayStr).length;
  const inProgressCount = activities.filter(a => a.status === "in_progress").length;
  const completedCount = activities.filter(a => a.status === "completed").length;
  const totalCount = activities.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteLeadershipActivity(id);
      setSelectedActivityForDetail(null);
      setShowDeleteConfirm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Delete activity error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const dayHeaderNames = isLao 
    ? ["ອາທິດ", "ຈັນ", "ອັງຄານ", "ພຸດ", "ພະຫັດ", "ສຸກ", "ເສົາ"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner with Provincial Emblem & Leadership Concept */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-[11px] font-black text-amber-300 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLao ? "ລະບົບປະຕິທິນການເຄື່ອນໄຫວວຽກງານ" : "Executive Duty & Mission Calendar"}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isLao ? "ປະຕິທິນຕິດຕາມການເຄື່ອນໄຫວວຽກຂອງຄະນະ & ຫົວໜ້າພະແນກ/ຂະແໜງ" : "Leadership & Department Duty Calendar"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
                {isLao 
                  ? "ຕິດຕາມກວດກາຕາຕະລາງປະຊຸມ, ລົງເຄື່ອນໄຫວຮາກຖານ, ພາລະກິດ ແລະ ວຽກງານຈຸດສຸມ ຂອງບັນດາຄະນະນຳ ແລະ ຫົວໜ້າຂະແໜງ" 
                  : "Track, inspect, and coordinate all meetings, provincial missions, field inspections, and official tasks."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setEditingActivity(null);
                setFormInitialDate(new Date().toISOString().split("T")[0]);
                setIsFormOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>{isLao ? "ເພີ່ມວຽກໃໝ່ (+)" : "Add Activity"}</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ວຽກມື້ນີ້" : "Today's Work"}</span>
            <span className="text-lg font-black text-amber-300">{todayCount} {isLao ? "ວຽກ" : "tasks"}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ພວມຈັດຕັ້ງປະຕິບັດ" : "In Progress"}</span>
            <span className="text-lg font-black text-indigo-300">{inProgressCount} {isLao ? "ວຽກ" : "tasks"}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ສຳເລັດແລ້ວ" : "Completed"}</span>
            <span className="text-lg font-black text-emerald-300">{completedCount} {isLao ? "ວຽກ" : "tasks"}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ອັດຕາຄວາມສຳເລັດ" : "Completion Rate"}</span>
            <span className="text-lg font-black text-cyan-300">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Control Bar: View Switcher, Navigation, Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Top Controls: Nav & View Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Month / Week Title & Date Navigation */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200/60 dark:border-slate-700">
              <button
                onClick={viewMode === "week" ? prevWeek : prevMonth}
                className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title={isLao ? "ກ່ອນໜ້າ" : "Previous"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {isLao ? "ມື້ນີ້" : "Today"}
              </button>
              <button
                onClick={viewMode === "week" ? nextWeek : nextMonth}
                className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title={isLao ? "ຖັດໄປ" : "Next"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white px-2">
              {currentMonthName} {currentYear}
            </h2>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === "month"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isLao ? "ລາຍເດືອນ" : "Month"}
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === "week"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isLao ? "ລາຍອາທິດ" : "Week"}
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === "agenda"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isLao ? "ວາລະວຽກ (Agenda)" : "Agenda"}
            </button>
          </div>
        </div>

        {/* Filter Bar: Department, User, Category, Status, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
          
          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">{isLao ? "ທຸກພະແນກ / ຂະແໜງ" : "All Departments"}</option>
              {PROVINCIAL_DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* User / Leader Filter */}
          <div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">{isLao ? "ທຸກຄະນະ & ຫົວໜ້າ" : "All Leaders / Staff"}</option>
              {uniqueUsers.map(u => (
                <option key={u.userId} value={u.userId}>{u.userName}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">{isLao ? "ທຸກປະເພດວຽກ" : "All Categories"}</option>
              <option value="meeting">{isLao ? "ກອງປະຊຸມ" : "Meeting"}</option>
              <option value="mission">{isLao ? "ລົງເຄື່ອນໄຫວ/ພາລະກິດ" : "Mission"}</option>
              <option value="inspection">{isLao ? "ລົງກວດກາ/ຕິດຕາມວຽກ" : "Inspection"}</option>
              <option value="ceremony">{isLao ? "ພິທີການ/ຕ້ອນຮັບ" : "Ceremony"}</option>
              <option value="internal">{isLao ? "ວຽກພາຍໃນຫ້ອງການ" : "Internal Office"}</option>
              <option value="training">{isLao ? "ຝຶກອົບຮົມ/ສຳມະນາ" : "Training"}</option>
              <option value="other">{isLao ? "ວຽກອື່ນໆ" : "Other"}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">{isLao ? "ທຸກສະຖານະ" : "All Status"}</option>
              <option value="scheduled">{isLao ? "ມີແຜນກຳນົດ" : "Scheduled"}</option>
              <option value="in_progress">{isLao ? "ພວມປະຕິບັດ" : "In Progress"}</option>
              <option value="completed">{isLao ? "ສຳເລັດແລ້ວ" : "Completed"}</option>
              <option value="cancelled">{isLao ? "ຍົກເລີກ" : "Cancelled"}</option>
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isLao ? "ຄົ້ນຫາວຽກ, ສະຖານທີ່, ຊື່..." : "Search..."}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. MONTH VIEW */}
      {/* ========================================================================= */}
      {viewMode === "month" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          
          {/* Day Headers (Sun - Sat) */}
          <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center text-xs font-black text-slate-600 dark:text-slate-400 py-3">
            {dayHeaderNames.map((name, i) => (
              <div key={i} className={i === 0 ? "text-rose-500" : ""}>
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {calendarDays.map((day, idx) => {
              const dayActivities = activitiesByDate.get(day.dateStr) || [];

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setEditingActivity(null);
                    setFormInitialDate(day.dateStr);
                    setIsFormOpen(true);
                  }}
                  className={`min-h-[110px] sm:min-h-[130px] p-2 transition-colors cursor-pointer group flex flex-col justify-between ${
                    day.isCurrentMonth
                      ? "bg-white dark:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                      : "bg-slate-50/60 dark:bg-slate-950/30 text-slate-400"
                  } ${day.isToday ? "ring-2 ring-indigo-500/60 ring-inset bg-indigo-50/20 dark:bg-indigo-950/10" : ""}`}
                >
                  {/* Top Day Number & Add Button */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black rounded-lg w-6 h-6 flex items-center justify-center ${
                        day.isToday
                          ? "bg-indigo-600 text-white shadow-sm"
                          : day.isCurrentMonth
                          ? "text-slate-700 dark:text-slate-200"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {dayActivities.length > 0 && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {dayActivities.length}
                      </span>
                    )}
                  </div>

                  {/* Activity Pills */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] no-scrollbar">
                    {dayActivities.slice(0, 3).map((act) => {
                      const cat = getCategoryLabel(act.category, isLao);
                      const stat = getStatusLabel(act.status, isLao);

                      return (
                        <div
                          key={act.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActivityForDetail(act);
                          }}
                          className={`text-[10px] p-1.5 rounded-xl border ${cat.bg} ${cat.border} transition-all hover:scale-[1.02] shadow-xs cursor-pointer truncate`}
                          title={`${act.time ? act.time + " " : ""}${act.title} (${act.userName})`}
                        >
                          <div className="flex items-center gap-1 font-bold truncate">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stat.dot}`} />
                            <span className={`${cat.color} font-black truncate`}>{act.title}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate flex items-center justify-between mt-0.5">
                            <span>{act.startTime}</span>
                            <span className="truncate max-w-[70px]">{act.userName.split(" ")[0]}</span>
                          </div>
                        </div>
                      );
                    })}

                    {dayActivities.length > 3 && (
                      <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 text-center py-0.5">
                        +{dayActivities.length - 3} {isLao ? "ວຽກອື່ນໆ" : "more"}
                      </div>
                    )}
                  </div>

                  {/* Hover hint */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-right">
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">+ {isLao ? "ເພີ່ມ" : "Add"}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEEK VIEW */}
      {/* ========================================================================= */}
      {viewMode === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((wDay) => {
            const dayActs = activitiesByDate.get(wDay.dateStr) || [];

            return (
              <div 
                key={wDay.dateStr}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-3 flex flex-col min-h-[300px] shadow-sm ${
                  wDay.isToday 
                    ? "border-indigo-500/80 ring-2 ring-indigo-500/20" 
                    : "border-slate-200/80 dark:border-slate-800"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-black uppercase text-slate-400 block">{wDay.dayName}</span>
                    <span className={`text-base font-black ${wDay.isToday ? "text-indigo-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                      {wDay.dayNum} {wDay.monthName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingActivity(null);
                      setFormInitialDate(wDay.dateStr);
                      setIsFormOpen(true);
                    }}
                    className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                    title={isLao ? "ເພີ່ມວຽກໃນມື້ນີ້" : "Add task on this day"}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day's Activities list */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {dayActs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      {isLao ? "ບໍ່ມີວຽກກຳນົດ" : "No activities"}
                    </div>
                  ) : (
                    dayActs.map(act => {
                      const cat = getCategoryLabel(act.category, isLao);
                      const stat = getStatusLabel(act.status, isLao);

                      return (
                        <div
                          key={act.id}
                          onClick={() => setSelectedActivityForDetail(act)}
                          className={`p-2.5 rounded-2xl border ${cat.bg} ${cat.border} transition-all hover:shadow-md cursor-pointer space-y-1.5`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {act.startTime} - {act.endTime}
                            </span>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${stat.dot}`} />
                          </div>

                          <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2">
                            {act.title}
                          </h4>

                          <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 truncate">
                            <User className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">{act.userName}</span>
                          </div>

                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">{act.location}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AGENDA / TIMELINE VIEW */}
      {/* ========================================================================= */}
      {viewMode === "agenda" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-indigo-600" />
              <span>{isLao ? "ວາລະວຽກງານ ແລະ ແຜນການເຄື່ອນໄຫວທັງໝົດ" : "Full Activities Agenda"}</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {isLao ? `ທັງໝົດ ${filteredActivities.length} ລາຍການ` : `${filteredActivities.length} records`}
            </span>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              {isLao ? "ບໍ່ພົບຂໍ້ມູນການເຄື່ອນໄຫວຕາມເງື່ອນໄຂທີ່ຄົ້ນຫາ" : "No activities match your filters"}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredActivities
                .sort((a, b) => b.startDate.localeCompare(a.startDate))
                .map((act) => {
                  const cat = getCategoryLabel(act.category, isLao);
                  const stat = getStatusLabel(act.status, isLao);
                  const pri = getPriorityLabel(act.priority, isLao);

                  return (
                    <div
                      key={act.id}
                      onClick={() => setSelectedActivityForDetail(act)}
                      className="py-3.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-3 rounded-2xl ${cat.bg} ${cat.border} border shrink-0 text-center min-w-[65px]`}>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            {act.startDate.split("-")[2]}/{act.startDate.split("-")[1]}
                          </span>
                          <span className="text-xs font-black text-slate-800 dark:text-white">
                            {act.startTime}
                          </span>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cat.bg} ${cat.color} ${cat.border}`}>
                              {cat.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pri.badge}`}>
                              {pri.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stat.bg} ${stat.color} ${stat.border}`}>
                              {stat.label}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {act.title}
                          </h4>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {act.userName} ({act.roleTitle || act.department})
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {act.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActivityForDetail(act);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                        >
                          {isLao ? "ລາຍລະອຽດ" : "View"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTIVITY DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedActivityForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {isLao ? "ລາຍລະອຽດການເຄື່ອນໄຫວວຽກ" : "Activity Details"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedActivityForDetail.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivityForDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const cat = getCategoryLabel(selectedActivityForDetail.category, isLao);
                  const stat = getStatusLabel(selectedActivityForDetail.status, isLao);
                  const pri = getPriorityLabel(selectedActivityForDetail.priority, isLao);
                  return (
                    <>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${cat.bg} ${cat.color} ${cat.border}`}>
                        {cat.label}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${stat.bg} ${stat.color} ${stat.border}`}>
                        {stat.label}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${pri.badge}`}>
                        {pri.label}
                      </span>
                    </>
                  );
                })()}
              </div>

              {/* Title */}
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                {selectedActivityForDetail.title}
              </h2>

              {/* Key details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">{isLao ? "ຜູ້ຮັບຜິດຊອບ / ຄະນະ" : "Person In Charge"}</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">
                    {selectedActivityForDetail.userName}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {selectedActivityForDetail.roleTitle || selectedActivityForDetail.department}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">{isLao ? "ສະຖານທີ່" : "Location"}</span>
                  <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {selectedActivityForDetail.location}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">{isLao ? "ວັນທີ" : "Date"}</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">
                    {selectedActivityForDetail.startDate}
                    {selectedActivityForDetail.endDate !== selectedActivityForDetail.startDate ? ` - ${selectedActivityForDetail.endDate}` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">{isLao ? "ເວລາ" : "Time"}</span>
                  <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {selectedActivityForDetail.startTime} - {selectedActivityForDetail.endTime}
                  </span>
                </div>
              </div>

              {/* Participants */}
              {selectedActivityForDetail.participants && (
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">
                    {isLao ? "ຄະນະເຂົ້າຮ່ວມ / ຜູ້ຕິດຕາມ" : "Participants"}
                  </span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    {selectedActivityForDetail.participants}
                  </p>
                </div>
              )}

              {/* Description */}
              {selectedActivityForDetail.description && (
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">
                    {isLao ? "ເນື້ອໃນ / ລາຍລະອຽດວຽກ" : "Description"}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 whitespace-pre-wrap">
                    {selectedActivityForDetail.description}
                  </p>
                </div>
              )}

              {/* Outcome */}
              {selectedActivityForDetail.outcome && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {isLao ? "ຜົນການຈັດຕັ້ງປະຕິບັດ / ຂໍ້ສະຫຼຸບ" : "Outcome / Summary"}
                  </span>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                    {selectedActivityForDetail.outcome}
                  </p>
                </div>
              )}

            </div>

            {/* Footer / Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              
              {/* Delete button (Admin or Creator) with inline confirmation */}
              {(userProfile.role === "admin" || userProfile.uid === selectedActivityForDetail.userId) ? (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 px-1">
                      {isLao ? "ແນ່ໃຈບໍ່?" : "Sure?"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedActivityForDetail.id)}
                      disabled={deletingId === selectedActivityForDetail.id}
                      className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black cursor-pointer shadow-xs"
                    >
                      {deletingId === selectedActivityForDetail.id ? (isLao ? "ກຳລັງລຶບ..." : "Deleting...") : (isLao ? "ຢືນຢັນລຶບ" : "Confirm")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold cursor-pointer"
                    >
                      {isLao ? "ຍົກເລີກ" : "Cancel"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isLao ? "ລຶບວຽກ" : "Delete"}</span>
                  </button>
                )
              ) : <div />}

              <div className="flex items-center gap-2">
                {(userProfile.role === "admin" || userProfile.uid === selectedActivityForDetail.userId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingActivity(selectedActivityForDetail);
                      setSelectedActivityForDetail(null);
                      setIsFormOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isLao ? "ແກ້ໄຂ" : "Edit"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedActivityForDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  {isLao ? "ປິດ" : "Close"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE / EDIT ACTIVITY FORM MODAL */}
      <LeadershipActivityForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingActivity(null);
        }}
        userProfile={userProfile}
        language={language}
        activityToEdit={editingActivity}
        initialDate={formInitialDate}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

    </div>
  );
}
