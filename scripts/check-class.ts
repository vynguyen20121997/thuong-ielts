import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });

/*
  Quản lý lớp: học phí, cách ly giữa giáo viên, và quyền riêng tư của nhận xét.

  Gọi thẳng tầng `lib` chứ không qua HTTP, khác `check-practice.ts`. Lý do:
  các route ở đây là vỏ mỏng — đọc body, lấy `teacherId` từ phiên, gọi đúng
  một hàm. Thứ đáng canh nằm ở tầng dưới: luật đọc tiền, khoá duy nhất theo
  kỳ, và phép kiểm quyền sở hữu mà MỌI hàm ghi phải tự làm.

  Ba thứ ở đây nếu sai thì sai âm thầm và sai vào chỗ đau nhất:

  1. Tiền. Ghi nhầm một lần đóng là cãi nhau với phụ huynh.
  2. Cách ly giáo viên. Hôm nay có một cô, nhưng ngày có người thứ hai thì
     không ai đi rà lại từng truy vấn nữa.
  3. Nhận xét riêng. Mặc định phải là CHỈ CÔ ĐỌC. Đoán nhầm chiều này một lần
     là hỏng cả quan hệ thầy trò.

  Dọn sạch dữ liệu mô phỏng ở cả đầu lẫn cuối.
*/

let hong = 0;
function kiem(ten: string, dat: boolean, thuc?: unknown, mong?: unknown) {
  if (dat) {
    console.log(`  ok   ${ten}`);
    return;
  }
  hong += 1;
  const chiTiet =
    mong === undefined ? "" : `: nhận ${JSON.stringify(thuc)}, mong ${JSON.stringify(mong)}`;
  console.error(`  HỎNG ${ten}${chiTiet}`);
}

async function nem(ten: string, viec: () => Promise<unknown>) {
  try {
    await viec();
    kiem(ten, false, "không báo lỗi", "phải báo lỗi");
  } catch {
    kiem(ten, true);
  }
}

const CO_A = "sim-teacher-a";
const CO_B = "sim-teacher-b";
const EM_1 = "sim-student-1";
const EM_2 = "sim-student-2";

