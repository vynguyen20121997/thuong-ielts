import { randomUUID } from "crypto";

import { pool } from "@thuong-ielts/db";

import type {
  AuthProvider,
  Occupation,
  ProfileInput,
  Student,
  StudentProfile,
  StudentWithProfile,
} from "../domain/types";

/**
 * Chỗ duy nhất biết học viên được lưu ở đâu.
 *
 * Không có bảng `sessions`: phiên nằm trong JWT có chữ ký, nên mỗi lần mở
 * trang không phải hỏi DB thêm một vòng. DB chỉ giữ *danh tính* và *hồ sơ* —
 * hai thứ sống lâu hơn một phiên đăng nhập.
 */

interface StudentRow {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatar_url: string | null;
}

interface ProfileRow {
  age: number | null;
  occupation: string | null;
  target_band: string | null;
  completed_at: Date | null;
}

function toStudent(row: StudentRow): Student {
  return {
    id: row.id,
    ...(row.email ? { email: row.email } : {}),
    ...(row.phone ? { phone: row.phone } : {}),
    ...(row.name ? { name: row.name } : {}),
    ...(row.avatar_url ? { avatarUrl: row.avatar_url } : {}),
  };
}

function toProfile(row: ProfileRow | undefined): StudentProfile | null {
  if (!row) return null;
  return {
    ...(row.age ? { age: row.age } : {}),
    ...(row.occupation ? { occupation: row.occupation as Occupation } : {}),
    // NUMERIC về dạng chuỗi qua node-postgres, đổi lại thành số ở đây chứ
    // không để lọt "6.5" dạng chuỗi lên UI rồi so sánh hụt.
    ...(row.target_band ? { targetBand: Number(row.target_band) } : {}),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
  };
}

/**
 * Tìm học viên theo cách đăng nhập, hoặc tạo mới.
 *
 * Nối theo email khi provider có trả email: một em đăng nhập Google hôm nay,
 * Facebook hôm sau, vẫn phải là một người chứ không thành hai tài khoản với
 * hai lịch sử làm bài. Đăng nhập bằng số điện thoại thì nối theo số.
 */
export async function findOrCreateStudent(params: {
  provider: AuthProvider;
  providerAccountId: string;
  email?: string;
  phone?: string;
  name?: string;
  avatarUrl?: string;
}): Promise<Student> {
  const { provider, providerAccountId, email, phone, name, avatarUrl } = params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Đã từng đăng nhập bằng đúng cách này chưa?
    const linked = await client.query<StudentRow>(
      `SELECT s.id, s.email, s.phone, s.name, s.avatar_url
         FROM student_identities i
         JOIN students s ON s.id = i.student_id
        WHERE i.provider = $1 AND i.provider_account_id = $2
        LIMIT 1`,
      [provider, providerAccountId]
    );

    let student = linked.rows[0];

    // 2. Chưa, nhưng có thể là người cũ đăng nhập bằng cách khác.
    if (!student && (email || phone)) {
      const existing = await client.query<StudentRow>(
        `SELECT id, email, phone, name, avatar_url
           FROM students
          WHERE ($1::text IS NOT NULL AND email = $1)
             OR ($2::text IS NOT NULL AND phone = $2)
          LIMIT 1`,
        [email ?? null, phone ?? null]
      );
      student = existing.rows[0];
    }

    // 3. Vẫn không có thì là người mới.
    if (!student) {
      const created = await client.query<StudentRow>(
        `INSERT INTO students (id, email, phone, name, avatar_url, last_seen_at)
         VALUES ($1, $2, $3, $4, $5, now())
         RETURNING id, email, phone, name, avatar_url`,
        [randomUUID(), email ?? null, phone ?? null, name ?? null, avatarUrl ?? null]
      );
      student = created.rows[0];
    } else {
      // Bổ khuyết những gì còn trống, nhưng không ghi đè thứ đã có: tên học
      // viên tự sửa sau này không bị lần đăng nhập kế tiếp xoá mất.
      const updated = await client.query<StudentRow>(
        `UPDATE students
            SET email        = COALESCE(email, $2),
                phone        = COALESCE(phone, $3),
                name         = COALESCE(name, $4),
                avatar_url   = COALESCE(avatar_url, $5),
                last_seen_at = now(),
                updated_at   = now()
          WHERE id = $1
          RETURNING id, email, phone, name, avatar_url`,
        [student.id, email ?? null, phone ?? null, name ?? null, avatarUrl ?? null]
      );
      student = updated.rows[0];
    }

    await client.query(
      `INSERT INTO student_identities (provider, provider_account_id, student_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (provider, provider_account_id) DO NOTHING`,
      [provider, providerAccountId, student.id]
    );

    await client.query("COMMIT");
    return toStudent(student);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getStudentWithProfile(id: string): Promise<StudentWithProfile | null> {
  const { rows } = await pool.query<StudentRow & ProfileRow>(
    `SELECT s.id, s.email, s.phone, s.name, s.avatar_url,
            p.age, p.occupation, p.target_band, p.completed_at
       FROM students s
       LEFT JOIN student_profiles p ON p.student_id = s.id
      WHERE s.id = $1
      LIMIT 1`,
    [id]
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return { ...toStudent(row), profile: toProfile(row) };
}

export async function saveProfile(studentId: string, input: ProfileInput): Promise<void> {
  await pool.query(
    `INSERT INTO student_profiles
       (student_id, age, age_recorded_at, occupation, target_band, completed_at, updated_at)
     VALUES ($1, $2, current_date, $3, $4, now(), now())
     ON CONFLICT (student_id) DO UPDATE
        SET age             = EXCLUDED.age,
            age_recorded_at = EXCLUDED.age_recorded_at,
            occupation      = EXCLUDED.occupation,
            target_band     = EXCLUDED.target_band,
            completed_at    = COALESCE(student_profiles.completed_at, EXCLUDED.completed_at),
            updated_at      = now()`,
    [studentId, input.age, input.occupation, input.targetBand]
  );
}
