import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  onSnapshot
} from "./firebase";
import { LeadershipActivity, ActivityCategory, ActivityStatus, ActivityPriority } from "../types";
import { createNotification } from "./firebaseHelper";

export const DEFAULT_ACTIVITIES: LeadershipActivity[] = [
  {
    id: "act_1",
    userId: "admin_default",
    userName: "ທ່ານ ບຸນມີ ວົງສະຫວັນ",
    userEmail: "admin@houaphanh.gov.la",
    roleTitle: "ຫົວໜ້າຫ້ອງວ່າການແຂວງ",
    department: "ຫ້ອງວ່າການແຂວງຫົວພັນ",
    title: "ເປັນປະທານກອງປະຊຸມຄະນະບໍລິຫານງານຫ້ອງວ່າການແຂວງ ປະຈຳເດືອນ",
    description: "ສະຫຼຸບຕີລາຄາການຈັດຕັ້ງປະຕິບັດວຽກງານໃນຮອບເດືອນຜ່ານມາ ແລະ ວາງທິດທາງແຜນການຈຸດສຸມໃນເດືອນຕໍ່ໜ້າ",
    category: "meeting",
    location: "ຫ້ອງປະຊຸມໃຫຍ່ຊັ້ນ 2 ຫ້ອງວ່າການແຂວງ",
    startDate: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    startTime: "08:30",
    endDate: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    endTime: "11:30",
    status: "completed",
    priority: "important",
    participants: "ຄະນະຫ້ອງວ່າການ, ຫົວໜ້າ-ຮອງຫົວໜ້າຂະແໜງທຸກຂະແໜງ",
    outcome: "ໄດ້ຮັບຮອງບົດສະຫຼຸບເດືອນ ແລະ ເອກະພາບ 5 ແຜນວຽກຈຸດສຸມ",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "act_2",
    userId: "admin_default",
    userName: "ທ່ານ ບຸນມີ ວົງສະຫວັນ",
    userEmail: "admin@houaphanh.gov.la",
    roleTitle: "ຫົວໜ້າຫ້ອງວ່າການແຂວງ",
    department: "ຫ້ອງວ່າການແຂວງຫົວພັນ",
    title: "ລົງເຄື່ອນໄຫວກວດກາ ແລະ ຕິດຕາມໂຄງການພັດທະນາພື້ນຖານໂຄງລ່າງ ຢູ່ເມືອງວຽງໄຊ",
    description: "ລົງກວດກາຄວາມຄືບໜ້າຕົວຈິງເສັ້ນທາງຄົມມະນາຄົມ ແລະ ພົບປະອຳນາດການປົກຄອງເມືອງວຽງໄຊ",
    category: "inspection",
    location: "ເມືອງວຽງໄຊ, ແຂວງຫົວພັນ",
    startDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    startTime: "08:00",
    endDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    endTime: "16:30",
    status: "completed",
    priority: "urgent",
    participants: "ຫົວໜ້າຂະແໜງຄົ້ນຄວ້າ-ສັງລວມ, ວິຊາການໂຄງການ ແລະ ທີມງານເມືອງວຽງໄຊ",
    outcome: "ໂຄງການບັນລຸ 75%, ໄດ້ແນະນຳໃຫ້ເລັ່ງຈັດຕັ້ງປະຕິບັດກ່ອນລະດູຝົນ",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "act_3",
    userId: "lead_khamphong",
    userName: "ທ່ານ ຄຳຜົງ ແສງມະນີ",
    userEmail: "khamphong@houaphanh.gov.la",
    roleTitle: "ຫົວໜ້າຂະແໜງຄົ້ນຄວ້າ-ສັງລວມ",
    department: "ຂະແໜງຄົ້ນຄວ້າ-ສັງລວມ",
    title: "ຮ່າງບົດລາຍງານ ແລະ ເອກະສານກອງປະຊຸມສະໄໝສາມັນ ສະພາປະຊາຊົນແຂວງ",
    description: "ຮວບຮວມຂໍ້ມູນສະຖິຕິການພັດທະນາເສດຖະກິດ-ສັງຄົມ ເພື່ອກະກຽມນຳສະເໜີຕໍ່ສະພາແຂວງ",
    category: "internal",
    location: "ຫ້ອງການຂະແໜງຄົ້ນຄວ້າ-ສັງລວມ",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endDate: new Date().toISOString().split("T")[0],
    endTime: "16:00",
    status: "in_progress",
    priority: "important",
    participants: "ວິຊາການຂະແໜງຄົ້ນຄວ້າ 3 ທ່ານ",
    createdAt: new Date().toISOString()
  },
  {
    id: "act_4",
    userId: "lead_somxay",
    userName: "ທ່ານ ສົມໄຊ ແກ້ວມະນີວົງ",
    userEmail: "somxay@houaphanh.gov.la",
    roleTitle: "ຫົວໜ້າຂະແໜງບໍລິຫານ-ພິທີການ",
    department: "ຂະແໜງບໍລິຫານ-ພິທີການ",
    title: "ກະກຽມພິທີຕ້ອນຮັບຄະນະຜູ້ແທນຂັ້ນສູງຈາກແຂວງແທງຮວາ (ສສ ຫວຽດນາມ)",
    description: "ກວດກາຫ້ອງຮັບຮອງ VIP, ພາຫະນະຮັບສົ່ງ, ແລະ ຈັດຕາຕະລາງລາຍການຕ້ອນຮັບລະອຽດ",
    category: "ceremony",
    location: "ຫ້ອງຮັບແຂກ VIP ຫ້ອງວ່າການແຂວງ",
    startDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    startTime: "09:00",
    endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    endTime: "17:00",
    status: "scheduled",
    priority: "urgent",
    participants: "ພະນັກງານຂະແໜງພິທີການ ແລະ ກອງຮ້ອຍປ້ອງກັນ",
    createdAt: new Date().toISOString()
  },
  {
    id: "act_5",
    userId: "lead_bounthavy",
    userName: "ທ່ານ ນາງ ບຸນທະວີ ສີສຸພັນ",
    userEmail: "bounthavy@houaphanh.gov.la",
    roleTitle: "ຫົວໜ້າຂະແໜງການເງິນ-ບັນຊີ",
    department: "ຂະແໜງການເງິນ-ບັນຊີ",
    title: "ເຂົ້າຮ່ວມສຳມະນາຝຶກອົບຮົມລະບົບບໍລິຫານງົບປະມານລັດແບບດີຈິຕອນ (GFIS)",
    description: "ຝຶກອົບຮົມການນຳໃຊ້ໂປຣແກຣມບັນຊີທັນສະໄໝ ເພື່ອເຊື່ອມໂຍງຖານຂໍ້ມູນແຂວງ",
    category: "training",
    location: "ຫ້ອງປະຊຸມຊັ້ນ 3 ພະແນກການເງິນແຂວງ",
    startDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    startTime: "08:30",
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    endTime: "16:30",
    status: "scheduled",
    priority: "normal",
    participants: "ພະນັກງານການເງິນຫ້ອງວ່າການແຂວງ 2 ທ່ານ",
    createdAt: new Date().toISOString()
  },
  {
    id: "act_6",
    userId: "admin_default",
    userName: "ທ່ານ ບຸນມີ ວົງສະຫວັນ",
    userEmail: "admin@houaphanh.gov.la",
    roleTitle: "ຫົວໜ້າຫ້ອງວ່າການແຂວງ",
    department: "ຫ້ອງວ່າການແຂວງຫົວພັນ",
    title: "ເຂົ້າຮ່ວມກອງປະຊຸມຄະນະກຳມະການພັດທະນາຊົນນະບົດ ແລະ ແກ້ໄຂຄວາມທຸກຍາກ",
    description: "ລາຍງານການຈັດຕັ້ງປະຕິບັດໂຄງການຊ່ວຍເຫຼືອປະຊາຊົນເຂດຫ່າງໄກສອກຫຼີກ ເມືອງຊຳໃຕ້",
    category: "meeting",
    location: "ຫ້ອງປະຊຸມໃຫຍ່ ຄະນະກຳມະການປະຊາຊົນແຂວງ",
    startDate: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0],
    startTime: "13:30",
    endDate: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0],
    endTime: "16:30",
    status: "scheduled",
    priority: "important",
    participants: "ບັນດາພະແນກການອ້ອມຂ້າງແຂວງ",
    createdAt: new Date().toISOString()
  }
];

