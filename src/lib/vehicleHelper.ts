import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc 
} from "./firebase";
import { Vehicle, VehicleBooking, VehicleStatus, VehicleBookingStatus } from "../types";
import { createNotification, logSimulatedEmail } from "./firebaseHelper";

export const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: "veh_1",
    name: "Toyota Fortuner Legender 4WD",
    plateNumber: "ກກ 8899 ຫົວພັນ",
    type: "suv",
    capacity: 7,
    fuelType: "ກາຊວນ (Diesel)",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    defaultDriver: "ທ້າວ ສົມສັກ ວົງໄຊ",
    driverPhone: "020 5511 2233",
    mileage: 42500,
    department: "ຫ້ອງວ່າການແຂວງຫົວພັນ",
    notes: "ລົດປະຈຳການນຳພາຂັ້ນສູງ, ຂັບເຄື່ອນ 4 ລໍ້, ເໝາະສົມທຸກສະພາບເສັ້ນທາງ",
    createdAt: new Date().toISOString()
  },
  {
    id: "veh_2",
    name: "Toyota Hilux Revo Rocco 4x4",
    plateNumber: "ກກ 5544 ຫົວພັນ",
    type: "pickup",
    capacity: 5,
    fuelType: "ກາຊວນ (Diesel)",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80",
    defaultDriver: "ທ້າວ ບຸນທັນ ມະນີວົງ",
    driverPhone: "020 5588 7766",
    mileage: 68300,
    department: "ຫ້ອງວ່າການແຂວງຫົວພັນ",
    notes: "ລົດກະບະ 4 ປະຕູ, ພ້ອມລຸຍວຽກງານລົງພື້ນຖານ ແລະ ບັນທຸກອຸປະກອນ",
    createdAt: new Date().toISOString()
  },
  {
    id: "veh_3",
    name: "Toyota Commuter VIP",
    plateNumber: "ກກ 7711 ຫົວພັນ",
    type: "van",
    capacity: 14,
    fuelType: "ກາຊວນ (Diesel)",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80",
    defaultDriver: "ທ້າວ ຄຳຜົງ ແກ້ວມະນີ",
    driverPhone: "020 9944 3322",
    mileage: 51200,
    department: "ຫ້ອງວ່າການແຂວງຫົວພັນ",
    notes: "ລົດຕູ້ VIP 14 ບ່ອນນັ່ງ, ແອເຢັນ, ຕ້ອນຮັບຄະນະຜູ້ແທນ ແລະ ເດີນທາງເປັນໝູ່ຄະນະ",
    createdAt: new Date().toISOString()
  },
  {
    id: "veh_4",
    name: "Toyota Camry 2.5 Hybrid",
    plateNumber: "ກກ 9900 ຫົວພັນ",
    type: "sedan",
    capacity: 5,
    fuelType: "ແອັດຊັງ/ໄຮບຣິດ (Hybrid)",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80",
    defaultDriver: "ທ້າວ ວຽງໄຊ ຫຼວງໂຄດ",
    driverPhone: "020 5522 1100",
    mileage: 29800,
    department: "ຫ້ອງວ່າການແຂວງຫົວພັນ",
    notes: "ລົດເກັງຫຼູຫຼາ ປະຢັດນ້ຳມັນ, ໃຊ້ສຳລັບຕ້ອນຮັບແຂກພິເສດ ແລະ ວຽກງານທາງການໃນເທດສະບານ",
    createdAt: new Date().toISOString()
  },
  {
    id: "veh_5",
    name: "Isuzu D-Max V-Cross 4x4",
    plateNumber: "ກກ 3322 ຫົວພັນ",
    type: "pickup",
    capacity: 5,
    fuelType: "ກາຊວນ (Diesel)",
    status: "maintenance",
    imageUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
    defaultDriver: "ທ້າວ ສົມພອນ ແກ້ວວິໄລ",
    driverPhone: "020 7711 5599",
    mileage: 89400,
    department: "ຫ້ອງວ່າການແຂວງຫົວພັນ",
    notes: "ຢູ່ລະຫວ່າງການກວດເຊັກໄລຍະປ່ຽນນ້ຳມັນເຄື່ອງ ແລະ ລະບົບເບຣກ ປະຈຳໄຕມາດ",
    createdAt: new Date().toISOString()
  }
];

