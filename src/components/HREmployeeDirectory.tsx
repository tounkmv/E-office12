import React, { useState, useRef, FormEvent } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  LayoutGrid, 
  Table as TableIcon, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  Upload, 
  Camera, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Award, 
  Calendar, 
  AlertCircle,
  FileText,
  Printer,
  ChevronDown
} from "lucide-react";
import { CivilServant, CivilServantType, CivilServantStatus, AppLanguage } from "../types";
import { 
  PRESET_OFFICIAL_PHOTOS, 
  PROVINCIAL_DEPARTMENTS, 
  OFFICIAL_POSITIONS, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee 
} from "../lib/hrHelper";
import { showSystemToast } from "../utils/toast";
import { motion, AnimatePresence } from "motion/react";

interface HREmployeeDirectoryProps {
  employees: CivilServant[];
  language: AppLanguage;
  userRole: string;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export default function HREmployeeDirectory({
  employees,
  language,
  userRole,
  isAddModalOpen = false,
  onCloseAddModal
}: HREmployeeDirectoryProps) {
  const isLao = language === "lo";

  // Display and Filter States
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  // Form States (Modal)
  const [showModal, setShowModal] = useState(isAddModalOpen);
  const [editingEmployee, setEditingEmployee] = useState<CivilServant | null>(null);
  const [viewingDetailEmployee, setViewingDetailEmployee] = useState<CivilServant | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<CivilServant | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields
  const [staffCode, setStaffCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [dateOfBirth, setDateOfBirth] = useState("1990-01-01");
  const [ethnicity, setEthnicity] = useState("ລາວ");
  const [religion, setReligion] = useState("ພຸດ");
  const [position, setPosition] = useState(OFFICIAL_POSITIONS[5]);
  const [department, setDepartment] = useState(PROVINCIAL_DEPARTMENTS[0]);
  const [type, setType] = useState<CivilServantType>("full");
  const [salaryGrade, setSalaryGrade] = useState("ຊັ້ນ 2 ຂັ້ນ 4");
  const [dateJoinedState, setDateJoinedState] = useState("2015-09-01");
  const [dateJoinedOffice, setDateJoinedOffice] = useState("2020-01-15");
  const [educationDegree, setEducationDegree] = useState("ປະລິນຍາຕີ (Bachelor)");
  const [majorField, setMajorField] = useState("ການບໍລິຫານລັດຖະກິດ");
  const [politicalTheory, setPoliticalTheory] = useState("ຊັ້ນຕົ້ນ");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentAddress, setCurrentAddress] = useState(isLao ? "ບ້ານ ພັນໄຊ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ" : "Samneua, Houaphanh");
  const [originVillage, setOriginVillage] = useState(isLao ? "ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ" : "Houaphanh Province");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [officialPhotoUrl, setOfficialPhotoUrl] = useState(PRESET_OFFICIAL_PHOTOS[0].url);
  const [status, setStatus] = useState<CivilServantStatus>("active");
  const [notes, setNotes] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external add trigger
  React.useEffect(() => {
    if (isAddModalOpen) {
      handleOpenAdd();
    }
  }, [isAddModalOpen]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    const nextNum = employees.length + 1;
    setStaffCode(`HP-LK-${String(nextNum).padStart(3, "0")}`);
    setFullName("");
    setGender("male");
    setDateOfBirth("1992-05-15");
    setEthnicity("ລາວ");
    setReligion("ພຸດ");
    setPosition(OFFICIAL_POSITIONS[5]);
    setDepartment(PROVINCIAL_DEPARTMENTS[0]);
    setType("full");
    setSalaryGrade("ຊັ້ນ 2 ຂັ້ນ 3");
    setDateJoinedState("2018-09-01");
    setDateJoinedOffice("2021-01-15");
    setEducationDegree("ປະລິນຍາຕີ (Bachelor)");
    setMajorField("");
    setPoliticalTheory("ຊັ້ນຕົ້ນ");
    setPhone("");
    setEmail("");
    setCurrentAddress(isLao ? "ບ້ານ ພັນໄຊ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ" : "Samneua, Houaphanh");
    setOriginVillage(isLao ? "ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ" : "Houaphanh Province");
    setIdCardNumber("");
    setOfficialPhotoUrl(PRESET_OFFICIAL_PHOTOS[0].url);
    setStatus("active");
    setNotes("");
    setShowModal(true);
  };

  const handleOpenEdit = (emp: CivilServant) => {
    setEditingEmployee(emp);
    setStaffCode(emp.staffCode);
    setFullName(emp.fullName);
    setGender(emp.gender);
    setDateOfBirth(emp.dateOfBirth);
    setEthnicity(emp.ethnicity || "ລາວ");
    setReligion(emp.religion || "ພຸດ");
    setPosition(emp.position);
    setDepartment(emp.department);
    setType(emp.type);
    setSalaryGrade(emp.salaryGrade || "");
    setDateJoinedState(emp.dateJoinedState);
    setDateJoinedOffice(emp.dateJoinedOffice || "");
    setEducationDegree(emp.educationDegree);
    setMajorField(emp.majorField);
    setPoliticalTheory(emp.politicalTheory || "ຍັງບໍ່ມີ");
    setPhone(emp.phone);
    setEmail(emp.email || "");
    setCurrentAddress(emp.currentAddress);
    setOriginVillage(emp.originVillage || "");
    setIdCardNumber(emp.idCardNumber || "");
    setOfficialPhotoUrl(emp.officialPhotoUrl || PRESET_OFFICIAL_PHOTOS[0].url);
    setStatus(emp.status);
    setNotes(emp.notes || "");
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPhoto(file);
  };

  const processPhoto = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showSystemToast(isLao ? "ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ!" : "Please select an image file", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const TARGET_WIDTH = 400;
        const TARGET_HEIGHT = 533; // 3:4 or 4:6 aspect ratio
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
          const base64 = canvas.toDataURL("image/jpeg", 0.90);
          setOfficialPhotoUrl(base64);
          showSystemToast(isLao ? "ອັບໂຫຼດຮູບ 4x6 ສຳເລັດແລ້ວ!" : "Photo uploaded successfully!", "success");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showSystemToast(isLao ? "ກະລຸນາປ້ອນຊື່ ແລະ ນາມສະກຸນ" : "Please input full name", "error");
      return;
    }
    if (!staffCode.trim()) {
      showSystemToast(isLao ? "ກະລຸນາປ້ອນລະຫັດລັດຖະກອນ" : "Please input staff code", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          staffCode: staffCode.trim(),
          fullName: fullName.trim(),
          gender,
          dateOfBirth,
          ethnicity: ethnicity.trim(),
          religion: religion.trim(),
          position,
          department,
          type,
          salaryGrade: salaryGrade.trim(),
          dateJoinedState,
          dateJoinedOffice,
          educationDegree,
          majorField: majorField.trim(),
          politicalTheory,
          phone: phone.trim(),
          email: email.trim(),
          currentAddress: currentAddress.trim(),
          originVillage: originVillage.trim(),
          idCardNumber: idCardNumber.trim(),
          officialPhotoUrl,
          status,
          notes: notes.trim()
        });
        showSystemToast(isLao ? `ອັບເດດຂໍ້ມູນ "${fullName}" ສຳເລັດແລ້ວ` : "Employee updated successfully", "success");
      } else {
        const newEmp: CivilServant = {
          id: `emp_${Date.now()}`,
          staffCode: staffCode.trim(),
          fullName: fullName.trim(),
          gender,
          dateOfBirth,
          ethnicity: ethnicity.trim(),
          religion: religion.trim(),
          position,
          department,
          type,
          salaryGrade: salaryGrade.trim(),
          dateJoinedState,
          dateJoinedOffice,
          educationDegree,
          majorField: majorField.trim(),
          politicalTheory,
          phone: phone.trim(),
          email: email.trim(),
          currentAddress: currentAddress.trim(),
          originVillage: originVillage.trim(),
          idCardNumber: idCardNumber.trim(),
          officialPhotoUrl,
          status,
          notes: notes.trim(),
          createdAt: new Date().toISOString()
        };
        await addEmployee(newEmp);
        showSystemToast(isLao ? `ເພີ່ມພະນັກງານ "${fullName}" ເຂົ້າລະບົບແລ້ວ` : "New employee registered successfully", "success");
      }
      setShowModal(false);
      if (onCloseAddModal) onCloseAddModal();
    } catch (err: any) {
      console.error("Save employee error:", err);
      showSystemToast(err.message || "Failed to save employee", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    setDeleteLoading(true);
    try {
      await deleteEmployee(deletingEmployee.id);
      showSystemToast(isLao ? `ລຶບບັນຊີ "${deletingEmployee.fullName}" ອອກຈາກລະບົບແລ້ວ` : "Employee removed successfully", "success");
      setDeletingEmployee(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      showSystemToast(err.message || "Failed to delete", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = q === "" ||
      emp.fullName.toLowerCase().includes(q) ||
      emp.staffCode.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.phone.includes(q);

    const matchDept = departmentFilter === "all" || emp.department === departmentFilter;
    const matchType = typeFilter === "all" || emp.type === typeFilter;
    const matchGender = genderFilter === "all" || emp.gender === genderFilter;

    return matchQuery && matchDept && matchType && matchGender;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. FILTER & SEARCH CONTROL BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isLao ? "ຄົ້ນຫາຊື່, ລະຫັດລັດຖະກອນ, ຕຳແໜ່ງ, ເບີໂທ..." : "Search name, staff code, position..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-64">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-700 dark:text-slate-200"
            >
              <option value="all">{isLao ? "ທຸກພະແນກ / ຂະແໜງ" : "All Divisions"}</option>
              {PROVINCIAL_DEPARTMENTS.map((dept, i) => (
                <option key={i} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-44">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-700 dark:text-slate-200"
            >
              <option value="all">{isLao ? "ທຸກປະເພດລັດຖະກອນ" : "All Types"}</option>
              <option value="full">{isLao ? "ລັດຖະກອນສົມບູນ" : "Permanent"}</option>
              <option value="probation">{isLao ? "ລັດຖະກອນທົດລອງງານ" : "Probation"}</option>
              <option value="contract">{isLao ? "ພະນັກງານຕາມສັນຍາ" : "Contract"}</option>
            </select>
          </div>

          {/* View Mode Toggle & Add Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "grid" 
                    ? "bg-purple-600 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={isLao ? "ສະແດງແບບບັດຮູບ" : "Grid View"}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "table" 
                    ? "bg-purple-600 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={isLao ? "ສະແດງແບບຕາຕະລາງ" : "Table View"}
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

            {userRole === "admin" && (
              <button
                type="button"
                id="btn-add-staff-directory"
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isLao ? "ເພີ່ມພະນັກງານ" : "Add Staff"}</span>
              </button>
            )}
          </div>

        </div>

        {/* Counter Info Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
          <span>{isLao ? `ພົບທັງໝົດ: ${filteredEmployees.length} ທ່ານ (ຈາກ ${employees.length} ທ່ານ)` : `Showing ${filteredEmployees.length} of ${employees.length} staff`}</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {isLao ? "ຮູບຖ່າຍທາງການ 4x6 ມາດຕະຖານລັດຖະການ" : "Official 4x6 Civil Servant Photo Roster"}
          </span>
        </div>
      </div>

      {/* 2. CATALOG DISPLAY: GRID VS TABLE */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-12 text-center border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 mx-auto flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {isLao ? "ບໍ່ພົບຂໍ້ມູນພະນັກງານຕາມເງື່ອນໄຂຄົ້ນຫາ" : "No staff found matching your criteria"}
          </h4>
          <p className="text-xs text-slate-400">
            {isLao ? "ລອງປັບປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກທຸກພະແນກ" : "Try adjusting filters or clear search query"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW - OFFICIAL 4x6 ID CARD DESIGN */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1e293b] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-md hover:shadow-xl hover:border-purple-400/40 transition-all flex flex-col group relative"
            >
              {/* Card Header Color Bar */}
              <div className="h-2.5 w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600" />

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-4">
                  {/* Official 4x6 Photo Portrait */}
                  <div className="w-22 h-30 rounded-2xl overflow-hidden bg-slate-900 border-2 border-purple-400/40 shadow-md shrink-0 relative group/photo">
                    {emp.officialPhotoUrl ? (
                      <img
                        src={emp.officialPhotoUrl}
                        alt={emp.fullName}
                        className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <Users className="w-6 h-6 mb-1" />
                        <span>4x6</span>
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-xs text-[9px] font-black text-center text-purple-300 py-0.5">
                      4x6 Official
                    </span>
                  </div>

                  {/* Basic Info Header */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-black tracking-wide">
                        {emp.staffCode}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold ${
                        emp.type === "full" ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                      }`}>
                        {emp.type === "full" ? (isLao ? "ລັດຖະກອນສົມບູນ" : "Permanent") : (isLao ? "ທົດລອງງານ" : "Probation")}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-slate-900 dark:text-white truncate pt-0.5">
                      {emp.fullName}
                    </h3>

                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate">
                      {emp.position}
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{emp.department}</span>
                    </p>
                  </div>
                </div>

                {/* Details Badges */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">{isLao ? "ວຸດທິການສຶກສາ:" : "Education:"}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[170px]" title={emp.educationDegree}>
                      {emp.educationDegree}
                    </span>
                  </div>

                  {emp.salaryGrade && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">{isLao ? "ຊັ້ນ/ຂັ້ນ:" : "Grade:"}</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">{emp.salaryGrade}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">{isLao ? "ເຂົ້າສັງກັດລັດ:" : "State joined:"}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{emp.dateJoinedState}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 dark:border-white/5">
                    <span className="text-slate-400 font-semibold">{isLao ? "ເບີໂທລະສັບ:" : "Phone:"}</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{emp.phone || "-"}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setViewingDetailEmployee(emp)}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isLao ? "ຊີວະປະຫວັດລະອຽດ" : "Full Profile"}</span>
                  </button>

                  {userRole === "admin" && (
                    <>
                      <button
                        type="button"
                        id={`btn-edit-emp-${emp.id}`}
                        onClick={() => handleOpenEdit(emp)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs transition-all cursor-pointer"
                        title={isLao ? "ແກ້ໄຂຂໍ້ມູນ" : "Edit"}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        id={`btn-delete-emp-${emp.id}`}
                        onClick={() => setDeletingEmployee(emp)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs transition-all cursor-pointer"
                        title={isLao ? "ລຶບຂໍ້ມູນ" : "Delete"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW - FORMAL CIVIL SERVANT ROSTER */
        <div className="overflow-x-auto bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 via-slate-100 to-purple-50 dark:from-purple-950/30 dark:via-slate-900 dark:to-purple-950/30 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">
                <th className="py-3 px-3 rounded-l-xl">{isLao ? "ຮູບ & ຊື່-ນາມສະກຸນ" : "Staff"}</th>
                <th className="py-3 px-3">{isLao ? "ລະຫັດ" : "Code"}</th>
                <th className="py-3 px-3">{isLao ? "ຕຳແໜ່ງ" : "Position"}</th>
                <th className="py-3 px-3">{isLao ? "ພະແນກ/ຂະແໜງ" : "Division"}</th>
                <th className="py-3 px-3">{isLao ? "ຊັ້ນ/ຂັ້ນ" : "Grade"}</th>
                <th className="py-3 px-3">{isLao ? "ວຸດທິການສຶກສາ" : "Degree"}</th>
                <th className="py-3 px-3">{isLao ? "ເບີໂທ" : "Phone"}</th>
                <th className="py-3 px-3 text-center rounded-r-xl">{isLao ? "ຈັດການ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-medium">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-13 rounded-lg overflow-hidden bg-slate-900 border border-purple-400/30 shadow-xs shrink-0">
                        {emp.officialPhotoUrl ? (
                          <img src={emp.officialPhotoUrl} alt={emp.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">4x6</div>
                        )}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm block">{emp.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{emp.gender === "female" ? (isLao ? "ເພດຍິງ" : "Female") : (isLao ? "ເພດຊາຍ" : "Male")}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">
                    {emp.staffCode}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                    {emp.position}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate" title={emp.department}>
                    {emp.department}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-amber-600 dark:text-amber-400">
                    {emp.salaryGrade || "-"}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[140px] truncate">
                    {emp.educationDegree}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                    {emp.phone || "-"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingDetailEmployee(emp)}
                        className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                        title={isLao ? "ເບິ່ງລາຍລະອຽດ" : "View"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {userRole === "admin" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            title={isLao ? "ແກ້ໄຂ" : "Edit"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEmployee(emp)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title={isLao ? "ລຶບ" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. ADD / EDIT EMPLOYEE MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-3xl bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-white/10 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {editingEmployee 
                        ? (isLao ? "ແກ້ໄຂຂໍ້ມູນຊີວະປະຫວັດພະນັກງານ" : "Edit Civil Servant Profile") 
                        : (isLao ? "ເພີ່ມບັນຊີພະນັກງານລັດຖະກອນໃໝ່" : "Register New Civil Servant")}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isLao ? "ບັນທຶກຂໍ້ມູນພື້ນຖານ, ຮູບຖ່າຍ 4x6, ຕຳແໜ່ງ, ພະແນກ ແລະ ວຸດທິການສຶກສາ" : "Official civil servant profile & 4x6 formal portrait"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); if (onCloseAddModal) onCloseAddModal(); }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                
                {/* Section 1: Official 4x6 Photo & Staff Code */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-3">
                  <h4 className="font-extrabold text-purple-900 dark:text-purple-300 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-600" />
                    <span>{isLao ? "1. ຮູບຖ່າຍທາງການ ຂະໜາດ 4*6 (Official 4x6 Photo) & ລະຫັດລັດຖະກອນ" : "1. Official 4x6 Photo & Staff Code"}</span>
                  </h4>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* 4x6 Preview Box */}
                    <div className="w-24 h-32 rounded-2xl overflow-hidden bg-slate-900 border-2 border-purple-500 shadow-md shrink-0 relative group/pic">
                      {officialPhotoUrl ? (
                        <img src={officialPhotoUrl} alt="4x6 Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                          <span>4x6</span>
                        </div>
                      )}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/pic:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                      >
                        <Camera className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold">{isLao ? "ປ່ຽນຮູບ" : "Change"}</span>
                      </div>
                    </div>

                    {/* Presets and Upload Controls */}
                    <div className="flex-1 space-y-2.5 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {isLao ? "ເລືອກຈາກຕົວຢ່າງຮູບທາງການສຳເລັດຮູບ (6 ຮູບແບບ):" : "Pick preset 4x6 formal portrait (6 options):"}
                      </p>
                      <div className="grid grid-cols-6 gap-2">
                        {PRESET_OFFICIAL_PHOTOS.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setOfficialPhotoUrl(p.url)}
                            className={`h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative ${
                              officialPhotoUrl === p.url ? "border-purple-600 scale-105 shadow-sm" : "border-transparent opacity-75 hover:opacity-100"
                            }`}
                            title={p.label}
                          >
                            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isLao ? "ອັບໂຫຼດຮູບຈາກຄອມພິວເຕີ" : "Upload 4x6 File"}</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <span className="text-[10px] text-slate-400">
                          {isLao ? "ປັບຂະໜາດ 4x6 ອັດຕະໂນມັດ (JPG, PNG)" : "Auto cropped to 4x6"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Biographical details */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    {isLao ? "2. ຂໍ້ມູນຊີວະປະຫວັດພື້ນຖານ (Basic Personal Details)" : "2. Personal Details"}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isLao ? "ລະຫັດລັດຖະກອນ *" : "Staff Code *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={staffCode}
                        onChange={(e) => setStaffCode(e.target.value)}
                        placeholder="HP-LK-001"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-bold focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isLao ? "ຊື່ ແລະ ນາມສະກຸນ (ພ້ອມຄຳນຳໜ້າ) *" : "Full Name *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isLao ? "ຕົວຢ່າງ: ທ່ານ ຄຳຕຸ່ນ ຄໍາມະວົງ" : "Full Name"}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-bold focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isLao ? "ເພດ" : "Gender"}</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      >
                        <option value="male">{isLao ? "ຊາຍ" : "Male"}</option>
                        <option value="female">{isLao ? "ຍິງ" : "Female"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isLao ? "ວັນເດືອນປີເກີດ" : "DOB"}</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isLao ? "ຊົນເຜົ່າ" : "Ethnicity"}</label>
                      <input
                        type="text"
                        value={ethnicity}
                        onChange={(e) => setEthnicity(e.target.value)}
                        placeholder="ລາວ"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isLao ? "ສາສະໜາ" : "Religion"}</label>
                      <input
                        type="text"
                        value={religion}
                        onChange={(e) => setReligion(e.target.value)}
                        placeholder="ພຸດ"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Official Position, Department & Civil Service Status */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    {isLao ? "3. ຕຳແໜ່ງ, ພະແນກ/ຂະແໜງ ແລະ ປະເພດລັດຖະກອນ (Civil Service Roles)" : "3. Roles & Division"}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isLao ? "ຕຳແໜ່ງບໍລິຫານ *" : "Position *"}
                      </label>
                      <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-bold"
                      >
                        {OFFICIAL_POSITIONS.map((pos, idx) => (
                          <option key={idx} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isLao ? "ພະແນກ / ຂະແໜງການ *" : "Division *"}
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-bold"
                      >
                        {PROVINCIAL_DEPARTMENTS.map((dept, idx) => (
                          <option key={idx} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isLao ? "ປະເພດລັດຖະກອນ" : "Type"}
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      >
                        <option value="full">{isLao ? "ລັດຖະກອນສົມບູນ" : "Permanent Civil Servant"}</option>
                        <option value="probation">{isLao ? "ລັດຖະກອນທົດລອງງານ" : "Probationary"}</option>
                        <option value="contract">{isLao ? "ພະນັກງານຕາມສັນຍາ" : "Contract Staff"}</option>
                        <option value="assigned">{isLao ? "ພະນັກງານຊ່ວຍວຽກ" : "Assigned"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isLao ? "ຊັ້ນ/ຂັ້ນເງິນເດືອນ" : "Salary Grade"}
                      </label>
                      <input
                        type="text"
                        value={salaryGrade}
                        onChange={(e) => setSalaryGrade(e.target.value)}
                        placeholder="ຊັ້ນ 2 ຂັ້ນ 4"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isLao ? "ວັນທີເຂົ້າສັງກັດລັດ" : "State Joined"}
                      </label>
                      <input
                        type="date"
                        value={dateJoinedState}
                        onChange={(e) => setDateJoinedState(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Education & Political Theory */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    {isLao ? "4. ວຸດທິການສຶກສາ & ທິດສະດີການເມືອງ (Education & Theory)" : "4. Education & Credentials"}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isLao ? "ລະດັບການສຶກສາ" : "Degree"}
                      </label>
                      <select
                        value={educationDegree}
                        onChange={(e) => setEducationDegree(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      >
                        <option value="ປະລິນຍາເອກ (Doctorate)">ປະລິນຍາເອກ (Doctorate)</option>
                        <option value="ປະລິນຍາໂທ (Master)">ປະລິນຍາໂທ (Master)</option>
                        <option value="ປະລິນຍາຕີ (Bachelor)">ປະລິນຍາຕີ (Bachelor)</option>
                        <option value="ຊັ້ນສູງ (Higher Diploma)">ຊັ້ນສູງ (Higher Diploma)</option>
                        <option value="ຊັ້ນກາງ (Diploma)">ຊັ້ນກາງ (Diploma)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isLao ? "ສາຂາວິຊາສະເພາະ" : "Major Field"}
                      </label>
                      <input
                        type="text"
                        value={majorField}
                        onChange={(e) => setMajorField(e.target.value)}
                        placeholder="ການບໍລິຫານລັດຖະກິດ, ກົດໝາຍ, ໄອທີ..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isLao ? "ທິດສະດີການເມືອງ" : "Political Theory"}
                      </label>
                      <select
                        value={politicalTheory}
                        onChange={(e) => setPoliticalTheory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      >
                        <option value="ຊັ້ນສູງ">ຊັ້ນສູງ</option>
                        <option value="ຊັ້ນກາງ">ຊັ້ນກາງ</option>
                        <option value="ຊັ້ນຕົ້ນ">ຊັ້ນຕົ້ນ</option>
                        <option value="ຍັງບໍ່ມີ">ຍັງບໍ່ມີ</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 5: Contact & Addresses */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    {isLao ? "5. ຂໍ້ມູນຕິດຕໍ່ & ທີ່ຢູ່ (Contact & Addresses)" : "5. Contact & Addresses"}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isLao ? "ເບີໂທລະສັບ *" : "Phone *"}</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="020 5555 5555"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isLao ? "ອີເມວ" : "Email"}</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isLao ? "ທີ່ຢູ່ປະຈຸບັນ" : "Current Address"}</label>
                      <input
                        type="text"
                        value={currentAddress}
                        onChange={(e) => setCurrentAddress(e.target.value)}
                        placeholder="ບ້ານ, ເມືອງ, ແຂວງ"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isLao ? "ບ້ານເກີດ / ພູມລຳເນົາ" : "Origin Town"}</label>
                      <input
                        type="text"
                        value={originVillage}
                        onChange={(e) => setOriginVillage(e.target.value)}
                        placeholder="ບ້ານເກີດ, ເມືອງ, ແຂວງ"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 6: Status & Notes */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isLao ? "ສະຖານະປະຈຳການ" : "Status"}</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-bold"
                      >
                        <option value="active">{isLao ? "ປະຈຳການປົກກະຕິ" : "Active"}</option>
                        <option value="study">{isLao ? "ໄປຮຽນ / ຍົກລະດັບ" : "Studying"}</option>
                        <option value="retired">{isLao ? "ບໍານານ" : "Retired"}</option>
                        <option value="transferred">{isLao ? "ຍົກຍ້າຍ" : "Transferred"}</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isLao ? "ໝາຍເຫດ / ຄວາມຮັບຜິດຊອບ" : "Notes"}</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={isLao ? "ໜ້າທີ່ຮັບຜິດຊອບຫຼັກ..." : "Responsibilities..."}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); if (onCloseAddModal) onCloseAddModal(); }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                  >
                    {isLao ? "ຍົກເລີກ" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>
                      {loading 
                        ? (isLao ? "ກຳລັງບັນທຶກ..." : "Saving...") 
                        : editingEmployee 
                        ? (isLao ? "ບັນທຶກການແກ້ໄຂ" : "Save Changes") 
                        : (isLao ? "ບັນທຶກພະນັກງານໃໝ່" : "Register Staff")}
                    </span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. FULL CV / BIOGRAPHICAL PROFILE MODAL (VIEW DETAIL) */}
      <AnimatePresence>
        {viewingDetailEmployee && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {isLao ? "ຊີວະປະຫວັດຫຍໍ້ ພະນັກງານລັດຖະກອນ" : "Official Civil Servant Curriculum Vitae"}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {isLao ? "ຫ້ອງວ່າການແຂວງຫົວພັນ" : "Houaphanh Provincial Office"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingDetailEmployee(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* CV Top Header Card with 4x6 Photo */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50/70 via-slate-50 to-purple-50/70 dark:from-purple-950/30 dark:via-slate-900 dark:to-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-24 h-32 rounded-2xl overflow-hidden bg-slate-900 border-2 border-purple-500 shadow-md shrink-0">
                  <img src={viewingDetailEmployee.officialPhotoUrl} alt={viewingDetailEmployee.fullName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-600 text-white font-black text-xs">
                      {viewingDetailEmployee.staffCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                      {viewingDetailEmployee.type === "full" ? (isLao ? "ລັດຖະກອນສົມບູນ" : "Permanent") : (isLao ? "ທົດລອງງານ" : "Probation")}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {viewingDetailEmployee.fullName}
                  </h2>
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {viewingDetailEmployee.position}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {viewingDetailEmployee.department}
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{isLao ? "ວັນເດືອນປີເກີດ & ເພດ" : "DOB & Gender"}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {viewingDetailEmployee.dateOfBirth} ({viewingDetailEmployee.gender === "female" ? (isLao ? "ຍິງ" : "Female") : (isLao ? "ຊາຍ" : "Male")})
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{isLao ? "ຊົນເຜົ່າ & ສາສະໜາ" : "Ethnicity & Religion"}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {viewingDetailEmployee.ethnicity || "ລາວ"} • {viewingDetailEmployee.religion || "ພຸດ"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{isLao ? "ຊັ້ນ/ຂັ້ນເງິນເດືອນ" : "Salary Grade"}</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    {viewingDetailEmployee.salaryGrade || "-"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{isLao ? "ວັນທີເຂົ້າສັງກັດລັດ" : "State Joined"}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {viewingDetailEmployee.dateJoinedState}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{isLao ? "ວຸດທິການສຶກສາ & ສາຂາ" : "Education & Major"}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {viewingDetailEmployee.educationDegree} ({viewingDetailEmployee.majorField || "-"})
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{isLao ? "ທິດສະດີການເມືອງ" : "Political Theory"}</span>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400">
                    {viewingDetailEmployee.politicalTheory || "ຍັງບໍ່ມີ"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{isLao ? "ເບີໂທລະສັບ" : "Phone"}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {viewingDetailEmployee.phone}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{isLao ? "ອີເມວ" : "Email"}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {viewingDetailEmployee.email || "-"}
                  </span>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{isLao ? "ທີ່ຢູ່ປະຈຸບັນ" : "Current Address"}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {viewingDetailEmployee.currentAddress}
                  </span>
                </div>

                {viewingDetailEmployee.notes && (
                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">{isLao ? "ໝາຍເຫດ / ພາລະບົດບາດ" : "Notes"}</span>
                    <span className="font-semibold text-amber-900 dark:text-amber-200">
                      {viewingDetailEmployee.notes}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setViewingDetailEmployee(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                >
                  {isLao ? "ປິດ" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CONFIRM DELETE EMPLOYEE MODAL */}
      <AnimatePresence>
        {deletingEmployee && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isLao ? "ຢືນຢັນການລຶບບັນຊີພະນັກງານ?" : "Confirm Delete Employee?"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isLao 
                    ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບບັນຊີ "${deletingEmployee.fullName}" (${deletingEmployee.staffCode}) ອອກຈາກລະບົບ? ຂໍ້ມູນນີ້ຈະບໍ່ສາມາດກູ້ຄືນໄດ້.` 
                    : `Are you sure you want to permanently delete "${deletingEmployee.fullName}"?`}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingEmployee(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  {isLao ? "ຍົກເລີກ" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white font-extrabold text-xs shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deleteLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  ) : (
                    <Trash2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{deleteLoading ? (isLao ? "ກຳລັງລຶບ..." : "Deleting...") : (isLao ? "ຢືນຢັນລຶບ" : "Delete")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
