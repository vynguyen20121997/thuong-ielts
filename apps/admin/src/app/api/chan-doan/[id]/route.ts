import { NextResponse } from "next/server";
import { pool } from "@thuong-ielts/db";
import {
  exam,
  grade,
  mismatchedAnswerIds,
  RULES_VERSION,
  type Exam,
} from "@thuong-ielts/diagnostic";

import { teacherHienTai } from "../../../../lib/phien";

type Params = { params: Promise<{ id: string }> };

const doiDiem = (
  truoc: Record<string, number> | null,
  sau: Record<string, number>,
) =>
  ["Listening", "Reading", "Grammar"].some(
    (s) => (truoc?.[s] ?? null) !== sau[s],
  );

/**
 * Một lượt làm bài: hồ sơ, điểm hiện tại và toàn bộ lịch sử chấm lại.
 *
 * Không trả `exam` hay `answer_key` — cô cần biết ai, điểm bao nhiêu và đã chấm
 * lại mấy lần, chứ không cần cả đề đi qua mạng mỗi lần mở bảng.
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  await teacherHienTai();

  const { rows } = await pool.query(
    `SELECT token_hash, profile, version, rules_version, started_at, submitted_at,
            auto_submitted, result -> 'scores' AS diem, result -> 'blanks' AS bo_trong
       FROM diagnostic_attempts WHERE token_hash = $1 LIMIT 1`,
    [id],
  );
  if (!rows.length)
    return NextResponse.json({ error: "Không tìm thấy lượt làm" }, { status: 404 });

  const { rows: lichSu } = await pool.query(
    `SELECT id, at, teacher, reason, from_exam_version, to_exam_version,
            from_rules_version, to_rules_version, from_scores, to_scores
       FROM diagnostic_regrades WHERE token_hash = $1 ORDER BY at DESC`,
    [id],
  );

  const a = rows[0];
  return NextResponse.json({
    id: a.token_hash,
    hoSo: a.profile,
    batDau: a.started_at,
    nopLuc: a.submitted_at,
    tuNop: a.auto_submitted,
    diem: a.diem,
    boTrong: a.bo_trong,
    phienBanDe: a.version,
    phienBanQuyTac: a.rules_version,
    deHienHanh: exam.version,
    quyTacHienHanh: RULES_VERSION,
    lichSu: lichSu.map((r) => ({
      id: Number(r.id),
      luc: r.at,
      giaoVien: r.teacher,
      lyDo: r.reason,
      deTruoc: r.from_exam_version,
      deSau: r.to_exam_version,
      quyTacTruoc: r.from_rules_version,
      quyTacSau: r.to_rules_version,
      diemTruoc: r.from_scores,
      diemSau: r.to_scores,
    })),
  });
}

/**
 * Chấm lại một lượt bằng ĐỀ HIỆN HÀNH.
 *
 * Đây là thao tác duy nhất được phép đổi kết quả đã trả cho học sinh. Vì vậy:
 *
 * 1. Bắt buộc có lý do. Không cho chấm lại "cho chắc" mà nửa năm sau không ai
 *    nhớ vì sao điểm của em này khác báo cáo em đã tải về.
 * 2. Ghi lịch sử TRƯỚC khi ghi đè, trong cùng một transaction, kèm bản kết quả
 *    cũ nguyên vẹn — chấm lại mà mất bản cũ thì không còn đường đối chiếu.
 * 3. Đáp án của học sinh không bị đụng tới: chấm lại là áp đề mới lên đúng
 *    những gì em ấy đã gõ, không phải sửa bài hộ.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const teacher = await teacherHienTai();

  let body: { reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5)
    return NextResponse.json(
      { error: "Ghi lý do chấm lại (ít nhất 5 ký tự) để còn đối chiếu về sau." },
      { status: 400 },
    );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT token_hash, answers, result, version, rules_version, submitted_at
         FROM diagnostic_attempts WHERE token_hash = $1 FOR UPDATE`,
      [id],
    );
    if (!rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Không tìm thấy lượt làm" }, { status: 404 });
    }
    const luot = rows[0];
    if (!luot.submitted_at) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Lượt này chưa nộp bài nên chưa có gì để chấm lại." },
        { status: 409 },
      );
    }

    /*
      Chặn trước khi ghi đè: đề hiện hành phải còn nhận ra bài của em này.
      `grade()` tra đáp án theo id câu, nên nếu đề mới đánh lại id thì mọi câu
      thành "chưa trả lời" và điểm về 0 — mà vẫn ghi đè êm ru. Thà không chấm
      lại được còn hơn xoá mất một kết quả đúng.
    */
    const answers: Record<string, string> = luot.answers ?? {};
    const daTraLoi = Object.keys(answers).filter((k) => answers[k]?.trim());
    const lac = mismatchedAnswerIds(answers, exam as Exam);
    if (daTraLoi.length && lac.length > daTraLoi.length * 0.1) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error: `Đề hiện hành không khớp bài làm này: ${lac.length}/${daTraLoi.length} câu không còn mã cũ (${lac.slice(0, 5).join(", ")}…). Chưa chấm lại và chưa đổi gì.`,
        },
        { status: 409 },
      );
    }

    /*
      Bấm đúp hoặc mạng chậm rồi bấm lại không được đẻ ra hai dòng lịch sử y
      hệt. `FOR UPDATE` ở trên đã xếp hàng hai request, nên chỉ cần nhìn bản ghi
      gần nhất: cùng cô, cùng lý do, trong vòng 10 giây thì coi như một lần bấm.
      Cùng tinh thần với luật "bấm nộp nhiều lần không tạo nhiều kết quả".
    */
    const { rows: vuaGhi } = await client.query(
      `SELECT from_scores, to_scores FROM diagnostic_regrades
        WHERE token_hash = $1 AND teacher = $2 AND reason = $3
          AND at > now() - interval '10 seconds'
        ORDER BY at DESC LIMIT 1`,
      [id, teacher, reason.slice(0, 500)],
    );
    if (vuaGhi.length) {
      await client.query("COMMIT");
      return NextResponse.json({
        diemTruoc: vuaGhi[0].from_scores,
        diemSau: vuaGhi[0].to_scores,
        doiDiem: doiDiem(vuaGhi[0].from_scores, vuaGhi[0].to_scores),
        cauLac: [],
        trungLap: true,
      });
    }

    const ketQuaMoi = grade(answers, exam as Exam);
    const diemCu = luot.result?.scores ?? null;

    await client.query(
      `INSERT INTO diagnostic_regrades
         (token_hash, teacher, reason, from_exam_version, to_exam_version,
          from_rules_version, to_rules_version, from_scores, to_scores, from_result)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        teacher,
        reason.slice(0, 500),
        luot.version,
        exam.version,
        luot.rules_version,
        RULES_VERSION,
        JSON.stringify(diemCu),
        JSON.stringify(ketQuaMoi.scores),
        JSON.stringify(luot.result),
      ],
    );
    await client.query(
      `UPDATE diagnostic_attempts
          SET result = $2, exam = $3, version = $4, rules_version = $5
        WHERE token_hash = $1`,
      [
        id,
        JSON.stringify(ketQuaMoi),
        JSON.stringify(exam),
        exam.version,
        RULES_VERSION,
      ],
    );
    await client.query("COMMIT");

    return NextResponse.json({
      diemTruoc: diemCu,
      diemSau: ketQuaMoi.scores,
      doiDiem: doiDiem(diemCu, ketQuaMoi.scores),
      /* Vài câu lạc mã thì vẫn chấm, nhưng phải nói ra để cô còn soi lại. */
      cauLac: lac,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Chấm lại thất bại", error);
    return NextResponse.json({ error: "Chấm lại thất bại, chưa đổi gì." }, { status: 500 });
  } finally {
    client.release();
  }
}
