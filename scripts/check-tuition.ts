import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });

/*
  Chuyển khoản học phí: mã VietQR, và luật "học sinh không tự xác nhận tiền".

  Hai nửa:

  1. MÃ QR — thuần, không cần DB. Kiểm từng trường của chuỗi EMVCo. Một mã sai
     vẫn VẼ RA được, chỉ tới lúc có người thật giơ điện thoại lên quét mới biết
     — nên phải kiểm bằng máy, và phải kiểm cả CRC bằng vector chuẩn.

  2. LUẬT TIỀN — cần DB. Học sinh bấm "tôi đã chuyển" thì KHÔNG được thành
     tiền trong sổ. Chỉ khi cô xác nhận mới tính. Sai chiều này là hoặc cô mất
     tiền, hoặc học sinh bị đòi hai lần.
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

async function nem(ten: string, viec: () => Promise<unknown> | unknown) {
  try {
    await viec();
    kiem(ten, false, "không báo lỗi", "phải báo lỗi");
  } catch {
    kiem(ten, true);
  }
}

/** Tách chuỗi EMVCo thành map id -> nội dung, để soi từng trường. */
function docTLV(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i + 4 <= s.length) {
    const id = s.slice(i, i + 2);
    const len = Number(s.slice(i + 2, i + 4));
    if (!Number.isFinite(len)) break;
    out[id] = s.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return out;
}

const CO = "sim-tt-teacher";
const EM = "sim-tt-student";

