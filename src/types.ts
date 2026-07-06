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

export type AppTheme = "light" | "dark" | "glass";
export type AppLanguage = "lo" | "en";

export interface SystemSettings {
  language: AppLanguage;
  theme: AppTheme;
}
