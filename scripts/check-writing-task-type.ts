import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });

/*
  Soát việc nhận dạng đề Writing: MỌI đề đã xuất bản phải ra một dạng cụ thể.

  "Chưa nhận ra dạng" không phải lỗi chết người, nhưng nó là mục đầu tiên học
  sinh mở ra ở màn kết quả — để trống ở đó thì cả màn trông như hỏng. Bộ luật
  nhận dạng chỉ dựa vào cụm từ cố định, nên thêm một đề dùng cách hỏi lạ là
  script này báo ngay, trước khi học sinh gặp.
*/
async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const { detectTaskType } = await import(
    "../apps/web/src/features/practice/domain/taskAnalysis"
  );

  const { rows } = await pool.query<{ id: string; prompt: string }>(
    "SELECT id, prompt FROM writing_prompts ORDER BY position",
  );

  const chua: string[] = [];
  for (const row of rows) {
    const type = detectTaskType(row.prompt);
    console.log(`${type.kind.padEnd(24)} ${row.id}`);
    if (type.kind === "unknown") chua.push(row.id);
  }

  if (chua.length) {
    console.error(
      `\nCHUA NHAN RA DANG (${chua.length}/${rows.length}): ${chua.join(", ")}\n` +
        "Them mot luat vao TASK_TYPES trong domain/taskAnalysis.ts.",
    );
    process.exit(1);
  }
  console.log(`\n${rows.length}/${rows.length} đề đều nhận ra dạng.`);
  process.exit(0);
}
void main();
