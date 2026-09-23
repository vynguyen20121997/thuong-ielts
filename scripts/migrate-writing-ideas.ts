/**
 * Ngân hàng ý cho từng đề Writing + nạp bộ ý đầu tiên.
 *
 * Đây là phần CÔ SOẠN, không phải máy nghĩ ra. Máy chỉ đọc bài để biết ý nào
 * đã dùng rồi chọn trong bảng này ý nào còn gợi được — xem `writingCoach.ts`.
 *
 * Chạy lại nhiều lần vẫn an toàn.
 * Usage: npx tsx scripts/migrate-writing-ideas.ts
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

/*
  `side` = ý này thuộc phe nào của đề.

  Cần nó vì hai bước khác nhau lấy ý từ hai phe: thân bài lấy ý CÙNG phe với
  quan điểm học sinh, còn đoạn phản biện lấy ý phe ĐỐI LẬP. Không có cột này
  thì không phân biệt được "gợi thêm lý do" với "gợi mặt trái".

  `probe` là câu tiếng Anh gửi cho Jev để hỏi bài đã phát triển ý này chưa —
  tách khỏi `label` (tiếng Việt, hiện cho học sinh) vì hai thứ phục vụ hai
  người đọc khác nhau.

  Ba câu mẫu cho ba phần của một đoạn thân bài: `starter` (câu chủ đề),
  `frameExplain` (giải thích), `frameExample` (ví dụ).

  Bản đầu để chỗ trống `___` cho học sinh tự điền, với lý do: đưa câu dùng
  được ngay thì em chép, và bài thành của máy. Cô yêu cầu viết đủ câu, nên giờ
  là câu hoàn chỉnh — đổi lại phải xác định rõ đây là câu MẪU để học sinh đọc
  rồi viết lại bằng chuyện của mình, không phải câu để nộp. Ai soạn đề sau nhớ
  giữ đúng tinh thần đó: câu cụ thể, có chi tiết thật, để em thấy một câu đạt
  trông thế nào — chứ không phải câu chung chung ai điền vào cũng vừa.
*/
const IDEAS: {
  promptId: string;
  items: {
    id: string;
    side: "pos" | "neg";
    label: string;
    probe: string;
    questions: string[];
    /* Ba câu mẫu — xem chú thích trên. */
    starter: string;
    frameExplain: string;
    frameExample: string;
  }[];
}[] = [
  {
    promptId: "w2-technology-digital-contact",
    items: [
      {
        id: "reach",
        side: "pos",
        label: "Tầm với",
        probe:
          "The essay argues that digital technology lets people reach others they could not reach before — across distance, borders, or social barriers.",
        starter:
          "One clear benefit is reach: people can now work and study with colleagues, teachers and relatives who live on the other side of the world.",
        frameExplain:
          "This matters because distance used to decide who you could learn from or work with, and arranging a single conversation could take a week of travel.",
        frameExample:
          "For instance, a small company in Da Nang can now meet a client in Berlin on a video call the same afternoon, something that once required a flight.",
        questions: [
          "Ai mà trước đây em không thể gặp, giờ gặp được?",
          "Kể một lần cụ thể — ở đâu, khi nào, chuyện gì xảy ra.",
        ],
      },
      {
        id: "speed",
        side: "pos",
        label: "Tốc độ",
        probe:
          "The essay argues that digital contact makes communication faster — things that used to take days now take minutes.",
        starter:
          "Digital contact is also far faster: messages that once took days to arrive now reach people in seconds.",
        frameExplain:
          "This matters because decisions no longer wait for the next meeting or the next postal delivery, so problems are solved while they are still small.",
        frameExample:
          "For instance, hospitals in Vietnam now send test results through messaging apps, so a patient learns the outcome in minutes instead of travelling back to the clinic.",
        questions: [
          "Việc gì trước đây mất nhiều ngày, giờ mất vài phút?",
          "Em từng chứng kiến điều đó ở đâu — trường, nhà, chỗ làm?",
        ],
      },
      {
        id: "cost",
        side: "pos",
        label: "Chi phí",
        probe:
          "The essay argues that digital contact is cheaper, so people who could not afford to stay in touch now can.",
        starter:
          "Cost matters too: staying in touch has become almost free, so people who could never afford it are no longer cut off.",
        frameExplain:
          "This matters because contact used to be a luxury priced by the minute, and the people who needed it most were usually the ones who could least afford it.",
        frameExample:
          "For instance, a worker abroad who once paid for one short call a month can now see her children every evening for nothing.",
        questions: [
          "Ai từng không liên lạc được vì quá đắt?",
          "Công nghệ đổi điều đó thế nào cho họ?",
        ],
      },
      {
        id: "shallow",
        side: "neg",
        label: "Mất kết nối thật",
        probe:
          "The essay argues that digital contact replaces deep face-to-face relationships with shallow or superficial interaction.",
        starter:
          "The first cost is depth: constant digital contact has replaced a few long conversations with a stream of short messages.",
        frameExplain:
          "This matters because real understanding is built through unhurried attention, and a hundred notifications a day leave no room for it.",
        frameExample:
          "For instance, families now sit at the same dinner table while each person talks to somebody who is somewhere else.",
        questions: [
          "Bữa cơm nào trong nhà em ai cũng cầm điện thoại?",
          "Lần nói chuyện thật, không màn hình, gần nhất là khi nào?",
        ],
      },
      {
        id: "always",
        side: "neg",
        label: "Luôn phải online",
        probe:
          "The essay argues that constant connectivity blurs the line between work and rest, so people feel unable to disconnect.",
        starter:
          "Constant connection also has a price: the line between work and rest has almost disappeared.",
        frameExplain:
          "This matters because nobody recovers properly if they are never fully off duty, and the pressure to reply is strongest for those with the least power to refuse.",
        frameExample:
          "For instance, many employees report work messages arriving at midnight and feel unable to ignore them until morning.",
        questions: [
          "Ai trong nhà em không dám tắt máy vì sợ lỡ tin nhắn?",
          "Tin nhắn công việc lúc mấy giờ thì là quá muộn?",
        ],
      },
      {
        id: "tone",
        side: "neg",
        label: "Chữ không có giọng",
        probe:
          "The essay argues that text-based contact loses tone, body language or nuance, causing misunderstanding.",
        starter:
          "Text carries no tone, so written messages are far easier to misread than spoken words.",
        frameExplain:
          "This matters because much of what we mean travels through voice and expression, and writing strips both of them away.",
        frameExample:
          "For instance, a short reply meant as a joke can read as anger, and a misunderstanding that a face would have prevented takes days to repair.",
        questions: [
          "Một lần em hiểu lầm ai đó chỉ vì đọc tin nhắn?",
          "Điều gì trong giọng nói mà chữ viết không mang theo được?",
        ],
      },
    ],
  },
];

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS writing_prompt_ideas (
      id          TEXT NOT NULL,
      prompt_id   TEXT NOT NULL REFERENCES writing_prompts(id) ON DELETE CASCADE,
      side        TEXT NOT NULL CHECK (side IN ('pos','neg')),
      label       TEXT NOT NULL,
      probe       TEXT NOT NULL,
      starter        TEXT NOT NULL DEFAULT '',
      frame_explain  TEXT NOT NULL DEFAULT '',
      frame_example  TEXT NOT NULL DEFAULT '',
      questions   JSONB NOT NULL DEFAULT '[]'::jsonb,
      position    INTEGER NOT NULL DEFAULT 100,
      PRIMARY KEY (prompt_id, id)
    )
  `);

  /* Bảng đã tạo từ lần chạy trước thì chưa có mấy cột này. */
  for (const col of ["starter", "frame_explain", "frame_example"]) {
    await pool.query(
      `ALTER TABLE writing_prompt_ideas ADD COLUMN IF NOT EXISTS ${col} TEXT NOT NULL DEFAULT ''`,
    );
  }

  for (const group of IDEAS) {
    const { rows } = await pool.query(`SELECT 1 FROM writing_prompts WHERE id = $1`, [
      group.promptId,
    ]);
    if (!rows.length) {
      console.warn(`Bỏ qua ${group.promptId}: chưa có đề này trong writing_prompts.`);
      continue;
    }

    for (const [i, it] of group.items.entries()) {
      await pool.query(
        `INSERT INTO writing_prompt_ideas
           (id, prompt_id, side, label, probe, starter, frame_explain, frame_example, questions, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
         ON CONFLICT (prompt_id, id) DO UPDATE
           SET side = EXCLUDED.side,
               label = EXCLUDED.label,
               probe = EXCLUDED.probe,
               starter = EXCLUDED.starter,
               frame_explain = EXCLUDED.frame_explain,
               frame_example = EXCLUDED.frame_example,
               questions = EXCLUDED.questions,
               position = EXCLUDED.position`,
        [
          it.id,
          group.promptId,
          it.side,
          it.label,
          it.probe,
          it.starter,
          it.frameExplain,
          it.frameExample,
          JSON.stringify(it.questions),
          i,
        ],
      );
    }
    console.log(`${group.promptId}: ${group.items.length} ý.`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
