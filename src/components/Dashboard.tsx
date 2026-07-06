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
  Briefcase
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

interface DashboardProps {
  bookings: RoomBooking[];
  rooms: MeetingRoom[];
  language: AppLanguage;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ bookings, rooms, language, setActiveTab }: DashboardProps) {
  const t = translations[language];

  // Calculations
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const approvedBookings = bookings.filter(b => b.status === "approved").length;
  const activeRooms = rooms.filter(r => r.status === "active").length;

  // Filter today's meetings (supporting multi-day meeting date ranges)
  const todayStr = new Date().toISOString().split("T")[0];
  const todayMeetings = bookings.filter(b => b.date <= todayStr && (b.endDate || b.date) >= todayStr && b.status === "approved");

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
    <div id="dashboard-view" className="space-y-8 font-sans pb-12">
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
                      {booking.title}
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

    </div>
  );
}
