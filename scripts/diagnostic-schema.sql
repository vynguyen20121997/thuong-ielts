CREATE TABLE IF NOT EXISTS diagnostic_attempts (
  token_hash text PRIMARY KEY,
  version text NOT NULL,
  exam jsonb NOT NULL,
  profile jsonb NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  workspace jsonb NOT NULL DEFAULT '{}',
  plan_progress jsonb NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '60 minutes',
  submitted_at timestamptz,
  auto_submitted boolean NOT NULL DEFAULT false,
  result jsonb,
  -- Phiên bản bộ quy tắc nhận xét lúc chấm; xem packages/diagnostic/src/rules.ts.
  rules_version text,
  editor text,
  editor_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cột thêm sau khi bảng đã chạy thật; chạy lại nhiều lần vẫn an toàn.
ALTER TABLE diagnostic_attempts ADD COLUMN IF NOT EXISTS rules_version text;

/*
  Lịch sử chấm lại. Sửa đề hoặc đáp án KHÔNG được tự làm đổi kết quả đã trả cho
  học sinh — muốn đổi thì cô phải bấm chấm lại, và mỗi lần bấm để lại một dòng ở
  đây kèm bản kết quả cũ nguyên vẹn, đủ để phục hồi hoặc đối chiếu về sau.
*/
CREATE TABLE IF NOT EXISTS diagnostic_regrades (
  id bigserial PRIMARY KEY,
  token_hash text NOT NULL REFERENCES diagnostic_attempts(token_hash) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  teacher text NOT NULL,
  reason text NOT NULL,
  from_exam_version text,
  to_exam_version text,
  from_rules_version text,
  to_rules_version text,
  from_scores jsonb,
  to_scores jsonb,
  -- Bản kết quả TRƯỚC khi chấm lại, giữ trọn để còn đường lùi.
  from_result jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS diagnostic_regrades_attempt
  ON diagnostic_regrades (token_hash, at DESC);

/*
  Phần Writing (Section 4).

  Bài viết để cột RIÊNG chứ không nhét vào `answers`: `answers` là bản đồ
  mã câu → đáp án, và `mismatchedAnswerIds` chặn chấm lại khi thấy mã câu lạ.
  Nhét bài viết vào đó là tự tay làm hỏng chốt an toàn ấy.

  `writing` giữ nguyên trạng thái do bộ chấm trả về, gồm cả lúc chưa chấm
  được — xem `WritingState` trong packages/diagnostic. Dịch vụ ngoài hỏng
  không được phép làm hỏng cả lượt làm, nên "chưa chấm được" cũng là một
  trạng thái hợp lệ và lưu lại được để chấm lại sau.
*/
ALTER TABLE diagnostic_attempts ADD COLUMN IF NOT EXISTS essay text NOT NULL DEFAULT '';
ALTER TABLE diagnostic_attempts ADD COLUMN IF NOT EXISTS writing jsonb;

/*
  45 -> 60 phút vì có thêm Section 4 (Writing, 15 phút). Bảng đã chạy thật nên
  phải ALTER: `CREATE TABLE IF NOT EXISTS` ở trên không đụng tới bảng cũ, và
  một hạn 45 phút còn sót lại nghĩa là học sinh bị cắt giữa bài viết.
*/
ALTER TABLE diagnostic_attempts
  ALTER COLUMN expires_at SET DEFAULT now() + interval '60 minutes';
