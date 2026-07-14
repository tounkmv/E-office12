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
  Upload,
  UserCheck,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import { db, collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDocs } from "../lib/firebase";
import { AppLanguage, SystemNotification, UserProfile } from "../types";
import { translations } from "../lib/translations";
import { EmailLog, updateUserProfile, markEmailAsRead } from "../lib/firebaseHelper";
import { showSystemToast } from "../utils/toast";
import { motion, AnimatePresence } from "motion/react";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";

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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const isLao = language === "lo";

  // Upload Avatar states & references
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showSystemToast(
        isLao ? "ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ (PNG, JPG, WebP)!" : "Please select an image file only!",
        "error",
        isLao ? "ຂໍ້ຜິດພາດ" : "Error"
      );
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to downscale and compress image to fit beautifully in high-def 300x300
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
          setCustomAvatarUrl(""); // Reset preset/url fields
          setUploadedFileName(file.name);
          showSystemToast(
            isLao ? "ອັບໂຫຼດຮູບໂປຣຟາຍສຳເລັດແລ້ວ! ກົດປຸ່ມ 'ບັນທຶກການຕັ້ງຄ່າ' ດ້ານລຸ່ມເພື່ອຢືນຢັນ" : "Profile picture uploaded! Click 'Save Changes' below to confirm",
            "success",
            isLao ? "ອັບໂຫຼດຮູບພາບ" : "Avatar Uploaded"
          );
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
      setUsername(userProfile.username || "");
      setPassword(userProfile.password || "");
      setUploadedFileName("");
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
      const targetUsername = username.trim();
      const targetPassword = password.trim();

      if (targetUsername) {
        if (targetUsername.toLowerCase() === "admin" && userProfile.uid !== "admin_default") {
          showSystemToast(
            isLao ? "ບໍ່ສາມາດໃຊ້ຊື່ຜູ້ໃຊ້ 'Admin' ໄດ້" : "Username 'Admin' is reserved",
            "error",
            isLao ? "ຂໍ້ຜິດພາດ" : "Error"
          );
          setSavingProfile(false);
          return;
        }

        // Check unique username
        const q = query(
          collection(db, "users"),
          where("username", "==", targetUsername)
        );
        const snapshot = await getDocs(q);
        let exists = false;
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== userProfile.uid) {
            exists = true;
          }
        });

        if (exists) {
          showSystemToast(
            isLao ? "ຊື່ຜູ້ໃຊ້ນີ້ມີໃນລະບົບແລ້ວ! ກະລຸນາໃຊ້ຊື່ຜູ້ໃຊ້ອື່ນ" : "Username already exists! Please choose another one",
            "error",
            isLao ? "ຂໍ້ຜິດພາດ" : "Error"
          );
          setSavingProfile(false);
          return;
        }
      }

      const finalAvatar = customAvatarUrl.trim() !== "" ? customAvatarUrl.trim() : avatar;
      const updates = {
        displayName,
        department,
        phone,
        bio,
        avatar: finalAvatar,
        username: targetUsername || "",
        password: targetPassword || ""
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
    <header id="navbar-header" className="h-28 w-full flex items-center justify-between px-4 sm:px-6 md:px-8 border-b-2 border-amber-400/50 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white sticky top-0 z-30 shadow-[0_10px_35px_rgba(0,0,0,0.65)] backdrop-blur-3xl relative overflow-visible">
      
      {/* Decorative animated bottom glowing ribbon */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80 pointer-events-none" />

      {/* Redesigned bottom-left glowing color bar/stripe that is equal/aligned with the logo section */}
      <div className="absolute bottom-0 left-0 w-24 h-[3.5px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.9)] z-10 rounded-r-full" />

      {/* 1. LEFT COLUMN: Sleek Logo & System Status */}
      <div id="navbar-left" className="flex items-center gap-3 md:gap-4 z-10">
        {/* System Emblem Logo */}
        <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md shrink-0 flex items-center justify-center">
          <img 
            src={emblemLogo} 
            alt="Laos State Emblem" 
            className="w-10 h-10 object-contain filter drop-shadow-[0_1.5px_4px_rgba(251,191,36,0.4)]"
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
        
        {/* Color stripe/accent bar matching the logo */}
        <div className="h-8 w-[3px] bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 rounded-full shrink-0" />

        {/* System Online Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-amber-300 font-black shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
          <span className="tracking-wide">{isLao ? "ລະບົບອອນລາຍ (ONLINE)" : "SYSTEM ONLINE"}</span>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: Modern Controls & User Badge */}
      <div id="navbar-right" className="flex items-center justify-end gap-2 sm:gap-3 min-w-0">
        
        {/* Prominent Sleek Language Switch Button */}
        {setLanguage && (
          <button
            onClick={() => setLanguage(language === "lo" ? "en" : "lo")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-amber-300 font-black text-xs md:text-sm border border-amber-400/40 shadow-sm hover:shadow-lg hover:shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shrink-0"
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
            className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-amber-400/20 text-white hover:text-amber-300 relative transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-amber-500/20 border border-white/15 hover:border-amber-400/50 cursor-pointer shrink-0"
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                      SMTP Active
                    </span>
                    <button 
                      onClick={() => setShowEmailLogs(false)}
                      className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
                      title={isLao ? "ປິດ" : "Close"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
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
            className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-amber-400/20 text-white hover:text-amber-300 relative transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-amber-500/20 border border-white/15 hover:border-amber-400/50 cursor-pointer shrink-0"
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
                  <div className="flex items-center gap-3">
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
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
                    title={isLao ? "ປິດ" : "Close"}
                  >
                    <X className="w-4 h-4" />
                  </button>
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

        {/* Clickable Admin Settings & User Profile Badge with Upgraded Luxury UI */}
        {userProfile && (
          <button 
            id="user-profile-badge" 
            onClick={() => setShowProfileDrawer(true)}
            className="flex items-center gap-2.5 sm:gap-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 hover:from-slate-800 hover:to-indigo-900 px-3 sm:px-4 py-2 rounded-2xl border-2 border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.25)] hover:shadow-[0_0_28px_rgba(251,191,36,0.5)] hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer text-left group shrink-0 relative overflow-hidden"
            title={isLao ? "ຄລິກເພື່ອຕັ້ງຄ່າບັນຊີ ແລະ ຂໍ້ມູນຜູ້ດູແລລະບົບ" : "Click to manage admin account & profile settings"}
          >
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-400/15 rounded-full blur-xl pointer-events-none group-hover:bg-amber-400/30 transition-colors" />
            
            <div className="relative shrink-0">
              {userProfile.avatar ? (
                <img 
                  src={userProfile.avatar} 
                  alt={userProfile.displayName} 
                  className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full object-cover border-2 border-amber-400 shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-2 border-amber-400 flex items-center justify-center font-black text-sm md:text-base shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
                  {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                </div>
              )}
              {userProfile.role === "admin" && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-xs animate-pulse" title="Admin">
                  <Sliders className="w-2.5 h-2.5 font-bold" />
                </span>
              )}
            </div>

            <div className="flex flex-col text-left min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-black text-white leading-tight truncate max-w-[85px] sm:max-w-[130px] group-hover:text-amber-300 transition-colors">
                  {userProfile.displayName || (isLao ? "ຜູ້ໃຊ້ງານ" : "User")}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow-xs flex items-center gap-1 shrink-0 group-hover:brightness-110">
                  <Sliders className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin-slow shrink-0" />
                  <span>{userProfile.role === "admin" ? (isLao ? "ຕັ້ງຄ່າຜູ້ດູແລ" : "Admin") : (isLao ? "ຕັ້ງຄ່າໂປຣຟາຍ" : "Settings")}</span>
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-indigo-200 font-bold tracking-wide mt-0.5 flex items-center gap-1 truncate max-w-[140px] sm:max-w-[180px]">
                <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{userProfile.department || (userProfile.role === "admin" ? (isLao ? "ຜູ້ດູແລລະບົບສູງສຸດ" : "System Admin") : userProfile.email)}</span>
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
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white dark:bg-[#0f172a] rounded-3xl max-w-xl w-full border-2 border-indigo-500/30 dark:border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] overflow-hidden relative flex flex-col max-h-[92vh]"
            >
              {/* Vibrant Luxury Gradient Header Banner */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-lg relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-10 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-md shrink-0">
                    <Sliders className="w-6 h-6 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                        {isLao ? "ຕັ້ງຄ່າຂໍ້ມູນໂປຣຟາຍ & ບັນຊີຜູ້ໃຊ້" : "Profile & Account Settings"}
                      </h3>
                      {userProfile.role === "admin" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <span>{isLao ? "ຜູ້ດູແລລະບົບ" : "Admin"}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-100 font-medium mt-0.5">
                      {isLao ? "ຈັດການຮູບພາບໂປຣຟາຍ, ຂໍ້ມູນຕິດຕໍ່ ແລະ ສິດທິການເຂົ້າເຖິງ" : "Customize avatar image, credentials & contact metadata"}
                    </p>
                  </div>
                 </div>
                <button 
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-2 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer relative z-10 shrink-0 shadow-sm"
                  title={isLao ? "ປິດ" : "Close"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                
                {/* 1. Hero Avatar Showcase & Upgraded Drag-and-Drop PC Upload Box */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <span>{isLao ? "ຮູບພາບໂປຣຟາຍ (Avatar Profile Picture)" : "Select or Upload Profile Picture"}</span>
                  </label>

                  {/* Hero Showcase Card */}
                  <div className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-900/80 dark:via-indigo-950/20 dark:to-slate-900/60 p-4 sm:p-5 rounded-3xl border-2 border-indigo-100 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                    
                    {/* Left: Large Crisp Avatar Preview Ring */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-indigo-500 to-purple-600 shadow-xl relative group shrink-0">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 relative">
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
                            <div className="w-full h-full flex items-center justify-center text-3xl font-black text-indigo-600 dark:text-indigo-400">
                              {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white cursor-pointer p-2 text-center"
                            title={isLao ? "ຄລິກເພື່ອປ່ຽນຮູບ" : "Click to change"}
                          >
                            <Camera className="w-6 h-6 mb-1 text-amber-300 animate-bounce" />
                            <span className="text-[10px] font-black leading-tight">{isLao ? "ຄລິກປ່ຽນຮູບ" : "Change Avatar"}</span>
                          </button>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-wide border border-indigo-500/20">
                        {isLao ? "ຮູບປັດຈຸບັນ" : "Current Avatar"}
                      </span>
                    </div>

                    {/* Right: Prominent Drag & Drop PC File Upload Box with clear button */}
                    <div className="flex-1 w-full flex flex-col justify-center min-w-0">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 group/upload ${
                          isDragging
                            ? "border-amber-400 bg-amber-400/15 text-amber-600 dark:text-amber-300 scale-[1.02] shadow-md"
                            : "border-indigo-400/80 bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 shadow-xs"
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                          <Upload className={`w-5 h-5 ${isDragging ? "animate-bounce text-amber-300" : ""}`} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-300">
                            {isLao ? "ອັບໂຫຼດຮູບຈາກຄອມພິວເຕີ" : "Upload Image from PC"}
                          </p>
                          
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer my-1"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{isLao ? "ເລືອກໄຟລ໌ຮູບພາບ..." : "Choose Image File..."}</span>
                          </button>

                          {uploadedFileName ? (
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span className="truncate max-w-[180px]">{uploadedFileName}</span>
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {isLao ? "ຄລິກປຸ່ມ ຫຼື ລາກໄຟລ໌ຮູບມາວາງໃສ່ນີ້" : "Click button or drag and drop file here"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compact Preset Avatars & URL Link Option */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {isLao ? "ຫຼື ເລືອກຈາກຮູບຕົວແທນສຳເລັດຮູບໃນລະບົບ (8 ຮູບແບບ):" : "Or choose preset system avatar (8 styles):"}
                      </span>
                    </div>
                    <div className="grid grid-cols-8 gap-1.5">
                      {PRESET_AVATARS.map((av) => (
                        <button
                          type="button"
                          key={av.id}
                          onClick={() => {
                            setAvatar(av.url);
                            setCustomAvatarUrl("");
                            setUploadedFileName("");
                          }}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-110 cursor-pointer ${
                            avatar === av.url && customAvatarUrl === ""
                              ? "border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-md" 
                              : "border-transparent opacity-75 hover:opacity-100"
                          }`}
                          title={av.name}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    {/* Custom image URL input */}
                    <div className="pt-1">
                      <input
                        type="url"
                        placeholder={isLao ? "ຫຼື ວາງລິ້ງ URL ຮູບພາບຈາກອິນເຕີເນັດ..." : "Or paste image Link URL from internet..."}
                        value={customAvatarUrl}
                        onChange={(e) => {
                          setCustomAvatarUrl(e.target.value);
                          setUploadedFileName("");
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Personal Parameters Fields */}
                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <span>{isLao ? "ຂໍ້ມູນສ່ວນຕົວ ແລະ ສັງກັດ (Personal Info)" : "Personal Information"}</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-white/5">
                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {isLao ? "ຊື່ ແລະ ນາມສະກຸນ *" : "Display Name *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        placeholder="Display Name"
                      />
                    </div>

                    {/* Department */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {isLao ? "ພະແນກ / ສັງກັດ *" : "Department *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g. Planning Department"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {isLao ? "ເບີໂທຕິດຕໍ່" : "Phone Number"}
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g. 020 XXXXXXXX"
                      />
                    </div>

                    {/* Read Only Email */}
                    <div className="space-y-1.5 opacity-70">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {isLao ? "ອີເມວລະບົບ (ປ່ຽນບໍ່ໄດ້)" : "Email Address (Read-only)"}
                      </label>
                      <input
                        type="text"
                        disabled
                        value={userProfile.email}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Account Credentials Fields */}
                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>{isLao ? "ຂໍ້ມູນບັນຊີຜູ້ໃຊ້ງານ (Account Credentials)" : "Account Credentials"}</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-white/5">
                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-indigo-500" />
                        <span>{isLao ? "ຊື່ບັນຊີຜູ້ໃຊ້ (Username)" : "Username"}</span>
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        placeholder={isLao ? "ຕົວຢ່າງ: somphone" : "e.g. somphone"}
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Key className="w-3 h-3 text-indigo-500" />
                        <span>{isLao ? "ລະຫັດຜ່ານ (Password)" : "Password"}</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          placeholder={isLao ? "ຕົວຢ່າງ: 123456" : "e.g. 123456"}
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
                  </div>
                </div>

                {/* 4. Short Bio / Description */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span>{isLao ? "ແນະນຳຕົວຫຍໍ້ / ໜ້າທີ່ຮັບຜິດຊອບ" : "Short Biography / Duties Description"}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={isLao ? "ຂຽນລາຍລະອຽດໜ້າທີ່ ຫຼື ຕຳແໜ່ງຂອງທ່ານພາຍໃນຫ້ອງການ..." : "Write a brief sentence about your official duties..."}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                  />
                </div>

                {/* 5. Credentials metadata block */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900/60 dark:to-slate-900/40 rounded-2xl p-4 border border-indigo-100 dark:border-white/10 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-400">{isLao ? "ລະດັບສິດທິການເຂົ້າເຖິງ:" : "Access Role Privilege:"}</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                      {userProfile.role === "admin" ? (isLao ? "ຜູ້ດູແລລະບົບ (Admin)" : "Admin") : (isLao ? "ຜູ້ໃຊ້ງານທົ່ວໄປ (User)" : "User")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-400">{isLao ? "ສະຖານະບັນຊີໃນລະບົບ:" : "Account System Status:"}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{isLao ? "ອະນຸມັດພ້ອມໃຊ້ງານ" : "Active Approved"}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{isLao ? "ວັນທີລົງທະບຽນເຂົ້າໃຊ້:" : "Registration Date:"}</span>
                    <span className="font-semibold">{new Date(userProfile.createdAt).toLocaleString()}</span>
                  </div>
                </div>

              </form>

              {/* Footer action buttons - 100% Lao wording */}
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
                <div className="flex-1 min-w-0">
                  {saveSuccessMsg && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5 animate-pulse pl-1 truncate">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{isLao ? "ບັນທຶກການຕັ້ງຄ່າສຳເລັດແລ້ວ!" : saveSuccessMsg}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowProfileDrawer(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {isLao ? "ຍົກເລີກ" : "Cancel"}
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-indigo-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {savingProfile ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                    ) : (
                      <Save className="w-4 h-4 shrink-0" />
                    )}
                    <span>{isLao ? "ບັນທຶກການຕັ້ງຄ່າ" : "Save Changes"}</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </header>
  );
}