// Seed default vehicles if collection is empty
export async function seedDefaultVehicles(): Promise<Vehicle[]> {
  try {
    const vehiclesRef = collection(db, "vehicles");
    const querySnapshot = await getDocs(vehiclesRef);

    if (querySnapshot.empty) {
      for (const veh of DEFAULT_VEHICLES) {
        await setDoc(doc(db, "vehicles", veh.id), veh);
      }
      localStorage.setItem("local_vehicles", JSON.stringify(DEFAULT_VEHICLES));
      return DEFAULT_VEHICLES;
    } else {
      const list: Vehicle[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Vehicle);
      });
      localStorage.setItem("local_vehicles", JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn("Firestore seed vehicles fallback to localStorage:", err);
    const local = localStorage.getItem("local_vehicles");
    if (!local) {
      localStorage.setItem("local_vehicles", JSON.stringify(DEFAULT_VEHICLES));
      return DEFAULT_VEHICLES;
    }
    return JSON.parse(local);
  }
}

// Add Vehicle
export async function createVehicle(vehicleData: Omit<Vehicle, "id">): Promise<Vehicle> {
  const newId = "veh_" + Date.now();
  const newVehicle: Vehicle = {
    ...vehicleData,
    id: newId,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "vehicles", newId), newVehicle);
  } catch (err) {
    console.warn("Firestore create vehicle fallback:", err);
  }

  // Update localStorage
  try {
    const local = localStorage.getItem("local_vehicles");
    const list: Vehicle[] = local ? JSON.parse(local) : [...DEFAULT_VEHICLES];
    list.unshift(newVehicle);
    localStorage.setItem("local_vehicles", JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }

  return newVehicle;
}