async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const kho = await import("../apps/admin/src/lib/hocVien");
  const ghi = await import("../apps/admin/src/lib/hocVienGhi");

  const don = async () => {
    await pool.query("DELETE FROM classes WHERE teacher_id = ANY($1)", [[CO_A, CO_B]]);
    await pool.query("DELETE FROM student_notes WHERE student_id = ANY($1)", [[EM_1, EM_2]]);
    await pool.query("DELETE FROM teachers WHERE id = ANY($1)", [[CO_A, CO_B]]);
    await pool.query("DELETE FROM students WHERE id = ANY($1)", [[EM_1, EM_2]]);
  };
  await don();

  for (const [id, ten] of [
    [CO_A, "Cô A (mô phỏng)"],
    [CO_B, "Cô B (mô phỏng)"],
  ]) {
    await pool.query(
      `INSERT INTO teachers (id, username, password_hash, name)
       VALUES ($1, $1, 'x', $2)`,
      [id, ten],
    );
  }
  for (const [id, ten] of [
    [EM_1, "Em Một"],
    [EM_2, "Em Hai"],
  ]) {
    await pool.query("INSERT INTO students (id, name) VALUES ($1,$2)", [id, ten]);
  }

  /* ── 1. Đọc số tiền ──────────────────────────────────────────────────── */

  console.log("\n1) Đọc số tiền cô gõ vào");

  kiem(
    'gõ "1.500.000" ra 1500000',
    ghi.docTien("1.500.000") === 1_500_000,
    ghi.docTien("1.500.000"),
    1_500_000,
  );
  kiem(
    'gõ "1,500,000 đ" cũng ra 1500000',
    ghi.docTien("1,500,000 đ") === 1_500_000,
    ghi.docTien("1,500,000 đ"),
    1_500_000,
  );
  kiem("để trống mà không bắt buộc thì ra null", ghi.docTien("", false) === null);
  await nem("số âm bị từ chối", async () => ghi.docTien("-500000"));
  await nem("để trống mà bắt buộc thì báo lỗi", async () => ghi.docTien(""));
  await nem("chữ không phải số thì báo lỗi", async () => ghi.docTien("nhiều lắm"));

  /* ── 2. Lớp và học viên ──────────────────────────────────────────────── */

  console.log("\n2) Lớp, học viên, mức riêng");

  const lopA = await ghi.taoLop(CO_A, {
    name: "Lớp mô phỏng A",
    tuitionAmount: "1.500.000",
    tuitionCycle: "thang",
  });
  await ghi.themHocVien(CO_A, lopA, EM_1);
  await ghi.themHocVien(CO_A, lopA, EM_2);

  const ky = kho.kyHienTai();
  let ds = await kho.hocVienCuaLop(CO_A, lopA, ky);
  kiem("lớp có 2 học viên", ds.length === 2, ds.length, 2);
  kiem(
    "chưa đặt mức riêng thì lấy mức của lớp",
    ds.every((h) => h.hocPhi === 1_500_000),
    ds.map((h) => h.hocPhi),
    [1_500_000, 1_500_000],
  );

  await ghi.suaHocVien(CO_A, lopA, EM_2, { tuitionOverride: "1.000.000" });
  ds = await kho.hocVienCuaLop(CO_A, lopA, ky);
  const em2 = ds.find((h) => h.studentId === EM_2)!;
  kiem("mức riêng đè lên mức lớp", em2.hocPhi === 1_000_000, em2.hocPhi, 1_000_000);

  /* Xoá mức riêng phải quay về mức lớp — `coalesce` sẽ làm hỏng chuyện này. */
  await ghi.suaHocVien(CO_A, lopA, EM_2, { tuitionOverride: null });
  ds = await kho.hocVienCuaLop(CO_A, lopA, ky);
  kiem(
    "xoá mức riêng thì quay về mức lớp",
    ds.find((h) => h.studentId === EM_2)!.hocPhi === 1_500_000,
    ds.find((h) => h.studentId === EM_2)!.hocPhi,
    1_500_000,
  );

  /* ── 3. Học phí ──────────────────────────────────────────────────────── */

  console.log("\n3) Ghi nhận đóng học phí");

  await ghi.ghiNhanDong(CO_A, lopA, {
    studentId: EM_1,
    amount: "1.500.000",
    period: ky,
  });

  let tien = await kho.tomTatTien(CO_A, lopA, ky);
  kiem("thu kỳ này = 1.500.000", tien.thuKyNay === 1_500_000, tien.thuKyNay, 1_500_000);
  kiem("còn 1 em chưa đóng", tien.soChuaDong === 1, tien.soChuaDong, 1);

  /*
    Bấm lưu hai lần cho cùng một kỳ là chuyện xảy ra thật (mạng chậm, cô tưởng
    chưa ăn). Không chặn thì sổ ghi em ấy đóng gấp đôi.
  */
  await nem("ghi nhận hai lần cùng một kỳ thì bị chặn", async () =>
    ghi.ghiNhanDong(CO_A, lopA, { studentId: EM_1, amount: "1.500.000", period: ky }),
  );

  await nem("số tiền 0 bị từ chối", async () =>
    ghi.ghiNhanDong(CO_A, lopA, { studentId: EM_2, amount: "0", period: ky }),
  );
  await nem("người ngoài lớp không ghi nhận được", async () =>
    ghi.ghiNhanDong(CO_A, lopA, { studentId: "khong-co-that", amount: "100000" }),
  );
  await nem("kỳ sai định dạng bị từ chối", async () =>
    ghi.ghiNhanDong(CO_A, lopA, { studentId: EM_2, amount: "100000", period: "2026-13" }),
  );

  /* ── 4. Cho nghỉ không được mất lịch sử ──────────────────────────────── */

  console.log("\n4) Cho nghỉ rồi nhận lại");

  await ghi.themNhanXet(CO_A, { studentId: EM_1, classId: lopA, body: "Ghi thử." });
  await ghi.suaHocVien(CO_A, lopA, EM_1, { leftOn: "2026-09-01" });

  ds = await kho.hocVienCuaLop(CO_A, lopA, ky);
  const daNghi = ds.find((h) => h.studentId === EM_1)!;
  kiem("em đã nghỉ vẫn nằm trong sổ", Boolean(daNghi.leftOn), daNghi.leftOn, "có ngày nghỉ");
  kiem(
    "học phí đã đóng không mất",
    daNghi.daDong === 1_500_000,
    daNghi.daDong,
    1_500_000,
  );
  kiem("nhận xét cũ không mất", daNghi.soNhanXet === 1, daNghi.soNhanXet, 1);

  tien = await kho.tomTatTien(CO_A, lopA, ky);
  /*
    "Chưa đóng" chỉ đếm người CÒN HỌC. Đếm cả người đã nghỉ thì con số ấy
    phình mãi và không bao giờ về 0, tới lúc đó cô sẽ thôi nhìn nó.
  */
  kiem(
    "em đã nghỉ không bị tính vào 'chưa đóng'",
    tien.soChuaDong === 1 && tien.soDangHoc === 1,
    `chưa đóng ${tien.soChuaDong}, đang học ${tien.soDangHoc}`,
    "chưa đóng 1, đang học 1",
  );

  /* Nhận lại phải giữ nguyên dòng cũ, không tạo dòng mới. */
  await ghi.themHocVien(CO_A, lopA, EM_1);
  ds = await kho.hocVienCuaLop(CO_A, lopA, ky);
  const nhanLai = ds.find((h) => h.studentId === EM_1)!;
  kiem(
    "nhận lại thì lịch sử vẫn nguyên",
    nhanLai.leftOn === null && nhanLai.daDong === 1_500_000,
    `nghỉ=${nhanLai.leftOn}, đã đóng=${nhanLai.daDong}`,
    "nghỉ=null, đã đóng=1500000",
  );

  /* ── 5. Cách ly giữa hai giáo viên ───────────────────────────────────── */

  console.log("\n5) Cô B không được chạm vào lớp của cô A");

  kiem(
    "cô B không thấy lớp của cô A",
    (await kho.danhSachLop(CO_B)).length === 0,
    (await kho.danhSachLop(CO_B)).length,
    0,
  );
  kiem(
    "cô B đọc lớp của cô A ra rỗng",
    (await kho.hocVienCuaLop(CO_B, lopA, ky)).length === 0,
  );
  await nem("cô B không sửa được lớp của cô A", async () =>
    ghi.suaLop(CO_B, lopA, { name: "Đổi trộm" }),
  );
  await nem("cô B không thêm được học viên vào lớp cô A", async () =>
    ghi.themHocVien(CO_B, lopA, EM_2),
  );
  await nem("cô B không ghi nhận tiền vào lớp cô A", async () =>
    ghi.ghiNhanDong(CO_B, lopA, { studentId: EM_1, amount: "100000" }),
  );
  await nem("cô B không ghi nhận xét cho học viên cô A", async () =>
    ghi.themNhanXet(CO_B, { studentId: EM_1, body: "Không được ghi." }),
  );

  const { rows: conNguyen } = await pool.query(
    "SELECT name FROM classes WHERE id = $1",
    [lopA],
  );
  kiem(
    "tên lớp không bị đổi trộm",
    conNguyen[0]?.name === "Lớp mô phỏng A",
    conNguyen[0]?.name,
    "Lớp mô phỏng A",
  );

  /* ── 6. Nhận xét mặc định riêng tư ───────────────────────────────────── */

  console.log("\n6) Nhận xét riêng");

  const nxId = await ghi.themNhanXet(CO_A, {
    studentId: EM_2,
    classId: lopA,
    body: "Em này mất gốc ngữ pháp, chưa nên đẩy lên lớp nâng cao.",
  });
  let nx = await kho.nhanXetCuaHocVien(CO_A, EM_2);
  kiem(
    "mặc định CHỈ CÔ ĐỌC ĐƯỢC",
    nx[0]?.sharedWithStudent === false,
    nx[0]?.sharedWithStudent,
    false,
  );

  await ghi.suaNhanXet(CO_A, nxId, { sharedWithStudent: true });
  nx = await kho.nhanXetCuaHocVien(CO_A, EM_2);
  kiem("bật chia sẻ thì bật được", nx[0]?.sharedWithStudent === true);

  await ghi.suaNhanXet(CO_A, nxId, { sharedWithStudent: false });
  nx = await kho.nhanXetCuaHocVien(CO_A, EM_2);
  kiem("thu lại được", nx[0]?.sharedWithStudent === false);

  await nem("cô B không sửa được nhận xét của cô A", async () =>
    ghi.suaNhanXet(CO_B, nxId, { sharedWithStudent: true }),
  );
  await nem("cô B không xoá được nhận xét của cô A", async () =>
    ghi.xoaNhanXet(CO_B, nxId),
  );

  await don();

  if (hong) {
    console.error(`\n${hong} mục HỎNG.`);
    process.exit(1);
  }
  console.log("\nQuản lý lớp: tiền đúng, lớp không lẫn giữa giáo viên, nhận xét mặc định riêng.");
  process.exit(0);
}

void main();
