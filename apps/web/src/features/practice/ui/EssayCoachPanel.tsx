"use client";

import { useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Languages,
  Lightbulb,
  Lock,
  Type,
} from "lucide-react";

import type { Idea } from "../domain/writingCoach";
import type { PromptAnalysis } from "../domain/taskAnalysis";
import type { EssayIssue, SentenceUpgrade } from "../application/essayPorts";

/*
  Năm mục quanh bảng điểm Writing, theo bản mẫu cô gửi: Phân tích đề, Idea
  Development, Grammar Enhancement, Useful Vocabulary, Sample Essay.

  ## Mục nào lấy dữ liệu ở đâu

    Phân tích đề        luật thuần, `domain/taskAnalysis.ts` — luôn có
    Idea Development    `writing_prompt_ideas`, cô soạn — có với đề đã soạn
    Useful Vocabulary   bộ thẻ `vocab_decks` cùng chủ đề — có khi chủ đề khớp
    Grammar Enhancement cần model sinh văn bản — CHƯA nối
    Sample Essay        cần model sinh văn bản — CHƯA nối

  ## Vì sao không làm nút "Mở khoá" như bản mẫu

  Bản mẫu là trang có thu phí, nút đó dẫn tới thanh toán. Trang này không thu
  phí, nên một nút "Mở khoá ngay" bấm vào không mở gì cả chỉ là lừa. Mục chưa
  có nội dung thì nói thẳng là chưa có và vì sao.
*/

export type CoachData = {
  analysis: PromptAnalysis;
  ideas: Idea[];
  knowledge: { id: string; topic: string; summary: string; body: string }[];
  vocabulary: {
    word: string;
    ipa?: string;
    meaning: string;
    example: string;
  }[];
  issues: EssayIssue[] | null;
  upgrades: SentenceUpgrade[] | null;
  sample: string | null;
  coachAvailable: boolean;
};

type SectionId = "analysis" | "ideas" | "grammar" | "vocab" | "sample";

const SECTIONS: { id: SectionId; label: string; Icon: typeof ClipboardList }[] =
  [
    { id: "analysis", label: "Phân tích đề", Icon: ClipboardList },
    { id: "ideas", label: "Idea Development", Icon: Lightbulb },
    { id: "grammar", label: "Grammar Enhancement", Icon: Languages },
    { id: "vocab", label: "Useful Vocabulary", Icon: Type },
    { id: "sample", label: "Sample Essay", Icon: BarChart3 },
  ];

function NotWired({ what, why }: { what: string; why: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-dashed border-sage-3 bg-mist-3 px-5 py-6">
      <Lock size={18} className="mt-0.5 shrink-0 text-ink/35" />
      <div>
        <p className="text-sm font-bold text-ink/80">{what} chưa dùng được</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/60">{why}</p>
      </div>
    </div>
  );
}

