import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });
dotenv.config({ path: "apps/admin/.env.local" });

/*
  Các chốt của MCP — lối vào cho AI agent giao bài thay cô.

  Agent cầm token là cầm quyền của cô, nên thứ phải canh không phải "tool chạy
  được" mà là "tool KHÔNG chạy được khi không được phép": token sai/thu hồi,
  token của cô B chạm vào bài của cô A, và đề Reading AI soạn lọt ra lớp trước
  khi cô duyệt đáp án.

  Cần dev server admin :2100.
*/

const ADMIN = process.env.CHECK_ADMIN_URL ?? "http://localhost:2100";
const CO_A = "sim-mcp-co-a";
const CO_B = "sim-mcp-co-b";

let hong = 0;
const loi: string[] = [];
function kiem(ten: string, dat: boolean, thuc?: unknown) {
  if (dat) return console.log(`  ok   ${ten}`);
  hong += 1;
  const ct = thuc === undefined ? "" : `: nhận ${JSON.stringify(thuc).slice(0, 200)}`;
  loi.push(ten + ct);
  console.error(`  HỎNG ${ten}${ct}`);
}

let soId = 0;
async function rpc(token: string | null, method: string, params: Record<string, unknown> = {}) {
  const res = await fetch(`${ADMIN}/api/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++soId, method, params }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    result?: { content?: { text: string }[]; isError?: boolean; tools?: { name: string }[]; protocolVersion?: string };
    error?: { message: string };
  };
  return { status: res.status, body };
}

/** Gọi tool, trả về { loi, data } — `data` là JSON đã parse khi tool thành công. */
async function tool(token: string, name: string, args: Record<string, unknown>) {
  const r = await rpc(token, "tools/call", { name, arguments: args });
  const text = r.body.result?.content?.[0]?.text ?? "";
  if (r.body.result?.isError || r.body.error) return { loi: text || r.body.error?.message || "lỗi", data: null as never };
  return { loi: null, data: JSON.parse(text) };
}

async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const { taoToken, thuHoiToken } = await import("../apps/admin/src/lib/apiToken");

  const don = async () => {
    for (const co of [CO_A, CO_B]) {
      await pool.query("DELETE FROM assignments WHERE teacher_id = $1", [co]);
      // TRƯỚC khi xoá cô: reading_tests.owner_id là ON DELETE SET NULL.
      await pool.query("DELETE FROM reading_tests WHERE owner_id = $1", [co]);
      await pool.query("DELETE FROM writing_prompts WHERE owner_id = $1", [co]);
      await pool.query("DELETE FROM teachers WHERE id = $1", [co]);
    }
  };
  await don();
  for (const co of [CO_A, CO_B])
    await pool.query(`INSERT INTO teachers (id, username, password_hash, name) VALUES ($1,$1,'x','Cô ảo')`, [co]);
  const tA = (await taoToken(CO_A, "check A")).token;
  const tB = (await taoToken(CO_B, "check B")).token;

  console.log("1) Xác thực");
  kiem("không token thì 401", (await rpc(null, "tools/list")).status === 401);
  kiem("token bịa thì 401", (await rpc("hnt_" + "x".repeat(43), "tools/list")).status === 401);
  const thuHoi = await taoToken(CO_A, "sẽ thu hồi");
  await thuHoiToken(CO_A, thuHoi.id);
  kiem("token đã thu hồi thì 401", (await rpc(thuHoi.token, "tools/list")).status === 401);
  const init = await rpc(tA, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "check", version: "1" } });
  kiem("initialize trả đúng phiên bản giao thức", init.body.result?.protocolVersion === "2025-06-18", init.body);
  const ds = await rpc(tA, "tools/list");
  kiem("tools/list có đủ 8 tool", ds.body.result?.tools?.length === 8, ds.body.result?.tools?.map((t) => t.name));

  console.log("\n2) Đi đường thuận: tạo đề Writing → giao → đọc kết quả");
  const deW = await tool(tA, "tao_de_writing", {
    ten: "Writing ảo MCP",
    deBai: "Some people think remote work is better. Discuss both views and give your opinion.",
  });
  kiem("tạo được đề Writing", !deW.loi && String(deW.data?.target).startsWith("wn-"), deW.loi);
  const giao = await tool(tA, "giao_bai", { kyNang: "writing", target: deW.data?.target, tenBuoi: "Lớp ảo" });
  kiem("giao được, trả về link /vao/", !giao.loi && /\/vao\/[A-Za-z0-9_-]{20,}$/.test(String(giao.data?.link)), giao.loi ?? giao.data);
  const kq = await tool(tA, "ket_qua_bai_giao", { id: giao.data?.id });
  kiem("đọc được kết quả bài vừa giao", !kq.loi && Array.isArray(kq.data?.baiNop), kq.loi);
  const tim = await tool(tA, "danh_sach_de", { tim: "Writing ảo MCP" });
  kiem("danh_sach_de thấy đề nội bộ của chính cô", !tim.loi && tim.data?.de?.some((d: { target: string }) => d.target === deW.data?.target));

  console.log("\n3) Cô B không chạm được vào bài của cô A");
  const timB = await tool(tB, "danh_sach_de", { tim: "Writing ảo MCP" });
  kiem("cô B không thấy đề nội bộ của cô A", !timB.loi && !timB.data?.de?.some((d: { target: string }) => d.target === deW.data?.target));
  const giaoB = await tool(tB, "giao_bai", { kyNang: "writing", target: deW.data?.target });
  kiem("cô B không giao được đề của cô A", giaoB.loi !== null, giaoB.data);
  const kqB = await tool(tB, "ket_qua_bai_giao", { id: giao.data?.id });
  kiem("cô B không đọc được kết quả của cô A", kqB.loi !== null, kqB.data);
  const dongB = await tool(tB, "dong_bai", { id: giao.data?.id });
  const { rows: conMo } = await pool.query("SELECT is_open FROM assignments WHERE id = $1", [giao.data?.id]);
  kiem("cô B không đóng được bài của cô A", dongB.loi !== null && conMo[0]?.is_open === true, { loi: dongB.loi, mo: conMo[0]?.is_open });

  console.log("\n4) Đề Reading AI soạn phải chờ cô duyệt");
  const deR = await tool(tA, "tao_de_reading", {
    maDe: "SIM-MCP-R1",
    ten: "Reading ảo MCP",
    baiDoc: "Japan offers career opportunities in technology.",
    nhomCau: [
      { dang: "gap-fill", huongDan: "ONE WORD", cau: [{ noiDung: "Japan offers ___ opportunities.", dapAn: "career" }] },
      { dang: "true-false-not-given", cau: [{ noiDung: "Japan is cold.", dapAn: "NOT GIVEN" }] },
    ],
  });
  kiem("tạo được, trả trạng thái chờ duyệt", !deR.loi && deR.data?.trangThai === "cho-co-duyet", deR.loi ?? deR.data);
  const giaoR = await tool(tA, "giao_bai", { kyNang: "reading", target: "rieng-sim-mcp-r1" });
  kiem("CHƯA giao được đề AI soạn khi cô chưa duyệt", giaoR.loi !== null, giaoR.data);
  const { rows: trangThai } = await pool.query("SELECT status, question_count FROM reading_tests WHERE slug = 'rieng-sim-mcp-r1'");
  kiem("đề nằm draft nhưng đủ nội dung", trangThai[0]?.status === "draft" && trangThai[0]?.question_count === 2, trangThai[0]);

  const sai = await tool(tA, "tao_de_reading", {
    maDe: "SIM-MCP-R2",
    ten: "Reading sai",
    baiDoc: "Text.",
    nhomCau: [{ dang: "true-false-not-given", cau: [{ noiDung: "X.", dapAn: "MAYBE" }] }],
  });
  const { rows: sot } = await pool.query("SELECT 1 FROM reading_tests WHERE slug = 'rieng-sim-mcp-r2'");
  kiem("đáp án ngoài lựa chọn bị từ chối, không để lại đề rỗng", sai.loi !== null && sot.length === 0, { loi: sai.loi, sot: sot.length });

  console.log("\n5) Đóng bài của chính mình");
  const dong = await tool(tA, "dong_bai", { id: giao.data?.id });
  const { rows: daDong } = await pool.query("SELECT is_open FROM assignments WHERE id = $1", [giao.data?.id]);
  kiem("cô A đóng được bài của mình", !dong.loi && daDong[0]?.is_open === false, dong.loi);

  await don();
  console.log("");
  if (hong) {
    console.error(`${hong} mục HỎNG:`);
    for (const l of loi) console.error(`  - ${l}`);
    process.exit(1);
  }
  console.log("MCP giữ đủ các chốt.");
  process.exit(0);
}

void main();
