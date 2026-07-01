import { 
  LayoutDashboard, 
  CalendarClock, 
  FolderKanban, 
  Users, 
  Settings as SettingsIcon,
  LogOut,
  Building2
} from "lucide-react";
import { AppLanguage, UserRole } from "../types";
import { translations } from "../lib/translations";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: AppLanguage;
  userRole: UserRole;
  onSignOut: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, language, userRole, onSignOut }: SidebarProps) {
  const t = translations[language];

  const menuItems = [
    { id: "dashboard", label: t.navDashboard, icon: LayoutDashboard },
    { id: "booking", label: t.navBooking, icon: CalendarClock },
    ...(userRole === "admin" ? [
      { id: "rooms", label: t.navRooms, icon: FolderKanban },
      { id: "users", label: t.navUsers, icon: Users }
    ] : []),
    { id: "settings", label: t.navSettings, icon: SettingsIcon }
  ];

  return (
    <aside id="sidebar-container" className="w-72 sidebar-panel flex flex-col h-screen sticky top-0 transition-all duration-300 shadow-sm z-20 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#111827]">
      {/* Sleek Brand Header Block */}
      <div id="sidebar-header" className="p-5 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-white flex flex-col gap-2 border-b border-indigo-950/40 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-3.5 z-10">
          <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg shrink-0 flex items-center justify-center">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Emblem_of_Laos.svg/512px-Emblem_of_Laos.svg.png" 
              alt="Laos State Emblem" 
              className="w-12 h-12 object-contain filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.3)]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-extrabold tracking-tight text-amber-400 leading-snug">
              {language === "lo" ? "ຫ້ອງວ່າການແຂວງ" : "Provincial Office"}
            </h1>
            <p className="text-xs font-black text-white uppercase tracking-wider">
              {language === "lo" ? "ແຂວງຫົວພັນ" : "Houaphanh"}
            </p>
            <span className="text-[9px] text-indigo-300 font-extrabold tracking-widest uppercase mt-0.5 border-t border-white/10 pt-1">
              E-OFFICE SYSTEM
            </span>
          </div>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav id="sidebar-nav" className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left font-medium text-xs relative group cursor-pointer ${
                isActive 
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-100/50 dark:border-indigo-500/20" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-105 ${
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
              }`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sleek Footer Cloud Status Indicator */}
      <div className="px-4 pb-1">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
          <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-extrabold mb-1 tracking-widest">
            Firebase Database
          </p>
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            E-office v2.0.4
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Connected to Cloud</span>
          </div>
        </div>
      </div>

      {/* Bottom Profile / Sign Out */}
      <div id="sidebar-footer" className="p-4 border-t border-slate-100 dark:border-white/5">
        <button
          id="btn-sign-out"
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-200 font-semibold text-xs cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>{t.signOut}</span>
        </button>
      </div>
    </aside>
  );
}
