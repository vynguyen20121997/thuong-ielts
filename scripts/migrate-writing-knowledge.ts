/**
 * Kiến thức nền cho từng đề Writing.
 *
 * Nội dung do CÔ soạn, không phải model sinh ra — Jev chỉ trả về giá trị có
 * kiểu, nó không viết được một đoạn giải thích nào. Vai của model ở đây là
 * KHỚP câu hỏi tự do của học sinh với ghi chú gần nhất; xem `matchKnowledge`
 * trong `server/typesafe.ts`.
 *
 * Chạy lại nhiều lần vẫn an toàn.
 * Usage: npx tsx scripts/migrate-writing-knowledge.ts
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
  `summary` là câu tiếng Anh mô tả ghi chú này nói về cái gì — dùng làm tiêu
  chí cho câu hỏi `choice` khi học sinh gõ câu hỏi tự do. Tách khỏi `topic`
  (tiếng Việt, hiện trên nút) vì model làm việc bằng tiếng Anh tốt hơn hẳn.
*/
const NOTES: {
  promptId: string;
  items: { id: string; topic: string; summary: string; body: string }[];
}[] = [
  {
    promptId: "w2-technology-digital-contact",
    items: [
      {
        id: "loai-cong-nghe",
        topic: "Digital technology gồm những gì?",
        summary:
          "What counts as digital technology for contact: the actual channels and tools people use to reach each other.",
        body: [
          "Đề nói “digital technology for contact” — tức là các KÊNH liên lạc, không phải công nghệ nói chung. Sáu nhóm chính:",
          "",
          "1. Nhắn tin tức thời — Zalo, Messenger, WhatsApp. Nhanh, miễn phí, nhưng là chữ.",
          "2. Gọi thoại và gọi video — Zoom, Google Meet, FaceTime. Có giọng và mặt, gần với gặp trực tiếp nhất.",
          "3. Email — chậm hơn, nhưng trang trọng và lưu lại được; vẫn là chuẩn trong công việc.",
          "4. Mạng xã hội — Facebook, Instagram, TikTok. Liên lạc “một tới nhiều”, không nhắm vào ai cụ thể.",
          "5. Nền tảng làm việc nhóm — Slack, Teams, Google Docs. Vừa nhắn vừa làm chung một tài liệu.",
          "6. Diễn đàn và cộng đồng — Reddit, nhóm Facebook, Discord. Gặp người lạ cùng mối quan tâm.",
          "",
          "Viết bài đừng gộp tất cả thành “technology”. Chọn MỘT kênh cụ thể rồi nói về nó thì ý mới sâu — ví dụ “video call” khác hẳn “nhắn tin” ở chỗ có giọng nói và nét mặt.",
        ].join("\n"),
      },
      {
        id: "to-chuc",
        topic: "“Organisations” là những ai?",
        summary:
          "Which kinds of organisations in society use digital contact, and what each of them uses it for.",
        body: [
          "Đề nhắc “people AND organisations”. Nhiều bài chỉ viết về cá nhân rồi mất nửa số ý. Các loại tổ chức và việc họ dùng:",
          "",
          "• Doanh nghiệp — họp với khách hàng và đối tác ở xa, làm việc từ xa, tuyển người ngoài thành phố.",
          "• Trường học, đại học — dạy trực tuyến, gửi bài tập, họp phụ huynh; mở lớp cho học sinh ở tỉnh xa.",
          "• Bệnh viện, phòng khám — đặt lịch, trả kết quả xét nghiệm, tư vấn từ xa (telemedicine).",
          "• Cơ quan nhà nước — dịch vụ công trực tuyến, thông báo khẩn cấp qua tin nhắn.",
          "• Tổ chức phi lợi nhuận, từ thiện — kêu gọi quyên góp, kết nối tình nguyện viên khắp nơi.",
          "• Báo chí, truyền thông — đưa tin trực tiếp, nhận phản hồi từ độc giả ngay lập tức.",
          "",
          "Một đoạn thân bài mạnh thường lấy MỘT tổ chức cụ thể làm ví dụ, chứ không nói “companies and schools” chung chung.",
        ].join("\n"),
      },
      {
        id: "nhom-nguoi",
        topic: "“People” — ai được lợi, ai chịu thiệt?",
        summary:
          "Which groups of people are most affected by digital contact, and how differently it affects each group.",
        body: [
          "Cùng một công nghệ nhưng tác động rất khác nhau tuỳ nhóm người. Đây là chỗ lấy ý dễ nhất:",
          "",
          "Được lợi rõ nhất:",
          "• Người đi làm xa nhà, lao động di cư — gặp con cái mỗi tối thay vì mỗi năm một lần.",
          "• Học sinh ở vùng xa — học được lớp mà địa phương không có.",
          "• Người khuyết tật, người đi lại khó khăn — làm việc và học mà không phải di chuyển.",
          "• Người có mối quan tâm hiếm — tìm được cộng đồng cùng sở thích dù ở đâu.",
          "",
          "Chịu thiệt hoặc bị bỏ lại:",
          "• Người già — khó dùng thiết bị, dễ bị cô lập khi mọi liên lạc chuyển lên mạng.",
          "• Người không có internet hoặc điện thoại tốt — “khoảng cách số” (digital divide).",
          "• Người đi làm bị nhắn tin ngoài giờ — không còn ranh giới nghỉ ngơi.",
          "• Trẻ em — tiếp xúc sớm với mạng xã hội, ảnh hưởng tới cách kết bạn ngoài đời.",
        ].join("\n"),
      },
      {
        id: "doi-thay",
        topic: "Trước và sau: đã đổi những gì?",
        summary:
          "How communication changed over time, and what specifically is different now compared with the past.",
        body: [
          "Bài sẽ sâu hơn nếu so được với TRƯỚC KIA. Dòng thời gian ngắn:",
          "",
          "• Thư tay — mất nhiều ngày tới nhiều tuần; liên lạc là việc phải lên kế hoạch.",
          "• Điện thoại cố định — nhanh hơn hẳn, nhưng tính tiền theo phút và phải ở đúng chỗ có máy.",
          "• Tin nhắn SMS và điện thoại di động — liên lạc theo NGƯỜI, không theo địa điểm nữa.",
          "• Internet và smartphone — chi phí gần như bằng không, không giới hạn khoảng cách.",
          "• Gọi video phổ biến, và đại dịch đẩy nhanh mọi thứ: họp, học, khám bệnh đều chuyển lên mạng trong vài tuần.",
          "",
          "Ba thứ thật sự đã đổi, dùng làm luận điểm rất tốt: KHOẢNG CÁCH không còn quyết định ai nói chuyện với ai; CHI PHÍ gần bằng không; TỐC ĐỘ từ vài ngày xuống vài giây.",
        ].join("\n"),
      },
      {
        id: "tac-dong",
        topic: "Tác động đã thấy rõ",
        summary:
          "The observed positive and negative effects of digital contact on work, study, health and relationships.",
        body: [
          "Mặt tích cực:",
          "• Làm việc từ xa — công ty tuyển được người ở bất cứ đâu; người lao động bớt thời gian đi lại.",
          "• Học từ xa — một giáo viên giỏi dạy được nhiều nơi cùng lúc.",
          "• Y tế từ xa — bệnh nhân ở xa được tư vấn mà không phải đi cả ngày đường.",
          "• Giữ quan hệ xuyên biên giới — gia đình ly tán vẫn là gia đình.",
          "• Ứng phó khẩn cấp — thông báo bão lũ tới hàng triệu người trong vài phút.",
          "",
          "Mặt tiêu cực:",
          "• Luôn phải online — tin nhắn công việc lúc nửa đêm, không còn giờ nghỉ thật.",
          "• Giao tiếp hời hợt — trăm tin nhắn ngắn thay cho một cuộc trò chuyện thật.",
          "• Hiểu lầm — chữ viết không mang theo giọng nói và nét mặt.",
          "• Cô đơn dù kết nối — nhiều bạn trên mạng nhưng ít người gặp được ngoài đời.",
          "• Tin giả lan nhanh — cùng tốc độ giúp tin thật cũng giúp tin sai.",
          "• Khoảng cách số — ai không có thiết bị thì bị bỏ ngoài lề nhiều hơn trước.",
        ].join("\n"),
      },
      {
        id: "goc-nhin",
        topic: "Vài góc nhìn để bài sâu hơn",
        summary:
          "Deeper angles and nuanced arguments about digital communication that go beyond the obvious points.",
        body: [
          "Bốn góc nhìn ít người viết, dùng để tách bài mình khỏi bài trung bình:",
          "",
          "1. Công cụ hay thói quen? Tin nhắn nửa đêm không phải lỗi của ứng dụng, mà của kỳ vọng “phải trả lời ngay”. Cùng một công cụ, công ty khác nhau dùng khác nhau.",
          "",
          "2. Thay thế hay thêm vào? Nhiều nghiên cứu về mạng xã hội tranh cãi đúng chỗ này: liên lạc số THAY THẾ gặp mặt, hay chỉ THÊM vào những lúc vốn không gặp được? Câu trả lời khác nhau thì kết luận khác hẳn.",
          "",
          "3. Ai quyết định? Người đi làm thường không được chọn có online hay không — sếp chọn. Lợi và hại phân bố không đều theo quyền lực.",
          "",
          "4. Liên lạc số không phải một thứ. Gọi video với bà khác hẳn lướt mạng xã hội. Gộp chung rồi khen hoặc chê cả cụm là chỗ khiến nhiều bài mắc kẹt ở mức trung bình.",
        ].join("\n"),
      },
    ],
  },
];

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS writing_prompt_knowledge (
      id          TEXT NOT NULL,
      prompt_id   TEXT NOT NULL REFERENCES writing_prompts(id) ON DELETE CASCADE,
      topic       TEXT NOT NULL,
      summary     TEXT NOT NULL DEFAULT '',
      body        TEXT NOT NULL,
      position    INTEGER NOT NULL DEFAULT 100,
      PRIMARY KEY (prompt_id, id)
    )
  `);

  for (const group of NOTES) {
    const { rows } = await pool.query(`SELECT 1 FROM writing_prompts WHERE id = $1`, [
      group.promptId,
    ]);
    if (!rows.length) {
      console.warn(`Bỏ qua ${group.promptId}: chưa có đề này.`);
      continue;
    }

    for (const [i, it] of group.items.entries()) {
      await pool.query(
        `INSERT INTO writing_prompt_knowledge (id, prompt_id, topic, summary, body, position)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (prompt_id, id) DO UPDATE
           SET topic = EXCLUDED.topic,
               summary = EXCLUDED.summary,
               body = EXCLUDED.body,
               position = EXCLUDED.position`,
        [it.id, group.promptId, it.topic, it.summary, it.body, i],
      );
    }
    /*
      Xoá ghi chú không còn trong danh sách. Bản đầu soạn nhầm thành kiến thức
      TIẾNG ANH (từ vựng, cấu trúc câu); đề bài cần kiến thức về CHỦ ĐỀ. Chỉ
      upsert thì năm mục cũ nằm lại trong DB và vẫn hiện cho học sinh.
    */
    const { rowCount } = await pool.query(
      `DELETE FROM writing_prompt_knowledge WHERE prompt_id = $1 AND NOT (id = ANY($2::text[]))`,
      [group.promptId, group.items.map((x) => x.id)],
    );
    console.log(
      `${group.promptId}: ${group.items.length} ghi chú kiến thức nền` +
        (rowCount ? `, xoá ${rowCount} mục cũ.` : "."),
    );
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
