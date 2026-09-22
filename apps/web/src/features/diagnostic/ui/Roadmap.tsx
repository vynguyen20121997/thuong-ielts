"use client";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Compass,
  Headphones,
  PenLine,
  Timer,
  Trophy,
} from "lucide-react";
import type { Profile, Report } from "../types";
import { buildRoadmap } from "../domain/roadmap";
import { RULES_VERSION } from "../domain/rules";

/*
  Tự vẽ, không dùng thư viện roadmap/diagram. Các thư viện dạng đồ thị (React
  Flow, mermaid) đòi một khung cao cố định tự cuộn/zoom bên trong — đúng thứ dự
  án đã gỡ bỏ (CLAUDE.md, mục vùng cuộn lồng nhau) — và mang bảng màu riêng,
  không dùng token trong @theme. Lộ trình ở đây là một dãy chặng nối tiếp, nên
  dải băng uốn khúc chỉ là các khung bo tròn hở một bên xếp chồng: thuần CSS,
  in ra PDF vẫn đủ chặng, không thêm byte JS nào.

  Mặc định mỗi chặng chỉ hiện số, tên, kỹ năng và số tuần. Chi tiết nằm sau một
  cú bấm — học sinh nhìn thấy cả lộ trình trước, đọc chữ sau.
*/
const ICONS: Record<string, typeof Compass> = {
  foundation: BookOpen,
  orientation: Compass,
  receptive: Headphones,
  productive: PenLine,
  fulltest: Timer,
  mock: Trophy,
};

