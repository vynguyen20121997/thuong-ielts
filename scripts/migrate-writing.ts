/**
 * Bảng đề Writing Task 2 + nạp bộ đề đầu tiên.
 *
 * Chạy lại nhiều lần vẫn an toàn: `CREATE TABLE IF NOT EXISTS` và `ON CONFLICT
 * DO UPDATE` theo `id` do mình đặt tay.
 *
 * Usage: npx tsx scripts/migrate-writing.ts
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
  Chỉ Task 2. Task 1 Academic cần biểu đồ, mà model chấm nháp chỉ đọc được văn
  bản — đưa Task 1 vào là hứa một thứ không chấm nổi. Task 1 General (viết thư)
  thì chấm được, nhưng bộ tiêu chí khác hẳn, để một đợt riêng.

  `topic` để sau này lọc theo chủ đề; `prompt` giữ nguyên văn đề, không rút gọn,
  vì câu hỏi "có viết đúng đề không" chấm chính trên chuỗi này.
*/
type PromptSeed = {
  id: string;
  topic: string;
  title: string;
  prompt: string;
  position?: number;
  /*
    Sáu đề bên dưới là đề TÔI tự soạn lúc dựng màn hình, không phải đề của cô.
    Để `false` nên chúng nằm trong bảng mà không hiện ra cho học sinh — bật lại
    chỉ cần đổi cờ này rồi chạy lại script. Nội dung đề là việc của cô, không
    phải của người viết code.
  */
  published?: boolean;
};

