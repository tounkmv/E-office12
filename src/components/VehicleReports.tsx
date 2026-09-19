import React, { useState, useMemo, useRef } from "react";
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  Building2, 
  Car, 
  UserCheck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  FileText,
  Search,
  Sparkles
} from "lucide-react";
import { VehicleBooking, Vehicle, AppLanguage } from "../types";
import emblemLogo from "../assets/images/emblem.png";
import emblemSvg from "../assets/images/emblem.svg";

interface VehicleReportsProps {
  bookings: VehicleBooking[];
  vehicles: Vehicle[];
  language: AppLanguage;
}

export default function VehicleReports({
  bookings,
  vehicles,
  language
}: VehicleReportsProps) {
  const isLao = language === "lo";

  // Filter States
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"all" | "today" | "week" | "month" | "year" | "custom">("month");
  
  const todayStr = new Date().toISOString().split("T")[0];
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Signatory fields for print
  const [approverTitle, setApproverTitle] = useState("ຫົວໜ້າຫ້ອງວ່າການແຂວງ");
  const [approverName, setApproverName] = useState("ຄຳແພງ ວົງພະຈັນ");
  const [reporterTitle, setReporterTitle] = useState("ຜູ້ສະຫຼຸບ ແລະ ບັນທຶກລາຍງານ");
  const [reporterName, setReporterName] = useState("ຄຳຕຸ່ນ ຄໍາມະວົງ");
  const [deliverPlace, setDeliverPlace] = useState("ຫ້ອງວ່າການແຂວງຫົວພັນ\nພະແນກການເງິນແຂວງ\nເກັບມ້ຽນສຳເນົາ");

  // Extract unique departments from bookings
  const departments = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach(b => {
      if (b.department) set.add(b.department.trim());
    });
    return Array.from(set);
  }, [bookings]);

  // Filtered dataset
  const filteredBookings = useMemo(() => {
    const now = new Date();
    
    return bookings.filter(b => {
      // 1. Vehicle filter
      if (selectedVehicleId !== "all" && b.vehicleId !== selectedVehicleId) {
        return false;
      }

      // 2. Department filter
      if (selectedDepartment !== "all" && b.department !== selectedDepartment) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus !== "all" && b.status !== selectedStatus) {
        return false;
      }

      // 4. Time range filter
      if (timeRange === "today") {
        return b.startDate === todayStr || (b.endDate && b.endDate >= todayStr && b.startDate <= todayStr);
      } else if (timeRange === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfWeekStr = startOfWeek.toISOString().split("T")[0];
        return b.startDate >= startOfWeekStr;
      } else if (timeRange === "month") {
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        return b.startDate.startsWith(monthStr);
      } else if (timeRange === "year") {
        const yearStr = `${now.getFullYear()}`;
        return b.startDate.startsWith(yearStr);
      } else if (timeRange === "custom") {
        return b.startDate >= customStartDate && b.startDate <= customEndDate;
      }

      return true;
    });
  }, [bookings, selectedVehicleId, selectedDepartment, selectedStatus, timeRange, todayStr, customStartDate, customEndDate]);

  // Summary Metrics
  const totalTrips = filteredBookings.length;
  const approvedTrips = filteredBookings.filter(b => b.status === "approved" || b.status === "completed").length;
  const totalPassengers = filteredBookings.reduce((sum, b) => sum + (b.passengersCount || 1), 0);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Vehicle Name",
      "License Plate",
      "Requester",
      "Department",
      "Phone",
      "Destination",
      "Purpose",
      "Passengers",
      "Start Date",
      "Start Time",
      "End Date",
      "End Time",
      "Driver",
      "Status"
    ];

    const rows = filteredBookings.map(b => [
      b.id,
      `"${b.vehicleName.replace(/"/g, '""')}"`,
      `"${b.vehiclePlate.replace(/"/g, '""')}"`,
      `"${b.userName.replace(/"/g, '""')}"`,
      `"${b.department.replace(/"/g, '""')}"`,
      `"${b.phone.replace(/"/g, '""')}"`,
      `"${b.destination.replace(/"/g, '""')}"`,
      `"${b.purpose.replace(/"/g, '""')}"`,
      b.passengersCount,
      b.startDate,
      b.startTime,
      b.endDate,
      b.endTime,
      `"${(b.assignedDriver || "").replace(/"/g, '""')}"`,
      b.status
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Vehicle_Report_Houaphanh_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="vehicle-reports-view" className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isLao ? "ບົດລາຍງານການນຳໃຊ້ລົດບໍລິຫານ (Vehicle Reports)" : "Vehicle Fleet Usage Reports"}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isLao 
                  ? "ສະຫຼຸບ ແລະ Export ລາຍງານ ເປັນ ເວລາ, ວັນ, ເດືອນ, ປີ ແຍກຕາມລົດ ຫຼື ແຍກຕາມແຜນກ" 
                  : "Filter, summarize, and export vehicle usage reports by period, vehicle, or department"}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isLao ? "Export CSV" : "Export CSV"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{isLao ? "ພິມບົດລາຍງານ (Print)" : "Print Report"}</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS (print:hidden) */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-amber-500" />
          <span>{isLao ? "ຕົວກັ່ນກອງລາຍງານ (Report Filters)" : "Report Filters"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Time Range Filter (ເວລາ, ວັນ, ເດືອນ, ປີ) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>{isLao ? "ຊ່ວງເວລາ (Period)" : "Time Period"}</span>
            </label>
            <select
              value={timeRange}
              onChange={(e: any) => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white"
            >
              <option value="all">{isLao ? "ທັງໝົດ (All Time)" : "All Time"}</option>
              <option value="today">{isLao ? "ມື້ນີ້ (Today)" : "Today"}</option>
              <option value="week">{isLao ? "ອາທິດນີ້ (This Week)" : "This Week"}</option>
              <option value="month">{isLao ? "ເດືອນນີ້ (This Month)" : "This Month"}</option>
              <option value="year">{isLao ? "ປີນີ້ (This Year)" : "This Year"}</option>
              <option value="custom">{isLao ? "ກຳນົດເອງ (Custom Range)" : "Custom Range"}</option>
            </select>
          </div>

          {/* Filter by Vehicle (ກັ່ນກອງລາຍງານແຍກຕາມ ລົດແຕ່ລະຄັນ) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-amber-500" />
              <span>{isLao ? "ແຍກຕາມລົດແຕ່ລະຄັນ (Vehicle)" : "Vehicle Fleet"}</span>
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white"
            >
              <option value="all">{isLao ? "ທຸກຄັນ (All Vehicles)" : "All Vehicles"}</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.plateNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Department (ແຍກຕາມແຜນກ) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span>{isLao ? "ແຍກຕາມແຜນກ (Department)" : "Department"}</span>
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white"
            >
              <option value="all">{isLao ? "ທຸກພະແນກ (All Departments)" : "All Departments"}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              <span>{isLao ? "ສະຖານະ (Status)" : "Status"}</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white"
            >
              <option value="all">{isLao ? "ທຸກສະຖານະ (All)" : "All Statuses"}</option>
              <option value="approved">{isLao ? "ອະນຸມັດແລ້ວ (Approved)" : "Approved"}</option>
              <option value="completed">{isLao ? "ສຳເລັດແລ້ວ (Completed)" : "Completed"}</option>
              <option value="pending">{isLao ? "ລໍຖ້າອະນຸມັດ (Pending)" : "Pending"}</option>
              <option value="rejected">{isLao ? "ປະຕິເສດ (Rejected)" : "Rejected"}</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range if selected */}
        {timeRange === "custom" && (
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">{isLao ? "ແຕ່ວັນທີ:" : "From:"}</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">{isLao ? "ຫາວັນທີ:" : "To:"}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
          </div>
        )}
      </div>

      {/* METRIC SUMMARY CARDS (print:hidden) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400">{isLao ? "ຈຳນວນຖ້ຽວເດີນທາງທັງໝົດ" : "Total Missions"}</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalTrips}</span>
            <span className="text-xs text-slate-400">{isLao ? "ຖ້ຽວ" : "trips"}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400">{isLao ? "ຖ້ຽວທີ່ໄດ້ຮັບອະນຸມັດ/ສຳເລັດ" : "Approved / Dispatched"}</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{approvedTrips}</span>
            <span className="text-xs text-slate-400">{isLao ? "ຖ້ຽວ" : "trips"}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400">{isLao ? "ຈຳນວນພະນັກງານທີ່ຮ່ວມເດີນທາງ" : "Total Passengers"}</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalPassengers}</span>
            <span className="text-xs text-slate-400">{isLao ? "ເທື່ອຄົນ" : "persons"}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL PRINTABLE REPORT DOCUMENT (Styled for both Screen & Print Preview) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-white text-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl space-y-8 print:shadow-none print:border-none print:p-0">
        
        {/* Official Lao Government Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto mb-2">
            <img 
              src={emblemLogo} 
              alt="National Emblem" 
              className="w-full h-full object-contain mx-auto"
              onError={(e) => {
                if (e.currentTarget.src !== emblemSvg) {
                  e.currentTarget.src = emblemSvg;
                }
              }}
            />
          </div>
          <p className="text-sm font-black tracking-wide">
            ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
          </p>
          <p className="text-xs font-bold tracking-widest">
            ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
          </p>
          <div className="w-36 h-0.5 bg-slate-900 mx-auto my-1" />
        </div>

        {/* Provincial Office Header */}
        <div className="flex justify-between items-start text-xs font-bold">
          <div>
            <p>ແຂວງຫົວພັນ</p>
            <p>ຫ້ອງວ່າການແຂວງຫົວພັນ</p>
          </div>
          <div className="text-right">
            <p>ເລກທີ: ......./ຫວຂ.ຮພ</p>
            <p>ວັນທີ: {new Date().toLocaleDateString("lo-LA")}</p>
          </div>
        </div>

        {/* Report Document Title */}
        <div className="text-center space-y-1 pt-2">
          <h2 className="text-lg font-black uppercase underline decoration-2 underline-offset-4">
            ບົດສະຫຼຸບລາຍງານ ການນຳໃຊ້ລົດບໍລິຫານລັດຖະການ
          </h2>
          <p className="text-xs font-medium text-slate-600">
            {timeRange === "month" 
              ? `ປະຈຳເດືອນ ${new Date().getMonth() + 1} ປີ ${new Date().getFullYear()}`
              : timeRange === "year"
              ? `ປະຈຳປີ ${new Date().getFullYear()}`
              : `ໄລຍະ: ${timeRange === "today" ? todayStr : `${filteredBookings.length} ລາຍການ`}`}
          </p>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 font-black text-slate-800">
                <th className="border border-slate-300 p-2 text-center w-10">ລ/ດ</th>
                <th className="border border-slate-300 p-2">ຊື່ລົດ & ເລກທະບຽນ</th>
                <th className="border border-slate-300 p-2">ຜູ້ຂໍຈອງ & ພະແນກ</th>
                <th className="border border-slate-300 p-2">ຈຸດໝາຍປາຍທາງ</th>
                <th className="border border-slate-300 p-2">ຈຸດປະສົງວຽກງານ</th>
                <th className="border border-slate-300 p-2 text-center">ວັນທີ-ເວລາ</th>
                <th className="border border-slate-300 p-2">ຄົນຂັບລົດ</th>
                <th className="border border-slate-300 p-2 text-center">ສະຖານະ</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-slate-300 p-6 text-center text-slate-400">
                    ບໍ່ມີຂໍ້ມູນລາຍການຈອງລົດໃນຊ່ວງເວລານີ້
                  </td>
                </tr>
              ) : (
                filteredBookings.map((trip, idx) => (
                  <tr key={trip.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-bold">
                      {trip.vehicleName}
                      <span className="block text-[10px] font-mono text-slate-600">{trip.vehiclePlate}</span>
                    </td>
                    <td className="border border-slate-300 p-2">
                      <span className="font-semibold block">{trip.userName}</span>
                      <span className="text-[10px] text-slate-500">{trip.department} ({trip.phone})</span>
                    </td>
                    <td className="border border-slate-300 p-2 font-semibold">{trip.destination}</td>
                    <td className="border border-slate-300 p-2">{trip.purpose}</td>
                    <td className="border border-slate-300 p-2 text-center text-[10px]">
                      {trip.startDate} {trip.endDate && trip.endDate !== trip.startDate ? `ຫາ ${trip.endDate}` : ""}
                      <span className="block text-slate-500">{trip.startTime} - {trip.endTime}</span>
                    </td>
                    <td className="border border-slate-300 p-2 font-medium">
                      {trip.assignedDriver || "—"}
                      {trip.driverPhone && <span className="block text-[10px] text-slate-500">{trip.driverPhone}</span>}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-[10px]">
                      {trip.status === "approved" ? "ອະນຸມັດ" : trip.status === "completed" ? "ສຳເລັດ" : trip.status === "pending" ? "ລໍຖ້າ" : "ປະຕິເສດ"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SUMMARY STATS ROW IN DOCUMENT */}
        <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-200">
          <span>ຈຳນວນຖ້ຽວເດີນທາງລວມ: {totalTrips} ຖ້ຽວ</span>
          <span>ຖ້ຽວທີ່ອະນຸມັດ: {approvedTrips} ຖ້ຽວ</span>
          <span>ຈຳນວນຄົນຮ່ວມເດີນທາງ: {totalPassengers} ເທື່ອຄົນ</span>
        </div>

        {/* OFFICIAL SIGN-OFF BLOCK: (Approver on Left with space for seal, Compiler on Right, Distribution underneath) */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-xs">
          
          {/* Left Column: Approver with seal spacing + Distribution underneath */}
          <div className="space-y-6">
            <div className="space-y-1">
              <input
                type="text"
                value={approverTitle}
                onChange={(e) => setApproverTitle(e.target.value)}
                className="font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-amber-500 outline-none w-full print:border-none"
              />
              
              {/* Generous space for Official Stamp and Signature */}
              <div className="h-28 flex items-center justify-start text-slate-300 text-[10px] italic">
                (ຈ້ຳກາປະທັບ ແລະ ລົງລາຍເຊັນ)
              </div>

              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-amber-500 outline-none w-full print:border-none"
              />
            </div>

            {/* Distribution List (ບ່ອນນຳສົ່ງ) Underneath Approver */}
            <div className="pt-4 border-t border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 block text-[11px]">ບ່ອນນຳສົ່ງ:</span>
              <textarea
                rows={3}
                value={deliverPlace}
                onChange={(e) => setDeliverPlace(e.target.value)}
                className="w-full text-[11px] text-slate-600 bg-transparent border-b border-dashed border-slate-300 focus:border-amber-500 outline-none resize-none print:border-none"
              />
            </div>
          </div>

          {/* Right Column: Report Compiler */}
          <div className="space-y-1 text-right">
            <input
              type="text"
              value={reporterTitle}
              onChange={(e) => setReporterTitle(e.target.value)}
              className="font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-amber-500 outline-none text-right w-full print:border-none"
            />

            <div className="h-28 flex items-center justify-end text-slate-300 text-[10px] italic">
              (ລົງລາຍເຊັນ)
            </div>

            <input
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-amber-500 outline-none text-right w-full print:border-none"
            />
          </div>

        </div>

      </div>

    </div>
  );
}