export default function Roadmap({
  report,
  profile,
  startedAt,
  rulesVersion,
  progress,
  onProgress,
}: {
  report: Report;
  profile: Profile;
  startedAt: string;
  rulesVersion: string | null;
  progress: Record<string, boolean>;
  onProgress: (key: string, value: boolean) => void;
}) {
  const roadmap = useMemo(
    () => buildRoadmap(report, profile, new Date(startedAt)),
    [report, profile, startedAt],
  );
  const [open, setOpen] = useState<string | null>(null);
  const pct = (n: number) => Math.round(n * 100);
  const done = roadmap.phases.filter((p) => progress[`roadmap-${p.id}`]).length;
  /* Tên tháng thật, để học sinh đối chiếu ngay với lịch của mình. */
  const monthName = (offset: number) => {
    const d = new Date(startedAt);
    d.setMonth(d.getMonth() + offset - 1);
    return d.toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" });
  };

  return (
    <div className="diag-rm">
      <div className="diag-rm-hero">
        <p className="diag-rm-eyebrow">Lộ trình tới mục tiêu</p>
        <h3>
          <span>IELTS {roadmap.target || "?"}</span>
        </h3>
        <p className="diag-rm-sub-hero">
          Kế hoạch học đủ bốn kỹ năng để tới đích. Bài kiểm tra hôm nay chỉ cho
          biết điểm khởi hành: <b>{roadmap.tierLabel}</b> (đúng{" "}
          {roadmap.current.correct}/{roadmap.current.total} câu
          Listening/Reading/Grammar).
        </p>
        <ul className="diag-rm-facts">
          <li>
            <b>{roadmap.totalMonths}</b> tháng
          </li>
          <li>
            <b>{roadmap.hoursPerWeek}</b> giờ mỗi tuần
          </li>
          <li>
            <b>{roadmap.phases.length}</b> chặng
          </li>
          <li>
            thi thử <b>{roadmap.finishBy.toLocaleDateString("vi-VN")}</b>
          </li>
        </ul>
      </div>

      <div className="diag-rm-gauges">
        {roadmap.standings.map((s) => (
          <div key={s.section} className="diag-rm-gauge">
            <p>
              <span>{s.section}</span>
              <strong>
                {s.correct}
                <small>/{s.total}</small>
              </strong>
            </p>
            <div className="diag-rm-track">
              <i style={{ width: `${pct(s.ratio)}%` }} />
              <u
                style={{ left: `${pct(roadmap.needRatio)}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
        <p className="diag-rm-legend">
          Điểm khởi hành theo bài kiểm tra nền. Vạch dọc = mức nền{" "}
          {pct(roadmap.needRatio)}% nên vững trước khi dồn sức vào luyện đề cho
          mục tiêu {roadmap.target || "chưa chọn"}. Writing và Speaking không
          nằm trong bài này.
        </p>
      </div>

      <div className="diag-rm-route">
        {/*
          Dải mũi tên bậc thang: mỗi chặng một banner nối tiếp nhau, thụt dần
          xuống. Màu chạy trong họ xanh của site, đậm ở chặng đầu và sáng dần
          về đích — sáu màu cầu vồng như infographic mẫu sẽ phá tông thương
          hiệu, mà thứ tự các chặng thì một thang một màu đã nói đủ.
        */}
        <ol className="diag-rm-flow">
          {roadmap.phases.map((phase, i) => {
            const key = `roadmap-${phase.id}`;
            const checked = !!progress[key];
            const Icon = ICONS[phase.id] ?? Compass;
            const isOpen = open === phase.id;
            /* 0 ở chặng đầu → 1 ở chặng cuối; chữ đảo màu khi nền đã sáng. */
            const t =
              roadmap.phases.length > 1 ? i / (roadmap.phases.length - 1) : 0;
            const light = t > 0.62;
            return (
              <li
                key={phase.id}
                className={`diag-rm-step${checked ? " is-done" : ""}${
                  isOpen ? " is-open" : ""
                }`}
                style={
                  {
                    "--i": i,
                    "--tone": `${Math.round(t * 100)}%`,
                  } as CSSProperties
                }
                data-light={light ? "" : undefined}
                data-last={i === roadmap.phases.length - 1 ? "" : undefined}
              >
                <button
                  type="button"
                  className="diag-rm-banner"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : phase.id)}
                >
                  <span className="diag-rm-banner-top">
                    <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
                    <em>
                      {phase.startMonth === phase.endMonth
                        ? `Tháng ${phase.startMonth}`
                        : `Tháng ${phase.startMonth}–${phase.endMonth}`}
                    </em>
                  </span>
                  <b>{phase.title}</b>
                </button>

                <div className="diag-rm-step-body">
                  <p>{phase.subtitle}</p>
                  <span className="diag-rm-skills">
                    {phase.skills.map((skill) => (
                      <i key={skill}>{skill}</i>
                    ))}
                  </span>
                  <label className="diag-rm-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onProgress(key, e.target.checked)}
                    />
                    <span>Đã xong</span>
                  </label>
                </div>
              </li>
            );
          })}
        </ol>

        {/*
          Chi tiết mở ra ở NGOÀI dải, rộng cả hàng: cột của một chặng chỉ rộng
          bằng một phần sáu màn hình, nhét bốn đoạn văn vào đó thì không đọc
          được. In ra thì mở hết, không phụ thuộc chặng nào đang chọn.
        */}
        {roadmap.phases.map((phase, i) => {
          const isOpen = open === phase.id;
          return (
            <div
              key={phase.id}
              className={`diag-rm-detail${isOpen ? "" : " diag-print-only"}`}
            >
              <h4>
                Chặng {i + 1} · {phase.title}
              </h4>
              <p className="diag-rm-aim">
                <b>Đích:</b> {phase.aim}
              </p>
              <p className="diag-rm-because">
                {phase.because} Rơi vào khoảng{" "}
                {phase.startMonth === phase.endMonth
                  ? monthName(phase.startMonth)
                  : `${monthName(phase.startMonth)} – ${monthName(phase.endMonth)}`}
                .
              </p>
              {phase.areas.length > 0 && (
                <ul className="diag-rm-chips">
                  {phase.areas.map((a) => (
                    <li key={a.id} data-level={a.level}>
                      {a.name}
                      <b>
                        {a.correct}/{a.total}
                      </b>
                    </li>
                  ))}
                </ul>
              )}
              <ol className="diag-rm-steps">
                {phase.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="diag-rm-checkpoint">
                <b>Qua chặng khi:</b> {phase.checkpoint}
              </p>
            </div>
          );
        })}
      </div>

      <p className="diag-rm-progress">
        Đã xong {done}/{roadmap.phases.length} chặng.
      </p>

      <details className="diag-rm-notes">
        <summary>Đọc trước khi dùng lộ trình này</summary>
        <ul>
          {roadmap.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
          {/*
            Báo cáo cũ đọc bằng bộ quy tắc mới thì con số có thể đã khác lúc
            chấm. Nói ra, thay vì để người đọc tưởng lộ trình vẫn y nguyên.
          */}
          {rulesVersion && rulesVersion !== RULES_VERSION && (
            <li>
              Bài này được chấm theo bộ quy tắc nhận xét {rulesVersion}, hệ
              thống hiện dùng {RULES_VERSION}. Điểm và đáp án giữ nguyên, nhưng
              độ dài lộ trình và ngưỡng nhận xét có thể đã được điều chỉnh.
            </li>
          )}
        </ul>
      </details>
    </div>
  );
}
