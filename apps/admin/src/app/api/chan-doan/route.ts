import { NextResponse } from "next/server";
import { pool } from "@thuong-ielts/db";
import { exam, RULES_VERSION } from "@thuong-ielts/diagnostic";

import { teacherHienTai } from "../../../lib/phien";

/**
 * Danh sách lượt làm bài kiểm tra nền đã nộp.
 *
 * Khoá dùng ở đây là `token_hash`, KHÔNG phải token gốc của học sinh: token gốc
 * là thứ mở được báo cáo cá nhân, còn bản băm thì không mở được gì. Trang quản
 * trị chỉ cần định danh một lượt, nên dùng bản băm là đủ và không tạo thêm một
 * đường rò đường dẫn cá nhân.
 *
 * Cột `lac_hau` để cô thấy ngay lượt nào đang chấm theo đề hoặc bộ quy tắc cũ —
 * đó chính là những lượt đáng cân nhắc chấm lại.
 */
export async function GET() {
  await teacherHienTai();
  const { rows } = await pool.query(
    `SELECT token_hash,
            profile ->> 'name'  AS ten,
            profile ->> 'email' AS email,
            profile ->> 'target' AS muc_tieu,
            version                AS phien_ban_de,
            rules_version          AS phien_ban_quy_tac,
            submitted_at, auto_submitted,
            result -> 'scores'     AS diem,
            (SELECT count(*) FROM diagnostic_regrades r WHERE r.token_hash = a.token_hash) AS so_lan_cham_lai
       FROM diagnostic_attempts a
      WHERE submitted_at IS NOT NULL
      ORDER BY submitted_at DESC
      LIMIT 200`,
  );
  return NextResponse.json({
    deHienHanh: exam.version,
    quyTacHienHanh: RULES_VERSION,
    luot: rows.map((r) => ({
      id: r.token_hash,
      ten: r.ten,
      email: r.email,
      mucTieu: r.muc_tieu,
      nopLuc: r.submitted_at,
      tuNop: r.auto_submitted,
      diem: r.diem,
      phienBanDe: r.phien_ban_de,
      phienBanQuyTac: r.phien_ban_quy_tac,
      soLanChamLai: Number(r.so_lan_cham_lai),
      lacHau:
        r.phien_ban_de !== exam.version ||
        r.phien_ban_quy_tac !== RULES_VERSION,
    })),
  });
}