async function main() {
  const qr = await import("../apps/web/src/features/tuition/domain/vietqr");
  const ghi = await import("../apps/admin/src/lib/hocVienGhi");
  const khoAdmin = await import("../apps/admin/src/lib/hocVien");
  const { pool } = await import("@thuong-ielts/db");
  const { encode } = await import("@auth/core/jwt");

  /*
    Phần học sinh đi qua HTTP THẬT, không gọi thẳng tầng lib.

    Không phải để "sát thực tế hơn" — mà vì bắt buộc: các file server của web
    mở đầu bằng `import "server-only"`, và gói đó chỉ Next mới giải được. `tsx`
    chạy ngoài Next thì không resolve nổi. Đổi lại được một thứ tốt hơn: bài
    kiểm đi qua đúng chốt danh tính lấy từ phiên.
  */
  const GOC = process.env.CHECK_BASE_URL ?? "http://localhost:2000";
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("Thiếu AUTH_SECRET trong apps/web/.env.local");
    process.exit(1);
  }

  /* ── 1. Mã QR ────────────────────────────────────────────────────────── */

  console.log("\n1) Mã VietQR");

  /* Vector chuẩn của CRC-16/CCITT-FALSE. Sai cái này là sai tất cả. */
  kiem("CRC-16 đúng vector chuẩn", qr.crc16("123456789") === "29B1", qr.crc16("123456789"), "29B1");

  const chuoi = qr.chuoiVietQR({
    bankBin: "970436",
    soTaiKhoan: "1234567890",
    soTien: 1_500_000,
    noiDung: "HP Thu Hà T9",
  });
  const t = docTLV(chuoi);

  kiem("phiên bản payload = 01", t["00"] === "01", t["00"], "01");
  /* Có số tiền thì mã phải là ĐỘNG (12): app ngân hàng điền sẵn, khỏi gõ nhầm. */
  kiem("có số tiền thì mã là động (12)", t["01"] === "12", t["01"], "12");
  kiem("tiền tệ VND (704)", t["53"] === "704", t["53"], "704");
  kiem("quốc gia VN", t["58"] === "VN", t["58"], "VN");
  kiem("số tiền vào đúng trường 54", t["54"] === "1500000", t["54"], "1500000");

  const tk = docTLV(t["38"] ?? "");
  kiem("GUID của VietQR", tk["00"] === "A000000727", tk["00"], "A000000727");
  kiem("dịch vụ chuyển tới tài khoản", tk["02"] === "QRIBFTTA", tk["02"], "QRIBFTTA");
  const nguoiNhan = docTLV(tk["01"] ?? "");
  kiem("mã ngân hàng", nguoiNhan["00"] === "970436", nguoiNhan["00"], "970436");
  kiem("số tài khoản", nguoiNhan["01"] === "1234567890", nguoiNhan["01"], "1234567890");

  const themData = docTLV(t["62"] ?? "");
  /* Dấu tiếng Việt phải rụng TRƯỚC khi vào mã: ngân hàng băm nát dấu. */
  kiem(
    "nội dung đã bỏ dấu và viết hoa",
    themData["08"] === "HP THU HA T9",
    themData["08"],
    "HP THU HA T9",
  );

  kiem(
    "CRC ở cuối khớp với phần thân",
    qr.crc16(chuoi.slice(0, -4)) === chuoi.slice(-4),
    chuoi.slice(-4),
    qr.crc16(chuoi.slice(0, -4)),
  );

  const tinh = qr.chuoiVietQR({ bankBin: "970436", soTaiKhoan: "1234567890" });
  kiem(
    "không có số tiền thì mã là tĩnh (11)",
    docTLV(tinh)["01"] === "11",
    docTLV(tinh)["01"],
    "11",
  );
  kiem("mã tĩnh không mang trường số tiền", docTLV(tinh)["54"] === undefined);

  await nem("mã ngân hàng sai định dạng bị từ chối", () =>
    qr.chuoiVietQR({ bankBin: "97043", soTaiKhoan: "1234567890" }),
  );
  await nem("số tài khoản có chữ bị từ chối", () =>
    qr.chuoiVietQR({ bankBin: "970436", soTaiKhoan: "12345abc" }),
  );

  kiem(
    "nội dung chuyển khoản lấy hai từ cuối của tên",
    qr.noiDungChuyenKhoan("Nguyễn Thu Hà", "2026-09") === "HP THU HA T9",
    qr.noiDungChuyenKhoan("Nguyễn Thu Hà", "2026-09"),
    "HP THU HA T9",
  );
  /* Trường 08 của chuẩn chỉ chứa 25 ký tự; tên dài phải bị cắt chứ không tràn. */
  const dai = qr.noiDungChuyenKhoan(
    "Nguyễn Hoàng Bảo Trân Thị Mỹ Linh Phương",
    "2026-12",
  );
  kiem("tên dài vẫn không quá 25 ký tự", dai.length <= 25, dai.length, "<= 25");

  /* ── 2. Luật tiền ────────────────────────────────────────────────────── */

  console.log("\n2) Học sinh khai, cô xác nhận");

  const don = async () => {
    await pool.query("DELETE FROM classes WHERE teacher_id = $1", [CO]);
    await pool.query("DELETE FROM teachers WHERE id = $1", [CO]);
    await pool.query("DELETE FROM students WHERE id = $1", [EM]);
  };
  await don();
  await pool.query(
    `INSERT INTO teachers (id, username, password_hash, name)
     VALUES ($1,$1,'x','Cô mô phỏng')`,
    [CO],
  );
  await pool.query("INSERT INTO students (id, name) VALUES ($1,'Em Mô Phỏng')", [EM]);

  const lop = await ghi.taoLop(CO, {
    name: "Lớp học phí",
    tuitionAmount: "1.500.000",
    tuitionCycle: "thang",
  });
  await ghi.themHocVien(CO, lop, EM);

  const ky = khoAdmin.kyHienTai();

  const veCuaEm = await encode({
    token: { sub: EM, studentId: EM },
    secret,
    salt: "authjs.session-token",
    maxAge: 3600,
  });
  const cookie = `authjs.session-token=${veCuaEm}`;

  const bao = async (classId: string, period: string | null, veKhac?: string) => {
    const res = await fetch(`${GOC}/api/hoc-phi/bao-da-chuyen`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(veKhac === undefined ? { cookie } : veKhac ? { cookie: veKhac } : {}),
      },
      body: JSON.stringify({ classId, period }),
    });
    return { status: res.status, body: (await res.json()) as { error?: string } };
  };

  /* Em ấy khai đã chuyển. */
  const khai = await bao(lop, ky);
  kiem("học sinh khai được", khai.status === 200, khai.body.error ?? khai.status, 200);

  kiem(
    "chưa đăng nhập thì không khai được",
    (await bao(lop, ky, "")).status === 401,
  );

  let tien = await khoAdmin.tomTatTien(CO, lop, ky);
  /*
    Đây là mục quan trọng nhất cả file: LỜI KHAI KHÔNG PHẢI LÀ TIỀN. Sai chỗ
    này thì bất kỳ ai cũng bấm một nút để "đóng" học phí.
  */
  kiem(
    "lời khai CHƯA vào sổ: thu kỳ này vẫn 0",
    tien.thuKyNay === 0,
    tien.thuKyNay,
    0,
  );
  kiem("vẫn tính là chưa đóng", tien.soChuaDong === 1, tien.soChuaDong, 1);
  kiem("nhưng có 1 dòng chờ duyệt", tien.soChoXacNhan === 1, tien.soChoXacNhan, 1);

  let ds = await khoAdmin.hocVienCuaLop(CO, lop, ky);
  kiem("sổ lớp vẫn ghi chưa đóng", ds[0].daDongKyNay === false);
  kiem("và có cờ chờ xác nhận", ds[0].choXacNhan === true);
  kiem("tổng đã đóng vẫn 0", ds[0].daDong === 0, ds[0].daDong, 0);

  /* Khai lần hai cho cùng kỳ: nói rõ đã gửi rồi, không đẻ dòng thứ hai. */
  const lai = await bao(lop, ky);
  kiem("khai lần hai bị chặn", lai.status === 400, lai.body.error, "phải từ chối");

  const { rows: demDong } = await pool.query<{ n: string }>(
    "SELECT count(*) n FROM tuition_payments WHERE class_id=$1 AND student_id=$2",
    [lop, EM],
  );
  kiem("vẫn chỉ một dòng", Number(demDong[0].n) === 1, Number(demDong[0].n), 1);

  /*
    Số tiền KHÔNG nhận từ client: gửi kèm 10.000 đ thì server vẫn lấy mức học
    phí của lớp. Không có chốt này thì ai cũng tự đặt giá cho mình.
  */
  const lopKhac = await ghi.taoLop(CO, {
    name: "Lớp thứ hai",
    tuitionAmount: "2.000.000",
    tuitionCycle: "thang",
  });
  await ghi.themHocVien(CO, lopKhac, EM);
  await fetch(`${GOC}/api/hoc-phi/bao-da-chuyen`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ classId: lopKhac, period: ky, amount: 10000 }),
  });
  const { rows: soTien } = await pool.query<{ amount: string }>(
    "SELECT amount FROM tuition_payments WHERE class_id=$1",
    [lopKhac],
  );
  kiem(
    "số tiền tự chế trong body bị bỏ qua",
    Number(soTien[0]?.amount) === 2_000_000,
    Number(soTien[0]?.amount),
    2_000_000,
  );

  /* Người ngoài lớp không khai được — đây là cửa ghi bậy vào sổ lớp khác. */
  const veNguoiLa = await encode({
    token: { sub: "sim-tt-outsider", studentId: "sim-tt-outsider" },
    secret,
    salt: "authjs.session-token",
    maxAge: 3600,
  });
  kiem(
    "người ngoài lớp không khai được",
    (await bao(lop, ky, `authjs.session-token=${veNguoiLa}`)).status === 403,
  );

  /* Cô xác nhận, sửa lại theo sao kê: em ấy chuyển thiếu 100k. */
  const { rows: dong } = await pool.query<{ id: string }>(
    "SELECT id FROM tuition_payments WHERE class_id=$1 AND student_id=$2",
    [lop, EM],
  );
  await ghi.xacNhanDong(CO, dong[0].id, "1.400.000");

  tien = await khoAdmin.tomTatTien(CO, lop, ky);
  kiem(
    "xác nhận rồi thì tiền vào sổ, theo số CÔ sửa",
    tien.thuKyNay === 1_400_000,
    tien.thuKyNay,
    1_400_000,
  );
  kiem("hết dòng chờ duyệt", tien.soChoXacNhan === 0, tien.soChoXacNhan, 0);

  ds = await khoAdmin.hocVienCuaLop(CO, lop, ky);
  kiem("sổ lớp ghi đã đóng", ds[0].daDongKyNay === true);

  await nem("xác nhận lần hai bị chặn", () => ghi.xacNhanDong(CO, dong[0].id));
  await nem("cô khác không xác nhận được", async () => {
    await pool.query(
      `INSERT INTO teachers (id, username, password_hash, name)
       VALUES ('sim-tt-other','sim-tt-other','x','Cô khác')
       ON CONFLICT (id) DO NOTHING`,
    );
    await ghi.xacNhanDong("sim-tt-other", dong[0].id);
  });

  /* ── 3. Tài khoản nhận ───────────────────────────────────────────────── */

  console.log("\n3) Tài khoản nhận tiền");

  await nem("số tài khoản có chữ bị từ chối", () =>
    ghi.luuTaiKhoan(CO, {
      bankBin: "970436",
      bankAccount: "12ab34",
      bankHolder: "HO NGOC THUONG",
    }),
  );
  await nem("thiếu tên chủ tài khoản bị từ chối", () =>
    ghi.luuTaiKhoan(CO, { bankBin: "970436", bankAccount: "1234567890" }),
  );

  await ghi.luuTaiKhoan(CO, {
    bankBin: "970436",
    bankName: "Vietcombank",
    bankAccount: "1234 567 890",
    bankHolder: "HO NGOC THUONG",
  });
  const tk2 = await khoAdmin.taiKhoanNhan(CO);
  /* Khoảng trắng phải rụng: số tài khoản đi thẳng vào mã QR. */
  kiem(
    "khoảng trắng trong số tài khoản bị bỏ",
    tk2.bankAccount === "1234567890",
    tk2.bankAccount,
    "1234567890",
  );

  /*
    Mở đúng trang học sinh thấy: số tài khoản, nội dung chuyển khoản, và mã QR
    phải có mặt. Đây là chỗ duy nhất chứng minh cả chuỗi nối đúng từ DB tới
    mắt người học.
  */
  const trang = await fetch(`${GOC}/hoc-phi`, { headers: { cookie } });
  const html = await trang.text();
  kiem("mở được trang học phí", trang.status === 200, trang.status, 200);
  kiem("trang hiện số tài khoản", html.includes("1234567890"));
  kiem("trang hiện nội dung chuyển khoản", /HP\s+MO\s+PHONG/.test(html));
  kiem("trang có vẽ mã QR", html.includes("<svg"));
  kiem(
    "trang KHÔNG lộ mã lớp trong chữ hiển thị",
    !html.includes("sim-tt-teacher"),
  );

  /* Bỏ trống cả ba = tắt chuyển khoản, không phải lỗi. */
  await ghi.luuTaiKhoan(CO, { bankBin: "", bankAccount: "", bankHolder: "" });
  kiem("xoá được tài khoản", (await khoAdmin.taiKhoanNhan(CO)).bankAccount === null);

  await don();
  await pool.query("DELETE FROM teachers WHERE id = 'sim-tt-other'");

  if (hong) {
    console.error(`\n${hong} mục HỎNG.`);
    process.exit(1);
  }
  console.log("\nChuyển khoản: mã QR đúng chuẩn, lời khai không phải là tiền.");
  process.exit(0);
}

void main();
