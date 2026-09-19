import React, { useState, useMemo } from "react";
import { 
  Car, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Phone, 
  Building2, 
  Check, 
  Sparkles,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Bell
} from "lucide-react";
import { Vehicle, VehicleBooking, AppLanguage, UserProfile } from "../types";
import { createVehicleBooking, checkVehicleConflict } from "../lib/vehicleHelper";
import { showSystemToast } from "../utils/toast";

interface VehicleBookingFormProps {
  vehicles: Vehicle[];
  bookings: VehicleBooking[];
  userProfile: UserProfile;
  language: AppLanguage;
  onSuccess?: () => void;
  onNavigateToAdminBookings?: () => void;
  onNavigateToDashboard?: () => void;
}

export default function VehicleBookingForm({
  vehicles,
  bookings,
  userProfile,
  language,
  onSuccess,
  onNavigateToAdminBookings,
  onNavigateToDashboard
}: VehicleBookingFormProps) {
  const isLao = language === "lo";

  // Filter state for vehicles
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    const firstAvailable = vehicles.find(v => v.status === "available");
    return firstAvailable ? firstAvailable.id : (vehicles[0]?.id || "");
  });

  // Form fields
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("08:30");
  const [endDate, setEndDate] = useState(todayStr);
  const [endTime, setEndTime] = useState("16:30");

  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [passengersCount, setPassengersCount] = useState(1);
  const [passengersList, setPassengersList] = useState("");
  const [department, setDepartment] = useState(userProfile.department || "ຫ້ອງວ່າການແຂວງຫົວພັນ");
  const [phone, setPhone] = useState(userProfile.phone || "020 ");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<VehicleBooking | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Filtered vehicle options
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchType = selectedType === "all" || v.type === selectedType;
      const matchSearch = !searchQuery || 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [vehicles, selectedType, searchQuery]);

  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  // Check for conflict live
  const conflictCheck = useMemo(() => {
    if (!selectedVehicleId || !startDate || !startTime || !endDate || !endTime) {
      return { hasConflict: false };
    }
    return checkVehicleConflict(selectedVehicleId, startDate, startTime, endDate, endTime, bookings);
  }, [selectedVehicleId, startDate, startTime, endDate, endTime, bookings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedVehicle) {
      setErrorMessage(isLao ? "ກະລຸນາເລືອກລົດທີ່ຕ້ອງການຈອງ" : "Please select a vehicle");
      return;
    }

    if (selectedVehicle.status === "maintenance") {
      setErrorMessage(isLao ? "ລົດຄັນນີ້ຢູ່ລະຫວ່າງສ້ອມແປງ ບໍ່ສາມາດຈອງໄດ້" : "This vehicle is under maintenance and cannot be booked");
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      setErrorMessage(isLao ? "ກະລຸນາລະບຸ ວັນທີ ແລະ ເວລາ ໃຫ້ຄົບຖ້ວນ" : "Please provide full dates and times");
      return;
    }

    if (new Date(`${startDate}T${startTime}`) >= new Date(`${endDate}T${endTime}`)) {
      setErrorMessage(isLao ? "ເວລາສິ້ນສຸດ ຕ້ອງຫຼາຍກວ່າ ເວລາເລີ່ມຕົ້ນ" : "End time must be after start time");
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage(isLao ? "ກະລຸນາລະບຸ ຈຸດປະສົງການໃຊ້ງານ / ວຽກງານ" : "Please specify the purpose of use");
      return;
    }

    if (!destination.trim()) {
      setErrorMessage(isLao ? "ກະລຸນາລະບຸ ຈຸດໝາຍປາຍທາງ (ແຂວງ/ເມືອງ/ສະຖານທີ່)" : "Please specify destination");
      return;
    }

    if (conflictCheck.hasConflict) {
      setErrorMessage(
        isLao 
          ? `ລົດຄັນນີ້ຖືກຈອງແລ້ວໃນຊ່ວງເວລາດັ່ງກ່າວ (ໂດຍ: ${conflictCheck.conflictingBooking?.userName} ໄປ ${conflictCheck.conflictingBooking?.destination})` 
          : "Vehicle has conflict with an existing booking in this time window"
      );
      return;
    }

    try {
      setSubmitting(true);
      const newBooking = await createVehicleBooking({
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        vehiclePlate: selectedVehicle.plateNumber,
        vehicleType: selectedVehicle.type,
        userId: userProfile.uid,
        userName: userProfile.displayName,
        userEmail: userProfile.email,
        department: department.trim() || userProfile.department,
        phone: phone.trim() || userProfile.phone,
        purpose: purpose.trim(),
        destination: destination.trim(),
        passengersCount: Number(passengersCount) || 1,
        passengersList: passengersList.trim(),
        startDate,
        startTime,
        endDate,
        endTime,
        adminNotes: notes.trim()
      });

      setSubmittedBooking(newBooking);

      showSystemToast({
        title: isLao ? "ສົ່ງຄຳຂໍຈອງລົດສຳເລັດ!" : "Booking Request Submitted!",
        message: isLao 
          ? `ຄຳຂໍຈອງ ${selectedVehicle.name} (${selectedVehicle.plateNumber}) ຖືກສົ່ງໄປຫາສູນອະນຸມັດການຈອງລົດແລ້ວ` 
          : `Your request for ${selectedVehicle.name} has been sent to the approval center.`,
        type: "success"
      });

      setBookingSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || (isLao ? "ເກີດຂໍ້ຜິດພາດໃນການຈອງ" : "Failed to submit booking"));
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#1e293b] rounded-3xl p-7 sm:p-10 border border-slate-100 dark:border-white/5 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Animated Check Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20 border-2 border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10 animate-bounce" style={{ animationDuration: '2s' }} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {isLao ? "ສົ່ງຄຳຂໍຈອງລົດບໍລິຫານສຳເລັດ!" : "Booking Request Submitted!"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {isLao
              ? "ຄຳຮ້ອງຂໍຈອງລົດຂອງທ່ານຖືກບັນທຶກ ແລະ ສົ່ງເຂົ້າສູ່ສູນອະນຸມັດການຈອງລົດຮຽບຮ້ອຍແລ້ວ. ຫ້ອງວ່າການແຂວງຈະດຳເນີນການກວດກາ, ອະນຸມັດ ແລະ ມອບໝາຍພະນັກງານຂັບລົດຕໍ່ໄປ."
              : "Your vehicle dispatch request has been submitted and registered into the approval center."}
          </p>
        </div>

        {/* Real-time Notification Dispatch Confirmation Alert Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-2 border-amber-400/50 rounded-2xl p-4 text-left flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-xs">
            <span className="font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block text-[10px]">
              {isLao ? "ລະບົບສົ່ງການແຈ້ງເຕືອນສຳເລັດ" : "NOTIFICATION DISPATCHED"}
            </span>
            <p className="text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
              {isLao 
                ? "ການແຈ້ງເຕືອນໄດ້ສົ່ງໄປຍັງ «ສູນອະນຸມັດການຈອງລົດ» ແລະ ແຈ້ງເຕືອນຜ່ານລະບົບ (Bell Notification) ພ້ອມທັງສົ່ງອີເມວຫາແອັດມິນແລ້ວ."
                : "Notification successfully delivered to the Vehicle Approval Center and System Admin."}
            </p>
          </div>
        </div>

        {selectedVehicle && (
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 text-xs text-left max-w-lg mx-auto space-y-2.5 border border-slate-200/80 dark:border-white/10 shadow-inner">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-white/10">
              <span className="text-slate-400 font-bold">{isLao ? "ພາຫະນະທີ່ຮ້ອງຂໍ:" : "Vehicle:"}</span>
              <span className="font-black text-slate-900 dark:text-white text-sm">{selectedVehicle.name} ({selectedVehicle.plateNumber})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">{isLao ? "ຈຸດໝາຍປາຍທາງ:" : "Destination:"}</span>
              <span className="font-black text-amber-600 dark:text-amber-400">{destination}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">{isLao ? "ຈຸດປະສົງ / ວຽກງານ:" : "Mission:"}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[220px]">{purpose}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">{isLao ? "ວັນທີເດີນທາງ:" : "Travel Dates:"}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{startDate} ({startTime}) {isLao ? "ຫາ" : "to"} {endDate} ({endTime})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">{isLao ? "ຜູ້ຍື່ນຈອງ:" : "Requester:"}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{userProfile.displayName} ({department})</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-white/10">
              <span className="text-slate-400 font-bold">{isLao ? "ສະຖານະປັດຈຸບັນ:" : "Current Status:"}</span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{isLao ? "ລໍຖ້າການອະນຸມັດ (Pending)" : "Pending Approval"}</span>
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          {userProfile.role === "admin" && onNavigateToAdminBookings && (
            <button
              onClick={onNavigateToAdminBookings}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-amber-300"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>{isLao ? "ໄປສູນອະນຸມັດການຈອງລົດ (Go to Approvals)" : "Go to Vehicle Approvals"}</span>
            </button>
          )}

          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-slate-200 dark:border-white/10"
            >
              <Car className="w-4 h-4 text-amber-500" />
              <span>{isLao ? "ຕິດຕາມສະຖານະລົດ (Dashboard)" : "Go to Dashboard"}</span>
            </button>
          )}

          <button
            onClick={() => {
              setBookingSuccess(false);
              setPurpose("");
              setDestination("");
              setPassengersList("");
              setSubmittedBooking(null);
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-extrabold text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            {isLao ? "+ ຈອງລົດຕື່ມອີກ" : "+ Book Another"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="vehicle-booking-form-view" className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Car className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isLao ? "ແບບຟອມຈອງລົດບໍລິຫານ (Vehicle Booking)" : "Executive Vehicle Booking"}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {isLao 
              ? "ເລືອກລົດ, ລະບຸວັນທີ-ເວລາ, ຈຸດປະສົງການໃຊ້ງານ, ຈຸດໝາຍປາຍທາງ ແລະ ຈຳນວນຜູ້ເດີນທາງ" 
              : "Select fleet vehicle, travel dates, official mission purpose, and route destination"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* STEP 1: SELECT VEHICLE (ຟັງຊັນເລືອກລົດ: ເລືອກປະເພດລົດ, ທະບຽນ) */}
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                {isLao ? "ຂັ້ນຕອນທີ 1" : "Step 1"}
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isLao ? "ເລືອກລົດທີ່ຕ້ອງການນຳໃຊ້" : "Select Fleet Vehicle"}
              </h2>
            </div>

            {/* Type filter & search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                {[
                  { id: "all", label: isLao ? "ທັງໝົດ" : "All" },
                  { id: "suv", label: "SUV" },
                  { id: "pickup", label: isLao ? "ກະບະ" : "Pickup" },
                  { id: "van", label: isLao ? "ລົດຕູ້" : "Van" },
                  { id: "sedan", label: isLao ? "ເກັງ" : "Sedan" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      selectedType === t.id
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={isLao ? "ຄົ້ນຫາທະບຽນ/ລຸ້ນ..." : "Search plate/model..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Vehicles Card Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => {
              const isSelected = selectedVehicleId === vehicle.id;
              const isMaintenance = vehicle.status === "maintenance";

              return (
                <div
                  key={vehicle.id}
                  onClick={() => {
                    if (!isMaintenance) {
                      setSelectedVehicleId(vehicle.id);
                    }
                  }}
                  className={`relative rounded-2xl border-2 p-4 transition-all flex flex-col justify-between ${
                    isMaintenance 
                      ? "opacity-60 bg-slate-50 dark:bg-slate-900/30 border-dashed border-slate-200 cursor-not-allowed"
                      : isSelected 
                      ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 cursor-pointer" 
                      : "bg-white dark:bg-[#1e293b] border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
                  }`}
                >
                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Vehicle thumbnail */}
                    <div className="h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                      {vehicle.imageUrl ? (
                        <img
                          src={vehicle.imageUrl}
                          alt={vehicle.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Car className="w-12 h-12" />
                        </div>
                      )}
                      
                      {/* Plate number */}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-amber-300 font-mono font-black text-[11px] border border-amber-400/40">
                        {vehicle.plateNumber}
                      </span>

                      {/* Status */}
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        vehicle.status === "available"
                          ? "bg-emerald-500 text-white"
                          : vehicle.status === "in_use"
                          ? "bg-blue-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}>
                        {vehicle.status === "available" ? (isLao ? "ຫວ່າງ" : "Available") : vehicle.status === "in_use" ? (isLao ? "ກຳລັງໃຊ້" : "In Use") : (isLao ? "ສ້ອມແປງ" : "Repair")}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                        {vehicle.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {vehicle.capacity} {isLao ? "ບ່ອນນັ່ງ" : "Seats"} • {vehicle.fuelType}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{isLao ? "ຄົນຂັບ:" : "Driver:"}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                      {vehicle.defaultDriver || "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 2: BOOKING DETAILS (ແບບຟອມການຈອງ: ວັນທີ-ເວລາ, ຈຸດປະສົງ, ຈຸດໝາຍປາຍທາງ) */}
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              {isLao ? "ຂັ້ນຕອນທີ 2" : "Step 2"}
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {isLao ? "ລາຍລະອຽດການເດີນທາງ ແລະ ຈຸດປະສົງວຽກງານ" : "Mission Itinerary & Details"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLao ? "ວັນທີເລີ່ມຕົ້ນ *" : "Start Date *"}</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLao ? "ເວລາເລີ່ມຕົ້ນ *" : "Start Time *"}</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLao ? "ວັນທີສິ້ນສຸດ *" : "End Date *"}</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* End Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLao ? "ເວລາສິ້ນສຸດ *" : "End Time *"}</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Time Conflict Alert */}
          {conflictCheck.hasConflict && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-start gap-3 text-xs">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">
                  {isLao ? "ແຈ້ງເຕືອນ: ລົດຄັນນີ້ມີຄຳຂໍຈອງໃນຊ່ວງເວລານີ້ແລ້ວ!" : "Vehicle Time Conflict Detected!"}
                </span>
                <span>
                  {isLao 
                    ? `ຖືກຈອງໂດຍ: ${conflictCheck.conflictingBooking?.userName} (${conflictCheck.conflictingBooking?.department}) ໄປ: ${conflictCheck.conflictingBooking?.destination} ໃນວັນທີ ${conflictCheck.conflictingBooking?.startDate} (${conflictCheck.conflictingBooking?.startTime} - ${conflictCheck.conflictingBooking?.endTime}). ກະລຸນາເລືອກລົດຄັນອື່ນ ຫຼື ປ່ຽນເວລາ.`
                    : "Please select another available vehicle or adjust your booking schedule."}
                </span>
              </div>
            </div>
          )}

          {/* Destination & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLao ? "ຈຸດໝາຍປາຍທາງ (ແຂວງ/ເມືອງ/ສະຖານທີ່) *" : "Destination *"}</span>
              </label>
              <input
                type="text"
                required
                placeholder={isLao ? "ຕົວຢ່າງ: ລົງພື້ນຖານ ເມືອງຊຳເໜືອ, ຫຼື ນະຄອນຫຼວງວຽງຈັນ..." : "e.g., Samneua District, Vientiane..."}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLao ? "ຈຸດປະສົງການໃຊ້ງານ / ເນື້ອໃນວຽກງານ *" : "Mission Purpose *"}</span>
              </label>
              <input
                type="text"
                required
                placeholder={isLao ? "ຕົວຢ່າງ: ເຂົ້າຮ່ວມກອງປະຊຸມວຽກງານແຜນການ, ກວດກາໂຄງການ..." : "e.g., Attend provincial planning meeting..."}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Passengers & Requester Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLao ? "ຈຳນວນຜູ້ເດີນທາງ (ຄົນ) *" : "Passengers Count *"}</span>
              </label>
              <input
                type="number"
                min={1}
                max={selectedVehicle?.capacity || 20}
                required
                value={passengersCount}
                onChange={(e) => setPassengersCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
              {selectedVehicle && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {isLao ? `ຄວາມຈຸສູງສຸດຂອງລົດຄັນນີ້: ${selectedVehicle.capacity} ບ່ອນນັ່ງ` : `Max capacity: ${selectedVehicle.capacity} seats`}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLao ? "ພະແນກ / ຫ້ອງການ *" : "Department *"}</span>
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLao ? "ເບີໂທຕິດຕໍ່ *" : "Contact Phone *"}</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Passengers names list & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isLao ? "ລາຍຊື່ຄະນະເດີນທາງ (ຖ້າມີ)" : "Passenger Names (Optional)"}
              </label>
              <textarea
                rows={3}
                placeholder={isLao ? "ລະບຸຊື່ ແລະ ຕຳແໜ່ງຂອງຄະນະຮ່ວມເດີນທາງ..." : "List passenger names and positions..."}
                value={passengersList}
                onChange={(e) => setPassengersList(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isLao ? "ໝາຍເຫດເພີ່ມເຕີມ" : "Additional Remarks"}
              </label>
              <textarea
                rows={3}
                placeholder={isLao ? "ຂໍ້ກຳນົດພິເສດ ຫຼື ຄວາມຕ້ອງການອື່ນໆ..." : "Any special requirements..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={submitting || conflictCheck.hasConflict}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-amber-600/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isLao ? "ກຳລັງສົ່ງຄຳຂໍ..." : "Submitting..."}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isLao ? "ສົ່ງຄຳຂໍຈອງລົດບໍລິຫານ" : "Submit Vehicle Booking Request"}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </form>

    </div>
  );
}
