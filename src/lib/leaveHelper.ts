import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc 
} from "./firebase";
import { LeaveRequest, LeaveStatus, CivilServant } from "../types";

export const ANNUAL_LEAVE_QUOTA = 15; // 15 working days per year per civil servant

export interface StaffLeaveBalance {
  staffId: string;
  year: number;
  quotaTotal: number; // 15
  approvedDays: number;
  pendingDays: number;
  remainingDays: number; // 15 - approvedDays
}

export function calculateStaffLeaveBalance(
  staffId: string, 
  allRequests: LeaveRequest[], 
  year: number = new Date().getFullYear()
): StaffLeaveBalance {
  const staffYearRequests = allRequests.filter(r => 
    r.staffId === staffId && 
    (r.year === year || new Date(r.startDate).getFullYear() === year)
  );

  const approvedDays = staffYearRequests
    .filter(r => r.status === "approved" && r.leaveType === "annual")
    .reduce((sum, r) => sum + (Number(r.workingDaysCount) || 0), 0);

  const pendingDays = staffYearRequests
    .filter(r => r.status === "pending" && r.leaveType === "annual")
    .reduce((sum, r) => sum + (Number(r.workingDaysCount) || 0), 0);

  const remainingDays = Math.max(0, ANNUAL_LEAVE_QUOTA - approvedDays);

  return {
    staffId,
    year,
    quotaTotal: ANNUAL_LEAVE_QUOTA,
    approvedDays,
    pendingDays,
    remainingDays
  };
}

