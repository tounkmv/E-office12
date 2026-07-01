import { useState, FormEvent } from "react";
import { 
  Building2, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle, 
  X,
  FileText,
  AlertTriangle,
  History,
  Trash2,
  ListFilter,
  ShieldCheck,
  XCircle,
  MessageSquare,
  Pencil
} from "lucide-react";
import { AppLanguage, MeetingRoom, RoomBooking, UserProfile } from "../types";
import { translations } from "../lib/translations";
import { addBooking, deleteBooking, updateBookingStatus, updateBooking } from "../lib/firebaseHelper";
import { showSystemToast } from "../utils/toast";
import { motion, AnimatePresence } from "motion/react";

interface BookingFormProps {
  rooms: MeetingRoom[];
  bookings: RoomBooking[];
  userProfile: UserProfile;
  language: AppLanguage;
}

export default function BookingForm({ rooms, bookings, userProfile, language }: BookingFormProps) {
  const t = translations[language];
  const todayStr = new Date().toISOString().split("T")[0];

  // Component States
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attendeesCount, setAttendeesCount] = useState<number>(5);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin Approval States
  const [adminFilter, setAdminFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [adminNotesText, setAdminNotesText] = useState<Record<string, string>>({});

  // Editing Booking States
  const [editingBooking, setEditingBooking] = useState<RoomBooking | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editAttendeesCount, setEditAttendeesCount] = useState<number>(5);
  const [editPurpose, setEditPurpose] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const handleApprove = async (id: string) => {
    try {
      const reason = adminNotesText[id] || "";
      await updateBookingStatus(id, "approved", reason);
      setSuccess(t.bkStatusChanged);
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
      setError(t.error + ": " + err.message);
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
      setSuccess(t.bkStatusChanged);
      showSystemToast(
        language === "lo" ? "ປະຕິເສດການຈອງຫ້ອງປະຊຸມແລ້ວ" : "Booking rejected",
        "warning",
        language === "lo" ? "ປະຕິເສດແລ້ວ" : "Rejected"
      );
      setAdminNotesText(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err: any) {
      console.error("Reject error:", err);
      setError(t.error + ": " + err.message);
      showSystemToast(err.message || "Failed to reject", "error", "ERROR");
    }
  };

  // Filter My Bookings
  const myBookings = bookings.filter(b => b.userId === userProfile.uid);

  // Helper to validate time slot overlapping
  const checkTimeConflict = (roomId: string, bookingDate: string, start: string, end: string, excludeBookingId?: string) => {
    return bookings.some(b => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.roomId !== roomId || b.date !== bookingDate || b.status === "rejected") {
        return false;
      }
      // Overlap logic
      const s1 = start;
      const e1 = end;
      const s2 = b.startTime;
      const e2 = b.endTime;

      return (s1 < e2 && e1 > s2);
    });
  };

  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !userProfile) return;

    setError(null);
    setSuccess(null);

    // Basic Validation
    if (!title || !date || !startTime || !endTime) {
      const msg = language === "lo" ? "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ!" : "Please fill in all fields!";
      setError(msg);
      showSystemToast(msg, "warning", language === "lo" ? "ແຈ້ງເຕືອນ" : "Warning");
      return;
    }

    if (startTime >= endTime) {
      const msg = language === "lo" ? "ເວລາເລີ່ມຕົ້ນຕ້ອງໜ້ອຍກວ່າເວລາສິ້ນສຸດ!" : "Start time must be before end time!";
      setError(msg);
      showSystemToast(msg, "warning", language === "lo" ? "ແຈ້ງເຕືອນ" : "Warning");
      return;
    }

    // Conflict Check
    const hasConflict = checkTimeConflict(selectedRoom.id, date, startTime, endTime);
    if (hasConflict) {
      setError(t.bkConflictError);
      showSystemToast(t.bkConflictError, "error", language === "lo" ? "ເວລາຊ້ຳກັນ" : "Conflict Detected");
      return;
    }

    setLoading(true);

    try {
      const bookingId = "book_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const newBooking: RoomBooking = {
        id: bookingId,
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        userId: userProfile.uid,
        userName: userProfile.displayName,
        userEmail: userProfile.email,
        department: userProfile.department || "",
        title,
        date,
        startTime,
        endTime,
        status: "pending",
        purpose,
        attendeesCount,
        createdAt: new Date().toISOString(),
        notes: userProfile.phone || notes // fallback or merge
      };

      await addBooking(newBooking);

      setSuccess(t.bkSuccessMessage);
      showSystemToast(
        t.bkSuccessMessage,
        "success",
        language === "lo" ? "ຈອງສຳເລັດ" : "Booking Created"
      );
      
      // Reset form fields
      setTitle("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setAttendeesCount(5);
      setPurpose("");
      setNotes("");
      setSelectedRoom(null);
    } catch (err: any) {
      console.error("Booking submission error:", err);
      setError(t.error + ": " + err.message);
      showSystemToast(err.message, "error", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm(language === "lo" ? "ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍົກເລີກການຈອງນີ້?" : "Are you sure you want to cancel this booking?")) return;
    try {
      await deleteBooking(id);
      showSystemToast(
        language === "lo" ? "ຍົກເລີກການຈອງຫ້ອງປະຊຸມສຳເລັດແລ້ວ!" : "Booking cancelled successfully!",
        "info",
        language === "lo" ? "ຍົກເລີກແລ້ວ" : "Cancelled"
      );
    } catch (err: any) {
      console.error("Error cancelling booking:", err);
      showSystemToast(err.message || "Error cancelling booking", "error", "ERROR");
    }
  };

  const handleOpenEditBooking = (booking: RoomBooking) => {
    setEditingBooking(booking);
    setEditTitle(booking.title);
    setEditDate(booking.date);
    setEditStartTime(booking.startTime);
    setEditEndTime(booking.endTime);
    setEditAttendeesCount(booking.attendeesCount);
    setEditPurpose(booking.purpose);
    setEditNotes(booking.notes || "");
  };

  const handleEditBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    setError(null);
    setSuccess(null);

    if (!editTitle || !editDate || !editStartTime || !editEndTime) {
      const msg = language === "lo" ? "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ!" : "Please fill in all fields!";
      setError(msg);
      showSystemToast(msg, "warning", language === "lo" ? "ແຈ້ງເຕືອນ" : "Warning");
      return;
    }

    if (editStartTime >= editEndTime) {
      const msg = language === "lo" ? "ເວລາເລີ່ມຕົ້ນຕ້ອງໜ້ອຍກວ່າເວລາສິ້ນສຸດ!" : "Start time must be before end time!";
      setError(msg);
      showSystemToast(msg, "warning", language === "lo" ? "ແຈ້ງເຕືອນ" : "Warning");
      return;
    }

    const hasConflict = checkTimeConflict(editingBooking.roomId, editDate, editStartTime, editEndTime, editingBooking.id);
    if (hasConflict) {
      const msg = language === "lo" ? "ເວລາຊ້ຳກັນກັບການຈອງອື່ນທີ່ມີຢູ່ແລ້ວ!" : "Time slot conflicts with an existing booking!";
      setError(msg);
      showSystemToast(msg, "error", language === "lo" ? "ເວລາຊ້ຳກັນ" : "Conflict Detected");
      return;
    }

    setLoading(true);

    try {
      const updates: Partial<RoomBooking> = {
        title: editTitle,
        date: editDate,
        startTime: editStartTime,
        endTime: editEndTime,
        attendeesCount: editAttendeesCount,
        purpose: editPurpose,
        notes: editNotes,
        status: "pending" // Reset to pending if user edits it so admin can re-review
      };

      await updateBooking(editingBooking.id, updates);

      const msg = language === "lo" ? "ແກ້ໄຂການຈອງຫ້ອງປະຊຸມສຳເລັດແລ້ວ!" : "Booking updated successfully!";
      setSuccess(msg);
      showSystemToast(msg, "success", language === "lo" ? "ແກ້ໄຂສຳເລັດ" : "Booking Updated");
      setEditingBooking(null);
    } catch (err: any) {
      console.error("Edit booking submit error:", err);
      setError(t.error + ": " + err.message);
      showSystemToast(err.message, "error", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="booking-section-container" className="space-y-10 font-sans pb-16">
      
      {/* SUCCESS/ERROR ALERT */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-500 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5.5 h-5.5 shrink-0" />
            <div className="text-xs">
              <span className="font-bold block">{t.success}!</span>
              <p className="opacity-90">{success}</p>
              <span className="text-[10px] mt-1 block opacity-85 underline">{t.bkNotifyEmail}</span>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-red-500/15 border border-red-500/25 text-red-500 rounded-2xl flex items-center gap-3"
          >
            <AlertTriangle className="w-5.5 h-5.5 shrink-0 animate-bounce" />
            <div className="text-xs">
              <span className="font-bold block">{t.error}</span>
              <p className="opacity-90">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Part 1: Grid list of available rooms */}
      <div id="rooms-selection-panel" className="space-y-6">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <Building2 className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {t.bkBookRoom} - {t.bkSelectRoom}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div 
              key={room.id}
              id={`room-card-${room.id}`}
              className="bg-white dark:bg-[#1e293b] rounded-3xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-xs flex flex-col hover:shadow-md hover:border-indigo-500/20 transition-all duration-300 group"
            >
              {/* Room Image with lazy layout and hover effect */}
              <div className="h-44 w-full bg-slate-800 overflow-hidden relative">
                {room.imageUrl ? (
                  <img 
                    src={room.imageUrl} 
                    alt={room.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <Building2 className="w-12 h-12" />
                  </div>
                )}
                {/* Location Badge */}
                <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-[10px] text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/5">
                  <MapPin className="w-3 h-3 text-red-400" />
                  {room.location}
                </span>
                {/* Status Badge */}
                <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                  room.status === "active" 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  {room.status === "active" ? t.rmStatusActive : t.rmStatusInactive}
                </span>
              </div>

              {/* Room Metadata */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                    {room.name}
                  </h4>
                  <p className="text-xs opacity-70 line-clamp-2">
                    {room.description}
                  </p>
                </div>

                <div className="space-y-2 border-t border-white/5 pt-3">
                  <div className="flex items-center gap-1.5 text-xs opacity-85 font-semibold">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>{t.rmCapacity}: {room.capacity} {language === "lo" ? "ບ່ອນນັ່ງ" : "Seats"}</span>
                  </div>
                  {/* Equipments Tags */}
                  <div className="flex flex-wrap gap-1">
                    {room.equipment.map((eq, i) => (
                      <span key={i} className="text-[9px] bg-slate-500/10 opacity-80 px-2 py-0.5 rounded-md font-semibold">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  id={`btn-select-room-${room.id}`}
                  disabled={room.status !== "active"}
                  onClick={() => setSelectedRoom(room)}
                  className="w-full flex items-center justify-center gap-1.5 bg-blue-600/95 hover:bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10 disabled:opacity-50 disabled:hover:bg-blue-600/95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.bkBookRoom}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 2: Booking Form Modal Popup */}
      <AnimatePresence>
        {selectedRoom && (
          <div id="booking-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              id="booking-form-box" 
              className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-100 dark:border-white/5 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedRoom(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5.5 h-5.5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5.5 h-5.5 text-blue-500" />
                  <span>{t.bkBookingForm}</span>
                </h3>
                <p className="text-xs text-blue-500 font-extrabold flex items-center gap-1">
                  <span>{selectedRoom.name}</span>
                  <span className="opacity-60">|</span>
                  <span className="opacity-90">{selectedRoom.location}</span>
                </p>
              </div>

              {/* Main Booking Form */}
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                
                {/* Meeting Title input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t.bkMeetingTitle} *</span>
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder={t.bkMeetingTitlePlaceholder}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  />
                </div>

                {/* Date Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.bkDate} *</span>
                    </label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      min={todayStr}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.bkAttendees} *</span>
                    </label>
                    <input 
                      type="number" 
                      value={attendeesCount}
                      onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 5)}
                      required
                      min={1}
                      max={selectedRoom.capacity}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                    />
                  </div>
                </div>

                {/* Start & End Times Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.bkStartTime} *</span>
                    </label>
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.bkEndTime} *</span>
                    </label>
                    <input 
                      type="time" 
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                    />
                  </div>
                </div>

                {/* Purpose textarea */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider">
                    {t.bkPurpose}
                  </label>
                  <textarea 
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={2}
                    placeholder={t.bkPurposePlaceholder}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  />
                </div>

                {/* Notes Input (Phone) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider">
                    {t.bkNotes} ({t.phone})
                  </label>
                  <input 
                    type="text" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.bkNotesPlaceholder}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  />
                </div>

                {/* Submit button */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRoom(null)}
                    className="flex-1 bg-slate-500/10 hover:bg-slate-500/15 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/10 cursor-pointer"
                  >
                    {loading ? t.loading : t.bkSubmit}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Part 2.5: Edit Booking Modal Popup */}
      <AnimatePresence>
        {editingBooking && (
          <div id="edit-booking-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              id="edit-booking-form-box" 
              className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-100 dark:border-white/5 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button 
                onClick={() => setEditingBooking(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5.5 h-5.5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Pencil className="w-5.5 h-5.5 text-amber-500" />
                  <span>{language === "lo" ? "ແກ້ໄຂການຈອງຫ້ອງປະຊຸມ" : "Edit Room Booking"}</span>
                </h3>
                <p className="text-xs text-amber-500 font-extrabold flex items-center gap-1">
                  <span>{editingBooking.roomName}</span>
                </p>
              </div>

              {/* Edit Booking Form */}
              <form onSubmit={handleEditBookingSubmit} className="space-y-4">
                
                {/* Meeting Title input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.bkMeetingTitle} *</span>
                  </label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    placeholder={t.bkMeetingTitlePlaceholder}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  />
                </div>

                {/* Date & Attendees count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.bkDate} *</span>
                    </label>
                    <input 
                      type="date" 
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                      min={todayStr}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.bkAttendees} *</span>
                    </label>
                    <input 
                      type="number" 
                      value={editAttendeesCount}
                      onChange={(e) => setEditAttendeesCount(parseInt(e.target.value) || 5)}
                      required
                      min={1}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                    />
                  </div>
                </div>

                {/* Start & End Times Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.bkStartTime} *</span>
                    </label>
                    <input 
                      type="time" 
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.bkEndTime} *</span>
                    </label>
                    <input 
                      type="time" 
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                    />
                  </div>
                </div>

                {/* Purpose textarea */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider">
                    {t.bkPurpose}
                  </label>
                  <textarea 
                    value={editPurpose}
                    onChange={(e) => setEditPurpose(e.target.value)}
                    rows={2}
                    placeholder={t.bkPurposePlaceholder}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  />
                </div>

                {/* Notes Input (Phone) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider">
                    {t.bkNotes} ({t.phone})
                  </label>
                  <input 
                    type="text" 
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder={t.bkNotesPlaceholder}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  />
                </div>

                {/* Submit button */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingBooking(null)}
                    className="flex-1 bg-slate-500/10 hover:bg-slate-500/15 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                  >
                    {loading ? t.loading : (language === "lo" ? "ບັນທຶກການແກ້ໄຂ" : "Save Changes")}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Approvals Board Section */}
      {userProfile.role === "admin" && (
        <div id="admin-approvals-panel" className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  {language === "lo" ? "ລາຍການອະນຸມັດການຈອງທັງໝົດ (ສຳລັບ Admin)" : "All Bookings Approval Board (Admin)"}
                </h3>
                <p className="text-[11px] opacity-60 font-semibold">
                  {language === "lo" ? "ກວດສອບ, ອະນຸມັດ ຫຼື ປະຕິເສດ ຄຳຮ້ອງຂໍຈອງຫ້ອງປະຊຸມພາຍໃນລະບົບ" : "Verify, approve, or reject meeting room booking requests"}
                </p>
              </div>
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 text-[10px] font-bold">
              {(["pending", "approved", "rejected", "all"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAdminFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    adminFilter === filter
                      ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/10"
                      : "bg-slate-500/10 hover:bg-slate-500/15 border-white/5 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {filter === "pending" ? t.bkStatusPending :
                   filter === "approved" ? t.bkStatusApproved :
                   filter === "rejected" ? t.bkStatusRejected : t.all}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3 border-b border-slate-100 dark:border-white/5">
                  <th className="py-3 px-4">{t.rmRoomName}</th>
                  <th className="py-3 px-4">{t.bkMeetingTitle}</th>
                  <th className="py-3 px-4">{t.usrDisplayName}</th>
                  <th className="py-3 px-4">{t.bkDate} & {t.dbTimeRange}</th>
                  <th className="py-3 px-4">{t.status}</th>
                  <th className="py-3 px-4 text-center" style={{ width: "240px" }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {bookings
                  .filter(b => adminFilter === "all" || b.status === adminFilter)
                  .length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center opacity-60 font-semibold">
                      {t.noData}
                    </td>
                  </tr>
                ) : (
                  bookings
                    .filter(b => adminFilter === "all" || b.status === adminFilter)
                    .map((booking) => (
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
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold opacity-90">{booking.userName}</span>
                            <span className="text-[10px] opacity-60 font-semibold">{booking.department}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold">
                          <div className="flex flex-col">
                            <span>{booking.date}</span>
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
                            {booking.status === "approved" ? t.bkStatusApproved :
                             booking.status === "rejected" ? t.bkStatusRejected : t.bkStatusPending}
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
                              <div className="flex gap-2 justify-end items-center">
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
                                  <span>{t.bkStatusRejected}</span>
                                </button>
                                <button
                                  id={`btn-approve-booking-${booking.id}`}
                                  onClick={() => handleApprove(booking.id)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>{t.bkStatusApproved}</span>
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
                                  id={`btn-admin-delete-${booking.id}`}
                                  onClick={() => handleCancelBooking(booking.id)}
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
      )}

      {/* Part 3: Personal booking log ("My Booking History") */}
      <div id="personal-bookings-panel" className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-4">
          <History className="w-5 h-5 text-indigo-500" />
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              {t.bkMyBookings}
            </h3>
            <p className="text-[11px] opacity-60">
              {language === "lo" ? "ລາຍການຈອງຫ້ອງທັງໝົດຂອງທ່ານໃນລະບົບ" : "View your personal room bookings"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3 border-b border-slate-100 dark:border-white/5">
                <th className="py-3 px-4">{t.rmRoomName}</th>
                <th className="py-3 px-4">{t.bkMeetingTitle}</th>
                <th className="py-3 px-4">{t.bkDate}</th>
                <th className="py-3 px-4">{t.dbTimeRange}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {myBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center opacity-60 font-semibold">
                    {t.noData}
                  </td>
                </tr>
              ) : (
                myBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {booking.roomName}
                    </td>
                    <td className="py-3.5 px-4 font-medium opacity-90">
                      {booking.title}
                    </td>
                    <td className="py-3.5 px-4 font-semibold opacity-80">
                      {booking.date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold opacity-80">
                      {booking.startTime} - {booking.endTime}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        booking.status === "approved" 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : booking.status === "rejected" 
                          ? "bg-red-500/10 text-red-500 border-red-500/20" 
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      }`}>
                        {booking.status === "approved" ? t.bkStatusApproved :
                         booking.status === "rejected" ? t.bkStatusRejected : t.bkStatusPending}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`btn-edit-booking-${booking.id}`}
                          onClick={() => handleOpenEditBooking(booking)}
                          className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer inline-flex items-center"
                          title={language === "lo" ? "ແກ້ໄຂການຈອງ" : "Edit booking"}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-cancel-booking-${booking.id}`}
                          disabled={booking.status !== "pending"}
                          onClick={() => handleCancelBooking(booking.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer inline-flex items-center"
                          title={language === "lo" ? "ຍົກເລີກການຈອງ" : "Cancel booking"}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
