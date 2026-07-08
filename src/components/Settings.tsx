import { useState, FormEvent, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Languages, 
  Paintbrush, 
  User, 
  Building, 
  Phone, 
  CheckCircle,
  BellRing,
  Info,
  ShieldCheck,
  MailCheck,
  Sparkles,
  Key,
  UserCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { AppLanguage, AppTheme, UserProfile } from "../types";
import { translations } from "../lib/translations";
import { updateUserProfile } from "../lib/firebaseHelper";
import { db, collection, query, where, getDocs } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface SettingsProps {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export default function Settings({ 
  language, 
  setLanguage, 
  theme, 
  setTheme, 
  userProfile,
  onUpdateProfile
}: SettingsProps) {
  const t = translations[language];

  // User Profile Form States
  const [displayName, setDisplayName] = useState(userProfile.displayName || "");
  const [department, setDepartment] = useState(userProfile.department || "");
  const [phone, setPhone] = useState(userProfile.phone || "");
  const [username, setUsername] = useState(userProfile.username || "");
  const [password, setPassword] = useState(userProfile.password || "");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setDisplayName(userProfile.displayName || "");
    setDepartment(userProfile.department || "");
    setPhone(userProfile.phone || "");
    setUsername(userProfile.username || "");
    setPassword(userProfile.password || "");
  }, [userProfile]);

  const [notifInApp, setNotifInApp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);

  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const isLao = language === "lo";
    try {
      // 1. Check if trying to claim "admin" username but they are not an admin
      const normalUsername = username.trim().toLowerCase();
      if (normalUsername === "admin" && userProfile.role !== "admin") {
        throw new Error(isLao ? "ບໍ່ສາມາດໃຊ້ຊື່ບັນຊີ 'admin' ນີ້ໄດ້ (ສະຫງວນໄວ້ໃຫ້ແອດມິນ)" : "Cannot use reserved 'admin' username");
      }

      // 2. Query Firestore to see if this username is already taken by ANOTHER user
      if (normalUsername !== "") {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", normalUsername));
        const querySnapshot = await getDocs(q);
        
        let takenByOther = false;
        querySnapshot.forEach((doc) => {
          if (doc.id !== userProfile.uid) {
            takenByOther = true;
          }
        });

        if (takenByOther) {
          throw new Error(isLao ? "ຊື່ບັນຊີຜູ້ໃຊ້ນີ້ມີຄົນໃຊ້ອື່ນແລ້ວ! ກະລຸນາປ່ຽນຊື່ໃໝ່" : "Username is already taken by another user!");
        }
      }

      const updates = { 
        displayName, 
        department, 
        phone,
        username: normalUsername,
        password: password.trim()
      };
      await updateUserProfile(userProfile.uid, updates);
      onUpdateProfile({ ...userProfile, ...updates });
      triggerToast(t.usrSaveSuccess);
    } catch (err: any) {
      console.error("Save profile error:", err);
      alert(t.error + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const themesList: { 
    id: AppTheme; 
    label: string; 
    bg: string; 
    border: string; 
    text: string; 
    previewBg: string;
    description: string;
    dots: string[];
  }[] = [
    { 
      id: "light", 
      label: t.stThemeLight, 
      bg: "bg-white", 
      border: "border-slate-200", 
      text: "text-slate-950",
      previewBg: "bg-slate-50",
      description: language === "lo" 
        ? "ໂໝດສະຫວ່າງ ໂທນສີຂາວສະອາດຕາ ເໝາະສົມໃນເວລາກາງເວັນ" 
        : "Clean and bright canvas suitable for well-lit environments",
      dots: ["#f8fafc", "#ffffff", "#3b82f6"]
    },
    { 
      id: "dark", 
      label: t.stThemeDark, 
      bg: "bg-slate-900", 
      border: "border-slate-800", 
      text: "text-slate-100",
      previewBg: "bg-[#0b0f19]",
      description: language === "lo" 
        ? "ໂໝດມືດ ໂທນສີເທົາມືດຫຼູຫຼາ ຊ່ວຍຫຼຸດຜ່ອນແສງຈ້າຂອງໜ້າຈໍ" 
        : "Elegant, eye-friendly slate dark canvas to minimize eye strain",
      dots: ["#0b0f19", "#1f2937", "#6366f1"]
    },
    { 
      id: "forest", 
      label: t.stThemeForest || "ໂໝດທຳມະຊາດ (Forest / Comfort Green)", 
      bg: "bg-[#0a2a22]", 
      border: "border-emerald-900/40", 
      text: "text-emerald-50",
      previewBg: "bg-[#061c17]",
      description: language === "lo" 
        ? "ໂໝດທຳມະຊາດ ສີຂຽວມະລຶກົດ ຖະໜອມສາຍຕາ ເບິ່ງແລ້ວສະບາຍຕາ" 
        : "Nature-inspired therapeutic deep emerald green to rest your eyes",
      dots: ["#061c17", "#0c3128", "#10b981"]
    },
    { 
      id: "glass", 
      label: t.stThemeGlass, 
      bg: "bg-slate-950", 
      border: "border-white/10", 
      text: "text-slate-100",
      previewBg: "bg-gradient-to-br from-[#101827] via-[#1a1b3a] to-[#2e1042]",
      description: language === "lo" 
        ? "ໂໝດໂປ່ງໃສ ຫຼູຫຼາ ທັນສະໄໝ ພ້ອມມິຕິແສງສີ ແລະ ເອັບເຟັກມົວ" 
        : "Futuristic visual style with active cosmic backdrop and blur effects",
      dots: ["#101827", "#1a1b3a", "#a855f7"]
    }
  ];

  return (
    <div id="settings-view" className="space-y-8 font-sans pb-16">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 text-xs font-bold"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO SECTION HEADER WITH VIBRANT COLOR TONE BANNER */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-slate-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{language === "lo" ? "ກຳນົດຄ່າພາສາ, ຮູບແບບ ແລະ ຂໍ້ມູນສ່ວນຕົວ" : "Personalization & Preferences"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-amber-300 shrink-0" />
              <span>{language === "lo" ? t.stSettings : "System Settings"}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {language === "lo" 
                ? "ປັບປ່ຽນພາສາການໃຊ້ງານຂອງລະບົບ, ເລືອກຮູບແບບການສະແດງຜົນ (ທິມມືດ/ທິມສະຫວ່າງ) ແລະ ແກ້ໄຂຂໍ້ມູນໂປຣຟາຍສ່ວນຕົວຂອງທ່ານ" 
                : "Customize system display language, toggle themes (Dark/Light), and manage your personal account profile details."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: System Prefs & Themes */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Language Selection Card */}
          <div id="settings-lang-card" className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
              <Languages className="w-5 h-5 text-blue-500" />
              <span>{t.stLanguage}</span>
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <button
                id="btn-lang-lo"
                onClick={() => setLanguage("lo")}
                className={`py-4 px-6 rounded-2xl font-bold text-xs flex flex-col items-center gap-2 border transition-all hover:scale-102 cursor-pointer ${
                  language === "lo" 
                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/10" 
                    : "bg-slate-500/5 hover:bg-slate-500/10 border-white/5 opacity-80 hover:opacity-100"
                }`}
              >
                <span className="text-xl">🇱🇦</span>
                <span>ພາສາລາວ (Lao)</span>
              </button>
              <button
                id="btn-lang-en"
                onClick={() => setLanguage("en")}
                className={`py-4 px-6 rounded-2xl font-bold text-xs flex flex-col items-center gap-2 border transition-all hover:scale-102 cursor-pointer ${
                  language === "en" 
                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/10" 
                    : "bg-slate-500/5 hover:bg-slate-500/10 border-white/5 opacity-80 hover:opacity-100"
                }`}
              >
                <span className="text-xl">🇺🇸</span>
                <span>English (US)</span>
              </button>
            </div>
          </div>

          {/* Theme Preset Selection Card */}
          <div id="settings-theme-card" className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs space-y-6">
            <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-white/5 pb-4">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-blue-500" />
                <span>{t.stTheme}</span>
              </h4>
              <p className="text-[11px] opacity-60 font-medium">
                {language === "lo"
                  ? "ເລືອກໂທນສີ ແລະ ຮູບແບບການສະແດງຜົນທີ່ສະບາຍຕາ ເພື່ອສ້າງປະສົບການໃຊ້ງານທີ່ດີທີ່ສຸດ"
                  : "Choose a visual mode that best suits your viewing comfort and workplace atmosphere."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {themesList.map((th) => {
                const isSelected = theme === th.id;
                return (
                  <button
                    key={th.id}
                    id={`btn-theme-${th.id}`}
                    onClick={() => setTheme(th.id)}
                    className={`p-5 rounded-2xl border text-left relative overflow-hidden group transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between min-h-[160px] cursor-pointer ${
                      isSelected 
                        ? "border-blue-500 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/5 bg-slate-500/5" 
                        : "border-slate-100 dark:border-white/5 hover:border-blue-500/30 bg-white dark:bg-slate-900/30"
                    }`}
                  >
                    <div className="w-full space-y-2 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className={`font-black text-xs ${th.text} flex items-center gap-2`}>
                          <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: th.dots[2] }} />
                          {th.label}
                        </span>
                        
                        {isSelected ? (
                          <span className="text-blue-500 bg-blue-500/10 p-1 rounded-full">
                            <CheckCircle className="w-4 h-4 fill-current text-blue-500" />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/10 group-hover:border-blue-500/40" />
                        )}
                      </div>

                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {th.description}
                      </p>
                    </div>

                    {/* Miniature Theme Style Visual Block */}
                    <div className="w-full mt-4 flex items-center justify-between relative z-10 pt-3 border-t border-slate-100 dark:border-white/5">
                      <div className="flex gap-1.5">
                        {th.dots.map((c, i) => (
                          <span 
                            key={i} 
                            className="w-4 h-4 rounded-full border border-white/20 shadow-xs" 
                            style={{ backgroundColor: c }} 
                            title={c}
                          />
                        ))}
                      </div>

                      {/* Small visual card preview component mock */}
                      <div className={`w-24 h-10 rounded-lg p-1.5 flex flex-col gap-1 shadow-xs border border-white/5 ${th.previewBg}`}>
                        <div className="h-1.5 w-10 bg-blue-500 rounded-full animate-pulse" />
                        <div className="flex justify-between items-center mt-1">
                          <div className="h-1 w-6 bg-slate-400/30 rounded-full" />
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        </div>
                      </div>
                    </div>

                    {/* Gradient background decorations */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications Preferences */}
          <div id="settings-notifications-card" className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
              <BellRing className="w-5 h-5 text-blue-500" />
              <span>{t.stNotificationSettings}</span>
            </h4>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-center justify-between p-3.5 bg-slate-500/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{t.stInAppNotification}</p>
                    <p className="text-[10px] opacity-60 font-semibold">{language === "lo" ? "ຮັບການແຈ້ງເຕືອນຜ່ານກະດິ່ງໃນແອັບ" : "Receive instant alerts in application bubble"}</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifInApp} 
                  onChange={(e) => setNotifInApp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-white/10"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-500/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <MailCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{t.stEmailNotification}</p>
                    <p className="text-[10px] opacity-60 font-semibold">{t.stEmailMock}: {userProfile.email}</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifEmail} 
                  onChange={(e) => setNotifEmail(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-white/10"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: User Profile Form & System Info */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* User profile complete form */}
          <div id="settings-profile-card" className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs space-y-5">
            <div className="space-y-1 border-b border-slate-100 dark:border-white/5 pb-3">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                <span>ຂໍ້ມູນບັນຊີຜູ້ໃຊ້ງານ</span>
              </h4>
              <p className="text-[11px] opacity-60 font-semibold">
                ອັບເດດຂໍ້ມູນສ່ວນຕົວຂອງທ່ານໃນລະບົບ
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t.usrDisplayName} *</span>
                </label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder={t.usrDisplayName}
                  className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t.department} *</span>
                </label>
                <input 
                  type="text" 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  placeholder="ເຊັ່ນ: ພະແນກແຜນການ ແລະ ການລົງທຶນ"
                  className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t.phone}</span>
                </label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="ເຊັ່ນ: 020 9XXXXXXX"
                  className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>{language === "lo" ? "ຊື່ບັນຊີຜູ້ໃຊ້ (Username)" : "Username"}</span>
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={language === "lo" ? "ຕົວຢ່າງ: somphone" : "e.g. somphone"}
                  className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-500" />
                  <span>{language === "lo" ? "ລະຫັດຜ່ານ (Password)" : "Password"}</span>
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={language === "lo" ? "ຕົວຢ່າງ: 123456" : "e.g. 123456"}
                    className="w-full px-4 py-3 pr-10 rounded-xl themed-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Read Only Email */}
              <div className="space-y-1 opacity-60">
                <label className="text-[11px] font-bold uppercase tracking-wider">
                  {t.email}
                </label>
                <input 
                  type="text" 
                  value={userProfile.email} 
                  disabled 
                  className="w-full px-4 py-3 rounded-xl themed-input text-xs cursor-not-allowed bg-slate-500/10"
                />
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/10 cursor-pointer"
              >
                {loading ? t.loading : t.save}
              </button>

            </form>
          </div>

          {/* System Information Box */}
          <div id="settings-info-card" className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span>{t.stDeveloper} & System Specs</span>
            </h4>

            <div className="space-y-3 text-[11px] leading-relaxed font-semibold">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="opacity-60">ລະບົບ:</span>
                <span className="text-blue-500">E-Office v1.0 (PRO)</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="opacity-60">ສະຖານທີ່:</span>
                <span>{t.officeName}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="opacity-60">ຖານຂໍ້ມູນ:</span>
                <span className="text-emerald-500">Google Firestore Cloud</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">ຟ້ອນຫຼັກ:</span>
                <span className="font-bold">Phetsarath OT</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
