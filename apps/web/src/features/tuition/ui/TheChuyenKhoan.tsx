"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";

/*
  Thẻ chuyển khoản của một lớp.

  Ba thứ học sinh cần, theo đúng thứ tự người ta dùng:

  1. Mã QR — quét là xong, số tiền và nội dung đã điền sẵn nên không gõ nhầm.
  2. Số tài khoản + nội dung dạng chữ, mỗi thứ một nút chép. Không ai cũng
     quét được: có em chuyển từ máy tính, có em app ngân hàng không đọc QR
     ảnh chụp màn hình.
  3. Nút báo đã chuyển.

  Số tiền và nội dung KHÔNG cho sửa ở đây. Cho sửa là mở đường cho chuyển
  thiếu rồi báo đủ, mà cô thì phải ngồi dò sao kê tìm ra chênh lệch.
*/

type The = {
  classId: string;
  tenLop: string;
  hocPhi: number | null;
  ky: string | null;
  daDong: boolean;
  dangCho: boolean;
  duTaiKhoan: boolean;
  noiDung: string;
  qrSvg: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  tenNganHang: string | null;
};

const dinhDang = (v: number) => new Intl.NumberFormat("vi-VN").format(v);

function NutChep({ chu, nhan }: { chu: string; nhan: string }) {
  const [xong, setXong] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(chu);
          setXong(true);
          setTimeout(() => setXong(false), 1800);
        } catch {
          /* Trình duyệt chặn clipboard thì thôi — chữ vẫn hiện để tự bôi đen. */
        }
      }}
      aria-label={`Chép ${nhan}`}
      className="inline-flex items-center gap-1 rounded-lg border border-sage-3 px-2 py-1 text-2xs font-bold text-brand hover:bg-sage-2"
    >
      {xong ? <Check size={12} /> : <Copy size={12} />}
      {xong ? "Đã chép" : "Chép"}
    </button>
  );
}

export default function TheChuyenKhoan({ the }: { the: The }) {
  const router = useRouter();
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);
  /* Chốt chống bấm lặp phải là ref: state chỉ có hiệu lực sau lần vẽ lại. */
  const dangGuiRef = useRef(false);

  async function bao() {
    if (dangGuiRef.current) return;
    dangGuiRef.current = true;
    setDangGui(true);
    setLoi("");
    try {
      const res = await fetch("/api/hoc-phi/bao-da-chuyen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: the.classId, period: the.ky }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoi(data.error ?? "Chưa gửi được. Thử lại giúp nhé.");
        return;
      }
      router.refresh();
    } catch {
      setLoi("Mất mạng giữa chừng. Thử lại giúp nhé.");
    } finally {
      dangGuiRef.current = false;
      setDangGui(false);
    }
  }

  return (
    <section className="rounded-2xl border border-sage-3 bg-white p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-extrabold text-brand">{the.tenLop}</h2>
        {the.daDong ? (
          <span className="rounded-full bg-sage-2 px-3 py-1 text-2xs font-bold text-brand">
            Đã đóng kỳ này
          </span>
        ) : the.dangCho ? (
          <span className="rounded-full bg-warn-soft px-3 py-1 text-2xs font-bold text-warn">
            Chờ cô xác nhận
          </span>
        ) : null}
        <span className="ml-auto font-mono text-2xl font-extrabold text-ink">
          {the.hocPhi === null ? "—" : `${dinhDang(the.hocPhi)} đ`}
        </span>
      </div>

      {the.hocPhi === null && (
        <p className="mt-3 rounded-xl bg-mist-3 px-4 py-3 text-sm leading-relaxed">
          Cô chưa đặt mức học phí cho lớp này. Nhắn cô để biết số tiền trước khi
          chuyển.
        </p>
      )}

      {!the.duTaiKhoan && the.hocPhi !== null && (
        <p className="mt-3 rounded-xl bg-mist-3 px-4 py-3 text-sm leading-relaxed">
          Cô chưa khai tài khoản nhận học phí, nên chưa hiện mã chuyển khoản
          được. Nhắn cô giúp nhé.
        </p>
      )}

      {the.daDong && (
        <p className="mt-3 rounded-xl bg-sage-2 px-4 py-3 text-sm leading-relaxed text-brand">
          Kỳ này cô đã xác nhận nhận đủ. Không cần chuyển thêm.
        </p>
      )}

      {!the.daDong && the.duTaiKhoan && the.hocPhi !== null && (
        <div className="mt-5 grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)]">
          {the.qrSvg && (
            <div>
              <div
                className="rounded-xl border border-sage-3 bg-white p-2 [&>svg]:h-auto [&>svg]:w-full"
                /* SVG do `qrcode` sinh ở server từ chuỗi mình tự dựng — không
                   có dữ liệu người dùng nào chen vào được. */
                dangerouslySetInnerHTML={{ __html: the.qrSvg }}
              />
              <p className="mt-2 text-center text-2xs text-ink/65">
                Mở app ngân hàng, quét mã này
              </p>
            </div>
          )}

          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-2xs font-bold uppercase tracking-wider text-ink/65">
                Ngân hàng
              </dt>
              <dd className="mt-0.5 font-semibold">
                {the.tenNganHang ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-bold uppercase tracking-wider text-ink/65">
                Số tài khoản
              </dt>
              <dd className="mt-0.5 flex flex-wrap items-center gap-2">
                <b className="font-mono text-base tracking-wide">
                  {the.bankAccount}
                </b>
                <NutChep chu={the.bankAccount ?? ""} nhan="số tài khoản" />
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-bold uppercase tracking-wider text-ink/65">
                Chủ tài khoản
              </dt>
              <dd className="mt-0.5 font-semibold uppercase">
                {the.bankHolder}
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-bold uppercase tracking-wider text-ink/65">
                Nội dung chuyển khoản
              </dt>
              <dd className="mt-0.5 flex flex-wrap items-center gap-2">
                <b className="font-mono text-base tracking-wide">
                  {the.noiDung}
                </b>
                <NutChep chu={the.noiDung} nhan="nội dung chuyển khoản" />
              </dd>
              {/*
                Ghi rõ vì sao phải đúng nội dung: cô dò sao kê bằng mắt, một
                dòng không có nội dung là một dòng cô không biết của ai.
              */}
              <p className="mt-1 text-2xs leading-relaxed text-ink/65">
                Giữ đúng nội dung này để cô biết tiền của ai. Chuyển bằng mã QR
                thì nó tự điền.
              </p>
            </div>
          </dl>
        </div>
      )}

      {loi && (
        <p role="alert" className="mt-4 text-sm font-semibold text-warn">
          {loi}
        </p>
      )}

      {!the.daDong && the.duTaiKhoan && the.hocPhi !== null && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={bao}
            disabled={dangGui || the.dangCho}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
          >
            {the.dangCho
              ? "Đã báo, đang chờ cô"
              : dangGui
                ? "Đang gửi…"
                : "Tôi đã chuyển"}
          </button>
          <span className="text-2xs leading-relaxed text-ink/65">
            Bấm sau khi đã chuyển xong. Cô đối chiếu sao kê rồi xác nhận.
          </span>
        </div>
      )}
    </section>
  );
}
