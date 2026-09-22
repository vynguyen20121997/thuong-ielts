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

export async function listTestimonials(): Promise<ExtendedTestimonialItem[]> {
  const { rows } = await pool.query(
    `SELECT id, student_name, score, before_score, after_score, school_or_job,
            course_id, course_name, comment, avatar_url,
            COALESCE(
              (SELECT array_agg('/api/media/' || tma.media_id::text ORDER BY tma.position)
               FROM testimonial_media_assets tma WHERE tma.testimonial_id = testimonials.id),
              proof_urls
            ) AS proof_urls,
            listening, reading, writing, speaking, rating, helpful_count, date
     FROM testimonials
     ORDER BY date DESC NULLS LAST`
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
        ? { listening: r.listening, reading: r.reading, writing: r.writing, speaking: r.speaking }
        : undefined,
  }));
}

export async function listFeedbacks(): Promise<FeedbackItem[]> {
  const { rows } = await pool.query(
    `SELECT id, subject,
            COALESCE(
              (SELECT array_agg('/api/media/' || fma.media_id::text ORDER BY fma.position)
               FROM feedback_media_assets fma
               WHERE fma.feedback_id = feedbacks.id),
              CASE WHEN image_url IS NOT NULL AND image_url <> '' THEN ARRAY[image_url] ELSE ARRAY[]::text[] END
            ) AS image_urls,
            date, is_class_summary
     FROM feedbacks
     ORDER BY date DESC NULLS LAST`
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
