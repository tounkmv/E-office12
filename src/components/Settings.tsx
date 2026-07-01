import { useState, FormEvent } from "react";
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
  MailCheck
} from "lucide-react";
import { AppLanguage, AppTheme, UserProfile } from "../types";
import { translations } from "../lib/translations";
import { updateUserProfile } from "../lib/firebaseHelper";
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
    try {
      const updates = { displayName, department, phone };
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

  const themesList: { id: AppTheme; label: string; bg: string; border: string; text: string }[] = [
    { id: "light", label: t.stThemeLight, bg: "bg-white", border: "border-slate-200", text: "text-slate-900" },
    { id: "dark", label: t.stThemeDark, bg: "bg-slate-900", border: "border-slate-800", text: "text-white" },
    { id: "glass", label: t.stThemeGlass, bg: "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950", border: "border-white/15", text: "text-slate-100" }
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

      <div className="flex items-center gap-2 border-b border-white/5 pb-4">
        <SettingsIcon className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
          {t.stSettings}
        </h3>
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
          <div id="settings-theme-card" className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
              <Paintbrush className="w-5 h-5 text-blue-500" />
              <span>{t.stTheme}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themesList.map((th) => {
                const isSelected = theme === th.id;
                return (
                  <button
                    key={th.id}
                    id={`btn-theme-${th.id}`}
                    onClick={() => setTheme(th.id)}
                    className={`p-4 rounded-2xl border flex flex-col justify-between items-start text-left h-28 relative overflow-hidden group transition-all duration-300 hover:scale-102 cursor-pointer ${
                      isSelected 
                        ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/5" 
                        : "border-white/5 hover:border-blue-500/30"
                    } ${th.bg}`}
                  >
                    <span className={`font-extrabold text-[11px] leading-snug ${th.text}`}>
                      {th.label}
                    </span>
                    <div className="flex gap-1">
                      <span className="w-4 h-4 rounded-full bg-blue-500" />
                      <span className="w-4 h-4 rounded-full bg-emerald-500" />
                      <span className="w-4 h-4 rounded-full bg-violet-500" />
                    </div>
                    {isSelected && (
                      <span className="absolute bottom-2 right-2 text-blue-500">
                        <CheckCircle className="w-4 h-4 fill-current text-white dark:text-slate-900" />
                      </span>
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
