import { headers } from "next/headers";

import { danhSachToken } from "../../../lib/apiToken";
import { teacherHienTai } from "../../../lib/phien";
import QuanLyToken from "./QuanLyToken";

export const dynamic = "force-dynamic";

/**
 * Kết nối AI agent (Claude, ChatGPT…) để giao bài bằng lời nói.
 *
 * Địa chỉ MCP dựng từ `ADMIN_URL` nếu có, không thì từ host của chính request
 * — trên Render là tên miền thật, ở máy dev là localhost.
 */
export default async function TrangKetNoiAi() {
  const teacherId = await teacherHienTai();
  const tokens = await danhSachToken(teacherId);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:2100";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const goc = (process.env.ADMIN_URL ?? `${proto}://${host}`).replace(/\/$/, "");

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-[#1A1A1A]">
        Kết nối AI
        <span className="mt-1 block text-sm font-medium text-[#1A1A1A]/60">
          Cho AI agent giao bài thay cô: “giao Cam 12 Test 3 cho lớp 9A, chờ cô mở đáp án”.
        </span>
      </h1>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="font-bold text-[#1A1A1A]">Agent làm được gì</h2>
        <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-[#1A1A1A]/75">
          <li>Tìm đề trong kho và trong đề nội bộ, tạo link giao bài, đóng link, mở kết quả.</li>
          <li>Tạo đề Writing nội bộ — giao được ngay.</li>
          <li>
            Soạn đề Reading kèm đáp án — <b>chưa giao được</b> cho tới khi cô đọc lại đáp án ở mục Đề nội bộ và bấm Lưu.
          </li>
          <li>Đọc kết quả: số câu đúng, band, bài viết của từng em.</li>
        </ul>
      </section>

      <QuanLyToken mcpUrl={`${goc}/api/mcp`} tokens={tokens} />
    </div>
  );
}
