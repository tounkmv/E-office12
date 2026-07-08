import { useState, FormEvent, useEffect } from "react";
import { Building2, AlertCircle, Sparkles, Lock, ShieldCheck, UserCheck, Eye, EyeOff, User, Briefcase, Phone, CheckCircle2 } from "lucide-react";
import { db, collection, getDocs, query, where, doc, setDoc, getDoc } from "../lib/firebase";
import { seedDefaultAdmin } from "../lib/firebaseHelper";
import { translations } from "../lib/translations";
import { AppLanguage, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";
import sakuraBg from "../assets/images/sakura_login_background_1783052918576.jpg";

interface LoginProps {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  onLocalLogin?: (profile: UserProfile) => void;
}

export default function Login({ language, setLanguage, onLocalLogin }: LoginProps) {
  const t = translations[language];
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form input states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up additional states
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");

  // Seed default admin on mount
  useEffect(() => {
    seedDefaultAdmin();
  }, []);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(language === "lo" ? "ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ" : "Please enter username and password");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Ensure admin is seeded
      await seedDefaultAdmin();

      const inputUser = username.trim();

      // 1. Direct short-circuit check for default Admin account to prevent any DB lag or offline issues
      if (inputUser.toLowerCase() === "admin") {
        if (password === "admin123") {
          const userRef = doc(db, "users", "admin_default");
          const userSnap = await getDoc(userRef);
          let adminProfile: UserProfile;

          if (userSnap.exists()) {
            adminProfile = userSnap.data() as UserProfile;
          } else {
            // Seed instantly if deleted
            adminProfile = {
              uid: "admin_default",
              username: "Admin",
              password: "admin123",
              displayName: "ຜູ້ດູແລລະບົບ (Admin)",
              email: "admin@eoffice.gov.la",
              role: "admin",
              department: "ຫ້ອງວ່າການແຂວງ",
              phone: "020 5555 5555",
              status: "active",
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, adminProfile);
          }

          if (onLocalLogin) {
            onLocalLogin(adminProfile);
          }
          setLoading(false);
          return;
        } else {
          setError(language === "lo" ? "ລະຫັດຜ່ານຂອງ Admin ບໍ່ຖືກຕ້ອງ" : "Incorrect password for Admin");
          setLoading(false);
          return;
        }
      }

      // 2. Database query for other registered users
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", inputUser));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Fallback lowercase search
        const qLower = query(usersRef, where("username", "==", inputUser.toLowerCase()));
        const snapLower = await getDocs(qLower);
        
        if (snapLower.empty) {
          setError(language === "lo" ? "ບໍ່ພົບຊື່ຜູ້ໃຊ້ນີ້ໃນລະບົບ" : "Username not found in system");
          setLoading(false);
          return;
        }
        
        const matchedUser = snapLower.docs[0].data() as UserProfile;
        if (matchedUser.password !== password) {
          setError(language === "lo" ? "ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ" : "Incorrect password");
          setLoading(false);
          return;
        }

        // Account Status Guards
        if (matchedUser.status === "pending") {
          setError(language === "lo" ? "ບັນຊີຂອງທ່ານກຳລັງລໍຖ້າການອະນຸມັດຈາກຜູ້ດູແລລະບົບ" : "Your account is pending approval by the administrator.");
          setLoading(false);
          return;
        }
        if (matchedUser.status === "inactive") {
          setError(language === "lo" ? "ບັນຊີຂອງທ່ານຖືກລະງັບການໃຊ້ງານຊົ່ວຄາວ" : "Your account has been suspended.");
          setLoading(false);
          return;
        }

        if (onLocalLogin) {
          onLocalLogin(matchedUser);
        }
      } else {
        const matchedUser = querySnapshot.docs[0].data() as UserProfile;
        if (matchedUser.password !== password) {
          setError(language === "lo" ? "ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ" : "Incorrect password");
          setLoading(false);
          return;
        }

        // Account Status Guards
        if (matchedUser.status === "pending") {
          setError(language === "lo" ? "ບັນຊີຂອງທ່ານກຳລັງລໍຖ້າການອະນຸມັດຈາກຜູ້ດູແລລະບົບ" : "Your account is pending approval by the administrator.");
          setLoading(false);
          return;
        }
        if (matchedUser.status === "inactive") {
          setError(language === "lo" ? "ບັນຊີຂອງທ່ານຖືກລະງັບການໃຊ້ງານຊົ່ວຄາວ" : "Your account has been suspended.");
          setLoading(false);
          return;
        }

        if (onLocalLogin) {
          onLocalLogin(matchedUser);
        }
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !displayName.trim() || !department.trim()) {
      setError(language === "lo" ? "ກະລຸນາປ້ອນຂໍ້ມູນທີ່ຈຳເປັນໃຫ້ຄົບຖ້ວນ" : "Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      setError(language === "lo" ? "ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ" : "Password should be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const targetUsername = username.trim();

    try {
      // 1. Check if username is already taken
      if (targetUsername.toLowerCase() === "admin") {
        setError(language === "lo" ? "ບໍ່ສາມາດໃຊ້ຊື່ຜູ້ໃຊ້ 'Admin' ໄດ້" : "Username 'Admin' is reserved");
        setLoading(false);
        return;
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", targetUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError(language === "lo" ? "ຊື່ຜູ້ໃຊ້ນີ້ມີໃນລະບົບແລ້ວ! ກະລຸນາໃຊ້ຊື່ຜູ້ໃຊ້ອື່ນ" : "Username already exists! Please use another username.");
        setLoading(false);
        return;
      }

      // 2. Create the user profile in Firestore
      const newUid = "usr_local_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const newProfile: UserProfile = {
        uid: newUid,
        username: targetUsername,
        password: password,
        displayName: displayName.trim(),
        email: `${targetUsername}@eoffice.gov.la`, // System fallback email
        role: "user",
        department: department.trim(),
        phone: phone.trim(),
        status: "pending", // Set as pending for admin approval
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", newUid), newProfile);

      setSuccessMsg(
        language === "lo" 
          ? "ລົງທະບຽນສຳເລັດແລ້ວ! ບັນຊີຂອງທ່ານກຳລັງລໍຖ້າການອະນຸມັດຈາກ Admin ຄວາມປອດໄພ" 
          : "Registration successful! Your account is pending administrator approval."
      );

      // Reset form states and switch back to Login view
      setIsSignUp(false);
      setPassword("");
      setDisplayName("");
      setDepartment("");
      setPhone("");
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page" className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white overflow-x-hidden relative font-sans p-4 sm:p-6 md:p-8 selection:bg-amber-400 selection:text-slate-900">
      {/* Fullscreen Sakura Wallpaper Background with slow zoom animation */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src={sakuraBg} 
          alt="Sakura Blossoms Background" 
          className="w-full h-full object-cover object-center scale-105 animate-pulse transition-all duration-1000"
          style={{ animationDuration: '14s' }}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=80";
          }}
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(15,23,42,0.7)_100%)]" />
      </div>

      {/* Decorative Ambient Glowing Blurs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-rose-500/25 via-purple-600/20 to-amber-400/20 rounded-full blur-[140px] pointer-events-none animate-pulse z-0" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-pink-500/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Main Centered Content */}
      <div className="w-full max-w-lg flex flex-col items-center justify-center relative z-10 my-auto">
        
        {/* LOGO & BRAND BANNER */}
        <div className="flex flex-col items-center text-center mb-6 space-y-3">
          {/* Laos National Emblem Container */}
          <div className="relative group cursor-default">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-rose-400 to-amber-600 rounded-full blur-xl opacity-50 group-hover:opacity-85 transition duration-700 animate-pulse" />
            <div className="relative p-3 bg-slate-900/85 backdrop-blur-2xl rounded-full border-2 border-amber-400/50 shadow-[0_0_35px_rgba(251,191,36,0.35)] flex items-center justify-center transform group-hover:scale-105 transition-all duration-500">
              <img 
                src={emblemLogo} 
                alt="Laos National Emblem" 
                className="w-20 h-20 md:w-24 md:h-24 object-contain filter drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]"
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
          </div>

          {/* Title Headers */}
          <div className="space-y-2 px-2 flex flex-col items-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-center text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              {language === "lo" ? "ລະບົບຈອງຫ້ອງປະຊຸມທັນສະໄໝ" : "Modern Meeting Room Booking System"}
            </h1>

            <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
              <div className="h-[2px] w-6 sm:w-12 bg-gradient-to-r from-transparent via-amber-400/80 to-amber-400 rounded-full" />
              <p className="text-base sm:text-lg md:text-xl font-black text-amber-300 tracking-wider text-center whitespace-nowrap drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                {language === "lo" ? "ຫ້ອງວ່າການແຂວງຫົວພັນ" : "Houaphanh Provincial Office"}
              </p>
              <div className="h-[2px] w-6 sm:w-12 bg-gradient-to-l from-transparent via-amber-400/80 to-amber-400 rounded-full" />
            </div>

            <p className="text-[10px] sm:text-xs font-black text-white/95 tracking-[0.15em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] text-center uppercase">
              SMART E-OFFICE GOVERNANCE PLATFORM
            </p>
          </div>
        </div>

        {/* GLASSMORPHIC CREDENTIALS CARD */}
        <div className="w-full bg-white/95 dark:bg-slate-950/85 backdrop-blur-3xl rounded-3xl border border-white/30 dark:border-rose-400/30 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85),0_0_40px_rgba(244,114,182,0.15)] p-6 md:p-8 relative overflow-hidden transition-all duration-300">
          
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-rose-500/20 to-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/15 to-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-5 relative z-10">
            {/* Header / Mode Indicator */}
            <div className="text-center space-y-1 border-b border-slate-200/80 dark:border-white/10 pb-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                <span>
                  {isSignUp 
                    ? (language === "lo" ? "ລົງທະບຽນບັນຊີຜູ້ໃຊ້" : "Register New Account")
                    : (language === "lo" ? "ເຂົ້າສູ່ລະບົບ" : "Sign In to Account")
                  }
                </span>
              </h2>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {isSignUp 
                  ? (language === "lo" ? "ປ້ອນຂໍ້ມູນເພື່ອສ້າງບັນຊີຜູ້ໃຊ້ ແລະ ລໍຖ້າອະນຸມັດ" : "Fill in details to register and await activation")
                  : (language === "lo" ? "ປ້ອນຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານເພື່ອເຂົ້າເຖິງລະບົບ" : "Enter username and password to log in")
                }
              </p>
            </div>

            {/* Success Toast / Notification */}
            {successMsg && (
              <div id="login-success-alert" className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-start gap-2.5 text-left text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Error Notification Alert */}
            {error && (
              <div id="login-error-alert" className="p-3.5 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 rounded-2xl flex items-start gap-2.5 text-left text-xs font-bold shadow-xs animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Form Content */}
            {!isSignUp ? (
              // LOGIN FORM
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                {/* Username Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{language === "lo" ? "ຊື່ຜູ້ໃຊ້ (Username)" : "Username"} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={language === "lo" ? "ຕົວຢ່າງ: Admin" : "e.g. Admin"}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{language === "lo" ? "ລະຫັດຜ່ານ (Password)" : "Password"} *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-600 via-indigo-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white py-3 rounded-xl font-black text-xs md:text-sm shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/40 hover:scale-[1.01] active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50 border border-rose-400/30 flex items-center justify-center gap-2"
                >
                  {loading ? t.loading : (language === "lo" ? "ເຂົ້າສູ່ລະບົບ" : "Sign In")}
                </button>
              </form>
            ) : (
              // REGISTRATION / SIGN UP FORM
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-left max-h-[420px] overflow-y-auto pr-1">
                {/* Username */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-pink-500" />
                    <span>{language === "lo" ? "ຊື່ຜູ້ໃຊ້ (Username)" : "Username"} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={language === "lo" ? "ຕົວຢ່າງ: somphone (ພາສາອັງກິດເທົ່ານັ້ນ)" : "e.g. somphone (alphanumeric)"}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all font-semibold"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-pink-500" />
                    <span>{language === "lo" ? "ລະຫັດຜ່ານ (Password)" : "Password"} *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••• (ຢ່າງໜ້ອຍ 6 ຕົວ)"
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-pink-400 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-pink-500" />
                    <span>{language === "lo" ? "ຊື່ ແລະ ນາມສະກຸນ (Full Name)" : "Full Name"} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={language === "lo" ? "ຕົວຢ່າງ: ສົມພອນ ແກ້ວມະນີ" : "e.g. Somphone Keomany"}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all font-semibold"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-pink-500" />
                    <span>{language === "lo" ? "ພະແນກ / ຫ້ອງການ (Department)" : "Department"} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={language === "lo" ? "ຕົວຢ່າງ: ພະແນກແຜນການ ແລະ ການລົງທຶນ" : "e.g. Planning Department"}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all font-semibold"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-pink-500" />
                    <span>{language === "lo" ? "ເບີໂທລະສັບຕິດຕໍ່ (Phone)" : "Phone Number"}</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="020 xxxx xxxx"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all font-semibold"
                  />
                </div>

                {/* Submit Sign Up */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white py-3 rounded-xl font-black text-xs md:text-sm shadow-lg shadow-pink-500/20 hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50 border border-pink-400/30 flex items-center justify-center gap-2"
                >
                  {loading ? t.loading : (language === "lo" ? "ລົງທະບຽນບັນຊີໃໝ່" : "Register Account")}
                </button>
              </form>
            )}

            {/* Toggle Sign In / Sign Up Link */}
            <div className="text-center pt-1.5 border-t border-slate-200/50 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs md:text-sm text-indigo-600 dark:text-amber-300 hover:underline font-extrabold transition-all cursor-pointer"
              >
                {isSignUp 
                  ? (language === "lo" ? "ມີບັນຊີຢູ່ແລ້ວ? ກົດທີ່ນີ້ເພື່ອເຂົ້າສູ່ລະບົບ" : "Already have an account? Sign In") 
                  : (language === "lo" ? "ຍັງບໍ່ມີບັນຊີ? ກົດທີ່ນີ້ເພື່ອລົງທະບຽນໃໝ່" : "No account yet? Register here")
                }
              </button>
            </div>



            {/* Security Note */}
            <div className="text-center pt-2">
              <span className="text-[10px] md:text-[11px] text-slate-400 dark:text-slate-500 block font-bold leading-relaxed">
                * {language === "lo" ? "ສະຫງວນສິດສະເພາະພະນັກງານ ຫ້ອງວ່າການແຂວງຫົວພັນ ເທົ່ານັ້ນ" : "For Houaphanh Provincial Office personnel only"}
              </span>
            </div>

          </div>
        </div>

        {/* FOOTER & LANGUAGE SWITCHER */}
        <div className="mt-6 flex flex-col items-center space-y-3.5 text-center">
          {/* Language selection pills */}
          <div className="flex items-center gap-3 bg-slate-900/60 dark:bg-slate-900/80 p-1 rounded-xl border border-white/10 backdrop-blur-md shadow-lg">
            <button
              onClick={() => setLanguage("lo")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all duration-300 cursor-pointer flex items-center gap-1 ${
                language === "lo"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span>🇱🇦</span>
              <span>ພາສາລາວ</span>
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all duration-300 cursor-pointer flex items-center gap-1 ${
                language === "en"
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
          </div>

          <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider">
            © 2026 {t.officeName} • E-Office Digital Platform
          </p>
        </div>

      </div>
    </div>
  );
}
