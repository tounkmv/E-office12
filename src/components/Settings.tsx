import { useState, FormEvent, useEffect, useRef, ChangeEvent, DragEvent } from "react";
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
  EyeOff,
  Camera,
  Upload,
  Send,
  Mail,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  X,
  Copy
} from "lucide-react";
import { AppLanguage, AppTheme, UserProfile } from "../types";
import { translations } from "../lib/translations";
import { updateUserProfile, sendAdminTestEmail } from "../lib/firebaseHelper";
import { db, collection, query, where, getDocs, auth, googleProvider, signInWithPopup, GoogleAuthProvider } from "../lib/firebase";
import { getGoogleAccessToken, setGoogleAccessToken } from "../lib/gmailHelper";
import { getSocialNotifyConfig, saveSocialNotifyConfig, SocialNotifyConfig, getWhatsAppShareUrl, getLineShareUrl, sendLineNotifyApi, formatWhatsAppPhone } from "../lib/socialNotifyHelper";
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
  const isLao = language === "lo";

  // User Profile Form States
  const [displayName, setDisplayName] = useState(userProfile.displayName || "");
  const [department, setDepartment] = useState(userProfile.department || "");
  const [phone, setPhone] = useState(userProfile.phone || "");
  const [username, setUsername] = useState(userProfile.username || "");
  const [password, setPassword] = useState(userProfile.password || "");
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile picture upload states
  const [avatar, setAvatar] = useState(userProfile.avatar || "");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gmail Notification testing state & domain authorization guide
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [showDomainHelpModal, setShowDomainHelpModal] = useState(false);
  const [manualToken, setManualToken] = useState(getGoogleAccessToken() || "");
  const [showTokenInput, setShowTokenInput] = useState(false);

  // WhatsApp & LINE Notification State
  const [socialConfig, setSocialConfig] = useState<SocialNotifyConfig>(getSocialNotifyConfig());
  const [waPhoneInput, setWaPhoneInput] = useState(socialConfig.whatsappAdminPhone || "02058590404");
  const [lineTokenInput, setLineTokenInput] = useState(socialConfig.lineNotifyToken || "");
  const [testingLine, setTestingLine] = useState(false);

  const handleSaveSocialConfig = (updated: Partial<SocialNotifyConfig>) => {
    const newCfg = { ...socialConfig, ...updated };
    setSocialConfig(newCfg);
    saveSocialNotifyConfig(newCfg);
    triggerToast(
      isLao ? "ບັນທຶກການຕັ້ງຄ່າ WhatsApp & LINE ສຳເລັດ!" : "WhatsApp & LINE settings saved!"
    );
  };

  const handleTestWhatsAppAlert = () => {
    const adminPhone = waPhoneInput || socialConfig.whatsappAdminPhone || "02058590404";
    const sampleMsg = `🏛️ *[E-Office ຫ້ອງວ່າການແຂວງຫົວພັນ]*\n📌 *ທົດລອງລະບົບແຈ້ງເຕືອນ WhatsApp ແອດມິນ*\n🏢 *ຫ້ອງປະຊຸມ:* ຫ້ອງປະຊຸມໃຫຍ່ A\n📝 *ຫົວຂໍ້:* ກອງປະຊຸມສະຫຼຸບວຽກງານປະຈຳເດືອນ\n📅 *ວັນທີ:* 2026-08-01\n⏰ *ເວລາ:* 08:30 ຫາ 11:30\n👤 *ຜູ້ຍື່ນຈອງ:* ${userProfile.displayName || "ຄໍາຕຸ່ນ ຄໍາມະວົງ"} (${userProfile.department || "ຫ້ອງວ່າການ"})\n📞 *ເບີໂທ:* ${userProfile.phone || "020 5859 0404"}\n👥 *ຈຳນວນ:* 15 ທ່ານ\n👉 *ເຂົ້າກວດສອບ & ອະນຸມັດ:* ${window.location.origin}`;
    const url = getWhatsAppShareUrl(adminPhone, sampleMsg);
    window.open(url, "_blank");
    triggerToast(
      isLao ? `ເປີດແອັບ WhatsApp ເພື່ອສົ່ງຂໍ້ຄວາມແຈ້ງເຕືອນຫາແອດມິນ (${adminPhone})...` : `Opening WhatsApp to send notification to admin (${adminPhone})...`
    );
  };

  const handleTestLineAlert = async () => {
    const sampleMsg = `\n🏛️ [E-Office ຫ້ອງວ່າການແຂວງຫົວພັນ]\n📌 ທົດລອງລະບົບແຈ້ງເຕືອນ LINE ແອດມິນ\n🏢 ຫ້ອງປະຊຸມ: ຫ້ອງປະຊຸມໃຫຍ່ A\n📝 ຫົວຂໍ້: ກອງປະຊຸມສະຫຼຸບວຽກງານປະຈຳເດືອນ\n📅 ວັນທີ: 2026-08-01 (08:30 - 11:30)\n👤 ຜູ້ຍື່ນຈອງ: ${userProfile.displayName || "ຄໍາຕຸ່ນ ຄໍາມະວົງ"}\n👉 ${window.location.origin}`;
    
    if (lineTokenInput.trim()) {
      setTestingLine(true);
      const res = await sendLineNotifyApi(lineTokenInput.trim(), sampleMsg);
      setTestingLine(false);
      if (res.success) {
        triggerToast(
          isLao ? "ສົ່ງແຈ້ງເຕືອນຜ່ານ LINE Notify API ໄປຫາແອັບ LINE ໃນມືຖືສຳເລັດ!" : "LINE Notify sent to mobile successfully!"
        );
      } else {
        // Fallback to LINE Share URL if CORS/token invalid
        const url = getLineShareUrl(sampleMsg);
        window.open(url, "_blank");
        triggerToast(
          isLao ? "ເປີດແອັບ LINE ເພື່ອສົ່ງຂໍ້ຄວາມແຈ້ງເຕືອນ..." : "Opening LINE app to share alert..."
        );
      }
    } else {
      const url = getLineShareUrl(sampleMsg);
      window.open(url, "_blank");
      triggerToast(
        isLao ? "ເປີດແອັບ LINE ເພື່ອສົ່ງຂໍ້ຄວາມແຈ້ງເຕືອນ..." : "Opening LINE app to share alert..."
      );
    }
  };

  useEffect(() => {
    setDisplayName(userProfile.displayName || "");
    setDepartment(userProfile.department || "");
    setPhone(userProfile.phone || "");
    setUsername(userProfile.username || "");
    setPassword(userProfile.password || "");
    setAvatar(userProfile.avatar || "");
    setUploadedFileName("");
  }, [userProfile]);

  const handleConnectGoogleGmail = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        setManualToken(credential.accessToken);
        triggerToast(
          isLao 
            ? "ເຊື່ອມຕໍ່ບັນຊີ Google & Gmail API ສຳເລັດແລ້ວ!" 
            : "Google & Gmail API connected successfully!"
        );
        return credential.accessToken;
      }
    } catch (err: any) {
      console.error("Google Gmail connect error:", err);
      if (err.code === "auth/unauthorized-domain" || err.message?.includes("auth/unauthorized-domain")) {
        setShowDomainHelpModal(true);
      } else {
        alert(err.message || "Failed to connect Google Account");
      }
    }
    return null;
  };

  const handleSaveManualToken = () => {
    if (!manualToken.trim()) {
      alert(isLao ? "ກະລຸນາປ້ອນ Token" : "Please enter a valid access token");
      return;
    }
    setGoogleAccessToken(manualToken.trim());
    triggerToast(
      isLao ? "ບັນທຶກ Google OAuth Access Token ສຳເລັດ!" : "Google OAuth Access Token saved!"
    );
    setShowTokenInput(false);
  };

  const handleTestGmailAlert = async () => {
    setSendingTestEmail(true);
    try {
      let currentToken = getGoogleAccessToken();
      if (!currentToken) {
        currentToken = await handleConnectGoogleGmail();
      }

      await sendAdminTestEmail("tounkmv99@gmail.com");
      triggerToast(
        isLao 
          ? "ສົ່ງອີເມວແຈ້ງເຕືອນແທ້ຫາ Gmail ແອັດມິນ (tounkmv99@gmail.com) ສຳເລັດແລ້ວ!" 
          : "Real notification email sent to Admin Gmail (tounkmv99@gmail.com) successfully!"
      );
    } catch (err: any) {
      console.error("Failed to send test email:", err);
      if (err.code === "auth/unauthorized-domain" || err.message?.includes("auth/unauthorized-domain")) {
        setShowDomainHelpModal(true);
      } else {
        alert(err.message || "Failed to send test email");
      }
    } finally {
      setSendingTestEmail(false);
    }
  };

  const processFile = (file: File) => {
    const isLao = language === "lo";
    if (!file.type.startsWith("image/")) {
      alert(isLao ? "ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ (PNG, JPG, WebP)!" : "Please select an image file only!");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.92);
          setAvatar(compressedBase64);
          setUploadedFileName(file.name);
          triggerToast(isLao ? "ອັບໂຫຼດຮູບໂປຣຟາຍສຳເລັດແລ້ວ! ຢ່າລືມກົດບັນທຶກດ້ານລຸ່ມ" : "Profile picture uploaded! Don't forget to click save below.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

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
        password: password.trim(),
        avatar: avatar
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

          {/* Admin Gmail Notification Active Integration Card */}
          <div id="admin-gmail-card" className="bg-gradient-to-br from-indigo-900/90 via-slate-900 to-indigo-950 p-6 rounded-3xl border-2 border-indigo-500/40 shadow-xl text-white space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <span>{isLao ? "ລະບົບເຊື່ອມຕໍ່ການແຈ້ງເຕືອນ Gmail ແອັດມິນ" : "Admin Gmail Notification Alert"}</span>
                  </h4>
                  <p className="text-[10px] text-indigo-200 font-medium">
                    {isLao ? "ສົ່ງອີເມວແຈ້ງເຕືອນແທ້ຜ່ານ Google Gmail API ໄປຫາແອັບ Gmail ໃນມືຖື" : "Sends real emails via Google Gmail API directly to smartphone app"}
                  </p>
                </div>
              </div>
              
              <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs ${
                getGoogleAccessToken()
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-amber-500/20 border-amber-500/40 text-amber-300"
              }`}>
                <span className={`w-2 h-2 rounded-full inline-block ${getGoogleAccessToken() ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                <span>{getGoogleAccessToken() ? (isLao ? "Gmail API ເຊື່ອມຕໍ່ແລ້ວ" : "GMAIL API ACTIVE") : (isLao ? "ກຳລັງລໍຖ້າ OAuth Token" : "NEEDS AUTH")}</span>
              </span>
            </div>

            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs font-medium">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{isLao ? "ຜູ້ດູແລລະບົບ (Admin Name):" : "Admin Name:"}</span>
                <span className="font-black text-amber-300">ຄໍາຕຸ່ນ ຄໍາມະວົງ</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{isLao ? "ອີເມວ Gmail ແອດມິນ:" : "Admin Gmail:"}</span>
                <span className="font-mono font-black text-emerald-400">tounkmv99@gmail.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{isLao ? "ເງື່ອນໄຂການແຈ້ງເຕືອນ:" : "Trigger Condition:"}</span>
                <span className="font-bold text-white bg-indigo-500/30 px-2 py-0.5 rounded-md text-[11px]">
                  {isLao ? "ເມື່ອມີການຍື່ນຈອງຫ້ອງປະຊຸມເຂົ້າມາໃໝ່" : "On New Meeting Room Booking"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{isLao ? "ຂອບເຂດສິດ OAuth Scope:" : "OAuth Scope:"}</span>
                <span className="font-mono text-[10px] text-amber-300 bg-black/40 px-2 py-0.5 rounded">
                  gmail.send (Google Workspace API)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleConnectGoogleGmail}
                className="bg-white/10 hover:bg-white/20 text-white font-black py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-2 border border-white/20 cursor-pointer transition-all"
              >
                <Key className="w-4 h-4 text-amber-400" />
                <span>{isLao ? "ເຊື່ອມຕໍ່ / ຢືນຢັນສິດ Google OAuth" : "Connect / Authorize Google OAuth"}</span>
              </button>

              <button
                type="button"
                onClick={handleTestGmailAlert}
                disabled={sendingTestEmail}
                className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer border border-red-400/30"
              >
                <Send className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>
                  {sendingTestEmail 
                    ? (isLao ? "ກຳລັງສົ່ງອີເມວແທ້..." : "Sending Real Email...") 
                    : (isLao ? "ທົດລອງສົ່ງອີເມວຫາ tounkmv99@gmail.com" : "Test Real Email to tounkmv99@gmail.com")}
                </span>
              </button>
            </div>

            {/* Sub-tools for Domain Authorization Help and Manual Token Entry */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px]">
              <button
                type="button"
                onClick={() => setShowDomainHelpModal(true)}
                className="text-amber-300 hover:text-amber-200 underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{isLao ? "ວິທີແກ້ໄຂ Firebase: auth/unauthorized-domain" : "Fix Firebase auth/unauthorized-domain"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="text-slate-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>{showTokenInput ? (isLao ? "ຊ່ອນຊ່ອງປ້ອນ Token" : "Hide Token Input") : (isLao ? "ປ້ອນ Access Token ໂດຍທົ່ງ" : "Enter Token Manually")}</span>
              </button>
            </div>

            {/* Manual OAuth Token Input Panel */}
            <AnimatePresence>
              {showTokenInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-2"
                >
                  <label className="block text-[11px] font-bold text-slate-300">
                    {isLao ? "Google OAuth Access Token (ສຳລັບ Gmail API):" : "Google OAuth Access Token:"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="ya29.a0A..."
                      className="flex-1 bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleSaveManualToken}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      {isLao ? "ບັນທຶກ" : "Save"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isLao 
                      ? "ສາມາດໃຊ້ Token ຈາກ Google OAuth Playground ເພື່ອສົ່ງອີເມວໂດຍກົງໄດ້" 
                      : "You can paste an access token from Google OAuth Playground to test sending directly."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* WhatsApp & LINE Social Notification Integration Card */}
          <div id="admin-social-notify-card" className="bg-gradient-to-br from-emerald-950 via-slate-900 to-green-950 p-6 rounded-3xl border-2 border-emerald-500/40 shadow-xl text-white space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <span>{isLao ? "ລະບົບເຊື່ອມຕໍ່ແຈ້ງເຕືອນ WhatsApp & LINE" : "WhatsApp & LINE Admin Notifications"}</span>
                  </h4>
                  <p className="text-[10px] text-emerald-200 font-medium">
                    {isLao ? "ສົ່ງຂໍ້ຄວາມແຈ້ງເຕືອນການຈອງຫ້ອງປະຊຸມໃໝ່ເຂົ້າແອັບ WhatsApp ແລະ LINE ແອດມິນ" : "Instant booking alert dispatch to Admin WhatsApp & LINE apps"}
                  </p>
                </div>
              </div>
              
              <span className="px-2.5 py-1 rounded-full border bg-emerald-500/20 border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>{isLao ? "ພ້ອມໃຊ້ງານ" : "READY"}</span>
              </span>
            </div>

            {/* Config Fields */}
            <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs font-medium">
              
              {/* WhatsApp Config */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-black">WhatsApp</span>
                    <span>{isLao ? "ເບີໂທ WhatsApp ແອດມິນ (Admin WhatsApp Phone):" : "Admin WhatsApp Phone:"}</span>
                  </label>
                  <span className="text-[10px] text-emerald-300 font-mono">
                    Formatted: {formatWhatsAppPhone(waPhoneInput)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={waPhoneInput}
                    onChange={(e) => setWaPhoneInput(e.target.value)}
                    placeholder="020 5859 0404 ຫຼື 85620..."
                    className="flex-1 bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveSocialConfig({ whatsappAdminPhone: waPhoneInput })}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer transition-all"
                  >
                    {isLao ? "ບັນທຶກເບີ" : "Save Phone"}
                  </button>
                </div>
              </div>

              {/* LINE Config */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-green-500 text-white text-[10px] font-black">LINE</span>
                    <span>{isLao ? "LINE Notify Token (ຫຼື ເປີດແຈ້ງເຕືອນຜ່ານ LINE App):" : "LINE Notify Token / Direct App Alert:"}</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lineTokenInput}
                    onChange={(e) => setLineTokenInput(e.target.value)}
                    placeholder="LINE Notify Access Token (ຖ້າມີ)..."
                    className="flex-1 bg-slate-900 border border-green-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-green-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveSocialConfig({ lineNotifyToken: lineTokenInput })}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer transition-all"
                  >
                    {isLao ? "ບັນທຶກ Token" : "Save Token"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-300 italic">
                  * {isLao ? "ຖ້າບໍ່ມີ LINE Token, ລະບົບຈະເປີດແອັບ LINE ເພື່ອສົ່ງຂໍ້ຄວາມຫາແອດມິນໂດຍກົງ" : "If no token is supplied, system generates a direct LINE share message link."}
                </p>
              </div>

              {/* Auto Trigger Checkbox */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-slate-200 text-xs font-bold">
                  {isLao ? "ເປີດແຈ້ງເຕືອນອັດໂນມັດເມື່ອມີການຈອງຫ້ອງປະຊຸມໃໝ່:" : "Auto alert on new meeting room booking:"}
                </span>
                <input
                  type="checkbox"
                  checked={socialConfig.autoTriggerOnBooking}
                  onChange={(e) => handleSaveSocialConfig({ autoTriggerOnBooking: e.target.checked })}
                  className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400 border-white/20 cursor-pointer"
                />
              </div>

            </div>

            {/* Test Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleTestWhatsAppAlert}
                className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer border border-emerald-400/30"
              >
                <Send className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>{isLao ? "ທົດລອງສົ່ງແຈ້ງເຕືອນ WhatsApp" : "Test WhatsApp Alert"}</span>
              </button>

              <button
                type="button"
                onClick={handleTestLineAlert}
                disabled={testingLine}
                className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 hover:from-green-500 hover:to-emerald-500 text-white font-black py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer border border-green-400/30"
              >
                <BellRing className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>
                  {testingLine 
                    ? (isLao ? "ກຳລັງສົ່ງ LINE..." : "Sending LINE...") 
                    : (isLao ? "ທົດລອງສົ່ງແຈ້ງເຕືອນ LINE" : "Test LINE Alert")}
                </span>
              </button>
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
              
              {/* Profile Avatar Upload Slot */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isLao ? "ຮູບພາບໂປຣຟາຍ (Profile Picture)" : "Profile Picture"}</span>
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-500/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  {/* Left: Round image preview */}
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-blue-500 shadow-md">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-black text-blue-600 dark:text-blue-400 uppercase">
                          {displayName ? displayName.charAt(0) : "U"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Drag-and-drop / Select PC box */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 w-full p-3.5 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
                      isDragging 
                        ? "border-amber-400 bg-amber-400/10 text-amber-500" 
                        : "border-slate-300 dark:border-white/10 hover:border-blue-500/50 hover:bg-slate-500/10"
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <Upload className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-[10px] font-bold">
                      {isLao ? "ລາກໄຟລ໌ຮູບມານີ້ ຫຼື ຄລິກເພື່ອອັບໂຫຼດ" : "Drag image here or click to upload"}
                    </p>
                    <p className="text-[8px] opacity-60 mt-0.5">
                      {uploadedFileName ? `${isLao ? "ໄຟລ໌:" : "File:"} ${uploadedFileName}` : "PNG, JPG, WebP (Max 300x300)"}
                    </p>
                  </div>
                </div>
              </div>
              
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

      {/* Firebase Domain Authorization Help Modal */}
      <AnimatePresence>
        {showDomainHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl space-y-5 relative overflow-hidden"
            >
              <button
                onClick={() => setShowDomainHelpModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-amber-300">
                    {isLao ? "ວິທີແກ້ໄຂ Firebase: auth/unauthorized-domain" : "Fix Firebase auth/unauthorized-domain"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isLao ? "ອະນຸມັດໂດເມນນີ້ເພື່ອເປີດໃຊ້ Google & Gmail API" : "Authorize this domain to enable Google & Gmail API"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-200">
                <p className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-200">
                  <b>{isLao ? "ສາເຫດ:" : "Reason:"}</b> {isLao ? "ຂໍ້ຄວາມເຕືອນ 'auth/unauthorized-domain' ເກີດຂຶ້ນຍ້ອນ Firebase Security ຕ້ອງການໃຫ້ເພີ່ມໂດເມນ " : "Firebase requires whitelisting domain "} 
                  <code className="bg-black/60 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">{window.location.hostname}</code> 
                  {isLao ? " ເຂົ້າໃນ Authorized Domains List." : " in Authorized Domains List."}
                </p>

                <h4 className="font-bold text-white text-xs pt-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{isLao ? "ຂັ້ນຕອນການເພີ່ມ 3 ຂັ້ນຕອນງ່າຍໆ:" : "3 Steps to Add Authorized Domain:"}</span>
                </h4>

                <ol className="list-decimal list-inside space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <li className="font-medium">
                    {isLao ? "ເຂົ້າໄປທີ່ " : "Go to "} 
                    <a 
                      href="https://console.firebase.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-400 font-bold underline inline-flex items-center gap-1 hover:text-indigo-300"
                    >
                      <span>Firebase Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li className="font-medium">
                    {isLao ? "ເລືອກໂຄງການ -> ເມນູ " : "Select Project -> "} 
                    <b className="text-amber-300">Authentication</b> -&gt; <b className="text-amber-300">Settings</b> -&gt; <b className="text-amber-300">Authorized domains</b>
                  </li>
                  <li className="font-medium">
                    {isLao ? "ກົດປຸ່ມ " : "Click "} <b className="text-emerald-400">Add domain</b> {isLao ? " ແລ້ວວາງໂດເມນນີ້:" : " and add domain:"}
                    <div className="mt-2 flex items-center justify-between bg-black/60 border border-indigo-500/30 p-2 rounded-xl">
                      <span className="font-mono text-xs text-amber-300 font-bold px-1 select-all">{window.location.hostname}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.hostname);
                          triggerToast(isLao ? "ກັອບປີ້ໂດເມນແລ້ວ!" : "Domain copied!");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{isLao ? "ກັອບປີ້" : "Copy"}</span>
                      </button>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDomainHelpModal(false);
                    setShowTokenInput(true);
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-3 rounded-xl text-xs text-center cursor-pointer border border-white/10"
                >
                  {isLao ? "ປ້ອນ Access Token ໂດຍທົ່ງ" : "Enter Access Token Manually"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDomainHelpModal(false)}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs cursor-pointer shadow-md"
                >
                  {isLao ? "ເຂົ້າໃຈແລ້ວ" : "Got it"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
