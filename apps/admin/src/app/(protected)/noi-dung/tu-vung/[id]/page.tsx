import Link from "next/link";
import { notFound } from "next/navigation";

import { docBoThe, theCuaBo } from "../../../../../lib/noiDung";
import { teacherHienTai } from "../../../../../lib/phien";
import BangThe from "./BangThe";

export const dynamic = "force-dynamic";

/** Soạn thẻ trong một bộ. */
export default async function TrangBoThe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await teacherHienTai();

  const [bo, the] = await Promise.all([docBoThe(id), theCuaBo(id)]);
  if (!bo) notFound();

  return (
    <div>
      <Link
        href="/noi-dung/tu-vung"
        className="text-xs font-bold text-[#1A1A1A]/60 hover:text-[#14532D]"
      >
        ← Tất cả bộ thẻ
      </Link>

      <div className="mt-2 mb-6">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">{bo.name}</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          {bo.topic ? `Chủ đề ${bo.topic} · ` : ""}
          {bo.soThe} thẻ · {bo.soNguoiHoc} học viên đang ôn
        </p>
      </div>

      {bo.type !== "official" && (
        <p className="mb-6 rounded-2xl bg-[#FFFBEB] px-5 py-4 text-sm leading-relaxed text-[#B45309]">
          Đây là bộ học viên tự tạo. Cô xem được nhưng không sửa được — đồ riêng
          của các em.
        </p>
      )}

      <BangThe
        boId={bo.id}
        suaDuoc={bo.type === "official"}
        giaoCaLop={bo.giaoCaLop}
        the={the}
      />
    </div>
  );
}
