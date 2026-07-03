import { useState, FormEvent } from "react";
import { Building2, AlertCircle, Sparkles, Mail, Lock, ShieldCheck, UserCheck, Eye, EyeOff } from "lucide-react";
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "../lib/firebase";
import { translations } from "../lib/translations";
import { AppLanguage } from "../types";
import { motion } from "motion/react";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";

interface LoginProps {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  onLocalLogin?: (profile: any) => void;
}

export default function Login({ language, setLanguage, onLocalLogin }: LoginProps) {
  const t = translations[language];
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authTab, setAuthTab] = useState<"google" | "email">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === "auth/popup-blocked") {
        setError(language === "lo" ? "ປັອບອັບຖືກບລັອກ! ກະລຸນາອະນຸຍາດປັອບອັບໃນບຣາວເຊີຂອງທ່ານ." : "Popup blocked! Please enable popups for this site.");
      } else if (err.code === "auth/internal-error") {
        setError(language === "lo" ? "ພົບຂໍ້ຜິດພາດພາຍໃນຂອງ Google Auth (ອາດເກີດຈາກ iframe ບລັອກປັອບອັບ). ກະລຸນາໃຊ້ແທັບ 'ບັນຊີຕົວຢ່າງ / ອີເມວ' ເພື່ອເຂົ້າສູ່ລະບົບ." : "Google Auth internal error (likely due to iframe popups blocked). Please use the 'Demo / Email' tab to log in.");
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(language === "lo" ? "ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານ" : "Please enter email and password");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed" && onLocalLogin) {
        // Fall back to local login gracefully without noisy console.error
        console.log("Email/Password Auth is disabled in Firebase console. Falling back to local offline session.");
        const isDefaultAdmin = email === "tounkmv99@gmail.com";
        const isDefaultUser = email === "staff.houaphanh@gmail.com";
        const mockProfile = {
          uid: "demo-local-" + email.replace(/[^a-zA-Z0-9]/g, ""),
          displayName: isDefaultUser ? "ພະນັກງານຕົວຢ່າງ (Staff)" : (isDefaultAdmin ? "ຜູ້ດູແລລະບົບ (Admin)" : email.split("@")[0]),
          email: email,
          role: isDefaultAdmin ? ("admin" as const) : ("user" as const),
          department: isDefaultAdmin ? "ຫ້ອງວ່າການແຂວງ" : "ພະແນກທົ່ວໄປ",
          status: (isDefaultAdmin || isDefaultUser) ? ("active" as const) : ("pending" as const),
          createdAt: new Date().toISOString()
        };
        onLocalLogin(mockProfile);
        setLoading(false);
        return;
      }

      console.error("Email Auth Error:", err);
      let errMsg = err.message || "Authentication failed";
      if (err.code === "auth/user-not-found") {
        errMsg = language === "lo" ? "ບໍ່ພົບຜູ້ໃຊ້ນີ້, ທ່ານສາມາດກົດ 'ລົງທະບຽນ' ໄດ້" : "User not found, you can click 'Sign Up'";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        errMsg = language === "lo" ? "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ" : "Incorrect email or password";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = language === "lo" ? "ອີເມວນີ້ຖືກໃຊ້ແລ້ວ" : "Email already in use";
      } else if (err.code === "auth/invalid-email") {
        errMsg = language === "lo" ? "ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ" : "Invalid email format";
      } else if (err.code === "auth/weak-password") {
        errMsg = language === "lo" ? "ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ" : "Password should be at least 6 characters";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: "admin" | "user") => {
    setLoading(true);
    setError(null);
    const demoEmail = role === "admin" ? "tounkmv99@gmail.com" : "staff.houaphanh@gmail.com";
    const demoPassword = "houaphanh_password_2026";
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed" && onLocalLogin) {
        console.log("Firebase auth/operation-not-allowed detected. Falling back to local demo login.");
        const mockProfile = {
          uid: role === "admin" ? "demo-admin-uid" : "demo-staff-uid",
          displayName: role === "admin" ? "ຜູ້ດູແລລະບົບ (Admin)" : "ພະນັກງານຕົວຢ່າງ (Staff)",
          email: demoEmail,
          role: role,
          department: role === "admin" ? "ຫ້ອງວ່າການແຂວງ" : "ພະແນກທົ່ວໄປ",
          status: "active" as const,
          createdAt: new Date().toISOString()
        };
        onLocalLogin(mockProfile);
        setLoading(false);
        return;
      }

      console.error("Demo login error:", err);

      // If the demo user doesn't exist yet, automatically register them
      if (
        err.code === "auth/user-not-found" || 
        err.code === "auth/invalid-credential" || 
        err.code === "auth/wrong-password"
      ) {
        try {
          await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        } catch (createErr: any) {
          if (createErr.code === "auth/operation-not-allowed" && onLocalLogin) {
            console.log("Firebase registration operation-not-allowed detected. Falling back to local registration session.");
            const mockProfile = {
              uid: role === "admin" ? "demo-admin-uid" : "demo-staff-uid",
              displayName: role === "admin" ? "ຜູ້ດູແລລະບົບ (Admin)" : "ພະນັກງານຕົວຢ່າງ (Staff)",
              email: demoEmail,
              role: role,
              department: role === "admin" ? "ຫ້ອງວ່າການແຂວງ" : "ພະແນກທົ່ວໄປ",
              status: "active" as const,
              createdAt: new Date().toISOString()
            };
            onLocalLogin(mockProfile);
            setLoading(false);
            return;
          }
          console.error("Demo registration failed:", createErr);
          setError(language === "lo" ? "ບໍ່ສາມາດສ້າງບັນຊີຕົວຢ່າງໄດ້" : "Failed to create demo account");
        }
      } else {
        console.error("Demo login failed:", err);
        setError(err.message || "Failed to log in with demo account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#13112c] text-white overflow-x-hidden relative font-sans p-4 md:p-8 selection:bg-amber-400 selection:text-slate-900">
      {/* Decorative Ambient Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-amber-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Centered Wrapper */}
      <div className="w-full max-w-lg flex flex-col items-center justify-center relative z-10 my-auto">
        
        {/* CENTERED LOGO & BRAND HEADER SECTION */}
        <div className="flex flex-col items-center text-center mb-8 space-y-4">
          {/* Laos National Emblem Logo with Golden Glow Container */}
          <div className="relative group cursor-default">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-full blur-xl opacity-40 group-hover:opacity-75 transition duration-700 animate-pulse" />
            <div className="relative p-4 bg-slate-900/80 backdrop-blur-2xl rounded-full border-2 border-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center justify-center transform group-hover:scale-105 transition-all duration-500">
              <img 
                src={emblemLogo} 
                alt="Laos National Emblem" 
                className="w-24 h-24 md:w-28 md:h-28 object-contain filter drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]"
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

          {/* Prominent Centered System Name & Office Title Underneath Logo */}
          <div className="space-y-4 max-w-2xl px-2 flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black tracking-tight leading-[1.25] text-center bg-gradient-to-r from-white via-amber-100 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_4px_15px_rgba(255,255,255,0.2)]">
              {language === "lo" ? "ລະບົບຈອງຫ້ອງປະຊຸມທັນສະໄໝ" : "Modern Meeting Room Booking System"}
            </h1>

            <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-5 w-full pt-1">
              <div className="h-[3px] w-8 sm:w-16 md:w-20 bg-gradient-to-r from-transparent via-amber-400/80 to-amber-400 rounded-full shadow-sm shadow-amber-400 shrink-0" />
              <p className="text-lg sm:text-2xl md:text-3xl lg:text-[34px] font-black text-amber-400 dark:text-amber-300 tracking-wider text-center whitespace-nowrap drop-shadow-[0_4px_15px_rgba(251,191,36,0.6)]">
                {language === "lo" ? "ຫ້ອງວ່າການແຂວງຫົວພັນ" : "Houaphanh Provincial Office"}
              </p>
              <div className="h-[3px] w-8 sm:w-16 md:w-20 bg-gradient-to-l from-transparent via-amber-400/80 to-amber-400 rounded-full shadow-sm shadow-amber-400 shrink-0" />
            </div>

            <p className="text-sm sm:text-base md:text-lg font-black text-indigo-200 uppercase tracking-[0.2em] pt-1.5 block drop-shadow-sm text-center">
              SMART E-OFFICE GOVERNANCE PLATFORM
            </p>
          </div>
        </div>

        {/* CENTERED GLASSMORPHIC LOGIN CARD */}
        <div className="w-full bg-white/95 dark:bg-[#0f172a]/90 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-indigo-500/25 shadow-2xl shadow-black/50 p-6 md:p-8 relative overflow-hidden transition-all duration-300">
          
          {/* Ambient card corner glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            {/* Card Header & Title */}
            <div className="text-center space-y-1.5 border-b border-slate-200/80 dark:border-white/10 pb-4">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                <span>{language === "lo" ? "ເຂົ້າສູ່ລະບົບ" : "Sign In to Account"}</span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {authTab === "google" 
                  ? t.loginSubtitle 
                  : (language === "lo" ? "ເຂົ້າສູ່ລະບົບດ້ວຍບັນຊີຕົວຢ່າງ ຫຼື ປ້ອນອີເມວ" : "Log in with a demo account or custom email")
                }
              </p>
            </div>

            {/* Modern Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-950/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => { setAuthTab("google"); setError(null); }}
                className={`flex-1 py-2.5 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
                  authTab === "google" 
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 scale-[1.01]" 
                    : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-amber-300 hover:bg-white/50 dark:hover:bg-white/5"
                }`}
              >
                Google Auth
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("email"); setError(null); }}
                className={`flex-1 py-2.5 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
                  authTab === "email" 
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 scale-[1.01]" 
                    : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-amber-300 hover:bg-white/50 dark:hover:bg-white/5"
                }`}
              >
                {language === "lo" ? "ບັນຊີຕົວຢ່າງ / ອີເມວ" : "Demo / Email"}
              </button>
            </div>

            {/* Error Notification Alert */}
            {error && (
              <div id="login-error-alert" className="p-4 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 rounded-2xl flex items-start gap-3 text-left text-xs md:text-sm font-bold shadow-sm animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Auth Tab Content */}
            {authTab === "google" ? (
              <div className="space-y-4 pt-2">
                <button
                  id="btn-google-login"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-indigo-500/30 hover:border-indigo-500 dark:hover:border-amber-400/50 hover:bg-slate-50 dark:hover:bg-slate-800 px-6 py-4 rounded-2xl font-black text-sm md:text-base shadow-md hover:shadow-xl hover:shadow-indigo-500/15 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 cursor-pointer group"
                >
                  <svg className="w-6 h-6 shrink-0 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? t.loading : t.signInWithGoogle}</span>
                </button>

                <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  {language === "lo" ? "ຄລິກເພື່ອເຊື່ອມຕໍ່ດ້ວຍບັນຊີ Google Workspace ຫຼື ອີເມວທົ່ວໄປ" : "Click to connect with Google Workspace or personal Gmail"}
                </p>
              </div>
            ) : (
              <div className="space-y-5 text-left">
                {/* Demo Accounts Panel */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl shadow-inner">
                  <div className="text-xs font-black text-indigo-600 dark:text-amber-300 tracking-wider uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>{language === "lo" ? "ທາງລັດເຂົ້າສູ່ລະບົບຕົວຢ່າງ (Demo Quick Login)" : "Demo Quick Access"}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin("admin")}
                      className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-indigo-500 dark:hover:border-amber-400 rounded-xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95 group text-center"
                    >
                      <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-amber-300">Admin</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-mono">tounkmv99@...</span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin("user")}
                      className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95 group text-center"
                    >
                      <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Staff User</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-mono">staff.houaphanh@...</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                  <span className="flex-shrink mx-3 text-[11px] text-slate-400 dark:text-slate-400 font-extrabold uppercase tracking-widest">
                    {language === "lo" ? "ຫຼື ປ້ອນອີເມວດ້ວຍຕົນເອງ" : "Or Custom Email"}
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                </div>

                {/* Custom Email Auth Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === "lo" ? "ອີເມວ (Email)" : "Email"}</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === "lo" ? "ລະຫັດຜ່ານ (Password)" : "Password"}</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white py-3.5 rounded-xl font-black text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50 border border-indigo-400/30"
                  >
                    {loading ? t.loading : (isSignUp ? (language === "lo" ? "ລົງທະບຽນບັນຊີໃໝ່" : "Sign Up Account") : (language === "lo" ? "ເຂົ້າສູ່ລະບົບດ້ວຍອີເມວ" : "Sign In with Email"))}
                  </button>
                </form>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs md:text-sm text-indigo-600 dark:text-amber-300 hover:underline font-extrabold transition-all cursor-pointer"
                  >
                    {isSignUp 
                      ? (language === "lo" ? "ມີບັນຊີຢູ່ແລ້ວ? ກົດທີ່ນີ້ເພື່ອເຂົ້າສູ່ລະບົບ" : "Already have an account? Sign In") 
                      : (language === "lo" ? "ຍັງບໍ່ມີບັນຊີ? ກົດທີ່ນີ້ເພື່ອລົງທະບຽນໃໝ່" : "No account? Sign up here")
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Security Note */}
            <div className="text-center border-t border-slate-200/80 dark:border-white/10 pt-4">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold leading-relaxed">
                * {language === "lo" ? "ສະຫງວນສິດສະເພາະພະນັກງານ ແລະ ບຸກຄະລາກອນ ຫ້ອງວ່າການແຂວງຫົວພັນ ເທົ່ານັ້ນ" : "For Houaphanh Provincial Office personnel only"}
              </span>
            </div>
          </div>
        </div>

        {/* CENTERED FOOTER: LANGUAGE SWITCHER & COPYRIGHT */}
        <div className="mt-8 flex flex-col items-center space-y-4 text-center">
          {/* Language Switch Pills */}
          <div className="flex items-center gap-3 bg-slate-900/60 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
            <button
              onClick={() => setLanguage("lo")}
              className={`px-4 py-1.5 rounded-xl text-xs md:text-sm font-black transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                language === "lo"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>🇱🇦</span>
              <span>ພາສາລາວ</span>
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-4 py-1.5 rounded-xl text-xs md:text-sm font-black transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                language === "en"
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
          </div>

          {/* Copyright text */}
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider">
            © 2026 {t.officeName} • E-Office Digital Platform
          </p>
        </div>

      </div>
    </div>
  );
}
