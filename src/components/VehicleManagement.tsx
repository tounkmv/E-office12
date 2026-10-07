import React, { useState, useRef, useMemo } from "react";
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
  Check,
  Upload,
  Camera,
  Link as LinkIcon,
  Sparkles,
  RefreshCw,
  FileUp
} from "lucide-react";
import { Vehicle, VehicleStatus, VehicleType, AppLanguage } from "../types";
import { createVehicle, updateVehicle, deleteVehicle, setVehicleStatus } from "../lib/vehicleHelper";
import { showSystemToast } from "../utils/toast";

interface VehicleManagementProps {
  vehicles: Vehicle[];
  language: AppLanguage;
}

export const STANDARD_VEHICLE_TYPES = [
  { id: "suv", labelLo: "SUV (7 ບ່ອນນັ່ງ)", labelEn: "SUV (7 Seats)" },
  { id: "pickup", labelLo: "Pickup (ລົດກະບະ)", labelEn: "Pickup Truck" },
  { id: "van", labelLo: "Van (ລົດຕູ້ VIP)", labelEn: "VIP Van" },
  { id: "sedan", labelLo: "Sedan (ລົດເກັງ)", labelEn: "Sedan" },
  { id: "minibus", labelLo: "Minibus (ລົດເມນ້ອຍ)", labelEn: "Minibus" },
  { id: "electric", labelLo: "EV / ໄຟຟ້າ (Electric)", labelEn: "Electric Vehicle (EV)" },
  { id: "truck", labelLo: "ລົດບັນທຸກ (Truck)", labelEn: "Truck" },
  { id: "other", labelLo: "ອື່ນໆ (ກຳນົດເອງ...)", labelEn: "Other (Custom...)" },
];

