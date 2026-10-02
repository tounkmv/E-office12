import { useState, useEffect } from "react";
import { auth, signOut, collection, db, onSnapshot, doc } from "./lib/firebase";
import { seedDefaultAdmin, getRooms, handleFirestoreError, OperationType } from "./lib/firebaseHelper";
import { 
  UserProfile, 
  MeetingRoom, 
  RoomBooking, 
  AppTheme, 
  AppLanguage, 
  Vehicle, 
  VehicleBooking, 
  LeadershipActivity,
  hasPermission
} from "./types";
import { translations } from "./lib/translations";
import { Building2, LogOut, Clock, ShieldAlert, Car, Briefcase, ArrowRight, ArrowLeft, X, Layers, Lock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import emblemLogo from "./assets/images/emblem.png";
import emblemSvg from "./assets/images/emblem.svg";
import { seedDefaultVehicles } from "./lib/vehicleHelper";
import { subscribeLeadershipActivities, fetchLeadershipActivities } from "./lib/activityHelper";
import { showSystemToast } from "./utils/toast";

// Components
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import BookingForm from "./components/BookingForm";
import RoomManagement from "./components/RoomManagement";
import UserManagement from "./components/UserManagement";
import AdminBookings from "./components/AdminBookings";
import ReportSystem from "./components/ReportSystem";
import Settings from "./components/Settings";
import ToastContainer from "./components/ToastContainer";

// Vehicle System Components & Portal
import SystemPortal from "./components/SystemPortal";
import VehicleDashboard from "./components/VehicleDashboard";
import VehicleBookingForm from "./components/VehicleBookingForm";
import VehicleManagement from "./components/VehicleManagement";
import VehicleAdminBookings from "./components/VehicleAdminBookings";
import VehicleReports from "./components/VehicleReports";

// Leadership Activity Tracking Components
import LeadershipCalendar from "./components/LeadershipCalendar";
import LeadershipMyActivities from "./components/LeadershipMyActivities";
import LeadershipReports from "./components/LeadershipReports";

export default function App() {
  // Auth & Profile State
  const [firebaseUser, setFirebaseUser] = useState<any>(() => {
    try {
      const local = localStorage.getItem("local-auth-user");
      if (!local) return null;
      const parsed = JSON.parse(local);
      return parsed && typeof parsed.uid === "string" ? parsed : null;
    } catch {
      return null;
    }
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const local = localStorage.getItem("local-auth-profile");
      if (!local) return null;
      const parsed = JSON.parse(local);
      const uid = parsed?.uid || parsed?.id;
      return parsed && typeof uid === "string" ? { ...parsed, uid } : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Auto-close welcome modal after 5 seconds and display portal
  useEffect(() => {
    if (showWelcomeModal) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(false);
        setActiveSystem("portal");
        setActiveTab("portal");
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
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active System State: "portal" | "meeting" | "vehicle" | "leadership"
  const [activeSystem, setActiveSystemState] = useState<"portal" | "meeting" | "vehicle" | "leadership">(() => {
    return (localStorage.getItem("office-active-system") as any) || "portal";
  });
  const setActiveSystem = (sys: "portal" | "meeting" | "vehicle" | "leadership") => {
    setActiveSystemState(sys);
    localStorage.setItem("office-active-system", sys);
  };

  // Vehicles and Vehicle Bookings state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleBookings, setVehicleBookings] = useState<VehicleBooking[]>([]);

  // Leadership Activities state
  const [leadershipActivities, setLeadershipActivities] = useState<LeadershipActivity[]>([]);

  // Granular Permission Checks for the 3 Systems and features
  const canAccessMeeting = hasPermission(userProfile, "meetingAccess");
  const canBookMeeting = hasPermission(userProfile, "meetingBook");
  const canApproveMeeting = hasPermission(userProfile, "meetingApprove");
  const canManageRooms = hasPermission(userProfile, "meetingManageRooms");
  const canMeetingReports = hasPermission(userProfile, "meetingReports");

  const canAccessVehicle = hasPermission(userProfile, "vehicleAccess");
  const canBookVehicle = hasPermission(userProfile, "vehicleBook");
  const canApproveVehicle = hasPermission(userProfile, "vehicleApprove");
  const canManageFleet = hasPermission(userProfile, "vehicleManageFleet");
  const canVehicleReports = hasPermission(userProfile, "vehicleReports");

  const canAccessLeadership = hasPermission(userProfile, "leadershipAccess");
  const canCalendarLeadership = hasPermission(userProfile, "leadershipCalendar");
  const canLogDuty = hasPermission(userProfile, "leadershipLogOwn");
  const canDutyReports = hasPermission(userProfile, "leadershipReports");

  // Sync Theme to HTML Element attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("office-theme", theme);
  }, [theme]);

  // Sync Language to localStorage
  useEffect(() => {
    localStorage.setItem("office-lang", language);
  }, [language]);

  // Scroll to top immediately when activeTab or activeSystem changes
  useEffect(() => {
    const el = document.getElementById("app-main-content");
    if (el) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab, activeSystem]);

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
        
        const validUid = (profile && typeof profile.uid === "string" && profile.uid.trim() !== "")
          ? profile.uid
          : ((profile as any)?.id || (user && typeof user.uid === "string" ? user.uid : null));

        if (!profile || !validUid) {
          // Gracefully clean up stale or incomplete auth cache without throwing errors
          localStorage.removeItem("local-auth-user");
          localStorage.removeItem("local-auth-profile");
          setFirebaseUser(null);
          setUserProfile(null);
          setAuthLoading(false);
          return;
        }

        profile.uid = validUid;
        setFirebaseUser(user);
        setUserProfile(profile);

        // Pre-fetch rooms if they are active
        if (profile.status === "active") {
          getRooms().catch(() => {});
        }

        // Establish real-time sync with user document in Firestore
        const userRef = doc(db, "users", profile.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const updatedProfile = docSnap.data() as UserProfile;
            if (updatedProfile && updatedProfile.uid) {
              setUserProfile(updatedProfile);
              localStorage.setItem("local-auth-profile", JSON.stringify(updatedProfile));
            }
          }
        }, (err) => {
          console.warn("Real-time user sync notice:", err);
        });

        setAuthLoading(false);
        return () => unsubscribe();
      } catch {
        // Clear corrupted auth cache gracefully
        localStorage.removeItem("local-auth-user");
        localStorage.removeItem("local-auth-profile");
        setFirebaseUser(null);
        setUserProfile(null);
        setAuthLoading(false);
      }
    } else {
      setFirebaseUser(null);
      setUserProfile(null);
      setAuthLoading(false);
    }
  }, []);

  const handleLocalLogin = (profile: UserProfile) => {
    if (!profile || !profile.uid) return;

    const mockUser = {
      uid: profile.uid,
      email: profile.email || "",
      displayName: profile.displayName || "User",
      isAnonymous: true,
      emailVerified: true
    };
    setFirebaseUser(mockUser);
    setUserProfile(profile);
    localStorage.setItem("local-auth-user", JSON.stringify(mockUser));
    localStorage.setItem("local-auth-profile", JSON.stringify(profile));
    setActiveSystem("portal");
    setActiveTab("portal");
    setShowWelcomeModal(true);

    // Listen to profile updates after login
    const userRef = doc(db, "users", profile.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedProfile = docSnap.data() as UserProfile;
        if (updatedProfile && updatedProfile.uid) {
          setUserProfile(updatedProfile);
          localStorage.setItem("local-auth-profile", JSON.stringify(updatedProfile));
        }
      }
    });
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
      handleFirestoreError(error, OperationType.LIST, "rooms");
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
      handleFirestoreError(error, OperationType.LIST, "bookings");
    });

    // Listen to Users collection
    const usersRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        list.push({
          ...data,
          uid: docSnap.id || data.uid
        });
      });
      setAllUsers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users");
    });

    // Listen to Vehicles collection
    const vehiclesRef = collection(db, "vehicles");
    const unsubscribeVehicles = onSnapshot(vehiclesRef, (snapshot) => {
      const list: Vehicle[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Vehicle;
        list.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      if (list.length === 0) {
        seedDefaultVehicles().then(v => setVehicles(v));
      } else {
        setVehicles(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "vehicles");
      const local = localStorage.getItem("local_vehicles");
      if (local) {
        try {
          setVehicles(JSON.parse(local));
        } catch {
          seedDefaultVehicles().then(v => setVehicles(v));
        }
      } else {
        seedDefaultVehicles().then(v => setVehicles(v));
      }
    });

    // Listen to Vehicle Bookings collection
    const vehicleBookingsRef = collection(db, "vehicle_bookings");
    const unsubscribeVehicleBookings = onSnapshot(vehicleBookingsRef, (snapshot) => {
      const list: VehicleBooking[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as VehicleBooking;
        list.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      setVehicleBookings(list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "vehicle_bookings");
      const local = localStorage.getItem("local_vehicle_bookings");
      if (local) {
        try {
          setVehicleBookings(JSON.parse(local));
        } catch {}
      }
    });

    // Instant local sync listener for vehicle bookings
    const handleVehicleLocalSync = () => {
      const local = localStorage.getItem("local_vehicle_bookings");
      if (local) {
        try {
          const list: VehicleBooking[] = JSON.parse(local);
          setVehicleBookings(list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
        } catch {}
      }
    };
    window.addEventListener("vehicle-bookings-updated", handleVehicleLocalSync);
    window.addEventListener("vehicle-booking-created", handleVehicleLocalSync);
    window.addEventListener("storage", handleVehicleLocalSync);

    // Listen to Leadership Activities collection & local fallback
    const unsubscribeActivities = subscribeLeadershipActivities((list) => {
      setLeadershipActivities(list);
    });

    const handleActivityLocalSync = () => {
      fetchLeadershipActivities().then(setLeadershipActivities);
    };
    window.addEventListener("leadership-activities-updated", handleActivityLocalSync);

    return () => {
      unsubscribeRooms();
      unsubscribeBookings();
      unsubscribeUsers();
      unsubscribeVehicles();
      unsubscribeVehicleBookings();
      unsubscribeActivities();
      window.removeEventListener("vehicle-bookings-updated", handleVehicleLocalSync);
      window.removeEventListener("vehicle-booking-created", handleVehicleLocalSync);
      window.removeEventListener("storage", handleVehicleLocalSync);
      window.removeEventListener("leadership-activities-updated", handleActivityLocalSync);
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
    localStorage.removeItem("office-active-system");
    setActiveSystem("portal");
    setActiveTab("portal");
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
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          userProfile={userProfile}
          bookings={bookings}
          allUsers={allUsers}
          activeSystem={activeSystem}
          setActiveSystem={setActiveSystem}
          vehicleBookings={vehicleBookings}
          vehicles={vehicles}
        />

        {/* Main Content Area */}
        <div id="app-content-container" className="flex-1 flex flex-col min-w-0">
          
          {/* Top Navbar details */}
          <Navbar 
            userProfile={userProfile} 
            language={language}
            setLanguage={setLanguage} 
            onUpdateProfile={setUserProfile}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            setActiveTab={setActiveTab}
            activeSystem={activeSystem}
            setActiveSystem={setActiveSystem}
          />

          {/* Dynamic active page viewer */}
          <main id="app-main-content" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
            {/* PORTAL VIEW: 3 MAIN WINDOWS AFTER LOGIN */}
            {activeSystem === "portal" && activeTab === "portal" && (
              <SystemPortal 
                language={language}
                userProfile={userProfile}
                rooms={rooms}
                roomBookings={bookings}
                vehicles={vehicles}
                vehicleBookings={vehicleBookings}
                activities={leadershipActivities}
                onSelectSystem={(sys) => {
                  setActiveSystem(sys);
                  if (sys === "meeting") {
                    setActiveTab("dashboard");
                  } else if (sys === "vehicle") {
                    setActiveTab("vehicle-dashboard");
                  } else if (sys === "leadership") {
                    setActiveTab("leadership-calendar");
                  }
                }}
              />
            )}

            {/* ========================================================================= */}
            {/* SYSTEM 1: ລະບົບຈອງຫ້ອງປະຊຸມທັນສະໄໝ (MODERN MEETING ROOM SYSTEM) */}
            {/* ========================================================================= */}
            {activeSystem === "meeting" && (
              !canAccessMeeting ? (
                <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {language === "lo" ? "ທ່ານບໍ່ມີສິດເຂົ້າເຖິງລະບົບຈອງຫ້ອງປະຊຸມ" : "Access Denied: Meeting Room System"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {language === "lo" 
                      ? "ບັນຊີຂອງທ່ານບໍ່ໄດ້ຮັບສິດໃຫ້ນຳໃຊ້ລະບົບນີ້ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ (Admin) ເພື່ອຂໍເປີດສິດ"
                      : "Your account does not have permission to access the meeting room system. Please contact an administrator."}
                  </p>
                  <button
                    onClick={() => { setActiveSystem("portal"); setActiveTab("portal"); }}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer shadow-md inline-flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4" />
                    <span>{language === "lo" ? "ກັບໄປໜ້າສູນຄວບຄຸມລະບົບທັງໝົດ" : "Return to Control Center"}</span>
                  </button>
                </div>
              ) : (
                <>
                  {activeTab === "dashboard" && (
                    <Dashboard 
                      bookings={bookings} 
                      rooms={rooms} 
                      language={language} 
                      setActiveTab={setActiveTab}
                      userRole={userProfile.role}
                    />
                  )}

                  {activeTab === "booking" && (
                    canBookMeeting ? (
                      <BookingForm 
                        rooms={rooms} 
                        bookings={bookings} 
                        userProfile={userProfile} 
                        language={language}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດໃນການຈອງຫ້ອງປະຊຸມ" : "No Booking Permission"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {language === "lo" ? "ທ່ານສາມາດເບິ່ງຕາຕະລາງປະຕິທິນໄດ້ ແຕ່ບໍ່ສາມາດສົ່ງຄຳຂໍຈອງຫ້ອງປະຊຸມໄດ້" : "You have read-only access to calendar."}
                        </p>
                        <button
                          onClick={() => setActiveTab("dashboard")}
                          className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                        >
                          {language === "lo" ? "ກັບໄປເບິ່ງຕາຕະລາງ" : "Back to Calendar"}
                        </button>
                      </div>
                    )
                  )}

                  {activeTab === "rooms" && (
                    (userProfile.role === "admin" || canManageRooms) ? (
                      <RoomManagement 
                        rooms={rooms} 
                        bookings={bookings} 
                        language={language}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດຈັດການຂໍ້ມູນຫ້ອງປະຊຸມ" : "No Room Management Permission"}
                        </h3>
                      </div>
                    )
                  )}

                  {activeTab === "admin-bookings" && (
                    (userProfile.role === "admin" || canApproveMeeting) ? (
                      <AdminBookings 
                        rooms={rooms} 
                        bookings={bookings} 
                        userProfile={userProfile} 
                        language={language}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດອະນຸມັດການຈອງຫ້ອງປະຊຸມ" : "No Approval Permission"}
                        </h3>
                      </div>
                    )
                  )}

                  {activeTab === "reports" && (
                    (userProfile.role === "admin" || canMeetingReports) ? (
                      <ReportSystem 
                        bookings={bookings}
                        rooms={rooms}
                        language={language}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດເບິ່ງບົດລາຍງານຫ້ອງປະຊຸມ" : "No Reports Permission"}
                        </h3>
                      </div>
                    )
                  )}
                </>
              )
            )}

            {/* ========================================================================= */}
            {/* SYSTEM 2: ລະບົບການຈັດການລົດບໍລິຫານ (ADMINISTRATIVE VEHICLE SYSTEM) */}
            {/* ========================================================================= */}
            {activeSystem === "vehicle" && (
              !canAccessVehicle ? (
                <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {language === "lo" ? "ທ່ານບໍ່ມີສິດເຂົ້າເຖິງລະບົບຈັດການລົດບໍລິຫານ" : "Access Denied: Vehicle Fleet System"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {language === "lo" 
                      ? "ບັນຊີຂອງທ່ານບໍ່ໄດ້ຮັບສິດໃຫ້ນຳໃຊ້ລະບົບນີ້ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ (Admin) ເພື່ອຂໍເປີດສິດ"
                      : "Your account does not have permission to access the vehicle fleet system. Please contact an administrator."}
                  </p>
                  <button
                    onClick={() => { setActiveSystem("portal"); setActiveTab("portal"); }}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm cursor-pointer shadow-md inline-flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4" />
                    <span>{language === "lo" ? "ກັບໄປໜ້າສູນຄວບຄຸມລະບົບທັງໝົດ" : "Return to Control Center"}</span>
                  </button>
                </div>
              ) : (
                <>
                  {activeTab === "vehicle-dashboard" && (
                    <VehicleDashboard 
                      vehicles={vehicles}
                      bookings={vehicleBookings}
                      language={language}
                      userRole={userProfile.role}
                      onNavigateToBooking={() => setActiveTab("vehicle-booking")}
                      onNavigateToManagement={() => setActiveTab("vehicle-management")}
                      onNavigateToAdminBookings={() => setActiveTab("vehicle-admin-bookings")}
                    />
                  )}

                  {activeTab === "vehicle-booking" && (
                    canBookVehicle ? (
                      <VehicleBookingForm 
                        vehicles={vehicles}
                        bookings={vehicleBookings}
                        userProfile={userProfile}
                        language={language}
                        onNavigateToAdminBookings={() => setActiveTab("vehicle-admin-bookings")}
                        onNavigateToDashboard={() => setActiveTab("vehicle-dashboard")}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດໃນການຈອງລົດບໍລິຫານ" : "No Vehicle Booking Permission"}
                        </h3>
                        <button
                          onClick={() => setActiveTab("vehicle-dashboard")}
                          className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs"
                        >
                          {language === "lo" ? "ກັບໄປເບິ່ງສະຖານະລົດ" : "Back to Fleet Status"}
                        </button>
                      </div>
                    )
                  )}

                  {activeTab === "vehicle-management" && (
                    (userProfile.role === "admin" || canManageFleet) ? (
                      <VehicleManagement 
                        vehicles={vehicles}
                        language={language}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດຈັດການຂໍ້ມູນລົດບໍລິຫານ" : "No Fleet Management Permission"}
                        </h3>
                      </div>
                    )
                  )}

                  {activeTab === "vehicle-admin-bookings" && (
                    (userProfile.role === "admin" || canApproveVehicle) ? (
                      <VehicleAdminBookings 
                        bookings={vehicleBookings}
                        vehicles={vehicles}
                        userProfile={userProfile}
                        language={language}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດອະນຸມັດການຈອງລົດ" : "No Vehicle Approval Permission"}
                        </h3>
                      </div>
                    )
                  )}

                  {activeTab === "vehicle-reports" && (
                    (userProfile.role === "admin" || canVehicleReports) ? (
                      <VehicleReports 
                        bookings={vehicleBookings}
                        vehicles={vehicles}
                        language={language}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດເບິ່ງບົດລາຍງານການນຳໃຊ້ລົດ" : "No Vehicle Reports Permission"}
                        </h3>
                      </div>
                    )
                  )}
                </>
              )
            )}

            {/* ========================================================================= */}
            {/* SYSTEM 3: ລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກຂອງຄະນະ (LEADERSHIP ACTIVITY SYSTEM) */}
            {/* ========================================================================= */}
            {activeSystem === "leadership" && (
              !canAccessLeadership ? (
                <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {language === "lo" ? "ທ່ານບໍ່ມີສິດເຂົ້າເຖິງລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກ" : "Access Denied: Duty Tracker System"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {language === "lo" 
                      ? "ບັນຊີຂອງທ່ານບໍ່ໄດ້ຮັບສິດໃຫ້ນຳໃຊ້ລະບົບນີ້ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ (Admin) ເພື່ອຂໍເປີດສິດ"
                      : "Your account does not have permission to access the duty tracking system. Please contact an administrator."}
                  </p>
                  <button
                    onClick={() => { setActiveSystem("portal"); setActiveTab("portal"); }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer shadow-md inline-flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4" />
                    <span>{language === "lo" ? "ກັບໄປໜ້າສູນຄວບຄຸມລະບົບທັງໝົດ" : "Return to Control Center"}</span>
                  </button>
                </div>
              ) : (
                <>
                  {activeTab === "leadership-calendar" && (
                    (userProfile.role === "admin" || canCalendarLeadership) ? (
                      <LeadershipCalendar 
                        activities={leadershipActivities}
                        userProfile={userProfile}
                        language={language}
                        onRefresh={() => fetchLeadershipActivities().then(setLeadershipActivities)}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດເບິ່ງປະຕິທິນວຽກ" : "No Duty Calendar Permission"}
                        </h3>
                      </div>
                    )
                  )}

                  {activeTab === "leadership-my-activities" && (
                    (userProfile.role === "admin" || canLogDuty) ? (
                      <LeadershipMyActivities 
                        activities={leadershipActivities}
                        userProfile={userProfile}
                        language={language}
                        onRefresh={() => fetchLeadershipActivities().then(setLeadershipActivities)}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດບັນທຶກວຽກງານ" : "No Duty Logging Permission"}
                        </h3>
                      </div>
                    )
                  )}

                  {activeTab === "leadership-reports" && (
                    (userProfile.role === "admin" || canDutyReports) ? (
                      <LeadershipReports 
                        activities={leadershipActivities}
                        userProfile={userProfile}
                        language={language}
                      />
                    ) : (
                      <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {language === "lo" ? "ທ່ານບໍ່ມີສິດເບິ່ງບົດລາຍງານວຽກ" : "No Duty Reports Permission"}
                        </h3>
                      </div>
                    )
                  )}
                </>
              )
            )}

            {/* SHARED ADMINISTRATION & SETTINGS AS DEDICATED NEW WINDOW / VIEW */}
            {activeTab === "users" && userProfile.role === "admin" && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Window Top Navigation Bar */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setActiveSystem("portal");
                        setActiveTab("portal");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-slate-200/80 dark:border-white/10 active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{language === "lo" ? "ກັບໄປສູນຄວບຄຸມລະບົບ" : "Back to Control Center"}</span>
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">/</span>
                    <span className="text-xs font-black text-violet-600 dark:text-violet-400">
                      {language === "lo" ? "ຈັດການຜູ້ໃຊ້ງານ" : "User Management"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveSystem("portal");
                      setActiveTab("portal");
                    }}
                    className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black border border-slate-200/60 dark:border-white/5 active:scale-95"
                    title={language === "lo" ? "ປິດໜ້າຕ່າງ" : "Close"}
                  >
                    <span>{language === "lo" ? "ປິດໜ້າຕ່າງ" : "Close"}</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <UserManagement 
                  language={language}
                />
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Window Top Navigation Bar */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setActiveSystem("portal");
                        setActiveTab("portal");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-slate-200/80 dark:border-white/10 active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{language === "lo" ? "ກັບໄປສູນຄວບຄຸມລະບົບ" : "Back to Control Center"}</span>
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">/</span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {language === "lo" ? "ຕັ້ງຄ່າລະບົບ" : "System Settings"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveSystem("portal");
                      setActiveTab("portal");
                    }}
                    className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black border border-slate-200/60 dark:border-white/5 active:scale-95"
                    title={language === "lo" ? "ປິດໜ້າຕ່າງ" : "Close"}
                  >
                    <span>{language === "lo" ? "ປິດໜ້າຕ່າງ" : "Close"}</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Settings 
                  language={language} 
                  setLanguage={setLanguage} 
                  theme={theme} 
                  setTheme={setTheme} 
                  userProfile={userProfile}
                  onUpdateProfile={setUserProfile}
                />
              </div>
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
            {/* Click backdrop to close and go to portal */}
            <div 
              className="absolute inset-0 cursor-pointer" 
              onClick={() => {
                setShowWelcomeModal(false);
                setActiveSystem("portal");
                setActiveTab("portal");
              }} 
            />

            {/* Glowing background light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="relative w-full max-w-3xl bg-slate-900/95 dark:bg-slate-950/95 border-2 border-amber-400/60 shadow-[0_0_60px_rgba(251,191,36,0.35)] rounded-[32px] p-6 sm:p-10 text-center overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Decorative top color stripe (Red, Amber, Blue) matching high-class official look */}
              <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-red-600 via-amber-400 to-blue-600 shadow-sm" />
              
              {/* Emblem Centered at the top */}
              <div className="relative mb-5 flex justify-center">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-600 rounded-full blur-xl opacity-70 animate-pulse" />
                <div className="relative p-3 bg-slate-950/90 rounded-full border-2 border-amber-400 shadow-xl">
                  <img
                    src={emblemLogo}
                    alt="Laos National Emblem"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)]"
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
              <div className="space-y-4">
                <div className="space-y-2">
                  {language === "lo" ? (
                    <>
                      <h3 className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200 leading-snug drop-shadow-md">
                        ຍິນດີຕ້ອນຮັບເຂົ້າສູ່ ລະບົບບໍລິຫານທັນສະໄໝ
                      </h3>
                      <h4 className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 leading-snug drop-shadow-md">
                        ຫ້ອງວ່າການແຂວງຫົວພັນ
                      </h4>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200 leading-snug drop-shadow-md uppercase tracking-wide">
                        Welcome to Modern Administration System
                      </h3>
                      <h4 className="text-sm sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 leading-snug drop-shadow-md uppercase tracking-wider">
                        Houaphanh Provincial Governor's Office
                      </h4>
                    </>
                  )}
                </div>

                {/* Personalized greet with name */}
                {userProfile && (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl px-5 py-2.5 border border-white/10 inline-flex flex-wrap items-center justify-center gap-2 mx-auto shadow-inner">
                    <p className="text-xs sm:text-sm text-slate-300 font-bold">
                      {language === "lo" ? "ສະບາຍດີ, ທ່ານ" : "Hello,"}{" "}
                      <span className="text-amber-400 font-black">
                        {(userProfile.displayName || "").replace(/^(ທ່ານ\s*)+/g, "").trim()}
                      </span>
                    </p>
                    {userProfile.department && (
                      <span className="px-2.5 py-0.5 bg-amber-400/10 rounded-lg border border-amber-400/20 text-[10px] text-amber-300 font-extrabold uppercase tracking-wider">
                        {userProfile.department}
                      </span>
                    )}
                  </div>
                )}

                {/* Divider Line */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-amber-400/40" />
                  <span className="text-[11px] font-black uppercase text-amber-300/80 tracking-wider">
                    {language === "lo" ? "ເລືອກລະບົບທີ່ຕ້ອງການເຂົ້າໃຊ້ງານ" : "Select System to Access"}
                  </span>
                  <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-amber-400/40" />
                </div>

                {/* The 3 Systems Mini Cards Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-left">
                  
                  {/* Card 1: ລະບົບຈອງຫ້ອງປະຊຸມ */}
                  <button
                    onClick={() => {
                      if (!canAccessMeeting) {
                        showSystemToast.warning(
                          language === "lo"
                            ? "ທ່ານບໍ່ມີສິດເຂົ້າເຖິງ ລະບົບຈອງຫ້ອງປະຊຸມ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ"
                            : "You do not have permission for the Meeting Room System"
                        );
                        return;
                      }
                      setShowWelcomeModal(false);
                      setActiveSystem("meeting");
                      setActiveTab("dashboard");
                    }}
                    className={`group relative p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-indigo-900/50 to-slate-900/80 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      canAccessMeeting
                        ? "border-indigo-500/40 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20"
                        : "border-slate-700/50 opacity-60 hover:opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform ${
                        canAccessMeeting 
                          ? "bg-indigo-600 text-white shadow-indigo-600/30 group-hover:scale-105" 
                          : "bg-slate-700 text-slate-400"
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                          {language === "lo" ? "ຫ້ອງປະຊຸມ" : "Rooms"}
                        </span>
                        {!canAccessMeeting ? (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{language === "lo" ? "ຈຳກັດສິດ" : "Restricted"}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{language === "lo" ? "ໄດ້ຮັບສິດ" : "Authorized"}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors leading-tight">
                        {language === "lo" ? "ລະບົບຈອງຫ້ອງປະຊຸມ" : "Meeting Room System"}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {language === "lo" ? "ຫ້ອງປະຊຸມ, ຕາຕະລາງ, ການຈອງ & ອະນຸມັດ" : "Room schedule, booking & approvals"}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-indigo-400 group-hover:text-indigo-300">
                      <span>{canAccessMeeting ? (language === "lo" ? "ເຂົ້າໃຊ້ງານ" : "Enter") : (language === "lo" ? "ບໍ່ມີສິດ" : "No Access")}</span>
                      {canAccessMeeting ? (
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </div>
                  </button>

                  {/* Card 2: ລະບົບການຈັດການລົດບໍລິຫານ */}
                  <button
                    onClick={() => {
                      if (!canAccessVehicle) {
                        showSystemToast.warning(
                          language === "lo"
                            ? "ທ່ານບໍ່ມີສິດເຂົ້າເຖິງ ລະບົບຈັດການລົດບໍລິຫານ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ"
                            : "You do not have permission for the Vehicle Fleet System"
                        );
                        return;
                      }
                      setShowWelcomeModal(false);
                      setActiveSystem("vehicle");
                      setActiveTab("vehicle-dashboard");
                    }}
                    className={`group relative p-4 rounded-2xl bg-gradient-to-br from-amber-950/70 via-orange-900/50 to-slate-900/80 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      canAccessVehicle
                        ? "border-amber-500/40 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20"
                        : "border-slate-700/50 opacity-60 hover:opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform ${
                        canAccessVehicle 
                          ? "bg-amber-600 text-white shadow-amber-600/30 group-hover:scale-105" 
                          : "bg-slate-700 text-slate-400"
                      }`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          {language === "lo" ? "ຈັດການລົດ" : "Fleet"}
                        </span>
                        {!canAccessVehicle ? (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{language === "lo" ? "ຈຳກັດສິດ" : "Restricted"}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{language === "lo" ? "ໄດ້ຮັບສິດ" : "Authorized"}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors leading-tight">
                        {language === "lo" ? "ລະບົບຈັດການລົດບໍລິຫານ" : "Vehicle Fleet System"}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {language === "lo" ? "ລົດລັດຖະການ, ຕາຕະລາງ, ຄົນຂັບ & ລາຍງານ" : "Official trips, drivers & reports"}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-amber-400 group-hover:text-amber-300">
                      <span>{canAccessVehicle ? (language === "lo" ? "ເຂົ້າໃຊ້ງານ" : "Enter") : (language === "lo" ? "ບໍ່ມີສິດ" : "No Access")}</span>
                      {canAccessVehicle ? (
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </div>
                  </button>

                  {/* Card 3: ລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກ */}
                  <button
                    onClick={() => {
                      if (!canAccessLeadership) {
                        showSystemToast.warning(
                          language === "lo"
                            ? "ທ່ານບໍ່ມີສິດເຂົ້າເຖິງ ລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ"
                            : "You do not have permission for the Duty Activity System"
                        );
                        return;
                      }
                      setShowWelcomeModal(false);
                      setActiveSystem("leadership");
                      setActiveTab("leadership-calendar");
                    }}
                    className={`group relative p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-teal-900/50 to-slate-900/80 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      canAccessLeadership
                        ? "border-emerald-500/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
                        : "border-slate-700/50 opacity-60 hover:opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform ${
                        canAccessLeadership 
                          ? "bg-emerald-600 text-white shadow-emerald-600/30 group-hover:scale-105" 
                          : "bg-slate-700 text-slate-400"
                      }`}>
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          {language === "lo" ? "ຕິດຕາມວຽກ" : "Duty"}
                        </span>
                        {!canAccessLeadership ? (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{language === "lo" ? "ຈຳກັດສິດ" : "Restricted"}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{language === "lo" ? "ໄດ້ຮັບສິດ" : "Authorized"}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors leading-tight">
                        {language === "lo" ? "ລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກ" : "Duty Activity Tracking"}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {language === "lo" ? "ວຽກຄະນະ/ຫົວໜ້າ, ປະຕິທິນ, ບັນທຶກ & ລາຍງານ" : "Executive duties, calendar & reports"}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">
                      <span>{canAccessLeadership ? (language === "lo" ? "ເຂົ້າໃຊ້ງານ" : "Enter") : (language === "lo" ? "ບໍ່ມີສິດ" : "No Access")}</span>
                      {canAccessLeadership ? (
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </div>
                  </button>

                </div>
              </div>

              {/* Action Proceed to 3-System Portal Button with Timer Progress */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    setActiveSystem("portal");
                    setActiveTab("portal");
                  }}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl font-black text-xs md:text-sm shadow-lg shadow-amber-400/20 hover:shadow-xl hover:shadow-amber-400/35 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 mx-auto border border-amber-300/40"
                >
                  <Layers className="w-4 h-4" />
                  <span>{language === "lo" ? "ເຂົ້າສູ່ ສູນຄວບຄຸມລະບົບທັງໝົດ (Control Center)" : "Open System Control Center"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-slate-400">
                  {language === "lo" ? "ລະບົບຈະນຳທ່ານເຂົ້າສູ່ ສູນຄວບຄຸມລະບົບທັງໝົດ ໂດຍອັດຕະໂນມັດ..." : "Automatically entering system control center..."}
                </p>

                {/* Countdown animation progress bar */}
                <div className="w-36 mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