export default function EssayCoachPanel({ data }: { data: CoachData }) {
  const [section, setSection] = useState<SectionId>("analysis");
  const { analysis } = data;

  return (
    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <nav
        aria-label="Mục hướng dẫn"
        className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"
      >
        {SECTIONS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={section === id}
            onClick={() => setSection(id)}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition-colors ${
              section === id
                ? "border-brand bg-sage-2 text-brand"
                : "border-transparent text-ink/70 hover:bg-mist-3"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                section === id ? "bg-brand text-white" : "bg-mist text-ink/50"
              }`}
            >
              <Icon size={15} />
            </span>
            {label}
          </button>
        ))}
      </nav>

      <div className="min-w-0">
        {section === "analysis" && (
          <div className="flex flex-col gap-4">
            <section className="rounded-2xl border border-sage-3 bg-white p-5">
              <p className="text-2xs font-extrabold uppercase tracking-wider text-ink/45">
                Dạng đề
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-brand">
                {analysis.type.label}
              </h3>
              <p className="mt-3 text-2xs font-extrabold uppercase tracking-wider text-ink/45">
                Bài phải có đủ
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {analysis.type.mustCover.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl border-l-[3px] border-warn bg-warn-soft px-4 py-3 text-sm leading-relaxed">
                <b className="text-warn">Bẫy hay gặp: </b>
                {analysis.type.trap}
              </p>
            </section>

            <section className="rounded-2xl border border-sage-3 bg-white p-5">
              <p className="text-2xs font-extrabold uppercase tracking-wider text-ink/45">
                Từng yêu cầu của đề
              </p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
                {analysis.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
              {analysis.keyPhrases.length > 0 && (
                <>
                  <p className="mt-4 text-2xs font-extrabold uppercase tracking-wider text-ink/45">
                    Từ khoá — phải nhắc lại trong bài, bằng cách diễn đạt khác
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {analysis.keyPhrases.map((w) => (
                      <span
                        key={w}
                        className="rounded-full bg-sage-2 px-2.5 py-1 text-2xs font-bold text-brand"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {section === "ideas" && (
          <div className="flex flex-col gap-4">
            {data.ideas.length === 0 ? (
              <NotWired
                what="Idea Development cho đề này"
                why="Cô chưa soạn ngân hàng ý cho đề này. Những đề đã soạn thì mục này có sẵn luận điểm hai phía, câu mở, câu giải thích và câu ví dụ."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {data.ideas.map((idea) => (
                  <li
                    key={idea.id}
                    className="rounded-2xl border border-sage-3 bg-white p-5"
                  >
                    <p className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-2xs font-extrabold ${
                          idea.side === "pos"
                            ? "bg-sage-2 text-brand"
                            : "bg-warn-soft text-warn"
                        }`}
                      >
                        {idea.side === "pos" ? "ỦNG HỘ" : "PHẢN ĐỐI"}
                      </span>
                      <b className="text-[15px]">{idea.label}</b>
                    </p>
                    <dl className="mt-3 grid gap-2.5 text-sm leading-relaxed">
                      <div>
                        <dt className="text-2xs font-bold text-ink/50">
                          Point — câu mở ý
                        </dt>
                        <dd className="mt-0.5">{idea.starter}</dd>
                      </div>
                      <div>
                        <dt className="text-2xs font-bold text-ink/50">
                          Explain — giải thích
                        </dt>
                        <dd className="mt-0.5">{idea.explain}</dd>
                      </div>
                      <div>
                        <dt className="text-2xs font-bold text-ink/50">
                          Example — ví dụ
                        </dt>
                        <dd className="mt-0.5">{idea.example}</dd>
                      </div>
                    </dl>
                    {idea.questions.length > 0 && (
                      <div className="mt-3 rounded-xl bg-mist-3 px-4 py-3">
                        <p className="text-2xs font-bold text-ink/55">
                          Tự hỏi để ý thành của mình
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-relaxed text-ink/75">
                          {idea.questions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {data.knowledge.length > 0 && (
              <section className="rounded-2xl border border-sage-3 bg-white p-5">
                <p className="text-2xs font-extrabold uppercase tracking-wider text-ink/45">
                  Kiến thức nền cho chủ đề này
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {data.knowledge.map((k) => (
                    <li key={k.id}>
                      <details className="rounded-xl bg-mist-3 px-4 py-3">
                        <summary className="cursor-pointer text-sm font-bold text-brand">
                          {k.topic}
                        </summary>
                        <p className="mt-1 text-sm leading-relaxed text-ink/70">
                          {k.summary}
                        </p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                          {k.body}
                        </p>
                      </details>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {section === "grammar" &&
          (data.upgrades?.length ? (
            <ul className="flex flex-col gap-3">
              {data.upgrades.map((u, i) => (
                <li
                  key={i}
                  className="rounded-2xl border border-sage-3 bg-white p-5"
                >
                  <p className="text-2xs font-bold text-ink/50">Câu của bạn</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/70">
                    {u.original}
                  </p>
                  <p className="mt-3 text-2xs font-bold text-brand-soft">
                    Nâng cấp · {u.technique}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed">
                    {u.upgraded}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <NotWired
              what="Grammar Enhancement"
              why="Mục này lấy chính câu bạn viết rồi đặt cạnh bản nâng cấp (mệnh đề phân từ, đảo ngữ…). Nó cần một model SINH ra câu mới, mà model đang dùng chỉ chấm điểm chứ không viết được chữ nào."
            />
          ))}

        {section === "vocab" &&
          (data.vocabulary.length ? (
            <ul className="flex flex-col gap-2.5">
              {data.vocabulary.map((v) => (
                <li
                  key={v.word}
                  className="rounded-2xl border border-sage-3 bg-white p-4"
                >
                  <p className="flex flex-wrap items-baseline gap-2">
                    <b className="text-[15px]">{v.word}</b>
                    {v.ipa && (
                      <span className="font-mono text-2xs text-ink/50">
                        {v.ipa}
                      </span>
                    )}
                    <span className="ml-auto text-sm text-ink/70">
                      {v.meaning}
                    </span>
                  </p>
                  {v.example && (
                    <p className="mt-1.5 border-l-2 border-sage-3 pl-3 text-sm italic leading-relaxed text-ink/60">
                      {v.example}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <NotWired
              what="Useful Vocabulary cho chủ đề này"
              why="Từ gợi ý lấy từ chính bộ thẻ từ vựng cô soạn, để gặp lại ở đây là củng cố thứ bạn đang học chứ không phải học thêm một danh sách rời. Chưa có bộ thẻ nào cùng chủ đề với đề này."
            />
          ))}

        {section === "sample" &&
          (data.sample ? (
            <article className="rounded-2xl border border-sage-3 bg-white p-6 text-sm leading-[1.85]">
              {data.sample.split(/\n+/).map((p, i) => (
                <p key={i} className="mt-4 first:mt-0">
                  {p}
                </p>
              ))}
            </article>
          ) : (
            <NotWired
              what="Sample Essay"
              why="Bài mẫu viết theo đúng đề này cần một model sinh văn bản, hoặc một bài cô viết sẵn lưu vào đề. Cả hai đều chưa có — và một bài mẫu bịa ra thì các em học theo văn của máy."
            />
          ))}
      </div>
    </div>
  );
}
