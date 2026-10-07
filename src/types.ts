export type UserRole = "admin" | "user";
export type UserStatus = "active" | "pending" | "inactive";
export type BookingStatus = "pending" | "approved" | "rejected";
export type RoomStatus = "active" | "inactive";
export type NotificationType = "info" | "success" | "warning" | "error";

// Granular System Permissions across 3 Systems
export interface SystemPermissions {
  // SYSTEM 1: ລະບົບຈອງຫ້ອງປະຊຸມ (Meeting Room System)
  meetingAccess: boolean; // ສິດເຂົ້າເຖິງລະບົບຈອງຫ້ອງປະຊຸມ
  meetingBook: boolean; // ສິດສ້າງຄຳຂໍຈອງຫ້ອງປະຊຸມ
  meetingApprove: boolean; // ສິດອະນຸມັດ/ປະຕິເສດ ແລະ ຄຸ້ມຄອງການຈອງ
  meetingManageRooms: boolean; // ສິດເພີ່ມ/ແກ້ໄຂ/ລົບຫ້ອງປະຊຸມ
  meetingReports: boolean; // ສິດເບິ່ງບົດລາຍງານການຈອງຫ້ອງ

  // SYSTEM 2: ລະບົບການຈັດການລົດບໍລິຫານ (Vehicle Fleet System)
  vehicleAccess: boolean; // ສິດເຂົ້າເຖິງລະບົບລົດບໍລິຫານ
  vehicleBook: boolean; // ສິດສ້າງຄຳຂໍຈອງລົດລັດຖະການ
  vehicleApprove: boolean; // ສິດອະນຸມັດ ແລະ ແຕ່ງຕັ້ງຄົນຂັບລົດ
  vehicleManageFleet: boolean; // ສິດເພີ່ມ/ແກ້ໄຂ/ລົບຂໍ້ມູນລົດ
  vehicleReports: boolean; // ສິດເບິ່ງບົດລາຍງານການນຳໃຊ້ລົດ

  // SYSTEM 3: ລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກຂອງຄະນະ (Leadership & Duty Activity System)
  leadershipAccess: boolean; // ສິດເຂົ້າເຖິງລະບົບຕິດຕາມການເຄື່ອນໄຫວວຽກ
  leadershipCalendar: boolean; // ສິດເບິ່ງປະຕິທິນການເຄື່ອນໄຫວວຽກ
  leadershipLogOwn: boolean; // ສິດບັນທຶກ ແລະ ຄຸ້ມຄອງວຽກຕົນເອງ
  leadershipManageAll: boolean; // ສິດຄຸ້ມຄອງ ແລະ ກວດກາວຽກຂອງທຸກຄົນ
  leadershipReports: boolean; // ສິດສ້າງ ແລະ ສົ່ງອອກບົດລາຍງານ ອາທິດ/ເດືອນ/ປີ

  // SYSTEM 4: ລະບົບຈັດການບັນຊີພະນັກງານ (HR & Civil Servant Directory)
  hrAccess: boolean; // ສິດເຂົ້າເຖິງລະບົບຈັດການບັນຊີພະນັກງານ
  hrManage: boolean; // ສິດເພີ່ມ/ແກ້ໄຂ/ລົບຂໍ້ມູນຊີວະປະຫວັດພະນັກງານ
  hrReports: boolean; // ສິດເບິ່ງ ແລະ ພິມບົດລາຍງານບັນຊີພະນັກງານ

  // SYSTEM 5: ລະບົບຕິດຕາມການລາພັກຂອງພະນັກງານ (Staff Leave Tracking System)
  leaveAccess: boolean; // ສິດເຂົ້າເຖິງລະບົບຕິດຕາມການລາພັກ
  leaveApply: boolean; // ສິດຍື່ນແບບຟອມຂໍລາພັກ
  leaveApprove: boolean; // ສິດອະນຸມັດ/ປະຕິເສດການລາພັກ (Admin ຫຼື ຫົວໜ້າຫ້ອງ ບໍລິຫານ, ພິທີການ ແລະ ການເງິນ)
  leaveReports: boolean; // ສິດເບິ່ງບົດລາຍງານສະຖິຕິ ແລະ ໂຄຕ້າການລາພັກ 15 ວັນ
}

