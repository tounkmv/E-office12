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
  Sparkles,
  Settings,
  Stamp,
  Upload,
  Trash2,
  Image as ImageIcon,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw
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

  // Official Lao Report Form Configurations (Model from ReportSystem)
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [provinceName, setProvinceName] = useState("ແຂວງຫົວພັນ");
  const [officeName, setOfficeName] = useState("ຫ້ອງວ່າການແຂວງ");
  const [docNumber, setDocNumber] = useState("109/ຫວຂ.ຫພ");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Signatory fields for print
  const [approverTitle, setApproverTitle] = useState("ຫົວໜ້າຫ້ອງວ່າການແຂວງ");
  const [approverName, setApproverName] = useState("ຄຳແພງ ວົງພະຈັນ");
  const [reporterTitle, setReporterTitle] = useState("ຜູ້ສະຫຼຸບ ແລະ ບັນທຶກລາຍງານ");
  const [reporterName, setReporterName] = useState("ຄຳຕຸ່ນ ຄໍາມະວົງ");

  // Seal & Stamp
  const [showSeal, setShowSeal] = useState(true);
  const [sealMode, setSealMode] = useState<"default" | "custom">("default");
  const [customSealUrl, setCustomSealUrl] = useState<string | null>(null);

  // Distribution Form State (ບ່ອນນຳສົ່ງ)
  const [showDistribution, setShowDistribution] = useState(true);
  const [deliverPlace, setDeliverPlace] = useState(
    `- ທ່ານເຈົ້າແຂວງ (ເພື່ອລາຍງານ)\n- ຫ້ອງວ່າການແຂວງ (ເພື່ອຕິດຕາມ)\n- ພະແນກການເງິນແຂວງ (ເພື່ອຊາບ)\n- ເກັບມ້ຽນສຳເນົາ`
  );

  const handleSealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomSealUrl(event.target.result as string);
          setSealMode("custom");
          setShowSeal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formattedDocDate = useMemo(() => {
    const parts = docDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return docDate;
  }, [docDate]);

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

      {/* ========================================================================= */}
      {/* REPORT CONFIGURATION & DISTRIBUTION FORM (print:hidden)                   */}
      {/* Modeled after ReportSystem: Editable headers, signatories & ບ່ອນນຳສົ່ງ     */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white">
            <Settings className="w-4 h-4 text-amber-500" />
            <span>{isLao ? "ຟອມປັບປຸງຮ່າງບົດລາຍງານ & ບ່ອນນຳສົ່ງ (Report Draft & Distribution Setup)" : "Report Draft & Distribution Setup"}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>{isConfigOpen ? (isLao ? "ຫຍໍ້ລົງ" : "Collapse") : (isLao ? "ຂະຫຍາຍຟອມ" : "Expand")}</span>
            {isConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isConfigOpen && (
          <div className="space-y-4 text-xs pt-1 animate-in fade-in duration-200">
            {/* Grid 1: Basic Administrative & Signatory info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ອົງການຈັດຕັ້ງ" : "Office Name"}</label>
                <input
                  type="text"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ເລກທີເອກະສານ" : "Doc Number"}</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ລົງວັນທີ" : "Reference Date"}</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ມີອຳນາດອະນຸມັດ" : "Approver Title"}</label>
                <input
                  type="text"
                  value={approverTitle}
                  onChange={(e) => setApproverTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ມີອຳນາດອະນຸມັດ" : "Approver Name"}</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder={isLao ? "ປະວ່າງຫາກບໍ່ຕ້ອງການໃສ່ຊື່" : "Leave empty if not required"}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຕຳແໜ່ງຜູ້ສັງລວມ/ບັນທຶກ" : "Compiler Title"}</label>
                <input
                  type="text"
                  value={reporterTitle}
                  onChange={(e) => setReporterTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isLao ? "ຊື່ຜູ້ສັງລວມ/ບັນທຶກ" : "Compiler Name"}</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Seal Toggle */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowSeal(!showSeal)}
                  className={`w-full p-2 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                    showSeal 
                      ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold" 
                      : "border-slate-200 dark:border-white/10 text-slate-500"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    <Stamp className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isLao ? "ກາປະທັບທາງການ" : "Official Stamp"}</span>
                  </span>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${showSeal ? "bg-amber-600 text-white" : "bg-slate-300"}`}>
                    {showSeal && <Check className="w-3 h-3" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Sub-Section: Distribution List Form (ບ່ອນນຳສົ່ງ ໃຫ້ສ້າງເປັນຟອມ ເພື່ອສາມາດປັບປ່ຽນໄດ້) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800 dark:text-white text-xs">
                    {isLao ? "ຟອມປັບປຸງບ່ອນນຳສົ່ງ (Distribution List Form):" : "Distribution List Form:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDistribution(!showDistribution)}
                    className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    {showDistribution ? (isLao ? "[ເຊື່ອງບ່ອນນຳສົ່ງ]" : "[Hide]") : (isLao ? "[ສະແດງບ່ອນນຳສົ່ງ]" : "[Show]")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliverPlace(`- ທ່ານເຈົ້າແຂວງ (ເພື່ອລາຍງານ)\n- ຫ້ອງວ່າການແຂວງ (ເພື່ອຕິດຕາມ)\n- ພະແນກການເງິນແຂວງ (ເພື່ອຊາບ)\n- ເກັບມ້ຽນສຳເນົາ`)}
                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isLao ? "ຄືນຄ່າມາດຕະຖານ" : "Reset Default"}</span>
                </button>
              </div>

              {showDistribution && (
                <>
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400 font-semibold">{isLao ? "ເພີ່ມດ່ວນ:" : "Quick add:"}</span>
                    {[
                      { label: "- ທ່ານເຈົ້າແຂວງ", text: "- ທ່ານເຈົ້າແຂວງ (ເພື່ອລາຍງານ)" },
                      { label: "- ຫ້ອງວ່າການແຂວງ", text: "- ຫ້ອງວ່າການແຂວງ (ເພື່ອຕິດຕາມ)" },
                      { label: "- ພະແນກການເງິນ", text: "- ພະແນກການເງິນແຂວງ (ເພື່ອຊາບ)" },
                      { label: "- ບັນດາພະແນກການ", text: "- ບັນດາພະແນກການອ້ອມຂ້າງ (ເພື່ອຊາບ)" },
                      { label: "- ເກັບມ້ຽນສຳເນົາ", text: "- ເກັບມ້ຽນສຳເນົາ" }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!deliverPlace.includes(chip.text)) {
                            setDeliverPlace(prev => prev ? `${prev}\n${chip.text}` : chip.text);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        + {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Editable Distribution Textarea */}
                  <textarea
                    rows={3}
                    value={deliverPlace}
                    onChange={(e) => setDeliverPlace(e.target.value)}
                    placeholder={isLao ? "ປ້ອນບັນຊີບ່ອນນຳສົ່ງ (ແຍກແຕ່ລະແຖວ)..." : "Type distribution list (line by line)..."}
                    className="w-full text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed resize-none"
                  />
                </>
              )}
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
            <p>{provinceName}</p>
            <p className="font-extrabold">{officeName}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">ເລກທີ: {docNumber}</p>
            <p>ຊຳເໜືອ, ລົງວັນທີ: {formattedDocDate}</p>
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

        {/* OFFICIAL SIGN-OFF BLOCK: (Approver on Left with seal, Compiler on Right, Distribution underneath - Modeled after ReportSystem) */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-xs font-sans">
          
          {/* Left Column: Approver with seal + Distribution underneath */}
          <div className="flex flex-col justify-between">
            <div className="text-center space-y-1">
              <p className="font-bold uppercase text-xs text-slate-950">{approverTitle}</p>
              
              {/* Space for Seal Stamp */}
              {showSeal ? (
                sealMode === "custom" && customSealUrl ? (
                  <div className="my-2 flex items-center justify-center min-h-[75px]">
                    <img
                      src={customSealUrl}
                      alt="Official Seal"
                      className="w-20 h-20 object-contain filter select-none"
                    />
                  </div>
                ) : (
                  <div className="relative my-2 flex items-center justify-center min-h-[75px] select-none">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-500/50 flex flex-col items-center justify-center p-1 text-center">
                      <span className="text-[6px] text-red-500 font-bold leading-none">{officeName}</span>
                      <span className="text-[7px] text-red-500 font-black leading-tight my-0.5">{provinceName}</span>
                      <span className="text-[5px] text-red-500">OFFICIAL SEAL</span>
                    </div>
                    <div className="absolute text-[7px] text-red-500 font-bold border border-red-500/30 px-1 py-0.5 rotate-[-12deg] bg-white/95">
                      ບ່ອນປະທັບຕາ
                    </div>
                  </div>
                )
              ) : (
                <div className="h-20" />
              )}

              <div className="pt-1 text-center w-full">
                <p className="font-bold text-slate-400">......................................................</p>
                <p className="font-bold text-slate-900 text-xs mt-1">{approverName}</p>
              </div>
            </div>

            {/* Distribution List (ບ່ອນນຳສົ່ງ) Underneath Approver */}
            {showDistribution && (
              <div className="pt-4 mt-4 border-t border-dashed border-slate-300 text-left">
                <span className="font-bold underline text-[11px] block uppercase text-slate-900">
                  ບ່ອນນຳສົ່ງ (Distribution List):
                </span>
                <div className="text-[10px] text-slate-700 whitespace-pre-line leading-relaxed font-medium pl-1 mt-1">
                  {deliverPlace || (isLao ? "(ບໍ່ມີຂໍ້ມູນບ່ອນນຳສົ່ງ)" : "(No distribution text)")}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Report Compiler */}
          <div className="text-center flex flex-col items-center justify-between">
            <div className="space-y-1 w-full">
              <p className="font-bold uppercase text-xs text-slate-950">{reporterTitle}</p>
            </div>

            {/* Signature spacing matching standard official height */}
            <div className="min-h-[85px] flex items-center justify-center" />

            <div className="pt-1 text-center w-full">
              <p className="font-bold text-slate-400">......................................................</p>
              <p className="font-bold text-slate-900 text-xs mt-1">{reporterName}</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
