import { NextResponse } from "next/server";
import { pool } from "@thuong-ielts/db";

import { currentStudent } from "../../../../features/account/server/guard";
import { gradeAudioBand } from "../../../../server/speakingAudioGrader";
import type { Part } from "../../../../features/speaking/domain/types";

/**
 * Chấm một bài nói từ file thu âm (bốn tiêu chí, có Phát âm).
 *
 * Khác `/api/speaking/grade` (chấm chữ) ở hai chốt, cả hai vì mỗi lượt là một
 * lần trả tiền cho dịch vụ nghe audio:
 *
 * - Phải đăng nhập: không có danh tính thì không đếm được lượt.
 * - Tối đa `SPEAKING_AUDIO_DAILY_LIMIT` lượt/ngày mỗi học sinh (mặc định 30).
 *   Đếm cả lượt chấm hỏng — dịch vụ vẫn tính tiền phần đã nghe.
 *
 * Audio không được lưu ở đâu cả; bảng `speaking_audio_grades` chỉ giữ dấu
 * thời gian để đếm.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* 2 phút opus ~1MB; 8MB là đủ rộng cho Safari (mp4/aac) mà vẫn chặn cú gửi bừa. */
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PROMPT = 2000;
const DAILY_LIMIT = Number(process.env.SPEAKING_AUDIO_DAILY_LIMIT) || 30;
const ACCEPTED = /^audio\/(webm|ogg|mp4|mpeg|mp3|wav|x-wav|aac|flac|x-m4a)/;

export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student) {
    return NextResponse.json(
      { error: "Đăng nhập để được chấm Phát âm." },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob) || !audio.size) {
    return NextResponse.json({ error: "Thiếu file thu âm." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "File thu âm quá lớn." }, { status: 413 });
  }
  const mimeType = audio.type || "audio/webm";
  if (!ACCEPTED.test(mimeType)) {
    return NextResponse.json(
      { error: "Định dạng âm thanh không hỗ trợ." },
      { status: 415 },
    );
  }

  const prompt = String(form.get("prompt") ?? "");
  if (prompt.length > MAX_PROMPT) {
    return NextResponse.json({ error: "Nội dung quá dài." }, { status: 413 });
  }
  const partRaw = Number(form.get("part"));
  const part: Part = partRaw === 2 || partRaw === 3 ? partRaw : 1;
  const seconds = Number(form.get("durationSeconds"));
  const durationSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;

  /*
    Đếm và ghi trong một câu lệnh. Không khoá nên hai tab bấm đúng cùng lúc ở
    lượt cuối có thể lọt thêm một lượt — chấp nhận được cho một hạn mức chi
    phí, không phải chốt bảo mật. Ngày tính theo giờ Việt Nam.
  */
  const { rowCount } = await pool.query(
    `INSERT INTO speaking_audio_grades (student_id)
     SELECT $1
      WHERE (SELECT count(*) FROM speaking_audio_grades
              WHERE student_id = $1
                AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'
            ) < $2`,
    [student.id, DAILY_LIMIT],
  );
  if (!rowCount) {
    return NextResponse.json(
      {
        speaking: {
          kind: "ungraded",
          reason: `Hôm nay bạn đã chấm đủ ${DAILY_LIMIT} lượt Phát âm. Mai chấm tiếp nhé — vẫn bấm "Chấm lại" để chấm ba tiêu chí từ chữ được.`,
        },
        limited: true,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const state = await gradeAudioBand({
    questionId: String(form.get("questionId") ?? ""),
    prompt,
    part,
    durationSeconds,
    audio: Buffer.from(await audio.arrayBuffer()),
    mimeType,
  });

  return NextResponse.json(
    { speaking: state },
    { headers: { "Cache-Control": "no-store" } },
  );
}
