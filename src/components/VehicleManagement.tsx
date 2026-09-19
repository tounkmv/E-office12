import React, { useState } from "react";
import { 
  Car, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  AlertCircle, 
  X, 
  Save, 
  Search, 
  Filter, 
  Phone, 
  UserCheck, 
  Fuel, 
  Image as ImageIcon,
  Check
} from "lucide-react";
import { Vehicle, VehicleStatus, VehicleType, AppLanguage } from "../types";
import { createVehicle, updateVehicle, deleteVehicle, setVehicleStatus } from "../lib/vehicleHelper";
import { showSystemToast } from "../utils/toast";

interface VehicleManagementProps {
  vehicles: Vehicle[];
  language: AppLanguage;
}

const PRESET_VEHICLE_IMAGES = [
  { label: "Toyota SUV / Fortuner", url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80" },
  { label: "Toyota Hilux Pickup", url: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80" },
  { label: "Executive Van", url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80" },
  { label: "Toyota Camry Sedan", url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80" },
  { label: "Isuzu / 4x4 Offroad", url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80" },
];

export default function VehicleManagement({
  vehicles,
  language
}: VehicleManagementProps) {
  const isLao = language === "lo";

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form inputs
  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [type, setType] = useState<VehicleType>("suv");
  const [capacity, setCapacity] = useState(7);
  const [fuelType, setFuelType] = useState("ກາຊວນ (Diesel)");
  const [status, setStatus] = useState<VehicleStatus>("available");
  const [imageUrl, setImageUrl] = useState(PRESET_VEHICLE_IMAGES[0].url);
  const [defaultDriver, setDefaultDriver] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [mileage, setMileage] = useState(0);
  const [department, setDepartment] = useState("ຫ້ອງວ່າການແຂວງຫົວພັນ");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingVehicle(null);
    setName("");
    setPlateNumber("");
    setType("suv");
    setCapacity(7);
    setFuelType("ກາຊວນ (Diesel)");
    setStatus("available");
    setImageUrl(PRESET_VEHICLE_IMAGES[0].url);
    setDefaultDriver("");
    setDriverPhone("");
    setMileage(0);
    setDepartment("ຫ້ອງວ່າການແຂວງຫົວພັນ");
    setNotes("");
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setName(vehicle.name);
    setPlateNumber(vehicle.plateNumber);
    setType(vehicle.type);
    setCapacity(vehicle.capacity);
    setFuelType(vehicle.fuelType);
    setStatus(vehicle.status);
    setImageUrl(vehicle.imageUrl || PRESET_VEHICLE_IMAGES[0].url);
    setDefaultDriver(vehicle.defaultDriver || "");
    setDriverPhone(vehicle.driverPhone || "");
    setMileage(vehicle.mileage || 0);
    setDepartment(vehicle.department || "ຫ້ອງວ່າການແຂວງຫົວພັນ");
    setNotes(vehicle.notes || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !plateNumber.trim()) {
      showSystemToast({
        title: isLao ? "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ" : "Incomplete Details",
        message: isLao ? "ກະລຸນາປ້ອນຊື່ລົດ ແລະ ເລກທະບຽນ" : "Please input vehicle name and plate number",
        type: "error"
      });
      return;
    }

    try {
      setSaving(true);
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          name: name.trim(),
          plateNumber: plateNumber.trim(),
          type,
          capacity: Number(capacity) || 5,
          fuelType,
          status,
          imageUrl,
          defaultDriver: defaultDriver.trim(),
          driverPhone: driverPhone.trim(),
          mileage: Number(mileage) || 0,
          department: department.trim(),
          notes: notes.trim()
        });
        showSystemToast({
          title: isLao ? "ແກ້ໄຂຂໍ້ມູນລົດສຳເລັດ" : "Vehicle Updated",
          message: isLao ? `ປັບປຸງຂໍ້ມູນ ${plateNumber} ແລ້ວ` : "Vehicle updated successfully",
          type: "success"
        });
      } else {
        await createVehicle({
          name: name.trim(),
          plateNumber: plateNumber.trim(),
          type,
          capacity: Number(capacity) || 5,
          fuelType,
          status,
          imageUrl,
          defaultDriver: defaultDriver.trim(),
          driverPhone: driverPhone.trim(),
          mileage: Number(mileage) || 0,
          department: department.trim(),
          notes: notes.trim()
        });
        showSystemToast({
          title: isLao ? "ເພີ່ມລົດໃໝ່ສຳເລັດ" : "Vehicle Added",
          message: isLao ? `ເພີ່ມ ${name} (${plateNumber}) ເຂົ້າສູ່ລະບົບແລ້ວ` : "New vehicle created successfully",
          type: "success"
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showSystemToast({
        title: isLao ? "ເກີດຂໍ້ຜິດພາດ" : "Error",
        message: err.message || "Failed to save vehicle",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (vehicleId: string, newStatus: VehicleStatus) => {
    try {
      await setVehicleStatus(vehicleId, newStatus);
      showSystemToast({
        title: isLao ? "ປ່ຽນສະຖານະສຳເລັດ" : "Status Changed",
        message: isLao 
          ? `ປ່ຽນສະຖານະລົດເປັນ: ${newStatus === "available" ? "ຫວ່າງ" : newStatus === "in_use" ? "ກຳລັງໃຊ້" : "ສ້ອມແປງ"}`
          : `Status changed to ${newStatus}`,
        type: "info"
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      await deleteVehicle(vehicleId);
      setDeleteConfirmId(null);
      showSystemToast({
        title: isLao ? "ລົບລົດສຳເລັດ" : "Vehicle Deleted",
        message: isLao ? "ລົບຂໍ້ມູນລົດອອກຈາກລະບົບແລ້ວ" : "Vehicle removed successfully",
        type: "success"
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchSearch = !searchQuery || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.defaultDriver && v.defaultDriver.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = typeFilter === "all" || v.type === typeFilter;
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div id="vehicle-management-admin-view" className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isLao ? "ຈັດການຂໍ້ມູນລົດບໍລິຫານ (Admin Fleet)" : "Vehicle Fleet Management"}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isLao 
                  ? "ເພີ່ມ, ລົບ, ແກ້ໄຂ ຂໍ້ມູນລົດ, ກຳນົດຄົນຂັບປະຈຳ ແລະ ປ່ຽນສະຖານະລົດ (ຫວ່າງ, ບໍ່ຫວ່າງ, ຢູ່ລະຫວ່າງສ້ອມແປງ)" 
                  : "Add, edit, remove vehicles and toggle availability status"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isLao ? "+ ເພີ່ມລົດໃໝ່" : "+ Add Vehicle"}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={isLao ? "ຄົ້ນຫາຕາມຊື່ລົດ, ເລກທະບຽນ ຫຼື ຊື່ຄົນຂັບ..." : "Search by vehicle name, plate or driver..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">{isLao ? "ທຸກປະເພດລົດ" : "All Vehicle Types"}</option>
            <option value="suv">SUV</option>
            <option value="pickup">{isLao ? "ລົດກະບະ (Pickup)" : "Pickup"}</option>
            <option value="van">{isLao ? "ລົດຕູ້ (Van)" : "Van"}</option>
            <option value="sedan">{isLao ? "ລົດເກັງ (Sedan)" : "Sedan"}</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">{isLao ? "ທຸກສະຖານະ" : "All Statuses"}</option>
            <option value="available">{isLao ? "ຫວ່າງ (Available)" : "Available"}</option>
            <option value="in_use">{isLao ? "ກຳລັງໃຊ້ (In Use)" : "In Use"}</option>
            <option value="maintenance">{isLao ? "ສ້ອມແປງ (Maintenance)" : "Maintenance"}</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-white dark:bg-[#1e293b] rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Image & Plate */}
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                {vehicle.imageUrl ? (
                  <img
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Car className="w-16 h-16" />
                  </div>
                )}

                {/* Floating Plate Number */}
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-950/85 text-amber-300 font-mono font-black text-xs border border-amber-400/50 shadow-md">
                  {vehicle.plateNumber}
                </div>

                {/* Edit / Delete Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(vehicle)}
                    className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-amber-600 shadow-md transition-colors cursor-pointer"
                    title={isLao ? "ແກ້ໄຂ" : "Edit"}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(vehicle.id)}
                    className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-rose-500 hover:text-rose-600 shadow-md transition-colors cursor-pointer"
                    title={isLao ? "ລົບ" : "Delete"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Specs */}
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                  {vehicle.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {vehicle.type.toUpperCase()} • {vehicle.capacity} {isLao ? "ບ່ອນນັ່ງ" : "Seats"} • {vehicle.fuelType}
                </p>
              </div>

              {/* Driver & Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">{isLao ? "ຄົນຂັບປະຈຳ:" : "Driver:"}</span>
                  <span className="font-bold">{vehicle.defaultDriver || "—"}</span>
                </div>
                {vehicle.driverPhone && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">{isLao ? "ເບີໂທ:" : "Phone:"}</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{vehicle.driverPhone}</span>
                  </div>
                )}
                {vehicle.notes && (
                  <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    📝 {vehicle.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Status Selector: ຫວ່າງ (available) / ບໍ່ຫວ່າງ (in_use) / ສ້ອມແປງ (maintenance) */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {isLao ? "ປ່ຽນສະຖານະລົດດ່ວນ:" : "Quick Status Toggle:"}
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] font-extrabold">
                <button
                  onClick={() => handleQuickStatusChange(vehicle.id, "available")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                    vehicle.status === "available"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-slate-500 hover:text-emerald-600"
                  }`}
                >
                  {isLao ? "ຫວ່າງ" : "Avail"}
                </button>
                <button
                  onClick={() => handleQuickStatusChange(vehicle.id, "in_use")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                    vehicle.status === "in_use"
                      ? "bg-blue-500 text-white shadow-xs"
                      : "text-slate-500 hover:text-blue-600"
                  }`}
                >
                  {isLao ? "ກຳລັງໃຊ້" : "In Use"}
                </button>
                <button
                  onClick={() => handleQuickStatusChange(vehicle.id, "maintenance")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                    vehicle.status === "maintenance"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-500 hover:text-amber-600"
                  }`}
                >
                  {isLao ? "ສ້ອມແປງ" : "Repair"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-xl bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {editingVehicle 
                      ? (isLao ? "ແກ້ໄຂຂໍ້ມູນລົດ" : "Edit Vehicle") 
                      : (isLao ? "ເພີ່ມລົດບໍລິຫານໃໝ່" : "Add New Fleet Vehicle")}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {isLao ? "ກຳນົດລາຍລະອຽດ, ທະບຽນ, ຄວາມຈຸ ແລະ ຄົນຂັບປະຈຳ" : "Vehicle specifications and assigned driver"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vehicle Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {isLao ? "ຊື່ລົດ/ລຸ້ນລົດ *" : "Vehicle Model/Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isLao ? "ຕົວຢ່າງ: Toyota Fortuner Legender" : "e.g., Toyota Fortuner"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Plate Number */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {isLao ? "ເລກທະບຽນລົດ *" : "License Plate *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isLao ? "ຕົວຢ່າງ: ກກ 8899 ຫົວພັນ" : "e.g., KK 8899 HP"}
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Type */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {isLao ? "ປະເພດລົດ *" : "Vehicle Type *"}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as VehicleType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="suv">SUV (7 ບ່ອນນັ່ງ)</option>
                    <option value="pickup">Pickup (ລົດກະບະ)</option>
                    <option value="van">Van (ລົດຕູ້ VIP)</option>
                    <option value="sedan">Sedan (ລົດເກັງ)</option>
                    <option value="minibus">Minibus</option>
                  </select>
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {isLao ? "ຈຳນວນບ່ອນນັ່ງ *" : "Seats Capacity *"}
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Fuel Type */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {isLao ? "ປະເພດນ້ຳມັນ *" : "Fuel Type *"}
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ກາຊວນ (Diesel)">ກາຊວນ (Diesel)</option>
                    <option value="ແອັດຊັງ (Gasoline)">ແອັດຊັງ (Gasoline)</option>
                    <option value="ໄຮບຣິດ (Hybrid)">ໄຮບຣິດ (Hybrid)</option>
                    <option value="ໄຟຟ້າ (EV)">ໄຟຟ້າ (EV)</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isLao ? "ສະຖານະເລີ່ມຕົ້ນ *" : "Vehicle Status *"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("available")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      status === "available"
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {isLao ? "ຫວ່າງ (Available)" : "Available"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("in_use")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      status === "in_use"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {isLao ? "ກຳລັງໃຊ້ (In Use)" : "In Use"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("maintenance")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      status === "maintenance"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {isLao ? "ສ້ອມແປງ (Repair)" : "Repair"}
                  </button>
                </div>
              </div>

              {/* Driver Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {isLao ? "ຊື່ພະນັກງານຂັບລົດປະຈຳ" : "Default Driver Name"}
                  </label>
                  <input
                    type="text"
                    placeholder={isLao ? "ຕົວຢ່າງ: ທ້າວ ສົມສັກ ວົງໄຊ" : "Driver name"}
                    value={defaultDriver}
                    onChange={(e) => setDefaultDriver(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Image Preset Picker */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isLao ? "ເລືອກຮູບພາບຕົວແທນລົດ" : "Select Vehicle Photo"}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_VEHICLE_IMAGES.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => setImageUrl(preset.url)}
                      className={`h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                        imageUrl === preset.url ? "border-amber-500 shadow-md scale-105" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      {imageUrl === preset.url && (
                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isLao ? "ໝາຍເຫດ / ລາຍລະອຽດເພີ່ມເຕີມ" : "Notes / Specifications"}
                </label>
                <textarea
                  rows={2}
                  placeholder={isLao ? "ເຊັ່ນ: ລົດປະຈຳການນຳພາ, ຕາຕະລາງປ່ຽນນ້ຳມັນ..." : "Details..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {isLao ? "ຍົກເລີກ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-extrabold shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? (isLao ? "ກຳລັງບັນທຶກ..." : "Saving...") : (isLao ? "ບັນທຶກຂໍ້ມູນ" : "Save")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isLao ? "ຢືນຢັນການລົບລົດຄັນນີ້?" : "Confirm Delete Vehicle?"}
              </h3>
              <p className="text-xs text-slate-400">
                {isLao ? "ຂໍ້ມູນລົດຈະຖືກລົບອອກຈາກລະບົບຢ່າງຖາວອນ." : "This vehicle will be permanently deleted."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                {isLao ? "ຍົກເລີກ" : "Cancel"}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {isLao ? "ລົບອອກ" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