const PROMPTS: PromptSeed[] = [
  {
    id: "w2-technology-digital-contact",
    topic: "Technology",
    title: "Liên lạc bằng công nghệ số",
    position: 0,
    /*
      Đề của cô, chép NGUYÊN VĂN kể cả phần hướng dẫn ("You should spend about
      40 minutes…", "Write at least 250 words"). Không rút gọn: câu hỏi chấm
      nháp "có viết đúng đề không" so trực tiếp trên chuỗi này, và học sinh cũng
      nên đọc đúng thứ họ sẽ gặp trong phòng thi.
    */
    prompt: [
      "You should spend about 40 minutes on this task. Write about the following topic:",
      "In recent years, more and more people and organisations are using digital technology for contact with other people. Do you think this has been a positive or negative development?",
      "Give reasons for your answer and include any relevant examples from your own knowledge or experience.",
      "Write at least 250 words.",
    ].join(`

`),
  },
  {
    id: "w2-education-free-university",
    published: false,
    topic: "Education",
    title: "Học đại học miễn phí",
    prompt:
      "Some people think that university education should be free for all students. Others believe that students should pay for their own tuition. Discuss both views and give your own opinion.",
  },
  {
    id: "w2-environment-individual-vs-government",
    published: false,
    topic: "Environment",
    title: "Trách nhiệm môi trường",
    prompt:
      "Some people believe that environmental problems are too big for individuals to solve, and that only governments and large companies can make a difference. To what extent do you agree or disagree?",
  },
  {
    id: "w2-technology-remote-work",
    published: false,
    topic: "Technology & Work",
    title: "Làm việc từ xa",
    prompt:
      "An increasing number of people now work from home rather than in an office. Do the advantages of this development outweigh the disadvantages?",
  },
  {
    id: "w2-health-sugar-tax",
    published: false,
    topic: "Health",
    title: "Đánh thuế đồ ngọt",
    prompt:
      "Some governments have introduced a tax on foods and drinks that are high in sugar, in order to improve public health. Do you think this is an effective solution, or are there better ways to tackle the problem?",
  },
  {
    id: "w2-society-elderly-care",
    published: false,
    topic: "Society",
    title: "Chăm sóc người già",
    prompt:
      "In many countries, the population is getting older, and caring for elderly people is becoming a serious challenge. What problems does an ageing population cause, and what measures could be taken to address them?",
  },
  {
    id: "w2-media-news-social-platforms",
    published: false,
    topic: "Media",
    title: "Đọc tin trên mạng xã hội",
    prompt:
      "More and more people get their news from social media rather than from traditional newspapers and television. Is this a positive or a negative development?",
  },
];

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS writing_prompts (
      id          TEXT PRIMARY KEY,
      task        SMALLINT NOT NULL DEFAULT 2,
      topic       TEXT NOT NULL,
      title       TEXT NOT NULL,
      prompt      TEXT NOT NULL,
      /* Ẩn đề khỏi danh sách mà không xoá dữ liệu lượt làm bài đã trỏ vào nó. */
      published   BOOLEAN NOT NULL DEFAULT TRUE,
      /* Thứ tự do cô xếp. Nhỏ hơn thì lên trước; mặc định 100 để đề thêm sau
         rơi xuống cuối mà không phải đánh số lại cả bảng. */
      position    INTEGER NOT NULL DEFAULT 100,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  /* Bảng đã tạo từ lần chạy trước thì chưa có cột này. */
  await pool.query(
    `ALTER TABLE writing_prompts ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 100`,
  );

  /*
    Đề Writing nội bộ: `owner_id` = cô soạn ra nó. NULL = kho chung (trang luyện
    Writing công khai chỉ đọc đề NULL).

    KHÔNG dùng ON DELETE SET NULL như `reading_tests.owner_id`: SET NULL nghĩa
    là xoá cô thì đề nội bộ thành đề công khai. Để mặc định (chặn xoá) thì xoá
    giáo viên còn đề phải xử lý đề trước — ồn ào nhưng không lộ.
  */
  await pool.query(`ALTER TABLE writing_prompts ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES teachers (id)`);
  /* Đề nội bộ tự đặt mức chữ và thời gian; NULL = chuẩn Task 2 (250 từ, 40 phút). */
  await pool.query(`ALTER TABLE writing_prompts ADD COLUMN IF NOT EXISTS min_words INTEGER`);
  await pool.query(`ALTER TABLE writing_prompts ADD COLUMN IF NOT EXISTS duration_seconds INTEGER`);
  await pool.query(`ALTER TABLE writing_prompts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_writing_prompts_owner ON writing_prompts (owner_id)`);

  /*
    Bài viết học sinh nộp qua link cô giao.

    Trước bảng này Writing không lưu gì: chấm band xong là mất. `prompt_text`
    chụp nguyên đề lúc nộp — cô sửa đề sau đó thì bài cũ vẫn đọc đúng đề em ấy
    đã làm. `result` để NULL lúc nộp và điền sau: bộ chấm chờ tới 25 giây, nên
    chấm là một bước riêng NGOÀI transaction (xem CLAUDE.md, Section 4).
  */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS writing_submissions (
      id             TEXT PRIMARY KEY,
      assignment_id  TEXT REFERENCES assignments (id) ON DELETE SET NULL,
      prompt_id      TEXT NOT NULL REFERENCES writing_prompts (id),
      prompt_text    TEXT NOT NULL,
      student_id     TEXT REFERENCES students (id) ON DELETE CASCADE,
      guest_name     TEXT,
      guest_key      TEXT,
      essay          TEXT NOT NULL,
      words          INTEGER NOT NULL,
      elapsed_seconds INTEGER NOT NULL DEFAULT 0,
      result         JSONB,
      submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      graded_at      TIMESTAMPTZ,
      CHECK (student_id IS NOT NULL OR guest_key IS NOT NULL)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_writing_submissions_assignment ON writing_submissions (assignment_id, submitted_at)`);

  for (const p of PROMPTS) {
    await pool.query(
      `INSERT INTO writing_prompts (id, task, topic, title, prompt, position, published)
       VALUES ($1, 2, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
         SET topic = EXCLUDED.topic,
             title = EXCLUDED.title,
             prompt = EXCLUDED.prompt,
             position = EXCLUDED.position,
             published = EXCLUDED.published`,
      [p.id, p.topic, p.title, p.prompt, p.position ?? 100, p.published ?? true],
    );
  }

  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM writing_prompts WHERE published AND owner_id IS NULL`,
  );
  console.log(`writing_prompts: ${rows[0].n} đề đang mở.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
