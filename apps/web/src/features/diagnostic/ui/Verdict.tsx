"use client";
import { useMemo } from "react";
import type { Profile, Report } from "../types";
import { buildRoadmap } from "../domain/roadmap";
import { buildVerdict } from "../domain/verdict";

/*
  Tổng hợp điểm mạnh — điểm yếu, đặt ở ĐẦU tab "Nhận xét chi tiết".

  Đúng chỗ của nó là đây: tab này liệt kê đủ 16 nhóm, nhưng liệt kê đều tay thì
  chưa trả lời được câu học sinh hỏi trước nhất — mạnh nhất chỗ nào, yếu nhất
  chỗ nào. Ba dòng mỗi bên, rồi mới tới danh sách đầy đủ bên dưới.

  Vẫn cần lộ trình để biết chặng nào lo chỗ yếu, nên tự dựng lại ở đây thay vì
  kéo prop xuyên qua trang: `buildRoadmap` thuần và rẻ, còn truyền prop thì buộc
  hai tab phải biết về nhau.
*/
export default function Verdict({
  report,
  profile,
  startedAt,
}: {
  report: Report;
  profile: Profile;
  startedAt: string;
}) {
  const verdict = useMemo(
    () =>
      buildVerdict(report, buildRoadmap(report, profile, new Date(startedAt))),
    [report, profile, startedAt],
  );

  /* Chỉ để bày: điểm ba phần lấy thẳng từ `report.scores`, không tính lại. */
  const totals = { Listening: 20, Reading: 13, Grammar: 20 } as const;
  const pct = (c: number, t: number) => `${Math.round((c / t) * 100)}%`;

  return (
    <section className="diag-verdict">
      <div className="diag-verdict-top">
        <p className="diag-verdict-head">{verdict.headline}</p>
        {/*
          Ba viên kỹ năng xếp cùng thứ tự với ba cột "Chi tiết từng nhóm" ngay
          bên dưới, để mắt đi thẳng từ "hụt nhất ở Listening" xuống cột đó.
        */}
        <ul className="diag-verdict-skills">
          {(["Listening", "Reading", "Grammar"] as const).map((s) => (
            <li key={s}>
              <b>{s}</b>
              <span>
                {report.scores[s]}/{totals[s]}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="diag-verdict-cols">
        {/*
          Câu tổng so theo KỸ NĂNG, hai cột so theo NHÓM NỘI DUNG. Không ghi rõ
          thì thành mâu thuẫn trước mắt người đọc: "vững nhất ở Reading" nằm
          ngay trên một cột điểm mạnh toàn Grammar.
        */}
        <div className="diag-verdict-col" data-kind="strength">
          <h3>
            Điểm mạnh <span>giữ nhịp</span>
          </h3>
          {verdict.strengths.length ? (
            <ul>
              {verdict.strengths.map((h) => (
                <li key={h.id}>
                  <b>{h.name}</b>
                  <em>
                    {h.correct}/{h.total}
                  </em>
                  <span className="diag-verdict-track">
                    <i style={{ width: pct(h.correct, h.total) }} />
                  </span>
                  <small>{h.section}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="diag-verdict-empty">Chưa nhóm nào đúng quá 60%.</p>
          )}
        </div>
        <div className="diag-verdict-col" data-kind="gap">
          <h3>
            Cần cải thiện <span>lộ trình xử lý ở chặng nào</span>
          </h3>
          {verdict.weaknesses.length ? (
            <ul>
              {verdict.weaknesses.map((h) => (
                <li key={h.id}>
                  <b>{h.name}</b>
                  <em>
                    {h.correct}/{h.total}
                  </em>
                  <span className="diag-verdict-track">
                    <i style={{ width: pct(h.correct, h.total) }} />
                  </span>
                  {/*
                    Thứ tự dòng phụ giống hệt cột bên trái: kỹ năng trước,
                    chặng của lộ trình sau. Bản cũ đặt hai loại thông tin khác
                    nhau vào cùng một chỗ ở hai cột.
                  */}
                  <small>
                    {h.section}
                    {h.handledBy && (
                      <em className="diag-verdict-phase">→ {h.handledBy}</em>
                    )}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="diag-verdict-empty">
              Không nhóm nào rơi xuống dưới 60%.
            </p>
          )}
        </div>
      </div>
      {verdict.note && <p className="diag-verdict-note">{verdict.note}</p>}
    </section>
  );
}
