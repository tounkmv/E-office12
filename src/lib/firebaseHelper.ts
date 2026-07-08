import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot
} from "./firebase";
import { FirebaseUser } from "./firebase";
import { 
  UserProfile, 
  MeetingRoom, 
  RoomBooking, 
  SystemNotification, 
  BookingStatus,
  UserRole,
  UserStatus,
  RoomStatus
} from "../types";

// Seed default rooms if none exist
export async function seedDefaultRooms() {
  const roomsRef = collection(db, "rooms");
  const querySnapshot = await getDocs(roomsRef);
  
  if (querySnapshot.empty) {
    const defaultRooms: MeetingRoom[] = [
      {
        id: "room_a",
        name: "ຫ້ອງປະຊຸມໃຫຍ່ ສະພາແຂວງ (A)",
        capacity: 100,
        equipment: ["ຈໍ LED ຂະໜາດໃຫຍ່", "ລະບົບສຽງອ້ອມຮອບ", "ໄມໂຄຣໂຟນໄຮ້ສາຍ", "ລະບົບປະຊຸມທາງໄກ (Zoom/Meet)", "ເຄື່ອງປັບອາກາດ"],
        status: "active",
        imageUrl: "/src/assets/images/large_conference_room_1782891812375.jpg",
        description: "ຫ້ອງປະຊຸມໃຫຍ່ສຳລັບການປະຊຸມລະດັບແຂວງ, ການສຳມະນາຂະໜາດໃຫຍ່ ແລະ ຕ້ອນຮັບແຂກລະດັບສູງ",
        location: "ຊັ້ນ 1, ອາຄານສໍານັກງານ"
      },
      {
        id: "room_b",
        name: "ຫ້ອງປະຊຸມປານກາງ ຫົວພັນ (B)",
        capacity: 40,
        equipment: ["ຈໍ Smart TV 85 ນິ້ວ", "ໄມໂຄຣໂຟນປະຊຸມ", "ກະດານໄວ້ບອດ", "ລະບົບປະຊຸມທາງໄກ", "ເຄື່ອງປັບອາກາດ"],
        status: "active",
        imageUrl: "/src/assets/images/medium_meeting_room_1782891824721.jpg",
        description: "ຫ້ອງປະຊຸມລະດັບກາງສຳລັບການປະຊຸມພາຍໃນພະແນກ, ການຮ່ວມມື ແລະ ການນຳສະເໜີວຽກງານ",
        location: "ຊັ້ນ 2, ອາຄານສໍານັກງານ"
      },
      {
        id: "room_c",
        name: "ຫ້ອງປະຊຸມ VIP ຫ້ອງວ່າການ (C)",
        capacity: 15,
        equipment: ["ໂຊຟາຮັບແຂກ VIP", "ຈໍ Smart TV 75 ນິ້ວ", "ເຄື່ອງຊົງກາເຟ", "ໄມໂຄຣໂຟນສະເພາະບຸກຄົນ", "ລະບົບກອງປະຊຸມປິດ"],
        status: "active",
        imageUrl: "/src/assets/images/vip_meeting_room_1782891837889.jpg",
        description: "ຫ້ອງປະຊຸມສຸດຫຼູຫຼາສຳລັບການປຶກສາຫາລືວຽກງານລັບ, ການປະຊຸມຜູ້ບໍລິຫານລະດັບສູງ ແລະ ແຂກພິເສດ",
        location: "ຊັ້ນ 3, ອາຄານ 2"
      }
    ];

    for (const rm of defaultRooms) {
      await setDoc(doc(db, "rooms", rm.id), rm);
    }
    console.log("Seeded 3 default rooms successfully");
  }
}

// Sync User Profile on Login
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  
  // Designate developer email as Admin automatically
  const isDefaultAdmin = user.email === "tounkmv99@gmail.com";
  const isDefaultUser = user.email === "staff.houaphanh@gmail.com";
  
  if (userSnap.exists()) {
    const data = userSnap.data() as UserProfile;
    // Auto upgrade if default admin
    if (isDefaultAdmin && (data.role !== "admin" || data.status !== "active")) {
      const updatedProfile = { 
        ...data, 
        role: "admin" as UserRole, 
        status: "active" as UserStatus 
      };
      await setDoc(userRef, updatedProfile, { merge: true });
      return updatedProfile;
    }
    // Auto active if default user
    if (isDefaultUser && data.status !== "active") {
      const updatedProfile = { 
        ...data, 
        status: "active" as UserStatus 
      };
      await setDoc(userRef, updatedProfile, { merge: true });
      return updatedProfile;
    }
    return data;
  } else {
    // Create new profile
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || (isDefaultUser ? "ພະນັກງານຕົວຢ່າງ (Staff)" : user.email?.split("@")[0]) || "User",
      email: user.email || "",
      role: isDefaultAdmin ? "admin" : "user",
      department: isDefaultAdmin ? "ຫ້ອງວ່າການແຂວງ" : "ພະແນກທົ່ວໄປ",
      phone: "",
      status: (isDefaultAdmin || isDefaultUser) ? "active" : "pending",
      createdAt: new Date().toISOString()
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

// Fetch all users
export async function getAllUsers(): Promise<UserProfile[]> {
  const usersRef = collection(db, "users");
  const querySnapshot = await getDocs(usersRef);
  const usersList: UserProfile[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data() as UserProfile;
    usersList.push({
      ...data,
      uid: docSnap.id || data.uid,
      displayName: data.displayName || data.email?.split("@")[0] || "User",
      email: data.email || "",
      role: data.role || "user",
      status: data.status || "pending",
      createdAt: data.createdAt || new Date().toISOString()
    });
  });
  return usersList;
}

