/*
  Quản lý lớp: danh sách học viên, học phí, nhận xét riêng.

  ## "Lớp" ở đây KHÁC "lớp" của `/lop` bên admin

  `/lop` là PHÒNG THI trực tiếp, khoá theo mã đề, sống đúng một buổi. Bảng
  dưới đây là LỚP HỌC thật: một nhóm học viên cô dạy trong nhiều tháng, có học
  phí và có nhận xét. Hai thứ trùng tên nhưng không dính nhau, nên tiền tố
  `class_` và đường dẫn `/hoc-vien` cố ý tách hẳn ra.

  ## Học phí: cô nhập, máy KHÔNG tự tính

  Không có bảng "công nợ", không có bộ sinh hoá đơn. Lý do: mỗi lớp một kiểu
  thu, có em đóng theo tháng, có em đóng trọn khoá, có em được giảm. Máy tự
  suy ra số tiền phải đóng là máy đoán, mà đoán sai tiền thì tệ hơn không
  đoán. Ở đây chỉ ghi lại hai thứ ĐÚNG NHƯ CÔ BIẾT: mức học phí cô đặt, và
  từng lần học viên đóng.

  Câu "ai chưa đóng tháng này" trả lời được nhờ cột `period` — không cần
  dựng cả một bộ tính công nợ.

  ## Tiền lưu bằng `numeric`, không bao giờ dùng số thực

  `numeric(12,0)` = đồng Việt Nam, không có hào. Mười hai chữ số đủ cho
  999 tỉ. Float làm tiền là lỗi kinh điển: 0.1 + 0.2 không bằng 0.3.

  Chạy lại nhiều lần vẫn an toàn.
*/

