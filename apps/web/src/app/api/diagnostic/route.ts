import { randomBytes, createHash } from "node:crypto";
import { faker } from "@faker-js/faker";
import { pool } from "@thuong-ielts/db";
import { NextResponse } from "next/server";
import {
  exam,
  grade,
  normalize,
  publicPaper,
  type Exam,
} from "../../../features/diagnostic/server/scoring";
import { checkProfile } from "../../../features/diagnostic/domain/profile";
import { RULES_VERSION } from "../../../features/diagnostic/domain/rules";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const demoProfiles = {
  foundation: {
    label: "4.5",
    target: "5.5",
    purpose: "Nộp thi đại học",
    level: "Chưa học IELTS, nền tảng tiếng Anh còn yếu",
    examTiming: "Trong 3–6 tháng",
    dailyMinutes: 30,
    correctRate: 45,
  },
  intermediate: {
    label: "5.5",
    target: "6.5",
    purpose: "Đi du học",
    level: "Đang học IELTS, chưa có điểm thi",
    examTiming: "Trong 1–3 tháng",
    dailyMinutes: 45,
    correctRate: 62,
  },
  advanced: {
    label: "6.5",
    target: "7.0",
    purpose: "Đi xin việc",
    level: "Đã có điểm IELTS",
    examTiming: "Sau hơn 6 tháng",
    dailyMinutes: 60,
    correctRate: 80,
  },
} as const;
type DemoPreset = keyof typeof demoProfiles;
const vietnameseSurnames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Võ"];
const vietnameseMiddleNames = ["Minh", "Thanh", "Gia", "Khánh", "Bảo", "Ngọc"];
const vietnameseGivenNames = ["Anh", "Hân", "Nam", "Vy", "Khoa", "Linh"];
function randomDemoProfile(preset: DemoPreset) {
  const { correctRate: _, label, ...details } = demoProfiles[preset];
  const name = `${faker.helpers.arrayElement(vietnameseSurnames)} ${faker.helpers.arrayElement(vietnameseMiddleNames)} ${faker.helpers.arrayElement(vietnameseGivenNames)}`;
  return {
    ...details,
    name: `${name} · Demo ${label}`,
    email: faker.internet.exampleEmail(),
    phone: "",
    ieltsScore: preset === "advanced" ? label : "",
    ieltsDate: "",
    examMonth: "",
    consent: true,
    contactOptIn: false,
  };
}
function demoAnswers(preset: DemoPreset) {
  const { correctRate } = demoProfiles[preset];
  return Object.fromEntries(
    exam.questions.map((question, index) => {
      // Leave a varied, realistic mix of strengths and mistakes for every section.
      const correct =
        (index * 17 + question.id.charCodeAt(0)) % 100 < correctRate;
      if (correct) return [question.id, question.accepted[0]];
      const incorrect = question.options.find(
        (option) =>
          !question.accepted.some(
            (answer) => normalize(answer) === normalize(option.value),
          ),
      );
      return [
        question.id,
        incorrect?.value ?? `demo-${question.id.toLowerCase()}`,
      ];
    }),
  );
}
export async function GET() {
  return json(publicPaper(exam));
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (
        new URL(origin).host !==
        (request.headers.get("host") ?? new URL(request.url).host)
      )
        return json({ error: "Yêu cầu không hợp lệ." }, 403);
    } catch {
      return json({ error: "Yêu cầu không hợp lệ." }, 403);
    }
  }
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 200000) return json({ error: "Dữ liệu quá lớn." }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Dữ liệu không hợp lệ." }, 400);
  }
  const editor =
    typeof body.editor === "string" ? body.editor.slice(0, 80) : "";
  if (!editor) return json({ error: "Thiếu mã phiên trình duyệt." }, 400);
  let client;
  try {
    client = await pool.connect();
  } catch {
    return json(
      { error: "Chưa kết nối được nơi lưu bài. Vui lòng thử lại." },
      503,
    );
  }
  try {
    await client.query("BEGIN");
    let token =
      request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
    if (body.action === "demo") {
      if (process.env.NODE_ENV !== "development") {
        await client.query("ROLLBACK");
        return json({ error: "Không tìm thấy lượt làm bài." }, 404);
      }
      const preset = (
        typeof body.preset === "string" &&
        Object.hasOwn(demoProfiles, body.preset)
          ? body.preset
          : "intermediate"
      ) as DemoPreset;
      const profile = randomDemoProfile(preset);
      const answers = demoAnswers(preset);
      const result = grade(answers, exam);
      // Giữ token do trình duyệt sinh, y như nhánh "start": nếu server tự đặt
      // token khác thì mọi lời gọi sau đó (progress, resume) trỏ vào hư không.
      if (!/^[a-f0-9]{64}$/.test(token))
        token = randomBytes(32).toString("hex");
      await client.query(
        `INSERT INTO diagnostic_attempts(token_hash,version,exam,profile,answers,workspace,result,submitted_at,editor,editor_until,rules_version) VALUES($1,$2,$3,$4,$5,$6,$7,now(),$8,now(),$9) ON CONFLICT DO NOTHING`,
        [
          hash(token),
          exam.version,
          JSON.stringify(exam),
          JSON.stringify(profile),
          JSON.stringify(answers),
          JSON.stringify({}),
          JSON.stringify(result),
          editor,
          RULES_VERSION,
        ],
      );
    }
    if (body.action === "start") {
      // Luật kiểm tra dùng chung với form, xem `domain/profile.ts`.
      const checked = checkProfile(body.profile);
      if (!checked.ok) {
        await client.query("ROLLBACK");
        return json({ error: checked.error }, 400);
      }
      const profile = checked.profile;
      // A browser-generated random token makes retries idempotent if the start response is lost.
      if (!/^[a-f0-9]{64}$/.test(token))
        token = randomBytes(32).toString("hex");
      await client.query(
        `INSERT INTO diagnostic_attempts(token_hash,version,exam,profile,editor,editor_until) VALUES($1,$2,$3,$4,$5,now()+interval '15 seconds') ON CONFLICT DO NOTHING`,
        [
          hash(token),
          exam.version,
          JSON.stringify(exam),
          JSON.stringify(profile),
          editor,
        ],
      );
    }
    if (!/^[a-f0-9]{64}$/.test(token)) {
      await client.query("ROLLBACK");
      return json({ error: "Không tìm thấy lượt làm bài." }, 401);
    }
    const found = await client.query(
      `SELECT *,GREATEST(0,EXTRACT(EPOCH FROM(expires_at-now()))) AS remaining, editor_until>now() AS lease FROM diagnostic_attempts WHERE token_hash=$1 FOR UPDATE`,
      [hash(token)],
    );
    if (!found.rows.length) {
      await client.query("ROLLBACK");
      return json({ error: "Không tìm thấy lượt làm bài." }, 404);
    }
    const row = found.rows[0];
    const source = row.exam as Exam;
    let remaining = Number(row.remaining);
    const locked = !!row.lease && row.editor !== editor && !row.submitted_at;
    if (locked && body.action !== "resume") {
      await client.query("ROLLBACK");
      return json({ error: "Bài đang được mở trong một tab khác." }, 409);
    }
    if (!row.submitted_at && !locked) {
      if (remaining > 0 && ["save", "submit"].includes(body.action)) {
        const valid: Record<string, string> = {};
        for (const q of source.questions) {
          const a = body.answers?.[q.id];
          if (
            typeof a === "string" &&
            a.length <= 150 &&
            (!q.options.length ||
              q.options.some((o) => o.value === a) ||
              a === "")
          )
            valid[q.id] = a;
        }
        row.answers = valid;
        row.workspace =
          body.workspace && typeof body.workspace === "object"
            ? body.workspace
            : row.workspace;
        await client.query(
          "UPDATE diagnostic_attempts SET answers=$2,workspace=$3,updated_at=now() WHERE token_hash=$1",
          [
            hash(token),
            JSON.stringify(row.answers),
            JSON.stringify(row.workspace),
          ],
        );
      }
      if (remaining <= 0 || body.action === "submit") {
        row.result = grade(row.answers, source);
        row.auto_submitted = remaining <= 0;
        row.submitted_at = new Date().toISOString();
        row.rules_version = RULES_VERSION;
        await client.query(
          "UPDATE diagnostic_attempts SET result=$2,submitted_at=now(),auto_submitted=$3,rules_version=$4 WHERE token_hash=$1",
          [
            hash(token),
            JSON.stringify(row.result),
            row.auto_submitted,
            RULES_VERSION,
          ],
        );
      } else
        await client.query(
          `UPDATE diagnostic_attempts SET editor=$2,editor_until=now()+interval '15 seconds' WHERE token_hash=$1`,
          [hash(token), editor],
        );
    }
    /*
      Đổi thời lượng tự học sau khi đã nộp: chỉ chạm đúng một trường của hồ sơ.
      Không cho ghi đè cả `profile` để một request không thể sửa tên, email hay
      mục tiêu của lượt làm đã chấm.
    */
    if (body.action === "study-time" && row.submitted_at) {
      const minutes = Number(body.dailyMinutes);
      if (Number.isFinite(minutes) && minutes > 0 && minutes <= 600) {
        row.profile = { ...row.profile, dailyMinutes: Math.round(minutes) };
        await client.query(
          "UPDATE diagnostic_attempts SET profile=$2 WHERE token_hash=$1",
          [hash(token), JSON.stringify(row.profile)],
        );
      }
    }
    if (body.action === "progress" && row.submitted_at) {
      const progress: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(body.progress ?? {}).slice(0, 100)) {
        if (k.length < 100 && typeof v === "boolean") progress[k] = v;
      }
      row.plan_progress = progress;
      await client.query(
        "UPDATE diagnostic_attempts SET plan_progress=$2 WHERE token_hash=$1",
        [hash(token), JSON.stringify(progress)],
      );
    }
    await client.query("COMMIT");
    return json({
      token,
      paper: publicPaper(source),
      profile: row.profile,
      answers: row.answers,
      workspace: row.workspace,
      remaining,
      submittedAt: row.submitted_at,
      autoSubmitted: row.auto_submitted,
      result: row.submitted_at ? row.result : null,
      progress: row.plan_progress,
      startedAt: row.started_at,
      /*
        Phiên bản quy tắc lúc chấm. Trang so với hằng hiện tại để nói rõ khi
        báo cáo cũ đang được đọc bằng bộ quy tắc đã đổi.
      */
      rulesVersion: row.rules_version ?? null,
      locked,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Diagnostic request failed", error);
    return json(
      {
        error:
          "Chưa lưu được bài trên hệ thống. Vui lòng thử lại; câu trả lời vẫn được giữ trên thiết bị.",
      },
      503,
    );
  } finally {
    client.release();
  }
}
