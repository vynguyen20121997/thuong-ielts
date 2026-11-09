import crypto from "crypto";
import { pool } from "@thuong-ielts/db";

/**
 * Token cho AI agent (MCP). Mỗi cô có token riêng, tạo/thu hồi ở trang
 * "Kết nối AI". Bảng chỉ giữ SHA-256 — token thật hiện ra đúng một lần.
 *
 * Tiền tố `hnt_` để cô (và công cụ quét secret) nhận ra ngay đây là gì nếu
 * lỡ dán nó vào chỗ không nên.
 */

const TIEN_TO = "hnt_";
const bam = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export interface TokenTomTat {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}

export async function taoToken(teacherId: string, name: string): Promise<{ id: string; token: string }> {
  const ten = name.trim().slice(0, 80) || "AI agent";
  const token = TIEN_TO + crypto.randomBytes(32).toString("base64url");
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO teacher_api_tokens (id, teacher_id, name, token_hash) VALUES ($1, $2, $3, $4)`,
    [id, teacherId, ten, bam(token)]
  );
  return { id, token };
}

export async function danhSachToken(teacherId: string): Promise<TokenTomTat[]> {
  const { rows } = await pool.query(
    `SELECT id, name, created_at, last_used_at, revoked_at
       FROM teacher_api_tokens WHERE teacher_id = $1 ORDER BY created_at DESC`,
    [teacherId]
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: new Date(r.created_at).toISOString(),
    lastUsedAt: r.last_used_at ? new Date(r.last_used_at).toISOString() : null,
    revoked: r.revoked_at !== null,
  }));
}

export async function thuHoiToken(teacherId: string, id: string): Promise<void> {
  await pool.query(
    `UPDATE teacher_api_tokens SET revoked_at = now() WHERE id = $1 AND teacher_id = $2 AND revoked_at IS NULL`,
    [id, teacherId]
  );
}

/**
 * `Authorization: Bearer hnt_…` → teacherId, hoặc null. Token thu hồi, sai,
 * hay của giáo viên đã bị tắt đều là null. So khớp bằng băm nên không có
 * chuyện so chuỗi lộ thời gian.
 */
export async function teacherTuToken(authorization: string | null): Promise<string | null> {
  const m = /^Bearer\s+(hnt_[A-Za-z0-9_-]{20,})$/.exec(authorization ?? "");
  if (!m) return null;
  const { rows } = await pool.query(
    `UPDATE teacher_api_tokens k SET last_used_at = now()
       FROM teachers t
      WHERE k.token_hash = $1 AND k.revoked_at IS NULL AND t.id = k.teacher_id AND t.is_active
      RETURNING k.teacher_id`,
    [bam(m[1])]
  );
  return rows[0]?.teacher_id ?? null;
}
