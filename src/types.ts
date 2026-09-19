export type UserRole = "admin" | "user";
export type UserStatus = "active" | "pending" | "inactive";
export type BookingStatus = "pending" | "approved" | "rejected";
export type RoomStatus = "active" | "inactive";
export type NotificationType = "info" | "success" | "warning" | "error";

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
export type VehicleType = "sedan" | "suv" | "van" | "pickup" | "minibus";
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
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

