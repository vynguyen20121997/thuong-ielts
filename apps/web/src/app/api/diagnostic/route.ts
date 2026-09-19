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
    correctRate: 45,
  },
  intermediate: {
    label: "5.5",
    target: "6.5",
    purpose: "Đi du học",
    correctRate: 62,
  },
  advanced: {
    label: "6.5",
    target: "7.0",
    purpose: "Đi xin việc",
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
      token = randomBytes(32).toString("hex");
      await client.query(
        `INSERT INTO diagnostic_attempts(token_hash,version,exam,profile,answers,workspace,result,submitted_at,editor,editor_until) VALUES($1,$2,$3,$4,$5,$6,$7,now(),$8,now())`,
        [
          hash(token),
          exam.version,
          JSON.stringify(exam),
          JSON.stringify(profile),
          JSON.stringify(answers),
          JSON.stringify({}),
          JSON.stringify(result),
          editor,
        ],
      );
    }
    if (body.action === "start") {
      const p = body.profile;
      const purposes = ["Nộp thi đại học", "Đi du học", "Đi xin việc", "Khác"];
      if (
        !p ||
        typeof p.name !== "string" ||
        !p.name.trim() ||
        typeof p.email !== "string" ||
        !/^\S+@\S+\.\S+$/.test(p.email) ||
        !p.target ||
        !purposes.includes(p.purpose)
      ) {
        await client.query("ROLLBACK");
        return json(
          { error: "Vui lòng điền đủ thông tin trước khi tiếp tục." },
          400,
        );
      }
      const profile = {
        name: p.name.trim().slice(0, 150),
        email: p.email.trim().slice(0, 254),
        target: String(p.target).slice(0, 100),
        purpose: String(p.purpose).slice(0, 100),
      };
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
        await client.query(
          "UPDATE diagnostic_attempts SET result=$2,submitted_at=now(),auto_submitted=$3 WHERE token_hash=$1",
          [hash(token), JSON.stringify(row.result), row.auto_submitted],
        );
      } else
        await client.query(
          `UPDATE diagnostic_attempts SET editor=$2,editor_until=now()+interval '15 seconds' WHERE token_hash=$1`,
          [hash(token), editor],
        );
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
