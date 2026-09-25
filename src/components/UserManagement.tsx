import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Check, 
  X, 
  Shield, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  CheckCircle,
  Clock,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Sparkles,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Key,
  Calendar,
  ArrowRight,
  Car,
  Lock,
  Unlock,
  Sliders,
  CheckSquare,
  Square,
  Info
} from "lucide-react";
import { db, collection, onSnapshot } from "../lib/firebase";
import { 
  AppLanguage, 
  UserProfile, 
  UserRole, 
  UserStatus,
  SystemPermissions,
  DEFAULT_USER_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  PRESET_MEETING_OFFICER,
  PRESET_VEHICLE_OFFICER,
  PRESET_LEADERSHIP_OFFICER,
  PRESET_VIEW_ONLY,
  PRESET_REVOKED,
  hasPermission,
  countSystemPermissions
} from "../types";
import { translations } from "../lib/translations";
import { updateUserProfile, createUserProfile, deleteUserProfile } from "../lib/firebaseHelper";
import { showSystemToast } from "../utils/toast";
import { motion, AnimatePresence } from "motion/react";

interface UserManagementProps {
  language: AppLanguage;
}

export default function UserManagement({ language }: UserManagementProps) {
  const t = translations[language];
  const isLao = language === "lo";

  // Component States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "admin" | "active" | "pending">("all");
  const [toast, setToast] = useState<string | null>(null);

  // Add User Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addDepartment, setAddDepartment] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addRole, setAddRole] = useState<UserRole>("user");
  const [addStatus, setAddStatus] = useState<UserStatus>("active");
  const [addUsername, setAddUsername] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addPermissionPreset, setAddPermissionPreset] = useState<"user" | "admin" | "meeting" | "vehicle" | "leadership" | "view">("user");
  const [addLoading, setAddLoading] = useState(false);

  // Edit User Modal States
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [editStatus, setEditStatus] = useState<UserStatus>("active");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete User Modal States
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Permissions Modal States
  const [permissionUser, setPermissionUser] = useState<UserProfile | null>(null);
  const [permissionsDraft, setPermissionsDraft] = useState<SystemPermissions>(DEFAULT_USER_PERMISSIONS);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [activePermTab, setActivePermTab] = useState<"meeting" | "vehicle" | "leadership">("meeting");

  // Subscribe to real-time users collection
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        list.push({
          ...data,
          uid: docSnap.id || data.uid,
          displayName: data.displayName || data.email?.split("@")[0] || "User",
          email: data.email || "",
          department: data.department || "",
          phone: data.phone || "",
          role: data.role || "user",
          status: data.status || "pending",
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      // Sort by creation time (newest first)
      setUsers(list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
    }, (error) => {
      console.error("Users subscription error:", error);
    });

    return () => unsubscribe();
  }, []);

  const triggerToast = (msg: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
    showSystemToast(msg, type, isLao ? "ຈັດການຜູ້ໃຊ້ງານ" : "User Management");
  };

  // Quick Role Toggle
  const handleChangeRole = async (uid: string, currentRole: UserRole) => {
    const nextRole: UserRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateUserProfile(uid, { role: nextRole });
      triggerToast(isLao ? "ປ່ຽນແປງສິດການເຂົ້າເຖິງສຳເລັດ" : "Role updated successfully", "success");
    } catch (err: any) {
      console.error("Role update error:", err);
      triggerToast(err.message || "Failed to update role", "error");
    }
  };

  // Open Permissions Modal
  const handleOpenPermissionsModal = (user: UserProfile) => {
    setPermissionUser(user);
    const base = user.role === "admin" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS;
    setPermissionsDraft({
      ...base,
      ...(user.permissions || {})
    });
    setActivePermTab("meeting");
  };

  // Apply Permissions Preset
  const applyPermissionPreset = (preset: "admin" | "user" | "meeting" | "vehicle" | "leadership" | "view" | "none") => {
    if (preset === "admin") {
      setPermissionsDraft({ ...DEFAULT_ADMIN_PERMISSIONS });
    } else if (preset === "user") {
      setPermissionsDraft({ ...DEFAULT_USER_PERMISSIONS });
    } else if (preset === "meeting") {
      setPermissionsDraft({ ...PRESET_MEETING_OFFICER });
    } else if (preset === "vehicle") {
      setPermissionsDraft({ ...PRESET_VEHICLE_OFFICER });
    } else if (preset === "leadership") {
      setPermissionsDraft({ ...PRESET_LEADERSHIP_OFFICER });
    } else if (preset === "view") {
      setPermissionsDraft({ ...PRESET_VIEW_ONLY });
    } else if (preset === "none") {
      setPermissionsDraft({ ...PRESET_REVOKED });
    }
  };

  // Quick Select / Deselect All for Active System Tab
  const toggleSelectAllForTab = (tab: "meeting" | "vehicle" | "leadership", enable: boolean) => {
    if (tab === "meeting") {
      setPermissionsDraft(prev => ({
        ...prev,
        meetingAccess: enable,
        meetingBook: enable,
        meetingApprove: enable,
        meetingManageRooms: enable,
        meetingReports: enable
      }));
    } else if (tab === "vehicle") {
      setPermissionsDraft(prev => ({
        ...prev,
        vehicleAccess: enable,
        vehicleBook: enable,
        vehicleApprove: enable,
        vehicleManageFleet: enable,
        vehicleReports: enable
      }));
    } else if (tab === "leadership") {
      setPermissionsDraft(prev => ({
        ...prev,
        leadershipAccess: enable,
        leadershipCalendar: enable,
        leadershipLogOwn: enable,
        leadershipManageAll: enable,
        leadershipReports: enable
      }));
    }
  };

  // Save Permissions to Firestore and sync local storage
  const handleSavePermissions = async () => {
    if (!permissionUser) return;
    setPermissionLoading(true);
    try {
      await updateUserProfile(permissionUser.uid, {
        permissions: permissionsDraft
      });

      // Synchronize with local session cache if current logged-in user is updated
      try {
        const localAuth = localStorage.getItem("local-auth-profile");
        if (localAuth) {
          const currentProfile = JSON.parse(localAuth);
          if (currentProfile && currentProfile.uid === permissionUser.uid) {
            const updated = { ...currentProfile, permissions: permissionsDraft };
            localStorage.setItem("local-auth-profile", JSON.stringify(updated));
            window.dispatchEvent(new Event("storage"));
          }
        }
      } catch (errCache) {
        console.warn("Local auth cache sync notice:", errCache);
      }

      triggerToast(
        isLao 
          ? `ບັນທຶກການກຳນົດສິດທິ 3 ລະບົບຂອງ ${permissionUser.displayName} ສຳເລັດແລ້ວ!` 
          : `3-System permissions for ${permissionUser.displayName} saved successfully!`, 
        "success"
      );
      setPermissionUser(null);
    } catch (err: any) {
      console.error("Save permissions error:", err);
      triggerToast(err.message || "Failed to save permissions", "error");
    } finally {
      setPermissionLoading(false);
    }
  };

  // Quick Status Toggle
  const handleChangeStatus = async (uid: string, nextStatus: UserStatus) => {
    try {
      await updateUserProfile(uid, { status: nextStatus });
      const successMsg = nextStatus === "active" 
        ? (isLao ? "ອະນຸມັດຜູ້ໃຊ້ງານສຳເລັດແລ້ວ" : "User approved successfully")
        : (isLao ? "ປະຕິເສດ/ລະງັບການໃຊ້ງານແລ້ວ" : "User suspended/rejected");
      triggerToast(successMsg, nextStatus === "active" ? "success" : "warning");
    } catch (err: any) {
      console.error("Status update error:", err);
      triggerToast(err.message || "Failed to update status", "error");
    }
  };

  // Handle Add New User
  const handleOpenAddModal = () => {
    setAddDisplayName("");
    setAddEmail("");
    setAddDepartment("");
    setAddPhone("");
    setAddRole("user");
    setAddStatus("active");
    setAddUsername("");
    setAddPassword("");
    setAddPermissionPreset("user");
    setShowAddModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDisplayName.trim() || !addEmail.trim() || !addDepartment.trim()) {
      triggerToast(isLao ? "ກະລຸນາປ້ອນຂໍ້ມູນທີ່ຈຳເປັນໃຫ້ຄົບຖ້ວນ!" : "Please fill in all required fields!", "warning");
      return;
    }

    // Check if email already exists
    const emailExists = users.some(u => u.email.toLowerCase() === addEmail.trim().toLowerCase());
    if (emailExists) {
      triggerToast(isLao ? "ອີເມວນີ້ມີໃນລະບົບແລ້ວ! ກະລຸນາໃຊ້ອີເມວອື່ນ" : "Email already exists in system!", "error");
      return;
    }

    const targetUsername = addUsername.trim();
    if (targetUsername) {
      if (targetUsername.toLowerCase() === "admin") {
        triggerToast(isLao ? "ບໍ່ສາມາດໃຊ້ຊື່ຜູ້ໃຊ້ 'Admin' ໄດ້" : "Username 'Admin' is reserved", "error");
        return;
      }
      const usernameExists = users.some(u => u.username?.toLowerCase() === targetUsername.toLowerCase());
      if (usernameExists) {
        triggerToast(isLao ? "ຊື່ຜູ້ໃຊ້ນີ້ມີໃນລະບົບແລ້ວ! ກະລຸນາໃຊ້ຊື່ຜູ້ໃຊ້ອື່ນ" : "Username already exists!", "error");
        return;
      }
    }

    setAddLoading(true);
    try {
      let initialPermissions: SystemPermissions = DEFAULT_USER_PERMISSIONS;
      if (addRole === "admin" || addPermissionPreset === "admin") {
        initialPermissions = DEFAULT_ADMIN_PERMISSIONS;
      } else if (addPermissionPreset === "meeting") {
        initialPermissions = PRESET_MEETING_OFFICER;
      } else if (addPermissionPreset === "vehicle") {
        initialPermissions = PRESET_VEHICLE_OFFICER;
      } else if (addPermissionPreset === "leadership") {
        initialPermissions = PRESET_LEADERSHIP_OFFICER;
      } else if (addPermissionPreset === "view") {
        initialPermissions = PRESET_VIEW_ONLY;
      }

      const newUid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newProfile: UserProfile = {
        uid: newUid,
        displayName: addDisplayName.trim(),
        email: addEmail.trim().toLowerCase(),
        department: addDepartment.trim(),
        phone: addPhone.trim(),
        role: addRole,
        status: addStatus,
        username: targetUsername || undefined,
        password: addPassword || undefined,
        permissions: initialPermissions,
        createdAt: new Date().toISOString()
      };

      await createUserProfile(newProfile);
      triggerToast(isLao ? "ເພີ່ມບັນຊີຜູ້ໃຊ້ໃໝ່ ແລະ ກຳນົດສິດ 3 ລະບົບສຳເລັດ!" : "New user created with system permissions!", "success");
      setShowAddModal(false);
    } catch (err: any) {
      console.error("Create user error:", err);
      triggerToast(err.message || "Failed to create user", "error");
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Edit User
  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditDisplayName(user.displayName);
    setEditEmail(user.email);
    setEditDepartment(user.department || "");
    setEditPhone(user.phone || "");
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditUsername(user.username || "");
    setEditPassword(user.password || "");
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editDisplayName.trim() || !editEmail.trim() || !editDepartment.trim()) {
      triggerToast(isLao ? "ກະລຸນາປ້ອນຂໍ້ມູນທີ່ຈຳເປັນໃຫ້ຄົບຖ້ວນ!" : "Please fill in all required fields!", "warning");
      return;
    }

    const targetUsername = editUsername.trim();
    if (targetUsername) {
      if (targetUsername.toLowerCase() === "admin" && editingUser.uid !== "admin_default") {
        triggerToast(isLao ? "ບໍ່ສາມາດໃຊ້ຊື່ຜູ້ໃຊ້ 'Admin' ໄດ້" : "Username 'Admin' is reserved", "error");
        return;
      }
      const usernameExists = users.some(u => u.uid !== editingUser.uid && u.username?.toLowerCase() === targetUsername.toLowerCase());
      if (usernameExists) {
        triggerToast(isLao ? "ຊື່ຜູ້ໃຊ້ນີ້ມີໃນລະບົບແລ້ວ! ກະລຸນາໃຊ້ຊື່ຜູ້ໃຊ້ອື່ນ" : "Username already exists!", "error");
        return;
      }
    }

    setEditLoading(true);
    try {
      await updateUserProfile(editingUser.uid, {
        displayName: editDisplayName.trim(),
        email: editEmail.trim().toLowerCase(),
        department: editDepartment.trim(),
        phone: editPhone.trim(),
        role: editRole,
        status: editStatus,
        username: targetUsername || "",
        password: editPassword || ""
      });
      triggerToast(isLao ? "ບັນທຶກການແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້ສຳເລັດ!" : "User details updated successfully!", "success");
      setEditingUser(null);
    } catch (err: any) {
      console.error("Update user error:", err);
      triggerToast(err.message || "Failed to update user", "error");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete User
  const handleOpenDeleteModal = (user: UserProfile) => {
    setDeletingUser(user);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await deleteUserProfile(deletingUser.uid);
      triggerToast(isLao ? "ລົບບັນຊີຜູ້ໃຊ້ງານສຳເລັດແລ້ວ!" : "User deleted successfully!", "success");
      setDeletingUser(null);
    } catch (err: any) {
      console.error("Delete user error:", err);
      triggerToast(err.message || "Failed to delete user", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Statistics counts
  const adminCount = users.filter(u => u.role === "admin").length;
  const activeCount = users.filter(u => u.status === "active").length;
  const pendingCount = users.filter(u => u.status === "pending").length;

  // Search and Role Filter
  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      user.displayName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.department && user.department.toLowerCase().includes(search)) ||
      (user.phone && user.phone.includes(search));

    if (!matchesSearch) return false;

    if (activeFilter === "admin") return user.role === "admin";
    if (activeFilter === "active") return user.status === "active";
    if (activeFilter === "pending") return user.status === "pending";
    return true;
  });

  return (
    <div id="user-management-view" className="space-y-6 font-sans pb-16">
      
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

      {/* Part 1: Main Header Banner with Violet/Purple Tone */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-700 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-fuchsia-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{isLao ? "ຈັດການບັນຊີ ແລະ ສິດທິການເຂົ້າເຖິງລະບົບ" : "User Access Control & Directory"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-amber-300 shrink-0" />
              <span>{isLao ? t.usrManageUsers : "User Account Management"}</span>
            </h2>
            <p className="text-xs sm:text-sm text-fuchsia-100 font-medium leading-relaxed">
              {isLao 
                ? "ກວດສອບ, ເພີ່ມ, ແກ້ໄຂ, ລົບ ແລະ ກຳນົດສິດທິການເຂົ້າເຖິງລະບົບຂອງພະນັກງານທັງໝົດໃນອົງກອນ" 
                : "Manage, register, edit, and control system access levels or security privileges for all department staff accounts."}
            </p>
          </div>

          <div className="shrink-0 flex items-center">
            <button
              id="btn-open-add-user"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 px-5 sm:px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:shadow-[0_0_35px_rgba(251,191,36,0.6)] cursor-pointer active:scale-95 group shrink-0"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-950/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserPlus className="w-4 h-4 font-black" />
              </div>
              <span>{isLao ? "➕ ເພີ່ມຜູ້ໃຊ້ໃໝ່" : t.usrAddUser || "+ Add New User"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Part 2: Quick Statistics & Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: All Users */}
        <div 
          onClick={() => setActiveFilter("all")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeFilter === "all"
              ? "bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/10"
              : "bg-white dark:bg-[#1e293b] border-slate-100 dark:border-white/5 hover:border-blue-500/30"
          }`}
        >
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isLao ? "ຜູ້ໃຊ້ທັງໝົດ" : "All Users"}
            </span>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {users.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Admins */}
        <div 
          onClick={() => setActiveFilter("admin")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeFilter === "admin"
              ? "bg-purple-500/10 border-purple-500 shadow-md shadow-purple-500/10"
              : "bg-white dark:bg-[#1e293b] border-slate-100 dark:border-white/5 hover:border-purple-500/30"
          }`}
        >
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isLao ? "ຜູ້ດູແລລະບົບ" : "Admins"}
            </span>
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
              {adminCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Active Users */}
        <div 
          onClick={() => setActiveFilter("active")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeFilter === "active"
              ? "bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10"
              : "bg-white dark:bg-[#1e293b] border-slate-100 dark:border-white/5 hover:border-emerald-500/30"
          }`}
        >
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isLao ? "ອະນຸມັດ" : "Active Users"}
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {activeCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Pending Users */}
        <div 
          onClick={() => setActiveFilter("pending")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeFilter === "pending"
              ? "bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10"
              : "bg-white dark:bg-[#1e293b] border-slate-100 dark:border-white/5 hover:border-amber-500/30"
          }`}
        >
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>{isLao ? "ລໍຖ້າອະນຸມັດ" : "Pending"}</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
              )}
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Part 3: Search Bar & Section Header with Blue/Indigo Tone */}
      <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent p-5 rounded-2xl border-l-4 border-blue-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>{isLao ? "ລາຍຊື່ບັນຊີຜູ້ໃຊ້ໃນລະບົບ" : "User Accounts Directory"}</span>
              <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-bold border border-blue-500/20">
                {filteredUsers.length} {isLao ? "ບັນຊີ" : "Accounts"}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {activeFilter === "all" ? (isLao ? "ສະແດງທຸກບັນຊີໃນລະບົບ" : "Showing all accounts") :
               activeFilter === "admin" ? (isLao ? "ສະແດງສະເພາະຜູ້ດູແລລະບົບ (Admin)" : "Showing administrators only") :
               activeFilter === "active" ? (isLao ? "ສະແດງສະເພາະບັນຊີທີ່ອະນຸມັດ" : "Showing active users only") :
               (isLao ? "ສະແດງບັນຊີທີ່ລໍຖ້າການອະນຸມັດ" : "Showing pending users")}
            </p>
          </div>
        </div>

        {/* Live search input */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={isLao ? "ຄົ້ນຫາຊື່, ອີເມວ, ພະແນກ ຫຼື ເບີໂທ..." : "Search name, email, department..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl themed-input text-xs font-medium"
          />
        </div>
      </div>

      {/* Part 4: User listing table */}
      <div className="overflow-x-auto bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs p-5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-900/40 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-3 border-b border-slate-100 dark:border-white/5">
              <th className="py-3.5 px-4">{t.usrDisplayName}</th>
              <th className="py-3.5 px-4">{t.department}</th>
              <th className="py-3.5 px-4">{t.role}</th>
              <th className="py-3.5 px-4">{isLao ? "ສິດທິ 3 ລະບົບ" : "Permissions"}</th>
              <th className="py-3.5 px-4">{t.status}</th>
              <th className="py-3.5 px-4 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-8 h-8 opacity-40 text-slate-400" />
                    <span>{t.noData}</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const permCounts = countSystemPermissions(user);
                return (
                <tr key={user.uid} id={`user-row-${user.uid}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  {/* User Profile */}
                  <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-inner shrink-0 ${
                        user.role === "admin" 
                          ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20 shadow-md" 
                          : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}>
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                          {user.displayName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-blue-500" />
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Department & Phone */}
                  <td className="py-4 px-4 font-semibold">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{user.department || (isLao ? "ທົ່ວໄປ / ບໍ່ລະບຸ" : "General / N/A")}</span>
                      </span>
                      {user.phone && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Role with shield toggle button */}
                  <td className="py-4 px-4">
                    <button
                      id={`btn-toggle-role-${user.uid}`}
                      onClick={() => handleChangeRole(user.uid, user.role)}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-[10px] flex items-center gap-1.5 border transition-all hover:scale-105 cursor-pointer shadow-2xs ${
                        user.role === "admin"
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 shadow-purple-500/10"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-blue-500/30"
                      }`}
                      title={isLao ? "ກົດເພື່ອກຳນົດ ຫຼື ປ່ຽນສິດທິຜູ້ໃຊ້" : "Click to toggle admin/user role"}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{user.role === "admin" ? t.admin : t.user}</span>
                    </button>
                  </td>

                  {/* Granular Permissions Status Column across 3 Systems */}
                  <td className="py-4 px-4">
                    <button
                      id={`btn-perm-user-${user.uid}`}
                      onClick={() => handleOpenPermissionsModal(user)}
                      className="group/btn flex flex-col gap-1.5 text-left p-2 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer border border-slate-200/80 dark:border-white/10 hover:border-indigo-400/50 shadow-2xs"
                      title={isLao ? "ກົດເພື່ອກຳນົດສິດທິການນຳໃຊ້ 3 ລະບົບລະອຽດ" : "Configure 3 Systems permissions"}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Meeting Room System Badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black inline-flex items-center gap-1 border transition-all ${
                          hasPermission(user, "meetingAccess")
                            ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 shadow-xs shadow-indigo-500/10"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/10 opacity-60"
                        }`}>
                          <Building2 className="w-2.5 h-2.5" />
                          <span>{isLao ? "ຫ້ອງ" : "Rooms"}</span>
                          <span className="text-[9px] bg-indigo-500/20 px-1 rounded font-black">
                            {hasPermission(user, "meetingAccess") ? `${permCounts.meetingCount}/5` : "ປິດ"}
                          </span>
                        </span>

                        {/* Vehicle System Badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black inline-flex items-center gap-1 border transition-all ${
                          hasPermission(user, "vehicleAccess")
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-xs shadow-amber-500/10"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/10 opacity-60"
                        }`}>
                          <Car className="w-2.5 h-2.5" />
                          <span>{isLao ? "ລົດ" : "Fleet"}</span>
                          <span className="text-[9px] bg-amber-500/20 px-1 rounded font-black">
                            {hasPermission(user, "vehicleAccess") ? `${permCounts.vehicleCount}/5` : "ປິດ"}
                          </span>
                        </span>

                        {/* Leadership System Badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black inline-flex items-center gap-1 border transition-all ${
                          hasPermission(user, "leadershipAccess")
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-xs shadow-emerald-500/10"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/10 opacity-60"
                        }`}>
                          <Briefcase className="w-2.5 h-2.5" />
                          <span>{isLao ? "ວຽກ" : "Duty"}</span>
                          <span className="text-[9px] bg-emerald-500/20 px-1 rounded font-black">
                            {hasPermission(user, "leadershipAccess") ? `${permCounts.leadershipCount}/5` : "ປິດ"}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[10.5px] font-extrabold text-indigo-600 dark:text-indigo-400 group-hover/btn:text-indigo-700 dark:group-hover/btn:text-indigo-300 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-indigo-500" />
                          <span>{isLao ? "ກຳນົດສິດ 3 ລະບົບ" : "Manage Permissions"}</span>
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                          {permCounts.totalEnabled}/{permCounts.totalFeatures}
                        </span>
                      </div>
                    </button>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-extrabold border inline-flex items-center gap-1 ${
                      user.status === "active" 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                        : user.status === "pending"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === "active" ? "bg-emerald-500" :
                        user.status === "pending" ? "bg-amber-500" : "bg-red-500"
                      }`} />
                      <span>
                        {user.status === "active" ? t.usrStatusActive : 
                         user.status === "pending" ? t.usrStatusPending : t.usrStatusInactive}
                      </span>
                    </span>
                  </td>

                  {/* Administrative Actions Cluster: Status quick toggles + Permissions + Edit + Delete */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Status quick togglers */}
                      {user.status === "pending" && (
                        <button
                          id={`btn-approve-user-${user.uid}`}
                          onClick={() => handleChangeStatus(user.uid, "active")}
                          className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-500/15 cursor-pointer"
                          title={isLao ? "ອະນຸມັດບັນຊີ" : "Approve user"}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {user.status === "active" && (
                        <button
                          id={`btn-suspend-user-${user.uid}`}
                          onClick={() => handleChangeStatus(user.uid, "inactive")}
                          className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/60 dark:border-white/5"
                          title={isLao ? "ລະງັບການໃຊ້ງານ" : "Suspend user"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {user.status === "inactive" && (
                        <button
                          id={`btn-activate-user-${user.uid}`}
                          onClick={() => handleChangeStatus(user.uid, "active")}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-500/20"
                          title={isLao ? "ເປີດໃຊ້ງານຄືນ" : "Activate user"}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {/* Permissions Manager Button */}
                      <button
                        id={`btn-action-perm-${user.uid}`}
                        onClick={() => handleOpenPermissionsModal(user)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/60 dark:border-white/5"
                        title={isLao ? "ກຳນົດສິດທິ 3 ລະບົບ" : "Configure 3 Systems Permissions"}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>

                      {/* Edit User Button */}
                      <button
                        id={`btn-edit-user-${user.uid}`}
                        onClick={() => handleOpenEditModal(user)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/60 dark:border-white/5"
                        title={isLao ? "ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້" : "Edit user details"}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete User Button */}
                      <button
                        id={`btn-delete-user-${user.uid}`}
                        onClick={() => handleOpenDeleteModal(user)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-500/15 text-red-500 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/60 dark:border-white/5"
                        title={isLao ? "ລົບບັນຊີຜູ້ໃຊ້" : "Delete account"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

      {/* Part 5: Add New User Modal (Emerald/Teal Tone) */}
      <AnimatePresence>
        {showAddModal && (
          <div id="add-user-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-100 dark:border-white/10 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-600/10 via-teal-600/5 to-transparent p-4 rounded-2xl border-l-4 border-emerald-500 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    {isLao ? "ເພີ່ມບັນຊີຜູ້ໃຊ້ໃໝ່ເຂົ້າສູ່ລະບົບ" : "Add New User Account"}
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">
                    {isLao ? "ປ້ອນຂໍ້ມູນສ່ວນຕົວ ແລະ ກຳນົດສິດທິການເຂົ້າເຖິງລະບົບ" : "Enter user profile and access privileges"}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Display Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isLao ? "ຊື່ ແລະ ນາມສະກຸນ" : "Display Name"} *</span>
                    </label>
                    <input 
                      type="text" 
                      value={addDisplayName}
                      onChange={(e) => setAddDisplayName(e.target.value)}
                      required
                      placeholder={isLao ? "ຕົວຢ່າງ: ສົມພອນ ແກ້ວມະນີ" : "e.g. Somphone Keomany"}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isLao ? "ອີເມວ (Email)" : "Email Address"} *</span>
                    </label>
                    <input 
                      type="email" 
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      required
                      placeholder="user@example.com"
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isLao ? "ຊື່ບັນຊີຜູ້ໃຊ້ (Username)" : "Username"}</span>
                    </label>
                    <input 
                      type="text" 
                      value={addUsername}
                      onChange={(e) => setAddUsername(e.target.value)}
                      placeholder={isLao ? "ຕົວຢ່າງ: somphone" : "e.g. somphone"}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Key className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isLao ? "ລະຫັດຜ່ານ (Password)" : "Password"}</span>
                    </label>
                    <input 
                      type="text" 
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      placeholder={isLao ? "ຕົວຢ່າງ: 123456" : "e.g. 123456"}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isLao ? "ພະແນກ / ຫ້ອງການ" : "Department / Unit"} *</span>
                    </label>
                    <input 
                      type="text" 
                      value={addDepartment}
                      onChange={(e) => setAddDepartment(e.target.value)}
                      required
                      placeholder={isLao ? "ຕົວຢ່າງ: ຫ້ອງວ່າການແຂວງ" : "e.g. Provincial Office"}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isLao ? "ເບີໂທລະສັບຕິດຕໍ່" : "Phone Number"}</span>
                    </label>
                    <input 
                      type="text" 
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      placeholder="020 xxxx xxxx"
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Role and Status Selectors */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-white/5 space-y-3">
                  <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Key className="w-4 h-4" />
                    <span>{isLao ? "ກຳນົດສິດທິ ແລະ ສະຖານະບັນຊີ" : "Role & Status Settings"}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Role */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {isLao ? "ສິດທິການເຂົ້າເຖິງ (Role)" : "Access Role"}
                      </label>
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value as UserRole)}
                        className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs font-bold"
                      >
                        <option value="user">{isLao ? "ຜູ້ໃຊ້ທົ່ວໄປ (User)" : "General User"}</option>
                        <option value="admin">{isLao ? "ຜູ້ດູແລລະບົບ (Admin)" : "Administrator (Admin)"}</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {isLao ? "ສະຖານະການໃຊ້ງານ (Status)" : "Account Status"}
                      </label>
                      <select
                        value={addStatus}
                        onChange={(e) => setAddStatus(e.target.value as UserStatus)}
                        className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs font-bold"
                      >
                        <option value="active">{isLao ? "ອະນຸມັດ / ເປີດໃຊ້ງານແລ້ວ (Active)" : "Active (Approved)"}</option>
                        <option value="pending">{isLao ? "ລໍຖ້າການອະນຸມັດ (Pending)" : "Pending Approval"}</option>
                        <option value="inactive">{isLao ? "ລະງັບການໃຊ້ງານ (Inactive)" : "Inactive / Suspended"}</option>
                      </select>
                    </div>

                    {/* Initial 3-System Permission Preset */}
                    <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isLao ? "ສິດທິເລີ່ມຕົ້ນໃນ 3 ລະບົບ (Initial Permissions):" : "Initial 3-System Permissions:"}</span>
                      </label>
                      <select
                        value={addPermissionPreset}
                        onChange={(e) => setAddPermissionPreset(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs font-bold"
                      >
                        <option value="user">👤 {isLao ? "ສິດຜູ້ໃຊ້ທົ່ວໄປ (Standard: ຈອງຫ້ອງ, ຈອງລົດ, ບັນທຶກວຽກ)" : "Standard User (Book & Log)"}</option>
                        <option value="admin">👑 {isLao ? "ໃຫ້ສິດທັງໝົດທຸກລະບົບ (Full Admin: 14 ຟັງຊັນ)" : "Full Admin (All Features)"}</option>
                        <option value="meeting">🏢 {isLao ? "ສະເພາະລະບົບຫ້ອງປະຊຸມ (Meeting Specialist)" : "Meeting Rooms Only"}</option>
                        <option value="vehicle">🚗 {isLao ? "ສະເພາະລະບົບລົດບໍລິຫານ (Vehicle Fleet Specialist)" : "Vehicle Fleet Only"}</option>
                        <option value="leadership">💼 {isLao ? "ສະເພາະລະບົບຕິດຕາມວຽກ (Duty Tracking Specialist)" : "Duty Tracking Only"}</option>
                        <option value="view">👁️ {isLao ? "ສິດເບິ່ງຢ່າງດຽວ (View Only: ບໍ່ສາມາດສ້າງ/ອະນຸມັດ)" : "View Only"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {addLoading ? t.loading : (
                      <>
                        <span>{isLao ? "ບັນທຶກຜູ້ໃຊ້ໃໝ່" : "Save New User"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Part 6: Edit User Modal (Amber/Orange Tone) */}
      <AnimatePresence>
        {editingUser && (
          <div id="edit-user-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-100 dark:border-white/10 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setEditingUser(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-600/10 via-orange-600/5 to-transparent p-4 rounded-2xl border-l-4 border-amber-500 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    {isLao ? "ແກ້ໄຂຂໍ້ມູນບັນຊີຜູ້ໃຊ້" : "Edit User Account Details"}
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-extrabold mt-0.5">
                    {editingUser.email}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Display Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isLao ? "ຊື່ ແລະ ນາມສະກຸນ" : "Display Name"} *</span>
                    </label>
                    <input 
                      type="text" 
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isLao ? "ອີເມວ (Email)" : "Email Address"} *</span>
                    </label>
                    <input 
                      type="email" 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isLao ? "ຊື່ບັນຊີຜູ້ໃຊ້ (Username)" : "Username"}</span>
                    </label>
                    <input 
                      type="text" 
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder={isLao ? "ຕົວຢ່າງ: somphone" : "e.g. somphone"}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isLao ? "ລະຫັດຜ່ານ (Password)" : "Password"}</span>
                    </label>
                    <input 
                      type="text" 
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder={isLao ? "ຕົວຢ່າງ: 123456" : "e.g. 123456"}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isLao ? "ພະແນກ / ຫ້ອງການ" : "Department / Unit"} *</span>
                    </label>
                    <input 
                      type="text" 
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isLao ? "ເບີໂທລະສັບຕິດຕໍ່" : "Phone Number"}</span>
                    </label>
                    <input 
                      type="text" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Role and Status Selectors */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-white/5 space-y-3">
                  <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Key className="w-4 h-4" />
                    <span>{isLao ? "ກຳນົດສິດທິ ແລະ ສະຖານະບັນຊີ" : "Role & Status Settings"}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Role */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {isLao ? "ສິດທິການເຂົ້າເຖິງ (Role)" : "Access Role"}
                      </label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs font-bold"
                      >
                        <option value="user">{isLao ? "ຜູ້ໃຊ້ທົ່ວໄປ (User)" : "General User"}</option>
                        <option value="admin">{isLao ? "ຜູ້ດູແລລະບົບ (Admin)" : "Administrator (Admin)"}</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {isLao ? "ສະຖານະການໃຊ້ງານ (Status)" : "Account Status"}
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                        className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs font-bold"
                      >
                        <option value="active">{isLao ? "ອະນຸມັດ / ເປີດໃຊ້ງານແລ້ວ (Active)" : "Active (Approved)"}</option>
                        <option value="pending">{isLao ? "ລໍຖ້າການອະນຸມັດ (Pending)" : "Pending Approval"}</option>
                        <option value="inactive">{isLao ? "ລະງັບການໃຊ້ງານ (Inactive)" : "Inactive / Suspended"}</option>
                      </select>
                    </div>

                    {/* Button to open permissions directly */}
                    <div className="pt-2 sm:col-span-2 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {isLao ? "ກຳນົດສິດລະອຽດທັງ 3 ລະບົບ (ຫ້ອງປະຊຸມ, ລົດບໍລິຫານ, ຕິດຕາມວຽກ):" : "Granular 3-System Permissions:"}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const userToPerm = editingUser;
                          setEditingUser(null);
                          handleOpenPermissionsModal(userToPerm);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-black border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isLao ? "ກຳນົດສິດ 3 ລະບົບ..." : "Configure Permissions..."}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-3 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {editLoading ? t.loading : (
                      <>
                        <span>{isLao ? "ບັນທຶກການແກ້ໄຂ" : "Save Changes"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Part 7: Delete User Confirmation Modal (Red/Rose Tone) */}
      <AnimatePresence>
        {deletingUser && (
          <div id="delete-user-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 md:p-8 max-w-md w-full border border-red-500/20 shadow-2xl space-y-6 text-center relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20 shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                  {isLao ? "ຢືນຢັນການລົບບັນຊີຜູ້ໃຊ້" : "Confirm Delete User Account"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {isLao 
                    ? `ທ່ານຕ້ອງການລົບບັນຊີຂອງ "${deletingUser.displayName}" ແທ້ບໍ່? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້ ແລະ ຜູ້ໃຊ້ນີ້ຈະບໍ່ສາມາດເຂົ້າສູ່ລະບົບໄດ້ອີກ.`
                    : `Are you sure you want to permanently delete "${deletingUser.displayName}"? This action cannot be undone.`}
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/50 dark:border-white/5 mt-3 text-left">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    📧 {deletingUser.email}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    🏢 {deletingUser.department || (isLao ? "ທົ່ວໄປ" : "General")}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-3 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-red-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {deleteLoading ? t.loading : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>{isLao ? "ຢືນຢັນລົບ" : "Confirm Delete"}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Part 8: Granular Permissions Management Modal across 3 Systems */}
      <AnimatePresence>
        {permissionUser && (
          <div id="permissions-modal-overlay" className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 md:p-8 max-w-3xl w-full border-2 border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.25)] space-y-6 relative max-h-[92vh] overflow-y-auto"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-500" />

              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{isLao ? "ກຳນົດສິດທິການນຳໃຊ້ 3 ລະບົບ" : "Assign System Permissions"}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {isLao 
                        ? `ກຳນົດສິດລະອຽດແຕ່ລະຟັງຊັນສຳລັບບັນຊີ: ` 
                        : `Configure granular access permissions for user: `}
                      <span className="font-black text-indigo-600 dark:text-amber-400">
                        {permissionUser.displayName}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPermissionUser(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Identity Pill Bar */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="font-black text-slate-800 dark:text-slate-100">
                    👤 {permissionUser.displayName}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    📧 {permissionUser.email}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    🏢 {permissionUser.department || (isLao ? "ທົ່ວໄປ" : "General")}
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  permissionUser.role === "admin" 
                    ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30" 
                    : "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                }`}>
                  {permissionUser.role === "admin" ? (isLao ? "ຜູ້ດູແລລະບົບ (Admin)" : "Administrator") : (isLao ? "ຜູ້ໃຊ້ທົ່ວໄປ (User)" : "User")}
                </span>
              </div>

              {/* Quick Preset Buttons Toolbar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {isLao ? "ຊຸດສິດທິສຳເລັດຮູບ (Quick Presets):" : "Permission Presets:"}
                  </span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                    {isLao 
                      ? `ເປີດໃຊ້: ${Object.values(permissionsDraft).filter(Boolean).length}/15 ຟັງຊັນ` 
                      : `Active: ${Object.values(permissionsDraft).filter(Boolean).length}/15 Features`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPermissionPreset("admin")}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-black border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
                  >
                    👑 {isLao ? "ໃຫ້ສິດທັງໝົດ (Full Admin)" : "Full Admin Access"}
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPermissionPreset("user")}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                  >
                    👤 {isLao ? "ສິດຜູ້ໃຊ້ທົ່ວໄປ (Standard User)" : "Standard User"}
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPermissionPreset("meeting")}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-black border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                  >
                    🏢 {isLao ? "ສະເພາະຫ້ອງປະຊຸມ" : "Meeting Only"}
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPermissionPreset("vehicle")}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-black border border-amber-200 dark:border-amber-800 transition-all cursor-pointer"
                  >
                    🚗 {isLao ? "ສະເພາະລົດບໍລິຫານ" : "Vehicle Only"}
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPermissionPreset("leadership")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                  >
                    💼 {isLao ? "ສະເພາະຕິດຕາມວຽກ" : "Duty Only"}
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPermissionPreset("view")}
                    className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 text-xs font-black border border-cyan-200 dark:border-cyan-800 transition-all cursor-pointer"
                  >
                    👁️ {isLao ? "ເບິ່ງຢ່າງດຽວ (View Only)" : "View Only"}
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPermissionPreset("none")}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 text-xs font-black border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
                  >
                    🚫 {isLao ? "ປິດໝົດທຸກລະບົບ" : "Revoke All"}
                  </button>
                </div>
              </div>

              {/* System Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActivePermTab("meeting")}
                  className={`py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activePermTab === "meeting"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{isLao ? "1. ຫ້ອງປະຊຸມ" : "1. Meeting"}</span>
                  <span className={`w-2 h-2 rounded-full ${permissionsDraft.meetingAccess ? "bg-emerald-400" : "bg-rose-400"}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setActivePermTab("vehicle")}
                  className={`py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activePermTab === "vehicle"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>{isLao ? "2. ລົດບໍລິຫານ" : "2. Vehicles"}</span>
                  <span className={`w-2 h-2 rounded-full ${permissionsDraft.vehicleAccess ? "bg-emerald-400" : "bg-rose-400"}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setActivePermTab("leadership")}
                  className={`py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activePermTab === "leadership"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{isLao ? "3. ຕິດຕາມວຽກ" : "3. Duty"}</span>
                  <span className={`w-2 h-2 rounded-full ${permissionsDraft.leadershipAccess ? "bg-emerald-400" : "bg-rose-400"}`} />
                </button>
              </div>

              {/* Tab 1: Meeting Room System Permissions */}
              {activePermTab === "meeting" && (
                <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-500/30">
                  {/* Master Access Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-900 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                          {isLao ? "ເປີດສິດການເຂົ້າເຖິງລະບົບຈອງຫ້ອງປະຊຸມ" : "Enable Meeting Room System Access"}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isLao ? "ອະນຸຍາດໃຫ້ຜູ້ໃຊ້ນີ້ສາມາດເບິ່ງເຫັນ ແລະ ເຂົ້າໃຊ້ລະບົບຈອງຫ້ອງປະຊຸມໄດ້" : "Permits user to see and open the meeting system"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPermissionsDraft(prev => ({ ...prev, meetingAccess: !prev.meetingAccess }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        permissionsDraft.meetingAccess ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        permissionsDraft.meetingAccess ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Sub-permissions */}
                  <div className={`space-y-2 pt-2 transition-opacity ${permissionsDraft.meetingAccess ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider block">
                        {isLao ? "ຟັງຊັນຍ່ອຍໃນລະບົບຫ້ອງປະຊຸມ:" : "Meeting Room Sub-features:"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectAllForTab("meeting", true)}
                          className="px-2 py-0.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-200 text-[10px] font-black transition-colors cursor-pointer"
                        >
                          {isLao ? "ເລືອກທັງໝົດ" : "Select All"}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSelectAllForTab("meeting", false)}
                          className="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black transition-colors cursor-pointer"
                        >
                          {isLao ? "ຍົກເລີກທັງໝົດ" : "Deselect All"}
                        </button>
                      </div>
                    </div>

                    {/* meetingBook */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-indigo-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.meetingBook}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, meetingBook: e.target.checked }))}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "1. ສ້າງຄຳຂໍຈອງຫ້ອງປະຊຸມ (Book Room)" : "Create Room Bookings"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດສຳລັບຜູ້ໃຊ້ທົ່ວໄປໃນການເລືອກຫ້ອງ ແລະ ສົ່ງຄຳຂໍຈອງ" : "Allows user to submit booking requests"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {isLao ? "ຜູ້ໃຊ້ທົ່ວໄປ" : "User Role"}
                      </span>
                    </label>

                    {/* meetingApprove */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-indigo-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.meetingApprove}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, meetingApprove: e.target.checked }))}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "2. ສູນອະນຸມັດ ແລະ ຄຸ້ມຄອງການຈອງ (Booking Approvals)" : "Approve & Manage Bookings"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດກວດສອບ, ອະນຸມັດ, ປະຕິເສດ ແລະ ແກ້ໄຂການຈອງຂອງທຸກຄົນ" : "Can review and approve/reject bookings"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                        {isLao ? "ສິດຜູ້ບໍລິຫານ" : "Admin Level"}
                      </span>
                    </label>

                    {/* meetingManageRooms */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-indigo-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.meetingManageRooms}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, meetingManageRooms: e.target.checked }))}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "3. ຈັດການຂໍ້ມູນຫ້ອງປະຊຸມ (Manage Rooms)" : "Manage Room Inventory"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດເພີ່ມຫ້ອງໃໝ່, ແກ້ໄຂອຸປະກອນ, ຄວາມຈຸ ແລະ ລົບຫ້ອງ" : "Can create, edit, or delete meeting rooms"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                        {isLao ? "ສິດຜູ້ບໍລິຫານ" : "Admin Level"}
                      </span>
                    </label>

                    {/* meetingReports */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-indigo-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.meetingReports}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, meetingReports: e.target.checked }))}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "4. ເບິ່ງ ແລະ ສົ່ງອອກບົດລາຍງານຫ້ອງປະຊຸມ (Meeting Reports)" : "View & Export Reports"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດເບິ່ງສະຖິຕິການນຳໃຊ້ຫ້ອງ, ດາວໂຫຼດ Excel ແລະ ພິມລາຍງານ" : "Can view statistics and export report data"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                        {isLao ? "ສິດຜູ້ບໍລິຫານ" : "Admin Level"}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 2: Vehicle System Permissions */}
              {activePermTab === "vehicle" && (
                <div className="space-y-4 p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-500/30">
                  {/* Master Access Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                          {isLao ? "ເປີດສິດການເຂົ້າເຖິງລະບົບລົດບໍລິຫານ" : "Enable Vehicle System Access"}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isLao ? "ອະນຸຍາດໃຫ້ຜູ້ໃຊ້ນີ້ສາມາດເບິ່ງເຫັນ ແລະ ເຂົ້າໃຊ້ລະບົບລົດບໍລິຫານໄດ້" : "Permits user to see and open the vehicle system"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPermissionsDraft(prev => ({ ...prev, vehicleAccess: !prev.vehicleAccess }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        permissionsDraft.vehicleAccess ? "bg-amber-600" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        permissionsDraft.vehicleAccess ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Sub-permissions */}
                  <div className={`space-y-2 pt-2 transition-opacity ${permissionsDraft.vehicleAccess ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-black uppercase text-amber-700 dark:text-amber-300 tracking-wider block">
                        {isLao ? "ຟັງຊັນຍ່ອຍໃນລະບົບລົດບໍລິຫານ:" : "Vehicle System Sub-features:"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectAllForTab("vehicle", true)}
                          className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-200 text-[10px] font-black transition-colors cursor-pointer"
                        >
                          {isLao ? "ເລືອກທັງໝົດ" : "Select All"}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSelectAllForTab("vehicle", false)}
                          className="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black transition-colors cursor-pointer"
                        >
                          {isLao ? "ຍົກເລີກທັງໝົດ" : "Deselect All"}
                        </button>
                      </div>
                    </div>

                    {/* vehicleBook */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-amber-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.vehicleBook}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, vehicleBook: e.target.checked }))}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "1. ສ້າງຄຳຂໍຈອງລົດລັດຖະການ (Book Vehicle)" : "Book Official Vehicle"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດສຳລັບຜູ້ໃຊ້ທົ່ວໄປໃນການສົ່ງຄຳຂໍນຳໃຊ້ລົດລັດຖະການ" : "Allows user to submit vehicle trip requests"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {isLao ? "ຜູ້ໃຊ້ທົ່ວໄປ" : "User Role"}
                      </span>
                    </label>

                    {/* vehicleApprove */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-amber-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.vehicleApprove}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, vehicleApprove: e.target.checked }))}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "2. ສູນອະນຸມັດລົດ & ແຕ່ງຕັ້ງຄົນຂັບ (Trip Approvals)" : "Approve Trips & Dispatch Drivers"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດອະນຸມັດການເດີນທາງ, ແຕ່ງຕັ້ງຄົນຂັບລົດ ແລະ ອອກໃບອະນຸມັດ" : "Can approve vehicle dispatches and assign drivers"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                        {isLao ? "ສິດຜູ້ບໍລິຫານ" : "Admin Level"}
                      </span>
                    </label>

                    {/* vehicleManageFleet */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-amber-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.vehicleManageFleet}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, vehicleManageFleet: e.target.checked }))}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "3. ຈັດການຂໍ້ມູນລົດບໍລິຫານ (Manage Fleet)" : "Manage Vehicle Fleet"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດເພີ່ມລົດໃໝ່, ແກ້ໄຂປ້າຍທະບຽນ, ປ່ຽນສະຖານະລົດ ແລະ ລົບລົດ" : "Can add, edit, or delete vehicles in the fleet"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                        {isLao ? "ສິດຜູ້ບໍລິຫານ" : "Admin Level"}
                      </span>
                    </label>

                    {/* vehicleReports */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-amber-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.vehicleReports}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, vehicleReports: e.target.checked }))}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "4. ເບິ່ງ ແລະ ສົ່ງອອກບົດລາຍງານລົດ (Vehicle Reports)" : "View & Export Vehicle Reports"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດເບິ່ງສະຖິຕິການນຳໃຊ້ລົດ, ໄລຍະທາງ, ປະເພດລົດ ແລະ ພິມລາຍງານ" : "Can view usage statistics and export trip reports"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                        {isLao ? "ສິດຜູ້ບໍລິຫານ" : "Admin Level"}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 3: Leadership Duty Tracking System Permissions */}
              {activePermTab === "leadership" && (
                <div className="space-y-4 p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-500/30">
                  {/* Master Access Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                          {isLao ? "ເປີດສິດການເຂົ້າເຖິງລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກ" : "Enable Duty Tracking Access"}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isLao ? "ອະນຸຍາດໃຫ້ຜູ້ໃຊ້ນີ້ສາມາດເບິ່ງເຫັນ ແລະ ເຂົ້າໃຊ້ລະບົບຕິດຕາມວຽກໄດ້" : "Permits user to see and open the duty tracking system"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPermissionsDraft(prev => ({ ...prev, leadershipAccess: !prev.leadershipAccess }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        permissionsDraft.leadershipAccess ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        permissionsDraft.leadershipAccess ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Sub-permissions */}
                  <div className={`space-y-2 pt-2 transition-opacity ${permissionsDraft.leadershipAccess ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider block">
                        {isLao ? "ຟັງຊັນຍ່ອຍໃນລະບົບຕິດຕາມວຽກ:" : "Duty Tracking Sub-features:"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectAllForTab("leadership", true)}
                          className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-200 text-[10px] font-black transition-colors cursor-pointer"
                        >
                          {isLao ? "ເລືອກທັງໝົດ" : "Select All"}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSelectAllForTab("leadership", false)}
                          className="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black transition-colors cursor-pointer"
                        >
                          {isLao ? "ຍົກເລີກທັງໝົດ" : "Deselect All"}
                        </button>
                      </div>
                    </div>

                    {/* leadershipCalendar */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-emerald-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.leadershipCalendar}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, leadershipCalendar: e.target.checked }))}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "1. ເບິ່ງປະຕິທິນການເຄື່ອນໄຫວວຽກ (View Duty Calendar)" : "View Duty Calendar"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດເບິ່ງປະຕິທິນວຽກຂອງຄະນະ, ຫົວໜ້າພະແນກ ແລະ ຂະແໜງ" : "Allows viewing the executive mission calendar"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {isLao ? "ຜູ້ໃຊ້ທົ່ວໄປ" : "User Role"}
                      </span>
                    </label>

                    {/* leadershipLogOwn */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-emerald-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.leadershipLogOwn}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, leadershipLogOwn: e.target.checked }))}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "2. ບັນທຶກ ແລະ ຄຸ້ມຄອງວຽກຕົນເອງ (My Duty Logging)" : "Log Own Work Duties"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດເພີ່ມ, ແກ້ໄຂ, ປັບປຸງສະຖານະ ແລະ ບັນທຶກຜົນງານຂອງຕົນເອງ" : "Allows logging and updating own duties and outcomes"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {isLao ? "ຜູ້ໃຊ້ທົ່ວໄປ" : "User Role"}
                      </span>
                    </label>

                    {/* leadershipManageAll */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-emerald-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.leadershipManageAll}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, leadershipManageAll: e.target.checked }))}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "3. ຄຸ້ມຄອງ ແລະ ກວດກາວຽກທຸກຄົນ (Manage All Duties)" : "Manage All Division Duties"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດຜູ້ບໍລິຫານ/ຄະນະ: ສາມາດແກ້ໄຂ, ລົບ ແລະ ກວດກາວຽກຂອງພະນັກງານທຸກຄົນ" : "Executive permission to edit or delete any duty"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                        {isLao ? "ສິດຜູ້ບໍລິຫານ" : "Admin Level"}
                      </span>
                    </label>

                    {/* leadershipReports */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 hover:border-emerald-400 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={permissionsDraft.leadershipReports}
                          onChange={(e) => setPermissionsDraft(prev => ({ ...prev, leadershipReports: e.target.checked }))}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                            {isLao ? "4. ສ້າງ ແລະ ສົ່ງອອກລາຍງານ ອາທິດ/ເດືອນ/ປີ (Duty Reports)" : "Generate Duty Reports"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isLao ? "ສິດສັງລວມບົດລາຍງານ, ກັ່ນຕອງຕາມຂະແໜງ, ດາວໂຫຼດ ແລະ ພິມເອກະສານ" : "Can generate and print weekly/monthly/annual reports"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {isLao ? "ທົ່ວໄປ" : "General"}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setPermissionUser(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={permissionLoading}
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  {permissionLoading ? (
                    <span>{t.loading}</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                      <span>{isLao ? "ບັນທຶກສິດທິຜູ້ໃຊ້" : "Save Permissions"}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

