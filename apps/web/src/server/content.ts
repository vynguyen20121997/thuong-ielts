import { pool, toDisplayDate } from "@thuong-ielts/db";

import type { ExtendedTestimonialItem } from "../data/testimonialsData";
import type { FeedbackItem } from "../data/feedbackData";

/*
  Truy vấn cho hai trang nội dung (kết quả học viên, cảm nhận học viên).

  Tách ra khỏi hai `route.ts` trong `app/api` vì giờ có HAI nơi cần đúng dữ
  liệu này: route API (cho client và trang quản trị) và chính
  trang — trang phải có sẵn dữ liệu lúc render, xem chú thích trong `page.tsx`.
  Chép SQL sang hai chỗ thì sẽ có ngày một chỗ thêm cột mà chỗ kia không biết.
*/

/*
  Ảnh của mỗi mục gom bằng MỘT lần quét bảng phụ, không phải mỗi dòng một lần.

  Bản trước viết `(SELECT array_agg(...) FROM ... WHERE ... = testimonials.id)`
  ngay trong danh sách cột — đọc thì gọn, nhưng đó là subquery tương quan: kế
  hoạch chạy thật cho thấy `loops=124`, tức bảng phụ bị quét lại 124 lần cho
  một lần gọi hàm. Trên máy dev, `pg_stat_user_tables` đếm được 101.028 lượt
  quét tuần tự đọc 11,8 TRIỆU dòng từ một bảng chỉ có 119 dòng.

  Gộp trước rồi `LEFT JOIN` thì bảng phụ quét đúng một lần: đo bằng
  `EXPLAIN ANALYZE` là 2,73ms → 0,65ms và 283 → 34 buffer cho cùng kết quả.
  Khoảng cách này giãn ra theo số học viên, nên càng về sau càng đáng.

  Đừng đổi ngược lại thành subquery trong danh sách cột vì thấy nó ngắn hơn.
*/
export async function listTestimonials(): Promise<ExtendedTestimonialItem[]> {
  const { rows } = await pool.query(
    `SELECT t.id, t.student_name, t.score, t.before_score, t.after_score,
            t.school_or_job, t.course_id, t.course_name, t.comment, t.avatar_url,
            COALESCE(m.urls, t.proof_urls) AS proof_urls,
            t.listening, t.reading, t.writing, t.speaking,
            t.rating, t.helpful_count, t.date
     FROM testimonials t
     LEFT JOIN (
       SELECT testimonial_id,
              array_agg('/api/media/' || media_id::text ORDER BY position) AS urls
         FROM testimonial_media_assets
        GROUP BY testimonial_id
     ) m ON m.testimonial_id = t.id
     ORDER BY t.date DESC NULLS LAST`,
  );

  return rows.map((r) => ({
    id: r.id,
    studentName: r.student_name,
    score: r.score,
    beforeScore: r.before_score ?? undefined,
    afterScore: r.after_score ?? undefined,
    schoolOrJob: r.school_or_job ?? "",
    courseId: r.course_id ?? "",
    courseName: r.course_name ?? "",
    comment: r.comment ?? undefined,
    avatarUrl: r.avatar_url ?? "",
    proofUrl: r.proof_urls?.length ? r.proof_urls : undefined,
    date: toDisplayDate(r.date),
    rating: r.rating ?? 0,
    helpfulCount: r.helpful_count ?? 0,
    subScores:
      r.listening && r.reading && r.writing && r.speaking
        ? {
            listening: r.listening,
            reading: r.reading,
            writing: r.writing,
            speaking: r.speaking,
          }
        : undefined,
  }));
}

export async function listFeedbacks(): Promise<FeedbackItem[]> {
  const { rows } = await pool.query(
    `SELECT f.id, f.subject,
            COALESCE(
              m.urls,
              CASE WHEN f.image_url IS NOT NULL AND f.image_url <> ''
                   THEN ARRAY[f.image_url] ELSE ARRAY[]::text[] END
            ) AS image_urls,
            f.date, f.is_class_summary
     FROM feedbacks f
     LEFT JOIN (
       SELECT feedback_id,
              array_agg('/api/media/' || media_id::text ORDER BY position) AS urls
         FROM feedback_media_assets
        GROUP BY feedback_id
     ) m ON m.feedback_id = f.id
     ORDER BY f.date DESC NULLS LAST`,
  );

  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    imageUrl: r.image_urls?.[0] ?? "",
    imageUrls: r.image_urls ?? [],
    date: toDisplayDate(r.date),
    isClassSummary: r.is_class_summary ?? false,
  }));
}
