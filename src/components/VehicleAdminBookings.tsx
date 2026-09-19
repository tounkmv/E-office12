import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  Car, 
  MapPin, 
  Calendar, 
  Phone, 
  Users, 
  FileText, 
  AlertCircle, 
  Search, 
  Filter, 
  X, 
  Check, 
  RotateCcw,
  Sparkles,
  Bell,
  RefreshCw
} from "lucide-react";
import { VehicleBooking, Vehicle, AppLanguage, VehicleBookingStatus, UserProfile } from "../types";
import { updateVehicleBookingStatus } from "../lib/vehicleHelper";
import { showSystemToast } from "../utils/toast";

interface VehicleAdminBookingsProps {
  bookings: VehicleBooking[];
  vehicles: Vehicle[];
  userProfile: UserProfile;
  language: AppLanguage;
}

export default function VehicleAdminBookings({
  bookings,
  vehicles,
  userProfile,
  language
}: VehicleAdminBookingsProps) {
  const isLao = language === "lo";

  // Filter tab
  const [activeStatusTab, setActiveStatusTab] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentlyAddedId, setRecentlyAddedId] = useState<string>("");

  // Assign Driver Modal State
  const [assignModalBooking, setAssignModalBooking] = useState<VehicleBooking | null>(null);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");

  // Reject Modal State
  const [rejectModalBooking, setRejectModalBooking] = useState<VehicleBooking | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Listen to new bookings created in real-time
  useEffect(() => {
    const handleCreated = (e: any) => {
      const newBooking = e.detail;
      if (newBooking?.id) {
        setRecentlyAddedId(newBooking.id);
        setActiveStatusTab("pending");
        showSystemToast({
          title: isLao ? "🔔 ມີຄຳຮ້ອງຂໍຈອງລົດໃໝ່ເຂົ້າມາ!" : "New Vehicle Request!",
          message: isLao 
            ? `ຄຳຂໍຈອງ ${newBooking.vehicleName} (${newBooking.vehiclePlate}) ຈາກ ${newBooking.userName} (${newBooking.department || "ຫ້ອງວ່າການ"})` 
            : `New booking request for ${newBooking.vehicleName}`,
          type: "warning"
        });
      }
    };
    window.addEventListener("vehicle-booking-created", handleCreated);
    return () => window.removeEventListener("vehicle-booking-created", handleCreated);
  }, [isLao]);

  // Counts
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const approvedCount = bookings.filter(b => b.status === "approved").length;
  const rejectedCount = bookings.filter(b => b.status === "rejected").length;
  const completedCount = bookings.filter(b => b.status === "completed").length;

  const handleOpenAssign = (booking: VehicleBooking) => {
    setAssignModalBooking(booking);
    // Find vehicle to default its driver
    const veh = vehicles.find(v => v.id === booking.vehicleId);
    setDriverName(booking.assignedDriver || veh?.defaultDriver || "");
    setDriverPhone(booking.driverPhone || veh?.driverPhone || "");
  };

  const handleApproveWithDriver = async () => {
    if (!assignModalBooking) return;
    try {
      await updateVehicleBookingStatus(assignModalBooking.id, "approved", {
        assignedDriver: driverName.trim(),
        driverPhone: driverPhone.trim(),
        approvedBy: userProfile.displayName
      });

      showSystemToast({
        title: isLao ? "ອະນຸມັດການຈອງລົດສຳເລັດ!" : "Booking Approved",
        message: isLao 
          ? `ອະນຸມັດຄຳຂໍຈອງ ${assignModalBooking.vehiclePlate} ແລະ ແຕ່ງຕັ້ງ ${driverName || "ພະນັກງານຂັບລົດ"} ຮຽບຮ້ອຍ` 
          : "Booking approved and driver assigned",
        type: "success"
      });
      setAssignModalBooking(null);
    } catch (err: any) {
      console.error(err);
      showSystemToast({
        title: isLao ? "ເກີດຂໍ້ຜິດພາດ" : "Error",
        message: err.message,
        type: "error"
      });
    }
  };

  const handleReject = async () => {
    if (!rejectModalBooking) return;
    try {
      await updateVehicleBookingStatus(rejectModalBooking.id, "rejected", {
        rejectionReason: rejectReason.trim() || (isLao ? "ບໍ່ສາມາດຕອບສະໜອງໄດ້ໃນຊ່ວງເວລານີ້" : "Declined")
      });

      showSystemToast({
        title: isLao ? "ປະຕິເສດຄຳຂໍແລ້ວ" : "Booking Rejected",
        message: isLao ? "ໄດ້ສົ່ງແຈ້ງເຕືອນປະຕິເສດໄປຫາຜູ້ຈອງແລ້ວ" : "Booking rejected",
        type: "info"
      });
      setRejectModalBooking(null);
      setRejectReason("");
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMarkCompleted = async (booking: VehicleBooking) => {
    try {
      await updateVehicleBookingStatus(booking.id, "completed");
      showSystemToast({
        title: isLao ? "ພາລະກິດສຳເລັດ" : "Mission Completed",
        message: isLao ? "ລົດກັບຄືນສູ່ປະຈຳການພ້ອມໃຫ້ບໍລິການຕໍ່" : "Vehicle returned to fleet",
        type: "success"
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    const matchStatus = activeStatusTab === "all" || b.status === activeStatusTab;
    const matchSearch = !searchQuery || 
      b.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div id="vehicle-admin-bookings-view" className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isLao ? "ສູນອະນຸມັດການຈອງລົດ (Vehicle Approval Center)" : "Vehicle Approval Center"}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isLao 
                  ? "ຕິດຕາມຄຳຂໍຈອງລົດ, ກວດສອບຄວາມພ້ອມ, ອະນຸມັດ, ປະຕິເສດ ແລະ ແຕ່ງຕັ້ງຄົນຂັບລົດປະຈຳພາລະກິດ" 
                  : "Review requests, approve/reject trips, and dispatch assigned drivers"}
              </p>
            </div>
          </div>
        </div>

        {/* Pending counter badge */}
        {pendingCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-black text-xs flex items-center gap-2 animate-pulse">
            <Clock className="w-4 h-4" />
            <span>{pendingCount} {isLao ? "ຄຳຂໍລໍຖ້າອະນຸມັດດ່ວນ" : "pending requests"}</span>
          </div>
        )}
      </div>

      {/* Real-time Alert Banner for Pending Requests */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-2 border-amber-400/60 rounded-3xl p-4.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <Bell className="w-5 h-5 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {isLao ? `ແຈ້ງເຕືອນ: ມີ ${pendingCount} ຄຳຮ້ອງຂໍຈອງລົດໃໝ່ລໍຖ້າການອະນຸມັດ` : `Alert: ${pendingCount} vehicle booking requests awaiting approval`}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] animate-pulse">
                  {isLao ? "ດ່ວນ" : "URGENT"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {isLao 
                  ? "ກະລຸນາກວດສອບລາຍລະອຽດ, ເສັ້ນທາງ, ເວລາເດີນທາງ ແລະ ມອບໝາຍພະນັກງານຂັບລົດເພື່ອໃຫ້ບໍລິການ" 
                  : "Please review trip details and dispatch an available driver."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveStatusTab("pending")}
            className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>{isLao ? "ເບິ່ງລາຍການລໍຖ້າອະນຸມັດ" : "Review Pending"}</span>
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveStatusTab("pending")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeStatusTab === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <span>{isLao ? "ລໍຖ້າອະນຸມັດ" : "Pending"}</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-600 text-[10px] font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveStatusTab("approved")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeStatusTab === "approved"
                ? "bg-emerald-500 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <span>{isLao ? "ອະນຸມັດແລ້ວ" : "Approved"}</span>
            <span className="opacity-70">({approvedCount})</span>
          </button>

          <button
            onClick={() => setActiveStatusTab("completed")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeStatusTab === "completed"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <span>{isLao ? "ສຳເລັດແລ້ວ" : "Completed"}</span>
            <span className="opacity-70">({completedCount})</span>
          </button>

          <button
            onClick={() => setActiveStatusTab("rejected")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeStatusTab === "rejected"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <span>{isLao ? "ປະຕິເສດ" : "Rejected"}</span>
            <span className="opacity-70">({rejectedCount})</span>
          </button>

          <button
            onClick={() => setActiveStatusTab("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeStatusTab === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            {isLao ? "ທັງໝົດ" : "All"} ({bookings.length})
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={isLao ? "ຄົ້ນຫາຜູ້ຈອງ, ຈຸດໝາຍ, ທະບຽນ..." : "Search requester, destination, plate..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("vehicle-bookings-updated"));
              }
              showSystemToast({
                title: isLao ? "ອັບເດດຂໍ້ມູນແລ້ວ" : "Refreshed",
                message: isLao ? "ຂໍ້ມູນການຈອງລົດລ່າສຸດຖືກໂຫຼດແລ້ວ" : "Vehicle bookings refreshed",
                type: "info"
              });
            }}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shrink-0 border border-slate-200 dark:border-white/10"
            title={isLao ? "ຣີເຟຣຊຂໍ້ມູນ" : "Refresh"}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-12 text-center border border-slate-100 dark:border-white/5 space-y-3">
          <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {isLao ? "ບໍ່ພົບລາຍການຈອງລົດໃນໝວດນີ້" : "No vehicle bookings found in this view"}
          </h3>
          <p className="text-xs text-slate-400">
            {isLao ? "ເມື່ອມີພະນັກງານສົ່ງຄຳຂໍຈອງລົດ ຈະສະແດງຂຶ້ນຢູ່ບ່ອນນີ້ທັນທີ." : "New vehicle requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const isPending = booking.status === "pending";
            const isApproved = booking.status === "approved";
            const isRejected = booking.status === "rejected";
            const isCompleted = booking.status === "completed";
            const isNew = isPending && (booking.id === recentlyAddedId || (Date.now() - new Date(booking.createdAt).getTime() < 30 * 60 * 1000));

            return (
              <div
                key={booking.id}
                className={`bg-white dark:bg-[#1e293b] rounded-3xl p-6 border transition-all space-y-5 ${
                  isNew
                    ? "border-amber-400 ring-2 ring-amber-400/50 shadow-xl shadow-amber-500/10 dark:border-amber-400"
                    : isPending 
                    ? "border-amber-400/60 shadow-md shadow-amber-500/5 dark:border-amber-500/30" 
                    : isApproved 
                    ? "border-emerald-500/30 dark:border-emerald-500/20" 
                    : isCompleted
                    ? "border-blue-500/30 dark:border-blue-500/20"
                    : "border-slate-200/80 dark:border-white/5 opacity-80"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          {booking.vehicleName}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-300 font-mono font-black text-xs border border-amber-400/40">
                          {booking.vehiclePlate}
                        </span>
                        {isNew && (
                          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] uppercase shadow-xs flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{isLao ? "ໃໝ່" : "NEW"}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        {isLao ? "ສົ່ງຄຳຂໍເມື່ອ:" : "Requested at:"} {new Date(booking.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 animate-pulse border border-amber-300">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isLao ? "ລໍຖ້າອະນຸມັດ" : "Pending Approval"}</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500 text-white shadow-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isLao ? "ອະນຸມັດແລ້ວ" : "Approved"}</span>
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-600 text-white shadow-xs flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>{isLao ? "ພາລະກິດສຳເລັດ" : "Completed"}</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-500 text-white shadow-xs flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{isLao ? "ປະຕິເສດ" : "Rejected"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  {/* Itinerary & Destination */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {isLao ? "ເສັ້ນທາງ & ຈຸດປະສົງ:" : "Itinerary & Mission:"}
                    </span>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 space-y-1 text-slate-700 dark:text-slate-300">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-400 text-[10px] block">{isLao ? "ຈຸດໝາຍປາຍທາງ:" : "Destination:"}</span>
                          <span className="font-black text-slate-900 dark:text-white text-sm">{booking.destination}</span>
                        </div>
                      </div>
                      <div className="pt-1 text-[11px] leading-relaxed">
                        <span className="text-slate-400">{isLao ? "ຈຸດປະສົງ:" : "Purpose:"}</span> {booking.purpose}
                      </div>
                    </div>
                  </div>

                  {/* Travel Schedule */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {isLao ? "ກຳນົດເວລາເດີນທາງ:" : "Travel Schedule:"}
                    </span>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 space-y-1.5 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{booking.startDate} {isLao ? "ຫາ" : "to"} {booking.endDate}</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold pt-1">
                        👥 {booking.passengersCount} {isLao ? "ຄົນຮ່ວມເດີນທາງ" : "Passengers"}
                      </div>
                    </div>
                  </div>

                  {/* Requester & Assigned Driver */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {isLao ? "ຜູ້ຂໍຈອງ & ພະນັກງານຂັບລົດ:" : "Requester & Driver:"}
                    </span>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 space-y-1.5 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 text-[10px] block">{isLao ? "ຜູ້ຂໍຈອງ:" : "Requester:"}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{booking.userName}</span>
                        <span className="text-slate-400 text-[11px] block">{booking.department} • 📞 {booking.phone}</span>
                      </div>
                      
                      {booking.assignedDriver ? (
                        <div className="pt-1.5 border-t border-slate-200 dark:border-white/5 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 shrink-0" />
                          <span>{isLao ? "ຄົນຂັບ:" : "Driver:"} {booking.assignedDriver} ({booking.driverPhone || "—"})</span>
                        </div>
                      ) : (
                        <div className="pt-1.5 border-t border-slate-200 dark:border-white/5 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                          ⚠️ {isLao ? "ຍັງບໍ່ທັນແຕ່ງຕັ້ງຄົນຂັບລົດ" : "No driver assigned yet"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejection reason if any */}
                {isRejected && booking.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                    ❌ <strong>{isLao ? "ເຫດຜົນການປະຕິເສດ:" : "Rejection Reason:"}</strong> {booking.rejectionReason}
                  </div>
                )}

                {/* Admin Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-end gap-3">
                  {/* Approve button / Assign Driver */}
                  {isPending && (
                    <>
                      <button
                        onClick={() => {
                          setRejectModalBooking(booking);
                          setRejectReason("");
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
                      >
                        {isLao ? "ປະຕິເສດ" : "Reject"}
                      </button>

                      <button
                        onClick={() => handleOpenAssign(booking)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>{isLao ? "ອະນຸມັດ & ແຕ່ງຕັ້ງຄົນຂັບລົດ" : "Approve & Assign Driver"}</span>
                      </button>
                    </>
                  )}

                  {/* If already approved, allow updating driver or marking complete */}
                  {isApproved && (
                    <>
                      <button
                        onClick={() => handleOpenAssign(booking)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                      >
                        {isLao ? "ປ່ຽນຄົນຂັບ" : "Change Driver"}
                      </button>
                      
                      <button
                        onClick={() => handleMarkCompleted(booking)}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-500 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isLao ? "ໝາຍວ່າພາລະກິດສຳເລັດ" : "Mark as Completed"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ASSIGN DRIVER & APPROVE MODAL */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-white/10 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isLao ? "ອະນຸມັດ & ແຕ່ງຕັ້ງຄົນຂັບລົດ" : "Approve & Assign Driver"}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {assignModalBooking.vehicleName} ({assignModalBooking.vehiclePlate})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAssignModalBooking(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-300 space-y-1">
                <p><strong>{isLao ? "ຈຸດໝາຍ:" : "Destination:"}</strong> {assignModalBooking.destination}</p>
                <p><strong>{isLao ? "ວັນທີ:" : "Date:"}</strong> {assignModalBooking.startDate} ({assignModalBooking.startTime} - {assignModalBooking.endTime})</p>
                <p><strong>{isLao ? "ຜູ້ຂໍ:" : "Requester:"}</strong> {assignModalBooking.userName} ({assignModalBooking.department})</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isLao ? "ຊື່ພະນັກງານຂັບລົດ (ແຕ່ງຕັ້ງ) *" : "Assigned Driver Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isLao ? "ຕົວຢ່າງ: ທ້າວ ສົມສັກ ວົງໄຊ" : "Driver Name"}
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isLao ? "ເບີໂທພະນັກງານຂັບລົດ" : "Driver Phone Number"}
                </label>
                <input
                  type="text"
                  placeholder={isLao ? "020 xxxx xxxx" : "020 ..."}
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalBooking(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  {isLao ? "ຍົກເລີກ" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleApproveWithDriver}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold shadow-md cursor-pointer"
                >
                  {isLao ? "ຢືນຢັນການອະນຸມັດ" : "Confirm Approval"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-base font-black text-rose-600">
                {isLao ? "ປະຕິເສດຄຳຂໍຈອງລົດ" : "Decline Booking"}
              </h3>
              <button
                onClick={() => setRejectModalBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {isLao ? "ເຫດຜົນການປະຕິເສດ:" : "Reason for rejection:"}
              </label>
              <textarea
                rows={3}
                placeholder={isLao ? "ເຊັ່ນ: ລົດຕິດພາລະກິດດ່ວນຂອງຄະນະການນຳ, ຄົນຂັບບໍ່ຫວ່າງ..." : "State reason..."}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalBooking(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  {isLao ? "ຍົກເລີກ" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold shadow-md cursor-pointer"
                >
                  {isLao ? "ຢືນຢັນປະຕິເສດ" : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
