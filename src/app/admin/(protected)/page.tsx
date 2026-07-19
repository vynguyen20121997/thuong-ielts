import Link from "next/link";
import { pool } from "../../../lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { rows } = await pool.query(
    `SELECT
       (SELECT count(*) FROM testimonials)::int AS testimonials,
       (SELECT count(*) FROM feedbacks)::int AS feedbacks,
       (SELECT count(*) FROM blog_posts)::int AS blog_posts`
  );
  const counts = rows[0];

  return (
    <div>
      <h1 className="font-serif text-3xl font-black text-[#1A1A1A] mb-8">Tổng quan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          href="/admin/testimonials"
          className="block bg-white border border-black/10 rounded-2xl p-6 hover:border-[#14532D]/40 hover:shadow-sm transition-all"
        >
          <span className="font-serif text-4xl font-black text-[#14532D] block mb-2">
            {counts.testimonials}
          </span>
          <span className="text-sm font-bold text-[#1A1A1A]">Kết quả học viên</span>
          <p className="text-xs text-[#1A1A1A]/50 mt-1">Điểm số, ảnh bảng điểm, comment</p>
        </Link>

        <Link
          href="/admin/feedbacks"
          className="block bg-white border border-black/10 rounded-2xl p-6 hover:border-[#14532D]/40 hover:shadow-sm transition-all"
        >
          <span className="font-serif text-4xl font-black text-[#14532D] block mb-2">
            {counts.feedbacks}
          </span>
          <span className="text-sm font-bold text-[#1A1A1A]">Cảm nhận học viên</span>
          <p className="text-xs text-[#1A1A1A]/50 mt-1">Tiêu đề, ảnh chụp cảm nhận</p>
        </Link>

        <div className="block bg-white border border-black/10 rounded-2xl p-6 opacity-50">
          <span className="font-serif text-4xl font-black text-[#1A1A1A] block mb-2">
            {counts.blog_posts}
          </span>
          <span className="text-sm font-bold text-[#1A1A1A]">Blog</span>
          <p className="text-xs text-[#1A1A1A]/50 mt-1">Sắp ra mắt</p>
        </div>
      </div>
    </div>
  );
}
