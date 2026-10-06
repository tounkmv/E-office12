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
  orderBy,
  onSnapshot
} from "./firebase";
import { CivilServant } from "../types";
import maleOfficialImg from "../assets/images/lao_male_official_1791186586779.jpg";
import femaleOfficialImg from "../assets/images/lao_female_official_1791186600317.jpg";

export const PRESET_OFFICIAL_PHOTOS = [
  { id: "male_formal_1", label: "ຊາຍ: ສູດສີກົມທ່າ (Navy Suit)", url: maleOfficialImg },
  { id: "female_formal_1", label: "ຍິງ: ເສື້ອໄໝພື້ນເມືອງລາວ (Silk Blouse)", url: femaleOfficialImg },
  { id: "male_formal_2", label: "ຊາຍ: ສູດດຳທາງການ (Black Suit)", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=533&q=80" },
  { id: "female_formal_2", label: "ຍິງ: ສູດທາງການສາກົນ (Business Suit)", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=533&q=80" },
  { id: "male_formal_3", label: "ຊາຍ: ເສື້ອເຊີດຂາວຜູກເນັກໄທ (White Shirt)", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=533&q=80" },
  { id: "female_formal_3", label: "ຍິງ: ເສື້ອໄໝສີຄຣີມອ່ອນ (Cream Silk)", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=533&q=80" }
];

export const PROVINCIAL_DEPARTMENTS = [
  "ຂະແໜງບໍລິຫານ, ພິທີການ ແລະ ການເງິນ",
  "ຂະແໜງຄົ້ນຄວ້າ-ສັງລວມ",
  "ຂະແໜງຈັດຕັ້ງ ແລະ ພະນັກງານ",
  "ຂະແໜງກວດກາລັດ ແລະ ຕ້ານການສໍ້ລາດບັງຫຼວງ",
  "ຂະແໜງຂໍ້ມູນຂ່າວສານ ແລະ ເຕັກໂນໂລຊີ",
  "ໜ່ວຍງານຄຸ້ມຄອງພາຫະນະ ແລະ ອາຄານສະຖານທີ່",
  "ຄະນະຫົວໜ້າຫ້ອງວ່າການແຂວງ"
];

export const OFFICIAL_POSITIONS = [
  "ຫົວໜ້າຫ້ອງວ່າການແຂວງ",
  "ຮອງຫົວໜ້າຫ້ອງວ່າການແຂວງ",
  "ຫົວໜ້າຂະແໜງ",
  "ຮອງຫົວໜ້າຂະແໜງ",
  "ວິຊາການອາວຸໂສ",
  "ວິຊາການ",
  "ພະນັກງານບໍລິຫານ",
  "ພະນັກງານຂັບລົດປະຈຳການ"
];

export async function seedDefaultEmployees(): Promise<CivilServant[]> {
  try {
    const colRef = collection(db, "civil_servants");
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: CivilServant[] = [];
      snap.forEach(d => list.push({ ...d.data() as CivilServant, id: d.id }));
      return list;
    }

    const defaultStaff: CivilServant[] = [
      {
        id: "emp_001",
        staffCode: "HP-LK-001",
        fullName: "ທ່ານ ຄຳຕຸ່ນ ຄໍາມະວົງ",
        gender: "male",
        dateOfBirth: "1982-05-15",
        ethnicity: "ລາວ",
        religion: "ພຸດ",
        position: "ຫົວໜ້າຫ້ອງວ່າການແຂວງ",
        department: "ຄະນະຫົວໜ້າຫ້ອງວ່າການແຂວງ",
        type: "full",
        salaryGrade: "ຊັ້ນ 4 ຂັ້ນ 6",
        dateJoinedState: "2005-09-01",
        dateJoinedOffice: "2018-02-15",
        educationDegree: "ປະລິນຍາໂທ (Master)",
        majorField: "ການບໍລິຫານລັດຖະກິດ (Public Administration)",
        politicalTheory: "ຊັ້ນສູງ",
        phone: "020 5555 5555",
        email: "tounkmv99@gmail.com",
        currentAddress: "ບ້ານ ພັນໄຊ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        originVillage: "ບ້ານ ນາທົ່ງ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        idCardNumber: "120-456-789",
        officialPhotoUrl: maleOfficialImg,
        status: "active",
        notes: "ຮັບຜິດຊອບຊີ້ນໍາລວມທຸກວຽກງານພາຍໃນຫ້ອງວ່າການແຂວງຫົວພັນ",
        createdAt: new Date().toISOString()
      },
      {
        id: "emp_002",
        staffCode: "HP-LK-002",
        fullName: "ທ່ານ ນາງ ມະນີວອນ ແສງສຸລິຍາ",
        gender: "female",
        dateOfBirth: "1986-11-20",
        ethnicity: "ລາວ",
        religion: "ພຸດ",
        position: "ຫົວໜ້າຂະແໜງ",
        department: "ຂະແໜງບໍລິຫານ, ພິທີການ ແລະ ການເງິນ",
        type: "full",
        salaryGrade: "ຊັ້ນ 3 ຂັ້ນ 4",
        dateJoinedState: "2010-10-01",
        dateJoinedOffice: "2019-06-01",
        educationDegree: "ປະລິນຍາຕີ (Bachelor)",
        majorField: "ການເງິນ ແລະ ການທະນາຄານ (Finance & Banking)",
        politicalTheory: "ຊັ້ນກາງ",
        phone: "020 5588 9911",
        email: "manivone.hp@gmail.com",
        currentAddress: "ບ້ານ ໂພນໄຊ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        originVillage: "ບ້ານ ໂພນໄຊ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        idCardNumber: "120-789-123",
        officialPhotoUrl: femaleOfficialImg,
        status: "active",
        notes: "ຄຸ້ມຄອງວຽກງານບໍລິຫານ, ການເງິນ ແລະ ອະນຸມັດການລາພັກຂອງພະນັກງານ",
        createdAt: new Date().toISOString()
      },
      {
        id: "emp_003",
        staffCode: "HP-LK-003",
        fullName: "ທ່ານ ສົມພອນ ວິໄລສັກ",
        gender: "male",
        dateOfBirth: "1989-03-12",
        ethnicity: "ລາວ",
        religion: "ພຸດ",
        position: "ຫົວໜ້າຂະແໜງ",
        department: "ຂະແໜງຄົ້ນຄວ້າ-ສັງລວມ",
        type: "full",
        salaryGrade: "ຊັ້ນ 2 ຂັ້ນ 7",
        dateJoinedState: "2012-07-15",
        dateJoinedOffice: "2020-01-10",
        educationDegree: "ປະລິນຍາໂທ (Master)",
        majorField: "ເສດຖະສາດ ແລະ ການພັດທະນາ (Economics)",
        politicalTheory: "ຊັ້ນກາງ",
        phone: "020 5533 2211",
        email: "somphone.v@gmail.com",
        currentAddress: "ບ້ານ ນາເລົ່າ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        originVillage: "ບ້ານ ນາເລົ່າ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        idCardNumber: "120-654-987",
        officialPhotoUrl: PRESET_OFFICIAL_PHOTOS[2].url,
        status: "active",
        notes: "ສັງລວມບົດລາຍງານ ແລະ ວຽກງານການເຄື່ອນໄຫວຂອງຄະນະຫ້ອງວ່າການ",
        createdAt: new Date().toISOString()
      },
      {
        id: "emp_004",
        staffCode: "HP-LK-004",
        fullName: "ທ່ານ ນາງ ດາວອນ ໄຊຍະວົງ",
        gender: "female",
        dateOfBirth: "1993-08-25",
        ethnicity: "ລາວ",
        religion: "ພຸດ",
        position: "ຮອງຫົວໜ້າຂະແໜງ",
        department: "ຂະແໜງຈັດຕັ້ງ ແລະ ພະນັກງານ",
        type: "full",
        salaryGrade: "ຊັ້ນ 2 ຂັ້ນ 4",
        dateJoinedState: "2016-04-01",
        dateJoinedOffice: "2021-03-01",
        educationDegree: "ປະລິນຍາຕີ (Bachelor)",
        majorField: "ການຄຸ້ມຄອງຊັບພະຍາກອນມະນຸດ (HRM)",
        politicalTheory: "ຊັ້ນຕົ້ນ",
        phone: "020 5422 1199",
        email: "daovone.sy@gmail.com",
        currentAddress: "ບ້ານ ວຽງໄຊ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        originVillage: "ບ້ານ ວຽງໄຊ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        idCardNumber: "120-112-334",
        officialPhotoUrl: PRESET_OFFICIAL_PHOTOS[3].url,
        status: "active",
        notes: "ຄຸ້ມຄອງບັນຊີຊີວະປະຫວັດ, ຂັ້ນເງິນເດືອນ ແລະ ໂຄຕ້າລາພັກຂອງລັດຖະກອນ",
        createdAt: new Date().toISOString()
      },
      {
        id: "emp_005",
        staffCode: "HP-LK-005",
        fullName: "ທ່ານ ບຸນມີ ພົມມະສານ",
        gender: "male",
        dateOfBirth: "1995-12-04",
        ethnicity: "ລາວ",
        religion: "ພຸດ",
        position: "ວິຊາການ",
        department: "ຂະແໜງຂໍ້ມູນຂ່າວສານ ແລະ ເຕັກໂນໂລຊີ",
        type: "full",
        salaryGrade: "ຊັ້ນ 1 ຂັ້ນ 5",
        dateJoinedState: "2019-11-01",
        dateJoinedOffice: "2022-01-15",
        educationDegree: "ປະລິນຍາຕີ (Bachelor)",
        majorField: "ວິສະວະກຳເຕັກໂນໂລຊີຂໍ້ມູນຂ່າວສານ (IT Engineering)",
        politicalTheory: "ຊັ້ນຕົ້ນ",
        phone: "020 5577 8899",
        email: "bounmy.it@gmail.com",
        currentAddress: "ບ້ານ ພັນໄຊ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        originVillage: "ບ້ານ ຊຳໃຕ້, ເມືອງຊຳໃຕ້, ແຂວງຫົວພັນ",
        idCardNumber: "120-998-877",
        officialPhotoUrl: PRESET_OFFICIAL_PHOTOS[4].url,
        status: "active",
        notes: "ຄຸ້ມຄອງລະບົບເວັບໄຊ, ເຊີເວີ, ຖານຂໍ້ມູນ ແລະ ຫ້ອງປະຊຸມທາງໄກ",
        createdAt: new Date().toISOString()
      },
      {
        id: "emp_006",
        staffCode: "HP-LK-006",
        fullName: "ທ່ານ ນາງ ວິໄລພອນ ແກ້ວມະນີ",
        gender: "female",
        dateOfBirth: "1997-02-18",
        ethnicity: "ມົ້ງ",
        religion: "ພຸດ",
        position: "ວິຊາການ",
        department: "ຂະແໜງກວດກາລັດ ແລະ ຕ້ານການສໍ້ລາດບັງຫຼວງ",
        type: "probation",
        salaryGrade: "ຊັ້ນ 1 ຂັ້ນ 1",
        dateJoinedState: "2024-03-01",
        dateJoinedOffice: "2024-03-01",
        educationDegree: "ປະລິນຍາຕີ (Bachelor)",
        majorField: "ນິຕິສາດ / ກົດໝາຍລັດ (Law)",
        politicalTheory: "ຍັງບໍ່ມີ",
        phone: "020 5233 4455",
        email: "vilaiphone.km@gmail.com",
        currentAddress: "ບ້ານ ໂພນໂຮງ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        originVillage: "ບ້ານ ໜອງຄ້າງ, ເມືອງຊຳເໜືອ, ແຂວງຫົວພັນ",
        idCardNumber: "120-334-556",
        officialPhotoUrl: PRESET_OFFICIAL_PHOTOS[5].url,
        status: "active",
        notes: "ລັດຖະກອນທົດລອງງານ ປະຈຳຂະແໜງກວດກາ",
        createdAt: new Date().toISOString()
      }
    ];

    for (const emp of defaultStaff) {
      await setDoc(doc(db, "civil_servants", emp.id), emp);
    }
    return defaultStaff;
  } catch (err) {
    console.error("Error seeding default civil servants:", err);
    return [];
  }
}

export async function getEmployees(): Promise<CivilServant[]> {
  try {
    const colRef = collection(db, "civil_servants");
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return await seedDefaultEmployees();
    }
    const list: CivilServant[] = [];
    snap.forEach(d => list.push({ ...d.data() as CivilServant, id: d.id }));
    return list;
  } catch (err) {
    console.error("Error fetching employees:", err);
    return [];
  }
}

export async function addEmployee(employee: CivilServant): Promise<void> {
  const docRef = doc(db, "civil_servants", employee.id);
  await setDoc(docRef, employee);
}

export async function updateEmployee(id: string, updates: Partial<CivilServant>): Promise<void> {
  const docRef = doc(db, "civil_servants", id);
  await setDoc(docRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteEmployee(id: string): Promise<void> {
  const docRef = doc(db, "civil_servants", id);
  await deleteDoc(docRef);
}
