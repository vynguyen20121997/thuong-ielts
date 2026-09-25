import Link from "next/link";
import { notFound } from "next/navigation";

import {
  docDeWriting,
  kienThucCuaDe,
  yTuongCuaDe,
} from "../../../../../lib/noiDung";
import { teacherHienTai } from "../../../../../lib/phien";
import SoanDe from "./SoanDe";

export const dynamic = "force-dynamic";

/** Soạn ngân hàng ý và kiến thức nền cho một đề. */
export default async function TrangDe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await teacherHienTai();

  const [de, y, kienThuc] = await Promise.all([
    docDeWriting(id),
    yTuongCuaDe(id),
    kienThucCuaDe(id),
  ]);
  if (!de) notFound();

  return (
    <div>
      <Link
        href="/noi-dung/writing"
        className="text-xs font-bold text-[#1A1A1A]/60 hover:text-[#14532D]"
      >
        ← Tất cả đề Writing
      </Link>

      <div className="mt-2 mb-5">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">{de.title}</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Task {de.task} · {de.topic}
          {!de.published && " · chưa xuất bản"}
        </p>
      </div>

      <p className="mb-6 whitespace-pre-line rounded-2xl bg-[#EFEFEA] px-5 py-4 text-sm leading-relaxed">
        {de.prompt}
      </p>

      <SoanDe de={de} y={y} kienThuc={kienThuc} />
    </div>
  );
}