export const DEFAULT_USER_PERMISSIONS: SystemPermissions = {
  meetingAccess: true,
  meetingBook: true,
  meetingApprove: false,
  meetingManageRooms: false,
  meetingReports: false,

  vehicleAccess: true,
  vehicleBook: true,
  vehicleApprove: false,
  vehicleManageFleet: false,
  vehicleReports: false,

  leadershipAccess: true,
  leadershipCalendar: true,
  leadershipLogOwn: true,
  leadershipManageAll: false,
  leadershipReports: true,

  hrAccess: true,
  hrManage: false,
  hrReports: true,

  leaveAccess: true,
  leaveApply: true,
  leaveApprove: false,
  leaveReports: true,
};

export const DEFAULT_ADMIN_PERMISSIONS: SystemPermissions = {
  meetingAccess: true,
  meetingBook: true,
  meetingApprove: true,
  meetingManageRooms: true,
  meetingReports: true,

  vehicleAccess: true,
  vehicleBook: true,
  vehicleApprove: true,
  vehicleManageFleet: true,
  vehicleReports: true,

  leadershipAccess: true,
  leadershipCalendar: true,
  leadershipLogOwn: true,
  leadershipManageAll: true,
  leadershipReports: true,

  hrAccess: true,
  hrManage: true,
  hrReports: true,

  leaveAccess: true,
  leaveApply: true,
  leaveApprove: true,
  leaveReports: true,
};

export const PRESET_MEETING_OFFICER: SystemPermissions = {
  meetingAccess: true,
  meetingBook: true,
  meetingApprove: true,
  meetingManageRooms: true,
  meetingReports: true,

  vehicleAccess: false,
  vehicleBook: false,
  vehicleApprove: false,
  vehicleManageFleet: false,
  vehicleReports: false,

  leadershipAccess: false,
  leadershipCalendar: false,
  leadershipLogOwn: false,
  leadershipManageAll: false,
  leadershipReports: false,

  hrAccess: false,
  hrManage: false,
  hrReports: false,

  leaveAccess: true,
  leaveApply: true,
  leaveApprove: false,
  leaveReports: false,
};

export const PRESET_VEHICLE_OFFICER: SystemPermissions = {
  meetingAccess: false,
  meetingBook: false,
  meetingApprove: false,
  meetingManageRooms: false,
  meetingReports: false,

  vehicleAccess: true,
  vehicleBook: true,
  vehicleApprove: true,
  vehicleManageFleet: true,
  vehicleReports: true,

  leadershipAccess: false,
  leadershipCalendar: false,
  leadershipLogOwn: false,
  leadershipManageAll: false,
  leadershipReports: false,

  hrAccess: false,
  hrManage: false,
  hrReports: false,

  leaveAccess: true,
  leaveApply: true,
  leaveApprove: false,
  leaveReports: false,
};

export const PRESET_LEADERSHIP_OFFICER: SystemPermissions = {
  meetingAccess: false,
  meetingBook: false,
  meetingApprove: false,
  meetingManageRooms: false,
  meetingReports: false,

  vehicleAccess: false,
  vehicleBook: false,
  vehicleApprove: false,
  vehicleManageFleet: false,
  vehicleReports: false,

  leadershipAccess: true,
  leadershipCalendar: true,
  leadershipLogOwn: true,
  leadershipManageAll: true,
  leadershipReports: true,

  hrAccess: false,
  hrManage: false,
  hrReports: false,

  leaveAccess: true,
  leaveApply: true,
  leaveApprove: false,
  leaveReports: false,
};

export const PRESET_VIEW_ONLY: SystemPermissions = {
  meetingAccess: true,
  meetingBook: false,
  meetingApprove: false,
  meetingManageRooms: false,
  meetingReports: true,

  vehicleAccess: true,
  vehicleBook: false,
  vehicleApprove: false,
  vehicleManageFleet: false,
  vehicleReports: true,

  leadershipAccess: true,
  leadershipCalendar: true,
  leadershipLogOwn: false,
  leadershipManageAll: false,
  leadershipReports: true,

  hrAccess: true,
  hrManage: false,
  hrReports: true,

  leaveAccess: true,
  leaveApply: false,
  leaveApprove: false,
  leaveReports: true,
};

export const PRESET_REVOKED: SystemPermissions = {
  meetingAccess: false,
  meetingBook: false,
  meetingApprove: false,
  meetingManageRooms: false,
  meetingReports: false,

  vehicleAccess: false,
  vehicleBook: false,
  vehicleApprove: false,
  vehicleManageFleet: false,
  vehicleReports: false,

  leadershipAccess: false,
  leadershipCalendar: false,
  leadershipLogOwn: false,
  leadershipManageAll: false,
  leadershipReports: false,

  hrAccess: false,
  hrManage: false,
  hrReports: false,

  leaveAccess: false,
  leaveApply: false,
  leaveApprove: false,
  leaveReports: false,
};