export async function seedDefaultLeaveRequests(employees: CivilServant[]): Promise<LeaveRequest[]> {
  try {
    const colRef = collection(db, "leave_requests");
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: LeaveRequest[] = [];
      snap.forEach(d => list.push({ ...d.data() as LeaveRequest, id: d.id }));
      return list;
    }

    const currentYear = new Date().getFullYear();
    const defaultLeaves: LeaveRequest[] = [
      {
        id: "leave_001",
        staffId: "emp_003",
        staffCode: "HP-LK-003",
        staffName: "ທ່ານ ສົມພອນ ວິໄລສັກ",
        staffDepartment: "ຂະແໜງຄົ້ນຄວ້າ-ສັງລວມ",
        staffPosition: "ຫົວໜ້າຂະແໜງ",
        staffPhone: "020 5533 2211",
        leaveType: "annual",
        title: "ຂໍລາພັກປະຈຳປີ ເພື່ອກັບຄືນບ້ານເກີດຢ້ຽມຢາມພໍ່ແມ່",
        reason: "ເນື່ອງຈາກບໍ່ໄດ້ກັບບ້ານມາເປັນເວລາດົນ ຈຶ່ງຂໍອະນຸຍາດລາພັກປະຈຳປີ 5 ວັນລັດຖະການ",
        startDate: `${currentYear}-03-10`,
        endDate: `${currentYear}-03-14`,
        workingDaysCount: 5,
        year: currentYear,
        quotaTotal: 15,
        quotaUsedBefore: 0,
        quotaRemainingBefore: 15,
        handoverPerson: "ທ່ານ ນາງ ດາວອນ ໄຊຍະວົງ",
        handoverPhone: "020 5422 1199",
        emergencyPhone: "020 5533 2211",
        destination: "ບ້ານ ນາເລົ່າ, ເມືອງຊຳເໜືອ",
        status: "approved",
        approvedByUid: "admin_default",
        approvedByName: "ທ່ານ ຄຳຕຸ່ນ ຄໍາມະວົງ",
        approvedByRole: "ຫົວໜ້າຫ້ອງວ່າການແຂວງ (Admin)",
        approvedByEmail: "tounkmv99@gmail.com",
        approvedAt: `${currentYear}-03-08T09:30:00.000Z`,
        approvalRemarks: "ເຫັນດີອະນຸມັດຕາມການສະເໜີ ມອບໃຫ້ຮອງຂະແໜງຮັບຜິດຊອບວຽກແທນ",
        createdAt: `${currentYear}-03-05T08:15:00.000Z`
      },
      {
        id: "leave_002",
        staffId: "emp_005",
        staffCode: "HP-LK-005",
        staffName: "ທ່ານ ບຸນມີ ພົມມະສານ",
        staffDepartment: "ຂະແໜງຂໍ້ມູນຂ່າວສານ ແລະ ເຕັກໂນໂລຊີ",
        staffPosition: "ວິຊາການ",
        staffPhone: "020 5577 8899",
        leaveType: "annual",
        title: "ຂໍລາພັກປະຈຳປີ ເພື່ອແກ້ໄຂວຽກຄອບຄົວ",
        reason: "ມີຄວາມຈຳເປັນຕ້ອງໄປຊ່ວຍວຽກງານບຸນປະເພນີຄອບຄົວຢູ່ບ້ານເກີດ",
        startDate: `${currentYear}-10-12`,
        endDate: `${currentYear}-10-14`,
        workingDaysCount: 3,
        year: currentYear,
        quotaTotal: 15,
        quotaUsedBefore: 0,
        quotaRemainingBefore: 15,
        handoverPerson: "ທ່ານ ນາງ ມະນີວອນ ແສງສຸລິຍາ",
        handoverPhone: "020 5588 9911",
        emergencyPhone: "020 5577 8899",
        destination: "ບ້ານ ຊຳໃຕ້, ເມືອງຊຳໃຕ້",
        status: "pending",
        createdAt: new Date().toISOString()
      },
      {
        id: "leave_003",
        staffId: "emp_006",
        staffCode: "HP-LK-006",
        staffName: "ທ່ານ ນາງ ວິໄລພອນ ແກ້ວມະນີ",
        staffDepartment: "ຂະແໜງກວດກາລັດ ແລະ ຕ້ານການສໍ້ລາດບັງຫຼວງ",
        staffPosition: "ວິຊາການ",
        staffPhone: "020 5233 4455",
        leaveType: "sick",
        title: "ຂໍລາພັກປ່ວຍ ໄປກວດສຸຂະພາບຢູ່ໂຮງໝໍແຂວງ",
        reason: "ມີອາການເປັນໄຂ້ ແລະ ເຈັບຄໍ ທ່ານໝໍແນະນຳໃຫ້ພັກຜ່ອນ 2 ວັນ",
        startDate: `${currentYear}-09-15`,
        endDate: `${currentYear}-09-16`,
        workingDaysCount: 2,
        year: currentYear,
        quotaTotal: 15,
        quotaUsedBefore: 0,
        quotaRemainingBefore: 15,
        handoverPerson: "ທ່ານ ສົມພອນ ວິໄລສັກ",
        handoverPhone: "020 5533 2211",
        emergencyPhone: "020 5233 4455",
        destination: "ໂຮງໝໍແຂວງຫົວພັນ",
        status: "approved",
        approvedByUid: "emp_002",
        approvedByName: "ທ່ານ ນາງ ມະນີວອນ ແສງສຸລິຍາ",
        approvedByRole: "ຫົວໜ້າຂະແໜງບໍລິຫານ, ພິທີການ ແລະ ການເງິນ",
        approvedByEmail: "manivone.hp@gmail.com",
        approvedAt: `${currentYear}-09-15T08:00:00.000Z`,
        approvalRemarks: "ອະນຸມັດລາພັກປ່ວຍຕາມໃບຢັ້ງຢືນແພດ",
        createdAt: `${currentYear}-09-14T16:00:00.000Z`
      }
    ];

    for (const item of defaultLeaves) {
      await setDoc(doc(db, "leave_requests", item.id), item);
    }
    return defaultLeaves;
  } catch (err) {
    console.error("Error seeding default leave requests:", err);
    return [];
  }
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const colRef = collection(db, "leave_requests");
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return await seedDefaultLeaveRequests([]);
    }
    const list: LeaveRequest[] = [];
    snap.forEach(d => list.push({ ...d.data() as LeaveRequest, id: d.id }));
    return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch (err) {
    console.error("Error fetching leave requests:", err);
    return [];
  }
}

export async function addLeaveRequest(req: LeaveRequest): Promise<void> {
  const docRef = doc(db, "leave_requests", req.id);
  await setDoc(docRef, req);
}

export async function updateLeaveStatus(
  id: string, 
  status: LeaveStatus, 
  approver: { uid: string; name: string; role: string; email?: string },
  remarks?: string
): Promise<void> {
  const docRef = doc(db, "leave_requests", id);
  const now = new Date().toISOString();

  if (status === "approved") {
    await updateDoc(docRef, {
      status: "approved",
      approvedByUid: approver.uid,
      approvedByName: approver.name,
      approvedByRole: approver.role,
      approvedByEmail: approver.email || "",
      approvedAt: now,
      approvalRemarks: remarks || "ອະນຸມັດແລ້ວ",
      updatedAt: now
    });
  } else if (status === "rejected") {
    await updateDoc(docRef, {
      status: "rejected",
      rejectedByUid: approver.uid,
      rejectedByName: approver.name,
      rejectedAt: now,
      rejectionReason: remarks || "ປະຕິເສດ",
      updatedAt: now
    });
  } else {
    await updateDoc(docRef, {
      status,
      updatedAt: now
    });
  }
}

export async function deleteLeaveRequest(id: string): Promise<void> {
  const docRef = doc(db, "leave_requests", id);
  await deleteDoc(docRef);
}
