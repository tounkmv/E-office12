import React, { useState } from "react";
import { 
  ShieldCheck, 
  Trash2, 
  AlertTriangle, 
  SlidersHorizontal, 
  Search, 
  RotateCcw, 
  FileText, 
  Briefcase, 
  MessageSquare, 
  Clock, 
  Pencil, 
  XCircle, 
  X, 
  ArrowRight 
} from "lucide-react";
import { AppLanguage, MeetingRoom, RoomBooking, UserProfile } from "../types";
import { translations } from "../lib/translations";
import { updateBookingStatus, updateBooking, deleteBooking, clearAllBookings } from "../lib/firebaseHelper";
import { triggerWhatsAppAlert, triggerLineAlert } from "../lib/socialNotifyHelper";
import { showSystemToast } from "../utils/toast";
import { motion, AnimatePresence } from "motion/react";

interface AdminBookingsProps {
  rooms: MeetingRoom[];
  bookings: RoomBooking[];
  userProfile: UserProfile;
  language: AppLanguage;
}

export default function AdminBookings({ rooms, bookings, userProfile, language }: AdminBookingsProps) {
  const t = translations[language];

  // Filtering & Search State
  const [adminFilter, setAdminFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminRoomFilter, setAdminRoomFilter] = useState("all");
  const [adminDateFilter, setAdminDateFilter] = useState("");

  // Notes state for inline rejection/approval notes
  const [adminNotesText, setAdminNotesText] = useState<{ [bookingId: string]: string }>({});

  // Database Purge Confirmation state
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");
  const [isPurging, setIsPurging] = useState(false);

  // Edit Booking Modal state
  const [editingBooking, setEditingBooking] = useState<RoomBooking | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRoomId, setEditRoomId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editAttendees, setEditAttendees] = useState(1);
  const [editPurpose, setEditPurpose] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [editAttachment, setEditAttachment] = useState<{ name: string; data: string; type: string } | null>(null);
  const [editDragActive, setEditDragActive] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Totals
  const totalDbBookings = bookings.length;
  const pendingDbBookings = bookings.filter(b => b.status === "pending").length;
  const approvedDbBookings = bookings.filter(b => b.status === "approved").length;
  const rejectedDbBookings = bookings.filter(b => b.status === "rejected").length;

  // Filtered Bookings list
  const adminFilteredBookings = bookings.filter((b) => {
    // 1. Status Filter
    const matchesStatus = adminFilter === "all" || b.status === adminFilter;
    
    // 2. Search Query (matches title, user name, department, or purpose)
    const q = adminSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      b.title.toLowerCase().includes(q) || 
      b.userName.toLowerCase().includes(q) || 
      (b.department && b.department.toLowerCase().includes(q)) ||
      (b.purpose && b.purpose.toLowerCase().includes(q));
      
    // 3. Room Filter
    const matchesRoom = adminRoomFilter === "all" || !adminRoomFilter || b.roomId === adminRoomFilter;
    
    // 4. Date Filter
    const matchesDate = !adminDateFilter || b.date === adminDateFilter || b.endDate === adminDateFilter;
    
    return matchesStatus && matchesSearch && matchesRoom && matchesDate;
  });

  // Handlers
  const handleApprove = async (id: string) => {
    try {
      const reason = adminNotesText[id] || "";
      await updateBookingStatus(id, "approved", reason);
      showSystemToast(
        language === "lo" ? "ອະນຸມັດການຈອງຫ້ອງປະຊຸມສຳເລັດແລ້ວ!" : "Booking approved successfully!",
        "success",
        language === "lo" ? "ອະນຸມັດສຳເລັດ" : "Approved"
      );
      setAdminNotesText(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err: any) {
      console.error("Approve error:", err);
      showSystemToast(err.message || "Failed to approve", "error", "ERROR");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const reason = adminNotesText[id] || "";
      if (!reason) {
        const confirmMsg = language === "lo" 
          ? "ທ່ານຕ້ອງການປະຕິເສດໂດຍບໍ່ໃສ່ເຫດຜົນ/ໝາຍເຫດ ບໍ?" 
          : "Are you sure you want to reject without any comments?";
        if (!window.confirm(confirmMsg)) return;
      }
      await updateBookingStatus(id, "rejected", reason);
      showSystemToast(
        language === "lo" ? "ປະຕິເສດການຈອງຫ້ອງປະຊຸມແລ້ວ" : "Booking rejected",
        "warning",
        language === "lo" ? "ປະຕິເສດ" : "Rejected"
      );
      setAdminNotesText(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err: any) {
      console.error("Reject error:", err);
      showSystemToast(err.message || "Failed to reject", "error", "ERROR");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(language === "lo" ? "ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບການຈອງນີ້?" : "Are you sure you want to delete this booking?")) return;
    try {
      await deleteBooking(id);
      showSystemToast(
        language === "lo" ? "ລຶບຂໍ້ມູນການຈອງສຳເລັດແລ້ວ" : "Booking deleted",
        "success",
        "Success"
      );
    } catch (err: any) {
      console.error("Delete error:", err);
      showSystemToast(err.message || "Failed to delete", "error", "ERROR");
    }
  };

  const handlePurgeDatabase = async () => {
    if (purgeConfirmText !== "CONFIRM" && purgeConfirmText !== "ລ້າງຂໍ້ມູນ") {
      const errorMsg = language === "lo" 
        ? "ກະລຸນາພິມຄຳວ່າ 'ລ້າງຂໍ້ມູນ' ເພື່ອຢືນຢັນ" 
        : "Please type 'CONFIRM' to verify";
      showSystemToast(errorMsg, "warning", "Warning");
      return;
    }

    setIsPurging(true);
    try {
      await clearAllBookings();
      showSystemToast(
        language === "lo" ? "ລ້າງຖານຂໍ້ມູນປະຫວັດການຈອງທັງໝົດສຳເລັດແລ້ວ!" : "All booking history has been purged successfully!",
        "success",
        "Success"
      );
      setShowPurgeConfirm(false);
      setPurgeConfirmText("");
    } catch (err: any) {
      console.error("Error purging database:", err);
      showSystemToast(err.message || "Failed to purge bookings", "error", "ERROR");
    } finally {
      setIsPurging(false);
    }
  };

  const handleOpenEditBooking = (booking: RoomBooking) => {
    setEditingBooking(booking);
    setEditTitle(booking.title);
    setEditRoomId(booking.roomId);
    setEditDate(booking.date);
    setEditEndDate(booking.endDate || booking.date);
    setEditStartTime(booking.startTime);
    setEditEndTime(booking.endTime);
    setEditUserName(booking.userName);
    setEditDepartment(booking.department || "");
    setEditAttendees(booking.attendeesCount || 1);
    setEditPurpose(booking.purpose || "");
    setEditNotes(booking.notes || "");
    setEditStatus(booking.status);
    if (booking.attachmentName && booking.attachmentData) {
      setEditAttachment({
        name: booking.attachmentName,
        data: booking.attachmentData,
        type: booking.attachmentType || ""
      });
    } else {
      setEditAttachment(null);
    }
  };

  const handleSaveEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const selectedRoom = rooms.find(r => r.id === editRoomId);
    if (!selectedRoom) return;

    setIsSavingEdit(true);
    try {
      await updateBooking(editingBooking.id, {
        roomId: editRoomId,
        roomName: selectedRoom.name,
        title: editTitle,
        date: editDate,
        endDate: editEndDate || editDate,
        startTime: editStartTime,
        endTime: editEndTime,
        userName: editUserName,
        department: editDepartment,
        attendeesCount: editAttendees,
        purpose: editPurpose,
        notes: editNotes,
        status: editStatus,
        attachmentName: editAttachment ? editAttachment.name : "",
        attachmentData: editAttachment ? editAttachment.data : "",
        attachmentType: editAttachment ? editAttachment.type : ""
      });

      showSystemToast(
        language === "lo" ? "ບັນທຶກການແກ້ໄຂການຈອງສຳເລັດແລ້ວ!" : "Booking updated successfully!",
        "success",
        "Success"
      );
      setEditingBooking(null);
    } catch (err: any) {
      console.error("Update booking error:", err);
      showSystemToast(err.message || "Failed to update booking", "error", "ERROR");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showSystemToast(
          language === "lo" ? "ຂະໜາດຟາຍໃຫຍ່ເກີນໄປ! ກະລຸນາເລືອກຟາຍທີ່ບໍ່ເກີນ 2MB" : "File is too large! Max size 2MB",
          "warning",
          "Warning"
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAttachment({
          name: file.name,
          data: reader.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div id="admin-control-center-page" className="space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs space-y-6">
        
        {/* Header with Purge Database */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg md:text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                {language === "lo" ? "ສູນຄວບຄຸມ ແລະ ການຈັດການຈອງທັງໝົດ" : "Admin Bookings Control Center"}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {language === "lo" ? "ກວດສອບ, ແກ້ໄຂ, ອະນຸມັດ, ປະຕິເສດ, ລຶບ ຫຼື ລ້າງຂໍ້ມູນການຈອງທັງໝົດໃນລະບົບ" : "Verify, edit, approve, reject, delete or purge all booking records"}
              </p>
            </div>
          </div>

          {/* Purge Database Button */}
          <div className="shrink-0">
            {!showPurgeConfirm ? (
              <button
                onClick={() => setShowPurgeConfirm(true)}
                className="w-full lg:w-auto px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border border-red-500/20 hover:shadow-lg hover:shadow-red-500/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === "lo" ? "ລ້າງຂໍ້ມູນການຈອງທັງໝົດ" : "Purge All Bookings"}</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Purge Confirmation Alert Box */}
        {showPurgeConfirm && (
          <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl space-y-3.5 animate-pulse">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-red-500">
                  {language === "lo" ? "ຢືນຢັນການລ້າງຖານຂໍ້ມູນປະຫວັດການຈອງ!" : "Confirm booking history purge!"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  {language === "lo" 
                    ? "ການກະທຳນີ້ຈະລຶບປະຫວັດການຈອງຫ້ອງປະຊຸມທັງໝົດອອກຈາກລະບົບແບບຖາວອນ ແລະ ບໍ່ສາມາດກູ້ຄືນໄດ້. ກະລຸນາພິມຄຳວ່າ 'ລ້າງຂໍ້ມູນ' ເພື່ອຢືນຢັນ."
                    : "This action will permanently delete all meeting room booking history from the database and cannot be undone. Please type 'CONFIRM' to verify."}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
              <input 
                type="text"
                placeholder={language === "lo" ? "ພິມ 'ລ້າງຂໍ້ມູນ'" : "Type 'CONFIRM'"}
                value={purgeConfirmText}
                onChange={(e) => setPurgeConfirmText(e.target.value)}
                className="px-4 py-2.5 text-xs rounded-xl border border-red-500/30 bg-white dark:bg-slate-900 font-bold outline-none text-red-500 placeholder-red-500/40 w-full sm:w-60"
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setShowPurgeConfirm(false);
                    setPurgeConfirmText("");
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer w-full sm:w-auto"
                >
                  {language === "lo" ? "ຍົກເລີກ" : "Cancel"}
                </button>
                <button
                  onClick={handlePurgeDatabase}
                  disabled={isPurging || (purgeConfirmText !== "CONFIRM" && purgeConfirmText !== "ລ້າງຂໍ້ມູນ")}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
                >
                  {isPurging ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{language === "lo" ? "ຢືນຢັນການລຶບທັງໝົດ" : "Confirm Purge"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Bento Grid Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
              {language === "lo" ? "ຈຳນວນທັງໝົດ" : "Total Bookings"}
            </span>
            <p className="text-xl md:text-2xl font-black mt-1 text-slate-800 dark:text-white">{totalDbBookings}</p>
          </div>
          <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 shadow-xs">
            <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider">
              {language === "lo" ? "ລໍຖ້າການອະນຸມັດ" : "Pending"}
            </span>
            <p className="text-xl md:text-2xl font-black mt-1 text-amber-500">{pendingDbBookings}</p>
          </div>
          <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 shadow-xs">
            <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wider">
              {language === "lo" ? "ອະນຸມັດ" : "Approved"}
            </span>
            <p className="text-xl md:text-2xl font-black mt-1 text-emerald-500">{approvedDbBookings}</p>
          </div>
          <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 shadow-xs">
            <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider">
              {language === "lo" ? "ປະຕິເສດ" : "Rejected"}
            </span>
            <p className="text-xl md:text-2xl font-black mt-1 text-red-500">{rejectedDbBookings}</p>
          </div>
        </div>

        {/* Filtering Controls */}
        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-500" />
              {language === "lo" ? "ຕົວຕອງ ແລະ ຄົ້ນຫາແບບລະອຽດ" : "Advanced Filtering & Search"}
            </span>
            
            {/* Status Tab Filters */}
            <div className="flex flex-wrap gap-1">
              {(["pending", "approved", "rejected", "all"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAdminFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                    adminFilter === filter
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5"
                  }`}
                >
                  {filter === "pending" ? t.bkStatusPending :
                   filter === "approved" ? "ອະນຸມັດ" :
                   filter === "rejected" ? "ປະຕິເສດ" : t.all}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search query input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder={language === "lo" ? "ຄົ້ນຫາ ຫົວຂໍ້, ຜູ້ຈອງ, ພະແນກ..." : "Search title, user name, department..."}
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none text-xs font-medium transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            {/* Room Filter Select */}
            <div className="w-full sm:w-48">
              <select
                value={adminRoomFilter}
                onChange={(e) => setAdminRoomFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none text-xs font-bold transition-all cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              >
                <option value="all">{language === "lo" ? "ທຸກຫ້ອງປະຊຸມ" : "All Rooms"}</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="w-full sm:w-44">
              <input 
                type="date"
                value={adminDateFilter}
                onChange={(e) => setAdminDateFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none text-xs font-bold transition-all cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            {/* Reset Buttons */}
            {(adminSearchQuery || adminRoomFilter !== "all" || adminDateFilter) && (
              <button
                onClick={() => {
                  setAdminSearchQuery("");
                  setAdminRoomFilter("all");
                  setAdminDateFilter("");
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 transition-all text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === "lo" ? "ລ້າງ" : "Reset"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3 border-b border-slate-100 dark:border-white/5">
                <th className="py-3 px-4">{t.rmRoomName}</th>
                <th className="py-3 px-4">{t.bkMeetingTitle}</th>
                <th className="py-3 px-4">{t.usrDisplayName}</th>
                <th className="py-3 px-4">{t.bkDate} & {t.dbTimeRange}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4 text-center" style={{ width: "250px" }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {adminFilteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center opacity-60 font-semibold text-slate-500">
                    {language === "lo" ? "ບໍ່ພົບຂໍ້ມູນການຈອງທີ່ກົງກັບເງື່ອນໄຂ" : "No booking data matches selected criteria"}
                  </td>
                </tr>
              ) : (
                adminFilteredBookings.map((booking) => (
                  <tr key={booking.id} id={`admin-booking-row-${booking.id}`} className="hover:bg-slate-500/5 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {booking.roomName}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold opacity-90">{booking.title}</span>
                        {booking.purpose && (
                          <span className="text-[10px] opacity-65 font-medium mt-0.5 line-clamp-1">{booking.purpose}</span>
                        )}
                        {booking.attachmentName && booking.attachmentData && (
                          <a 
                            href={booking.attachmentData}
                            download={booking.attachmentName}
                            className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-bold flex items-center gap-1.5 mt-1.5 cursor-pointer w-fit"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            <span className="underline">{booking.attachmentName}</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold opacity-90">{booking.userName}</span>
                        <span className="text-[10px] text-blue-500 font-extrabold flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 inline" />
                          <span>{booking.department || (language === "lo" ? "ທົ່ວໄປ" : "General")}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {booking.endDate && booking.endDate !== booking.date ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                              {booking.date} → {booking.endDate}
                            </span>
                          ) : (
                            booking.date
                          )}
                        </span>
                        <span className="text-[10px] text-blue-500 font-bold">{booking.startTime} - {booking.endTime}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        booking.status === "approved" 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : booking.status === "rejected" 
                          ? "bg-red-500/10 text-red-500 border-red-500/20" 
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      }`}>
                        {booking.status === "approved" ? "ອະນຸມັດ" :
                         booking.status === "rejected" ? "ປະຕິເສດ" : "ລໍຖ້າກວດສອບ"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {booking.status === "pending" ? (
                        <div className="flex flex-col gap-2">
                          {/* Reason input inside table */}
                          <div className="flex items-center gap-1.5 bg-slate-500/5 rounded-lg border border-white/5 px-2 py-1">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            <input 
                              type="text"
                              placeholder={language === "lo" ? "ໝາຍເຫດ/ເຫດຜົນ..." : "Remarks/reason..."}
                              value={adminNotesText[booking.id] || ""}
                              onChange={(e) => setAdminNotesText(prev => ({ ...prev, [booking.id]: e.target.value }))}
                              className="bg-transparent border-none outline-none text-[10px] w-full text-slate-800 dark:text-slate-200"
                            />
                          </div>
                          <div className="flex gap-1.5 justify-end items-center flex-wrap">
                            <button
                              type="button"
                              onClick={() => triggerWhatsAppAlert(booking)}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all cursor-pointer"
                              title={language === "lo" ? "ສົ່ງແຈ້ງເຕືອນຜ່ານ WhatsApp" : "Share via WhatsApp"}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerLineAlert(booking)}
                              className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-all cursor-pointer"
                              title={language === "lo" ? "ສົ່ງແຈ້ງເຕືອນຜ່ານ LINE" : "Share via LINE"}
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-admin-edit-${booking.id}`}
                              onClick={() => handleOpenEditBooking(booking)}
                              className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all cursor-pointer"
                              title={language === "lo" ? "ແກ້ໄຂການຈອງ" : "Edit booking"}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-reject-booking-${booking.id}`}
                              onClick={() => handleReject(booking.id)}
                              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/15 text-red-500 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{language === "lo" ? "ປະຕິເສດ" : "Reject"}</span>
                            </button>
                            <button
                              id={`btn-approve-booking-${booking.id}`}
                              onClick={() => handleApprove(booking.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{language === "lo" ? "ອະນຸມັດ" : "Approve"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 bg-slate-500/5 px-2 py-1 rounded-xl">
                          <span className="opacity-60 italic text-[11px] font-semibold line-clamp-1 text-slate-700 dark:text-slate-300">
                            {booking.notes ? `ໝາຍເຫດ: ${booking.notes}` : (language === "lo" ? "ກວດສອບແລ້ວ" : "Reviewed")}
                          </span>
                          <div className="flex gap-1">
                            <button
                              id={`btn-admin-edit-${booking.id}`}
                              onClick={() => handleOpenEditBooking(booking)}
                              className="p-1 text-amber-500 hover:bg-amber-500/10 rounded-md transition-all cursor-pointer"
                              title={language === "lo" ? "ແກ້ໄຂການຈອງ" : "Edit booking"}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                              title={language === "lo" ? "ລຶບການຈອງ" : "Delete booking"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Booking Modal */}
      <AnimatePresence>
        {editingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                    <Pencil className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base md:text-lg">
                      {language === "lo" ? "ແກ້ໄຂຂໍ້ມູນການຈອງ (Admin)" : "Edit Booking Details"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      ID: {editingBooking.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditBooking} className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.bkMeetingTitle}
                    </label>
                    <input 
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  {/* Room */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.rmRoomName}
                    </label>
                    <select
                      value={editRoomId}
                      onChange={(e) => setEditRoomId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold cursor-pointer"
                    >
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.status}
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold cursor-pointer"
                    >
                      <option value="pending">{language === "lo" ? "ລໍຖ້າກວດສອບ" : "Pending"}</option>
                      <option value="approved">{language === "lo" ? "ອະນຸມັດ" : "Approved"}</option>
                      <option value="rejected">{language === "lo" ? "ປະຕິເສດ" : "Rejected"}</option>
                    </select>
                  </div>

                  {/* Date range */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.bkStartDate}
                    </label>
                    <input 
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.bkEndDate}
                    </label>
                    <input 
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  {/* Time */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.bkStartTime}
                    </label>
                    <input 
                      type="time"
                      required
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.bkEndTime}
                    </label>
                    <input 
                      type="time"
                      required
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  {/* User & Dept */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.usrDisplayName}
                    </label>
                    <input 
                      type="text"
                      required
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.bkDepartment}
                    </label>
                    <input 
                      type="text"
                      required
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  {/* Attendees */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.bkAttendees}
                    </label>
                    <input 
                      type="number"
                      min={1}
                      value={editAttendees}
                      onChange={(e) => setEditAttendees(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  {/* Purpose */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.bkPurpose}
                    </label>
                    <textarea 
                      rows={2}
                      value={editPurpose}
                      onChange={(e) => setEditPurpose(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold resize-none"
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.bkNotes}
                    </label>
                    <input 
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  {/* Attachment File */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      {t.bkAttachment}
                    </label>
                    {editAttachment ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{editAttachment.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditAttachment(null)}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-red-500 transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <input 
                        type="file"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs text-slate-500 cursor-pointer"
                      />
                    )}
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditingBooking(null)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-3 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSavingEdit ? t.loading : (
                      <>
                        <span>{language === "lo" ? "ບັນທຶກການແກ້ໄຂ" : "Save Changes"}</span>
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
    </div>
  );
}