export function hasPermission(
  user: UserProfile | null | undefined, 
  permissionKey: keyof SystemPermissions
): boolean {
  if (!user) return false;
  // Admin role defaults to true unless explicitly overridden
  if (user.role === "admin") {
    if (user.permissions && user.permissions[permissionKey] !== undefined) {
      return !!user.permissions[permissionKey];
    }
    return true;
  }
  // Regular user: check assigned permissions, fallback to default user permissions
  if (user.permissions && user.permissions[permissionKey] !== undefined) {
    return !!user.permissions[permissionKey];
  }
  return DEFAULT_USER_PERMISSIONS[permissionKey] ?? false;
}

export function countSystemPermissions(user: UserProfile | null | undefined): {
  meetingCount: number;
  meetingTotal: number;
  vehicleCount: number;
  vehicleTotal: number;
  leadershipCount: number;
  leadershipTotal: number;
  hrCount: number;
  hrTotal: number;
  leaveCount: number;
  leaveTotal: number;
  totalEnabled: number;
  totalFeatures: number;
} {
  const meetingKeys: (keyof SystemPermissions)[] = [
    "meetingAccess", "meetingBook", "meetingApprove", "meetingManageRooms", "meetingReports"
  ];
  const vehicleKeys: (keyof SystemPermissions)[] = [
    "vehicleAccess", "vehicleBook", "vehicleApprove", "vehicleManageFleet", "vehicleReports"
  ];
  const leadershipKeys: (keyof SystemPermissions)[] = [
    "leadershipAccess", "leadershipCalendar", "leadershipLogOwn", "leadershipManageAll", "leadershipReports"
  ];
  const hrKeys: (keyof SystemPermissions)[] = [
    "hrAccess", "hrManage", "hrReports"
  ];
  const leaveKeys: (keyof SystemPermissions)[] = [
    "leaveAccess", "leaveApply", "leaveApprove", "leaveReports"
  ];

  let meetingCount = 0;
  meetingKeys.forEach(k => { if (hasPermission(user, k)) meetingCount++; });

  let vehicleCount = 0;
  vehicleKeys.forEach(k => { if (hasPermission(user, k)) vehicleCount++; });

  let leadershipCount = 0;
  leadershipKeys.forEach(k => { if (hasPermission(user, k)) leadershipCount++; });

  let hrCount = 0;
  hrKeys.forEach(k => { if (hasPermission(user, k)) hrCount++; });

  let leaveCount = 0;
  leaveKeys.forEach(k => { if (hasPermission(user, k)) leaveCount++; });

  return {
    meetingCount,
    meetingTotal: meetingKeys.length,
    vehicleCount,
    vehicleTotal: vehicleKeys.length,
    leadershipCount,
    leadershipTotal: leadershipKeys.length,
    hrCount,
    hrTotal: hrKeys.length,
    leaveCount,
    leaveTotal: leaveKeys.length,
    totalEnabled: meetingCount + vehicleCount + leadershipCount + hrCount + leaveCount,
    totalFeatures: meetingKeys.length + vehicleKeys.length + leadershipKeys.length + hrKeys.length + leaveKeys.length
  };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
  status: UserStatus;
  createdAt: string;
  avatar?: string;
  bio?: string;
  username?: string;
  password?: string;
  permissions?: Partial<SystemPermissions>;
}

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  equipment: string[]; // e.g. ["Projector", "Sound System", "Whiteboard", "Video Conference"]
  status: RoomStatus;
  imageUrl?: string;
  description: string;
  location: string;
}

