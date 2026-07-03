import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Mail, 
  CheckCheck, 
  User as UserIcon, 
  Building2, 
  Phone,
  Clock,
  ExternalLink,
  X,
  Camera,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  Sliders,
  Sparkles,
  ShieldAlert,
  CalendarDays,
  Upload
} from "lucide-react";
import { db, collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "../lib/firebase";
import { AppLanguage, SystemNotification, UserProfile } from "../types";
import { translations } from "../lib/translations";
import { EmailLog, updateUserProfile, markEmailAsRead } from "../lib/firebaseHelper";
import { showSystemToast } from "../utils/toast";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  userProfile: UserProfile | null;
  language: AppLanguage;
  setLanguage?: (lang: AppLanguage) => void;
  onUpdateProfile?: (updated: UserProfile) => void;
}

const PRESET_AVATARS = [
  { id: "av1", name: "Professional Woman", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "av2", name: "Professional Man", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "av3", name: "Creative Woman", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "av4", name: "Creative Man", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "av5", name: "Modern Scientist", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "av6", name: "Lead Engineer", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "av7", name: "Coordinator", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "av8", name: "Consultant", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80" }
];

export default function Navbar({ userProfile, language, setLanguage, onUpdateProfile }: NavbarProps) {
  const t = translations[language];
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmailLogs, setShowEmailLogs] = useState(false);

  // Expanded interaction detail modal states
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  // Compute unread email logs count
  const unreadEmailCount = emailLogs.filter(log => !log.isRead).length;

  // Profile Drawer / Modal Settings State
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const isLao = language === "lo";

  // Upload Avatar states & references
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert(isLao ? "ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ!" : "Please select an image file only!");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to downscale and compress image to fit beautifully in standard 150x150
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
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
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
          setAvatar(compressedBase64);
          setCustomAvatarUrl(""); // Reset preset/url fields
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Pre-fill profile states
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setDepartment(userProfile.department || "");
      setPhone(userProfile.phone || "");
      setBio(userProfile.bio || "");
      setAvatar(userProfile.avatar || "");
    }
  }, [userProfile, showProfileDrawer]);

  // Subscribe to user notifications and admin notifications
  useEffect(() => {
    if (!userProfile) return;

    const notifRef = collection(db, "notifications");
    // Get notifications for either this specific user, or "admin" if the user is an admin
    const allowedUserIds = [userProfile.uid];
    if (userProfile.role === "admin") {
      allowedUserIds.push("admin");
    }

    const q = query(
      notifRef,
      where("userId", "in", allowedUserIds),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: SystemNotification[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as SystemNotification);
      });
      setNotifications(items);
    }, (error) => {
      console.error("Notifications subscripton error:", error);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Subscribe to email logs (simulated email notifications database)
  useEffect(() => {
    if (!userProfile) return;

    const emailRef = collection(db, "emails");
    // Admins can see all emails, regular users see only their own
    const q = userProfile.role === "admin" 
      ? query(emailRef, orderBy("sentAt", "desc"))
      : query(emailRef, where("to", "==", userProfile.email));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: EmailLog[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as EmailLog);
      });
      // Sort client-side by sentAt descending to avoid composite index requirements
      items.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      setEmailLogs(items.slice(0, 30)); // limit to 30 logs
    }, (error) => {
      console.error("Email log subscription error:", error);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.isRead);
      for (const notif of unreadNotifs) {
        await updateDoc(doc(db, "notifications", notif.id), { isRead: true });
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (err) {
      console.error("Error marking one read:", err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSavingProfile(true);
    setSaveSuccessMsg("");

    try {
      const finalAvatar = customAvatarUrl.trim() !== "" ? customAvatarUrl.trim() : avatar;
      const updates = {
        displayName,
        department,
        phone,
        bio,
        avatar: finalAvatar
      };

      await updateUserProfile(userProfile.uid, updates);

      if (onUpdateProfile) {
        const merged = { ...userProfile, ...updates };
        onUpdateProfile(merged);
        localStorage.setItem("local-auth-profile", JSON.stringify(merged));
      }

      const successMsg = isLao ? "ອັບເດດຂໍ້ມູນໂປຣຟາຍສຳເລັດ!" : "Profile updated successfully!";
      setSaveSuccessMsg(successMsg);
      showSystemToast(successMsg, "success", isLao ? "ຂໍ້ມູນໂປຣຟາຍ" : "User Profile");

      setTimeout(() => {
        setSaveSuccessMsg("");
        setShowProfileDrawer(false);
      }, 1500);
    } catch (err: any) {
      console.error("Save profile error:", err);
      showSystemToast(err.message || "Failed to save profile", "error", "ERROR");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <header id="navbar-header" className="h-22 md:h-24 w-full flex items-center justify-between px-6 md:px-8 border-b border-indigo-500/15 dark:border-white/10 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl sticky top-0 z-30 shadow-md">
      
      {/* Redesigned Brand header area featuring Laos National Emblem */}
      <div id="navbar-left" className="flex items-center gap-4">
        <div className="p-1.5 bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-white/10 rounded-2xl shadow-sm shrink-0 flex items-center justify-center">
          <img 
            src="/emblem.png" 
            alt="Laos State Emblem Logo" 
            className="w-13 h-13 md:w-14 md:h-14 object-contain filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.35)] hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Emblem_of_Laos_%282025-%29.svg/800px-Emblem_of_Laos_%282025-%29.svg.png"; }}
          />
        </div>
        <div>
          <h2 id="navbar-greeting" className="text-base md:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight tracking-tight drop-shadow-sm">
            {t.appTitle}
          </h2>
          <p id="navbar-sub" className="text-xs md:text-sm text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-xs shadow-red-500" />
            <span>{t.officeName}</span>
          </p>
        </div>
      </div>

      <div id="navbar-right" className="flex items-center gap-3 md:gap-4">
        
        {/* Prominent Sleek Language Switch Button */}
        {setLanguage && (
          <button
            onClick={() => setLanguage(language === "lo" ? "en" : "lo")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 text-indigo-700 dark:text-indigo-300 font-black text-xs md:text-sm border border-indigo-200/80 dark:border-indigo-500/30 shadow-sm hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all duration-300 cursor-pointer"
            title="Switch Language / ປ່ຽນພາສາ"
          >
            <span className="text-base md:text-lg leading-none">{language === "lo" ? "🇱🇦" : "🇬🇧"}</span>
            <span className="tracking-wider uppercase font-black">{language === "lo" ? "ລາວ (LO)" : "EN"}</span>
          </button>
        )}

        {/* Email Outbox Log Button (Email Notification system visibility) */}
        <div className="relative">
          <button
            id="btn-email-logs"
            onClick={() => {
              setShowEmailLogs(!showEmailLogs);
              setShowNotifications(false);
            }}
            className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-amber-400 relative transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-indigo-500/25 border border-transparent hover:border-indigo-400/60 cursor-pointer"
            title="Email Outbox (Simulated System)"
          >
            <Mail className="w-5.5 h-5.5 md:w-6 md:h-6" />
            {unreadEmailCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white font-mono text-[10px] md:text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-sm shadow-emerald-500">
                {unreadEmailCount}
              </span>
            )}
          </button>

          {/* Email Logs Dropdown */}
          <AnimatePresence>
            {showEmailLogs && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                id="email-logs-dropdown"
                className="absolute right-0 mt-3 w-96 bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl p-5 border border-slate-100 dark:border-white/5 overflow-hidden z-40 max-h-[500px] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-500">
                    <Mail className="w-4 h-4" /> 
                    <span>ອີເມວລະບົບ (Email Logs)</span>
                  </h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                    SMTP Active
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 mt-4 pr-1">
                  {emailLogs.length === 0 ? (
                    <div className="text-center py-8 text-xs opacity-60">
                      ບໍ່ມີບັນທຶກການສົ່ງອີເມວ
                    </div>
                  ) : (
                    emailLogs.map((log) => (
                      <div 
                        key={log.id} 
                        onClick={async () => {
                          setSelectedEmail(log);
                          setShowEmailLogs(false);
                          if (!log.isRead) {
                            try {
                              await markEmailAsRead(log.id);
                            } catch (error) {
                              console.error("Failed to mark email as read:", error);
                            }
                          }
                        }}
                        className={`p-3 rounded-2xl border text-xs transition-all duration-200 cursor-pointer ${
                          log.isRead 
                            ? "bg-slate-50/70 dark:bg-slate-900/20 border-slate-100 dark:border-white/5 opacity-75 hover:opacity-100" 
                            : "bg-emerald-500/10 border-emerald-500/20 shadow-xs hover:bg-emerald-500/15"
                        }`}
                      >
                        <div className="flex justify-between font-bold text-[11px] mb-1 text-slate-700 dark:text-slate-300">
                          <span className="truncate max-w-[200px] flex items-center gap-1.5">
                            {!log.isRead && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                            )}
                            <span>ຫາ: {log.to}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.sentAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">{log.subject}</div>
                        <div 
                          className="text-[10px] opacity-75 line-clamp-2 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg font-mono border border-slate-200/40 dark:border-white/5"
                          dangerouslySetInnerHTML={{ __html: log.body }}
                        />
                        <div className="text-[9px] text-indigo-500 font-extrabold tracking-wider mt-2 uppercase flex items-center gap-1">
                          <span>{isLao ? "ຄລິກເພື່ອອ່ານລາຍລະອຽດ" : "Click to read details"}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* In-App Notification Bell Button */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowEmailLogs(false);
            }}
            className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-amber-400 relative transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-indigo-500/25 border border-transparent hover:border-indigo-400/60 cursor-pointer"
          >
            <Bell className="w-5.5 h-5.5 md:w-6 md:h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] md:text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-sm shadow-red-500">
                {unreadCount}
              </span>
            )}
          </button>

          {/* In-App Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                id="notifications-dropdown"
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl p-5 border border-slate-100 dark:border-white/5 overflow-hidden z-40 max-h-[450px] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    {t.ntTitle}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-semibold"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {t.ntMarkAllRead}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-xs opacity-60">
                      {t.ntNoNotifications}
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => {
                          handleMarkOneRead(notif.id);
                          setSelectedNotification(notif);
                          setShowNotifications(false);
                        }}
                        className={`p-3 rounded-2xl border transition-all duration-200 text-xs cursor-pointer ${
                          notif.isRead 
                            ? "bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-white/5 opacity-75 hover:opacity-100" 
                            : "bg-blue-500/10 border-blue-500/20 shadow-xs hover:bg-blue-500/15"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className={`${
                            notif.type === "success" ? "text-green-500" :
                            notif.type === "error" ? "text-red-500" :
                            notif.type === "warning" ? "text-amber-500" : "text-blue-500"
                          }`}>
                            {notif.title}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <p className="opacity-90 leading-relaxed mb-1.5 text-slate-700 dark:text-slate-300 line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clickable User Badge Dropdown Initiator with Upgraded Typography & Glow Effect */}
        {userProfile && (
          <button 
            id="user-profile-badge" 
            onClick={() => setShowProfileDrawer(true)}
            className="flex items-center gap-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/50 to-purple-50/50 hover:from-indigo-100 hover:to-purple-100 dark:from-slate-900/80 dark:via-indigo-950/50 dark:to-purple-950/50 dark:hover:from-indigo-900/60 dark:hover:to-purple-900/60 px-4 py-2 rounded-2xl border border-indigo-200/80 dark:border-indigo-500/30 shadow-sm hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.03] active:scale-95 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all duration-300 cursor-pointer text-left group"
          >
            {userProfile.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt={userProfile.displayName} 
                className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover border-2 border-indigo-400 dark:border-amber-400 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-2 border-indigo-300 dark:border-amber-400 flex items-center justify-center font-black text-sm md:text-base shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm md:text-base font-black text-slate-800 dark:text-white leading-tight flex items-center gap-1.5 group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors">
                <span>{userProfile.displayName}</span>
                <Sliders className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              </span>
              <span className="text-xs md:text-sm text-indigo-700 dark:text-indigo-300 font-extrabold tracking-wide mt-0.5 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="truncate max-w-[180px]">{userProfile.department || userProfile.email}</span>
              </span>
            </div>
          </button>
        )}
      </div>

      {/* --- Overlay Modals for interactive reading --- */}

      {/* 1. Notification Detail Reader Overlay Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1e293b] rounded-3xl max-w-md w-full border border-slate-100 dark:border-white/10 shadow-2xl p-6 relative"
            >
              <button 
                onClick={() => setSelectedNotification(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${
                  selectedNotification.type === "success" ? "bg-emerald-500/10 text-emerald-500" :
                  selectedNotification.type === "error" ? "bg-red-500/10 text-red-500" :
                  selectedNotification.type === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                }`}>
                  {selectedNotification.type === "success" ? <CheckCircle className="w-5 h-5" /> : 
                   selectedNotification.type === "error" ? <ShieldAlert className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {selectedNotification.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {isLao ? "ການແຈ້ງເຕືອນລະບົບ" : "System Notification"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-100 dark:border-white/5 mb-4">
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-semibold whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(selectedNotification.createdAt).toLocaleDateString()} {new Date(selectedNotification.createdAt).toLocaleTimeString()}
                </span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-md font-bold uppercase text-[9px]">
                  {isLao ? "ອ່ານແລ້ວ" : "Read"}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Email log Reader Overlay Modal */}
      <AnimatePresence>
        {selectedEmail && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1e293b] rounded-3xl max-w-2xl w-full border border-slate-100 dark:border-white/10 shadow-2xl p-6 relative flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedEmail(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Mail className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {selectedEmail.subject}
                  </h4>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                    {isLao ? "ຈຳລອງການສົ່ງເມວລະບົບ (Simulated SMTP Log)" : "Simulated SMTP Email Outbox"}
                  </p>
                </div>
              </div>

              {/* Email Client Header styling */}
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-3 border border-slate-100 dark:border-white/5 text-[11px] font-semibold space-y-1 mb-4 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="opacity-60">{isLao ? "ຜູ້ຮັບ (To):" : "To:"}</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedEmail.to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">{isLao ? "ສົ່ງເມື່ອ (Sent):" : "Sent:"}</span>
                  <span className="font-bold">{new Date(selectedEmail.sentAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">{isLao ? "ລະຫັດ SMTP:" : "SMTP Mailer ID:"}</span>
                  <span className="font-mono text-[9px] opacity-70">{selectedEmail.id}</span>
                </div>
              </div>

              {/* Email Content Frame */}
              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#111827] rounded-2xl border border-slate-200/50 dark:border-white/5 p-5 font-sans mb-4">
                <div 
                  className="prose dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />
              </div>

              <div className="text-right">
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  {isLao ? "ປິດໜ້າຕ່າງ" : "Close Reader"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Comprehensive User Profile Settings Drawer Modal */}
      <AnimatePresence>
        {showProfileDrawer && userProfile && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1e293b] rounded-3xl max-w-2xl w-full border border-slate-100 dark:border-white/10 shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <Sliders className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      {isLao ? "ຕັ້ງຄ່າຂໍ້ມູນສ່ວນຕົວລະອຽດ" : "Detailed User Profile Settings"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {isLao ? "ຈັດການຮູບພາບ, ຂໍ້ມູນຕິດຕໍ່ ແລະ ປະຫວັດ" : "Customize avatar image, credentials & contact metadata"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Profile Picture Avatar Selection Section */}
                <div className="space-y-3">
                  <label className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-500" />
                    <span>{isLao ? "ເລືອກ ຫຼື ປ່ຽນຮູບພາບໂປຣຟາຍ" : "Select or Upload Profile Picture"}</span>
                  </label>

                  <div className="flex flex-col md:flex-row gap-5 items-center bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                    {/* Current Avatar preview */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md relative group bg-indigo-500/10">
                        {customAvatarUrl.trim() !== "" ? (
                          <img 
                            src={customAvatarUrl} 
                            alt="Custom Avatar Preview" 
                            className="w-full h-full object-cover"
                            onError={() => setCustomAvatarUrl("")}
                          />
                        ) : avatar ? (
                          <img 
                            src={avatar} 
                            alt="Selected Avatar Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-500">
                            {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-indigo-500 font-extrabold uppercase bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {isLao ? "ຕົວຢ່າງຮູບ" : "Preview"}
                      </span>
                    </div>

                    {/* Pre-set Avatars Picker Grid */}
                    <div className="flex-1 space-y-2">
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {isLao ? "ເລືອກຈາກຮູບພາບຕົວແທນລະບົບ:" : "Pick a preset premium portrait style:"}
                      </p>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {PRESET_AVATARS.map((av) => (
                          <button
                            type="button"
                            key={av.id}
                            onClick={() => {
                              setAvatar(av.url);
                              setCustomAvatarUrl(""); // Reset custom url input
                            }}
                            className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer ${
                              avatar === av.url && customAvatarUrl === ""
                                ? "border-indigo-500 ring-2 ring-indigo-500/20 scale-105" 
                                : "border-transparent opacity-80 hover:opacity-100"
                            }`}
                            title={av.name}
                          >
                            <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>

                      {/* Custom image URL option */}
                      <div className="pt-2">
                        <p className="text-[10px] text-slate-400 font-semibold mb-1">
                          {isLao ? "ຫຼື ວາງ URL ຮູບພາບຂອງທ່ານເອງ:" : "Or paste custom image Link URL:"}
                        </p>
                        <input
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
                          value={customAvatarUrl}
                          onChange={(e) => setCustomAvatarUrl(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg themed-input text-[10px]"
                        />
                      </div>

                      {/* Premium Local File Upload Dropzone */}
                      <div className="pt-2">
                        <p className="text-[10px] text-slate-400 font-semibold mb-1">
                          {isLao ? "ຫຼື ອັບໂຫຼດຮູບພາບຈາກຄອມພິວເຕີ:" : "Or upload image file from computer:"}
                        </p>
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                            isDragging
                              ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-500 scale-[1.01]"
                              : "border-slate-200 hover:border-indigo-400 hover:bg-slate-100/30 dark:border-white/10 dark:hover:border-white/20 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                          />
                          <Upload className={`w-5 h-5 ${isDragging ? "animate-bounce text-indigo-500" : "text-slate-400"}`} />
                          <div className="text-[10px] font-bold">
                            {isLao ? "ຄລິກ ຫຼື ລາກຮູບມາປະໄວ້ທີ່ນີ້ເພື່ອອັບໂຫຼດ" : "Click or drag image file here to upload"}
                          </div>
                          <div className="text-[9px] text-slate-400 font-semibold">
                            {isLao ? "ຮອງຮັບ JPEG, PNG ແລະ ຈະຖືກປັບຂະໜາດໃຫ້ພໍດີໂດຍອັດຕະໂນມັດ" : "Supports JPEG, PNG. Automatically resized"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Personal Parameters Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {isLao ? "ຊື່ ແລະ ນາມສະກຸນ" : "Display Name"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl themed-input text-xs"
                      placeholder="Display Name"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {isLao ? "ພະແນກ / ສັງກັດ" : "Department"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl themed-input text-xs"
                      placeholder="e.g. Planning Department"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {isLao ? "ເບີໂທຕິດຕໍ່" : "Phone Number"}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl themed-input text-xs"
                      placeholder="e.g. 020 XXXXXXXX"
                    />
                  </div>

                  {/* Read Only Email */}
                  <div className="space-y-1.5 opacity-60">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {isLao ? "ອີເມວ (ປ່ຽນບໍ່ໄດ້)" : "Email Address (Read-only)"}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={userProfile.email}
                      className="w-full px-4 py-2.5 rounded-xl themed-input text-xs bg-slate-100 dark:bg-slate-900/50 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* 3. Short Bio / Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isLao ? "ແນະນຳຕົວຫຍໍ້ / ໜ້າທີ່ຮັບຜິດຊອບ" : "Short Biography / Duties Description"}</span>
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={isLao ? "ຂຽນລາຍລະອຽດໜ້າທີ່ ຫຼື ຕຳແໜ່ງຂອງທ່ານພາຍໃນຫ້ອງການ..." : "Write a brief sentence about your official duties..."}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs resize-none"
                  />
                </div>

                {/* 4. Credentials metadata block */}
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-100 dark:border-white/5 space-y-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>{isLao ? "ລະດັບການເຂົ້າເຖິງ:" : "Access Role Privilege:"}</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">
                      {userProfile.role === "admin" ? t.admin : t.user}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isLao ? "ສະຖານະບັນຊີ:" : "Account System Status:"}</span>
                    <span className="font-bold text-emerald-500">
                      ● {isLao ? "ອະນຸມັດພ້ອມໃຊ້ງານ" : "Active Approved"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isLao ? "ວັນທີສ້າງບັນຊີ:" : "Registration Date:"}</span>
                    <span>{new Date(userProfile.createdAt).toLocaleString()}</span>
                  </div>
                </div>

              </form>

              {/* Footer action buttons */}
              <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/10 flex justify-end gap-3">
                {saveSuccessMsg && (
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 animate-pulse mr-auto pl-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{saveSuccessMsg}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowProfileDrawer(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  {isLao ? "ຍົກເລີກ" : "Cancel"}
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {savingProfile ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isLao ? "บันທຶກການຕັ້ງຄ່າ" : "Save Changes"}</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </header>
  );
}

