import React, { useState, useMemo, FormEvent } from "react";
import { 
  CalendarClock, 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  FileText, 
  Paperclip, 
  ShieldCheck, 
  Check, 
  X, 
  Printer, 
  Search, 
  Filter, 
  Sparkles, 
  UserCheck, 
  Award,
  Calendar,
  AlertCircle
} from "lucide-react";
import { 
  LeaveRequest, 
  LeaveType, 
  LeaveStatus, 
  CivilServant, 
  AppLanguage, 
  UserProfile,
  hasPermission
} from "../types";
import { 
  ANNUAL_LEAVE_QUOTA, 
  calculateStaffLeaveBalance, 
  addLeaveRequest, 
  updateLeaveStatus, 
  deleteLeaveRequest 
} from "../lib/leaveHelper";
import { showSystemToast } from "../utils/toast";
import { motion, AnimatePresence } from "motion/react";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";

interface LeaveRequestFormProps {
  leaves: LeaveRequest[];
  employees: CivilServant[];
  language: AppLanguage;
  userProfile?: UserProfile | null;
  initialSubTab?: "apply" | "my-leaves" | "approvals";
  onRefreshData?: () => void;
}

export default function LeaveRequestForm({
  leaves,
  employees,
  language,
  userProfile,
  initialSubTab = "apply",
  onRefreshData
}: LeaveRequestFormProps) {
  const isLao = language === "lo";
  const currentYear = new Date().getFullYear();

  // Active view tab: "apply" (ຍື່ນຄຳຮ້ອງ) | "my-leaves" (ຄຳຮ້ອງຂອງຂ້ອຍ) | "approvals" (ສູນອະນຸມັດ)
  const [activeSubTab, setActiveSubTab] = useState<"apply" | "my-leaves" | "approvals">(initialSubTab);

  // Sync when initialSubTab prop changes
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Determine if current user can approve (Admin OR Head of Admin/Finance or has permission)
  const canApprove = userProfile?.role === "admin" || 
    hasPermission(userProfile, "leaveApprove") ||
    userProfile?.department?.includes("ບໍລິຫານ") || 
    userProfile?.department?.includes("ການເງິນ") || 
    userProfile?.displayName?.includes("ມະນີວອນ") ||
    userProfile?.email?.toLowerCase().includes("tounkmv99");

  // Auto-detect current user's civil servant record
  const defaultEmployee = useMemo(() => {
    if (!employees || employees.length === 0) return null;
    return employees.find(e => 
      (userProfile?.email && e.email && e.email.toLowerCase() === userProfile.email.toLowerCase()) ||
      (userProfile?.displayName && e.fullName.includes(userProfile.displayName.replace(/^ທ່ານ\s*/, "")))
    ) || employees[0];
  }, [employees, userProfile]);

  // Form States
  const [selectedStaffId, setSelectedStaffId] = useState<string>(defaultEmployee?.id || "");
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [handoverPerson, setHandoverPerson] = useState("");
  const [handoverPhone, setHandoverPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Notification Modal
  const [submittedModalData, setSubmittedModalData] = useState<LeaveRequest | null>(null);

  // Approval/Rejection Action Modal
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Delete Confirmation Modal
  const [deletingLeave, setDeletingLeave] = useState<LeaveRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected Employee object
  const activeEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedStaffId) || defaultEmployee || null;
  }, [employees, selectedStaffId, defaultEmployee]);

  // Calculate quota balance for active employee
  const staffBalance = useMemo(() => {
    if (!activeEmployee) {
      return {
        staffId: "",
        year: currentYear,
        quotaTotal: ANNUAL_LEAVE_QUOTA,
        approvedDays: 0,
        pendingDays: 0,
        remainingDays: ANNUAL_LEAVE_QUOTA
      };
    }
    return calculateStaffLeaveBalance(activeEmployee.id, leaves, currentYear);
  }, [activeEmployee, leaves, currentYear]);

  // Calculate working days between start date and end date
  const calculatedWorkingDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      // Skip Saturday (6) and Sunday (0) for working days
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(1, count);
  }, [startDate, endDate]);

  // Check if requested annual leave exceeds remaining quota
  const isQuotaExceeded = leaveType === "annual" && (calculatedWorkingDays > staffBalance.remainingDays);

  // Handle Form Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!activeEmployee) {
      showSystemToast(isLao ? "ກະລຸນາເລືອກພະນັກງານຜູ້ຂໍລາພັກ" : "Please select an employee", "error");
      return;
    }

    if (!title.trim()) {
      showSystemToast(isLao ? "ກະລຸນາປ້ອນຫົວຂໍ້ທີ່ຂໍສະເໜີລາພັກ" : "Please enter leave title", "warning");
      return;
    }

    if (!startDate || !endDate) {
      showSystemToast(isLao ? "ກະລຸນາກຳນົດວັນທີເລີ່ມຕົ້ນ ແລະ ສິ້ນສຸດ" : "Please select dates", "warning");
      return;
    }

    if (calculatedWorkingDays <= 0) {
      showSystemToast(isLao ? "ວັນທີສິ້ນສຸດຕ້ອງຢູ່ຫຼັງວັນທີເລີ່ມຕົ້ນ" : "End date must be after start date", "error");
      return;
    }

    if (leaveType === "annual" && staffBalance.remainingDays <= 0) {
      showSystemToast(
        isLao 
          ? `ພະນັກງານຄົນນີ້ໄດ້ໃຊ້ໂຄຕ້າລາພັກປະຈຳປີ 15 ວັນຄົບແລ້ວ (${currentYear})` 
          : "Annual quota exhausted for this employee", 
        "error"
      );
      return;
    }

    if (leaveType === "annual" && calculatedWorkingDays > staffBalance.remainingDays) {
      showSystemToast(
        isLao 
          ? `ຈຳນວນວັນທີ່ຂໍ (${calculatedWorkingDays} ວັນ) ເກີນໂຄຕ້າທີ່ຍັງເຫຼືອ (${staffBalance.remainingDays} ວັນ)` 
          : "Requested days exceed remaining annual quota", 
        "error"
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const newLeave: LeaveRequest = {
        id: `leave_${Date.now()}`,
        staffId: activeEmployee.id,
        staffCode: activeEmployee.staffCode,
        staffName: activeEmployee.fullName,
        staffDepartment: activeEmployee.department,
        staffPosition: activeEmployee.position,
        staffPhone: activeEmployee.phone || emergencyPhone || "",
        userId: userProfile?.uid || "",
        leaveType,
        title: title.trim(),
        reason: reason.trim(),
        startDate,
        endDate,
        workingDaysCount: calculatedWorkingDays,
        year: currentYear,
        quotaTotal: ANNUAL_LEAVE_QUOTA,
        quotaUsedBefore: staffBalance.approvedDays,
        quotaRemainingBefore: staffBalance.remainingDays,
        handoverPerson: handoverPerson.trim(),
        handoverPhone: handoverPhone.trim(),
        emergencyPhone: emergencyPhone.trim() || activeEmployee.phone || "",
        destination: destination.trim(),
        attachmentName: attachmentName.trim(),
        status: "pending",
        createdAt: new Date().toISOString()
      };

      await addLeaveRequest(newLeave);

      showSystemToast(
        isLao ? "ຍື່ນແບບຟອມຂໍລາພັກສຳເລັດ! ສົ່ງແຈ້ງເຕືອນຫາຫົວໜ້າຫ້ອງແລ້ວ" : "Leave request submitted successfully!",
        "success"
      );

      // Open Success Notification Modal
      setSubmittedModalData(newLeave);

      // Reset form
      setTitle("");
      setReason("");
      setStartDate("");
      setEndDate("");
      setHandoverPerson("");
      setHandoverPhone("");
      setEmergencyPhone("");
      setDestination("");
      setAttachmentName("");

      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error("Error submitting leave request:", err);
      showSystemToast(isLao ? "ເກີດຂໍ້ຜິດພາດໃນການຍື່ນແບບຟອມ" : "Failed to submit leave request", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Review (Approve / Reject)
  const handleApproveAction = async (status: LeaveStatus) => {
    if (!reviewingLeave) return;

    try {
      setIsActionLoading(true);

      const approverInfo = {
        uid: userProfile?.uid || "admin",
        name: userProfile?.displayName || "ທ່ານ ຄຳຕຸ່ນ ຄໍາມະວົງ",
        role: userProfile?.role === "admin" 
          ? "ຜູ້ດູແລລະບົບ (Admin) / ຫົວໜ້າຫ້ອງວ່າການ" 
          : "ຫົວໜ້າຫ້ອງ ບໍລິຫານ, ພິທີການ ແລະ ການເງິນ",
        email: userProfile?.email || "tounkmv99@gmail.com"
      };

      await updateLeaveStatus(
        reviewingLeave.id, 
        status, 
        approverInfo, 
        approvalRemarks.trim() || (status === "approved" ? "ອະນຸມັດຕາມການສະເໜີ" : "ປະຕິເສດການລາພັກ")
      );

      showSystemToast(
        status === "approved" 
          ? (isLao ? "ອະນຸມັດການລາພັກຮຽບຮ້ອຍແລ້ວ!" : "Leave approved successfully!")
          : (isLao ? "ປະຕິເສດການລາພັກແລ້ວ" : "Leave rejected"),
        status === "approved" ? "success" : "info"
      );

      setReviewingLeave(null);
      setApprovalRemarks("");
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error("Error updating leave:", err);
      showSystemToast(isLao ? "ເກີດຂໍ້ຜິດພາດໃນການອະນຸມັດ" : "Error processing approval", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingLeave) return;
    try {
      setIsDeleting(true);
      await deleteLeaveRequest(deletingLeave.id);
      showSystemToast(isLao ? "ລົບຄຳຮ້ອງຂໍລາພັກສຳເລັດແລ້ວ" : "Leave request deleted", "success");
      setDeletingLeave(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error("Error deleting leave:", err);
      showSystemToast(isLao ? "ເກີດຂໍ້ຜິດພາດໃນການລົບ" : "Failed to delete", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered lists
  const myLeavesList = useMemo(() => {
    return leaves.filter(l => 
      (activeEmployee && l.staffId === activeEmployee.id) ||
      (userProfile?.uid && l.userId === userProfile.uid)
    );
  }, [leaves, activeEmployee, userProfile]);

  const pendingApprovalsList = useMemo(() => {
    return leaves.filter(l => l.status === "pending");
  }, [leaves]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. TOP NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveSubTab("apply")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "apply"
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLao ? "ແບບຟອມຍື່ນຂໍລາພັກ" : "Leave Application"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("my-leaves")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "my-leaves"
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isLao ? "ຄຳຮ້ອງຂອງຂ້າພະເຈົ້າ" : "My Requests"}</span>
            {myLeavesList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                {myLeavesList.length}
              </span>
            )}
          </button>

          {canApprove && (
            <button
              type="button"
              onClick={() => setActiveSubTab("approvals")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === "approvals"
                  ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 border border-amber-300/40"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>{isLao ? "ສູນອະນຸມັດຄຳຮ້ອງ" : "Approvals Center"}</span>
              {pendingApprovalsList.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-black shadow-sm flex items-center justify-center min-w-[20px] h-5 leading-none ${
                  activeSubTab === "approvals"
                    ? "bg-white text-orange-600 animate-pulse"
                    : "bg-amber-500 text-white animate-bounce"
                }`}>
                  {pendingApprovalsList.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Quota Badge Indicator */}
        <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>
            {isLao ? "ໂຄຕ້າປີນີ້:" : "Annual Quota:"}{" "}
            <b className="font-black text-emerald-600 dark:text-emerald-400">15</b> {isLao ? "ວັນລັດຖະການ" : "days"}
          </span>
        </div>
      </div>

      {/* 2. SUBTAB: APPLY FORM */}
      {activeSubTab === "apply" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLUMNS: MAIN FORM */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isLao ? "ແບບຟອມສະເໜີຂໍລາພັກທາງລັດຖະການ" : "Civil Servant Leave Application Form"}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isLao 
                    ? "ກະລຸນາກວດສອບໂຄຕ້າທີ່ຍັງເຫຼືອ ແລະ ປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ ເພື່ອສົ່ງແຈ້ງເຕືອນຫາຫົວໜ້າຫ້ອງອະນຸມັດ." 
                    : "Please review remaining quota and fill all mandatory fields to notify approvers."}
                </p>
              </div>

              {/* Step 1: Employee Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isLao ? "1. ເລືອກພະນັກງານລັດຖະກອນຜູ້ຂໍລາພັກ *" : "1. Applicant Civil Servant *"}</span>
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.staffCode} - {emp.fullName} ({emp.position} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Leave Type & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {isLao ? "2. ປະເພດການລາພັກ *" : "2. Leave Type *"}
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                    required
                  >
                    <option value="annual">{isLao ? "🌴 ລາພັກປະຈຳປີ (ໂຄຕ້າ 15 ວັນລັດຖະການ)" : "Annual Leave (15 days quota)"}</option>
                    <option value="sick">{isLao ? "🏥 ລາພັກປ່ວຍ (ມີໃບຢັ້ງຢືນແພດ)" : "Sick Leave"}</option>
                    <option value="emergency">{isLao ? "⚠️ ລາກິດສຸກເສີນ / ວຽກຄອບຄົວ" : "Emergency / Family Leave"}</option>
                    <option value="maternity">{isLao ? "👶 ລາເກີດລູກ / ຄອດລູກ" : "Maternity Leave"}</option>
                    <option value="study">{isLao ? "🎓 ລາໄປຮຽນຕໍ່ / ຍົກລະດັບ / ຝຶກອົບຮົມ" : "Study / Training Leave"}</option>
                    <option value="other">{isLao ? "📄 ລາພັກອື່ນໆ" : "Other Leave"}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {isLao ? "3. ຫົວຂໍ້ທີ່ຂໍສະເໜີລາພັກ *" : "3. Leave Title *"}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isLao ? "ເຊັ່ນ: ຂໍລາພັກປະຈຳປີ ເພື່ອຢ້ຽມຢາມພໍ່ແມ່ຢູ່ບ້ານເກີດ" : "e.g. Annual leave to visit family"}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Step 3: Date Range & Auto Calculation */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isLao ? "4. ກຳນົດວັນທີເລີ່ມຕົ້ນ ຫາ ວັນສິ້ນສຸດການລາພັກ *" : "4. Leave Duration & Working Days *"}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                    {calculatedWorkingDays} {isLao ? "ວັນລັດຖະການ" : "working days"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {isLao ? "ວັນທີເລີ່ມຕົ້ນລາພັກ *" : "Start Date *"}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {isLao ? "ວັນທີສິ້ນສຸດການລາພັກ *" : "End Date *"}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {isQuotaExceeded && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {isLao 
                        ? `ແຈ້ງເຕືອນ: ຈຳນວນວັນທີ່ຂໍ (${calculatedWorkingDays} ວັນ) ເກີນໂຄຕ້າທີ່ຍັງເຫຼືອ (${staffBalance.remainingDays} ວັນ). ກະລຸນາປັບຫຼຸດວັນທີ.` 
                        : "Warning: Requested days exceed remaining quota balance."}
                    </span>
                  </div>
                )}
              </div>

              {/* Step 4: Reason & Handover Person */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {isLao ? "5. ເຫດຜົນ ແລະ ຄວາມຈຳເປັນ *" : "5. Reason & Necessity *"}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={isLao ? "ອະທິບາຍເຫດຜົນຄວາມຈຳເປັນໃນການຂໍລາພັກຄັ້ງນີ້..." : "Details on reason for absence..."}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {isLao ? "6. ຜູ້ມອບໝາຍວຽກແທນຊົ່ວຄາວ" : "6. Handover Colleague"}
                  </label>
                  <input
                    type="text"
                    value={handoverPerson}
                    onChange={(e) => setHandoverPerson(e.target.value)}
                    placeholder={isLao ? "ເຊັ່ນ: ທ່ານ ນາງ ດາວອນ ໄຊຍະວົງ" : "Colleague name"}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {isLao ? "7. ເບີໂທຜູ້ຮັບມອບໝາຍວຽກ" : "7. Handover Contact Phone"}
                  </label>
                  <input
                    type="text"
                    value={handoverPhone}
                    onChange={(e) => setHandoverPhone(e.target.value)}
                    placeholder="020 xxxx xxxx"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Step 5: Destination & Emergency Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {isLao ? "8. ສະຖານທີ່ພັກເຊົາລະຫວ່າງລາພັກ" : "8. Location during leave"}
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={isLao ? "ເຊັ່ນ: ບ້ານ ນາເລົ່າ, ເມືອງຊຳເໜືອ" : "Address/Town"}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {isLao ? "9. ເບີໂທຕິດຕໍ່ສຸກເສີນ" : "9. Emergency Phone"}
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="020 xxxx xxxx"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Notification Dispatch Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-amber-900 dark:text-amber-300">
                    {isLao ? "ລະບົບສົ່ງແຈ້ງເຕືອນອັດໂນມັດຫາຜູ້ອະນຸມັດ:" : "Automated Approval Dispatch:"}
                  </p>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    {isLao 
                      ? "ຫຼັງຈາກກົດຍື່ນຄຳຮ້ອງ, ລະບົບຈະສົ່ງແຈ້ງເຕືອນໄປຫາ ທ່ານ ຄຳຕຸ່ນ ຄໍາມະວົງ (ແອັດມີນ) ແລະ ທ່ານ ນາງ ມະນີວອນ ແສງສຸລິຍາ (ຫົວໜ້າຫ້ອງ ບໍລິຫານ, ພິທີການ ແລະ ການເງິນ) ເພື່ອກວດສອບ ແລະ ລົງລາຍເຊັນອະນຸມັດ."
                      : "Submission triggers an immediate alert to Admin (Mr. Khamtoun) and Chief of Administration & Finance (Ms. Manivone) for authorized approval."}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-submit-leave-request"
                disabled={isSubmitting || isQuotaExceeded}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isQuotaExceeded
                    ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-98"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isLao ? "ກຳລັງບັນທຶກ ແລະ ສົ່ງແຈ້ງເຕືອນ..." : "Submitting..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isLao ? "ຍື່ນຄຳຮ້ອງຂໍລາພັກ ແລະ ສົ່ງຫາຫົວໜ້າຫ້ອງອະນຸມັດ" : "Submit Leave Request for Approval"}</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* RIGHT 1 COLUMN: REAL-TIME QUOTA CARD */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                  {isLao ? "ກວດສອບສະຖານະໂຄຕ້າ" : "Quota Verification"}
                </span>
                <h4 className="text-base font-black text-slate-800 dark:text-white mt-1">
                  {activeEmployee?.fullName || "ກະລຸນາເລືອກພະນັກງານ"}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activeEmployee?.position} • {activeEmployee?.department}
                </p>
              </div>

              {/* Photo 4*6 Preview */}
              {activeEmployee?.officialPhotoUrl && (
                <div className="flex justify-center">
                  <div className="relative w-28 h-36 rounded-2xl overflow-hidden border-2 border-emerald-400/50 shadow-md">
                    <img
                      src={activeEmployee.officialPhotoUrl}
                      alt={activeEmployee.fullName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xs py-0.5 text-center text-[9px] font-black text-white">
                      4x6 Official
                    </div>
                  </div>
                </div>
              )}

              {/* Big Quota Numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                    {isLao ? "ໂຄຕ້າທັງໝົດ" : "Annual Quota"}
                  </span>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                    15
                  </div>
                  <span className="text-[10px] text-emerald-600/80 font-bold">{isLao ? "ວັນລັດຖະການ" : "days"}</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                  <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">
                    {isLao ? "ໃຊ້ໄປແລ້ວ" : "Days Used"}
                  </span>
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                    {staffBalance.approvedDays}
                  </div>
                  <span className="text-[10px] text-amber-600/80 font-bold">{isLao ? "ວັນລັດຖະການ" : "days"}</span>
                </div>
              </div>

              {/* Remaining Card */}
              <div className={`p-4 rounded-2xl border text-center transition-all ${
                staffBalance.remainingDays > 0 
                  ? "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800" 
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
              }`}>
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                  {isLao ? "ວັນທີ່ຍັງເຫຼືອພ້ອມອະນຸມັດ" : "Remaining Balance Available"}
                </span>
                <div className={`text-3xl font-black mt-1 ${
                  staffBalance.remainingDays > 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400"
                }`}>
                  {staffBalance.remainingDays}
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  {isLao ? "ວັນທາງລັດຖະການຕໍ່ 1 ປີ" : "days left this year"}
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>{isLao ? "ອັດຕາການນຳໃຊ້:" : "Utilization:"}</span>
                  <span className="font-black text-slate-800 dark:text-white">
                    {Math.round((staffBalance.approvedDays / ANNUAL_LEAVE_QUOTA) * 100)}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (staffBalance.approvedDays / ANNUAL_LEAVE_QUOTA) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Approver Authority Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5 space-y-1.5">
                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isLao ? "ບັນຊີຜູ້ມີສິດອະນຸມັດ:" : "Authorized Approvers:"}</span>
                </p>
                <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li><b>ທ່ານ ຄຳຕຸ່ນ ຄໍາມະວົງ</b> (ຫົວໜ້າຫ້ອງວ່າການ / Admin)</li>
                  <li><b>ທ່ານ ນາງ ມະນີວອນ ແສງສຸລິຍາ</b> (ຫົວໜ້າຫ້ອງ ບໍລິຫານ, ພິທີການ ແລະ ການເງິນ)</li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* 3. SUBTAB: MY REQUESTS */}
      {activeSubTab === "my-leaves" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>{isLao ? "ປະຫວັດການຂໍລາພັກຂອງຂ້າພະເຈົ້າ" : "My Leave History"}</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {isLao ? `ທັງໝົດ ${myLeavesList.length} ລາຍການ` : `${myLeavesList.length} items`}
            </span>
          </div>

          {myLeavesList.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                <CalendarClock className="w-8 h-8" />
              </div>
              <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                {isLao ? "ຍັງບໍ່ມີປະຫວັດການຂໍລາພັກ" : "No leave requests found"}
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab("apply")}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-500 transition-all"
              >
                {isLao ? "ຍື່ນແບບຟອມຂໍລາພັກດຽວນີ້" : "Apply Now"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myLeavesList.map(req => (
                <div
                  key={req.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        req.status === "approved"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                          : req.status === "rejected"
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300"
                      }`}>
                        {req.status === "approved" ? (isLao ? "ອະນຸມັດແລ້ວ" : "Approved") :
                         req.status === "rejected" ? (isLao ? "ປະຕິເສດ" : "Rejected") :
                         (isLao ? "ລໍຖ້າອະນຸມັດ" : "Pending")}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5">
                        {req.title}
                      </h4>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                      {req.workingDaysCount} {isLao ? "ວັນ" : "days"}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                    <p className="text-slate-600 dark:text-slate-400">
                      🗓️ <b>{isLao ? "ໄລຍະເວລາ:" : "Period:"}</b> {req.startDate} ຫາ {req.endDate}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      📝 <b>{isLao ? "ເຫດຜົນ:" : "Reason:"}</b> {req.reason}
                    </p>
                    {req.handoverPerson && (
                      <p className="text-slate-600 dark:text-slate-400">
                        🤝 <b>{isLao ? "ຜູ້ຮັບວຽກແທນ:" : "Handover:"}</b> {req.handoverPerson}
                      </p>
                    )}
                  </div>

                  {/* Approver Audit Stamp */}
                  {req.status === "approved" && req.approvedByName && (
                    <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{isLao ? "ບັນຊີຜູ້ອະນຸມັດ:" : "Approved By:"}</span>
                        <span className="font-extrabold">{req.approvedByName}</span>
                      </div>
                      <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                        {req.approvedByRole} • {req.approvedAt ? new Date(req.approvedAt).toLocaleDateString() : ""}
                      </p>
                      {req.approvalRemarks && (
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 italic">
                          "{req.approvalRemarks}"
                        </p>
                      )}
                    </div>
                  )}

                  {req.status === "rejected" && req.rejectionReason && (
                    <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 text-xs text-rose-700 space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>{isLao ? "ເຫດຜົນການປະຕິເສດ:" : "Rejection Reason:"}</span>
                      </p>
                      <p className="italic">"{req.rejectionReason}"</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {req.status === "pending" && (
                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setDeletingLeave(req)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isLao ? "ຍົກເລີກຄຳຮ້ອງ" : "Cancel Request"}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. SUBTAB: APPROVALS CENTER (FOR ADMIN / CHIEF OF ADMIN & FINANCE) */}
      {activeSubTab === "approvals" && canApprove && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>{isLao ? "ສູນອະນຸມັດຄຳຮ້ອງຂໍລາພັກ" : "Leave Approvals Command"}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLao 
                  ? "ສຳລັບ ແອັດມີນ ຫຼື ຫົວໜ້າຫ້ອງ ບໍລິຫານ, ພິທີການ ແລະ ການເງິນ (ບັນຊີຜູ້ອະນຸມັດຈະຖືກບັນທຶກລົງໃນລະບົບ)."
                  : "For Admin or Chief of Admin, Protocol & Finance. Approver account is audited on record."}
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/30 border border-amber-300/60 flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingApprovalsList.length} {isLao ? "ລາຍການລໍຖ້າອະນຸມັດ" : "pending"}</span>
            </span>
          </div>

          {pendingApprovalsList.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-white">
                {isLao ? "ບໍ່ມີຄຳຮ້ອງທີ່ລໍຖ້າການອະນຸມັດ" : "All requests have been reviewed!"}
              </p>
              <p className="text-xs text-slate-400">
                {isLao ? "ເມື່ອມີພະນັກງານຍື່ນຄຳຮ້ອງໃໝ່ ຈະປະກົດຂຶ້ນຢູ່ໜ້ານີ້ທັນທີ." : "New applications will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovalsList.map(item => (
                <div
                  key={item.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                        {item.staffName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            {item.staffName}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.staffCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.staffPosition} • {item.staffDepartment}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                        {item.workingDaysCount} {isLao ? "ວັນລັດຖະການ" : "working days"}
                      </span>
                    </div>
                  </div>

                  {/* Detail Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <div>
                      <p className="text-slate-500 font-bold">{isLao ? "ຫົວຂໍ້ການລາພັກ:" : "Title:"}</p>
                      <p className="text-slate-800 dark:text-white font-black text-sm mt-0.5">{item.title}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold">{isLao ? "ໄລຍະວັນທີ:" : "Date range:"}</p>
                      <p className="text-slate-800 dark:text-white font-bold mt-0.5">{item.startDate} ຫາ {item.endDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold">{isLao ? "ເຫດຜົນ:" : "Reason:"}</p>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{item.reason}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold">{isLao ? "ຜູ້ມອບໝາຍວຽກແທນ:" : "Handover person:"}</p>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{item.handoverPerson || "ບໍ່ມີ"} ({item.handoverPhone || ""})</p>
                    </div>
                  </div>

                  {/* Quota audit verification */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
                    <span>ໂຄຕ້າທັງໝົດ: <b className="text-slate-900 dark:text-white">15 ວັນ</b></span>
                    <span>•</span>
                    <span>ລາພັກແລ້ວ: <b className="text-amber-600">{item.quotaUsedBefore || 0} ວັນ</b></span>
                    <span>•</span>
                    <span>ຍັງເຫຼືອ: <b className="text-emerald-600">{item.quotaRemainingBefore ?? 15} ວັນ</b></span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewingLeave(item);
                        setApprovalRemarks("");
                      }}
                      className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                    >
                      {isLao ? "ປະຕິເສດ..." : "Reject..."}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewingLeave(item);
                        setApprovalRemarks("ເຫັນດີອະນຸມັດຕາມການສະເໜີ");
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-sm cursor-pointer"
                    >
                      {isLao ? "ກວດກາ ແລະ ອະນຸມັດ" : "Review & Approve"}
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. SUCCESS NOTIFICATION MODAL */}
      <AnimatePresence>
        {submittedModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {isLao ? "ຍື່ນແບບຟອມຂໍລາພັກສຳເລັດ!" : "Application Submitted Successfully!"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isLao 
                    ? "ລະບົບໄດ້ສົ່ງແຈ້ງເຕືອນຫາບັນຊີຜູ້ອະນຸມັດຮຽບຮ້ອຍແລ້ວ:"
                    : "Automated notification dispatched to authorized approvers:"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isLao ? "ຜູ້ຂໍລາພັກ:" : "Applicant:"}</span>
                  <span className="font-black text-slate-900 dark:text-white">{submittedModalData.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isLao ? "ຫົວຂໍ້:" : "Title:"}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{submittedModalData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isLao ? "ກຳນົດວັນທີ:" : "Date:"}</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    {submittedModalData.startDate} ຫາ {submittedModalData.endDate} ({submittedModalData.workingDaysCount} ວັນ)
                  </span>
                </div>
                <div className="border-t border-emerald-200/60 dark:border-emerald-800/50 pt-2 flex justify-between">
                  <span className="text-slate-500">{isLao ? "ຜູ້ມີສິດອະນຸມັດ:" : "Approver:"}</span>
                  <span className="font-black text-amber-700 dark:text-amber-300">
                    ທ່ານ ຄຳຕຸ່ນ ຄໍາມະວົງ / ທ່ານ ນາງ ມະນີວອນ
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  🔔 {isLao ? "ຂັ້ນຕອນຕໍ່ໄປ:" : "Next steps:"}
                </p>
                <p>
                  {isLao 
                    ? "ຫົວໜ້າຫ້ອງ ບໍລິຫານ, ພິທີການ ແລະ ການເງິນ ຫຼື ແອັດມີນ ຈະກວດກາໂຄຕ້າ ແລະ ດຳເນີນການອະນຸມັດ ພ້ອມທັງລະບົບຈະບັນທຶກຊື່ບັນຊີຜູ້ອະນຸມັດໄວ້ໃນບົດລາຍງານ."
                    : "The supervisor will verify quota balances and record the authorized approval."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSubmittedModalData(null)}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                {isLao ? "ຕົກລົງ ແລະ ປິດໜ້າຕ່າງ" : "Close"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. REVIEW & APPROVE MODAL (FOR ADMIN / APPROVERS) */}
      <AnimatePresence>
        {reviewingLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>{isLao ? "ກວດກາ ແລະ ອະນຸມັດການລາພັກ" : "Review Leave Request"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setReviewingLeave(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <p><b>{isLao ? "ຜູ້ຂໍລາພັກ:" : "Applicant:"}</b> {reviewingLeave.staffName} ({reviewingLeave.staffCode})</p>
                  <p><b>{isLao ? "ຕຳແໜ່ງ/ພະແນກ:" : "Position:"}</b> {reviewingLeave.staffPosition} • {reviewingLeave.staffDepartment}</p>
                  <p><b>{isLao ? "ຫົວຂໍ້:" : "Title:"}</b> {reviewingLeave.title}</p>
                  <p><b>{isLao ? "ກຳນົດວັນທີ:" : "Dates:"}</b> {reviewingLeave.startDate} ຫາ {reviewingLeave.endDate} ({reviewingLeave.workingDaysCount} ວັນ)</p>
                  <p><b>{isLao ? "ເຫດຜົນ:" : "Reason:"}</b> {reviewingLeave.reason}</p>
                </div>

                {/* Audit Information Preview */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                    {isLao ? "ບັນຊີທີ່ຈະບັນທຶກເປັນຜູ້ອະນຸມັດ:" : "Approver Audit Stamp:"}
                  </span>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {userProfile?.displayName || "ທ່ານ ຄຳຕຸ່ນ ຄໍາມະວົງ"} ({userProfile?.email || "tounkmv99@gmail.com"})
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {userProfile?.role === "admin" ? "ຜູ້ດູແລລະບົບ (Admin)" : "ຫົວໜ້າຫ້ອງ ບໍລິຫານ, ພິທີການ ແລະ ການເງິນ"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                    {isLao ? "ຄຳເຫັນ ຫຼື ເຫດຜົນຂອງຜູ້ອະນຸມັດ:" : "Approver Remarks:"}
                  </label>
                  <textarea
                    rows={2}
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    placeholder={isLao ? "ເຊັ່ນ: ເຫັນດີອະນຸມັດຕາມການສະເໜີ..." : "Approval remarks..."}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => handleApproveAction("rejected")}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                >
                  {isLao ? "ປະຕິເສດຄຳຮ້ອງ" : "Reject"}
                </button>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => handleApproveAction("approved")}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  {isActionLoading ? (isLao ? "ກຳລັງອະນຸມັດ..." : "Approving...") : (isLao ? "ຢືນຢັນການອະນຸມັດ" : "Confirm Approval")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isLao ? "ຢືນຢັນການຍົກເລີກຄຳຮ້ອງ?" : "Cancel Leave Request?"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isLao ? "ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍົກເລີກ ແລະ ລົບຄຳຮ້ອງຂໍລາພັກນີ້?" : "Are you sure you want to cancel this request?"}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingLeave(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer"
                >
                  {isLao ? "ກັບຄືນ" : "Cancel"}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer shadow-sm"
                >
                  {isDeleting ? (isLao ? "ກຳລັງລົບ..." : "Deleting...") : (isLao ? "ຢືນຢັນລົບ" : "Confirm Delete")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
