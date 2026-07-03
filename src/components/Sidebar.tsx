import { 
  LayoutDashboard, 
  CalendarClock, 
  FolderKanban, 
  Users, 
  Settings as SettingsIcon,
  LogOut,
  Building2,
  Sparkles
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
    <aside id="sidebar-container" className="w-72 md:w-80 sidebar-panel flex flex-col h-screen sticky top-0 transition-all duration-300 shadow-xl z-20 border-r border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl relative overflow-hidden">
      {/* Ambient background glow in sidebar */}
      <div className="absolute top-1/4 left-0 w-48 h-48 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Sleek Brand Header Block */}
      <div id="sidebar-header" className="p-5 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-white flex flex-col gap-2 border-b border-indigo-950/40 relative overflow-hidden shadow-md">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
        
        <div className="flex items-center gap-3.5 z-10">
          <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg shrink-0 flex items-center justify-center">
            <img 
              src="/emblem.png" 
              alt="Laos State Emblem" 
              className="w-14 h-14 object-contain filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Emblem_of_Laos_%282025-%29.svg/800px-Emblem_of_Laos_%282025-%29.svg.png"; }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-black tracking-tight text-amber-400 leading-snug drop-shadow-sm">
              {language === "lo" ? "ຫ້ອງວ່າການແຂວງ" : "Provincial Office"}
            </h1>
            <p className="text-sm font-black text-white uppercase tracking-wider">
              {language === "lo" ? "ແຂວງຫົວພັນ" : "Houaphanh"}
            </p>
            <span className="text-[10px] text-indigo-200 font-extrabold tracking-wider mt-1 border-t border-white/15 pt-1 block">
              {language === "lo" ? "ລະບົບຈອງຫ້ອງປະຊຸມທັນສະໄໝ" : "MODERN BOOKING SYSTEM"}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav id="sidebar-nav" className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto relative z-10">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 text-left font-extrabold text-sm md:text-base tracking-wide relative group cursor-pointer ${
                isActive 
                  ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 border-l-4 border-amber-400 scale-[1.02]" 
                  : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-indigo-500/10 hover:text-indigo-600 dark:hover:text-amber-400 hover:scale-[1.02] hover:translate-x-1 hover:shadow-md hover:shadow-indigo-500/5 border border-transparent hover:border-indigo-500/20"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? "text-amber-300 drop-shadow-sm" : "text-slate-400 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-amber-400"
                }`} />
                <span className="leading-tight">{item.label}</span>
              </div>
              {isActive && (
                <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sleek Footer Cloud Status Indicator */}
      <div className="px-4 pb-2 relative z-10">
        <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-md">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-extrabold mb-1 tracking-widest">
            Firebase Database
          </p>
          <p className="text-xs font-black text-slate-700 dark:text-slate-200">
            E-office v2.0.4
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500"></div>
            <span>Connected to Cloud</span>
          </div>
        </div>
      </div>

      {/* Bottom Profile / Sign Out */}
      <div id="sidebar-footer" className="p-4 border-t border-slate-200/80 dark:border-white/10 relative z-10">
        <button
          id="btn-sign-out"
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/15 rounded-2xl transition-all duration-300 font-extrabold text-sm md:text-base cursor-pointer hover:scale-[1.02] hover:shadow-md hover:shadow-red-500/10 border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-5 h-5 md:w-5.5 md:h-5.5" />
          <span>{t.signOut}</span>
        </button>
      </div>
    </aside>
  );
}