export interface RoomBooking {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  title: string;
  date: string; // YYYY-MM-DD (Start Date)
  endDate?: string; // YYYY-MM-DD (End Date)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: BookingStatus;
  purpose: string;
  attendeesCount: number;
  createdAt: string;
  notes?: string;
  attachmentName?: string;
  attachmentData?: string;
  attachmentType?: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export type AppTheme = "light" | "dark" | "glass" | "forest";
export type AppLanguage = "lo" | "en";

export interface SystemSettings {
  language: AppLanguage;
  theme: AppTheme;
}

// Vehicle Management System Types
export type VehicleStatus = "available" | "in_use" | "maintenance";
export type VehicleType = "sedan" | "suv" | "van" | "pickup" | "minibus" | "other" | string;
export type VehicleBookingStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export interface Vehicle {
  id: string;
  name: string; // e.g. "Toyota Fortuner Legender 4WD"
  plateNumber: string; // e.g. "ກກ 8899 ຫົວພັນ"
  type: VehicleType;
  capacity: number; // seat count e.g. 7
  fuelType: string; // e.g. "ກາຊວນ (Diesel)"
  status: VehicleStatus; // available, in_use, maintenance
  imageUrl?: string;
  defaultDriver?: string; // Assigned Driver Name
  driverPhone?: string;
  mileage?: number;
  department?: string;
  notes?: string;
  createdAt?: string;
}

export interface VehicleBooking {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  vehicleType: string;
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  phone: string;
  purpose: string; // ຈຸດປະສົງການໃຊ້ງານ/ວຽກງານ
  destination: string; // ຈຸດໝາຍປາຍທາງ (ແຂວງ/ເມືອງ/ສະຖານທີ່)
  passengersCount: number; // ຈຳນວນຜູ້ເດີນທາງ
  passengersList?: string; // ລາຍຊື່ຜູ້ຮ່ວມເດີນທາງ
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:MM
  status: VehicleBookingStatus; // pending, approved, rejected, completed
  assignedDriver?: string; // ຄົນຂັບລົດທີ່ແຕ່ງຕັ້ງ
  driverPhone?: string; // ເບີໂທຄົນຂັບລົດ
  adminNotes?: string;
  rejectionReason?: string;
  attachmentName?: string;
  attachmentData?: string;
  attachmentType?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

// Leadership and Duty Tracking System Types
export type ActivityCategory = "meeting" | "mission" | "inspection" | "ceremony" | "internal" | "training" | "other";
export type ActivityStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type ActivityPriority = "normal" | "important" | "urgent";

export interface LeadershipActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  roleTitle?: string; // e.g. "ຫົວໜ້າຫ້ອງວ່າການແຂວງ", "ຫົວໜ້າພະແນກ", "ຮອງຫົວໜ້າພະແນກ", "ຫົວໜ້າຂະແໜງ", "ຮອງຫົວໜ້າຂະແໜງ", "ວິຊາການ"
  department: string; // e.g. "ຂະແໜງຄົ້ນຄວ້າ-ສັງລວມ", "ຂະແໜງບໍລິຫານ-ພິທີການ", "ຂະແໜງການເງິນ-ບັນຊີ", "ຂະແໜງກວດກາ"
  title: string;
  description?: string;
  category: ActivityCategory;
  location: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:MM
  status: ActivityStatus;
  priority: ActivityPriority;
  participants?: string; // ຄະນະເຂົ້າຮ່ວມ / ຜູ້ຕິດຕາມ
  outcome?: string; // ຜົນການຈັດຕັ້ງປະຕິບັດ / ຂໍ້ສະຫຼຸບຫຍໍ້
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// SYSTEM 4: ລະບົບຈັດການບັນຊີພະນັກງານ (HR & Civil Servant Directory System)
// ============================================================================
export type CivilServantType = "full" | "probation" | "contract" | "assigned";
// full = ລັດຖະກອນສົມບູນ, probation = ລັດຖະກອນທົດລອງງານ, contract = ພະນັກງານຕາມສັນຍາ, assigned = ພະນັກງານຊ່ວຍວຽກ

export type CivilServantStatus = "active" | "study" | "retired" | "transferred" | "suspended";
// active = ປະຈຳການປົກກະຕິ, study = ໄປຍົກລະດັບ/ຮຽນຕໍ່, retired = ບໍານານ, transferred = ຍົກຍ້າຍ, suspended = ພັກວຽກ

export interface CivilServant {
  id: string; // Document ID
  staffCode: string; // e.g. "HP-LK-001" (ລະຫັດລັດຖະກອນ)
  fullName: string; // ຊື່ ແລະ ນາມສະກຸນ
  gender: "male" | "female"; // ເພດ
  dateOfBirth: string; // YYYY-MM-DD
  ethnicity?: string; // ຊົນເຜົ່າ
  religion?: string; // ສາສະໜາ
  position: string; // ຕຳແໜ່ງບໍລິຫານ
  department: string; // ພະແນກ / ຂະແໜງການ
  type: CivilServantType; // ປະເພດລັດຖະກອນ
  salaryGrade?: string; // ຊັ້ນ/ຂັ້ນເງິນເດືອນ (ເຊັ່ນ: ຊັ້ນ 4 ຂັ້ນ 6)
  dateJoinedState: string; // ວັນທີເຂົ້າສັງກັດລັດ (YYYY-MM-DD)
  dateJoinedOffice?: string; // ວັນທີມາປະຈຳການຢູ່ຫ້ອງວ່າການແຂວງ
  educationDegree: string; // ລະດັບການສຶກສາ (ປະລິນຍາຕີ, ໂທ, ເອກ, ຊັ້ນສູງ...)
  majorField: string; // ສາຂາວິຊາສະເພາະ
  politicalTheory?: string; // ທິດສະດີການເມືອງ (ຊັ້ນຕົ້ນ, ຊັ້ນກາງ, ຊັ້ນສູງ, ຍັງບໍ່ມີ)
  phone: string; // ເບີໂທລະສັບ
  email?: string; // ອີເມວ
  currentAddress: string; // ທີ່ຢູ່ປະຈຸບັນ
  originVillage?: string; // ບ້ານເກີດ/ເມືອງເກີດ
  idCardNumber?: string; // ເລກບັດປະຈຳຕົວ
  officialPhotoUrl: string; // ຮູບຖ່າຍທາງການ ຂະໜາດ 4*6
  status: CivilServantStatus; // ສະຖານະປະຈຳການ
  notes?: string; // ໝາຍເຫດ
  documentName?: string; // ເອກະສານຊີວະປະຫວັດແນບ
  documentData?: string; // base64 / URL
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// SYSTEM 5: ລະບົບຕິດຕາມການລາພັກຂອງພະນັກງານ (Staff Leave Tracking System)
// ============================================================================
export type LeaveType = 
  | "annual" // ລາພັກປະຈຳປີ (ໂຄຕ້າ 15 ວັນທາງລັດຖະການຕໍ່ປີ)
  | "sick" // ລາປ່ວຍ
  | "maternity" // ລາເກີດລູກ/ຄອດລູກ
  | "emergency" // ລາກິດສຸກເສີນ
  | "study" // ລາໄປຮຽນ/ຝຶກອົບຮົມ
  | "other"; // ອື່ນໆ

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: string;
  staffId: string; // Reference to CivilServant ID
  staffCode: string; // ລະຫັດລັດຖະກອນ
  staffName: string; // ຊື່ ແລະ ນາມສະກຸນ ຜູ້ຂໍລາພັກ
  staffDepartment: string; // ພະແນກ/ຂະແໜງ
  staffPosition: string; // ຕຳແໜ່ງ
  staffPhone: string; // ເບີໂທ
  userId?: string; // Account UID of submitter
  