// Update user role or status
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, updates, { merge: true });
}

// Create new user profile
export async function createUserProfile(profile: UserProfile) {
  const userRef = doc(db, "users", profile.uid);
  await setDoc(userRef, profile);
}

// Delete user profile
export async function deleteUserProfile(uid: string) {
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
}

// Rooms API
export async function getRooms(): Promise<MeetingRoom[]> {
  await seedDefaultRooms(); // Ensure some default rooms exist
  const roomsRef = collection(db, "rooms");
  const querySnapshot = await getDocs(roomsRef);
  const roomsList: MeetingRoom[] = [];
  querySnapshot.forEach((doc) => {
    roomsList.push(doc.data() as MeetingRoom);
  });
  return roomsList;
}

export async function addRoom(room: MeetingRoom) {
  const roomRef = doc(db, "rooms", room.id);
  await setDoc(roomRef, room);
}

export async function updateRoom(roomId: string, updates: Partial<MeetingRoom>) {
  const roomRef = doc(db, "rooms", roomId);
  await setDoc(roomRef, updates, { merge: true });
}

export async function deleteRoom(roomId: string) {
  const roomRef = doc(db, "rooms", roomId);
  await deleteDoc(roomRef);
}

// Simulated Email Logger
export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  isRead?: boolean;
}

export async function logSimulatedEmail(to: string, subject: string, body: string) {
  const emailId = "email_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const emailLog: EmailLog = {
    id: emailId,
    to,
    subject,
    body,
    sentAt: new Date().toISOString(),
    isRead: false
  };
  await setDoc(doc(db, "emails", emailId), emailLog);
}

export async function markEmailAsRead(emailId: string) {
  const emailRef = doc(db, "emails", emailId);
  await updateDoc(emailRef, { isRead: true });
}

// Create In-App Notification
export async function createNotification(userId: string, title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") {
  const notifId = "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const notif: SystemNotification = {
    id: notifId,
    userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, "notifications", notifId), notif);
}

// Bookings API
export async function getBookings(): Promise<RoomBooking[]> {
  const bookingsRef = collection(db, "bookings");
  const querySnapshot = await getDocs(bookingsRef);
  const bookingsList: RoomBooking[] = [];
  querySnapshot.forEach((doc) => {
    bookingsList.push(doc.data() as RoomBooking);
  });
  // Sort by date then startTime
  return bookingsList.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });
}

