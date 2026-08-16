import { pool } from "@thuong-ielts/db";

/**
 * Giáo viên — nguồn danh tính của trang quản trị.
 *
 * Trước đây đăng nhập so thẳng với ADMIN_USERNAME + ADMIN_PASSWORD_HASH. Hôm
 * nay vẫn chỉ có một người dùng, nhưng danh tính đã nằm trong DB thay vì trong
 * biến môi trường — nhờ vậy `assignments.teacher_id` và luật lọc kho đề riêng
 * có thứ để trỏ tới, và thầy cô thứ hai chỉ là một câu INSERT.
 *
 * Chưa có ở đây, và cố ý chưa có: màn tạo tài khoản, mời, phân quyền nhiều vai.
 */

export interface Teacher {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  isOwner: boolean;
}

export async function findTeacherByUsername(username: string): Promise<Teacher | null> {
  const { rows } = await pool.query(
    `SELECT id, username, password_hash, name, is_owner
       FROM teachers
      WHERE username = $1 AND is_active
      LIMIT 1`,
    [username]
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    name: row.name,
    isOwner: row.is_owner,
  };
}

/**
 * Bảng đã có ai chưa.
 *
 * Dùng để quyết định có cho phép đăng nhập bằng biến môi trường hay không:
 * bảng trống nghĩa là chưa chạy `npm run migrate` sau lần deploy này, và khoá
 * cô ra khỏi trang quản trị của chính mình vì một bước migrate còn thiếu thì
 * quá đắt. Bảng có người rồi thì DB là nguồn duy nhất, biến môi trường hết hiệu lực.
 */
export async function hasAnyTeacher(): Promise<boolean> {
  const { rows } = await pool.query(`SELECT EXISTS (SELECT 1 FROM teachers) AS co`);
  return rows[0].co === true;
}

export async function touchLastLogin(id: string): Promise<void> {
  try {
    await pool.query(`UPDATE teachers SET last_login_at = now() WHERE id = $1`, [id]);
  } catch (err) {
    // Ghi giờ đăng nhập hỏng thì không được chặn đăng nhập.
    console.error(`touchLastLogin(${id}) thất bại (bỏ qua):`, err);
  }
}
