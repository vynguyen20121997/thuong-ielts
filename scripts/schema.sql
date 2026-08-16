-- Schema for thuong-ielts admin data (testimonials, feedbacks, blog).
-- Run once via: npx tsx scripts/migrate.ts

CREATE TABLE IF NOT EXISTS testimonials (
  id             TEXT PRIMARY KEY,
  student_name   TEXT NOT NULL,
  score          TEXT NOT NULL,
  before_score   TEXT,
  after_score    TEXT,
  school_or_job  TEXT,
  course_id      TEXT,
  course_name    TEXT,
  comment        TEXT,
  avatar_url     TEXT,
  proof_urls     TEXT[] NOT NULL DEFAULT '{}',
  listening      TEXT,
  reading        TEXT,
  writing        TEXT,
  speaking       TEXT,
  rating         INTEGER,
  helpful_count  INTEGER DEFAULT 0,
  date           DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Durable image storage. Image bytes live in Postgres so testimonial proof
-- images do not depend on expiring third-party URLs.
CREATE TABLE IF NOT EXISTS media_assets (
  id           UUID PRIMARY KEY,
  content_type TEXT NOT NULL,
  data         BYTEA NOT NULL,
  byte_size    INTEGER NOT NULL,
  source_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id                TEXT PRIMARY KEY,
  subject           TEXT NOT NULL,
  image_url         TEXT,
  date              DATE,
  is_class_summary  BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  content           TEXT NOT NULL,
  excerpt           TEXT,
  cover_image_url   TEXT,
  meta_title        TEXT,
  meta_description  TEXT,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generic editable site content (single-row-per-section, JSON payload).
-- Currently used for the homepage Hero section (portrait image + text).
CREATE TABLE IF NOT EXISTS site_content (
  key         TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "Kiểm tra kiến thức IELTS" — Reading exercises.
--
-- passage/questions/answer_key are JSONB rather than normalised child tables on
-- purpose: a reading paper is a document, questions are heterogeneous (MCQ,
-- TFNG, matching headings, gap-fill each need different fields), and the whole
-- paper is always read and written as one unit. Normalising it would buy joins
-- we never run and cost a schema migration every time a new question type is
-- added.
--
-- answer_key is a SEPARATE column so that public queries can simply not select
-- it. Leaking the answers to the browser then requires writing a new query, not
-- merely forgetting to strip a field.
CREATE TABLE IF NOT EXISTS reading_tests (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  collection        TEXT,
  topic             TEXT,
  level             TEXT NOT NULL DEFAULT 'medium' CHECK (level IN ('easy', 'medium', 'hard')),
  duration_seconds  INTEGER NOT NULL DEFAULT 1200,
  question_count    INTEGER NOT NULL DEFAULT 0,
  attempt_count     INTEGER NOT NULL DEFAULT 0,
  is_free           BOOLEAN NOT NULL DEFAULT true,
  cover_image_url   TEXT,
  status            TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order        INTEGER NOT NULL DEFAULT 0,
  published_at      DATE,
  passage           JSONB NOT NULL,
  questions         JSONB NOT NULL,
  answer_key        JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "Kiểm tra kiến thức IELTS" — Listening exercises.
--
-- Same shape as reading_tests (see the note there on JSONB and on keeping
-- answer_key in its own column), with the passage replaced by `audio`.
--
-- `audio` is an array of tracks: [{ "part": 1, "src": "...", "label": "..." }].
-- Some books ship one recording for the whole test, others one file per part,
-- so a single nullable column cannot express it. `src` is a plain URL — today
-- it points at our Drive proxy, and moving the files to object storage later is
-- an UPDATE, not a code change.
CREATE TABLE IF NOT EXISTS listening_tests (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  collection        TEXT,
  topic             TEXT,
  level             TEXT NOT NULL DEFAULT 'medium' CHECK (level IN ('easy', 'medium', 'hard')),
  duration_seconds  INTEGER NOT NULL DEFAULT 1800,
  question_count    INTEGER NOT NULL DEFAULT 0,
  attempt_count     INTEGER NOT NULL DEFAULT 0,
  is_free           BOOLEAN NOT NULL DEFAULT true,
  status            TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order        INTEGER NOT NULL DEFAULT 0,
  published_at      DATE,
  -- Warning shown above the player. Some Cambridge sets only ship recordings for
  -- part of the test; those tests are published with the parts that do have audio
  -- and this note says so, rather than letting the student discover it mid-test.
  note              TEXT,
  audio             JSONB NOT NULL,
  questions         JSONB NOT NULL,
  answer_key        JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_date ON testimonials (date DESC);
CREATE INDEX IF NOT EXISTS idx_reading_tests_status ON reading_tests (status, sort_order, published_at DESC);
-- CREATE TABLE IF NOT EXISTS is a no-op on an existing table, so columns added
-- after the first deploy need their own idempotent statement.
ALTER TABLE listening_tests ADD COLUMN IF NOT EXISTS note TEXT;

CREATE INDEX IF NOT EXISTS idx_listening_tests_status ON listening_tests (status, sort_order, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_date ON feedbacks (date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts (status, published_at DESC);

/* ==================================================================
   Học viên — tài khoản và hồ sơ

   Trước đây DB không có bảng nào về người học: `testimonials` chỉ là tên
   học viên dạng chữ để marketing, không phải tài khoản. Bốn bảng dưới đây
   là toàn bộ phần danh tính.

   Cố ý KHÔNG dùng schema mặc định của Auth.js (users/accounts/sessions với
   id SERIAL và cột camelCase): phiên lưu trong JWT nên không cần bảng
   sessions, và một bảng `students` do mình định nghĩa thì đọc hợp với phần
   còn lại của DB — TEXT id, snake_case, tiếng nói giống các bảng kia.
   ================================================================== */

CREATE TABLE IF NOT EXISTS students (
  id            TEXT PRIMARY KEY,
  -- Cả hai đều cho phép NULL: đăng nhập bằng Google/Facebook thì chưa chắc
  -- có số điện thoại, đăng nhập bằng số điện thoại thì không có email.
  email         TEXT UNIQUE,
  phone         TEXT UNIQUE,
  name          TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ
);

/*
  Một học viên có thể có nhiều cách đăng nhập. Tách ra bảng riêng để lần sau
  em ấy đăng nhập bằng Facebook thay vì Google thì vẫn là một người, không
  đẻ ra tài khoản thứ hai — nối theo email khi có, còn không thì tạo mới.
*/
CREATE TABLE IF NOT EXISTS student_identities (
  provider             TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'phone')),
  provider_account_id  TEXT NOT NULL,
  student_id           TEXT NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_account_id)
);

/*
  Hỏi ngay sau lần đăng nhập đầu, trước khi cho vào phòng thi.

  Lưu `age` đúng như học viên gõ, kèm ngày ghi nhận. Suy ngược ra năm sinh thì
  sai ±1 tuổi; còn lưu mỗi tuổi mà không có mốc thời gian thì sang năm con số
  đó thành nói dối.
*/
CREATE TABLE IF NOT EXISTS student_profiles (
  student_id       TEXT PRIMARY KEY REFERENCES students (id) ON DELETE CASCADE,
  age              SMALLINT CHECK (age BETWEEN 6 AND 100),
  age_recorded_at  DATE,
  occupation       TEXT CHECK (occupation IN ('student', 'worker', 'teacher')),
  -- Band IELTS chạy 0–9 theo nửa điểm; target dưới 4.0 thì không có ý nghĩa.
  target_band      NUMERIC(2,1) CHECK (target_band BETWEEN 4.0 AND 9.0),
  completed_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
  Mã OTP gửi qua Zalo ZNS.

  Lưu bản băm chứ không lưu mã trần: ai đọc được DB cũng không đăng nhập hộ
  được. `attempts` để khoá sau vài lần gõ sai, `last_sent_at` để chặn bấm gửi
  lại liên tục — mỗi tin ZNS đều mất tiền.
*/
CREATE TABLE IF NOT EXISTS phone_otps (
  phone         TEXT PRIMARY KEY,
  code_hash     TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  attempts      SMALLINT NOT NULL DEFAULT 0,
  last_sent_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_identities_student ON student_identities (student_id);
CREATE INDEX IF NOT EXISTS idx_students_last_seen ON students (last_seen_at DESC);

/* ==================================================================
   Giáo viên — mới có một người, nhưng đặt chỗ sẵn cho nhiều người

   Hôm nay chỉ có cô Thương, và đăng nhập trang quản trị vẫn có thể chạy
   bằng ADMIN_USERNAME/ADMIN_PASSWORD_HASH. Bảng này tồn tại để cái ngày
   thầy cô thứ hai xuất hiện là một câu INSERT, chứ không phải một cuộc
   di trú trên dữ liệu học sinh đang chạy thật.

   Đây là lý do duy nhất bảng có mặt sớm như vậy. Chưa có màn tạo tài
   khoản, chưa có mời, chưa có phân quyền nhiều vai — những thứ đó chỉ có
   nghĩa khi đã có người thứ hai.
   ================================================================== */

CREATE TABLE IF NOT EXISTS teachers (
  id             TEXT PRIMARY KEY,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,
  email          TEXT UNIQUE,
  -- Người đầu tiên là chủ trang: sau này thấy được mọi lớp, không chỉ lớp
  -- của mình. Cột này để sẵn cho lúc đó, hôm nay chưa chỗ nào đọc tới.
  is_owner       BOOLEAN NOT NULL DEFAULT false,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at  TIMESTAMPTZ
);

/*
  Kho đề riêng, làm bằng một cột thay vì bằng cách nhân bản dữ liệu.

    owner_id IS NULL      -> kho chung (Cam 10–18, không ai viết ra chúng)
    owner_id = <giáo viên> -> đề riêng của người đó

  Từ đó ra đúng hai luật hiển thị, và chúng phải được viết TRƯỚC dòng đề
  riêng đầu tiên, không phải trước giáo viên thứ hai:

    trang quản trị:  WHERE owner_id IS NULL OR owner_id = <tôi>
    trang học sinh:  WHERE owner_id IS NULL

  Quên luật thứ hai thì ngày ai đó thêm đề riêng, đề ấy nằm sẵn trên trang
  công khai cho cả thiên hạ. Đó mới là chỗ rò rỉ thật, không phải giữa hai
  giáo viên với nhau.
*/
ALTER TABLE reading_tests   ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES teachers (id) ON DELETE SET NULL;
ALTER TABLE listening_tests ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES teachers (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reading_tests_owner   ON reading_tests   (owner_id);
CREATE INDEX IF NOT EXISTS idx_listening_tests_owner ON listening_tests (owner_id);

/* ==================================================================
   Lượt làm bài

   Trước bảng này, chấm xong là quên: chỉ có `attempt_count` tăng thêm 1.
   Học sinh không xem lại được, cô không thấy được tiến bộ, và không có gì
   để màn theo dõi trực tiếp hiển thị.

   Một lượt làm là một tài liệu, đọc và ghi trọn vẹn — nên `answers` và
   `results` để JSONB, cùng lý do với `questions` của bảng đề.

   CỐ Ý KHÔNG lưu đáp án đúng vào đây. `results` chỉ ghi đúng/sai đã chấm.
   Muốn xem đáp án thì đọc `answer_key` của bảng đề, và chỉ trang quản trị
   mới có đường đó — nhân bản đáp án sang bảng này là mở thêm một chỗ để lộ.
   ================================================================== */

CREATE TABLE IF NOT EXISTS attempts (
  id               TEXT PRIMARY KEY,
  skill            TEXT NOT NULL CHECK (skill IN ('reading', 'listening')),
  -- 'paper' = một passage lẻ, 'test' = cả bài 40 câu.
  -- Reading có cả hai; Listening hiện chỉ có 'test'.
  scope            TEXT NOT NULL CHECK (scope IN ('paper', 'test')),
  -- slug của đề, hoặc testId dạng "cam12-test3" khi làm cả bài.
  target           TEXT NOT NULL,
  title            TEXT NOT NULL,

  -- Đúng một trong hai có giá trị. `guest_name` dành cho luồng cô gửi link:
  -- khách gõ tên để vào làm và KHÔNG trở thành tài khoản — tên chỉ nằm ở
  -- đây, bảng `students` vẫn chỉ chứa người đã đăng nhập thật.
  student_id       TEXT REFERENCES students (id) ON DELETE CASCADE,
  guest_name       TEXT,

  -- Chưa dùng. Bảng `assignments` (cô giao bài qua link) là bước sau; cột
  -- này để sẵn vì thêm cột nullable vào bảng đã có dữ liệu tuy rẻ, nhưng
  -- sửa mọi truy vấn đang chạy thì không.
  assignment_id    TEXT,

  started_at       TIMESTAMPTZ,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Hết giờ mà chưa bấm nộp thì server tự chốt. Cô cần phân biệt được em
  -- chủ động nộp với em bị hết giờ.
  auto_submitted   BOOLEAN NOT NULL DEFAULT false,
  elapsed_seconds  INTEGER NOT NULL DEFAULT 0,

  total            INTEGER NOT NULL,
  correct          INTEGER NOT NULL,
  band             NUMERIC(2,1),

  -- { "cam12-t3-p1-q4": "glacier" } — đúng những gì học sinh gõ.
  answers          JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- [{ "q": "...", "n": 4, "ok": true }] — đủ để dựng lại dải 40 ô mà
  -- không phải chấm lại, và không mang theo đáp án.
  results          JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT attempts_co_nguoi_lam CHECK (student_id IS NOT NULL OR guest_name IS NOT NULL)
);

/*
  Một lượt bắt đầu tồn tại từ lúc học sinh bấm vào bài, không phải lúc nộp.
  Không có dòng "đang làm" thì cô không có gì để nhìn trong lúc cả lớp còn
  đang làm — mà đó chính là điều tính năng này để làm.

  `expires_at` do server đặt và server giữ. Đồng hồ trong trình duyệt vẫn chạy
  cho học sinh nhìn, nhưng mọi con số thời gian mà cô thấy đều tính từ cột này:
  học sinh tắt mạng thì đồng hồ máy em ấy đứng, còn giờ thi thì không.
*/
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'submitted'
  CHECK (status IN ('in_progress', 'submitted', 'abandoned'));
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
-- Lượt đang làm thì chưa có giờ nộp. Cột này vốn NOT NULL DEFAULT now(), nên
-- phải nới ra — những dòng đã có sẵn không đổi gì.
ALTER TABLE attempts ALTER COLUMN submitted_at DROP NOT NULL;

/*
  Tiến độ của một lượt đang làm — một dòng hẹp, ghi đè mỗi vài giây.

  Tách khỏi `attempts` chứ không nhét thêm cột: đây là thứ DUY NHẤT bị ghi
  liên tục trong suốt 60 phút. Để chung thì mỗi nhịp lại viết lại cả dòng có
  hai cột JSONB nặng vài KB nằm cạnh, mà chẳng cột nào trong đó thay đổi.

  `marks` là mảng đúng bằng số câu: null = chưa làm, true/false = đã chấm.
  Chấm ngay trong lúc học sinh còn đang làm — xem ghi chú ở route nhịp về việc
  kết quả này chỉ được đi một chiều tới trang quản trị.
*/
CREATE TABLE IF NOT EXISTS attempt_progress (
  attempt_id    TEXT PRIMARY KEY REFERENCES attempts (id) ON DELETE CASCADE,
  answered      INTEGER NOT NULL DEFAULT 0,
  correct       INTEGER NOT NULL DEFAULT 0,
  current_part  TEXT,
  marks         JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Không có nhịp trong 20 giây -> "mất kết nối"; 60 giây -> coi như đã rời.
  -- Suy ra lúc đọc chứ không lưu thành trạng thái: một cột "đang online" thì
  -- phải có ai đó đi tắt nó, mà lúc mạng học sinh rớt thì không ai tắt cả.
  last_beat_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "Lịch sử của tôi": lượt mới nhất trước.
CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts (student_id, submitted_at DESC);
-- Bảng lớp chỉ quan tâm những lượt còn đang làm — index một phần thì nhỏ và
-- không phình theo lịch sử làm bài của cả trang.
CREATE INDEX IF NOT EXISTS idx_attempts_dang_lam ON attempts (target, started_at DESC)
  WHERE status = 'in_progress';
-- "Ai đã làm đề này": phục vụ bảng lớp và thống kê theo đề.
CREATE INDEX IF NOT EXISTS idx_attempts_target  ON attempts (skill, target, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_assignment ON attempts (assignment_id) WHERE assignment_id IS NOT NULL;