// Update Vehicle
export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<void> {
  try {
    await updateDoc(doc(db, "vehicles", id), updates);
  } catch (err) {
    console.warn("Firestore update vehicle fallback:", err);
  }

  try {
    const local = localStorage.getItem("local_vehicles");
    if (local) {
      const list: Vehicle[] = JSON.parse(local);
      const idx = list.findIndex(v => v.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem("local_vehicles", JSON.stringify(list));
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// Delete Vehicle
export async function deleteVehicle(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "vehicles", id));
  } catch (err) {
    console.warn("Firestore delete vehicle fallback:", err);
  }

  try {
    const local = localStorage.getItem("local_vehicles");
    if (local) {
      const list: Vehicle[] = JSON.parse(local);
      const filtered = list.filter(v => v.id !== id);
      localStorage.setItem("local_vehicles", JSON.stringify(filtered));
    }
  } catch (e) {
    console.error(e);
  }
}

// Update Vehicle Status
export async function setVehicleStatus(id: string, status: VehicleStatus): Promise<void> {
  return updateVehicle(id, { status });
}

// Create Vehicle Booking
export async function createVehicleBooking(
  bookingData: Omit<VehicleBooking, "id" | "createdAt" | "status">
): Promise<VehicleBooking> {
  const newId = "v_book_" + Date.now();
  const newBooking: VehicleBooking = {
    ...bookingData,
    id: newId,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  // 1. Save booking to Firestore
  try {
    await setDoc(doc(db, "vehicle_bookings", newId), newBooking);
  } catch (err) {
    console.warn("Firestore create vehicle booking fallback:", err);
  }

  // 2. Save booking to LocalStorage cache
  try {
    const local = localStorage.getItem("local_vehicle_bookings");
    const list: VehicleBooking[] = local ? JSON.parse(local) : [];
    list.unshift(newBooking);
    localStorage.setItem("local_vehicle_bookings", JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }

  // 3. Create In-App Notification for Admins
  try {
    await createNotification(
      "admin",
      `🚗 ມີຄຳຮ້ອງຂໍຈອງລົດໃໝ່: ${bookingData.vehicleName} (${bookingData.vehiclePlate})`,
      `ຜູ້ຈອງ: ${bookingData.userName} (${bookingData.department || "ຫ້ອງວ່າການແຂວງ"}) ຂໍນຳໃຊ້ລົດໄປ: ${bookingData.destination} | ຈຸດປະສົງ: "${bookingData.purpose}" | ວັນທີ: ${bookingData.startDate} (${bookingData.startTime}) ຫາ ${bookingData.endDate} (${bookingData.endTime})`,
      "warning"
    );
  } catch (err) {
    console.warn("Failed creating admin vehicle notification:", err);
  }

  // 4. Create In-App Notification for Requester User
  try {
    if (bookingData.userId) {
      await createNotification(
        bookingData.userId,
        `📋 ຍື່ນຄຳຮ້ອງຂໍຈອງລົດສຳເລັດ: ${bookingData.vehicleName}`,
        `ຄຳຮ້ອງຂໍຈອງລົດ ${bookingData.vehiclePlate} ໄປ ${bookingData.destination} ຖືກສົ່ງເຂົ້າສູ່ສູນອະນຸມັດການຈອງລົດແລ້ວ. ກະລຸນາລໍຖ້າການກວດສອບ ແລະ ອະນຸມັດຈາກແອັດມິນ.`,
        "info"
      );
    }
  } catch (err) {
    console.warn("Failed creating user vehicle notification:", err);
  }

  // 5. Send Simulated/Real Email to System Admin (tounkmv99@gmail.com)
  try {
    const adminEmail = "tounkmv99@gmail.com";
    const adminEmailBody = `
      <div style="font-family: 'Phetsarath OT', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #fef3c7; text-transform: uppercase;">
            🚗 ຫ້ອງວ່າການແຂວງຫົວພັນ - ລະບົບການຈັດການລົດບໍລິຫານ
          </h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #fef3c7;">
            ແຈ້ງເຕືອນຄຳຮ້ອງຂໍຈອງລົດລັດຖະການໃໝ່ເຂົ້າມາສູ່ສູນອະນຸມັດ
          </p>
        </div>
        
        <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <p style="margin-top: 0;"><b>ສະບາຍດີ ທ່ານ ຄໍາຕຸ່ນ ຄໍາມະວົງ (ແອັດມິນຄຸ້ມຄອງລະບົບລົດບໍລິຫານ),</b></p>
          <p>ມີຄຳຮ້ອງຂໍຈອງລົດລັດຖະການໃໝ່ຖືກຍື່ນເຂົ້າມາໃນລະບົບ. ກະລຸນາຕິດຕາມ, ກວດກາ ແລະ ພິຈາລະນາອະນຸມັດ ພ້ອມທັງມອບໝາຍພະນັກງານຂັບລົດ:</p>
          
          <div style="background-color: #fffbeb; border-left: 4px solid #d97706; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #78350f; font-weight: bold; width: 140px;">🚘 ລົດທີ່ຮ້ອງຂໍ:</td>
                <td style="padding: 6px 0; font-weight: 800; color: #78350f;">${bookingData.vehicleName} (${bookingData.vehiclePlate})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #78350f; font-weight: bold;">📍 ຈຸດໝາຍປາຍທາງ:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #b45309;">${bookingData.destination}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #78350f; font-weight: bold;">📝 ຈຸດປະສົງ / ວຽກງານ:</td>
                <td style="padding: 6px 0; font-weight: 600;">${bookingData.purpose}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #78350f; font-weight: bold;">📅 ວັນທີເດີນທາງ:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #2563eb;">${bookingData.startDate} (${bookingData.startTime}) ຫາ ${bookingData.endDate} (${bookingData.endTime})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #78350f; font-weight: bold;">👤 ຜູ້ຍື່ນຈອງ:</td>
                <td style="padding: 6px 0; font-weight: bold;">${bookingData.userName} (${bookingData.department})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #78350f; font-weight: bold;">📞 ເບີໂທຕິດຕໍ່:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #059669;">${bookingData.phone || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #78350f; font-weight: bold;">👥 ຈຳນວນຜູ້ໂດຍສານ:</td>
                <td style="padding: 6px 0; font-weight: bold;">${bookingData.passengersCount} ທ່ານ</td>
              </tr>
            </table>
          </div>
          
          <p style="margin-bottom: 0; font-size: 13px; color: #64748b;">
            💡 ທ່ານສາມາດເຂົ້າສູ່ລະບົບ "ສູນອະນຸມັດການຈອງລົດ (Booking Approvals)" ເພື່ອກວດກາ ແລະ ກົດອະນຸມັດໄດ້ທັນທີ.
          </p>
        </div>
      </div>
    `;
    await logSimulatedEmail(
      adminEmail,
      `🚗 ແຈ້ງເຕືອນຄຳຮ້ອງຂໍຈອງລົດລັດຖະການໃໝ່: ${bookingData.vehicleName} (${bookingData.vehiclePlate})`,
      adminEmailBody
    );
  } catch (err) {
    console.warn("Failed sending admin vehicle email:", err);
  }

  // 6. Broadcast event for real-time listener across UI components and tabs
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("vehicle-booking-created", { detail: newBooking }));
      window.dispatchEvent(new CustomEvent("vehicle-bookings-updated", { detail: newBooking }));
    } catch (e) {
      console.error("Broadcast event error:", e);
    }
  }

  return newBooking;
}