export async function addBooking(booking: RoomBooking) {
  // 1. Save booking to Firestore
  const bookingRef = doc(db, "bookings", booking.id);
  await setDoc(bookingRef, booking);

  // 2. Create in-app notification for Admins
  // We'll query all admins or simply add a generic notification with userId 'admin' or broadcast
  await createNotification(
    "admin",
    `ມີການຈອງໃໝ່: ${booking.roomName}`,
    `ຜູ້ຈອງ: ${booking.userName} (${booking.department}) ຫົວຂໍ້: "${booking.title}" ໃນວັນທີ ${booking.date} ເວລາ ${booking.startTime}-${booking.endTime}`,
    "info"
  );

  // 3. Log simulated email to admin & user
  const adminEmail = "tounkmv99@gmail.com";
  const userEmail = booking.userEmail;

  // Email to Admin
  await logSimulatedEmail(
    adminEmail,
    `[E-Office ຫົວພັນ] ຄຳຮ້ອງຈອງຫ້ອງປະຊຸມໃໝ່ - ${booking.roomName}`,
    `<h3>ສະບາຍດີ ຜູ້ດູແລລະບົບ,</h3>
     <p>ມີຄຳຮ້ອງຂໍຈອງຫ້ອງປະຊຸມໃໝ່ເຂົ້າມາໃນລະບົບ:</p>
     <ul>
       <li><b>ຫ້ອງປະຊຸມ:</b> ${booking.roomName}</li>
       <li><b>ຫົວຂໍ້:</b> ${booking.title}</li>
       <li><b>ວັນທີ:</b> ${booking.date}</li>
       <li><b>ເວລາ:</b> ${booking.startTime} ຫາ ${booking.endTime}</li>
       <li><b>ຜູ້ຈອງ:</b> ${booking.userName} (${booking.department})</li>
       <li><b>ເບີໂທ:</b> ${booking.notes || "ບໍ່ມີ"}</li>
     </ul>
     <p>ກະລຸນາເຂົ້າລະບົບເພື່ອອະນຸມັດ ຫຼື ປະຕິເສດ ຄຳຮ້ອງນີ້.</p>`
  );

  // Email to User
  await logSimulatedEmail(
    userEmail,
    `[E-Office ຫົວພັນ] ຍື່ນຄຳຮ້ອງຈອງຫ້ອງປະຊຸມແລ້ວ - ${booking.roomName}`,
    `<h3>ສະບາຍດີທ່ານ ${booking.userName},</h3>
     <p>ລະບົບໄດ້ຮັບຄຳຮ້ອງຈອງຫ້ອງປະຊຸມຂອງທ່ານແລ້ວ:</p>
     <ul>
       <li><b>ຫ້ອງປະຊຸມ:</b> ${booking.roomName}</li>
       <li><b>ຫົວຂໍ້:</b> ${booking.title}</li>
       <li><b>ວັນທີ:</b> ${booking.date}</li>
       <li><b>ເວລາ:</b> ${booking.startTime} - ${booking.endTime}</li>
     </ul>
     <p>ສະຖານະປັດຈຸບັນ: <b>ລໍຖ້າການອະນຸມັດ</b>. ລະບົບຈະແຈ້ງເຕືອນທ່ານອີກຄັ້ງເມື່ອໄດ້ຮັບການກວດສອບ.</p>`
  );
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus, adminNotes: string = "") {
  const bookingRef = doc(db, "bookings", bookingId);
  const bookingSnap = await getDoc(bookingRef);
  
  if (bookingSnap.exists()) {
    const booking = bookingSnap.data() as RoomBooking;
    await updateDoc(bookingRef, { status });

    const statusTextLao = status === "approved" ? "ໄດ້ຮັບການອະນຸມັດແລ້ວ" : "ຖືກປະຕິເສດ";
    const typeNotif = status === "approved" ? "success" : "error";

    // Create In-App Notification for user
    await createNotification(
      booking.userId,
      `ຜົນການຈອງຫ້ອງ ${booking.roomName}: ${statusTextLao}`,
      `ຄຳຮ້ອງຈອງຫ້ອງຂອງທ່ານສຳລັບຫົວຂໍ້ "${booking.title}" ໃນວັນທີ ${booking.date} ${statusTextLao}. ${adminNotes ? 'ເຫດຜົນ: ' + adminNotes : ''}`,
      typeNotif
    );

    // Simulated Email Notification to user
    await logSimulatedEmail(
      booking.userEmail,
      `[E-Office ຫົວພັນ] ຜົນການຈອງຫ້ອງປະຊຸມ - ${statusTextLao}`,
      `<h3>ສະບາຍດີ ທ່ານ ${booking.userName},</h3>
       <p>ຄຳຮ້ອງຂໍຈອງຫ້ອງປະຊຸມຂອງທ່ານໄດ້ຮັບການກວດສອບຈາກຜູ້ດູແລລະບົບແລ້ວ:</p>
       <ul>
         <li><b>ຫ້ອງປະຊຸມ:</b> ${booking.roomName}</li>
         <li><b>ຫົວຂໍ້:</b> ${booking.title}</li>
         <li><b>ວັນທີ:</b> ${booking.date}</li>
         <li><b>ເວລາ:</b> ${booking.startTime} - ${booking.endTime}</li>
         <li><b>ສະຖານະໃໝ່:</b> <b style="color: ${status === "approved" ? "green" : "red"}">${statusTextLao.toUpperCase()}</b></li>
         ${adminNotes ? `<li><b>ໝາຍເຫດ/ເຫດຜົນ:</b> ${adminNotes}</li>` : ""}
       </ul>
       <p>ຂອບໃຈທີ່ໃຊ້ບໍລິການລະບົບຈອງຫ້ອງປະຊຸມ ຫ້ອງວ່າການແຂວງຫົວພັນ.</p>`
    );
  }
}

export async function deleteBooking(bookingId: string) {
  const bookingRef = doc(db, "bookings", bookingId);
  await deleteDoc(bookingRef);
}

export async function updateBooking(bookingId: string, updates: Partial<RoomBooking>) {
  const bookingRef = doc(db, "bookings", bookingId);
  await setDoc(bookingRef, updates, { merge: true });
}

export async function clearAllBookings(): Promise<void> {
  const bookingsRef = collection(db, "bookings");
  const querySnapshot = await getDocs(bookingsRef);
  const deletePromises: Promise<void>[] = [];
  querySnapshot.forEach((docSnap) => {
    deletePromises.push(deleteDoc(doc(db, "bookings", docSnap.id)));
  });
  await Promise.all(deletePromises);
}
