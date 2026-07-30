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

// Seed default admin if none exists
export async function seedDefaultAdmin() {
  try {
    const userRef = doc(db, "users", "admin_default");
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const defaultAdmin: UserProfile = {
        uid: "admin_default",
        username: "Admin",
        password: "admin123",
        displayName: "ຄໍາຕຸ່ນ ຄໍາມະວົງ (ແອັດມິນ)",
        email: "tounkmv99@gmail.com",
        role: "admin",
        department: "ຫ້ອງວ່າການແຂວງຫົວພັນ",
        phone: "020 5555 5555",
        status: "active",
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, defaultAdmin);
      console.log("Seeded default Admin account successfully in Firestore");
    }
  } catch (err) {
    console.error("Error seeding default admin:", err);
  }
}

// Sync User Profile on Login
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  
  // Designate developer/admin email as Admin automatically
  const isDefaultAdmin = user.email === "tounkmv99@gmail.com";
  const isDefaultUser = user.email === "staff.houaphanh@gmail.com";
  
  if (userSnap.exists()) {
    const data = userSnap.data() as UserProfile;
    // Auto upgrade if default admin
    if (isDefaultAdmin && (data.role !== "admin" || data.status !== "active")) {
      const updatedProfile = { 
        ...data, 
        displayName: data.displayName && data.displayName !== "Admin" ? data.displayName : "ຄໍາຕຸ່ນ ຄໍາມະວົງ",
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
      displayName: isDefaultAdmin ? "ຄໍາຕຸ່ນ ຄໍາມະວົງ" : (user.displayName || (isDefaultUser ? "ພະນັກງານຕົວຢ່າງ (Staff)" : user.email?.split("@")[0]) || "User"),
      email: user.email || "",
      role: isDefaultAdmin ? "admin" : "user",
      department: isDefaultAdmin ? "ຫ້ອງວ່າການແຂວງຫົວພັນ" : "ພະແນກທົ່ວໄປ",
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
  await createNotification(
    "admin",
    `ມີການຈອງໃໝ່: ${booking.roomName}`,
    `ຜູ້ຈອງ: ${booking.userName} (${booking.department}) ຫົວຂໍ້: "${booking.title}" ໃນວັນທີ ${booking.date} ເວລາ ${booking.startTime}-${booking.endTime}`,
    "info"
  );

  // 3. Email Notification specifically targeting System Admin Gmail: tounkmv99@gmail.com (ຄໍາຕຸ່ນ ຄໍາມະວົງ)
  const adminEmail = "tounkmv99@gmail.com";
  const userEmail = booking.userEmail;

  // HTML Email format to System Admin
  const adminEmailBody = `
    <div style="font-family: 'Phetsarath OT', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #fbbf24; text-transform: uppercase;">
          🏛️ ຫ້ອງວ່າການແຂວງຫົວພັນ - ລະບົບຈອງຫ້ອງປະຊຸມ E-Office
        </h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff;">
          ແຈ້ງເຕືອນຄຳຮ້ອງຂໍຈອງຫ້ອງປະຊຸມໃໝ່ເຂົ້າມາໃນລະບົບ
        </p>
      </div>
      
      <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;"><b>ສະບາຍດີ ທ່ານ ຄໍາຕຸ່ນ ຄໍາມະວົງ (ແອັດມິນຄຸ້ມຄອງລະບົບ),</b></p>
        <p>ມີຄຳຮ້ອງຂໍຈອງຫ້ອງປະຊຸມໃໝ່ຖືກຍື່ນເຂົ້າມາໃນລະບົບ. ກະລຸນາຕິດຕາມ, ກວດກາ ແລະ ອະນຸມັດ/ປະຕິເສດ ຄຳຮ້ອງນີ້:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 140px;">🏢 ຫ້ອງປະຊຸມ:</td>
              <td style="padding: 6px 0; font-weight: 800; color: #1e1b4b;">${booking.roomName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">📝 ຫົວຂໍ້ກອງປະຊຸມ:</td>
              <td style="padding: 6px 0; font-weight: 700;">${booking.title}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">📅 ວັນທີ:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #2563eb;">${booking.date}${booking.endDate && booking.endDate !== booking.date ? ` ຫາ ${booking.endDate}` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">⏰ ເວລາ:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #d97706;">${booking.startTime} ຫາ ${booking.endTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">💼 ພະແນກ/ຂະແໜງ:</td>
              <td style="padding: 6px 0; font-weight: bold;">${booking.department || "ທົ່ວໄປ"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">👤 ຜູ້ຍື່ນຈອງ:</td>
              <td style="padding: 6px 0; font-weight: bold;">${booking.userName} (${booking.userEmail})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">👥 ຈຳນວນຜູ້ເຂົ້າຮ່ວມ:</td>
              <td style="padding: 6px 0;">${booking.attendeesCount} ທ່ານ</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">📞 ເບີໂທຕິດຕໍ່:</td>
              <td style="padding: 6px 0;">${booking.notes || "ບໍ່ມີ"}</td>
            </tr>
            ${booking.purpose ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">🎯 ຈຸດປະສົງ:</td>
              <td style="padding: 6px 0;">${booking.purpose}</td>
            </tr>` : ''}
            ${booking.attachmentName ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">📎 ເອກະສານແນບ:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #059669;">${booking.attachmentName}</td>
            </tr>` : ''}
          </table>
        </div>
        
        <p style="text-align: center; margin-top: 24px;">
          <a href="https://ais-dev-q6yd6q4rurhqskqwdzmkaw-966142963062.asia-southeast1.run.app" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: bold; font-size: 13px; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
            👉 ເຂົ້າລະບົບເພື່ອຕິດຕາມ ແລະ ອະນຸມັດການຈອງ
          </a>
        </p>
      </div>
      
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">ແຈ້ງເຕືອນອັດໂນມັດຈາກລະບົບ E-Office ຫ້ອງວ່າການແຂວງຫົວພັນ (Gmail: tounkmv99@gmail.com)</p>
      </div>
    </div>
  `;

  await logSimulatedEmail(
    adminEmail,
    `[E-Office ຫົວພັນ] ແຈ້ງເຕືອນ: ມີການຈອງຫ້ອງປະຊຸມໃໝ່ເຂົ້າມາ - ${booking.roomName}`,
    adminEmailBody
  );

  // Confirmation Email to Requester
  const userEmailBody = `
    <div style="font-family: 'Phetsarath OT', sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h3 style="color: #2563eb; margin-top: 0;">ສະບາຍດີທ່ານ ${booking.userName},</h3>
      <p>ລະບົບໄດ້ຮັບຄຳຮ້ອງຂໍຈອງຫ້ອງປະຊຸມຂອງທ່ານແລ້ວ:</p>
      <ul style="line-height: 1.8;">
        <li><b>ຫ້ອງປະຊຸມ:</b> ${booking.roomName}</li>
        <li><b>ຫົວຂໍ້:</b> ${booking.title}</li>
        <li><b>ວັນທີ:</b> ${booking.date}${booking.endDate && booking.endDate !== booking.date ? ` ຫາ ${booking.endDate}` : ''}</li>
        <li><b>ເວລາ:</b> ${booking.startTime} - ${booking.endTime}</li>
        <li><b>ສະຖານະ:</b> <span style="color: #d97706; font-weight: bold;">ລໍຖ້າການອະນຸມັດຈາກແອດມິນ (ຄໍາຕຸ່ນ ຄໍາມະວົງ)</span></li>
      </ul>
      <p>ລະບົບໄດ້ສົ່ງແຈ້ງເຕືອນໄປຫາ Gmail ຂອງແອັດມິນ (tounkmv99@gmail.com) ເພື່ອກວດສອບ ແລະ ດຳເນີນການອະນຸມັດແລ້ວ.</p>
    </div>
  `;

  await logSimulatedEmail(
    userEmail,
    `[E-Office ຫົວພັນ] ຍື່ນຄຳຮ້ອງຈອງຫ້ອງປະຊຸມແລ້ວ - ${booking.roomName}`,
    userEmailBody
  );
}

// Function to trigger test email to Admin Gmail
export async function sendAdminTestEmail(adminEmail: string = "tounkmv99@gmail.com") {
  const testSubject = `[E-Office ຫົວພັນ] ທົດລອງລະບົບແຈ້ງເຕືອນ Gmail ຜູ້ດູແລລະບົບ (tounkmv99@gmail.com)`;
  const testBody = `
    <div style="font-family: 'Phetsarath OT', sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 2px solid #10b981; border-radius: 16px; background-color: #ffffff;">
      <h3 style="color: #059669; margin-top: 0;">✅ ທົດລອງການເຊື່ອມຕໍ່ລະບົບແຈ້ງເຕືອນ Gmail ສຳເລັດ!</h3>
      <p><b>ສະບາຍດີ ທ່ານ ຄໍາຕຸ່ນ ຄໍາມະວົງ,</b></p>
      <p>ນີ້ແມ່ນອີເມວທົດລອງຈາກລະບົບ E-Office ຫ້ອງວ່າການແຂວງຫົວພັນ ເພື່ອຢືນຢັນວ່າລະບົບແຈ້ງເຕືອນຜ່ານ Gmail ສຳລັບແອັດມິນ (<b>tounkmv99@gmail.com</b>) ເຮັດວຽກໄດ້ຢ່າງສົມບູນ.</p>
      <p><b>ຟັງຊັນແຈ້ງເຕືອນອັດໂນມັດ:</b> ເມື່ອມີຜູ້ໃຊ້ຍື່ນຄຳຮ້ອງຈອງຫ້ອງປະຊຸມເຂົ້າມາ, ລະບົບຈະສົ່ງແຈ້ງເຕືອນພ້ອມລາຍລະອຽດການຈອງມາຫາກ່ອງຂໍ້ຄວາມຂອງທ່ານທັນທີ.</p>
      <p style="font-size: 11px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        ເວລາທົດລອງ: ${new Date().toLocaleString()}
      </p>
    </div>
  `;
  await logSimulatedEmail(adminEmail, testSubject, testBody);
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
