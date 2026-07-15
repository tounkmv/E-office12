import { useState } from "react";
import { 
  BarChart as BarIcon, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Building,
  ArrowRight,
  TrendingUp,
  Inbox,
  Clock,
  Briefcase,
  FileText,
  LayoutDashboard,
  Sparkles,
  Printer,
  FileSpreadsheet,
  Filter,
  CalendarDays,
  Award,
  X,
  Check,
  Eye,
  Settings
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { AppLanguage, RoomBooking, MeetingRoom } from "../types";
import { translations } from "../lib/translations";
import { motion } from "motion/react";
import DashboardCalendar from "./DashboardCalendar";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";

interface DashboardProps {
  bookings: RoomBooking[];
  rooms: MeetingRoom[];
  language: AppLanguage;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ bookings, rooms, language, setActiveTab }: DashboardProps) {
  const t = translations[language];
  const isLao = language === "lo";

  // Calculations
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const approvedBookings = bookings.filter(b => b.status === "approved").length;
  const activeRooms = rooms.filter(r => r.status === "active").length;

  // Filter today's meetings (supporting multi-day meeting date ranges)
  const todayStr = new Date().toISOString().split("T")[0];
  const todayMeetings = bookings.filter(b => b.date <= todayStr && (b.endDate || b.date) >= todayStr && b.status === "approved");

  // Reporting States & Helpers
  const [reportPeriod, setReportPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [reportDate, setReportDate] = useState(todayStr);
  const [reportRoomId, setReportRoomId] = useState<string>("all");
  const [reportStatus, setReportStatus] = useState<string>("all");

  // Official Document Print Configuration States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [docNumber, setDocNumber] = useState("໑໔໒/ຫວກ.ຮພ");
  const [provinceName, setProvinceName] = useState("ແຂວງຫົວພັນ");
  const [officeNameState, setOfficeNameState] = useState("ຫ້ອງວ່າການແຂວງຫົວພັນ");
  const [compilerName, setCompilerName] = useState("ທ້າວ ຄຳມັ້ນ ແກ້ວປະເສີດ");
  const [compilerTitle, setCompilerTitle] = useState("ວິຊາການ ຂະແໜງເຕັກໂນໂລຊີ");
  const [approverName, setApproverName] = useState("ທ່ານ ປອ. ສົມພອນ ແກ້ວມະນີ");
  const [approverTitle, setApproverTitle] = useState("ຫົວໜ້າຫ້ອງວ່າການແຂວງຫົວພັນ");
  const [showSeal, setShowSeal] = useState(true);
  const [showDistribution, setShowDistribution] = useState(true);
  const [docDate, setDocDate] = useState(todayStr);
  const formattedDocDate = (() => {
    if (!docDate) return "";
    const parts = docDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return docDate;
  })();
  const [customPreface, setCustomPreface] = useState(
    isLao
      ? "ອີງຕາມສະຖິຕິການນຳໃຊ້ຫ້ອງປະຊຸມຂອງຫ້ອງວ່າການແຂວງຫົວພັນ, ຂະແໜງເຕັກໂນໂລຊີ ແລະ ຂໍ້ມູນຂ່າວສານ ຂໍສັງລວມບົດລາຍງານການຈອງຫ້ອງປະຊຸມ ດັ່ງນີ້:"
      : "Based on the meeting room usage statistics of the Houaphanh Provincial Office, the Technology and Information Division summarizes the booking report as follows:"
  );

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
    const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    return diffMinutes > 0 ? Number((diffMinutes / 60).toFixed(1)) : 0;
  };

  const getWeekRange = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return { start: "", end: "" };
    const day = dateObj.getDay(); // 0 is Sunday
    const diffToSun = dateObj.getDate() - day; // Adjust to Sunday
    
    const sunDate = new Date(dateObj.setDate(diffToSun));
    const satDate = new Date(sunDate);
    satDate.setDate(sunDate.getDate() + 6);
    
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    return {
      start: formatDate(sunDate),
      end: formatDate(satDate)
    };
  };

  const filteredReportBookings = bookings.filter(b => {
    // Room Filter
    if (reportRoomId !== "all" && b.roomId !== reportRoomId) return false;
    
    // Status Filter
    if (reportStatus !== "all" && b.status !== reportStatus) return false;
    
    // Period Filter
    if (reportPeriod === "day") {
      return b.date === reportDate;
    } else if (reportPeriod === "week") {
      const { start, end } = getWeekRange(reportDate);
      return b.date >= start && b.date <= end;
    } else if (reportPeriod === "month") {
      const reportMonth = reportDate.substring(0, 7); // YYYY-MM
      return b.date.substring(0, 7) === reportMonth;
    } else if (reportPeriod === "year") {
      const reportYear = reportDate.substring(0, 4); // YYYY
      return b.date.substring(0, 4) === reportYear;
    }
    return true;
  });

  // Calculate report metrics
  const rTotal = filteredReportBookings.length;
  const rApproved = filteredReportBookings.filter(b => b.status === "approved").length;
  const rPending = filteredReportBookings.filter(b => b.status === "pending").length;
  const rRejected = filteredReportBookings.filter(b => b.status === "rejected").length;
  const rTotalHours = filteredReportBookings.reduce((sum, b) => sum + calculateDuration(b.startTime, b.endTime), 0);

  const rRoomCount: Record<string, number> = {};
  filteredReportBookings.forEach(b => {
    rRoomCount[b.roomName] = (rRoomCount[b.roomName] || 0) + 1;
  });
  let rMostPopularRoom = "-";
  let rMaxRoomCount = 0;
  Object.entries(rRoomCount).forEach(([name, count]) => {
    if (count > rMaxRoomCount) {
      rMaxRoomCount = count;
      rMostPopularRoom = name;
    }
  });

  const rDeptCount: Record<string, number> = {};
  filteredReportBookings.forEach(b => {
    const dept = b.department || (isLao ? "ທົ່ວໄປ" : "General");
    rDeptCount[dept] = (rDeptCount[dept] || 0) + 1;
  });
  let rMostActiveDept = "-";
  let rMaxDeptCount = 0;
  Object.entries(rDeptCount).forEach(([name, count]) => {
    if (count > rMaxDeptCount) {
      rMaxDeptCount = count;
      rMostActiveDept = name;
    }
  });

  const triggerPrint = () => {
    window.print();
  };

  // Recent bookings (top 5)
  const recentBookings = bookings
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // Chart 1 Data: Bookings per room
  const bookingsPerRoom = rooms.map(room => {
    const count = bookings.filter(b => b.roomId === room.id).length;
    return {
      name: language === "lo" ? room.name.replace("ຫ້ອງປະຊຸມ", "ຫ້ອງ") : room.name,
      count: count
    };
  });

  // Chart 2 Data: Bookings Status Breakdown
  const statusData = [
    { name: t.bkStatusApproved, value: approvedBookings, color: "#10b981" },
    { name: t.bkStatusPending, value: pendingBookings, color: "#3b82f6" },
    { name: t.bkStatusRejected, value: bookings.filter(b => b.status === "rejected").length, color: "#ef4444" }
  ].filter(d => d.value > 0);

  return (
    <div id="dashboard-view" className="font-sans pb-12">
      <div className="print:hidden space-y-8">
      
      {/* HERO SECTION HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#312e81] via-[#1e1b4b] to-[#4338ca] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{isLao ? "ສູນລວມຂໍ້ມູນ ແລະ ການວິເຄາະສະຖິຕິ" : "Analytical Center & Live Statistics"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-amber-300 shrink-0" />
              <span>{isLao ? "ແຜງຄວບຄຸມລະບົບ (Dashboard)" : t.navDashboard}</span>
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-relaxed">
              {isLao 
                ? "ຍິນດີຕ້ອນຮັບເຂົ້າສູ່ລະບົບຈອງຫ້ອງປະຊຸມທັນສະໄໝ. ກວດສອບສະຖິຕິການຈອງ, ຄວາມຖີ່ໃນການນຳໃຊ້ຫ້ອງປະຊຸມ ແລະ ຕິດຕາມການຈອງປະຈຳວັນ." 
                : "Welcome to the modern meeting room reservation dashboard. Monitor suite utilization frequency, view schedules, and analyze stats."}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats Bento */}
      <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Bookings (Blue Tone) */}
        <motion.div 
          whileHover={{ y: -4 }}
          id="stat-total-bookings" 
          className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-white/5 border-t-4 border-t-blue-500 flex flex-col justify-between transition-all duration-300 min-h-[145px] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                {t.dbTotalBookings}
              </p>
              <h3 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {totalBookings}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: "100%" }} />
            </div>
            <span className="text-[10px] font-bold text-blue-500 uppercase">100%</span>
          </div>
        </motion.div>

        {/* Card 2: Pending Approval (Amber/Orange Tone) */}
        <motion.div 
          whileHover={{ y: -4 }}
          id="stat-pending-bookings" 
          className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-white/5 border-t-4 border-t-amber-500 flex flex-col justify-between transition-all duration-300 min-h-[145px] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                {t.dbPendingBookings}
              </p>
              <h3 className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">
                {pendingBookings}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${totalBookings > 0 ? (pendingBookings / totalBookings) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] font-bold text-amber-500 uppercase">{totalBookings > 0 ? Math.round((pendingBookings / totalBookings) * 100) : 0}%</span>
          </div>
        </motion.div>

        {/* Card 3: Approved Bookings (Emerald/Teal Tone) */}
        <motion.div 
          whileHover={{ y: -4 }}
          id="stat-approved-bookings" 
          className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-white/5 border-t-4 border-t-emerald-500 flex flex-col justify-between transition-all duration-300 min-h-[145px] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                {t.dbApprovedBookings}
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {approvedBookings}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${totalBookings > 0 ? (approvedBookings / totalBookings) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase">{totalBookings > 0 ? Math.round((approvedBookings / totalBookings) * 100) : 0}%</span>
          </div>
        </motion.div>

        {/* Card 4: Active Rooms (Violet/Purple Gradient Tone) */}
        <motion.div 
          whileHover={{ y: -4 }}
          id="stat-active-rooms" 
          className="p-6 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-800 text-white border-t-4 border-t-violet-400 flex flex-col justify-between transition-all duration-300 shadow-md shadow-indigo-500/15 min-h-[145px] relative overflow-hidden group"
        >
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-violet-200 text-xs font-bold uppercase tracking-wider mb-1">
                {t.dbActiveRooms}
              </p>
              <h3 className="text-2xl font-extrabold leading-tight">
                {activeRooms} {language === "lo" ? "ຫ້ອງພ້ອມໃຊ້" : "Rooms Active"}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm shrink-0">
              <Building className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4 flex gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 bg-white/25 rounded-full text-[10px] font-black backdrop-blur-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
              <span>Email Active</span>
            </span>
            <span className="px-2.5 py-0.5 bg-white/25 rounded-full text-[10px] font-black backdrop-blur-xs">App Alert</span>
          </div>
        </motion.div>

      </div>

      {/* Main Grid: Visual Analytics & Today's Meetings */}
      <div id="main-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Visual Analytics Recharts Card (Blue/Cyan Header Theme) */}
        <div id="chart-panel" className="lg:col-span-8 bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-white/5 border-t-4 border-t-blue-500 space-y-6">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-4 sm:p-5 rounded-2xl shadow-md text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm shrink-0">
                <TrendingUp className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  {t.dbRoomStats}
                </h3>
                <p className="text-[11px] text-blue-100 font-medium">
                  {language === "lo" ? "ສະຖິຕິການຈອງ ແລະ ສະຖານະການນຳໃຊ້ຫ້ອງປະຊຸມ" : "Room booking statistics & usage breakdown"}
                </p>
              </div>
            </div>
            <span className="text-xs text-white font-bold bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-xs shrink-0">
              {language === "lo" ? "ຂໍ້ມູນອັບເດດ Real-time" : "Real-time Analytics"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[280px]">
            {/* Bar Chart */}
            <div className="md:col-span-8 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsPerRoom} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(15, 23, 42, 0.9)", 
                      borderRadius: "12px", 
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff"
                    }} 
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="md:col-span-4 h-full flex flex-col justify-center items-center">
              {statusData.length === 0 ? (
                <div className="text-center py-8 text-xs opacity-60">
                  {t.noData}
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend Custom */}
                  <div className="text-[11px] space-y-1.5 w-full px-4">
                    {statusData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 opacity-80 font-semibold">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-mono font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Today's Meetings Sidebar (Violet/Purple Header Theme) */}
        <div id="today-meetings-panel" className="lg:col-span-4 bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-white/5 border-t-4 border-t-violet-500 flex flex-col max-h-[440px]">
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-4 rounded-2xl shadow-md text-white flex items-center justify-between gap-3 mb-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm shrink-0">
                <Calendar className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-base text-white tracking-tight truncate">
                  {t.dbTodayMeetings}
                </h3>
                <p className="text-[10px] text-violet-100 font-medium truncate">
                  {language === "lo" ? "ກອງປະຊຸມມື້ນີ້" : "Scheduled today"}
                </p>
              </div>
            </div>
            <span className="text-xs bg-white text-violet-700 px-3 py-1 rounded-full font-black shadow-sm shrink-0">
              {todayMeetings.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {todayMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-60 h-full">
                <Inbox className="w-10 h-10 mb-2 text-slate-400" />
                <p className="text-xs font-semibold">{t.dbNoMeetingToday}</p>
              </div>
            ) : (
              todayMeetings.map((meeting) => (
                <div key={meeting.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-0.5 rounded-full">
                      {meeting.startTime} - {meeting.endTime}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                      {meeting.roomName.split(" ")[0]}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs line-clamp-1 mb-1 text-slate-800 dark:text-slate-100">
                    {meeting.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    <Users className="w-3.5 h-3.5" />
                    <span>{meeting.userName} ({meeting.department})</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Calendar Section */}
      <DashboardCalendar 
        bookings={bookings} 
        rooms={rooms} 
        language={language} 
      />

      {/* 2. MODERN INTERACTIVE REPORTING & STATISTICS SYSTEM */}
      <div id="reporting-panel" className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-white/5 border-t-4 border-t-indigo-500 space-y-6">
        
        {/* Banner header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 sm:p-5 rounded-2xl shadow-md text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                {t.rpTitle || "ລະບົບລາຍງານ ແລະ ສະຫຼຸບສະຖິຕິ"}
              </h3>
              <p className="text-[11px] text-indigo-100 font-medium">
                {isLao ? "ສະຫຼຸບຜົນການຈອງເປັນລາຍວັນ, ອາທິດ, ເດືອນ, ປີ ແລະ ສັ່ງພິມເອກະສານໄດ້ທັນທີ" : "Summarize bookings by day, week, month, year, and export/print instantly"}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-indigo-700 active:scale-95 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer shrink-0 group"
          >
            <Printer className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span>{t.rpPrint || "ພິມລາຍງານສະຫຼຸບ"}</span>
          </button>
        </div>

        {/* Filters Box */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
          
          {/* Period selector tabs */}
          <div className="md:col-span-4 flex flex-col space-y-1.5">
            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isLao ? "ຮູບແບບການສະຫຼຸບ" : "Summary Period"}</span>
            </label>
            <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
              {(["day", "week", "month", "year"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setReportPeriod(period)}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all text-center cursor-pointer capitalize ${
                    reportPeriod === period
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {period === "day" ? (isLao ? "ລາຍວັນ" : "Day") :
                   period === "week" ? (isLao ? "ອາທິດ" : "Week") :
                   period === "month" ? (isLao ? "ລາຍເດືອນ" : "Month") :
                   (isLao ? "ລາຍປີ" : "Year")}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div className="md:col-span-3 flex flex-col space-y-1.5">
            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">
              {isLao ? "ວັນທີ / ເດືອນ / ປີ ທີ່ອ້າງອີງ" : "Reference Date"}
            </label>
            {reportPeriod === "year" ? (
              <select
                value={reportDate.substring(0, 4)}
                onChange={(e) => setReportDate(`${e.target.value}-01-01`)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 6 }, (_, i) => 2024 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            ) : reportPeriod === "month" ? (
              <input
                type="month"
                value={reportDate.substring(0, 7)}
                onChange={(e) => setReportDate(`${e.target.value}-01`)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* Room filter */}
          <div className="md:col-span-3 flex flex-col space-y-1.5">
            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t.rpRoomFilter || "ເລືອກຫ້ອງປະຊຸມ"}</span>
            </label>
            <select
              value={reportRoomId}
              onChange={(e) => setReportRoomId(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{isLao ? "ທຸກຫ້ອງປະຊຸມ" : "All Meeting Rooms"}</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="md:col-span-2 flex flex-col space-y-1.5">
            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">
              {t.rpStatusFilter || "ເລືອກສະຖານະ"}
            </label>
            <select
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{isLao ? "ທຸກສະຖານະ" : "All Status"}</option>
              <option value="approved">{t.bkStatusApproved}</option>
              <option value="pending">{t.bkStatusPending}</option>
              <option value="rejected">{t.bkStatusRejected}</option>
            </select>
          </div>

        </div>

        {/* Period descriptive title badge */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
            <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
              {isLao ? "ບົດລາຍງານຜົນສັງລວມ" : "Period Summary Result"}:{" "}
              <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-500/30 underline-offset-4">
                {reportPeriod === "day" && `${isLao ? "ວັນທີ" : "Date"} ${reportDate}`}
                {reportPeriod === "week" && `${isLao ? "ອາທິດຂອງວັນທີ" : "Week of"} ${getWeekRange(reportDate).start} → ${getWeekRange(reportDate).end}`}
                {reportPeriod === "month" && `${isLao ? "ເດືອນ" : "Month"} ${reportDate.substring(0, 7)}`}
                {reportPeriod === "year" && `${isLao ? "ປີ" : "Year"} ${reportDate.substring(0, 4)}`}
              </span>
            </h4>
          </div>
          <span className="text-[11px] font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
            {rTotal} {isLao ? "ລາຍການພົບເຫັນ" : "found"}
          </span>
        </div>

        {/* Dynamic Micro Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1 uppercase tracking-wider">{isLao ? "ຈຳນວນຈອງທັງໝົດ" : "Total Bookings"}</span>
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{rTotal}</span>
          </div>

          <div className="bg-emerald-500/5 p-3.5 rounded-2xl border border-emerald-500/10 text-center">
            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 font-bold block mb-1 uppercase tracking-wider">{t.bkStatusApproved}</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{rApproved}</span>
          </div>

          <div className="bg-blue-500/5 p-3.5 rounded-2xl border border-blue-500/10 text-center">
            <span className="text-[10px] text-blue-600/70 dark:text-blue-400/60 font-bold block mb-1 uppercase tracking-wider">{t.bkStatusPending}</span>
            <span className="text-xl font-extrabold text-blue-500 dark:text-blue-400">{rPending}</span>
          </div>

          <div className="bg-purple-500/5 p-3.5 rounded-2xl border border-purple-500/10 text-center col-span-1">
            <span className="text-[10px] text-purple-600/70 dark:text-purple-400/60 font-bold block mb-1 uppercase tracking-wider leading-tight truncate">{t.rpPopularRoom || "ຫ້ອງທີ່ໃຊ້ຫຼາຍສຸດ"}</span>
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 block truncate mt-1">{rMostPopularRoom}</span>
          </div>

          <div className="bg-pink-500/5 p-3.5 rounded-2xl border border-pink-500/10 text-center col-span-2 md:col-span-1 lg:col-span-1">
            <span className="text-[10px] text-pink-600/70 dark:text-pink-400/60 font-bold block mb-1 uppercase tracking-wider leading-tight truncate">{t.rpActiveDept || "ພາກສ່ວນຈອງຫຼາຍສຸດ"}</span>
            <span className="text-xs font-black text-pink-600 dark:text-pink-400 block truncate mt-1">{rMostActiveDept}</span>
          </div>

        </div>

        {/* Mini report bookings table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-white/5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5">
                <th className="py-2.5 px-4">{t.rmRoomName}</th>
                <th className="py-2.5 px-4">{t.bkMeetingTitle}</th>
                <th className="py-2.5 px-4">{t.bkDate}</th>
                <th className="py-2.5 px-4">{t.dbTimeRange}</th>
                <th className="py-2.5 px-4">{t.bkDepartment}</th>
                <th className="py-2.5 px-4">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredReportBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center opacity-60 font-bold text-slate-500">
                    {t.noData}
                  </td>
                </tr>
              ) : (
                filteredReportBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-500/5">
                    <td className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300">{booking.roomName}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{booking.title}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-600 dark:text-slate-400">{booking.date}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400">{booking.startTime} - {booking.endTime}</td>
                    <td className="py-2.5 px-4 font-bold text-indigo-500 dark:text-indigo-400">{booking.department || (isLao ? "ທົ່ວໄປ" : "General")}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                        booking.status === "approved" 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : booking.status === "rejected" 
                          ? "bg-red-500/10 text-red-500 border-red-500/20" 
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      }`}>
                        {booking.status === "approved" ? t.bkStatusApproved :
                         booking.status === "rejected" ? t.bkStatusRejected : t.bkStatusPending}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Recent Bookings Live Log Section (Emerald/Teal Header Theme) */}
      <div id="recent-bookings-panel" className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-white/5 border-t-4 border-t-emerald-500">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 sm:p-5 rounded-2xl shadow-md text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                {t.dbRecentBookings}
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                {language === "lo" ? "ລາຍການຈອງຫ້ອງປະຊຸມລ່າສຸດໃນລະບົບ" : "Latest room booking requests in the system"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("booking")}
            className="text-xs bg-white text-emerald-700 hover:bg-emerald-50 font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer shrink-0"
          >
            <span>{t.bkBookRoom}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3 border-b border-slate-100 dark:border-white/5">
                <th className="py-3 px-4 rounded-l-xl">{t.rmRoomName}</th>
                <th className="py-3 px-4">{t.bkMeetingTitle}</th>
                <th className="py-3 px-4">{t.bkDate}</th>
                <th className="py-3 px-4">{t.dbTimeRange}</th>
                <th className="py-3 px-4">{t.usrDisplayName}</th>
                <th className="py-3 px-4 rounded-r-xl">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center opacity-60 font-semibold">
                    {t.noData}
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {booking.roomName}
                    </td>
                    <td className="py-3.5 px-4 opacity-90 font-medium">
                      <div className="flex flex-col">
                        <span>{booking.title}</span>
                        {booking.attachmentName && booking.attachmentData && (
                          <a 
                            href={booking.attachmentData}
                            download={booking.attachmentName}
                            className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-bold flex items-center gap-1 mt-1 cursor-pointer w-fit"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            <span className="underline">{booking.attachmentName}</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 opacity-80 font-semibold">
                      {booking.endDate && booking.endDate !== booking.date ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                          {booking.date} → {booking.endDate}
                        </span>
                      ) : (
                        booking.date
                      )}
                    </td>
                    <td className="py-3.5 px-4 opacity-80 font-semibold">
                      {booking.startTime} - {booking.endTime}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold opacity-90">{booking.userName}</span>
                        <span className="text-[10px] text-blue-500 font-extrabold flex items-center gap-1 mt-0.5">
                          <span>{booking.department || (language === "lo" ? "ທົ່ວໄປ" : "General")}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        booking.status === "approved" 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : booking.status === "rejected" 
                          ? "bg-red-500/10 text-red-500 border-red-500/20" 
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse"
                      }`}>
                        {booking.status === "approved" ? t.bkStatusApproved :
                         booking.status === "rejected" ? t.bkStatusRejected : t.bkStatusPending}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      </div> {/* Closing of print:hidden */}

      {/* 3. OFFICIAL LAO REPORT CONFIGURATOR & PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:hidden">
          <div className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-7xl flex flex-col h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Printer className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-base sm:text-lg">
                    {isLao ? "ປັບແຕ່ງ ແລະ ພິມລາຍງານສະຫຼຸບທາງການ" : "Official Report Customizer"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {isLao ? "ປັບແຕ່ງຂໍ້ມູນຫົວຂໍ້, ເລກທີເອກະສານ, ຜູ້ລົງລາຍເຊັນ ແລະ ກວດສອບໃບຕົວຢ່າງກ່ອນສັ່ງພິມ" : "Configure titles, references, sign-offs, and inspect live preview"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Left Form, Right Document Preview) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              
              {/* Left Column: Config Form */}
              <div className="lg:col-span-5 p-5 sm:p-6 overflow-y-auto space-y-6 bg-white dark:bg-[#131b2e] border-r border-slate-200 dark:border-white/5">
                
                {/* Section I: Admin Metadata */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-1">
                    <Building className="w-4 h-4" />
                    <span>{isLao ? "1. ຂໍ້ມູນສະຖາບັນ & ເລກທີເອກະສານ" : "1. Organization & Document Refs"}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ແຂວງອ້າງອີງ" : "Province Name"}</label>
                      <input
                        type="text"
                        value={provinceName}
                        onChange={(e) => setProvinceName(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຫ້ອງການ / ພະແນກ" : "Office/Department"}</label>
                      <input
                        type="text"
                        value={officeNameState}
                        onChange={(e) => setOfficeNameState(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ເລກທີເອກະສານ" : "Document Reference Number"}</label>
                      <input
                        type="text"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ວັນທີສະຫຼຸບ" : "Reference Date"}</label>
                      <input
                        type="date"
                        value={docDate}
                        onChange={(e) => setDocDate(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section II: Signatories */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-1">
                    <Users className="w-4 h-4" />
                    <span>{isLao ? "2. ຜູ້ລົງນາມ & ວິຊາການ" : "2. Signatures & Staff"}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ສະຫຼຸບລາຍງານ" : "Compiler Name"}</label>
                      <input
                        type="text"
                        value={compilerName}
                        onChange={(e) => setCompilerName(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ສະຫຼຸບ" : "Compiler Title"}</label>
                      <input
                        type="text"
                        value={compilerTitle}
                        onChange={(e) => setCompilerTitle(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ມີອຳນາດອະນຸມັດ" : "Approver Name"}</label>
                      <input
                        type="text"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ອະນຸມັດ" : "Approver Title"}</label>
                      <input
                        type="text"
                        value={approverTitle}
                        onChange={(e) => setApproverTitle(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section III: Custom Preface Paragraph */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-1">
                    <FileText className="w-4 h-4" />
                    <span>{isLao ? "3. ຄຳກ່າວເບື້ອງຕົ້ນ / ບົດນຳ" : "3. Introduction/Preface Paragraph"}</span>
                  </h4>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຄຳເກີ່ນນຳໃນເອກະສານ" : "Preface text paragraph"}</label>
                    <textarea
                      value={customPreface}
                      onChange={(e) => setCustomPreface(e.target.value)}
                      rows={3}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-none"
                    />
                  </div>
                </div>

                {/* Section IV: Visual Toggles */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-1">
                    <Settings className="w-4 h-4" />
                    <span>{isLao ? "4. ການສະແດງຜົນເພີ່ມເຕີມ" : "4. Display & Styling Toggles"}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowSeal(!showSeal)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        showSeal
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{isLao ? "ກາປະທັບທາງການ" : "Official Seal"}</span>
                        <span className="text-[9px] opacity-80">{isLao ? "ສະແດງກາປະທັບສີແດງ" : "Show round stamp seal"}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${showSeal ? "bg-indigo-600 text-white" : "bg-slate-300 dark:bg-slate-700"}`}>
                        {showSeal && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    <button
                      onClick={() => setShowDistribution(!showDistribution)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        showDistribution
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{isLao ? "ບ່ອນນຳສົ່ງ" : "Distribution List"}</span>
                        <span className="text-[9px] opacity-80">{isLao ? "ສະແດງບັນຊີບ່ອນນຳສົ່ງ" : "Show copy-to lists"}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${showDistribution ? "bg-indigo-600 text-white" : "bg-slate-300 dark:bg-slate-700"}`}>
                        {showDistribution && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Paper Document Preview */}
              <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-200 dark:bg-slate-950 overflow-y-auto flex flex-col items-center justify-start">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest mb-3 flex items-center gap-1.5 self-start">
                  <Eye className="w-4 h-4" />
                  <span>{isLao ? "ຕົວຢ່າງເອກະສານທີ່ຈະພິມ (Live A4 Preview)" : "Live Print Sheet Preview"}</span>
                </div>

                {/* Highly polished, responsive official paper frame mockup */}
                <div className="w-full bg-white text-slate-950 shadow-2xl rounded-3xl p-6 sm:p-10 border border-slate-300 relative overflow-hidden select-none text-left flex flex-col justify-between" style={{ minHeight: "840px" }}>
                  
                  {/* Glowing vertical stamp indicating live preview only */}
                  <div className="absolute right-4 top-24 origin-top-right rotate-95 text-[9px] font-black tracking-widest text-indigo-500/10 dark:text-indigo-400/10 select-none pointer-events-none uppercase">
                    LIVE SYSTEM PREVIEW • LIVE SYSTEM PREVIEW
                  </div>

                  {/* Top National Header block */}
                  <div>
                    <div className="border-b border-slate-300 pb-4 mb-4 text-center font-sans">
                      {/* Centered Emblem Logo and National Motto matching the user's provided image */}
                      <div className="flex flex-col items-center justify-center mb-2">
                        <img
                          src={emblemLogo}
                          alt="Laos National Emblem"
                          className="w-16 h-16 object-contain filter mb-1.5"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            if (e.currentTarget.src !== emblemSvg) {
                              e.currentTarget.src = emblemSvg;
                            } else {
                              e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Emblem_of_Laos_%282025-%29.svg/800px-Emblem_of_Laos_%282025-%29.svg.png";
                            }
                          }}
                        />
                        <h4 className="text-[10px] sm:text-[11px] font-black tracking-wide text-slate-950 uppercase leading-none">
                          ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
                        </h4>
                        <h5 className="text-[8px] sm:text-[9px] font-bold text-slate-800 tracking-tight leading-normal mt-1">
                          ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
                        </h5>
                        <span className="text-[8px] text-slate-400 font-light block leading-none mt-[-1px]">-----------------</span>
                      </div>

                      {/* Left and Right Administrative details */}
                      <div className="flex justify-between items-end text-slate-900 text-[9px] font-bold mt-4 px-1">
                        <div className="text-left space-y-0.5">
                          <p className="uppercase text-slate-950 text-[10px]">{provinceName}</p>
                          <p className="text-slate-800 text-[10px]">{officeNameState}</p>
                          <p className="text-indigo-600 font-extrabold text-[10px] mt-1.5">ເລກທີ: {docNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-800 text-[10px]">ວັນທີ: {formattedDocDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Report Title */}
                    <div className="text-center my-5 space-y-1.5">
                      <h2 className="text-base font-black text-slate-950 uppercase tracking-wide">
                        {isLao ? "ໃບສະຫຼຸບລາຍງານ" : "SUMMARY REPORT"}
                      </h2>
                      <h3 className="text-[11px] font-extrabold text-slate-800 leading-relaxed max-w-xl mx-auto">
                        {isLao 
                          ? "ການນໍາໃຊ້ລະບົບການຈອງຫ້ອງປະຊຸມທັນສະໄໝ ຫ້ອງວ່າການແຂວງຫົວພັນ" 
                          : "Utilization of the Modern Meeting Room Booking System, Houaphanh Provincial Office"}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-500 italic">
                        {reportPeriod === "day" && `( ປະຈຳວັນທີ: ${reportDate} )`}
                        {reportPeriod === "week" && `( ປະຈຳອາທິດ: ວັນທີ ${getWeekRange(reportDate).start} ຫາ ວັນທີ ${getWeekRange(reportDate).end} )`}
                        {reportPeriod === "month" && `( ປະຈຳເດືອນ: ${reportDate.substring(0, 7)} )`}
                        {reportPeriod === "year" && `( ປະຈຳປີ: ${reportDate.substring(0, 4)} )`}
                      </p>
                    </div>

                    {/* Report Preface */}
                    <div className="mb-4 text-[10px] text-slate-700 leading-relaxed text-justify">
                      <p>{customPreface}</p>
                    </div>

                    {/* I. Statistics Table */}
                    <div className="mb-4 space-y-1">
                      <h4 className="text-[9px] font-black text-slate-900 border-l-2 border-slate-900 pl-1.5 uppercase">
                        I. ຕົວເລກສະຖິຕິສັງລວມ (CONSOLIDATED STATISTICS)
                      </h4>
                      <div className="grid grid-cols-3 gap-0 border border-slate-400 text-[9px] text-slate-900 bg-slate-50/40">
                        <div className="border-r border-b border-slate-400 p-2 text-center">
                          <p className="font-bold text-slate-500 uppercase text-[8px]">{isLao ? "ການຈອງທັງໝົດ" : "Total Bookings"}</p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">{rTotal} ລາຍການ</p>
                        </div>
                        <div className="border-r border-b border-slate-400 p-2 text-center">
                          <p className="font-bold text-slate-500 uppercase text-[8px]">{t.bkStatusApproved}</p>
                          <p className="text-sm font-black text-emerald-700 mt-0.5">{rApproved} ລາຍການ</p>
                        </div>
                        <div className="border-b border-slate-400 p-2 text-center">
                          <p className="font-bold text-slate-500 uppercase text-[8px]">{isLao ? "ລໍຖ້າ / ປະຕິເສດ" : "Pending/Rejected"}</p>
                          <p className="text-sm font-black text-slate-700 mt-0.5">{rPending} / {rRejected} ລາຍການ</p>
                        </div>
                        <div className="col-span-1 border-r border-slate-400 p-2">
                          <p className="font-bold text-slate-500 uppercase text-[8px]">{isLao ? "ຫ້ອງທີ່ໃຊ້ຫຼາຍສຸດ" : "Most Utilized Room"}</p>
                          <p className="font-bold text-[10px] mt-0.5 text-indigo-700 truncate">{rMostPopularRoom}</p>
                        </div>
                        <div className="col-span-2 p-2">
                          <p className="font-bold text-slate-500 uppercase text-[8px]">{isLao ? "ພາກສ່ວນຈອງຫຼາຍສຸດ" : "Most Active Dept"}</p>
                          <p className="font-bold text-[10px] mt-0.5 text-slate-900 truncate">{rMostActiveDept}</p>
                        </div>
                      </div>
                    </div>

                    {/* II. Detailed table */}
                    <div className="mb-4 space-y-1">
                      <h4 className="text-[9px] font-black text-slate-900 border-l-2 border-slate-900 pl-1.5 uppercase">
                        II. ບັນຊີລາຍລະອຽດການເຄື່ອນໄຫວ (DETAILED REGISTRY)
                      </h4>
                      <table className="w-full text-left border-collapse border border-slate-400 text-[8px] text-slate-900">
                        <thead>
                          <tr className="bg-slate-100 text-slate-950 border-b border-slate-400 font-bold">
                            <th className="py-1 px-1 border-r border-slate-400 text-center w-8">ລຳດັບ</th>
                            <th className="py-1 px-1.5 border-r border-slate-400 w-16">ຫ້ອງປະຊຸມ</th>
                            <th className="py-1 px-1.5 border-r border-slate-400">ຫົວຂໍ້ກອງປະຊຸມ</th>
                            <th className="py-1 px-1 border-r border-slate-400 text-center w-16">ວັນທີປະຊຸມ</th>
                            <th className="py-1 px-1 border-r border-slate-400 text-center w-14">ເວລາ</th>
                            <th className="py-1 px-1.5 border-r border-slate-400 w-20">ພາກສ່ວນຈອງ</th>
                            <th className="py-1 px-1 text-center w-14">ສະຖານະ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReportBookings.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-4 text-center text-slate-400">{t.noData}</td>
                            </tr>
                          ) : (
                            filteredReportBookings.slice(0, 8).map((b, idx) => (
                              <tr key={b.id} className="border-b border-slate-400">
                                <td className="py-1 px-1 border-r border-slate-400 text-center">{idx + 1}</td>
                                <td className="py-1 px-1.5 border-r border-slate-400 font-bold truncate max-w-[70px]">{b.roomName}</td>
                                <td className="py-1 px-1.5 border-r border-slate-400 truncate max-w-[150px]">{b.title}</td>
                                <td className="py-1 px-1 border-r border-slate-400 text-center text-[7px]">{b.date}</td>
                                <td className="py-1 px-1 border-r border-slate-400 text-center text-[7px]">{b.startTime}-{b.endTime}</td>
                                <td className="py-1 px-1.5 border-r border-slate-400 font-bold truncate max-w-[80px]">{b.department || "ທົ່ວໄປ"}</td>
                                <td className="py-1 px-1 text-center font-semibold text-[7px]">
                                  {b.status === "approved" ? "ອະນຸມັດ" : b.status === "rejected" ? "ປະຕິເສດ" : "ລໍຖ້າ"}
                                </td>
                              </tr>
                            ))
                          )}
                          {filteredReportBookings.length > 8 && (
                            <tr>
                              <td colSpan={7} className="py-1 text-center text-[7px] bg-slate-50 italic text-slate-500">
                                {isLao ? `... ແລະ ມີອີກ ${filteredReportBookings.length - 8} ລາຍການອື່ນໆ ທີ່ສະແດງໃນສະບັບພິມເຕັມ ...` : `... and ${filteredReportBookings.length - 8} more entries showing in the full print document ...`}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* III. Sign-off Blocks */}
                  <div className="flex justify-between items-start text-[8px] text-slate-900 font-sans pt-4 border-t border-slate-200">
                    
                    {/* Distribution */}
                    <div className="w-[45%] text-left space-y-1">
                      {showDistribution ? (
                        <div>
                          <p className="font-bold underline uppercase text-[7px]">ບ່ອນນຳສົ່ງ (Distribution):</p>
                          <ul className="text-[7px] list-none pl-0 space-y-0.5 text-slate-600 mt-1">
                            <li>- ທ່ານເຈົ້າແຂວງ{provinceName}</li>
                            <li>- ຫ້ອງວ່າການ{provinceName}</li>
                            <li>- ຂະແໜງເຕັກໂນໂລຊີ</li>
                            <li>- ເກັບມ້ຽນສຳເນົາ</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="h-6"></div>
                      )}
                      
                      <div className="pt-4">
                        <p className="font-bold">{isLao ? "ຜູ້ສະຫຼຸບລາຍງານ" : "Report Compiler"}</p>
                        <div className="h-6"></div>
                        <p className="font-semibold text-slate-400">......................................................</p>
                        <p className="font-bold text-slate-800">{compilerName}</p>
                        <p className="text-[7px] text-slate-500">{compilerTitle}</p>
                      </div>
                    </div>

                    {/* Approver & Seal */}
                    <div className="w-[45%] text-center flex flex-col items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-bold uppercase text-[9px] text-slate-950">{approverTitle}</p>
                        <p className="text-[7px] text-slate-400">{isLao ? "(ເຊັນ ແລະ ປະທັບຕາເປັນທາງການ)" : "(Signature & Seal)"}</p>
                      </div>
                      
                      {/* Red Stamp mockup representation in Live Preview */}
                      {showSeal ? (
                        <div className="relative my-2 scale-75 select-none">
                          <div className="w-16 h-16 rounded-full border-2 border-dashed border-red-500/50 flex flex-col items-center justify-center p-0.5">
                            <div className="w-14 h-14 rounded-full border border-double border-red-500/60 flex flex-col items-center justify-center text-center">
                              <span className="text-[5px] text-red-500 font-bold">ຫ້ອງວ່າການ</span>
                              <span className="text-[6px] text-red-500 font-black tracking-tighter leading-none my-0.5">ແຂວງຫົວພັນ</span>
                              <span className="text-[4px] text-red-500">STAMP SEAL</span>
                            </div>
                          </div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[6px] text-red-500 font-bold border border-red-500/30 px-1 rotate-[-12deg] bg-white/95">
                            APPROVED
                          </div>
                        </div>
                      ) : (
                        <div className="h-10"></div>
                      )}

                      <div className="pt-1">
                        <p className="font-semibold text-slate-400">......................................................</p>
                        <p className="font-bold text-slate-900 text-[9px]">{approverName}</p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center sm:text-left leading-relaxed font-bold max-w-lg">
                * {isLao 
                  ? "ຂໍ້ມູນທັງໝົດຈະຖືກສັງເຄາະຈາກຖານຂໍ້ມູນຈິງໃນລະບົບ ໂດຍອີງໃສ່ຕົວເລືອກໄລຍະເວລາ ແລະ ການກອງຂໍ້ມູນທີ່ທ່ານເລືອກໄວ້ຫຼ້າສຸດ."
                  : "All statistical records are generated directly from live system storage based on your selected active filter values."}
              </p>
              
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-black transition-all cursor-pointer w-1/2 sm:w-auto text-center"
                >
                  {isLao ? "ຍົກເລີກ" : "Cancel"}
                </button>
                <button
                  onClick={() => {
                    setIsPrintModalOpen(false);
                    setTimeout(() => {
                      window.print();
                    }, 250);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 w-1/2 sm:w-auto"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isLao ? "ສັ່ງພິມລາຍງານທາງການ" : "Print Official Report"}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PRINT-ONLY OFFICIAL LAO DOCUMENT */}
      <div id="print-report-sheet" className="hidden print:block bg-white text-slate-950 p-6 min-h-screen font-sans border-t-8 border-slate-900">
        
        {/* LAO PDR NATIONAL EMBLEM & FORMAL ADMINISTRATIVE HEADER */}
        <div className="flex justify-between items-start text-slate-950 font-sans border-b-2 border-slate-900 pb-5 mb-6">
          <div className="text-left space-y-1.5 leading-relaxed w-[35%]">
            <p className="font-bold text-[12px] uppercase tracking-wide">{provinceName}</p>
            <p className="font-bold text-[12px]">{officeNameState}</p>
            <p className="text-[10px] text-slate-600 font-medium">ລະບົບຄຸ້ມຄອງຫ້ອງປະຊຸມທັນສະໄໝ</p>
            <p className="text-[11px] font-bold mt-3 text-indigo-700">ເລກທີ: {docNumber}</p>
          </div>
          
          <div className="flex flex-col items-center justify-center w-[25%] mt-1">
            <svg className="w-16 h-16 text-slate-950" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="2" />
              <path d="M22 65 C 20 45, 30 25, 50 20 C 70 25, 80 45, 78 65" stroke="currentColor" strokeWidth="2" fill="none" />
              <rect x="42" y="65" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="71" r="4" fill="currentColor" />
              <polygon points="50,22 53,28 60,28 55,32 57,38 50,34 43,38 45,32 40,28 47,28" fill="currentColor" />
              <path d="M 18 68 Q 50 82 82 68" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span className="text-[9px] text-slate-800 font-bold tracking-widest mt-1.5 uppercase">ກາໝາຍຊາດ</span>
          </div>

          <div className="text-right space-y-1 leading-relaxed w-[40%]">
            <p className="font-bold text-[13px] tracking-wide">ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ</p>
            <p className="font-bold text-[11px]">ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ</p>
            <p className="text-[10px] text-right font-light tracking-widest mt-[-4px] text-slate-500">-----------------</p>
            <p className="text-[11px] font-bold mt-3">ຫົວພັນ, ວັນທີ: {formattedDocDate}</p>
          </div>
        </div>

        {/* DOCUMENT TITLE & SUBTITLE */}
        <div className="text-center my-6 space-y-1.5">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-slate-950">ໃບສະຫຼຸບລາຍງານ ແລະ ສະຖິຕິ</h2>
          <h3 className="text-sm font-bold text-slate-800">ການນຳໃຊ້ ແລະ ຈອງຫ້ອງປະຊຸມ {officeNameState}</h3>
          <p className="text-xs font-semibold text-slate-700 italic">
            {reportPeriod === "day" && `( ປະຈຳວັນທີ: ${reportDate} )`}
            {reportPeriod === "week" && `( ປະຈຳອາທິດ: ວັນທີ ${getWeekRange(reportDate).start} ຫາ ວັນທີ ${getWeekRange(reportDate).end} )`}
            {reportPeriod === "month" && `( ປະຈຳເດືອນ: ${reportDate.substring(0, 7)} )`}
            {reportPeriod === "year" && `( ປະຈຳປີ: ${reportDate.substring(0, 4)} )`}
          </p>
        </div>

        {/* Preface Text */}
        <div className="mb-6 text-xs text-slate-800 leading-relaxed text-justify font-medium">
          <p>{customPreface}</p>
        </div>

        {/* SECTION I: CONSOLIDATED STATISTICS */}
        <div className="mb-6 space-y-2">
          <h3 className="text-xs font-bold uppercase text-slate-950 border-l-4 border-slate-950 pl-2">
            I. ຕົວເລກສະຖິຕິສັງລວມ (CONSOLIDATED STATISTICS SUMMARY)
          </h3>
          <div className="grid grid-cols-3 gap-0 border border-slate-950 text-xs text-slate-950 bg-white">
            <div className="border-r border-b border-slate-950 p-3 bg-slate-50 text-center">
              <p className="font-bold text-[10px] text-slate-600 uppercase">ການຈອງທັງໝົດ</p>
              <p className="text-base font-extrabold mt-1">{rTotal} ລາຍການ</p>
            </div>
            <div className="border-r border-b border-slate-950 p-3 bg-slate-50 text-center">
              <p className="font-bold text-[10px] text-slate-600 uppercase">ອະນຸມັດແລ້ວ</p>
              <p className="text-base font-extrabold mt-1 text-emerald-800">{rApproved} ລາຍການ</p>
            </div>
            <div className="border-b border-slate-950 p-3 bg-slate-50 text-center">
              <p className="font-bold text-[10px] text-slate-600 uppercase">ລໍຖ້າກວດສອບ / ປະຕິເສດ</p>
              <p className="text-base font-extrabold mt-1">{rPending} / {rRejected} ລາຍການ</p>
            </div>
            <div className="col-span-1 border-r border-slate-950 p-3">
              <p className="font-bold text-[10px] text-slate-600 uppercase">ຫ້ອງປະຊຸມທີ່ມີການນຳໃຊ້ຫຼາຍທີ່ສຸດ</p>
              <p className="font-bold text-xs mt-1 text-indigo-700">{rMostPopularRoom}</p>
            </div>
            <div className="col-span-2 p-3">
              <p className="font-bold text-[10px] text-slate-600 uppercase">ພາກສ່ວນ/ພະແນກ ທີ່ມີການເຄື່ອນໄຫວສູງສຸດ</p>
              <p className="font-bold text-xs mt-1 text-slate-900">{rMostActiveDept}</p>
            </div>
          </div>
        </div>

        {/* SECTION II: DETAILED REGISTRY */}
        <div className="mb-6 space-y-2">
          <h3 className="text-xs font-bold uppercase text-slate-950 border-l-4 border-slate-950 pl-2">
            II. ບັນຊີລາຍລະອຽດການເຄື່ອນໄຫວ (DETAILED MEETING BOOKING REGISTRY)
          </h3>
          <table className="w-full text-left border-collapse border border-slate-950 text-[10px] text-slate-950">
            <thead>
              <tr className="bg-slate-100 text-slate-950 border-b border-slate-950 font-bold">
                <th className="py-2 px-1 border-r border-slate-950 text-center w-10">ລຳດັບ</th>
                <th className="py-2 px-2 border-r border-slate-950 w-24">ຫ້ອງປະຊຸມ</th>
                <th className="py-2 px-2 border-r border-slate-950">ຫົວຂໍ້ກອງປະຊຸມ / ເນື້ອໃນຈຸດປະສົງ</th>
                <th className="py-2 px-2 border-r border-slate-950 text-center w-24">ວັນທີປະຊຸມ</th>
                <th className="py-2 px-2 border-r border-slate-950 text-center w-20">ເວລາປະຊຸມ</th>
                <th className="py-2 px-2 border-r border-slate-950 w-32">ພາກສ່ວນຂໍຈອງ</th>
                <th className="py-2 px-1 text-center w-20">ສະຖານະ</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center font-bold text-slate-500">ບໍ່ມີຂໍ້ມູນລາຍການຈອງໃນຊ່ວງເວລານີ້</td>
                </tr>
              ) : (
                filteredReportBookings.map((b, idx) => (
                  <tr key={b.id} className="border-b border-slate-950">
                    <td className="py-2.5 px-1 border-r border-slate-950 text-center">{idx + 1}</td>
                    <td className="py-2.5 px-2 border-r border-slate-950 font-bold">{b.roomName}</td>
                    <td className="py-2.5 px-2 border-r border-slate-950 font-medium">{b.title}</td>
                    <td className="py-2.5 px-2 border-r border-slate-950 text-center">{b.date}</td>
                    <td className="py-2.5 px-2 border-r border-slate-950 text-center">{b.startTime} - {b.endTime}</td>
                    <td className="py-2.5 px-2 border-r border-slate-950 font-bold">{b.department || "ທົ່ວໄປ"}</td>
                    <td className="py-2.5 px-1 text-center font-bold">
                      {b.status === "approved" ? "ອະນຸມັດແລ້ວ" : b.status === "rejected" ? "ປະຕິເສດແລ້ວ" : "ລໍຖ້າກວດສອບ"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SECTION III: AUTHENTIC ADMINISTRATIVE SIGN-OFF & OFFICIAL SEAL */}
        <div className="mt-8 flex justify-between items-start text-xs text-slate-950 font-sans">
          
          {/* Distribution list and Compiler Signature */}
          <div className="w-[45%] text-left space-y-1 flex flex-col justify-between min-h-[220px]">
            <div>
              {showDistribution ? (
                <div>
                  <p className="font-bold underline text-[10px] uppercase">ບ່ອນນຳສົ່ງ (Distribution List):</p>
                  <ul className="text-[9px] list-none pl-0 space-y-0.5 font-medium text-slate-700 mt-1.5">
                    <li>- ທ່ານເຈົ້າແຂວງ{provinceName} (ເພື່ອລາຍງານ)</li>
                    <li>- ຫ້ອງວ່າການ{provinceName} (ເພື່ອຕິດຕາມ)</li>
                    <li>- ບັນດາພະແນກການອ້ອມຂ້າງ (ເພື່ອຊາບ)</li>
                    <li>- ເກັບມ້ຽນສຳເນົາ (ຂະແໜງເຕັກໂນໂລຊີ)</li>
                  </ul>
                </div>
              ) : (
                <div className="h-10"></div>
              )}
            </div>
            
            <div className="pt-6">
              <p className="font-bold">ຜູ້ສະຫຼຸບ ແລະ ບັນທຶກລາຍງານ</p>
              <div className="h-14"></div> {/* Signature line placeholder spacer */}
              <p className="font-bold text-slate-800">......................................................</p>
              <p className="font-bold text-slate-900">{compilerName}</p>
              <p className="text-[9px] text-slate-500 font-medium">{compilerTitle}</p>
            </div>
          </div>

          {/* Approver & Official Stamp Seal Block */}
          <div className="w-[45%] text-center flex flex-col items-center justify-between min-h-[220px]">
            <div className="space-y-1 text-center">
              <p className="font-bold uppercase tracking-wide">{approverTitle}</p>
              <p className="text-[10px] text-slate-500 font-medium">(ເຊັນ ແລະ ປະທັບຕາເປັນທາງການ)</p>
            </div>
            
            {/* Elegant Circle Wet Stamp Seal Placement Marker */}
            {showSeal ? (
              <div className="relative my-3 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-red-500/40 flex flex-col items-center justify-center p-1 select-none pointer-events-none">
                  <div className="w-20 h-20 rounded-full border-2 border-double border-red-500/50 flex flex-col items-center justify-center text-center">
                    <span className="text-[7px] text-red-500 font-bold leading-none">ຫ້ອງວ່າການ</span>
                    <span className="text-[8px] text-red-500 font-black leading-tight my-0.5">ແຂວງຫົວພັນ</span>
                    <span className="text-[6px] text-red-500 font-semibold leading-none">OFFICIAL SEAL</span>
                  </div>
                </div>
                <div className="absolute text-[8px] text-red-500 font-bold border border-red-500/30 px-1 py-0.5 rotate-[-12deg] bg-white/95">
                  บ່ອນປະທັບຕາ
                </div>
              </div>
            ) : (
              <div className="h-16"></div>
            )}

            <div className="pt-2 text-center">
              <p className="font-bold text-slate-800">......................................................</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">( {approverName} )</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
