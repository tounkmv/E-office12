import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Filter, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  FileText, 
  ArrowUpRight,
  BarChart3,
  TrendingUp,
  Tag,
  Check,
  Play,
  RotateCcw
} from "lucide-react";
import { 
  LeadershipActivity, 
  UserProfile, 
  AppLanguage, 
  ActivityStatus 
} from "../types";
import { 
  getCategoryLabel, 
  getStatusLabel, 
  getPriorityLabel, 
  updateLeadershipActivity, 
  deleteLeadershipActivity 
} from "../lib/activityHelper";
import LeadershipActivityForm from "./LeadershipActivityForm";

interface LeadershipMyActivitiesProps {
  activities: LeadershipActivity[];
  userProfile: UserProfile;
  language: AppLanguage;
  onRefresh?: () => void;
}

export default function LeadershipMyActivities({
  activities,
  userProfile,
  language,
  onRefresh
}: LeadershipMyActivitiesProps) {
  const isLao = language === "lo";

  // Filter periods: "this_week" | "this_month" | "this_year" | "all"
  const [period, setPeriod] = useState<"this_week" | "this_month" | "this_year" | "all">("this_month");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LeadershipActivity | null>(null);
  const [outcomeModalActivity, setOutcomeModalActivity] = useState<LeadershipActivity | null>(null);
  const [outcomeText, setOutcomeText] = useState("");
  const [isSavingOutcome, setIsSavingOutcome] = useState(false);

  // Filter activities strictly for the logged-in user
  const myAllActivities = useMemo(() => {
    return activities.filter(a => a.userId === userProfile.uid);
  }, [activities, userProfile.uid]);

  // Date boundary helpers
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // This week range (Monday to Sunday)
  const currentDay = now.getDay();
  const diffToMon = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const monday = new Date(new Date().setDate(diffToMon));
  const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
  const weekStartStr = monday.toISOString().split("T")[0];
  const weekEndStr = sunday.toISOString().split("T")[0];

  // This month range
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEndStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

  // This year range
  const yearStartStr = `${now.getFullYear()}-01-01`;
  const yearEndStr = `${now.getFullYear()}-12-31`;

  // Filter by period & status
  const filteredMyActivities = useMemo(() => {
    return myAllActivities.filter(act => {
      // Period filter
      if (period === "this_week") {
        if (act.startDate < weekStartStr || act.startDate > weekEndStr) return false;
      } else if (period === "this_month") {
        if (act.startDate < monthStartStr || act.startDate > monthEndStr) return false;
      } else if (period === "this_year") {
        if (act.startDate < yearStartStr || act.startDate > yearEndStr) return false;
      }

      // Status filter
      if (statusFilter !== "all" && act.status !== statusFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchLoc = act.location.toLowerCase().includes(q);
        const matchDesc = (act.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchDesc) return false;
      }

      return true;
    }).sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [myAllActivities, period, statusFilter, searchQuery, weekStartStr, weekEndStr, monthStartStr, monthEndStr, yearStartStr, yearEndStr]);

  // Statistics for current period
  const totalTasks = filteredMyActivities.length;
  const completedTasks = filteredMyActivities.filter(a => a.status === "completed").length;
  const inProgressTasks = filteredMyActivities.filter(a => a.status === "in_progress").length;
  const scheduledTasks = filteredMyActivities.filter(a => a.status === "scheduled").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Quick Status change
  const handleQuickStatusChange = async (act: LeadershipActivity, newStatus: ActivityStatus) => {
    if (newStatus === "completed" && !act.outcome) {
      // Open outcome recording modal
      setOutcomeModalActivity(act);
      setOutcomeText(act.outcome || "");
      return;
    }

    try {
      await updateLeadershipActivity(act.id, { status: newStatus });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Quick status update failed:", err);
    }
  };

  // Submit outcome modal
  const handleSaveOutcome = async () => {
    if (!outcomeModalActivity) return;
    setIsSavingOutcome(true);
    try {
      await updateLeadershipActivity(outcomeModalActivity.id, {
        status: "completed",
        outcome: outcomeText.trim()
      });
      setOutcomeModalActivity(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Save outcome failed:", err);
    } finally {
      setIsSavingOutcome(false);
    }
  };

  // Delete activity
  const handleDelete = async (id: string) => {
    if (window.confirm(isLao ? "ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບການເຄື່ອນໄຫວວຽກນີ້?" : "Delete this activity?")) {
      try {
        await deleteLeadershipActivity(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Profile & Summary Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300/40 p-1 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shrink-0">
              {userProfile.displayName ? userProfile.displayName.charAt(0) : "U"}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-[11px] font-black text-amber-300 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLao ? "ບັນທຶກການເຄື່ອນໄຫວວຽກຂອງຕົນເອງ" : "Personal Duty & Work Log"}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {userProfile.displayName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {userProfile.role === "admin" ? (isLao ? "ຫົວໜ້າຫ້ອງວ່າການແຂວງ" : "Provincial Office Head") : (userProfile.department || (isLao ? "ຫົວໜ້າຂະແໜງ / ພະນັກງານ" : "Staff"))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setEditingActivity(null);
                setIsFormOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>{isLao ? "ເພີ່ມວຽກຂອງຂ້າພະເຈົ້າ (+)" : "Add My Activity"}</span>
            </button>
          </div>
        </div>

        {/* Progress & Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ວຽກທັງໝົດໃນຊ່ວງນີ້" : "Total Tasks"}</span>
            <span className="text-xl font-black text-white">{totalTasks}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ສຳເລັດແລ້ວ" : "Completed"}</span>
            <span className="text-xl font-black text-emerald-300">{completedTasks}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ພວມປະຕິບັດ" : "In Progress"}</span>
            <span className="text-xl font-black text-amber-300">{inProgressTasks}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">{isLao ? "ອັດຕາຄວາມສຳເລັດ" : "Completion Rate"}</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-cyan-300">{completionRate}%</span>
              <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${completionRate}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period & Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Period Selector Tabs: Week / Month / Year / All */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 overflow-x-auto">
            <button
              onClick={() => setPeriod("this_week")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                period === "this_week"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isLao ? "ອາທິດນີ້ (Weekly)" : "This Week"}
            </button>
            <button
              onClick={() => setPeriod("this_month")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                period === "this_month"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isLao ? "ເດືອນນີ້ (Monthly)" : "This Month"}
            </button>
            <button
              onClick={() => setPeriod("this_year")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                period === "this_year"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isLao ? "ປີນີ້ (Yearly)" : "This Year"}
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                period === "all"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isLao ? "ທັງໝົດ (All)" : "All Time"}
            </button>
          </div>

          {/* Status & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">{isLao ? "ທຸກສະຖານະ" : "All Statuses"}</option>
              <option value="scheduled">{isLao ? "ມີແຜນກຳນົດ" : "Scheduled"}</option>
              <option value="in_progress">{isLao ? "ພວມປະຕິບັດ" : "In Progress"}</option>
              <option value="completed">{isLao ? "ສຳເລັດແລ້ວ" : "Completed"}</option>
            </select>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isLao ? "ຄົ້ນຫາວຽກຂອງຂ້າພະເຈົ້າ..." : "Search my activities..."}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {filteredMyActivities.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200 mb-1">
              {isLao ? "ຍັງບໍ່ມີລາຍການວຽກໃນຊ່ວງເວລານີ້" : "No activities in this period"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 font-medium">
              {isLao 
                ? "ທ່ານສາມາດກົດປຸ່ມດ້ານລຸ່ມເພື່ອເພີ່ມວຽກ, ກອງປະຊຸມ ຫຼື ພາລະກິດການເຄື່ອນໄຫວຂອງທ່ານໄດ້ທັນທີ"
                : "Add your official meetings, missions, and work duties to track your weekly or monthly accomplishments."}
            </p>
            <button
              onClick={() => {
                setEditingActivity(null);
                setIsFormOpen(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isLao ? "ເພີ່ມວຽກໃໝ່ດຽວນີ້" : "Create My First Task"}</span>
            </button>
          </div>
        ) : (
          filteredMyActivities.map((act) => {
            const cat = getCategoryLabel(act.category, isLao);
            const stat = getStatusLabel(act.status, isLao);
            const pri = getPriorityLabel(act.priority, isLao);

            return (
              <div
                key={act.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-3xl p-5 shadow-sm transition-all space-y-3"
              >
                {/* Header row: category, priority, status & date/time */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${cat.bg} ${cat.color} ${cat.border}`}>
                      {cat.label}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${pri.badge}`}>
                      {pri.label}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stat.bg} ${stat.color} ${stat.border}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${stat.dot}`} />
                      {stat.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {act.startDate}
                      {act.endDate !== act.startDate ? ` - ${act.endDate}` : ""}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {act.startTime} - {act.endTime}
                    </span>
                  </div>
                </div>

                {/* Title and Description */}
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                    {act.title}
                  </h3>
                  {act.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                      {act.description}
                    </p>
                  )}
                </div>

                {/* Meta details: location & participants */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1 font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{act.location}</span>
                  </span>
                  {act.participants && (
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span>{isLao ? "ຜູ້ເຂົ້າຮ່ວມ:" : "Attendees:"}</span>
                      <span className="truncate max-w-xs">{act.participants}</span>
                    </span>
                  )}
                </div>

                {/* Outcome note if present */}
                {act.outcome && (
                  <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-xs">
                    <div className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isLao ? "ຜົນການຈັດຕັ້ງປະຕິບັດ:" : "Outcome:"}</span>
                    </div>
                    <p className="text-emerald-900 dark:text-emerald-200 font-medium">
                      {act.outcome}
                    </p>
                  </div>
                )}

                {/* Footer Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  
                  {/* Quick status progress buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">
                      {isLao ? "ປັບປ່ຽນສະຖານະ:" : "Change status:"}
                    </span>

                    {act.status !== "in_progress" && act.status !== "completed" && (
                      <button
                        onClick={() => handleQuickStatusChange(act, "in_progress")}
                        className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-700 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>{isLao ? "ເລີ່ມປະຕິບັດ" : "Start"}</span>
                      </button>
                    )}

                    {act.status !== "completed" && (
                      <button
                        onClick={() => handleQuickStatusChange(act, "completed")}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>{isLao ? "ໝາຍວ່າສຳເລັດ" : "Mark Completed"}</span>
                      </button>
                    )}

                    {act.status === "completed" && (
                      <button
                        onClick={() => handleQuickStatusChange(act, "in_progress")}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isLao ? "ເປີດຄືນໃໝ່" : "Re-open"}</span>
                      </button>
                    )}
                  </div>

                  {/* Edit and Delete buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingActivity(act);
                        setIsFormOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isLao ? "ແກ້ໄຂ" : "Edit"}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(act.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title={isLao ? "ລຶບວຽກນີ້" : "Delete activity"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* OUTCOME MODAL ON COMPLETION */}
      {outcomeModalActivity && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isLao ? "ບັນທຶກຜົນການຈັດຕັ້ງປະຕິບັດວຽກງານ" : "Record Task Outcome"}
                </h3>
                <p className="text-xs text-slate-500">
                  {outcomeModalActivity.title}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isLao ? "ຜົນໄດ້ຮັບ, ຂໍ້ສະຫຼຸບ ຫຼື ມະຕິຕົກລົງຫຍໍ້" : "Key Outcomes / Decisions"}
              </label>
              <textarea
                rows={3}
                value={outcomeText}
                onChange={(e) => setOutcomeText(e.target.value)}
                placeholder={isLao ? "ບັນທຶກເນື້ອໃນຜົນການປະຕິບັດງານ ເພື່ອນຳໄປສັງລວມເຂົ້າໃນບົດລາຍງານ..." : "Note down key results achieved..."}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOutcomeModalActivity(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {isLao ? "ຍົກເລີກ" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isSavingOutcome}
                onClick={handleSaveOutcome}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingOutcome ? (isLao ? "ກຳລັງບັນທຶກ..." : "Saving...") : (isLao ? "ບັນທຶກວ່າສຳເລັດ" : "Save & Complete")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      <LeadershipActivityForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingActivity(null);
        }}
        userProfile={userProfile}
        language={language}
        activityToEdit={editingActivity}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

    </div>
  );
}