CREATE TABLE IF NOT EXISTS classes (
  id text PRIMARY KEY,
  teacher_id text NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name text NOT NULL,
  note text NOT NULL DEFAULT '',
  /* Học phí mặc định của lớp. Từng học viên vẫn ghi đè được. */
  tuition_amount numeric(12,0),
  /* 'thang' | 'khoa' | 'buoi' — chỉ để hiện chữ và gợi ý lúc nhập. */
  tuition_cycle text NOT NULL DEFAULT 'thang'
    CHECK (tuition_cycle IN ('thang', 'khoa', 'buoi')),
  starts_on date,
  ends_on date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classes_teacher_idx
  ON classes (teacher_id, is_active, created_at DESC);

/*
  Học viên trong lớp.

  `left_on` thay cho việc xoá dòng: em nghỉ giữa chừng thì học phí đã đóng và
  nhận xét cũ vẫn phải còn. Xoá khỏi lớp là xoá mất lịch sử của chính em ấy.
*/
CREATE TABLE IF NOT EXISTS class_members (
  class_id text NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  joined_on date NOT NULL DEFAULT CURRENT_DATE,
  left_on date,
  /* NULL = dùng mức của lớp. Có số = mức riêng của em này (giảm, học bù…). */
  tuition_override numeric(12,0),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS class_members_student_idx
  ON class_members (student_id);

/*
  Từng lần đóng tiền.

  `period` là KỲ mà lần đóng này chi trả, dạng 'YYYY-MM' cho lớp thu theo
  tháng. Để `NULL` khi lớp thu trọn khoá. Chính cột này trả lời "ai chưa đóng
  tháng này" mà không cần bảng công nợ nào.

  Mỗi kỳ một dòng cho mỗi học viên: khoá duy nhất bên dưới chặn cảnh cô bấm
  lưu hai lần thành hai dòng, rồi tưởng em ấy đóng gấp đôi.
*/
CREATE TABLE IF NOT EXISTS tuition_payments (
  id text PRIMARY KEY,
  class_id text NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount numeric(12,0) NOT NULL CHECK (amount > 0),
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  period text,
  /* 'tien_mat' | 'chuyen_khoan' | 'khac' */
  method text NOT NULL DEFAULT 'chuyen_khoan'
    CHECK (method IN ('tien_mat', 'chuyen_khoan', 'khac')),
  note text NOT NULL DEFAULT '',
  recorded_by text REFERENCES teachers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tuition_one_per_period_idx
  ON tuition_payments (class_id, student_id, period)
  WHERE period IS NOT NULL;

CREATE INDEX IF NOT EXISTS tuition_class_idx
  ON tuition_payments (class_id, paid_on DESC);

/*
  Nhận xét riêng cho từng học viên.

  MẶC ĐỊNH CHỈ CÔ ĐỌC ĐƯỢC (`shared_with_student = false`). Đây là chỗ cô ghi
  những câu thật lòng — "em này mất gốc ngữ pháp, đừng đẩy lên lớp nâng cao
  vội". Lộ ra là hỏng cả quan hệ thầy trò lẫn lòng tin vào trang. Muốn em ấy
  đọc thì phải BẬT TỪNG DÒNG, không có nút bật hàng loạt.

  `class_id` cho phép NULL: có nhận xét gắn với một lớp cụ thể, có nhận xét là
  về cả quá trình học của em ấy.
*/
CREATE TABLE IF NOT EXISTS student_notes (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id text REFERENCES classes(id) ON DELETE SET NULL,
  teacher_id text REFERENCES teachers(id) ON DELETE SET NULL,
  body text NOT NULL,
  shared_with_student boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_notes_student_idx
  ON student_notes (student_id, created_at DESC);

/*
  ── Học sinh tự chuyển khoản ──────────────────────────────────────────────

  Thêm sau, khi phần học viên đóng tiền ra đời. Giữ ở cuối file để đọc lịch
  sử dễ hơn là trộn vào bảng gốc.

  ## Học sinh KHÔNG tự xác nhận được tiền của chính mình

  Em ấy bấm "tôi đã chuyển" thì dòng đó ở trạng thái `cho_xac_nhan`. Tiền chỉ
  vào sổ khi CÔ nhìn thấy trong sao kê ngân hàng rồi bấm xác nhận. Không có
  cách nào nối thẳng tới ngân hàng ở đây, nên tin lời người trả tiền là mở
  cửa cho mọi nhầm lẫn — kể cả nhầm lẫn thật thà: chuyển thiếu, chuyển nhầm
  tài khoản, gõ sai nội dung.

  Mặc định `da_xac_nhan` vì mọi dòng CŨ đều do cô tự ghi, tức đã là tiền thật.
*/
ALTER TABLE tuition_payments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'da_xac_nhan';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tuition_payments_status_check'
  ) THEN
    ALTER TABLE tuition_payments
      ADD CONSTRAINT tuition_payments_status_check
      CHECK (status IN ('cho_xac_nhan', 'da_xac_nhan'));
  END IF;
END $$;

/* Ai khai dòng này: 'giao_vien' hay 'hoc_vien'. Để đọc lại lịch sử cho rõ. */
ALTER TABLE tuition_payments
  ADD COLUMN IF NOT EXISTS declared_by text NOT NULL DEFAULT 'giao_vien';

ALTER TABLE tuition_payments
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

CREATE INDEX IF NOT EXISTS tuition_cho_xac_nhan_idx
  ON tuition_payments (class_id, status) WHERE status = 'cho_xac_nhan';

/*
  ## Tài khoản nhận tiền

  Của GIÁO VIÊN, không phải của lớp: một cô có thể dạy nhiều lớp nhưng chỉ có
  một tài khoản. Cô tự nhập — không hardcode số tài khoản của ai vào code.

  `bank_bin` là mã 6 số của ngân hàng theo chuẩn NAPAS (Vietcombank 970436,
  Techcombank 970407…). Chuẩn VietQR đòi mã này chứ không đòi tên ngân hàng.
*/
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS bank_bin text;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS bank_holder text;
