import { useState, FormEvent } from "react";
import { Building2, AlertCircle, Sparkles, Mail, Lock, ShieldCheck, UserCheck, Eye, EyeOff } from "lucide-react";
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "../lib/firebase";
import { translations } from "../lib/translations";
import { AppLanguage } from "../types";
import { motion } from "motion/react";

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
    <div id="login-page" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden relative font-sans">
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div id="login-card-container" className="max-w-5xl w-full mx-4 grid md:grid-cols-12 bg-white dark:bg-[#1e293b] rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-slate-100 dark:border-white/5">
        
        {/* Left Side: Illustration / Branding Panel */}
        <div className="md:col-span-7 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] p-12 flex flex-col justify-between border-r border-slate-100 dark:border-white/5 relative overflow-hidden">
          {/* Decorative watermark background emblem */}
          <div className="absolute right-[-10%] bottom-[-10%] w-72 h-72 opacity-[0.04] pointer-events-none select-none">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Emblem_of_Laos.svg/512px-Emblem_of_Laos.svg.png" 
              alt="Laos State Emblem Watermark" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex items-center gap-3.5 z-10">
            <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg shadow-black/20 shrink-0">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Emblem_of_Laos.svg/512px-Emblem_of_Laos.svg.png" 
                alt="Laos State Emblem" 
                className="w-12 h-12 object-contain filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.35)]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-amber-400 block leading-none">E-OFFICE</span>
              <span className="text-[10px] text-slate-300 block font-bold tracking-widest uppercase mt-1">HOUAPHANH PROVINCE</span>
            </div>
          </div>

          <div className="my-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 text-blue-400 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Digital Governance</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {t.loginTitle}
            </h1>
            <p className="text-slate-300 leading-relaxed max-w-md text-sm">
              ລະບົບຈອງຫ້ອງປະຊຸມເອເລັກໂຕຣນິກ ຫ້ອງວ່າການແຂວງຫົວພັນ ພັດທະນາຂຶ້ນເພື່ອອຳນວຍຄວາມສະດວກໃນການຈອງຫ້ອງປະຊຸມ, ຈັດການຕາຕະລາງ ແລະ ເພີ່ມປະສິດທິພາບໃນການເຮັດວຽກ.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-semibold border-t border-white/5 pt-6 flex justify-between items-center">
            <span>© 2026 {t.officeName}</span>
            <div className="flex gap-4">
              <button 
                onClick={() => setLanguage("lo")} 
                className={`transition-all cursor-pointer ${language === "lo" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-300"}`}
              >
                ພາສາລາວ
              </button>
              <button 
                onClick={() => setLanguage("en")} 
                className={`transition-all cursor-pointer ${language === "en" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-300"}`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Login Button Area */}
        <div className="md:col-span-5 bg-slate-50 dark:bg-[#111827]/40 p-8 flex flex-col justify-center items-center relative">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                {language === "lo" ? "ເຂົ້າສູ່ລະບົບ" : "Sign In"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {authTab === "google" 
                  ? t.loginSubtitle 
                  : (language === "lo" ? "ເຂົ້າສູ່ລະບົບດ້ວຍບັນຊີຕົວຢ່າງ ຫຼື ປ້ອນອີເມວ" : "Log in with a demo account or custom email")
                }
              </p>
            </div>

            {/* Beautiful Tab Switcher */}
            <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-300/30 dark:border-white/5">
              <button
                type="button"
                onClick={() => { setAuthTab("google"); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authTab === "google" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                Google Auth
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("email"); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authTab === "email" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                {language === "lo" ? "ບັນຊີຕົວຢ່າງ / ອີເມວ" : "Demo / Email"}
              </button>
            </div>

            {error && (
              <div id="login-error-alert" className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-2xl flex items-start gap-3 text-left text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">{error}</span>
              </div>
            )}

            {authTab === "google" ? (
              <button
                id="btn-google-login"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-6 py-4 rounded-2xl font-bold text-[14px] shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            ) : (
              <div className="space-y-5 text-left">
                {/* Demo Accounts Panel */}
                <div className="space-y-2.5 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                  <div className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 tracking-wider uppercase mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{language === "lo" ? "ທາງລັດເຂົ້າສູ່ລະບົບຕົວຢ່າງ" : "Demo Quick Access"}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin("admin")}
                      className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl transition-all cursor-pointer shadow-sm text-center"
                    >
                      <UserCheck className="w-5 h-5 text-indigo-500 mb-1" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">Admin</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">tounkmv99@...</span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin("user")}
                      className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl transition-all cursor-pointer shadow-sm text-center"
                    >
                      <UserCheck className="w-5 h-5 text-emerald-500 mb-1" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">Staff User</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">staff.houaphanh@...</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-white/5"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {language === "lo" ? "ຫຼື ປ້ອນອີເມວ" : "Or Custom Email"}
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-white/5"></div>
                </div>

                {/* Custom Email Auth Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{language === "lo" ? "ອີເມວ" : "Email"}</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === "lo" ? "ລະຫັດຜ່ານ" : "Password"}</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? t.loading : (isSignUp ? (language === "lo" ? "ລົງທະບຽນບັນຊີໃໝ່" : "Sign Up Account") : (language === "lo" ? "ເຂົ້າສູ່ລະບົບ" : "Sign In"))}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold underline transition-all cursor-pointer"
                  >
                    {isSignUp 
                      ? (language === "lo" ? "ມີບັນຊີຢູ່ແລ້ວ? ເຂົ້າສູ່ລະບົບ" : "Already have an account? Sign In") 
                      : (language === "lo" ? "ບໍ່ມີບັນຊີ? ລົງທະບຽນທີ່ນີ້" : "No account? Sign up here")
                    }
                  </button>
                </div>
              </div>
            )}

            <div className="text-center">
              <span className="text-[10px] text-slate-500 block font-semibold leading-relaxed">
                * {language === "lo" ? "ສຳລັບພະນັກງານ ແລະ ບຸກຄະລາກອນ ຫ້ອງວ່າການແຂວງຫົວພັນ ເທົ່ານັ້ນ" : "For Houaphanh Provincial Office personnel only"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
