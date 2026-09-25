import React, { useState } from "react";
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  FileText,
  Users
} from "lucide-react";
import { 
  LeadershipActivity, 
  ActivityCategory, 
  ActivityStatus, 
  ActivityPriority, 
  UserProfile, 
  AppLanguage 
} from "../types";
import { 
  createLeadershipActivity, 
  updateLeadershipActivity,
  PROVINCIAL_DEPARTMENTS,
  POSITION_TITLES
} from "../lib/activityHelper";

interface LeadershipActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  language: AppLanguage;
  activityToEdit?: LeadershipActivity | null;
  initialDate?: string;
  onSuccess?: () => void;
}

export default function LeadershipActivityForm({
  isOpen,
  onClose,
  userProfile,
  language,
  activityToEdit,
  initialDate,
  onSuccess
}: LeadershipActivityFormProps) {
  const isLao = language === "lo";
  const isEdit = !!activityToEdit;

  const todayStr = initialDate || new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState(activityToEdit?.title || "");
  const [description, setDescription] = useState(activityToEdit?.description || "");
  const [category, setCategory] = useState<ActivityCategory>(activityToEdit?.category || "meeting");
  const [department, setDepartment] = useState(activityToEdit?.department || userProfile.department || PROVINCIAL_DEPARTMENTS[0]);
  const [roleTitle, setRoleTitle] = useState(activityToEdit?.roleTitle || (userProfile.role === "admin" ? "ຫົວໜ້າຫ້ອງວ່າການແຂວງ" : "ຫົວໜ້າຂະແໜງ"));
  const [location, setLocation] = useState(activityToEdit?.location || "ຫ້ອງວ່າການແຂວງຫົວພັນ");
  const [startDate, setStartDate] = useState(activityToEdit?.startDate || todayStr);
  const [startTime, setStartTime] = useState(activityToEdit?.startTime || "08:30");
  const [endDate, setEndDate] = useState(activityToEdit?.endDate || todayStr);
  const [endTime, setEndTime] = useState(activityToEdit?.endTime || "11:30");
  const [status, setStatus] = useState<ActivityStatus>(activityToEdit?.status || "scheduled");
  const [priority, setPriority] = useState<ActivityPriority>(activityToEdit?.priority || "normal");
  const [participants, setParticipants] = useState(activityToEdit?.participants || "");
  const [outcome, setOutcome] = useState(activityToEdit?.outcome || "");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg(isLao ? "ກະລຸນາປ້ອນຫົວຂໍ້ການເຄື່ອນໄຫວວຽກ" : "Please enter the activity title");
      return;
    }

    if (startDate > endDate) {
      setErrorMsg(isLao ? "ວັນທີເລີ່ມຕົ້ນຕ້ອງບໍ່ເກີນວັນທີສິ້ນສຸດ" : "Start date cannot be later than end date");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (isEdit && activityToEdit) {
        await updateLeadershipActivity(activityToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          department,
          roleTitle,
          location: location.trim(),
          startDate,
          startTime,
          endDate,
          endTime,
          status,
          priority,
          participants: participants.trim(),
          outcome: outcome.trim()
        });
      } else {
        await createLeadershipActivity({
          userId: userProfile.uid,
          userName: userProfile.displayName || "ຜູ້ໃຊ້ງານ",
          userEmail: userProfile.email,
          roleTitle,
          department,
          title: title.trim(),
          description: description.trim(),
          category,
          location: location.trim(),
          startDate,
          startTime,
          endDate,
          endTime,
          status,
          priority,
          participants: participants.trim(),
          outcome: outcome.trim()
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error saving activity:", err);
      setErrorMsg(err.message || (isLao ? "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ" : "Error saving activity"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {isEdit 
                  ? (isLao ? "ແກ້ໄຂການເຄື່ອນໄຫວວຽກ" : "Edit Work Activity") 
                  : (isLao ? "ເພີ່ມການເຄື່ອນໄຫວວຽກໃໝ່" : "Add New Work Activity")}
              </h3>
              <p className="text-xs text-slate-300">
                {isLao ? "ຕິດຕາມການເຄື່ອນໄຫວວຽກຂອງຄະນະ, ຫົວໜ້າພະແນກ ແລະ ຂະແໜງ" : "Executive & Department Duty Tracker"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isLao ? "ຫົວຂໍ້ການເຄື່ອນໄຫວວຽກ *" : "Activity Title *"}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isLao ? "ຕົວຢ່າງ: ເປັນປະທານກອງປະຊຸມຄະນະບໍລິຫານງານ, ລົງກວດກາໂຄງການ..." : "e.g. Chairing executive meeting, project inspection..."}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Department & Role Title Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isLao ? "ພະແນກ / ຂະແໜງ *" : "Department / Division *"}
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {PROVINCIAL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isLao ? "ຕຳແໜ່ງ / ໜ້າທີ່ *" : "Position / Role Title *"}
              </label>
              <select
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {POSITION_TITLES.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category, Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isLao ? "ປະເພດວຽກ *" : "Category *"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="meeting">{isLao ? "ກອງປະຊຸມ" : "Meeting"}</option>
                <option value="mission">{isLao ? "ລົງເຄື່ອນໄຫວ/ພາລະກິດ" : "Mission"}</option>
                <option value="inspection">{isLao ? "ລົງກວດກາ/ຕິດຕາມວຽກ" : "Inspection"}</option>
                <option value="ceremony">{isLao ? "ພິທີການ/ຕ້ອນຮັບ" : "Ceremony"}</option>
                <option value="internal">{isLao ? "ວຽກພາຍໃນຫ້ອງການ" : "Internal Office"}</option>
                <option value="training">{isLao ? "ຝຶກອົບຮົມ/ສຳມະນາ" : "Training"}</option>
                <option value="other">{isLao ? "ວຽກງານອື່ນໆ" : "Other"}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isLao ? "ສະຖານະ *" : "Status *"}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ActivityStatus)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="scheduled">{isLao ? "ມີແຜນກຳນົດ" : "Scheduled"}</option>
                <option value="in_progress">{isLao ? "ພວມປະຕິບັດ" : "In Progress"}</option>
                <option value="completed">{isLao ? "ສຳເລັດແລ້ວ" : "Completed"}</option>
                <option value="cancelled">{isLao ? "ຍົກເລີກ" : "Cancelled"}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isLao ? "ລະດັບຄວາມສຳຄັນ" : "Priority"}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActivityPriority)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="normal">{isLao ? "ປົກກະຕິ" : "Normal"}</option>
                <option value="important">{isLao ? "ສຳຄັນ" : "Important"}</option>
                <option value="urgent">{isLao ? "ດ່ວນທີ່ສຸດ" : "Urgent"}</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isLao ? "ສະຖານທີ່ປະຕິບັດງານ *" : "Location / Venue *"}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={isLao ? "ຕົວຢ່າງ: ຫ້ອງປະຊຸມໃຫຍ່, ເມືອງວຽງໄຊ, ເມືອງຊຳໃຕ້..." : "e.g. Main conference room, Viengxay district..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            {/* Start Date & Time */}
            <div className="space-y-3">
              <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{isLao ? "ເລີ່ມຕົ້ນ (Start)" : "Start"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">{isLao ? "ວັນທີ" : "Date"}</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate < e.target.value) setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">{isLao ? "ເວລາ" : "Time"}</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-3">
              <div className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{isLao ? "ສິ້ນສຸດ (End)" : "End"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">{isLao ? "ວັນທີ" : "Date"}</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">{isLao ? "ເວລາ" : "Time"}</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isLao ? "ຄະນະເຂົ້າຮ່ວມ / ຜູ້ຕິດຕາມ" : "Participants / Attendees"}
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder={isLao ? "ຕົວຢ່າງ: ຄະນະຫ້ອງວ່າການ, ຫົວໜ້າຂະແໜງ, ວິຊາການ 3 ທ່ານ..." : "e.g. Office leadership, division heads, 3 specialists..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isLao ? "ລາຍລະອຽດວຽກງານ" : "Activity Description / Notes"}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isLao ? "ເນື້ອໃນຫຍໍ້ຂອງວຽກງານ, ຈຸດປະສົງ, ວາລະ ຫຼື ເອກະສານກ່ຽວຂ້ອງ..." : "Brief summary, purpose, agenda or related documents..."}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
            />
          </div>

          {/* Outcome (Especially when in progress or completed) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
            <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isLao ? "ຜົນການຈັດຕັ້ງປະຕິບັດ / ຂໍ້ສະຫຼຸບຫຍໍ້ (Outcome)" : "Outcome / Summary Result"}</span>
            </label>
            <textarea
              rows={2}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder={isLao ? "ບັນທຶກຜົນໄດ້ຮັບຈາກກອງປະຊຸມ ຫຼື ວຽກງານທີ່ສຳເລັດແລ້ວ..." : "Log key outcomes, decisions made, or achievements..."}
              className="w-full px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isLao ? "ຍົກເລີກ" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? (isLao ? "ກຳລັງບັນທຶກ..." : "Saving...") 
                  : (isEdit ? (isLao ? "ບັນທຶກການແກ້ໄຂ" : "Save Changes") : (isLao ? "ບັນທຶກວຽກໃໝ່" : "Create Activity"))}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