const PRESET_VEHICLE_IMAGES = [
  { label: "Toyota SUV / Fortuner", url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80" },
  { label: "Toyota Hilux Pickup", url: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80" },
  { label: "Executive Van (HiAce VIP)", url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80" },
  { label: "Toyota Camry Sedan", url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80" },
  { label: "Isuzu / 4x4 Offroad", url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80" },
  { label: "Minibus / Coaster", url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80" },
  { label: "Electric SUV / EV", url: "https://images.unsplash.com/photo-1563720223523-491ff04651de?auto=format&fit=crop&w=800&q=80" },
];

const POPULAR_CUSTOM_TYPES = [
  "ລົດຈິບ 4x4",
  "ລົດກູ້ໄພສຸກເສີນ",
  "ລົດບັນທຸກນ້ອຍ 4 ລໍ້",
  "ລົດຕູ້ໂດຍສານ",
  "ລົດຈັກລາດຕະເວນ",
  "ລົດດັບເພີງ",
  "ລົດແອັດສະກອດ VIP"
];

export function getVehicleTypeDisplay(typeStr: string, isLao: boolean): string {
  const std = STANDARD_VEHICLE_TYPES.find(t => t.id === typeStr);
  if (std) return isLao ? std.labelLo : std.labelEn;
  return typeStr || (isLao ? "ອື່ນໆ" : "Other");
}

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
  const [selectedTypeCategory, setSelectedTypeCategory] = useState<string>("suv");
  const [customType, setCustomType] = useState<string>("");
  const [capacity, setCapacity] = useState(7);
  const [fuelType, setFuelType] = useState("ກາຊວນ (Diesel)");
  const [status, setStatus] = useState<VehicleStatus>("available");
  
  // Image Upload & Source Management
  const [imageUrl, setImageUrl] = useState(PRESET_VEHICLE_IMAGES[0].url);
  const [imageTab, setImageTab] = useState<"upload" | "presets" | "url">("upload");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [defaultDriver, setDefaultDriver] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [mileage, setMileage] = useState(0);
  const [department, setDepartment] = useState("ຫ້ອງວ່າການແຂວງຫົວພັນ");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Extract unique custom types already in vehicles fleet
  const customTypesInFleet = useMemo(() => {
    const stdIds = ["suv", "pickup", "van", "sedan", "minibus", "electric", "truck", "other"];
    const list = new Set<string>();
    vehicles.forEach(v => {
      if (v.type && !stdIds.includes(v.type)) {
        list.add(v.type);
      }
    });
    return Array.from(list);
  }, [vehicles]);

  const openAddModal = () => {
    setEditingVehicle(null);
    setName("");
    setPlateNumber("");
    setSelectedTypeCategory("suv");
    setCustomType("");
    setCapacity(7);
    setFuelType("ກາຊວນ (Diesel)");
    setStatus("available");
    setImageUrl(PRESET_VEHICLE_IMAGES[0].url);
    setImageTab("upload");
    setCustomUrlInput("");
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

    const standardIds = ["suv", "pickup", "van", "sedan", "minibus", "electric", "truck"];
    if (standardIds.includes(vehicle.type)) {
      setSelectedTypeCategory(vehicle.type);
      setCustomType("");
    } else {
      setSelectedTypeCategory("other");
      setCustomType(vehicle.type === "other" ? "" : vehicle.type);
    }

    setCapacity(vehicle.capacity);
    setFuelType(vehicle.fuelType);
    setStatus(vehicle.status);
    setImageUrl(vehicle.imageUrl || PRESET_VEHICLE_IMAGES[0].url);
    setImageTab("upload");
    setCustomUrlInput(vehicle.imageUrl?.startsWith("http") ? vehicle.imageUrl : "");
    setDefaultDriver(vehicle.defaultDriver || "");
    setDriverPhone(vehicle.driverPhone || "");
    setMileage(vehicle.mileage || 0);
    setDepartment(vehicle.department || "ຫ້ອງວ່າການແຂວງຫົວພັນ");
    setNotes(vehicle.notes || "");
    setIsModalOpen(true);
  };

  // Image Processing & Compression via HTML5 Canvas
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showSystemToast({
        title: isLao ? "ໄຟລ໌ບໍ່ຖືກຕ້ອງ" : "Invalid File Type",
        message: isLao ? "ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ (JPG, PNG, WEBP, GIF)" : "Please select an image file only (JPG, PNG, WEBP, GIF)",
        type: "error"
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showSystemToast({
        title: isLao ? "ໄຟລ໌ໃຫຍ່ເກີນໄປ" : "File Too Large",
        message: isLao ? "ຂະໜາດຮູບພາບບໍ່ຄວນເກີນ 20MB" : "Image size should not exceed 20MB",
        type: "error"
      });
      return;
    }

    setIsCompressingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.88);
            setImageUrl(compressed);
            showSystemToast({
              title: isLao ? "ອັບໂຫຼດຮູບສຳເລັດ" : "Image Uploaded",
              message: isLao ? "ຮູບພາບລົດໄດ້ຮັບການອັບໂຫຼດ ແລະ ປັບແຕ່ງຄວາມລະອຽດແລ້ວ" : "Vehicle photo loaded and optimized",
              type: "success"
            });
          }
        } catch (err) {
          console.error(err);
          // Fallback to raw base64 if canvas fails
          setImageUrl(event.target?.result as string);
        } finally {
          setIsCompressingImage(false);
        }
      };
      img.onerror = () => {
        setIsCompressingImage(false);
        showSystemToast({
          title: isLao ? "ເກີດຂໍ້ຜິດພາດ" : "Error",
          message: isLao ? "ບໍ່ສາມາດອ່ານໄຟລ໌ຮູບພາບໄດ້" : "Failed to load image file",
          type: "error"
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) return;
    setImageUrl(customUrlInput.trim());
    showSystemToast({
      title: isLao ? "ປັບປ່ຽນຮູບພາບ" : "Image Updated",
      message: isLao ? "ນຳໃຊ້ຮູບພາບຈາກ URL ແລ້ວ" : "Image URL applied",
      type: "info"
    });
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

    // Determine final vehicle type (support custom/other)
    const finalType: VehicleType = selectedTypeCategory === "other"
      ? (customType.trim() || (isLao ? "ອື່ນໆ" : "other"))
      : selectedTypeCategory;

    try {
      setSaving(true);
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          name: name.trim(),
          plateNumber: plateNumber.trim(),
          type: finalType,
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
          type: finalType,
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
      (v.defaultDriver && v.defaultDriver.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.type && v.type.toLowerCase().includes(searchQuery.toLowerCase()));

    const standardTypeIds = ["suv", "pickup", "van", "sedan", "minibus", "electric", "truck"];
    const matchType = typeFilter === "all" || 
      v.type === typeFilter ||
      (typeFilter === "other" && (!standardTypeIds.includes(v.type) || v.type === "other"));

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
                  ? "ເພີ່ມ, ລົບ, ແກ້ໄຂ ຂໍ້ມູນລົດ, ກຳນົດປະເພດລົດຕາມໃຈ, ອັບໂຫຼດຮູບພາບ ແລະ ປ່ຽນສະຖານະລົດ" 
                  : "Add, edit, remove vehicles, customize vehicle types and upload photos"}
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
            placeholder={isLao ? "ຄົ້ນຫາຕາມຊື່ລົດ, ເລກທະບຽນ, ປະເພດລົດ ຫຼື ຊື່ຄົນຂັບ..." : "Search by vehicle name, plate, type or driver..."}
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
            <option value="minibus">{isLao ? "ລົດເມນ້ອຍ (Minibus)" : "Minibus"}</option>
            <option value="electric">{isLao ? "ລົດໄຟຟ້າ (EV)" : "Electric (EV)"}</option>
            <option value="truck">{isLao ? "ລົດບັນທຸກ (Truck)" : "Truck"}</option>
            {customTypesInFleet.map(ct => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
            <option value="other">{isLao ? "ອື່ນໆ (Other)" : "Other"}</option>
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
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-2">
                    <Car className="w-12 h-12 stroke-[1.5]" />
                    <span className="text-[11px] font-medium">{isLao ? "ບໍ່ມີຮູບພາບ" : "No image"}</span>
                  </div>
                )}

                {/* Plate Badge */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-white font-black text-xs shadow-lg tracking-wider">
                  {vehicle.plateNumber}
                </div>

                {/* Edit / Delete Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(vehicle)}
                    className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-white hover:bg-white shadow-md transition-colors cursor-pointer"
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
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-[11px] border border-amber-500/20">
                    {getVehicleTypeDisplay(vehicle.type, isLao)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    • {vehicle.capacity} {isLao ? "ບ່ອນນັ່ງ" : "Seats"} • {vehicle.fuelType}
                  </span>
                </div>
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
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isLao ? "ຫວ່າງ" : "Available"}
                </button>
                <button
                  onClick={() => handleQuickStatusChange(vehicle.id, "in_use")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                    vehicle.status === "in_use"
                      ? "bg-blue-500 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isLao ? "ກຳລັງໃຊ້" : "In Use"}
                </button>
                <button
                  onClick={() => handleQuickStatusChange(vehicle.id, "maintenance")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                    vehicle.status === "maintenance"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isLao ? "ສ້ອມແປງ" : "Repair"}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full py-16 text-center space-y-3 bg-white dark:bg-[#1e293b] rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
            <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              {isLao ? "ບໍ່ພົບຂໍ້ມູນລົດບໍລິຫານ" : "No vehicles found"}
            </h4>
            <p className="text-xs text-slate-400">
              {isLao ? "ກະລຸນາປ່ຽນເງື່ອນໄຂການຄົ້ນຫາ ຫຼື ເພີ່ມລົດໃໝ່" : "Try adjusting your search filters or add a new vehicle"}
            </p>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-2xl bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-white/10 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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

            <form onSubmit={handleSave} className="space-y-5 text-xs">
              
              {/* Row 1: Model Name & Plate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vehicle Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {isLao ? "ຊື່ລົດ/ລຸ້ນລົດ *" : "Vehicle Model/Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isLao ? "ຕົວຢ່າງ: Toyota Fortuner Legender 4WD" : "e.g., Toyota Fortuner"}
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

              {/* Row 2: Type, Capacity, Fuel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{isLao ? "ປະເພດລົດ *" : "Vehicle Type *"}</span>
                    {selectedTypeCategory === "other" && (
                      <span className="text-[10px] text-amber-500 font-extrabold uppercase">
                        {isLao ? "ກຳນົດເອງ" : "Custom"}
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedTypeCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTypeCategory(val);
                      if (val !== "other") {
                        setCustomType("");
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    {STANDARD_VEHICLE_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isLao ? t.labelLo : t.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {isLao ? "ຈຳນວນບ່ອນນັ່ງ *" : "Seats Capacity *"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
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

              {/* Custom Vehicle Type Input (Shown when 'other' is selected) */}
              {selectedTypeCategory === "other" && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isLao ? "ກຳນົດປະເພດລົດຕາມໃຈ (Specify Custom Vehicle Type) *" : "Custom Vehicle Type *"}</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {isLao ? "ພິມລະບຸເອງ ຫຼື ຄລິກເລືອກຕົວຢ່າງລຸ່ມນີ້" : "Type custom name or pick sample"}
                    </span>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder={isLao ? "ເຊັ່ນ: ລົດຈິບ 4x4, ລົດກູ້ໄພສຸກເສີນ, ລົດບັນທຸກນ້ອຍ 4 ລໍ້, ລົດຕູ້ໂດຍສານ..." : "e.g., 4x4 Jeep, Emergency Rescue, Light Truck..."}
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {isLao ? "ຕົວຢ່າງຍອດນິຍົມ:" : "Quick samples:"}
                    </span>
                    {POPULAR_CUSTOM_TYPES.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomType(chip)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          customType === chip
                            ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                            : "bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-400"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle Status Selector */}
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
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {isLao ? "ຫວ່າງ (Available)" : "Available"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("in_use")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      status === "in_use"
                        ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {isLao ? "ກຳລັງໃຊ້ (In Use)" : "In Use"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("maintenance")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      status === "maintenance"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
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

              {/* ENHANCED VEHICLE PHOTO UPLOAD & PREVIEW SECTION */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span>{isLao ? "ຮູບພາບລົດ ແລະ ການອັບໂຫຼດ (Vehicle Photo)" : "Vehicle Photo"}</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {isLao ? "ຮອງຮັບອັບໂຫຼດໄຟລ໌, ຖ່າຍຮູບ ຫຼື ເລືອກຈາກຄັງ" : "Upload file, take photo or pick preset"}
                  </span>
                </div>

                {/* CURRENT IMAGE PREVIEW CARD */}
                {imageUrl && (
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-500/30 group shadow-md">
                    <img 
                      src={imageUrl} 
                      alt="Vehicle Preview" 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Overlay specs info */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-black text-[11px] border border-white/20">
                          {plateNumber || (isLao ? "ທະບຽນລົດ" : "Plate")}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/80 text-white font-bold text-[10px]">
                          {name || (isLao ? "ລຸ້ນລົດ" : "Vehicle Model")}
                        </span>
                      </div>
                    </div>

                    {/* Quick Clear / Replace Actions */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md hover:bg-slate-900 text-white font-bold text-[11px] border border-white/20 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isLao ? "ປ່ຽນຮູບໃໝ່" : "Change Photo"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="p-1.5 rounded-xl bg-rose-600/80 backdrop-blur-md hover:bg-rose-600 text-white cursor-pointer shadow-sm transition-all"
                        title={isLao ? "ລົບຮູບອອກ" : "Remove photo"}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TABS FOR PHOTO SELECTION */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setImageTab("upload")}
                      className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        imageTab === "upload"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isLao ? "ອັບໂຫຼດໄຟລ໌ / ຖ່າຍຮູບ" : "Upload File / Camera"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab("presets")}
                      className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        imageTab === "presets"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isLao ? "ຄັງຮູບຕົວຢ່າງມາດຕະຖານ" : "Preset Library"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab("url")}
                      className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        imageTab === "url"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isLao ? "ປ້ອນ URL ຮູບ" : "Image URL"}</span>
                    </button>
                  </div>

                  {/* TAB 1: FILE UPLOAD & DRAG & DROP */}
                  {imageTab === "upload" && (
                    <div className="space-y-3">
                      {/* Hidden native input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />

                      {/* Dropzone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                          isDragging
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 scale-[1.01]"
                            : "border-slate-300 dark:border-white/10 hover:border-amber-500/60 bg-white dark:bg-slate-800/40"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
                          {isCompressingImage ? (
                            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                          ) : (
                            <Camera className="w-6 h-6" />
                          )}
                        </div>

                        <div>
                          <p className="font-black text-slate-800 dark:text-slate-200 text-xs">
                            {isCompressingImage
                              ? (isLao ? "ກຳລັງປະມວນຜົນຮູບພາບ..." : "Processing & optimizing photo...")
                              : (isLao ? "ຄລິກເພື່ອເລືອກຮູບຈາກອຸປະກອນ ຫຼື ລາກໄຟລ໌ມາໃສ່ທີ່ນີ້" : "Click to browse device or drag and drop photo")}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {isLao 
                              ? "ຮອງຮັບໄຟລ໌ JPG, PNG, WEBP, GIF (ລະບົບປັບຂະໜາດ ແລະ ບີບອັດໃຫ້ອັດຕະໂນມັດ ຄວາມລະອຽດສູງ)" 
                              : "Supports JPG, PNG, WEBP, GIF (Auto optimized high resolution)"}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 pointer-events-none"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>{isLao ? "ເລືອກໄຟລ໌ຮູບພາບ / ຖ່າຍຮູບ" : "Browse Image File"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PRESET LIBRARY */}
                  {imageTab === "presets" && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {isLao ? "ຄລິກເລືອກຮູບລົດຕົວແທນຕາມລຸ້ນລົດທີ່ໃກ້ຄຽງ:" : "Click to select a preset government vehicle model:"}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {PRESET_VEHICLE_IMAGES.map((preset, idx) => (
                          <div
                            key={idx}
                            onClick={() => setImageUrl(preset.url)}
                            className={`group h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                              imageUrl === preset.url 
                                ? "border-amber-500 shadow-md scale-105" 
                                : "border-transparent opacity-75 hover:opacity-100"
                            }`}
                          >
                            <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                              <span className="text-[9px] font-black text-white truncate drop-shadow-xs">{preset.label}</span>
                            </div>
                            {imageUrl === preset.url && (
                              <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow-md" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: IMAGE URL */}
                  {imageTab === "url" && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {isLao ? "ປ້ອນລິ້ງຮູບພາບ (Web Image Link):" : "Direct Image URL:"}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/vehicle-photo.jpg"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-medium text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyUrl}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs cursor-pointer"
                        >
                          {isLao ? "ນຳໃຊ້" : "Apply"}
                        </button>
                      </div>
                    </div>
                  )}
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
                  disabled={saving || isCompressingImage}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-extrabold shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
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
