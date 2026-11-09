import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { duocXem, timBaiGiaoTheoToken } from "@thuong-ielts/db";

import { currentStudent, requireStudentOrGuest } from "../../../../../../features/account/server/guard";
import { khachHienTai } from "../../../../../../features/account/server/khach";
import { baiNopCua, deCuaBaiGiao } from "../../../../../../features/practice/server/writingAssignment";
import VietBaiGiao from "../../../../../../features/practice/ui/VietBaiGiao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bài Writing cô giao | ThuongHo.Class", robots: { index: false } };

/**
 * Viết bài Writing cô giao qua link.
 *
 * Đã nộp thì hiện lại bài + band (nếu cô cho xem) KỂ CẢ khi buổi đã đóng —
 * em ấy có quyền xem bài của chính mình. Vì thế kiểm "đã nộp chưa" TRƯỚC
 * `requireStudentOrGuest`, chốt đó đá người vào link đã đóng về `/vao`.
 */
export default async function TrangVietBaiGiao({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const bai = await timBaiGiaoTheoToken(token);
  if (!bai || bai.skill !== "writing") notFound();
  const de = await deCuaBaiGiao(bai);
  if (!de) notFound();

  const student = await currentStudent();
  const khach = student ? null : await khachHienTai();
  const daNop = await baiNopCua(bai.id, {
    studentId: student?.id ?? null,
    guestKey: khach?.key ?? null,
    guestName: khach?.ten ?? null,
  });

  if (!daNop) await requireStudentOrGuest(`/phong-luyen-tap/writing/bai/${token}`, token);

  return (
    <main className="relative z-10 min-h-screen bg-white pb-16 pt-24">
      <VietBaiGiao
        token={token}
        tieuDe={bai.label || de.title}
        task={de.task}
        deBai={daNop?.promptText ?? de.prompt}
        minWords={de.minWords}
        phut={Math.round(de.durationSeconds / 60)}
        daNop={daNop ? { essay: daNop.essay, words: daNop.words } : null}
        choXemBand={duocXem(bai).diem}
      />
    </main>
  );
}
