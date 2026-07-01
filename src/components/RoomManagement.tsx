import { useState, FormEvent } from "react";
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
  ToggleLeft
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

export default function RoomManagement({ rooms, language }: RoomManagementProps) {
  const t = translations[language];

  // Component States
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number>(30);
  const [equipment, setEquipment] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<RoomStatus>("active");

  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const triggerToast = (msg: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
    showSystemToast(msg, type, language === "lo" ? "ຈັດການຫ້ອງປະຊຸມ" : "Room Management");
  };

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setName("");
    setCapacity(30);
    setEquipment("");
    setLocation("");
    setDescription("");
    setImageUrl("");
    setStatus("active");
    setShowModal(true);
  };

  const handleOpenEdit = (room: MeetingRoom) => {
    setEditingRoom(room);
    setName(room.name);
    setCapacity(room.capacity);
    setEquipment(room.equipment.join(", "));
    setLocation(room.location);
    setDescription(room.description);
    setImageUrl(room.imageUrl || "");
    setStatus(room.status);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !capacity || !location) return;

    setLoading(true);

    const parsedEquipments = equipment
      .split(",")
      .map(item => item.trim())
      .filter(item => item.length > 0);

    try {
      if (editingRoom) {
        // Edit Room
        const updated: Partial<MeetingRoom> = {
          name,
          capacity,
          equipment: parsedEquipments,
          location,
          description,
          imageUrl,
          status
        };
        await updateRoom(editingRoom.id, updated);
        triggerToast(language === "lo" ? "ອັບເດດຂໍ້ມູນຫ້ອງປະຊຸມສຳເລັດ" : "Room updated successfully", "success");
      } else {
        // Add Room
        const newId = "room_" + Date.now();
        const newRoom: MeetingRoom = {
          id: newId,
          name,
          capacity,
          equipment: parsedEquipments,
          location,
          description,
          imageUrl: imageUrl || "/src/assets/images/medium_meeting_room_1782891824721.jpg", // default fallback
          status
        };
        await addRoom(newRoom);
        triggerToast(language === "lo" ? "ເພີ່ມຫ້ອງປະຊຸມໃໝ່ສຳເລັດ" : "New room added successfully", "success");
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
    const confirmMsg = language === "lo" 
      ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຫ້ອງປະຊຸມ "${roomName}"?`
      : `Are you sure you want to delete room "${roomName}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteRoom(roomId);
      triggerToast(language === "lo" ? "ລຶບຫ້ອງປະຊຸມສຳເລັດ" : "Room deleted successfully", "info");
    } catch (err: any) {
      console.error("Room delete error:", err);
      triggerToast(t.error + ": " + err.message, "error");
    }
  };

  return (
    <div id="room-management-view" className="space-y-6 font-sans pb-16">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 text-xs font-bold"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {t.rmManageRooms}
          </h3>
        </div>
        <button
          id="btn-add-room"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.rmAddRoom}</span>
        </button>
      </div>

      {/* Grid of rooms */}
      <div className="overflow-x-auto bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xs p-5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3 border-b border-slate-100 dark:border-white/5">
              <th className="py-3 px-4">{t.rmRoomName}</th>
              <th className="py-3 px-4">{t.rmLocation}</th>
              <th className="py-3 px-4">{t.rmCapacity}</th>
              <th className="py-3 px-4">{t.rmEquipment}</th>
              <th className="py-3 px-4">{t.status}</th>
              <th className="py-3 px-4 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center opacity-60 font-semibold">
                  {t.noData}
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded bg-slate-800 overflow-hidden relative border border-white/5 shrink-0">
                        {room.imageUrl ? (
                          <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Building2 className="w-4 h-4 mx-auto mt-2 text-slate-500" />
                        )}
                      </div>
                      <span>{room.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-semibold opacity-80">{room.location}</td>
                  <td className="py-4 px-4 font-bold text-blue-500">{room.capacity} seats</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {room.equipment.map((eq, i) => (
                        <span key={i} className="text-[9px] bg-slate-500/10 px-2 py-0.5 rounded font-semibold">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      room.status === "active" 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {room.status === "active" ? t.rmStatusActive : t.rmStatusInactive}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        id={`btn-edit-room-${room.id}`}
                        onClick={() => handleOpenEdit(room)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-all cursor-pointer"
                        title={t.edit}
                      >
                        <Edit3 className="w-4.5 h-4.5" />
                      </button>
                      <button
                        id={`btn-delete-room-${room.id}`}
                        onClick={() => handleDelete(room.id, room.name)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                        title={t.delete}
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

      {/* Room Modal Popup */}
      <AnimatePresence>
        {showModal && (
          <div id="room-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              id="room-modal-box" 
              className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-100 dark:border-white/5 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5.5 h-5.5" />
              </button>

              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-white/5 pb-3">
                <Building2 className="w-5.5 h-5.5 text-blue-500" />
                <span>{editingRoom ? t.rmEditRoom : t.rmAddRoom}</span>
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Room Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider">
                    {t.rmRoomName} *
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t.rmRoomNamePlaceholder}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Capacity */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider">
                      {t.rmCapacity} (Seats) *
                    </label>
                    <input 
                      type="number" 
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                      required
                      min={1}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider">
                      {t.rmLocation} *
                    </label>
                    <input 
                      type="text" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      placeholder={t.rmLocationPlaceholder}
                      className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                    />
                  </div>
                </div>

                {/* Equipment */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                    <ListPlus className="w-4 h-4 text-blue-500" />
                    <span>{t.rmEquipment}</span>
                  </label>
                  <input 
                    type="text" 
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder={t.rmEquipmentPlaceholder}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider">
                    {t.rmDescription}
                  </label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder={t.rmDescriptionPlaceholder}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                    <Image className="w-4 h-4 text-blue-500" />
                    <span>{t.rmImageUrl}</span>
                  </label>
                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder={t.rmImageUrlPlaceholder}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  />
                </div>

                {/* Status Toggle */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1">
                    <ToggleLeft className="w-4 h-4 text-blue-500" />
                    <span>{t.status}</span>
                  </label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as RoomStatus)}
                    className="w-full px-4 py-3 rounded-xl themed-input text-xs"
                  >
                    <option value="active">{t.rmStatusActive}</option>
                    <option value="inactive">{t.rmStatusInactive}</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-500/10 hover:bg-slate-500/15 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/10 cursor-pointer"
                  >
                    {loading ? t.loading : t.save}
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
