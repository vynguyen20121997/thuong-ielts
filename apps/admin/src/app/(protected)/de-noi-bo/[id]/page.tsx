import Link from "next/link";
import { notFound } from "next/navigation";

import { docDeNoiBo, docDeWritingNoiBo } from "../../../../lib/deNoiBo";
import { laDeWriting } from "../../../../lib/deNoiBoKieu";
import { teacherHienTai } from "../../../../lib/phien";
import SoanDeNoiBo from "./SoanDeNoiBo";
import SoanDeWriting from "./SoanDeWriting";

export const dynamic = "force-dynamic";

export default async function TrangSoanDeNoiBo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacherId = await teacherHienTai();

  // Id đề Writing mang tiền tố `wn-`; còn lại là đề Reading.
  if (laDeWriting(id)) {
    const de = await docDeWritingNoiBo(teacherId, id);
    if (!de) notFound();
    const { soBaiNop, ...banDau } = de;
    return (
      <div>
        <DuongDan ten={de.title} />
        <SoanDeWriting id={id} banDau={banDau} soBaiNop={soBaiNop} />
      </div>
    );
  }

  const doc = await docDeNoiBo(teacherId, id);
  if (!doc) notFound();
  return (
    <div>
      <DuongDan ten={doc.de.title} />
      {doc.choDuyet && (
        <p role="note" className="mb-5 rounded-2xl border border-[#B45309]/30 bg-[#FDF6EE] px-5 py-4 text-sm text-[#7C3A06]">
          <b>Đề này do AI agent soạn và CHƯA giao được.</b> Đọc lại từng đáp án — đáp án sai là chấm sai
          cả lớp. Xem xong bấm <b>Lưu đề</b> để duyệt.
        </p>
      )}
      <SoanDeNoiBo id={id} banDau={doc.de} />
    </div>
  );
}

function DuongDan({ ten }: { ten: string }) {
  return (
    <nav className="mb-4 text-sm text-[#1A1A1A]/55" aria-label="Đường dẫn">
      <Link href="/de-noi-bo" className="hover:text-[#14532D]">Đề nội bộ</Link>
      <span className="mx-2">»</span>
      <span className="text-[#1A1A1A]">{ten}</span>
    </nav>
  );
}
