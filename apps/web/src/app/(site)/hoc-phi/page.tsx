import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";

import { redirect } from "next/navigation";

import { currentStudent } from "../../../features/account/server/guard";
import {
  chuoiVietQR,
  noiDungChuyenKhoan,
  tenNganHang,
} from "../../../features/tuition/domain/vietqr";
import {
  lichSuDong,
  lopCuaHocVien,
} from "../../../features/tuition/server/tuitionRepository";
import TheChuyenKhoan from "../../../features/tuition/ui/TheChuyenKhoan";

export const metadata: Metadata = {
  title: "Học phí | HNT.IELTS - Hồ Ngọc Thương",
  description: "Xem học phí lớp bạn đang học và chuyển khoản bằng mã QR.",
};

export const dynamic = "force-dynamic";

/*
  Học phí của chính mình.

  BẮT đăng nhập: học phí là chuyện riêng của từng nhà, và danh tính lấy từ
  phiên chứ không bao giờ từ đường dẫn.

  ## Mã QR dựng Ở SERVER

  `chuoiVietQR` là hàm thuần, `qrcode` vẽ ra SVG ngay trong lần dựng trang.
  Hai cái lợi: số tài khoản của cô không đi qua dịch vụ ảnh của bên thứ ba, và
  trình duyệt học sinh không phải tải thêm thư viện nào.

  Kỳ mặc định là THÁNG NÀY. Không cho chọn kỳ khác ở đây: em nào nợ tháng
  trước thì nhắn cô, chứ bày ra một ô chọn kỳ là mời người ta chuyển nhầm kỳ.
*/
export default async function TrangHocPhi() {
  /*
    Chỉ bắt ĐĂNG NHẬP, không bắt khai xong hồ sơ.

    `requireStudent` (dùng cho phòng thi) còn chặn thêm một nấc: chưa khai
    tuổi, nghề, band mục tiêu thì đá sang `/ho-so`. Đúng cho phòng thi — không
    có hồ sơ thì không dựng được lộ trình. Nhưng ở đây em ấy chỉ đang muốn
    chuyển tiền học phí; bắt điền một cái form trước khi cho xem số tài khoản
    là cách nhanh nhất để em ấy bỏ đó và nhắn thẳng cho cô.
  */
  const student = await currentStudent();
  if (!student) redirect("/dang-nhap?next=%2Fhoc-phi");

  const [lop, lichSu] = await Promise.all([
    lopCuaHocVien(student.id),
    lichSuDong(student.id),
  ]);

  const dangHoc = lop.filter((l) => !l.daNghi);
  const now = new Date();
  const ky = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const ten = student.name ?? "Học viên";

  /* Dựng sẵn QR cho từng lớp — chỉ khi cô đã khai đủ tài khoản. */
  const the = await Promise.all(
    dangHoc.map(async (l) => {
      const kyCuaLop = l.chuKy === "khoa" ? null : ky;
      const daDong = lichSu.some(
        (d) =>
          d.classId === l.classId &&
          (d.period ?? null) === kyCuaLop &&
          d.status === "da_xac_nhan",
      );
      const dangCho = lichSu.some(
        (d) =>
          d.classId === l.classId &&
          (d.period ?? null) === kyCuaLop &&
          d.status === "cho_xac_nhan",
      );

      const duTaiKhoan = Boolean(l.bankBin && l.bankAccount && l.bankHolder);
      const noiDung = noiDungChuyenKhoan(ten, kyCuaLop);

      let qrSvg: string | null = null;
      if (duTaiKhoan && l.hocPhi && !daDong) {
        try {
          const chuoi = chuoiVietQR({
            bankBin: l.bankBin as string,
            soTaiKhoan: l.bankAccount as string,
            soTien: l.hocPhi,
            noiDung,
          });
          qrSvg = await QRCode.toString(chuoi, {
            type: "svg",
            margin: 1,
            width: 220,
            errorCorrectionLevel: "M",
          });
        } catch {
          /* Tài khoản cô khai sai định dạng: hiện phần chữ, bỏ mã. */
          qrSvg = null;
        }
      }

      return {
        ...l,
        ky: kyCuaLop,
        daDong,
        dangCho,
        duTaiKhoan,
        noiDung,
        qrSvg,
        tenNganHang: l.bankName ?? tenNganHang(l.bankBin),
      };
    }),
  );

  return (
    <main className="relative z-10 min-h-screen bg-white pb-20 pt-24 md:pt-28">
      <div className="mx-auto max-w-4xl gutter">
        <nav className="mb-6 text-2xs font-medium text-ink/65">
          <Link href="/" className="hover:text-brand">
            Trang chủ
          </Link>{" "}
          / <span className="text-ink">Học phí</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-brand">Học phí của bạn</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
          Quét mã để chuyển khoản — số tiền và nội dung đã điền sẵn, không phải
          gõ tay. Chuyển xong bấm báo cô để cô đối chiếu sao kê.
        </p>

        {the.length === 0 && (
          <p className="mt-8 rounded-2xl border border-dashed border-sage-3 px-6 py-12 text-center text-sm leading-relaxed text-ink/65">
            Bạn chưa được xếp vào lớp nào. Nhắn cô để được thêm vào lớp, rồi
            phần học phí sẽ hiện ở đây.
          </p>
        )}

        <div className="mt-7 flex flex-col gap-5">
          {the.map((t) => (
            <TheChuyenKhoan key={t.classId} the={t} />
          ))}
        </div>

        {lichSu.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-2xs font-extrabold uppercase tracking-wider text-ink/65">
              Lịch sử đóng học phí
            </h2>
            <ul className="flex flex-col gap-2">
              {lichSu.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-baseline gap-3 rounded-xl border border-sage-3 px-4 py-3 text-sm"
                >
                  <span className="font-mono text-2xs text-ink/65">
                    {d.paidOn}
                  </span>
                  <b className="font-mono text-brand">
                    {new Intl.NumberFormat("vi-VN").format(d.amount)} đ
                  </b>
                  <span className="text-2xs text-ink/65">{d.tenLop}</span>
                  <span
                    className={`ml-auto rounded-full px-2.5 py-1 text-2xs font-bold ${
                      d.status === "da_xac_nhan"
                        ? "bg-sage-2 text-brand"
                        : "bg-warn-soft text-warn"
                    }`}
                  >
                    {d.status === "da_xac_nhan" ? "Cô đã xác nhận" : "Chờ cô xác nhận"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/*
          Nói thẳng luật: tiền vào sổ khi CÔ xác nhận, không phải khi em bấm
          nút. Giấu điều này đi thì em nào bấm xong tưởng xong, tới buổi học bị
          hỏi lại là mất lòng cả hai bên.
        */}
        <p className="mt-8 text-2xs leading-relaxed text-ink/65">
          Bấm “Tôi đã chuyển” chỉ là báo cho cô biết. Học phí được tính là đã
          đóng khi cô đối chiếu sao kê ngân hàng và xác nhận — thường trong
          ngày. Chuyển nhầm số tiền hoặc sai nội dung thì nhắn cô, đừng chuyển
          thêm lần nữa.
        </p>
      </div>
    </main>
  );
}