// Department options in Houaphanh Provincial Office
export const PROVINCIAL_DEPARTMENTS = [
  "ຫ້ອງວ່າການແຂວງຫົວພັນ",
  "ຂະແໜງຄົ້ນຄວ້າ-ສັງລວມ",
  "ຂະແໜງບໍລິຫານ-ພິທີການ",
  "ຂະແໜງການເງິນ-ບັນຊີ",
  "ຂະແໜງກວດກາ",
  "ຂະແໜງຈັດຕັ້ງ-ພະນັກງານ",
  "ຂະແໜງປະສານງານ ແລະ ຂໍ້ມູນຂ່າວສານ",
  "ພະແນກແຜນການ ແລະ ການລົງທຶນ",
  "ພະແນກການເງິນແຂວງ",
  "ພະແນກໂຍທາທິການ ແລະ ຂົນສົ່ງ",
  "ພະແນກກະສິກຳ ແລະ ປ່າໄມ້"
];

// Role / Position Titles
export const POSITION_TITLES = [
  "ຫົວໜ້າຫ້ອງວ່າການແຂວງ",
  "ຮອງຫົວໜ້າຫ້ອງວ່າການແຂວງ",
  "ຫົວໜ້າພະແນກ",
  "ຮອງຫົວໜ້າພະແນກ",
  "ຫົວໜ້າຂະແໜງ",
  "ຮອງຫົວໜ້າຂະແໜງ",
  "ຫົວໜ້າໜ່ວຍງານ",
  "ວິຊາການ",
  "ພະນັກງານບໍລິຫານ"
];

