import React, { useState, FormEvent, useRef } from "react";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  FolderKanban, 
  X, 
  Building2, 
  Users, 
  MapPin, 
  ListPlus,
  Image,
  CheckCircle,
  ToggleLeft,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Upload,
  Camera,
  Check,
  AlertCircle,
  Layers,
  Armchair,
  FileText
} from "lucide-react";
import { AppLanguage, MeetingRoom, RoomStatus } from "../types";
import { translations } from "../lib/translations";
import { addRoom, deleteRoom, updateRoom } from "../lib/firebaseHelper";
import { showSystemToast } from "../utils/toast";
import { motion, AnimatePresence } from "motion/react";

interface RoomManagementProps {
  rooms: MeetingRoom[];
  language: AppLanguage;
}

// Preset Luxury Room Images for quick picking
const PRESET_ROOM_IMAGES = [
  { id: "img1", name: "Large Conference Room", url: "/src/assets/images/large_conference_room_1782891812375.jpg" },
  { id: "img2", name: "Medium Meeting Room", url: "/src/assets/images/medium_meeting_room_1782891824721.jpg" },
  { id: "img3", name: "VIP Meeting Room", url: "/src/assets/images/vip_meeting_room_1782891837889.jpg" },
  { id: "img4", name: "Executive Suite", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80" },
  { id: "img5", name: "Glass Boardroom", url: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80" },
  { id: "img6", name: "Creative Hub", url: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80" },
];

// Preset Equipment items for 1-click toggling
const PRESET_EQUIPMENT_CHIPS = [
  "ໂປຣເຈັກເຕີ 4K / Projector 4K",
  "ກະດານອັດສະລິຍະ / Smart Whiteboard",
  "ລະບົບປະຊຸມທາງໄກ / Video Conf",
  "ໄມໂຄຣໂຟນໄຮ້ສາຍ / Wireless Mic",
  "ລະບົບສຽງອ້ອມທິດ / Surround Sound",
  "ແອເຢັນ 2 ທິດທາງ / Dual AC",
  "ໜ້າຈໍ LED 85 ນິ້ວ / 85\" LED TV",
  "Wi-Fi 6 ຄວາມໄວສູງ / Wi-Fi 6",
  "ປລັກໄຟທຸກທີ່ນັ່ງ / Power Outlets",
  "ເຄື່ອງດື່ມ & ກາເຟ / Refreshments"
];

export default function RoomManagement({ rooms, language }: RoomManagementProps) {
  const t = translations[language];
  const isLao = language === "lo";

  // Component States
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Form Fields
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number>(30);
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [customEquipmentInput, setCustomEquipmentInput] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<RoomStatus>("active");

  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
    showSystemToast(msg, type, isLao ? "ຈັດການຫ້ອງປະຊຸມ" : "Room Management");
  };

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setName("");
    setCapacity(30);
    setEquipmentList(["ໂປຣເຈັກເຕີ 4K / Projector 4K", "Wi-Fi 6 ຄວາມໄວສູງ / Wi-Fi 6"]);
    setCustomEquipmentInput("");
    setLocation(isLao ? "ຊັ້ນ 2 ອາຄານສຳນັກງານໃຫຍ່" : "2nd Floor, Main Office Building");
    setDescription("");
    setImageUrl(PRESET_ROOM_IMAGES[0].url);
    setStatus("active");
    setShowModal(true);
  };

  const handleOpenEdit = (room: MeetingRoom) => {
    setEditingRoom(room);
    setName(room.name);
    setCapacity(room.capacity);
    setEquipmentList(room.equipment || []);
    setCustomEquipmentInput("");
    setLocation(room.location);
    setDescription(room.description);
    setImageUrl(room.imageUrl || PRESET_ROOM_IMAGES[0].url);
    setStatus(room.status);
    setShowModal(true);
  };

  // Toggle equipment item in array
  const toggleEquipmentChip = (chip: string) => {
    if (equipmentList.includes(chip)) {
      setEquipmentList(equipmentList.filter(item => item !== chip));
    } else {
      setEquipmentList([...equipmentList, chip]);
    }
  };

  // Add custom equipment from input
  const handleAddCustomEquipment = (e: FormEvent) => {
    e.preventDefault();
    if (!customEquipmentInput.trim()) return;
    if (!equipmentList.includes(customEquipmentInput.trim())) {
      setEquipmentList([...equipmentList, customEquipmentInput.trim()]);
    }
    setCustomEquipmentInput("");
  };

  // Handle image upload from computer PC
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showSystemToast(
        isLao ? "ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ (PNG, JPG, WebP)!" : "Please select an image file only!",
        "error",
        isLao ? "ຂໍ້ຜິດພາດ" : "Error"
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
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
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.90);
          setImageUrl(compressedBase64);
          showSystemToast(
            isLao ? "ອັບໂຫຼດຮູບຫ້ອງປະຊຸມສຳເລັດແລ້ວ!" : "Room photo uploaded successfully!",
            "success",
            isLao ? "ອັບໂຫຼດຮູບພາບ" : "Image Uploaded"
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !capacity || !location) return;

    setLoading(true);

    // Merge custom input if left pending
    let finalEquipment = [...equipmentList];
    if (customEquipmentInput.trim() && !finalEquipment.includes(customEquipmentInput.trim())) {
      finalEquipment.push(customEquipmentInput.trim());
    }

    try {
      if (editingRoom) {
        // Edit Room
        const updated: Partial<MeetingRoom> = {
          name,
          capacity,
          equipment: finalEquipment,
          location,
          description,
          imageUrl: imageUrl || PRESET_ROOM_IMAGES[0].url,
          status
        };
        await updateRoom(editingRoom.id, updated);
        triggerToast(isLao ? "ອັບເດດຂໍ້ມູນຫ້ອງປະຊຸມສຳເລັດແລ້ວ" : "Room updated successfully", "success");
      } else {
        // Add Room
        const newId = "room_" + Date.now();
        const newRoom: MeetingRoom = {
          id: newId,
          name,
          capacity,
          equipment: finalEquipment,
          location,
          description,
          imageUrl: imageUrl || PRESET_ROOM_IMAGES[0].url,
          status
        };
        await addRoom(newRoom);
        triggerToast(isLao ? "ເພີ່ມຫ້ອງປະຊຸມໃໝ່ເຂົ້າລະບົບສຳເລັດແລ້ວ" : "New room added successfully", "success");
      }
      setShowModal(false);
    } catch (err: any) {
      console.error("Room save error:", err);
      triggerToast(t.error + ": " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roomId: string, roomName: string) => {
    const confirmMsg = isLao 
      ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຫ້ອງປະຊຸມ "${roomName}" ອອກຈາກລະບົບ?`
      : `Are you sure you want to delete room "${roomName}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteRoom(roomId);
      triggerToast(isLao ? "ລຶບຫ້ອງປະຊຸມອອກຈາກລະບົບສຳເລັດ" : "Room deleted successfully", "info");
    } catch (err: any) {
      console.error("Room delete error:", err);
      triggerToast(t.error + ": " + err.message, "error");
    }
  };

  // Filter rooms based on query and status
  const filteredRooms = rooms.filter(room => {
    const matchQuery = searchQuery.trim() === "" || 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.equipment.some(eq => eq.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchStatus = statusFilter === "all" || room.status === statusFilter;
    return matchQuery && matchStatus;
  });

  // Calculate quick stats
  const totalRoomsCount = rooms.length;
  const activeRoomsCount = rooms.filter(r => r.status === "active").length;
  const totalCapacitySeats = rooms.reduce((acc, curr) => acc + (curr.capacity || 0), 0);

  return (
    <div id="room-management-view" className="space-y-6 font-sans pb-16 animate-fade-in">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 text-xs font-bold border border-emerald-400/30 backdrop-blur-md"
          >
            <CheckCircle className="w-5 h-5 shrink-0 animate-pulse text-amber-300" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO SECTION HEADER WITH VIBRANT COLOR TONE BANNER */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              <span>{isLao ? "ລະບົບຈັດການຫ້ອງປະຊຸມ ແລະ ຄວາມພ້ອມ" : "Executive Meeting Suites Management"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <FolderKanban className="w-8 h-8 text-amber-300 shrink-0" />
              <span>{isLao ? "ການຈັດການຫ້ອງປະຊຸມ (Room Management)" : t.rmManageRooms}</span>
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-relaxed">
              {isLao 
                ? "ບໍລິຫານຈັດການຂໍ້ມູນຫ້ອງປະຊຸມ, ອຸປະກອນອຳນວຍຄວາມສະດວກ, ຂະໜາດຄວາມຈຸ ແລະ ກວດສອບສະຖານະຄວາມພ້ອມໃຊ້ງານໃນລະບົບ" 
                : "Manage meeting suites, conference equipment, seating capacities, and real-time availability status across all offices."}
            </p>
          </div>

          <div className="shrink-0 flex items-center">
            <button
              id="btn-add-room"
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 px-5 sm:px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:shadow-[0_0_35px_rgba(251,191,36,0.6)] cursor-pointer active:scale-95 group shrink-0"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-950/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4 font-black" />
              </div>
              <span>{isLao ? "➕ ເພີ່ມຫ້ອງປະຊຸມໃໝ່" : t.rmAddRoom}</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Badges inside the Hero Banner */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-200 border border-blue-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-indigo-200 font-bold uppercase">{isLao ? "ຫ້ອງປະຊຸມທັງໝົດ" : "Total Rooms"}</p>
              <p className="text-lg font-black text-white">{totalRoomsCount} {isLao ? "ຫ້ອງ" : "Rooms"}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 border border-emerald-400/30">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-indigo-200 font-bold uppercase">{isLao ? "ພ້ອມເປີດໃຊ້ງານ" : "Active Available"}</p>
              <p className="text-lg font-black text-emerald-300">{activeRoomsCount} {isLao ? "ຫ້ອງ" : "Active"}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-200 border border-purple-400/30">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-indigo-200 font-bold uppercase">{isLao ? "ຄວາມຈຸທີ່ນັ່ງລວມ" : "Total Capacity"}</p>
              <p className="text-lg font-black text-amber-300">{totalCapacitySeats} {isLao ? "ທີ່ນັ່ງ" : "Seats"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION HEADER WITH TONE BADGE: ROOM LIST CONTROLS & FILTERS */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Section Header Title Tone Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-teal-600 to-indigo-600 text-white px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm shrink-0">
            <Layers className="w-4 h-4 text-amber-300" />
            <span>{isLao ? "ລາຍການຫ້ອງປະຊຸມໃນລະບົບ" : "Registered Meeting Suites"}</span>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            ({filteredRooms.length} {isLao ? "ລາຍການ" : "items"})
          </span>
        </div>

        {/* Controls: Search + Status Filter + View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isLao ? "ຄົ້ນຫາຊື່ຫ້ອງ, ສະຖານທີ່, ອຸປະກອນ..." : "Search rooms, location..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer"
          >
            <option value="all">{isLao ? "ສະຖານະທັງໝົດ (All)" : "All Status"}</option>
            <option value="active">{isLao ? "🟢 ເປີດໃຊ້ງານ (Active)" : "Active Only"}</option>
            <option value="inactive">{isLao ? "🔴 ປິດຊົ່ວຄາວ (Inactive)" : "Inactive Only"}</option>
          </select>

          {/* View Switcher Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title={isLao ? "ສະແດງແບບບັດຮູບພາບ" : "Grid Cards View"}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isLao ? "ບັດຮູບ" : "Cards"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title={isLao ? "ສະແດງແບບຕາຕະລາງ" : "Table View"}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isLao ? "ຕາຕະລາງ" : "Table"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ROOM CATALOG DISPLAY (GRID VIEW vs TABLE VIEW) */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-12 text-center border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {isLao ? "ບໍ່ພົບຂໍ້ມູນຫ້ອງປະຊຸມຕາມເງື່ອນໄຂທີ່ຄົ້ນຫາ" : "No meeting rooms matched your search"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isLao ? "ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ຄລິກປຸ່ມ '➕ ເພີ່ມຫ້ອງປະຊຸມໃໝ່' ດ້ານເທີງເພື່ອເພີ່ມຫ້ອງໃໝ່" : "Try adjusting filters or click 'Add Room' above to register a new suite."}
            </p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARDS VIEW - LUXURY EXECUTIVE SUITE STYLE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1e293b] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-md hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col group relative"
            >
              {/* Image Hero Header Banner of Card */}
              <div className="h-48 w-full relative overflow-hidden bg-slate-900">
                {room.imageUrl ? (
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-indigo-400/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {/* Floating Status Pill */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase shadow-md backdrop-blur-md flex items-center gap-1.5 border ${
                    room.status === "active"
                      ? "bg-emerald-500/90 text-white border-emerald-400/40"
                      : "bg-red-500/90 text-white border-red-400/40"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${room.status === "active" ? "bg-white animate-ping" : "bg-white"}`} />
                    <span>{room.status === "active" ? (isLao ? "ພ້ອມເປີດໃຊ້ງານ" : "Active Available") : (isLao ? "ປິດຊົ່ວຄາວ" : "Inactive")}</span>
                  </span>
                </div>

                {/* Floating Seating Capacity Badge */}
                <div className="absolute bottom-3 left-3 z-10">
                  <span className="px-3 py-1 rounded-xl bg-blue-600/90 text-white text-xs font-black tracking-wide shadow-md backdrop-blur-md flex items-center gap-1.5 border border-blue-400/30">
                    <Armchair className="w-3.5 h-3.5 text-amber-300" />
                    <span>{room.capacity} {isLao ? "ທີ່ນັ່ງ (Seats)" : "Seats"}</span>
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                      {room.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{room.location}</span>
                  </p>

                  {room.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-normal pt-1">
                      {room.description}
                    </p>
                  )}
                </div>

                {/* Equipment Chips Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <ListPlus className="w-3 h-3 text-indigo-500" />
                    <span>{isLao ? "ສິ່ງອຳນວຍຄວາມສະດວກ:" : "Equipment:"}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {room.equipment && room.equipment.length > 0 ? (
                      room.equipment.slice(0, 4).map((eq, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg font-semibold border border-slate-200/60 dark:border-white/5">
                          {eq}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">{isLao ? "ບໍ່ໄດ້ລະບຸອຸປະກອນ" : "No equipment listed"}</span>
                    )}
                    {room.equipment && room.equipment.length > 4 && (
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-lg">
                        +{room.equipment.length - 4} {isLao ? "ອື່ນໆ" : "more"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Bar Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2">
                  <button
                    id={`btn-edit-room-${room.id}`}
                    onClick={() => handleOpenEdit(room)}
                    className="flex-1 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title={t.edit}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isLao ? "ແກ້ໄຂຂໍ້ມູນ" : "Edit Room"}</span>
                  </button>
                  <button
                    id={`btn-delete-room-${room.id}`}
                    onClick={() => handleDelete(room.id, room.name)}
                    className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    title={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW - SLEEK PROFESSIONAL CATALOG */
        <div className="overflow-x-auto bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 via-indigo-50/50 to-slate-100 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 pb-3 border-b border-slate-200 dark:border-white/10">
                <th className="py-3.5 px-4 rounded-l-xl">{isLao ? "ຊື່ຫ້ອງປະຊຸມ & ຮູບພາບ" : t.rmRoomName}</th>
                <th className="py-3.5 px-4">{isLao ? "ທີ່ຕັ້ງ / ສະຖານທີ່" : t.rmLocation}</th>
                <th className="py-3.5 px-4">{isLao ? "ຄວາມຈຸ" : t.rmCapacity}</th>
                <th className="py-3.5 px-4">{isLao ? "ອຸປະກອນອຳນວຍຄວາມສະດວກ" : t.rmEquipment}</th>
                <th className="py-3.5 px-4">{isLao ? "ສະຖານະ" : t.status}</th>
                <th className="py-3.5 px-4 text-center rounded-r-xl">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-medium">
              {filteredRooms.map((room) => (
                <tr key={room.id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-10 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-200 dark:border-white/10 shadow-sm shrink-0">
                        {room.imageUrl ? (
                          <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Building2 className="w-5 h-5 mx-auto mt-2.5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-extrabold block">{room.name}</span>
                        {room.description && <span className="text-[11px] text-slate-400 font-normal truncate max-w-xs block">{room.description}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{room.location}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-extrabold border border-blue-200 dark:border-blue-800/50">
                      {room.capacity} {isLao ? "ທີ່ນັ່ງ" : "seats"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {room.equipment && room.equipment.map((eq, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg font-semibold">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                      room.status === "active" 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${room.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                      <span>{room.status === "active" ? (isLao ? "ພ້ອມໃຊ້ງານ" : "Active") : (isLao ? "ປິດຊົ່ວຄາວ" : "Inactive")}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        id={`btn-edit-room-${room.id}`}
                        onClick={() => handleOpenEdit(room)}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title={t.edit}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isLao ? "ແກ້ໄຂ" : "Edit"}</span>
                      </button>
                      <button
                        id={`btn-delete-room-${room.id}`}
                        onClick={() => handleDelete(room.id, room.name)}
                        className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. UPGRADED MODERN ADD/EDIT ROOM MODAL WITH COLORED GRADIENT SECTION HEADERS */}
      <AnimatePresence>
        {showModal && (
          <div id="room-modal-overlay" className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              id="room-modal-box" 
              className="bg-white dark:bg-[#0f172a] rounded-3xl max-w-2xl w-full border-2 border-indigo-500/30 dark:border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] overflow-hidden relative flex flex-col max-h-[92vh]"
            >
              {/* Modal Header Banner Tone: Dynamic Gradient based on Edit vs Add */}
              <div className={`p-5 sm:p-6 text-white flex items-center justify-between shadow-lg relative overflow-hidden shrink-0 ${
                editingRoom 
                  ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600"
              }`}>
                <div className="absolute top-0 right-10 w-36 h-36 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-md shrink-0">
                    <Building2 className="w-6 h-6 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                      {editingRoom 
                        ? (isLao ? "ແກ້ໄຂຂໍ້ມູນຫ້ອງປະຊຸມ (Edit Meeting Suite)" : t.rmEditRoom)
                        : (isLao ? "➕ ເພີ່ມຫ້ອງປະຊຸມໃໝ່ເຂົ້າລະບົບ (Add New Room)" : t.rmAddRoom)
                      }
                    </h3>
                    <p className="text-xs text-indigo-100 font-medium mt-0.5">
                      {isLao 
                        ? "ກຳນົດລາຍລະອຽດ, ຂະໜາດຄວາມຈຸ, ອຸປະກອນ ແລະ ອັບໂຫຼດຮູບພາບຫ້ອງປະຊຸມ" 
                        : "Configure suite details, seating capacity, equipment chips and room cover image."}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer relative z-10 shrink-0 shadow-sm"
                  title={t.cancel}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body with 4 Distinct Colored Section Header Banners */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                
                {/* SECTION 1: BASIC INFO (Blue & Indigo Tone Header) */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs">
                    <FileText className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>{isLao ? "1. ຂໍ້ມູນພື້ນຖານຫ້ອງປະຊຸມ (Basic Room Info)" : "1. Basic Room Information"}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isLao ? "ຊື່ຫ້ອງປະຊຸມ *" : "Room Name *"}
                      </label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder={isLao ? "ຕົວຢ່າງ: ຫ້ອງປະຊຸມໃຫຍ່ VIP 1, ຫ້ອງປະຊຸມກະດານບໍລິຫານ..." : t.rmRoomNamePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isLao ? "ຄຳອະທິບາຍ / ຈຸດປະສົງການໃຊ້ງານ" : "Description / Usage Scope"}
                      </label>
                      <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder={isLao ? "ຕົວຢ່າງ: ເໝາະສຳລັບການປະຊຸມຜູ້ບໍລິຫານ, ຕ້ອນຮັບແຂກ VIP, ປະຊຸມທາງໄກ..." : t.rmDescriptionPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CAPACITY & LOCATION (Teal & Emerald Tone Header) */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
                  <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs">
                    <Users className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>{isLao ? "2. ຂະໜາດຄວາມຈຸ & ທີ່ຕັ້ງສະຖານທີ່ (Capacity & Location)" : "2. Seating Capacity & Location"}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Capacity with Step Buttons */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isLao ? "ຄວາມຈຸທີ່ນັ່ງ (ທີ່ນັ່ງ/Seats) *" : "Seating Capacity (Seats) *"}
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={capacity}
                          onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                          required
                          min={1}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-extrabold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setCapacity(Math.max(1, capacity - 5))}
                          className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-black cursor-pointer shrink-0"
                          title="-5 seats"
                        >-5</button>
                        <button
                          type="button"
                          onClick={() => setCapacity(capacity + 5)}
                          className="px-2.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 hover:bg-teal-100 text-xs font-black cursor-pointer shrink-0"
                          title="+5 seats"
                        >+5</button>
                        <button
                          type="button"
                          onClick={() => setCapacity(capacity + 10)}
                          className="px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-black cursor-pointer shrink-0"
                          title="+10 seats"
                        >+10</button>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isLao ? "ທີ່ຕັ້ງ / ຊັ້ນ / ອາຄານ *" : "Location / Floor / Building *"}
                      </label>
                      <input 
                        type="text" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        placeholder={isLao ? "ຕົວຢ່າງ: ຊັ້ນ 2 ອາຄານສຳນັກງານໃຫຍ່, ຝັ່ງປີກຂວາ..." : t.rmLocationPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: EQUIPMENT CHIPS (Violet & Purple Tone Header) */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <ListPlus className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>{isLao ? "3. ອຸປະກອນ & ສິ່ງອຳນວຍຄວາມສະດວກ (Equipment Chips)" : "3. Equipment & Amenities"}</span>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold">
                      {equipmentList.length} {isLao ? "ລາຍການທີ່ເລືອກ" : "selected"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {isLao ? "ຄລິກເລືອກອຸປະກອນສຳເລັດຮູບດ້ານລຸ່ມເພື່ອເພີ່ມ/ລຶບ ອັດຕະໂນມັດ:" : "Click preset equipment chips below to toggle:"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_EQUIPMENT_CHIPS.map((chip, idx) => {
                        const isSelected = equipmentList.includes(chip);
                        return (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => toggleEquipmentChip(chip)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-transparent shadow-xs scale-105"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-amber-300" : "bg-slate-300 dark:bg-slate-600"}`} />
                            <span>{chip}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom equipment item input */}
                    <div className="pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={isLao ? "ຫຼື ພິມເພີ່ມອຸປະກອນອື່ນໆທີ່ບໍ່ມີໃນລາຍການ... ແລ້ວກົດ 'ເພີ່ມ'" : "Or type custom equipment item..."}
                          value={customEquipmentInput}
                          onChange={(e) => setCustomEquipmentInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomEquipment(e); } }}
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomEquipment}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                        >
                          {isLao ? "+ ເພີ່ມ" : "+ Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: ROOM PHOTO & OPERATIONAL STATUS (Amber & Orange Tone Header) */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs">
                    <Image className="w-4 h-4 text-white shrink-0" />
                    <span>{isLao ? "4. ຮູບພາບຫ້ອງປະຊຸມ & ສະຖານະຄວາມພ້ອມ (Photo & Status)" : "4. Room Cover Photo & Status"}</span>
                  </div>

                  <div className="space-y-4">
                    {/* Hero Image Showcase Banner inside modal */}
                    <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-md bg-slate-900 group/img">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Room Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Building2 className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transform scale-95 group-hover/img:scale-100 transition-transform"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{isLao ? "ຄລິກປ່ຽນຮູບພາບ" : "Change Cover Photo"}</span>
                        </button>
                      </div>
                      <span className="absolute top-3 left-3 bg-slate-950/80 text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border border-white/20 backdrop-blur-md">
                        {isLao ? "ຕົວຢ່າງຮູບຫ້ອງປະຊຸມ" : "Cover Preview"}
                      </span>
                    </div>

                    {/* Preset Luxury Room Thumbnails */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                        {isLao ? "ເລືອກຈາກຮູບຫ້ອງປະຊຸມສຳເລັດຮູບໃນລະບົບ (6 ຮູບແບບ):" : "Pick preset luxury room cover (6 styles):"}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {PRESET_ROOM_IMAGES.map((preset) => (
                          <button
                            type="button"
                            key={preset.id}
                            onClick={() => setImageUrl(preset.url)}
                            className={`h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative ${
                              imageUrl === preset.url
                                ? "border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-sm"
                                : "border-transparent opacity-75 hover:opacity-100"
                            }`}
                            title={preset.name}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Drag and Drop PC File Upload & URL Input in 2-Col Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* PC Upload Box */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl px-4 py-3 text-center transition-all cursor-pointer flex items-center justify-center gap-3 ${
                          isDragging
                            ? "border-amber-500 bg-amber-500/10 text-amber-600 scale-[1.01]"
                            : "border-slate-300 hover:border-amber-500 hover:bg-white dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Upload className={`w-4 h-4 ${isDragging ? "animate-bounce text-slate-950" : ""}`} />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-xs font-black text-amber-600 dark:text-amber-400 truncate">
                            {isLao ? "ອັບໂຫຼດຮູບຈາກຄອມພິວເຕີ" : "Upload file from PC"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {isLao ? "PNG, JPG ປັບຂະໜາດອັດຕະໂນມັດ" : "Auto resized & compressed"}
                          </p>
                        </div>
                      </div>

                      {/* URL input */}
                      <div className="flex flex-col justify-center">
                        <input
                          type="url"
                          placeholder={isLao ? "ຫຼື ວາງລິ້ງ URL ຮູບພາບຈາກອິນເຕີເນັດ..." : "Or paste image Link URL..."}
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Operational Status Selector Pills */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-white/10">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                        {isLao ? "ສະຖານະຄວາມພ້ອມເປີດໃຊ້ງານຂອງຫ້ອງປະຊຸມ *" : "Operational Availability Status *"}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setStatus("active")}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider ${
                            status === "active"
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                              : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-500 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${status === "active" ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                          <span>{isLao ? "🟢 ພ້ອມເປີດໃຊ້ງານ (Active)" : "Active Available"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus("inactive")}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider ${
                            status === "inactive"
                              ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm"
                              : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-500 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${status === "inactive" ? "bg-red-500" : "bg-slate-400"}`} />
                          <span>{isLao ? "🔴 ປິດປັບປຸງຊົ່ວຄາວ (Inactive)" : "Inactive / Maintenance"}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {isLao ? "ຍົກເລີກ" : t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                    ) : (
                      <Check className="w-4 h-4 shrink-0" />
                    )}
                    <span>
                      {loading 
                        ? (isLao ? "ກຳລັງບັນທຶກ..." : t.loading)
                        : editingRoom 
                          ? (isLao ? "ບັນທຶກການແກ້ໄຂຫ້ອງ" : t.save)
                          : (isLao ? "ບັນທຶກຫ້ອງປະຊຸມໃໝ່" : "Create Room Suite")
                      }
                    </span>
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

