import { useState, useEffect } from "react";
import { auth, signOut, collection, db, onSnapshot, doc } from "./lib/firebase";
import { seedDefaultAdmin, getRooms } from "./lib/firebaseHelper";
import { UserProfile, MeetingRoom, RoomBooking, AppTheme, AppLanguage } from "./types";
import { translations } from "./lib/translations";
import { Building2, LogOut, Clock, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import emblemLogo from "./assets/images/emblem.png";
import emblemSvg from "./assets/images/emblem.svg";

// Components
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import BookingForm from "./components/BookingForm";
import RoomManagement from "./components/RoomManagement";
import UserManagement from "./components/UserManagement";
import Settings from "./components/Settings";
import ToastContainer from "./components/ToastContainer";

export default function App() {
  // Auth & Profile State
  const [firebaseUser, setFirebaseUser] = useState<any>(() => {
    try {
      const local = localStorage.getItem("local-auth-user");
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const local = localStorage.getItem("local-auth-profile");
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Auto-close welcome modal after 5 seconds
  useEffect(() => {
    if (showWelcomeModal) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeModal]);

  // System Configurations with localStorage persistence
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem("office-theme") as AppTheme) || "light";
  });
  const [language, setLanguage] = useState<AppLanguage>(() => {
    return (localStorage.getItem("office-lang") as AppLanguage) || "lo";
  });

  // Database State
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Sync Theme to HTML Element attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("office-theme", theme);
  }, [theme]);

  // Sync Language to localStorage
  useEffect(() => {
    localStorage.setItem("office-lang", language);
  }, [language]);

  // Auth Loader & Profile Synchronizer
  useEffect(() => {
    // Proactively seed Admin credentials
    seedDefaultAdmin();

    const localUser = localStorage.getItem("local-auth-user");
    const localProfile = localStorage.getItem("local-auth-profile");

    if (localUser && localProfile) {
      try {
        const user = JSON.parse(localUser);
        const profile = JSON.parse(localProfile) as UserProfile;
        
        setFirebaseUser(user);
        setUserProfile(profile);

        // Pre-fetch rooms if they are active
        if (profile.status === "active") {
          getRooms().catch(console.error);
        }

        // Establish real-time sync with user document in Firestore
        const userRef = doc(db, "users", profile.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const updatedProfile = docSnap.data() as UserProfile;
            setUserProfile(updatedProfile);
            localStorage.setItem("local-auth-profile", JSON.stringify(updatedProfile));
          }
        }, (err) => {
          console.error("Real-time user sync failed:", err);
        });

        setAuthLoading(false);
        return () => unsubscribe();
      } catch (err) {
        console.error("Local profile parse error:", err);
        setAuthLoading(false);
      }
    } else {
      setFirebaseUser(null);
      setUserProfile(null);
      setAuthLoading(false);
    }
  }, []);

  const handleLocalLogin = (profile: UserProfile) => {
    const mockUser = {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
      isAnonymous: true,
      emailVerified: true
    };
    setFirebaseUser(mockUser);
    setUserProfile(profile);
    localStorage.setItem("local-auth-user", JSON.stringify(mockUser));
    localStorage.setItem("local-auth-profile", JSON.stringify(profile));
    setShowWelcomeModal(true);

    // Listen to profile updates after login
    const userRef = doc(db, "users", profile.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedProfile = docSnap.data() as UserProfile;
        setUserProfile(updatedProfile);
        localStorage.setItem("local-auth-profile", JSON.stringify(updatedProfile));
      }
    });

    // In React 18+ we can store the unsubscribe in a state/ref if we want, but since they are logging in fresh, reload/mount will take care of it too.
  };

  // Real-time Firestore Sync (Rooms & Bookings)
  useEffect(() => {
    if (!userProfile || userProfile.status !== "active") return;

    // Listen to Rooms collection
    const roomsRef = collection(db, "rooms");
    const unsubscribeRooms = onSnapshot(roomsRef, (snapshot) => {
      const list: MeetingRoom[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MeetingRoom;
        list.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      setRooms(list);
    }, (error) => {
      console.error("Rooms snapshot error:", error);
    });

    // Listen to Bookings collection
    const bookingsRef = collection(db, "bookings");
    const unsubscribeBookings = onSnapshot(bookingsRef, (snapshot) => {
      const list: RoomBooking[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as RoomBooking;
        list.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      // Sort: newest bookings first
      setBookings(list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
    }, (error) => {
      console.error("Bookings snapshot error:", error);
    });

    return () => {
      unsubscribeRooms();
      unsubscribeBookings();
    };
  }, [userProfile]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
    setFirebaseUser(null);
    setUserProfile(null);
    localStorage.removeItem("local-auth-user");
    localStorage.removeItem("local-auth-profile");
    setActiveTab("dashboard");
  };

  const t = translations[language];

  // Render Loader during authentication phase
  if (authLoading) {
    return (
      <div id="app-loading-screen" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <Building2 className="w-7 h-7 text-blue-500 absolute top-4 left-4.5 animate-pulse" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 animate-pulse">
          {t.loading}
        </p>
      </div>
    );
  }

  // Render Login screen if not authenticated
  if (!firebaseUser || !userProfile) {
    return (
      <>
        <Login language={language} setLanguage={setLanguage} onLocalLogin={handleLocalLogin} />
        <ToastContainer />
      </>
    );
  }

  // Render Pending Approval warning screen if user is registered but not approved
  if (userProfile.status === "pending") {
    return (
      <>
        <div id="pending-approval-screen" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative font-sans">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-md w-full bg-white dark:bg-[#1e293b] rounded-3xl p-8 border border-slate-100 dark:border-white/5 shadow-2xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/5">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-snug">
                ລໍຖ້າການອະນຸມັດເຂົ້າໃຊ້ງານ
              </h2>
              <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">
                Pending Account Approval
              </p>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
              {t.usrPendingAlert}
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5 text-left text-xs font-semibold space-y-1 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="opacity-60">ຊື່ຍູເຊີ:</span>
                <span className="text-slate-800 dark:text-white">{userProfile.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">ອີເມວ:</span>
                <span className="text-slate-800 dark:text-white">{userProfile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">ພະແນກ:</span>
                <span className="text-slate-800 dark:text-white">{userProfile.department || "—"}</span>
              </div>
            </div>

            <button
              id="btn-pending-logout"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 bg-red-500/15 text-red-500 hover:bg-red-500/20 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border border-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.signOut}</span>
            </button>
          </div>
        </div>
        <ToastContainer />
      </>
    );
  }

  // Render main layout for fully authorized active users
  return (
    <>
      <div id="app-root-layout" className="flex min-h-screen relative overflow-x-hidden">
        
        {/* Sidebar navigation panel */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          language={language} 
          userRole={userProfile.role}
          onSignOut={handleSignOut}
        />

        {/* Main Content Area */}
        <div id="app-content-container" className="flex-1 flex flex-col min-w-0">
          
          {/* Top Navbar details */}
          <Navbar 
            userProfile={userProfile} 
            language={language}
            setLanguage={setLanguage} 
            onUpdateProfile={setUserProfile}
          />

          {/* Dynamic active page viewer */}
          <main id="app-main-content" className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
            {activeTab === "dashboard" && (
              <Dashboard 
                bookings={bookings} 
                rooms={rooms} 
                language={language} 
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "booking" && (
              <BookingForm 
                rooms={rooms} 
                bookings={bookings} 
                userProfile={userProfile} 
                language={language}
              />
            )}

            {activeTab === "rooms" && userProfile.role === "admin" && (
              <RoomManagement 
                rooms={rooms} 
                language={language}
              />
            )}

            {activeTab === "users" && userProfile.role === "admin" && (
              <UserManagement 
                language={language}
              />
            )}

            {activeTab === "settings" && (
              <Settings 
                language={language} 
                setLanguage={setLanguage} 
                theme={theme} 
                setTheme={setTheme} 
                userProfile={userProfile}
                onUpdateProfile={setUserProfile}
              />
            )}
          </main>

        </div>
      </div>
      <ToastContainer />

      {/* GORGEOUS SUCCESS WELCOME MODAL WITH CENTERED STATE EMBLEM AND TYPOGRAPHY */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={() => setShowWelcomeModal(false)} />

            {/* Glowing background light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="relative w-full max-w-2xl bg-slate-900/95 dark:bg-slate-950/95 border-2 border-amber-400/60 shadow-[0_0_60px_rgba(251,191,36,0.35)] rounded-[32px] p-8 md:p-12 text-center overflow-hidden"
            >
              {/* Decorative top color stripe (Red, Amber, Blue) matching high-class official look */}
              <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-red-600 via-amber-400 to-blue-600 shadow-sm" />
              
              {/* Emblem Centered at the top */}
              <div className="relative mb-8 flex justify-center">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-600 rounded-full blur-xl opacity-70 animate-pulse" />
                <div className="relative p-3.5 bg-slate-950/90 rounded-full border-2 border-amber-400 shadow-xl">
                  <img
                    src={emblemLogo}
                    alt="Laos National Emblem"
                    className="w-24 h-24 md:w-28 md:h-28 object-contain filter drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)]"
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

              {/* Welcoming Text Content */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-white leading-relaxed drop-shadow-md">
                    {language === "lo" 
                      ? "ຍີນດີຕ້ອນຮັບເຂົ້າສູ່ ລະບົບຈອງຫ້ອງປະຊຸມທັນສະໄໝ ຫ້ອງວ່າການແຂວງຫົວພັນ" 
                      : "Welcome to the Modern Meeting Room Booking System of Houaphanh Province"}
                  </h3>
                </div>

                {/* Divider Line */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="h-[1.5px] w-20 bg-gradient-to-r from-transparent to-amber-400/40" />
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <div className="h-[1.5px] w-20 bg-gradient-to-l from-transparent to-amber-400/40" />
                </div>

                {/* Personalized greet with name */}
                {userProfile && (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl px-6 py-3.5 border border-white/10 inline-block mx-auto max-w-sm shadow-inner">
                    <p className="text-xs sm:text-sm text-slate-300 font-bold">
                      {language === "lo" ? "ສະບາຍດີ, ທ່ານ" : "Hello,"}{" "}
                      <span className="text-amber-400 font-black text-sm sm:text-base">{userProfile.displayName}</span>
                    </p>
                    {userProfile.department && (
                      <div className="mt-2.5 px-3 py-1 bg-amber-400/10 rounded-lg inline-block border border-amber-400/20">
                        <p className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider">
                          {userProfile.department}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Proceed Button with Visual Timer Progress */}
              <div className="mt-8 space-y-4">
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="w-full sm:w-auto px-10 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-black text-xs md:text-sm shadow-lg shadow-amber-400/20 hover:shadow-xl hover:shadow-amber-400/35 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 mx-auto border border-amber-300/30"
                >
                  <span>{language === "lo" ? "ເຂົ້າສູ່ໜ້າຫຼັກ" : "Proceed to Dashboard"}</span>
                </button>

                {/* Countdown animation progress bar */}
                <div className="w-32 mx-auto h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
