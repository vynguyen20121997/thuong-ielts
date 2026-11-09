"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Save, Send, Trash2 } from "lucide-react";

import {
  DANG_CAU,
  DUNG_DS_CHUNG,
  cauMoi,
  luaChonCoDinh,
  nhomMoi,
  tachDong,
  type CauSoan,
  type DangCau,
  type DeSoan,
  type NhomSoan,
} from "../../../../lib/deNoiBoKieu";

const o = "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm focus:border-[#14532D] focus:outline-none";
const nhanO = "flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]";

/**
 * Soạn đề nội bộ. Giữ TOÀN BỘ đề trong state rồi lưu một lần — đúng như DB
 * lưu đề thành một tài liệu JSONB đọc/ghi trọn vẹn. Lưu từng câu một thì một
 * lần mất mạng giữa chừng là đề nửa cũ nửa mới, đánh số câu lệch.
 */
export default function SoanDeNoiBo({ id, banDau }: { id: string; banDau: DeSoan }) {
  const router = useRouter();
  const [de, setDe] = useState<DeSoan>(banDau);
  const [thongBao, setThongBao] = useState<{ loai: "ok" | "loi"; chu: string } | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [thayDoi, setThayDoi] = useState(false);
  const khoa = useRef(false);
  const [dangMoi, setDangMoi] = useState<DangCau>("gap-fill");

  const sua = (patch: Partial<DeSoan>) => {
    setDe((d) => ({ ...d, ...patch }));
    setThayDoi(true);
  };
  const suaNhom = (gi: number, patch: Partial<NhomSoan>) =>
    sua({ groups: de.groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)) });
  const suaCau = (gi: number, ci: number, patch: Partial<CauSoan>) =>
    suaNhom(gi, { questions: de.groups[gi].questions.map((c, i) => (i === ci ? { ...c, ...patch } : c)) });

  async function luu() {
    if (khoa.current) return;
    khoa.current = true;
    setDangLuu(true);
    setThongBao(null);
    try {
      const res = await fetch("/api/de-noi-bo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, de }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setThongBao({ loai: "loi", chu: data.error ?? "Không lưu được." });
        return;
      }
      setThayDoi(false);
      setThongBao({ loai: "ok", chu: "Đã lưu. Đề sẵn sàng để giao." });
      router.refresh();
    } catch {
      setThongBao({ loai: "loi", chu: "Mất mạng giữa chừng. Thử lại giúp cô." });
    } finally {
      khoa.current = false;
      setDangLuu(false);
    }
  }

  async function xoa() {
    if (!confirm("Xoá hẳn đề này? Không khôi phục được.")) return;
    const res = await fetch("/api/de-noi-bo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return setThongBao({ loai: "loi", chu: data.error ?? "Không xoá được." });
    router.push("/de-noi-bo");
    router.refresh();
  }

  // Đánh số câu liền mạch qua các nhóm — đúng như lúc lưu.
  let dem = 0;
  const batDau = de.groups.map((g) => {
    const s = dem + 1;
    dem += g.questions.length;
    return s;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Thông tin chung */}
      <section className="rounded-2xl border border-black/10 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr_120px]">
          <label className={nhanO}>
            Mã đề
            <input value={de.code} onChange={(e) => sua({ code: e.target.value })} className={`${o} font-mono uppercase`} />
          </label>
          <label className={nhanO}>
            Tên đề
            <input value={de.title} onChange={(e) => sua({ title: e.target.value })} className={o} />
          </label>
          <label className={nhanO}>
            Phút
            <input type="number" min={1} max={180} value={de.minutes} onChange={(e) => sua({ minutes: Number(e.target.value) })} className={o} />
          </label>
          <label className={`${nhanO} sm:col-span-3`}>
            Mô tả <span className="font-normal text-[#1A1A1A]/50">— chỉ cô thấy</span>
            <input value={de.description} onChange={(e) => sua({ description: e.target.value })} className={o} />
          </label>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        {/* Bài đọc */}
        <section className="rounded-2xl border border-black/10 bg-white p-5 xl:sticky xl:top-20">
          <h2 className="mb-4 text-lg font-bold text-[#1A1A1A]">Bài đọc / đoạn hướng dẫn</h2>
          <div className="flex flex-col gap-4">
            <label className={nhanO}>
              Tiêu đề bài đọc
              <input value={de.passageTitle} onChange={(e) => sua({ passageTitle: e.target.value })} placeholder="Để trống thì lấy tên đề" className={o} />
            </label>
            <label className={nhanO}>
              Nội dung
              <span className="text-xs font-normal text-[#1A1A1A]/55">
                Cách đoạn bằng một dòng trống. Đề từ vựng/ngữ pháp thì dán bảng từ (word bank) vào đây.
              </span>
              <textarea value={de.passageText} onChange={(e) => sua({ passageText: e.target.value })} rows={16} className={`${o} leading-relaxed`} />
            </label>
            <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
              <input type="checkbox" checked={de.labelParagraphs} onChange={(e) => sua({ labelParagraphs: e.target.checked })} />
              Đánh chữ A, B, C… cho từng đoạn <span className="text-[#1A1A1A]/55">(cần cho dạng nối tiêu đề / đoạn chứa thông tin)</span>
            </label>
          </div>
        </section>

        {/* Nhóm câu */}
        <section className="flex flex-col gap-4">
          {de.groups.map((g, gi) => (
            <NhomCau
              key={gi}
              g={g}
              soDau={batDau[gi]}
              soNhom={de.groups.length}
              gi={gi}
              suaNhom={(p) => suaNhom(gi, p)}
              suaCau={(ci, p) => suaCau(gi, ci, p)}
              doiCho={(huong) => {
                const j = gi + huong;
                const groups = [...de.groups];
                [groups[gi], groups[j]] = [groups[j], groups[gi]];
                sua({ groups });
              }}
              xoaNhom={() => confirm("Xoá cả nhóm câu này?") && sua({ groups: de.groups.filter((_, i) => i !== gi) })}
            />
          ))}

          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-[#14532D]/30 bg-white p-4">
            <label className={`${nhanO} min-w-56 flex-1`}>
              Thêm nhóm câu
              <select value={dangMoi} onChange={(e) => setDangMoi(e.target.value as DangCau)} className={o}>
                {DANG_CAU.map((d) => (
                  <option key={d.id} value={d.id}>{d.nhan}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => sua({ groups: [...de.groups, nhomMoi(dangMoi)] })}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#9FE870] px-4 text-sm font-bold text-[#052E16] hover:bg-[#86D65A]"
            >
              <Plus size={16} aria-hidden /> Thêm nhóm
            </button>
          </div>
        </section>
      </div>

      {/* Thanh lưu dính đáy */}
      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <span className="text-sm text-[#1A1A1A]/65">
          <b className="font-mono text-[#1A1A1A]">{dem}</b> câu · {de.groups.length} nhóm
          {thayDoi && <span className="ml-2 font-semibold text-[#B45309]">· chưa lưu</span>}
        </span>
        {thongBao && (
          <span role="status" className={`text-sm font-semibold ${thongBao.loai === "ok" ? "text-[#14532D]" : "text-red-600"}`}>
            {thongBao.chu}
          </span>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" onClick={xoa} className="flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50">
            <Trash2 size={16} aria-hidden /> Xoá đề
          </button>
          {!thayDoi && dem > 0 && (
            <Link href="/lop/giao" className="flex items-center gap-1.5 rounded-full border border-[#14532D]/30 px-4 py-2.5 text-sm font-bold text-[#14532D] hover:bg-[#F3F4EF]">
              <Send size={16} aria-hidden /> Giao bài
            </Link>
          )}
          <button
            type="button"
            onClick={luu}
            disabled={dangLuu}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052E16] disabled:opacity-60"
          >
            <Save size={16} aria-hidden /> {dangLuu ? "Đang lưu…" : "Lưu đề"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NhomCau({
  g, gi, soDau, soNhom, suaNhom, suaCau, doiCho, xoaNhom,
}: {
  g: NhomSoan;
  gi: number;
  soDau: number;
  soNhom: number;
  suaNhom: (p: Partial<NhomSoan>) => void;
  suaCau: (ci: number, p: Partial<CauSoan>) => void;
  doiCho: (huong: -1 | 1) => void;
  xoaNhom: () => void;
}) {
  const dang = DANG_CAU.find((d) => d.id === g.type);
  const coDinh = luaChonCoDinh(g.type);
  const chung = DUNG_DS_CHUNG.includes(g.type);
  const dsChung = g.options.map((x) => x.trim()).filter(Boolean);
  const nutIcon = "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#1A1A1A]/60 hover:bg-black/5 disabled:opacity-30";

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-lg bg-[#14532D] px-2.5 py-1 text-xs font-bold text-white">
          Câu {soDau}{g.questions.length > 1 ? `–${soDau + g.questions.length - 1}` : ""}
        </span>
        <b className="text-sm text-[#1A1A1A]">{dang?.nhan}</b>
        <div className="ml-auto flex">
          <button type="button" className={nutIcon} disabled={gi === 0} onClick={() => doiCho(-1)} aria-label="Đưa nhóm lên"><ArrowUp size={16} /></button>
          <button type="button" className={nutIcon} disabled={gi === soNhom - 1} onClick={() => doiCho(1)} aria-label="Đưa nhóm xuống"><ArrowDown size={16} /></button>
          <button type="button" className={`${nutIcon} hover:!bg-red-50 hover:text-red-600`} onClick={xoaNhom} aria-label="Xoá nhóm"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className={nhanO}>
          Hướng dẫn cho học sinh
          <textarea value={g.instruction} onChange={(e) => suaNhom({ instruction: e.target.value })} rows={2} className={o} />
        </label>

        {g.type === "gap-fill" && (
          <label className={`${nhanO} max-w-48`}>
            Tối đa số từ mỗi chỗ trống
            <input type="number" min={1} max={5} value={g.maxWords} onChange={(e) => suaNhom({ maxWords: Number(e.target.value) })} className={o} />
          </label>
        )}

        {chung && (
          <label className={nhanO}>
            Danh sách lựa chọn chung <span className="text-xs font-normal text-[#1A1A1A]/55">— mỗi dòng một mục, vd. “i. The start of the project” hoặc “A”</span>
            <textarea
              value={g.options.join("\n")}
              onChange={(e) => suaNhom({ options: e.target.value.split("\n") })}
              rows={4}
              className={`${o} font-mono text-xs`}
            />
          </label>
        )}

        <ol className="flex flex-col gap-3">
          {g.questions.map((c, ci) => {
            const so = soDau + ci;
            const luaChon = coDinh ?? (chung ? dsChung : tachDong(c.options.join("\n")));
            return (
              <li key={ci} className="rounded-xl bg-[#F3F4EF] p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-2 w-7 shrink-0 font-mono text-sm font-bold text-[#14532D]">{so}.</span>
                  <div className="flex flex-1 flex-col gap-2">
                    <textarea
                      value={c.prompt}
                      onChange={(e) => suaCau(ci, { prompt: e.target.value })}
                      rows={2}
                      placeholder={
                        g.type === "gap-fill"
                          ? "vd. Japan offers excellent ___ in the technology industry."
                          : g.type === "matching-headings"
                            ? "vd. Paragraph A"
                            : "Nội dung câu hỏi"
                      }
                      aria-label={`Nội dung câu ${so}`}
                      className={o}
                    />
                    {g.type === "multiple-choice" && (
                      <textarea
                        value={c.options.join("\n")}
                        onChange={(e) => suaCau(ci, { options: e.target.value.split("\n") })}
                        rows={4}
                        aria-label={`Lựa chọn câu ${so}, mỗi dòng một lựa chọn`}
                        className={`${o} text-xs`}
                      />
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {g.type === "gap-fill" ? (
                        <>
                          <input value={c.answer} onChange={(e) => suaCau(ci, { answer: e.target.value })} placeholder="Đáp án" aria-label={`Đáp án câu ${so}`} className={o} />
                          <input
                            value={c.acceptable.join(" / ")}
                            onChange={(e) => suaCau(ci, { acceptable: e.target.value.split("/").map((x) => x.trim()) })}
                            placeholder="Cách viết khác, cách nhau bằng /"
                            aria-label={`Đáp án chấp nhận khác câu ${so}`}
                            className={o}
                          />
                        </>
                      ) : (
                        <select value={c.answer} onChange={(e) => suaCau(ci, { answer: e.target.value })} aria-label={`Đáp án câu ${so}`} className={`${o} sm:col-span-2`}>
                          <option value="">— Chọn đáp án đúng —</option>
                          {luaChon.map((x) => (
                            <option key={x} value={x}>{x}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <input value={c.explanation} onChange={(e) => suaCau(ci, { explanation: e.target.value })} placeholder="Giải thích (không bắt buộc)" aria-label={`Giải thích câu ${so}`} className={`${o} text-xs`} />
                  </div>
                  <button
                    type="button"
                    onClick={() => suaNhom({ questions: g.questions.filter((_, i) => i !== ci) })}
                    disabled={g.questions.length === 1}
                    aria-label={`Xoá câu ${so}`}
                    className={nutIcon}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={() => suaNhom({ questions: [...g.questions, cauMoi(g.type)] })}
          className="flex cursor-pointer items-center gap-1.5 self-start rounded-full px-3 py-2 text-sm font-bold text-[#14532D] hover:bg-[#F3F4EF]"
        >
          <Plus size={16} aria-hidden /> Thêm câu
        </button>
      </div>
    </div>
  );
}