// Seed default activities if collection is empty
export async function seedDefaultActivities(): Promise<void> {
  try {
    const activitiesRef = collection(db, "leadership_activities");
    const querySnapshot = await getDocs(activitiesRef);
    
    if (querySnapshot.empty) {
      for (const act of DEFAULT_ACTIVITIES) {
        await setDoc(doc(db, "leadership_activities", act.id), act);
      }
      localStorage.setItem("local_leadership_activities", JSON.stringify(DEFAULT_ACTIVITIES));
    } else {
      const list: LeadershipActivity[] = [];
      querySnapshot.forEach((d) => {
        list.push(d.data() as LeadershipActivity);
      });
      localStorage.setItem("local_leadership_activities", JSON.stringify(list));
    }
  } catch (err) {
    console.warn("Firestore seed activities fallback to localStorage:", err);
    const local = localStorage.getItem("local_leadership_activities");
    if (!local) {
      localStorage.setItem("local_leadership_activities", JSON.stringify(DEFAULT_ACTIVITIES));
    }
  }
}

// Create an activity
export async function createLeadershipActivity(
  data: Omit<LeadershipActivity, "id" | "createdAt">
): Promise<LeadershipActivity> {
  const newId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const nowStr = new Date().toISOString();

  const newActivity: LeadershipActivity = {
    ...data,
    id: newId,
    createdAt: nowStr,
    updatedAt: nowStr
  };

  try {
    await setDoc(doc(db, "leadership_activities", newId), newActivity);
  } catch (err) {
    console.warn("Firestore save activity fallback:", err);
  }

  // Update local cache
  try {
    const local = localStorage.getItem("local_leadership_activities");
    const list: LeadershipActivity[] = local ? JSON.parse(local) : [...DEFAULT_ACTIVITIES];
    list.unshift(newActivity);
    localStorage.setItem("local_leadership_activities", JSON.stringify(list));
  } catch (e) {
    console.warn("Local storage activity cache update failed:", e);
  }

  // Create notification
  try {
    await createNotification(
      data.userId,
      "ບັນທຶກການເຄື່ອນໄຫວວຽກໃໝ່ສຳເລັດ",
      `ທ່ານໄດ້ເພີ່ມວຽກ: "${data.title}" ສຳເລັດແລ້ວ`,
      "success"
    );
  } catch {
    // Ignore notification failure
  }

  // Notify listeners
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("leadership-activities-updated"));
  }

  return newActivity;
}

