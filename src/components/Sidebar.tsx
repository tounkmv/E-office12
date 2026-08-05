import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
  LayoutDashboard, 
  CalendarClock, 
  FolderKanban, 
  FileSpreadsheet,
  Users, 
  ShieldCheck,
  Settings as SettingsIcon,
  LogOut,
  Building2,
  Sparkles,
  AlertTriangle,
  X,
  User as UserIcon,
  Sliders,
  ChevronRight,
  Menu
} from "lucide-react";
import { AppLanguage, UserRole, UserProfile } from "../types";
import { translations } from "../lib/translations";
import { motion, AnimatePresence } from "motion/react";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: AppLanguage;
  userRole: UserRole;
  onSignOut: () => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  userProfile?: UserProfile | null;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  language, 
  userRole, 
  onSignOut,
  isMobileOpen = false,
  setIsMobileOpen,
  userProfile
}: SidebarProps) {
  const t = translations[language];
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { id: "dashboard", label: t.navDashboard, icon: LayoutDashboard },
    { id: "booking", label: t.navBooking, icon: CalendarClock },
    ...(userRole === "admin" ? [
      { id: "rooms", label: t.navRooms, icon: FolderKanban },
      { id: "admin-bookings", label: t.navAdminBookings || (language === "lo" ? "ສູນຄວບຄຸມ ແລະ ການຈັດການຈອງທັງໝົດ" : "Control Center & Bookings"), icon: ShieldCheck },
      { id: "reports", label: t.navReports || "ລະບົບລາຍງານ", icon: FileSpreadsheet },
      { id: "users", label: t.navUsers, icon: Users }
    ] : []),
    { id: "settings", label: t.navSettings, icon: SettingsIcon }
  ];

  // Helper to render navigation items
  const renderNavItems = (onItemClick?: () => void) => (
    <nav className="flex-1 px-4 py-4 space-y-2.5 overflow-y-auto relative z-10">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`sidebar-tab-${item.id}`}
            onClick={() => {
              setActiveTab(item.id);
              if (onItemClick) onItemClick();
            }}
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
            {isActive ? (
              <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            ) : (
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. DESKTOP STICKY SIDEBAR (Visible on large screens lg:flex) */}
      <aside id="sidebar-container" className="hidden lg:flex w-72 lg:w-80 sidebar-panel flex-col h-screen sticky top-0 transition-all duration-300 shadow-xl z-20 border-r border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl relative overflow-hidden shrink-0">
        {/* Ambient background glow in sidebar */}
        <div className="absolute top-1/4 left-0 w-48 h-48 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-0 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Sleek Brand Header Block */}
        <div id="sidebar-header" className="p-5 h-28 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-white flex flex-col justify-center border-b-2 border-amber-400/50 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80 pointer-events-none" />
          
          <div className="flex items-center gap-3.5 z-10">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg shrink-0 flex items-center justify-center">
              <img 
                src={emblemLogo} 
                alt="Laos State Emblem" 
                className="w-14 h-14 object-contain filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]"
                referrerPolicy="no-referrer"
                onError={(e) => { 
                  if (e.currentTarget.src !== emblemSvg) {
                    e.currentTarget.src = emblemSvg;
                  } else {
                    e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Emblem_of_Laos_%282025-%29.svg/800px-Emblem_of_Laos_%282025-%29.svg.png";
                  }
                }}
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

        {/* Desktop Menu Navigation */}
        {renderNavItems()}

        {/* Bottom Profile / Sign Out */}
        <div id="sidebar-footer" className="p-4 border-t border-slate-200/80 dark:border-white/10 relative z-10">
          <button
            id="btn-sign-out"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-600/25 hover:shadow-rose-600/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 border border-rose-400/40 relative overflow-hidden group cursor-pointer"
            title={language === "lo" ? "ອອກຈາກລະບົບ" : "Sign Out"}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-xs group-hover:rotate-12 transition-transform duration-300">
                <LogOut className="w-4 h-4 text-amber-200" />
              </div>
              <div className="flex flex-col text-left">
                <span className="leading-tight tracking-wide font-black text-sm text-white drop-shadow-xs">
                  {t.signOut}
                </span>
                <span className="text-[10px] text-rose-100 font-bold opacity-80">
                  {language === "lo" ? "ປິດເຊດຊັນຢ່າງປອດໄພ" : "Safely Close Session"}
                </span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse relative z-10 shadow-xs" />
          </button>
        </div>
      </aside>

      {/* 2. MOBILE / TABLET SLIDE-OVER DRAWER HAMBURGER MENU (Visible on screens < lg when opened) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isMobileOpen && (
            <div className="fixed inset-0 z-[99990] lg:hidden">
              {/* Backdrop blur overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen?.(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
              />

              {/* Sliding Drawer Container */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-slate-950 text-white border-r-2 border-amber-400/60 shadow-[0_0_60px_rgba(0,0,0,0.85)] flex flex-col h-full overflow-hidden font-sans relative z-10"
              >
                {/* Drawer Header with Emblem and Close X button */}
                <div className="p-5 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] border-b-2 border-amber-400/50 flex items-center justify-between relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
                  
                  <div className="flex items-center gap-3 z-10">
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-md shrink-0">
                      <img 
                        src={emblemLogo} 
                        alt="State Emblem" 
                        className="w-11 h-11 object-contain filter drop-shadow-sm" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          if (e.currentTarget.src !== emblemSvg) e.currentTarget.src = emblemSvg;
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-amber-400 leading-snug">
                        {language === "lo" ? "ຫ້ອງວ່າການແຂວງ" : "Provincial Office"}
                      </h2>
                      <p className="text-xs font-black text-white uppercase tracking-wider">
                        {language === "lo" ? "ແຂວງຫົວພັນ" : "Houaphanh"}
                      </p>
                      <span className="text-[9px] text-indigo-200 font-bold block mt-0.5">
                        {language === "lo" ? "ເມນູຫຼັກລະບົບຈອງ" : "MAIN SYSTEM MENU"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileOpen?.(false)}
                    className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/15 z-10 shrink-0"
                    title={language === "lo" ? "ປິດເມນູ" : "Close Menu"}
                  >
                    <X className="w-5 h-5 text-amber-300" />
                  </button>
                </div>

                {/* User Profile Card Preview in Drawer */}
                {userProfile && (
                  <div className="p-4 border-b border-white/10 bg-white/5 space-y-2 shrink-0">
                    <div className="flex items-center gap-3">
                      {userProfile.avatar ? (
                        <img 
                          src={userProfile.avatar} 
                          alt={userProfile.displayName} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-2 border-amber-400 flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                          {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-amber-300 truncate">
                          {userProfile.displayName}
                        </span>
                        <span className="text-[10px] text-slate-300 truncate font-semibold">
                          {userProfile.department || userProfile.email}
                        </span>
                        <span className="mt-1 px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black uppercase w-max">
                          {userProfile.role === "admin" ? (language === "lo" ? "ຜູ້ດູແລລະບົບ" : "Admin") : (language === "lo" ? "ຜູ້ໃຊ້ງານ" : "User")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Drawer Menu Navigation Links */}
                {renderNavItems(() => setIsMobileOpen?.(false))}

                {/* Drawer Bottom Sign Out */}
                <div className="p-4 border-t border-white/10 relative z-10 shrink-0 bg-slate-900/60">
                  <button
                    onClick={() => {
                      setIsMobileOpen?.(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-2xl shadow-lg border border-rose-400/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut className="w-4 h-4 text-amber-200" />
                      <span>{t.signOut}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Logout Confirmation Modal Portal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showLogoutModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/95 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white shadow-[0_25px_60px_-15px_rgba(225,29,72,0.35)] relative overflow-hidden font-sans text-center flex flex-col items-center justify-center space-y-5"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative flex items-center justify-center pt-2">
                  <div className="p-4 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-3xl shadow-xl shadow-rose-500/25 relative z-10">
                    <AlertTriangle className="w-9 h-9 animate-bounce text-amber-300" />
                  </div>
                  <span className="absolute w-20 h-20 bg-rose-500/30 rounded-full animate-ping pointer-events-none" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-xl sm:text-2xl text-white tracking-tight leading-tight">
                    {language === "lo" ? "ຢືນຢັນການອອກຈາກລະບົບ" : "Confirm Sign Out"}
                  </h3>
                  <p className="text-xs text-rose-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === "lo" ? "E-Office ຫ້ອງວ່າການແຂວງຫົວພັນ" : "Houaphanh Provincial E-Office"}</span>
                  </p>
                </div>

                <div className="w-full bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-2 text-center shadow-inner">
                  <p className="text-base sm:text-lg font-black text-amber-300 leading-relaxed">
                    {language === "lo" 
                      ? "ທ່ານຕ້ອງການທີ່ຈະອອກຈາກລະບົບແທ້ບໍ່?" 
                      : "Are you sure you want to log out?"}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-xs mx-auto">
                    {language === "lo" 
                      ? "ເມື່ອທ່ານອອກຈາກລະບົບ ແອັບຈະທຳການປິດເຊດຊັນການນຳໃຊ້ ແລະ ກັບຄືນໄປຫາໜ້າເຂົ້າສູ່ລະບົບ (Login) ຫຼັກ." 
                      : "Signing out will safely end your session and return you to the main login screen."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(false)}
                    className="py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer border border-slate-700/80 shadow-md text-center active:scale-95"
                  >
                    {language === "lo" ? "ຍົກເລີກ" : "Cancel"}
                  </button>
                  
                  <button
                    type="button"
                    id="btn-confirm-logout"
                    onClick={() => {
                      setShowLogoutModal(false);
                      onSignOut();
                    }}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-600/35 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-rose-400/40 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-amber-200" />
                    <span>{language === "lo" ? "ອອກຈາກລະບົບ" : "Log Out"}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
