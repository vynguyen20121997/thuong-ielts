import { NextResponse } from "next/server";

import { teacherTuToken } from "../../../lib/apiToken";
import { LoiTool, TOOLS } from "../../../lib/mcpTools";

/**
 * MCP server (Streamable HTTP, không trạng thái) cho AI agent giao bài thay cô.
 *
 * Tự viết JSON-RPC thay vì kéo SDK: không trạng thái + chỉ trả JSON là phần
 * nhỏ nhất của giao thức mà mọi client MCP đều nói được, và cả server chỉ là
 * bốn phương thức. Không mở luồng SSE (GET trả 405 — đúng chuẩn cho server
 * không đẩy tin chủ động).
 *
 * Xác thực bằng `Authorization: Bearer hnt_…` (token tạo ở trang "Kết nối AI"),
 * KHÔNG bằng cookie: `proxy.ts` cho `/api/mcp` đi qua và route này tự chặn.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PHIEN_BAN = ["2025-06-18", "2025-03-26", "2024-11-05"];

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const ok = (id: Rpc["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const loi = (id: Rpc["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function xuLy(teacherId: string, m: Rpc) {
  switch (m.method) {
    case "initialize": {
      const xin = String(m.params?.protocolVersion ?? "");
      return ok(m.id, {
        protocolVersion: PHIEN_BAN.includes(xin) ? xin : PHIEN_BAN[0],
        capabilities: { tools: {} },
        serverInfo: { name: "thuong-ielts-admin", version: "1.0.0" },
        instructions:
          "Giao bài cho lớp của cô Thương. Quy trình: danh_sach_de (hoặc tao_de_writing / tao_de_reading) → giao_bai → gửi link. " +
          "Đề Reading do bạn soạn phải chờ cô duyệt đáp án mới giao được — đừng nói với cô là đã giao khi tool chưa trả về link.",
      });
    }
    case "ping":
      return ok(m.id, {});
    case "tools/list":
      return ok(m.id, {
        tools: TOOLS.map(({ name, description, inputSchema, annotations }) => ({ name, description, inputSchema, annotations })),
      });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === m.params?.name);
      if (!tool) return loi(m.id, -32602, `Không có tool "${String(m.params?.name)}".`);
      const args = (m.params?.arguments ?? {}) as Record<string, unknown>;
      try {
        const kq = await tool.chay(teacherId, typeof args === "object" && args ? args : {});
        return ok(m.id, { content: [{ type: "text", text: JSON.stringify(kq, null, 2) }] });
      } catch (err) {
        // Lỗi agent sửa được trả về như KẾT QUẢ có isError, đúng chuẩn MCP, để
        // model đọc và thử lại. Lỗi hệ thống thì không lộ chi tiết.
        if (err instanceof LoiTool) return ok(m.id, { content: [{ type: "text", text: err.message }], isError: true });
        console.error(`[mcp] ${tool.name} lỗi:`, err);
        return ok(m.id, { content: [{ type: "text", text: "Lỗi hệ thống, thử lại sau." }], isError: true });
      }
    }
    default:
      return loi(m.id, -32601, `Không hỗ trợ "${String(m.method)}".`);
  }
}

export async function POST(request: Request) {
  const teacherId = await teacherTuToken(request.headers.get("authorization"));
  if (!teacherId) {
    return NextResponse.json(loi(null, -32001, "Token không hợp lệ hoặc đã bị thu hồi."), {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="thuong-ielts"' },
    });
  }

  let body: Rpc | Rpc[];
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(loi(null, -32700, "JSON không hợp lệ."), { status: 400 });
  }

  const ds = Array.isArray(body) ? body : [body];
  const traLoi = [];
  for (const m of ds) {
    // Thông báo (không có id) thì không trả lời.
    if (m.id === undefined || m.id === null) continue;
    traLoi.push(await xuLy(teacherId, m));
  }
  if (traLoi.length === 0) return new NextResponse(null, { status: 202 });
  return NextResponse.json(Array.isArray(body) ? traLoi : traLoi[0]);
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
