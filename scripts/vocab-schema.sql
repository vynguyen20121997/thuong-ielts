/*
  Phần học từ vựng — port từ repo `vynguyen20121997/ielts`.

  Bản gốc lưu tất cả trong MỘT file `data/db.json`. Ở đây là Postgres, theo
  đúng luật của dự án: không có nguồn sự thật nào ngoài DB. Tên bảng mang tiền
  tố `vocab_` để không đụng `assignments`/`attempts` của phần luyện đề.

  Chạy lại nhiều lần vẫn an toàn.
*/

CREATE TABLE IF NOT EXISTS vocab_decks (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT '',
  -- 'official' = bộ của cô, 'personal' = học sinh tự tạo.
  type text NOT NULL CHECK (type IN ('official', 'personal')),
  creator_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vocab_cards (
  id text PRIMARY KEY,
  deck_id text NOT NULL REFERENCES vocab_decks(id) ON DELETE CASCADE,
  word text NOT NULL,
  ipa text NOT NULL DEFAULT '',
  audio_url text,
  -- 2–3 câu ví dụ. JSONB vì số lượng không cố định và chẳng ai truy vấn lẻ từng câu.
  examples jsonb NOT NULL DEFAULT '[]',
  vietnamese text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vocab_cards_deck ON vocab_cards (deck_id, position);

/*
  Giao bộ thẻ. `student_id` NULL nghĩa là giao cho cả lớp — dự án chưa có bảng
  lớp nên tạm để `audience` mô tả, khi nào có lớp thật thì thêm `class_id`.
*/
CREATE TABLE IF NOT EXISTS vocab_assignments (
  id bigserial PRIMARY KEY,
  deck_id text NOT NULL REFERENCES vocab_decks(id) ON DELETE CASCADE,
  student_id text,
  audience text NOT NULL DEFAULT 'all',
  assigned_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deck_id, student_id)
);

/*
  Lịch ôn của từng học sinh với từng thẻ. Khoá chính ghép để một thẻ chỉ có
  đúng một lịch cho mỗi người — bản gốc dựng id `scr-<student>-<card>` để đạt
  cùng mục đích, ở đây ràng buộc luôn bằng khoá.
*/
CREATE TABLE IF NOT EXISTS vocab_reviews (
  student_id text NOT NULL,
  card_id text NOT NULL REFERENCES vocab_cards(id) ON DELETE CASCADE,
  -- Ngày, không phải mốc thời gian: "đến hạn" tính theo ngày lịch.
  due_date date NOT NULL,
  difficulty_rating text CHECK (difficulty_rating IN ('again','hard','good','easy')),
  last_reviewed_date timestamptz,
  interval integer NOT NULL DEFAULT 0,
  ease_factor real NOT NULL DEFAULT 2.5,
  reviews_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, card_id)
);
CREATE INDEX IF NOT EXISTS vocab_reviews_due ON vocab_reviews (student_id, due_date);

/*
  Nhật ký từng lượt ôn. Giữ riêng khỏi `vocab_reviews` vì bảng kia chỉ có
  trạng thái HIỆN TẠI của một thẻ; chuỗi ngày học, tỉ lệ nhớ và biểu đồ bảy
  ngày đều cần lịch sử, mà lịch sử thì không suy ngược ra được từ trạng thái.
*/
CREATE TABLE IF NOT EXISTS vocab_logs (
  id bigserial PRIMARY KEY,
  student_id text NOT NULL,
  card_id text NOT NULL REFERENCES vocab_cards(id) ON DELETE CASCADE,
  review_date timestamptz NOT NULL DEFAULT now(),
  rating text NOT NULL CHECK (rating IN ('again','hard','good','easy')),
  interval integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS vocab_logs_student ON vocab_logs (student_id, review_date DESC);
