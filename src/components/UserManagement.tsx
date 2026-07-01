import { useState, useEffect } from "react";
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
  Briefcase
} from "lucide-react";
import { db, collection, getDocs, onSnapshot, doc, updateDoc } from "../lib/firebase";
import { AppLanguage, UserProfile, UserRole, UserStatus } from "../types";
import { translations } from "../lib/translations";
import { updateUserProfile } from "../lib/firebaseHelper";
import { showSystemToast } from "../utils/toast";
import { motion, AnimatePresence } from "motion/react";

interface UserManagementProps {
  language: AppLanguage;
}

export default function UserManagement({ language }: UserManagementProps) {
  const t = translations[language];

  // Component States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<string | null>(null);

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
    showSystemToast(msg, type, language === "lo" ? "ຈັດການຜູ້ໃຊ້ງານ" : "User Management");
  };

  const handleChangeRole = async (uid: string, currentRole: UserRole) => {
    const nextRole: UserRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateUserProfile(uid, { role: nextRole });
      triggerToast(language === "lo" ? "ປ່ຽນແປງສິດການເຂົ້າເຖິງສຳເລັດ" : "Role updated successfully", "success");
    } catch (err: any) {
      console.error("Role update error:", err);
      triggerToast(err.message || "Failed to update role", "error");
    }
  };

  const handleChangeStatus = async (uid: string, nextStatus: UserStatus) => {
    try {
      await updateUserProfile(uid, { status: nextStatus });
      const successMsg = nextStatus === "active" 
        ? (language === "lo" ? "ອະນຸມັດຜູ້ໃຊ້ງານສຳເລັດແລ້ວ" : "User approved successfully")
        : (language === "lo" ? "ປະຕິເສດ/ລະງັບການໃຊ້ງານແລ້ວ" : "User suspended/rejected");
      triggerToast(successMsg, nextStatus === "active" ? "success" : "warning");
    } catch (err: any) {
      console.error("Status update error:", err);
      triggerToast(err.message || "Failed to update status", "error");
    }
  };

  // Search filter
  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.department && user.department.toLowerCase().includes(search))
    );
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {t.usrManageUsers}
          </h3>
        </div>

        {/* Live search input */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl themed-input text-xs"
          />
        </div>
      </div>

      {/* User listing table */}
      <div className="overflow-x-auto bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs p-5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3 border-b border-slate-100 dark:border-white/5">
              <th className="py-3 px-4">{t.usrDisplayName}</th>
              <th className="py-3 px-4">{t.department}</th>
              <th className="py-3 px-4">{t.role}</th>
              <th className="py-3 px-4">{t.status}</th>
              <th className="py-3 px-4 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center opacity-60 font-semibold">
                  {t.noData}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.uid} id={`user-row-${user.uid}`} className="hover:bg-slate-500/5 transition-colors">
                  {/* User Profile */}
                  <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold opacity-90">{user.displayName}</span>
                        <span className="text-[10px] opacity-60 font-medium flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-4 px-4 font-semibold opacity-85">
                    <div className="flex flex-col">
                      <span>{user.department || "—"}</span>
                      {user.phone && (
                        <span className="text-[10px] opacity-60 font-medium flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Role with shield toggle buttons */}
                  <td className="py-4 px-4">
                    <button
                      id={`btn-toggle-role-${user.uid}`}
                      onClick={() => handleChangeRole(user.uid, user.role)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] flex items-center gap-1.5 border transition-all hover:scale-102 cursor-pointer ${
                        user.role === "admin"
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-white/5"
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{user.role === "admin" ? t.admin : t.user}</span>
                    </button>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      user.status === "active" 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : user.status === "pending"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {user.status === "active" ? t.usrStatusActive : 
                       user.status === "pending" ? t.usrStatusPending : t.usrStatusInactive}
                    </span>
                  </td>

                  {/* Administrative Action togglers */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      {user.status === "pending" && (
                        <button
                          id={`btn-approve-user-${user.uid}`}
                          onClick={() => handleChangeStatus(user.uid, "active")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                          title={t.usrStatusActive}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>ອະນຸມັດ</span>
                        </button>
                      )}
                      {user.status === "active" && (
                        <button
                          id={`btn-suspend-user-${user.uid}`}
                          onClick={() => handleChangeStatus(user.uid, "inactive")}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/15 text-red-500 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title={t.usrStatusInactive}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>ລະງັບການ</span>
                        </button>
                      )}
                      {user.status === "inactive" && (
                        <button
                          id={`btn-activate-user-${user.uid}`}
                          onClick={() => handleChangeStatus(user.uid, "active")}
                          className="px-3 py-1.5 bg-slate-500/10 hover:bg-slate-500/15 text-slate-800 dark:text-slate-100 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title={t.usrStatusActive}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>ເປີດໃຊ້</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