// Update an activity
export async function updateLeadershipActivity(
  id: string,
  updates: Partial<LeadershipActivity>
): Promise<void> {
  const updatedData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, "leadership_activities", id), updatedData);
  } catch (err) {
    console.warn("Firestore update activity fallback:", err);
  }

  // Update local cache
  try {
    const local = localStorage.getItem("local_leadership_activities");
    if (local) {
      const list: LeadershipActivity[] = JSON.parse(local);
      const idx = list.findIndex(a => a.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updatedData };
        localStorage.setItem("local_leadership_activities", JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn("Local cache update error:", e);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("leadership-activities-updated"));
  }
}

// Delete an activity
export async function deleteLeadershipActivity(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "leadership_activities", id));
  } catch (err) {
    console.warn("Firestore delete activity fallback:", err);
  }

  try {
    const local = localStorage.getItem("local_leadership_activities");
    if (local) {
      const list: LeadershipActivity[] = JSON.parse(local);
      const filtered = list.filter(a => a.id !== id);
      localStorage.setItem("local_leadership_activities", JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("Local cache delete error:", e);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("leadership-activities-updated"));
  }
}

// Subscribe to real-time leadership activities
export function subscribeLeadershipActivities(
  callback: (activities: LeadershipActivity[]) => void
): () => void {
  try {
    const activitiesRef = collection(db, "leadership_activities");
    const unsubscribe = onSnapshot(activitiesRef, (snapshot) => {
      if (snapshot.empty) {
        seedDefaultActivities().then(() => {
          callback(DEFAULT_ACTIVITIES);
        });
        return;
      }
      const list: LeadershipActivity[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as LeadershipActivity;
        list.push({ ...data, id: d.id || data.id });
      });
      list.sort((a, b) => (b.startDate + (b.startTime || "")).localeCompare(a.startDate + (a.startTime || "")));
      localStorage.setItem("local_leadership_activities", JSON.stringify(list));
      callback(list);
    }, (error) => {
      console.warn("Leadership activities snapshot error, falling back to local:", error);
      fetchLeadershipActivities().then(callback);
    });

    return unsubscribe;
  } catch (err) {
    console.warn("Failed to subscribe leadership activities:", err);
    fetchLeadershipActivities().then(callback);
    return () => {};
  }
}

