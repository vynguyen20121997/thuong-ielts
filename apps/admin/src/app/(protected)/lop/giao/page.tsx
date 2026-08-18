import { pool, danhSachBaiGiao } from "@thuong-ielts/db";

import { teacherHienTai } from "../../../../lib/phien";
import FormGiaoBai from "./FormGiaoBai";
import DanhSach from "./DanhSach";

export const dynamic = "force-dynamic";

/**
 * Giao bài cho lớp bằng một đường link.
 *
 * Cô chọn đề, bấm tạo, chép link gửi vào nhóm lớp. Học sinh bấm là vào thẳng
 * đúng đề — không phải dò trong danh mục, không phải nghe cô đọc tên đề.
 */
export default async function TrangGiaoBai() {
  const teacherId = await teacherHienTai();

  // Danh sách đề để cô chọn. Chỉ lấy cột tóm tắt — trang này không đụng tới
  // nội dung đề, và tuyệt đối không đụng tới `answer_key`.
  const { rows: readingTests } = await pool.query(
    `SELECT DISTINCT COALESCE(substring(slug from '^(cam\\d+-test\\d+)-'), slug) AS target,
            min(title) AS title
       FROM reading_tests
      WHERE status = 'published' AND owner_id IS NULL
      GROUP BY 1
      ORDER BY 1`
  );
  const { rows: listeningTests } = await pool.query(
    `SELECT slug AS target, title
       FROM listening_tests
      WHERE status = 'published' AND owner_id IS NULL
      ORDER BY slug`
  );

  const daGiao = await danhSachBaiGiao(teacherId);

  return (
    <div>
      <h1 className="font-serif text-3xl font-black text-[#1A1A1A] mb-2">Giao bài cho lớp</h1>
      <p className="text-sm text-[#1A1A1A]/55 mb-8 max-w-2xl">
        Chọn đề rồi bấm tạo link. Gửi link vào nhóm lớp — học sinh bấm là vào thẳng đúng đề, và
        hiện ngay trên bảng lớp của cô.
      </p>

      <FormGiaoBai
        reading={readingTests.map((r) => ({
          target: r.target as string,
          title: (r.title as string).replace(/ · Passage \d+.*$/, ""),
        }))}
        listening={listeningTests.map((r) => ({
          target: r.target as string,
          title: r.title as string,
        }))}
      />

      <h2 className="font-serif text-xl font-black text-[#1A1A1A] mt-12 mb-4">Đã giao</h2>
      <DanhSach
        items={daGiao.map((b) => ({
          id: b.id,
          nhan: b.label || b.title,
          token: b.shareToken,
          moCua: b.isOpen && (!b.closesAt || b.closesAt.getTime() > Date.now()),
          dongLuc: b.closesAt ? b.closesAt.toISOString() : null,
          choKhach: b.allowGuest,
          motLan: b.oneAttempt,
          daVao: b.daVao,
          daNop: b.daNop,
          khoaLop: `bg-${b.id}`,
        }))}
      />
    </div>
  );
}