// Update Vehicle Booking Status (Approve / Reject / Complete / Cancel)
export async function updateVehicleBookingStatus(
  id: string, 
  status: VehicleBookingStatus, 
  adminDetails?: { 
    assignedDriver?: string; 
    driverPhone?: string; 
    adminNotes?: string; 
    rejectionReason?: string; 
    approvedBy?: string; 
  }
): Promise<void> {
  const updates: Partial<VehicleBooking> = {
    status,
    ...(status === "approved" ? { approvedAt: new Date().toISOString() } : {}),
    ...(adminDetails || {})
  };

  // 1. Update Firestore
  try {
    await updateDoc(doc(db, "vehicle_bookings", id), updates);
  } catch (err) {
    console.warn("Firestore update vehicle booking status fallback:", err);
  }

  // 2. Update LocalStorage cache
  let targetBooking: VehicleBooking | undefined;
  try {
    const local = localStorage.getItem("local_vehicle_bookings");
    if (local) {
      const list: VehicleBooking[] = JSON.parse(local);
      const idx = list.findIndex(b => b.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        targetBooking = list[idx];
        localStorage.setItem("local_vehicle_bookings", JSON.stringify(list));
      }
    }
  } catch (e) {
    console.error(e);
  }

  // 3. Notify the Requester user
  if (targetBooking?.userId) {
    try {
      if (status === "approved") {
        await createNotification(
          targetBooking.userId,
          `✅ ຄຳຮ້ອງຂໍຈອງລົດໄດ້ຮັບການອະນຸມັດ: ${targetBooking.vehicleName}`,
          `ຄຳຮ້ອງຂໍຈອງລົດ ${targetBooking.vehiclePlate} ໄປ ${targetBooking.destination} ໄດ້ຮັບການອະນຸມັດແລ້ວ!${adminDetails?.assignedDriver ? ` ພະນັກງານຂັບລົດ: ${adminDetails.assignedDriver} (ໂທ: ${adminDetails.driverPhone || "-"})` : ""}`,
          "success"
        );

        if (targetBooking.userEmail) {
          await logSimulatedEmail(
            targetBooking.userEmail,
            `✅ ຄຳຮ້ອງຂໍຈອງລົດຂອງທ່ານໄດ້ຮັບການອະນຸມັດແລ້ວ: ${targetBooking.vehiclePlate}`,
            `
              <div style="font-family: sans-serif; padding: 20px; border-radius: 12px; border: 1px solid #10b981;">
                <h3 style="color: #059669;">ຄຳຮ້ອງຂໍຈອງລົດຂອງທ່ານໄດ້ຮັບການອະນຸມັດແລ້ວ!</h3>
                <p><b>ລົດ:</b> ${targetBooking.vehicleName} (${targetBooking.vehiclePlate})</p>
                <p><b>ປາຍທາງ:</b> ${targetBooking.destination}</p>
                <p><b>ວັນທີ:</b> ${targetBooking.startDate} (${targetBooking.startTime}) ຫາ ${targetBooking.endDate} (${targetBooking.endTime})</p>
                <p><b>ພະນັກງານຂັບລົດ:</b> ${adminDetails?.assignedDriver || "ຕາມທີ່ກຳນົດ"} (ເບີໂທ: ${adminDetails?.driverPhone || "-"})</p>
              </div>
            `
          );
        }
      } else if (status === "rejected") {
        await createNotification(
          targetBooking.userId,
          `❌ ຄຳຮ້ອງຂໍຈອງລົດຖືກປະຕິເສດ: ${targetBooking.vehicleName}`,
          `ຄຳຮ້ອງຂໍຈອງລົດ ${targetBooking.vehiclePlate} ໄປ ${targetBooking.destination} ບໍ່ໄດ້ຮັບການອະນຸມັດ. ເຫດຜົນ: ${adminDetails?.rejectionReason || "ບໍ່ສາມາດຕອບສະໜອງໄດ້ໃນຊ່ວງເວລານີ້"}`,
          "error"
        );

        if (targetBooking.userEmail) {
          await logSimulatedEmail(
            targetBooking.userEmail,
            `❌ ແຈ້ງເຕືອນ: ຄຳຮ້ອງຂໍຈອງລົດບໍ່ໄດ້ຮັບການອະນຸມັດ: ${targetBooking.vehiclePlate}`,
            `
              <div style="font-family: sans-serif; padding: 20px; border-radius: 12px; border: 1px solid #ef4444;">
                <h3 style="color: #dc2626;">ຄຳຮ້ອງຂໍຈອງລົດບໍ່ໄດ້ຮັບການອະນຸມັດ</h3>
                <p><b>ລົດ:</b> ${targetBooking.vehicleName} (${targetBooking.vehiclePlate})</p>
                <p><b>ເຫດຜົນ:</b> ${adminDetails?.rejectionReason || "ບໍ່ສາມາດຕອບສະໜອງໄດ້ໃນຊ່ວງເວລານີ້"}</p>
              </div>
            `
          );
        }
      }
    } catch (e) {
      console.warn("Failed creating user notification on status update:", e);
    }
  }

  // 4. Broadcast event
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("vehicle-bookings-updated", { detail: { id, status, updates } }));
    } catch (e) {
      console.error(e);
    }
  }
}

// Check time overlap for a vehicle
export function checkVehicleConflict(
  vehicleId: string,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  existingBookings: VehicleBooking[],
  excludeBookingId?: string
): { hasConflict: boolean; conflictingBooking?: VehicleBooking } {
  // Only approved or pending bookings cause conflict
  const activeBookings = existingBookings.filter(
    b => b.vehicleId === vehicleId && 
         b.id !== excludeBookingId && 
         (b.status === "approved" || b.status === "pending")
  );

  const reqStart = new Date(`${startDate}T${startTime}`);
  const reqEnd = new Date(`${endDate}T${endTime}`);

  for (const b of activeBookings) {
    const bStart = new Date(`${b.startDate}T${b.startTime}`);
    const bEnd = new Date(`${b.endDate}T${b.endTime}`);

    // Overlap condition: reqStart < bEnd && reqEnd > bStart
    if (reqStart < bEnd && reqEnd > bStart) {
      return { hasConflict: true, conflictingBooking: b };
    }
  }

  return { hasConflict: false };
}