// Fetch leadership activities (Firestore + localStorage fallback)
export async function fetchLeadershipActivities(): Promise<LeadershipActivity[]> {
  try {
    const activitiesRef = collection(db, "leadership_activities");
    const snapshot = await getDocs(activitiesRef);
    if (!snapshot.empty) {
      const list: LeadershipActivity[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as LeadershipActivity;
        list.push({ ...data, id: d.id || data.id });
      });
      list.sort((a, b) => (b.startDate + (b.startTime || "")).localeCompare(a.startDate + (a.startTime || "")));
      localStorage.setItem("local_leadership_activities", JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn("Error fetching leadership activities from Firestore:", err);
  }

  try {
    const local = localStorage.getItem("local_leadership_activities");
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  localStorage.setItem("local_leadership_activities", JSON.stringify(DEFAULT_ACTIVITIES));
  return DEFAULT_ACTIVITIES;
}

// Helper: Get human-readable Category label
export function getCategoryLabel(category: ActivityCategory, isLao: boolean = true): { label: string; color: string; bg: string; border: string } {
  switch (category) {
    case "meeting":
      return {
        label: isLao ? "ກອງປະຊຸມ" : "Meeting",
        color: "text-blue-700 dark:text-blue-300",
        bg: "bg-blue-50 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800"
      };
    case "mission":
      return {
        label: isLao ? "ລົງເຄື່ອນໄຫວ/ພາລະກິດ" : "Official Mission",
        color: "text-indigo-700 dark:text-indigo-300",
        bg: "bg-indigo-50 dark:bg-indigo-900/30",
        border: "border-indigo-200 dark:border-indigo-800"
      };
    case "inspection":
      return {
        label: isLao ? "ລົງກວດກາ/ຕິດຕາມວຽກ" : "Inspection/Monitoring",
        color: "text-amber-700 dark:text-amber-300",
        bg: "bg-amber-50 dark:bg-amber-900/30",
        border: "border-amber-200 dark:border-amber-800"
      };
    case "ceremony":
      return {
        label: isLao ? "ພິທີການ/ຕ້ອນຮັບ" : "Ceremony/Reception",
        color: "text-purple-700 dark:text-purple-300",
        bg: "bg-purple-50 dark:bg-purple-900/30",
        border: "border-purple-200 dark:border-purple-800"
      };
    case "internal":
      return {
        label: isLao ? "ວຽກພາຍໃນຫ້ອງການ" : "Internal Office Duty",
        color: "text-emerald-700 dark:text-emerald-300",
        bg: "bg-emerald-50 dark:bg-emerald-900/30",
        border: "border-emerald-200 dark:border-emerald-800"
      };
    case "training":
      return {
        label: isLao ? "ຝຶກອົບຮົມ/ສຳມະນາ" : "Training/Workshop",
        color: "text-cyan-700 dark:text-cyan-300",
        bg: "bg-cyan-50 dark:bg-cyan-900/30",
        border: "border-cyan-200 dark:border-cyan-800"
      };
    case "other":
    default:
      return {
        label: isLao ? "ວຽກງານອື່ນໆ" : "Other Activity",
        color: "text-slate-700 dark:text-slate-300",
        bg: "bg-slate-100 dark:bg-slate-800",
        border: "border-slate-200 dark:border-slate-700"
      };
  }
}

// Helper: Get human-readable Status label
export function getStatusLabel(status: ActivityStatus, isLao: boolean = true): { label: string; color: string; bg: string; border: string; dot: string } {
  switch (status) {
    case "scheduled":
      return {
        label: isLao ? "ມີແຜນກຳນົດ" : "Scheduled",
        color: "text-blue-700 dark:text-blue-300",
        bg: "bg-blue-50 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800",
        dot: "bg-blue-500"
      };
    case "in_progress":
      return {
        label: isLao ? "ພວມປະຕິບັດ" : "In Progress",
        color: "text-amber-700 dark:text-amber-300",
        bg: "bg-amber-50 dark:bg-amber-900/30",
        border: "border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500 animate-ping"
      };
    case "completed":
      return {
        label: isLao ? "ສຳເລັດແລ້ວ" : "Completed",
        color: "text-emerald-700 dark:text-emerald-300",
        bg: "bg-emerald-50 dark:bg-emerald-900/30",
        border: "border-emerald-200 dark:border-emerald-800",
        dot: "bg-emerald-500"
      };
    case "cancelled":
      return {
        label: isLao ? "ຍົກເລີກ" : "Cancelled",
        color: "text-rose-700 dark:text-rose-300",
        bg: "bg-rose-50 dark:bg-rose-900/30",
        border: "border-rose-200 dark:border-rose-800",
        dot: "bg-rose-500"
      };
    default:
      return {
        label: status,
        color: "text-slate-700 dark:text-slate-300",
        bg: "bg-slate-50 dark:bg-slate-800",
        border: "border-slate-200 dark:border-slate-700",
        dot: "bg-slate-400"
      };
  }
}

// Helper: Priority details
export function getPriorityLabel(priority: ActivityPriority, isLao: boolean = true) {
  switch (priority) {
    case "urgent":
      return {
        label: isLao ? "ດ່ວນທີ່ສຸດ" : "Urgent",
        badge: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300"
      };
    case "important":
      return {
        label: isLao ? "ສຳຄັນ" : "Important",
        badge: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300"
      };
    case "normal":
    default:
      return {
        label: isLao ? "ປົກກະຕິ" : "Normal",
        badge: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300"
      };
  }
}
