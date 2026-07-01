import { useState, useEffect } from "react";
import { auth, onAuthStateChanged, signOut, collection, db, onSnapshot } from "./lib/firebase";
import { syncUserProfile, getRooms } from "./lib/firebaseHelper";
import { UserProfile, MeetingRoom, RoomBooking, AppTheme, AppLanguage } from "./types";
import { translations } from "./lib/translations";
import { Building2, LogOut, Clock, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const hasLocalAuth = localStorage.getItem("local-auth-user");
      if (!hasLocalAuth) {
        setAuthLoading(true);
      }
      if (user) {
        setFirebaseUser(user);
        try {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
          // If user becomes active, pre-fetch rooms to seed if needed
          if (profile.status === "active") {
            await getRooms();
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
        }
      } else {
        if (!hasLocalAuth) {
          setFirebaseUser(null);
          setUserProfile(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
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
    </>
  );
}