  leaveType: LeaveType;
  title: string; // ຫົວຂໍ້ທີ່ຂໍສະເໜີລາພັກ
  reason: string; // ເຫດຜົນ ແລະ ຄວາມຈຳເປັນ
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  workingDaysCount: number; // ຈຳນວນວັນທາງລັດຖະການ
  year: number; // e.g. 2026
  
  // 15 days quota tracking snapshot at request time
  quotaTotal: number; // 15
  quotaUsedBefore: number; // ວັນທີ່ໃຊ້ໄປແລ້ວໃນປີນີ້
  quotaRemainingBefore: number; // ວັນທີ່ຍັງເຫຼືອ
  
  handoverPerson?: string; // ຜູ້ມອບໝາຍວຽກແທນຊົ່ວຄາວ
  handoverPhone?: string;
  emergencyPhone?: string; // ເບີໂທຕິດຕໍ່ສຸກເສີນ
  destination?: string; // ສະຖານທີ່ພັກເຊົາລະຫວ່າງລາພັກ
  
  attachmentName?: string;
  attachmentData?: string;
  
  status: LeaveStatus;
  
  // Approver Record (ບັນຊີຜູ້ອະນຸມັດ: Admin ຫຼື ຫົວໜ້າຫ້ອງ ບໍລິຫານ, ພິທີການ ແລະ ການເງິນ)
  approvedByUid?: string;
  approvedByName?: string;
  approvedByRole?: string;
  approvedByEmail?: string;
  approvedAt?: string;
  approvalRemarks?: string;
  
  rejectionReason?: string;
  rejectedByUid?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  
  createdAt: string;
  updatedAt?: string;
}

