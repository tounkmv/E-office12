# ຄູ່ມືການ Deploy Web App ຂຶ້ນ Cloudflare (Cloudflare Pages Deployment Guide)

ລະບົບນີ້ເປັນ **Single Page Application (Vite + React)** ທີ່ເຊື່ອມຕໍ່ກັບ **Cloud Database (Firebase Firestore)** ທີ່ມີຢູ່ແລ້ວ. ດັ່ງນັ້ນ ທ່ານສາມາດ Deploy ຂຶ້ນ **Cloudflare Pages** ໄດ້ຢ່າງງ່າຍດາຍ ແລະ Database ຈະເຮັດວຽກຮ່ວມກັນໄດ້ທັນທີ 100%.

---

## 1. ວິທີການ Export ໂຄງການອອກຈາກ AI Studio

1. ກົດທີ່ເມນູ **Settings / Project Menu** (ມຸມຂວາເທິງຂອງ AI Studio).
2. ເລືອກ **Export to GitHub** (ແນະນຳທີ່ສຸດ ເພື່ອໃຫ້ Cloudflare ສາມາດ Auto-deploy ໄດ້) ຫຼື **Download ZIP**.

---

## 2. ການຕິດຕັ້ງ ແລະ Deploy ຂຶ້ນ Cloudflare Pages

### ວິທີທີ 1: ຜ່ານ Cloudflare Dashboard + GitHub (ງ່າຍທີ່ສຸດ & Auto Deploy)
1. ເຂົ້າສູ່ລະບົບ [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. ໄປທີ່ເມນູ **Workers & Pages** -> **Create application** -> ເລືອກແທັບ **Pages**.
3. ກົດ **Connect to Git** ແລ້ວເລືອກ Repository GitHub ທີ່ export ມາ.
4. ຕັ້ງຄ່າ **Build Settings**:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js Version** (ໃນ Environment variables): `NODE_VERSION` = `20`
5. ກົດ **Save and Deploy**. ພຽງເທົ່ານີ້ເວັບໄຊຈະ online ຢູ່ Cloudflare Pages ທັນທີ!

---

### ວິທີທີ 2: Deploy ຜ່ານ Wrangler CLI ໂດຍກົງ
ຖ້າທ່ານມີ Node.js ໃນເຄື່ອງ:
```bash
# 1. ຕິດຕັ້ງ dependencies
npm install

# 2. Build ໂຄງການ
npm run build

# 3. Deploy ໂຟນເດີ dist ຂຶ້ນ Cloudflare Pages
npx wrangler pages deploy dist --project-name=meeting-room-system
```

---

## 3. ສ່ວນຂອງຖານຂໍ້ມູນ (Database)

- **ສະຖານະປັດຈຸບັນ**: ລະບົບໃຊ້ **Cloud Firestore (Google Cloud Database)** ທີ່ຕັ້ງຄ່າໄວ້ພ້ອມແລ້ວໃນ `src/lib/firebase.ts`.
- **ການເຮັດວຽກເທິງ Cloudflare**: 
  - ເມື່ອເວັບໄຊຣັນຢູ່ Cloudflare Pages, ຕົວ Web Client ຈະຕິດຕໍ່ສື່ສານກັບ Cloud Firestore Database ໂດຍກົງຜ່ານ Secure Web SDK ຂອງ Firebase.
  - **ທ່ານບໍ່ຈຳເປັນຕ້ອງຍ້າຍ Database**: ຖານຂໍ້ມູນທັງໝົດ (ບັນຊີຜູ້ໃຊ້, ຫ້ອງປະຊຸມ, ປະຫວັດການຈອງ) ຈະຍັງຄົງຢູ່ ແລະ ເຮັດວຽກໄດ້ທັນທີໂດຍບໍ່ຕ້ອງ migrate.
- **ກໍລະນີຕ້ອງການໃຊ້ Cloudflare D1 (SQL Database)**:
  - ຖ້າຕ້ອງການປ່ຽນໄປໃຊ້ Cloudflare D1 ແທນ Cloud Firestore ໃນອະນາຄົດ, ຈະຕ້ອງສ້າງ Cloudflare Worker API ເພື່ອ query D1 ແລະ migrate ຂໍ້ມູນ JSON ໄປໃສ່ SQL tables. ແຕ່ສຳລັບລະບົບ Real-time Booking ນີ້, Firebase Firestore ມີປະສິດທິພາບສູງ ແລະ ຮອງຮັບ Real-time listener ໄດ້ດີກວ່າ.

---

## 4. ໄຟລ໌ `_redirects`
ລະບົບໄດ້ສ້າງໄຟລ໌ `public/_redirects` ໄວ້ໃຫ້ຮຽບຮ້ອຍແລ້ວ:
```text
/*    /index.html   200
```
ເພື່ອຮັບປະກັນວ່າເມື່ອຜູ້ໃຊ້ refresh ໜ້າ ຫຼື ເຂົ້າ direct link ເທິງ Cloudflare Pages ຈະບໍ່ພົບຂໍ້ຜິດພາດ 404.
