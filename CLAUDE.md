# thuong-ielts

Trang luyện thi IELTS của cô Hồ Ngọc Thương. Phần lớn công sức nằm ở mục **Kiểm tra
kiến thức** — bộ đề Reading/Listening có bấm giờ, chấm điểm và quy đổi band.

File này là bộ nhớ chung của dự án. Ghi vào đây những gì **không đọc ra được từ code**:
lý do đằng sau một quyết định, cái bẫy đã từng sập, và chỗ dữ liệu đang thiếu. Đừng chép
lại cấu trúc thư mục hay lịch sử git — những thứ đó tự tra được.

## Chạy dự án

```bash
npm install
npm run dev:web          # http://localhost:2000
npm run check:reading    # kiểm tra dữ liệu đề đọc trong DB
npm run check:listening  # kiểm tra đề nghe (đáp án + audio theo section)
npm run check:coverage   # còn thiếu đề nào, bộ nào
npm run check:diagnostic # bài kiểm tra nền: chấm, lộ trình, API
npm run check:writing-task-type  # nhận dạng dạng đề Task 2
npm run check:vocab      # khoá chống mất lượt + chuỗi ngày học (cần dev server đang chạy)
npm run check:practice   # đáp án kín, điểm do server quyết, nộp trùng (cần dev server)
npm run check:class      # học phí, cách ly giáo viên, nhận xét riêng
npm run check:tuition    # mã VietQR + luật "lời khai không phải là tiền" (cần dev server)
npm run check:personas   # cô + học sinh đi hết một vòng dạy-học (cần cả web lẫn admin)
npm run check:baigiao    # các chốt của bài giao: che kết quả, đóng bài, một lần, khách
npm run check:noidung    # cô soạn ở admin -> học sinh thấy ở web (cần cả hai server)
npm run migrate:class    # dựng bảng quản lý lớp, chạy lại nhiều lần vẫn an toàn
npm run migrate          # tạo/cập nhật schema, chạy lại nhiều lần vẫn an toàn
```

Monorepo npm workspaces: `apps/web` (trang chính), `apps/admin` (trang quản trị),
`packages/db` (pool Postgres dùng chung). Cấu hình DB nằm ở `apps/web/.env.local`
(xem `.env.example`). Máy dev đang chạy Windows; các script viết bằng `tsx`.

## Bản đồ — trang này có những gì

Đọc mục này trước, rồi mới đọc phần quyết định bên dưới. Hai app, cùng một DB:

**`apps/web` — học sinh.**

| Đường dẫn | Là gì | Trạng thái |
|---|---|---|
| `/kiem-tra-nen-tang-ielts` | Bài kiểm tra nền 53 câu + Writing 15 phút, ra lộ trình theo tháng | Xong |
| `/kiem-tra-kien-thuc/reading` `/listening` | Luyện đề có bấm giờ, chấm ở server | Xong |
| `/kiem-tra-kien-thuc/writing` | Luyện Task 2: checklist, band 4 tiêu chí, 5 mục hướng dẫn | Xong, 2/5 mục cần model sinh văn bản |
| `/kiem-tra-kien-thuc/speaking` | Thu âm + nói ra chữ, chấm 3/4 tiêu chí | Xong; Phát âm cần model NGHE được |
| `/hoc-tu-vung` | Anki giãn cách (SM-2) | Xong, kho gần rỗng |
| `/hoc-phi` | Học phí + mã VietQR tự dựng | Xong |
| `/vao/[token]` | Cửa vào bài cô giao, cho cả khách | Xong |

**`apps/admin` — giáo viên.** Giao bài · bảng lớp trực tiếp (Socket qua Postgres
`LISTEN/NOTIFY`) · chấm lại bài kiểm tra nền · **Học viên & học phí** (lớp, học phí,
nhận xét riêng) · **Từ vựng** và **Đề Writing** (soạn nội dung) · Hero, testimonial,
feedback.

`/phong-luyen-tap/*` chỉ là rewrite sang `/kiem-tra-kien-thuc/*` (`next.config.mjs`) —
link cũ còn sống, đừng tưởng là hai bộ trang.

**`packages/`** — `db` (pool + hợp đồng dùng chung giữa hai app: `khoaLop`, `maDeTuSlug`,
`banNhip`), `diagnostic` (chấm + lộ trình của bài kiểm tra nền).

**Bộ kiểm** — `npm run check:*`, xem mục "Chạy dự án". Mỗi bộ đều ĐÃ TỪNG được phá cho
đỏ rồi mới tin; đừng thêm bộ nào mà chưa chứng minh nó đỏ được.

## Còn gì chưa làm — cập nhật 25/09/2026

Đo bằng script, không phải nhớ. Xếp theo mức chặn người dùng.

**1. Kho nội dung gần rỗng, và đó mới là nút thắt.** Reading 468 đề / Listening 138 đề,
nhưng Writing **7 đề** (đúng **1 đề** có ngân hàng ý và kiến thức nền) và từ vựng **1 bộ
chính thức / 6 thẻ**. Trang soạn nội dung đã có (`/noi-dung/tu-vung`, `/noi-dung/writing`)
— giờ thiếu người ngồi nhập, không thiếu code.

**2. Giải thích đáp án.** 1758/6187 câu trống, toàn bộ Cam 12–18 + GUIDE + TRAIN. Học
sinh làm Cam 15 sai một câu thì không biết vì sao sai. Cần nguồn, xem mục "Nội dung đang
thiếu".

**3. 318/468 đề Reading không làm được cả bài.** Bộ VOL slug dạng
`vol-5-test-2-passage-3`, không khớp `maDeTuSlug` nên chỉ làm lẻ từng passage — mà band
ước lượng từ 13 câu thì nhiễu. Muốn sửa thì mở rộng luật ở `packages/db/src/live.ts` VÀ
`isTestId` bên web cùng lúc; đổi một bên là cô giao được thứ học sinh mở không ra.

**4. Ba cổng AI treo.** Đều khai `available() === false` và trả `null` — KHÔNG bịa, nhưng
học sinh mở ra thấy ô trống:
- `features/vocab/application/ports.ts` — sinh phiên âm/nghĩa/ví dụ
- `features/practice/application/essayPorts.ts` — Grammar Enhancement, bài mẫu
- `features/speaking/application/ports.ts` — gợi ý ý tưởng, bốc chủ đề, chấm Phát âm

Ba cái đầu cần một model SINH VĂN BẢN (TypeSafe chỉ trả `noul`/`score`/`choice`); riêng
Phát âm cần model NGHE được audio.

**5. Ngân hàng đề Speaking vẫn nằm trong code** (`features/speaking/domain/bank.ts`).
Muốn cô soạn được thì phải chuyển sang DB trước, rồi làm trang như `/noi-dung/tu-vung`.

**6. Trong sheet của cô, chưa động tới:** Listening dictation (chép chính tả), Writing
Task 1 (cần cô cấp đề biểu đồ).

**7. Listening không có tín hiệu độ khó thật.** Cả 138 đề đều `level='medium'` trong DB;
độ khó chỉ có nhờ bảng đè tay cho Cam 10–18 (`domain/keyPracticeDifficulty.ts`).

**Chưa có bộ kiểm nào che:** nhịp realtime lên bảng lớp của cô, tự nộp khi hết giờ, và
luồng bài kiểm tra nền đầy đủ (làm hết 53 câu → nộp → đọc lộ trình).

**Cảnh báo khi đọc số liệu sử dụng:** 30 ngày tính tới 25/09/2026 chỉ có 1 lượt nộp và 8
lượt bỏ dở, và phần lớn tài khoản trong DB là persona mô phỏng. Đừng suy hành vi người
dùng thật từ những con số đó.

## Những quyết định đã chốt, đừng đảo ngược nếu chưa hiểu lý do

**Postgres là nguồn sự thật duy nhất cho nội dung đề.** Không có file seed, không có
bản dự phòng trong code. Đã từng có fallback và đã gỡ bỏ: khi có trang quản trị sửa đề,
bản dự phòng sẽ nói dối. DB sập thì trang báo lỗi (`error.tsx`), đúng như thực tế.

**Đáp án nằm ở cột `answer_key` riêng.** Mọi truy vấn phục vụ trình duyệt đều không
nhắc tới cột này. Muốn lộ đáp án ra client thì phải cố tình viết truy vấn mới, chứ không
phải chỉ quên lọc một field. Chấm bài luôn ở server (`domain/scoring.ts`); client chỉ
gửi thứ học sinh gõ.

**Nội dung đề lưu JSONB** (`passage` / `audio` / `questions` / `answer_key`). Một đề thi
là một tài liệu, luôn đọc và ghi trọn vẹn, và các dạng câu hỏi không đồng nhất. Tách
thành bảng con chỉ tổ thêm join không ai dùng và thêm migration mỗi lần có dạng mới.

**File nghe phải đi qua proxy của mình** (`/api/practice/listening/audio/[fileId]`).
Trình duyệt không phát được file Google Drive: Google trả trang HTML chắn đường và không
có CORS. Server gọi server thì lấy được byte thật. Route này forward cả `Range` header,
nếu không thì không tua được và Safari từ chối phát.

**Màu sắc dùng token trong `@theme` (`apps/web/src/app/globals.css`), không viết hex
rời.** `bg-brand`, `text-leaf`, `bg-mist`... — đổi tông cả site chỉ sửa một chỗ. Đã
từng có 798 chỗ hex rải trong 43 file, gộp về 12 token; đừng để mọc lại. Màu trạng
thái (đúng/sai/cảnh báo) chưa token hoá, thấy tiện thì gộp nốt.

**Lộ trình ôn tập: bài kiểm tra định vị điểm khởi hành, mục tiêu band định đích.**
`packages/diagnostic/src/roadmap.ts` dùng kết quả 53 câu chỉ để xếp `startTier`
(nền yếu / trung bình / khá vững) và chọn nhóm nội dung cần vá trước; còn các chặng thì
đi theo kỳ thi thật — đủ bốn kỹ năng, luôn có chặng Writing/Speaking dù bài kiểm tra
không đo hai kỹ năng đó một câu nào. Đơn vị của lộ trình là THÁNG, không phải tuần: tổng
thời lượng lấy từ `BASE_MONTHS` (theo mục tiêu) nhân hệ số của `startTier`, rồi chia
cho từng chặng theo tỉ trọng bằng phép chia phần dư lớn nhất — mỗi chặng tối thiểu một
tháng, nên lộ trình không thể ngắn hơn số chặng. Sửa độ dài thì sửa `BASE_MONTHS` và
`weight` của từng chặng, đừng rải số tháng trong UI. Tuyệt đối không viết "bạn đang 5.0, sẽ lên 6.5": thiếu Writing/Speaking nên
không có cơ sở quy đổi band đầu vào.

**Section 4 là Writing, 15 phút, chấm bằng AI theo bốn tiêu chí — và band đó
KHÔNG cộng vào Overall.** Bài viết đi qua `packages/diagnostic/src/writing.ts`
(đề, thang sáu mức cho TR/CC/LR/GRA, cách quy band) rồi `features/diagnostic/
server/writingGrader.ts` gọi TypeSafe. Ba điều đã chốt:

- **15 phút thì phải nói ra là 15 phút.** Task 2 thật là 40 phút / 250 từ; ở
  đây mức tối thiểu là 150 từ và `GRADER_CONTEXT` báo trước cho model để nó
  không trừ điểm vì bài ngắn. Giao diện cũng ghi "band tham khảo cho bài 15
  phút" ngay cạnh con số — bỏ câu đó đi là để học sinh đọc nhầm thành band thi.
- **Vẫn không có điểm Overall.** Bài kiểm tra không đo Speaking, nên chưa đủ
  bốn kỹ năng để quy đổi; luật cũ ở mục lộ trình giữ nguyên. Writing có band
  riêng vì đó là thứ đo được thật, không phải để cộng trung bình.
- **Không có mục "lỗi chi tiết" như bản mẫu ai4ielts.** Bộ chấm dạng `score`
  chỉ trả về một con số cho mỗi tiêu chí, không trả văn bản tự do. Dựng danh
  sách lỗi từ đó là bịa vị trí lỗi, nên thà thiếu một mục.

**Bài viết để cột `essay` riêng, và chấm NGOÀI transaction.** Nhét bài viết vào
`answers` là phá chốt `mismatchedAnswerIds` (mã câu lạ thì admin không chấm lại
được). Còn `grade-writing` là một action riêng vì bộ chấm là dịch vụ ngoài chờ
tới 25 giây: gọi nó trong lúc đang giữ `FOR UPDATE` là giam một kết nối DB và
chặn mọi tab khác của chính học sinh đó. Nộp bài trả về ngay với điểm ba phần
trắc nghiệm, trang mới hỏi tiếp điểm Writing — dịch vụ chấm hỏng thì mất phần
Writing chứ không mất cả lượt làm. Server bỏ qua nếu đã chấm rồi, nên F5 ở màn
kết quả không tính tiền lần nữa.

**Form đầu vào của bài kiểm tra nền có một nguồn duy nhất.**
`packages/diagnostic/src/profile.ts` giữ cả danh sách lựa chọn lẫn luật kiểm tra, cho
client và server dùng chung. Trước đây form liệt kê lựa chọn trong `Diagnostic.tsx` còn
`route.ts` tự viết lại mảng `purposes` của nó — thêm một mục ở form là server lặng lẽ từ
chối. Thêm lựa chọn mới chỉ sửa ở file đó.

**Thời gian tự học và ngày thi chỉ đổi LỊCH, không đổi chẩn đoán.** Học ít giờ/tuần hơn
mức khuyến nghị thì lộ trình dài ra (`paceFactor`, chặn ở gấp đôi); ngày thi tới sớm hơn
lộ trình thì **cảnh báo chứ không cắt chặng** — cắt thì Writing/Speaking rơi trước, mà đó
đúng là phần kéo band xuống. Số giờ/tuần cần thiết phải tính từ khối lượng ở nhịp khuyến
nghị, không phải từ nhịp học sinh đang khai: lấy nhịp hiện tại nhân lên sẽ ra nghịch lý
"đang học 1.5 giờ/tuần, học 6 giờ/tuần là kịp" trong khi 6 giờ vẫn dưới mức cần.

**Chấm band bốn tiêu chí chỉ có MỘT bản cài đặt: `apps/web/src/server/
writingBand.ts`.** Hai chỗ gọi nó — Section 4 của bài kiểm tra nền (bài 15
phút, 150 từ, có `GRADER_CONTEXT` dặn model đừng trừ điểm vì bài ngắn) và màn
luyện Writing (Task 2 đủ 40 phút, 250 từ, không dặn gì thêm). Khác nhau đúng
hai tham số `context` và `minWords`; để hai bản cài đặt song song là mở đường
cho ngày điểm ở hai màn lệch nhau. Bảng điểm cũng một bản:
`components/WritingBandReport.tsx`, phần chữ quanh con số vào qua props.

**Checklist Writing và band Writing là HAI thứ, đừng nối vào nhau.** Checklist
(`domain/writing.ts`, sáu câu có/không) trả lời "bài còn thiếu gì sửa được
trong năm phút"; band (`writingBand.ts`, bốn câu `score` theo thang mô tả band)
trả lời "bài đang ở mức nào". Cộng sáu câu có/không lại thành một con số band
thì không có cơ sở quy đổi — đó là thứ chú thích cũ trong `domain/writing.ts`
cấm, và lệnh cấm ấy vẫn còn hiệu lực. Học sinh bấm riêng từng nút.

**Bộ chấm VÀ bộ nhận xét của bài kiểm tra nền đều nằm ở `packages/diagnostic`, không ở
`apps/web`.** `apps/admin` chấm lại bằng đúng hàm `grade()` và đúng `exam.json` mà trang
học sinh dùng — hai bản cài đặt song song thì sẽ có ngày điểm học sinh thấy khác điểm cô
thấy, mà không biết bên nào đúng.

Phần suy ra từ điểm (`profile.ts` → `roadmap.ts` → `verdict.ts`) đi theo cùng lý do, và
thêm một lý do nữa: `RULES_VERSION` đánh số cho chính các ngưỡng trong hai file sau. Để
con số ở package mà để ngưỡng ở `apps/web` thì lời dặn "đổi ngưỡng thì tăng version" trỏ
sang một thư mục khác, và admin cũng không dựng lại được nhận xét của một lượt cũ.

Bên web, `features/diagnostic/types.ts`, `server/scoring.ts` và `domain/{profile,roadmap,
verdict}.ts` giờ chỉ là cầu nối re-export, giữ nguyên import cũ. Các cầu nối liệt kê
từng tên chứ không `export *`: ba file cùng trỏ vào một package, dùng `export *` thì
`import { checkProfile } from "../domain/roadmap"` cũng chạy, và thư mục `domain/` hết
là bản đồ của chính nó.

**Chấm lại là thao tác có chủ đích, không tự động.** `/chan-doan` bên admin bắt nhập lý
do, ghi một dòng vào `diagnostic_regrades` (kèm bản `result` cũ nguyên vẹn) trong cùng
transaction rồi mới ghi đè. Trước khi ghi đè còn chặn bằng `mismatchedAnswerIds`: đề mới
đánh lại mã câu thì `grade()` coi mọi câu là chưa trả lời và điểm về 0 — thà không chấm
lại được còn hơn xoá mất một kết quả đúng.

**Đổi ngưỡng nhận xét thì tăng `RULES_VERSION`** (`packages/diagnostic/src/rules.ts`). Đề và đáp án của
mỗi lượt đã được chụp nguyên vào cột `exam` nên sửa đề không đụng kết quả cũ, nhưng
`NEED`/`BASE_MONTHS`/mốc 60% nằm trong code — mỗi lượt lưu `rules_version` lúc chấm, đọc
lại bằng bộ quy tắc khác thì trang nói ra thay vì im lặng.

**Kiến trúc phân lớp** trong `features/practice`: `domain/` thuần (không React, không
fetch, không `pg`) ← `application/` (hook, không JSX) ← `infrastructure/` (fetch) /
`server/` (SQL) / `ui/` (chỉ vẽ). Giữ hướng phụ thuộc một chiều này.

**"Lớp" có HAI nghĩa trong dự án này, đừng trộn.** `/lop` bên admin là PHÒNG
THI trực tiếp: khoá theo mã đề, sống đúng một buổi, dựng để cô nhìn ai đang
làm tới câu mấy. `/hoc-vien` là LỚP HỌC thật: nhóm học viên cô dạy nhiều
tháng, có học phí và nhận xét. Bảng tiền tố `class_`, nhãn trên thanh điều
hướng là "Lớp đang làm" với "Học viên & học phí" — cố ý khác nhau rõ vì trong
code cả hai đều từng gọi là "lớp".

**HỌC SINH KHÔNG TỰ XÁC NHẬN ĐƯỢC TIỀN CỦA MÌNH.** Em ấy bấm "Tôi đã chuyển"
thì dòng đó đứng ở `cho_xac_nhan` và KHÔNG được cộng vào bất kỳ con số nào —
"thu kỳ này", "đã đóng", "ai chưa đóng" đều chỉ đếm `da_xac_nhan`. Tiền vào sổ
khi CÔ nhìn thấy trong sao kê rồi bấm xác nhận, và lúc xác nhận sửa được số
tiền (em khai 1.5 triệu mà chuyển 1.4 triệu thì vào sổ 1.4). Không có đường
nối nào tới ngân hàng ở đây, nên tin lời người trả tiền là mở cửa cho mọi nhầm
lẫn — kể cả nhầm lẫn thật thà. Đã thử cho lời khai thành `da_xac_nhan` luôn:
`check:tuition` đỏ 6 mục.

Route `/api/hoc-phi/bao-da-chuyen` KHÔNG nhận số tiền từ client — lấy từ mức
học phí của lớp trong DB. Để client gửi kèm là mở đường cho "tôi đã chuyển
10.000 đ".

**Mã VietQR tự dựng, không gọi img.vietqr.io.** Dịch vụ ấy tiện nhưng nghĩa là
mỗi lần học sinh mở trang, trình duyệt em ấy gửi số tài khoản của cô + số tiền
+ nội dung sang máy chủ người khác. Chuỗi QR chỉ là vài trăm ký tự theo chuẩn
công khai: `features/tuition/domain/vietqr.ts` dựng, `qrcode` vẽ SVG ở server.
Ba chỗ dễ sai, cả ba đã có bài kiểm: CRC phải là CRC-16/CCITT-FALSE (vector
chuẩn `"123456789"` → `29B1`), phải tính TRÊN CẢ bốn ký tự `"6304"` ở cuối, và
nội dung phải bỏ dấu tiếng Việt trước khi vào mã. Sai một trong ba thì mã vẫn
VẼ RA nhưng app ngân hàng báo không hợp lệ — không cách nào biết cho tới khi
có người thật quét.

**Trang `/hoc-phi` dùng `currentStudent`, KHÔNG dùng `requireStudent`.**
`requireStudent` còn chặn thêm một nấc "chưa khai xong hồ sơ thì sang /ho-so"
— đúng cho phòng thi, sai ở đây: bắt điền tuổi/nghề/band mục tiêu trước khi
cho xem số tài khoản là cách nhanh nhất để em ấy bỏ đó rồi nhắn thẳng cho cô.
Lỗi này do `check:tuition` phát hiện chứ không phải đọc code ra.

**Gói `server-only` chỉ Next mới giải được.** Mọi file có `import "server-only"`
đều KHÔNG import được từ script `tsx` — `ERR_MODULE_NOT_FOUND`. Nên phần server
của web phải kiểm qua HTTP (`check-tuition.ts`, `check-practice.ts`), không gọi
thẳng tầng lib như `check-class.ts` làm với admin.

**Học phí: cô nhập, máy KHÔNG tự tính.** Không có bảng công nợ, không có bộ
sinh hoá đơn. Mỗi lớp một kiểu thu — có em theo tháng, có em trọn khoá, có em
được giảm — nên máy suy ra số phải đóng là máy đoán, mà đoán sai TIỀN thì tệ
hơn không đoán. Chỉ ghi hai thứ đúng như cô biết: mức cô đặt (lớp, và mức
riêng từng em), và từng lần đóng. Câu "ai chưa đóng tháng này" trả lời được
nhờ cột `period`, không cần bộ tính công nợ nào.

Tiền lưu `numeric(12,0)`, tuyệt đối không float. `docTien` bỏ mọi dấu phân
cách trước khi đọc vì cô gõ "1.500.000" hay "1,500,000 đ" tuỳ lúc.

**Phân biệt "không gửi field" với "gửi null để xoá".** `suaHocVien` dùng
`CASE WHEN <có field> THEN <giá trị> ELSE <giữ nguyên> END`, không dùng
`coalesce`. Đã thử đổi sang `coalesce` và `check:class` đỏ ngay: cô giảm học
phí cho một em rồi muốn bỏ mức giảm thì không bỏ được, mức 1.000.000 dính mãi.

**Nhận xét riêng mặc định CHỈ CÔ ĐỌC.** Đây là chỗ cô ghi những câu thật lòng
("em này mất gốc, chưa nên đẩy lên lớp nâng cao"). Bật cho học viên xem là
thao tác có chủ đích cho TỪNG dòng, có hỏi lại — không có nút bật hàng loạt.

**Component client KHÔNG được import file có `pool`.** Đã sập: `BangLopHoc.tsx`
chỉ cần mấy nhãn tiếng Việt mà import từ `hocVien.ts`, thế là Turbopack kéo cả
driver `pg` vào bundle trình duyệt và build đổ với "Can't resolve 'dns'". Kiểu
và nhãn để ở `hocVienKieu.ts`, tiền tệ ở `tien.ts`; `hocVien.ts` chỉ giữ truy
vấn. `tsc` KHÔNG bắt được lỗi này — chỉ `npm run build` mới thấy.

**Phần học từ vựng port từ repo `vynguyen20121997/ielts`, không clone.** Bản gốc
là Vite SPA + Express + file `data/db.json` + đăng nhập bằng mật khẩu thô và
token giả (`fake-token-<id>`). Ba thứ đó viết lại hết: Postgres (`vocab_*`),
route handler của Next, và danh tính lấy từ phiên Auth.js phía server — bản gốc
nhận `x-user-id` do CLIENT gửi, tức ai cũng đổi được thành id người khác.

Giữ NGUYÊN hai thứ, vì đó mới là phần đáng giá: mô hình dữ liệu, và thuật toán
giãn cách trong `features/vocab/domain/srs.ts` (again 0 ngày / hard 1 / good 3
hoặc `interval × ease` / easy 7 hoặc `interval × ease × 1.3`; ease khởi tạo
2.5, sàn 1.3). Đổi số trong đó là đổi lịch ôn của mọi học sinh đang học dở.

**Mục "AI tự sinh IPA / nghĩa / ví dụ" CHƯA nối được vào model đang dùng.**
TypeSafe (Jev) chỉ trả lời câu hỏi có sẵn lựa chọn — `noul`, `score`, `choice`.
Đã thử gửi kiểu `text`, `string`, `freeform`, `generate`: cả bốn trả về 400
`api_usage_error`. Sinh phiên âm và câu ví dụ là sinh văn bản tự do, nên phải
có một model khác. Chỗ nối để sẵn ở `features/vocab/application/ports.ts`, đổi
một dòng trong `infrastructure/index.ts` là xong; bản tạm khai
`available() === false` và trả `null`, KHÔNG bịa phiên âm.

**Speaking chấm từ BẢN GHI CHỮ, và chỉ chấm ba tiêu chí.** Nhận dạng lời nói
chạy NGAY TRÊN TRÌNH DUYỆT (`application/useSpeechToText.ts`, Web Speech API)
chứ không gửi file lên server: chữ phải hiện ra trong lúc đang nói thì mới là
tấm gương cho học sinh tự soát — chờ vài giây sau khi nói xong là mất hẳn tác
dụng. Đổi lại, Firefox không có API này nên giao diện phải nói thẳng ra.

Bản ghi chữ đi qua `/api/speaking/grade` → `server/speakingBand.ts`, dựng theo
đúng khuôn `writingBand.ts`. Ba tiêu chí FC/LR/GRA chấm được từ chữ; **Phát âm
(`P`) thì KHÔNG** — chữ không mang trọng âm, ngữ điệu hay âm cuối bị nuốt, nên
tiêu chí ấy mang cờ `needsAudio` và bị loại khỏi request. Hệ quả cố ý: kết quả
thiếu hẳn ô `P`, và `overall` là `null`. Bảng điểm vẫn vẽ ô `P` dạng gạch đứt
ghi "chưa chấm" — bỏ hẳn ô đi thì học sinh đọc ba thẻ như thể đã chấm đủ, mà
điền vào đó một con số đoán ra còn tệ hơn. Ngày có model NGHE được audio thì
nối vào `grader.grade(blob)` (vẫn là bản tạm), và đó cũng là lúc `P` có điểm.

Gửi kèm số giây, tốc độ nói và số tiếng ngập ngừng (`domain/speech.ts`) vì bản
ghi chữ trơ trọi mất hẳn chiều thời gian: 60 từ trong 20 giây và 60 từ trong 2
phút ra cùng một đoạn chữ, mà đó đúng là thứ tiêu chí Trôi chảy đo. Ba con số
ấy ĐẾM ĐƯỢC, không đoán. Danh sách tiếng ngập ngừng cố ý không có "like",
"you know", "actually": chúng vừa là từ đệm vừa là từ thật.

**Dò "đáp án có rò ra không" bằng cách tìm chuỗi đáp án trong phản hồi là
SAI.** Viết hỏng hai lần liền ở `check-practice.ts`. Với câu trắc nghiệm và
matching-headings, lựa chọn đúng BẮT BUỘC phải hiện ra mới trả lời được. Với
câu điền từ, đáp án vốn nằm trong BÀI ĐỌC — đó chính là đề bài, kỹ năng cần đo
là tìm ra nó. Cả hai đều báo đỏ mà code không sai. Thứ đáng lo là đáp án đi
KÈM ĐÚNG CÂU: chỉ cần nó nằm trong object của câu ấy là mở tab Network ghép
một phát ra cả bài. Nên so từng câu với đáp án của chính nó, sau khi bỏ
`options` ra.

Cũng ở script đó: chọn đề để kiểm phải lấy đề có NHIỀU CÂU TỰ GÕ nhất, đừng
lấy đề đầu bảng. Lần đầu chạy nó vớ phải một đề toàn trắc nghiệm rồi in "dò 0
câu" — xanh mà không kiểm gì.

**Bộ thẻ từ vựng KHÔNG GIAO thì học viên không thấy một thẻ nào.**
`ensureReviews` chỉ lấy thẻ từ bộ có dòng trong `vocab_assignments`, hoặc bộ
chính em ấy tự tạo. Bảng ấy có từ đầu và web vẫn đọc nó, nhưng suốt một thời
gian KHÔNG CHỖ NÀO tạo ra dòng giao — nên mọi bộ cô soạn đều vô hình, và
không ai báo lỗi gì. Công tắc "Giao cho cả lớp" ở `/noi-dung/tu-vung/[id]` là
chỗ duy nhất tạo dòng đó; danh sách bộ thẻ cũng cảnh báo bộ chưa giao.

Thu lại chỉ xoá dòng giao, KHÔNG đụng `vocab_reviews`: lịch ôn các em tích
luỹ được giữ nguyên, giao lại là học tiếp từ chỗ đang dở.

**Ngân hàng ý và từ gợi ý của màn Writing KHÔNG nằm trong HTML.** `WritingDesk`
tải chúng bằng `fetch("/api/practice/writing/coach")` sau khi trang đã hiện.
Kiểm bằng cách dò chữ trong HTML của trang là kiểm nhầm chỗ — phải gọi chính
route đó. Đã sai một lần ở `check-noidung.ts`.

**`openAttempt` CỐ Ý dùng lại lượt `in_progress` của cùng một đề.** Đó là cách
duy nhất đúng khi học sinh F5 hoặc mở hai tab — `expires_at` giữ nguyên nên
tải lại trang không kéo dài giờ làm bài. Hệ quả cho người viết bài kiểm: phải
dọn lượt giữa các kịch bản, nếu không kịch bản sau vớ phải lượt bỏ dở của kịch
bản trước và mọi khẳng định về `assignment_id` đều sai.

**Che kết quả KHÔNG bỏ trường `correct`.** `cheKetQua` đặt `correct`/`band`/
`accuracy` về 0 và kèm cờ `daChe`, để giao diện nói "chờ cô mở" chứ không để
học sinh nhìn 0/40 rồi tưởng mình sai hết bài. Kiểm che kết quả thì soi
`daChe`, `items[].expected` (phải rỗng), `explanation` (phải mất) và
`isCorrect` (phải mất — biết đúng/sai từng câu là suy ngược ra điểm). ĐỪNG dò
chuỗi đáp án trong cả phản hồi: `given` là thứ chính học sinh vừa gõ, dội lại
là đúng.

**Postgres `substring(... from ...)` KHÔNG hiểu `\d`.** Đo trên chính DB của
dự án: `substring('cam10-test1-stepwells' from '^(cam\d+-test\d+)-')` trả về
`NULL`, còn `[0-9]` trả về `cam10-test1`. Bẫy này đã sập HAI lần liên tiếp ở
`apps/admin`: lần đầu `\d` trong template literal bị nuốt thành `d`, lần sau
sửa bằng `String.raw` cho đúng `\d` thì vỡ vì Postgres. Cả hai lần đều im
lặng — mọi slug rơi về nhánh `COALESCE`, không câu lệnh nào báo lỗi.

Hậu quả đo được: trang giao bài dựng ra 468 mục mà học sinh bấm vào mục NÀO
cũng nhận "Không tìm thấy đề này". Giờ mẫu nằm ở `MA_DE_SQL` trong
`packages/db/src/live.ts`, dùng chung cho mọi truy vấn.

**"Mã đề" có MỘT luật, ở `packages/db`.** `maDeTuSlug` / `laMaDeTest` /
`MA_DE_SQL` phải khớp đúng `isTestId` bên `apps/web` — hàm quyết định học sinh
có mở được đề hay không. Trước đây ba nơi tự viết ba luật khác nhau (web nhận
cam/guide/train, catalog nhận thêm vol, admin chỉ cam và còn hỏng regex), nên
cô giao được thứ học sinh không mở được.

Bộ VOL cố ý đứng ngoài: slug của nó là `vol-5-test-2-passage-3`, có dấu gạch
giữa `test` và số. Route giao bài vì thế tự suy ra `scope`: có mã đề cả bài thì
`test`, không thì `paper` (giao từng passage). Thà giao lẻ còn hơn giao link chết.

**`res.text()` của fetch NUỐT BOM.** Chuẩn WHATWG bỏ BOM khi giải mã UTF-8, nên
kiểm `text.charCodeAt(0) === 0xfeff` thì không đời nào thấy, dù file có BOM
thật. Muốn kiểm BOM của file CSV thì đọc `arrayBuffer()` và soi ba byte
`EF BB BF`.

**`pointer-events-none` KHÔNG giấu được thứ gì khỏi bàn phím.** Ngăn kéo menu
mobile khi đóng chỉ có `opacity-0 translate-x-full pointer-events-none` — đo
được 16 liên kết vẫn bắt được focus, tức người dùng Tab qua một menu vô hình
mười sáu lần. Giấu khỏi cả Tab lẫn trình đọc màn hình thì dùng `inert` (React
19 nhận thẳng thuộc tính này). Cùng luật ấy cho mọi thứ "ẩn" bằng CSS.

**`aria-modal="true"` chỉ là lời khai, không giam được Tab.** Ba hộp thoại của
bài kiểm tra nền đều khai modal nhưng đo bằng PHÍM THẬT thì một cú Tab từ nút
cuối là focus rơi ra logo trang, với 20 điểm dừng phía sau vẫn vào được. Bẫy
focus nằm ở `focusDialog` trong `Diagnostic.tsx`, dùng chung cho cả ba — ref
callback của React 19 trả về được hàm dọn dẹp nên không cần thêm effect. Đo
bằng `.focus()` trong code KHÔNG chứng minh được gì ở đây: chỉ phím Tab thật
mới cho biết trình duyệt đi đâu.

**Vé phiên hết hạn không phải lỗi hệ thống.** Mặc định Auth.js ném
`JWTSessionError` ra `console.error` kèm stack trace và nguyên payload token,
tức `studentId` và `jti` của học sinh rơi vào log mỗi lần có ai để tab qua đêm.
`logger.error` trong `auth.ts` hạ riêng lỗi đó xuống một dòng `info`; mọi lỗi
khác giữ nguyên. Đo được: trang Reading từ 4 lỗi console xuống 1.

**Lenis gắn class vào `<html>` trước khi React so khớp**, nên mọi trang từng
ném một lỗi hydration. Đã đặt `suppressHydrationWarning` đúng thẻ `<html>` ở
`app/layout.tsx` (không lan xuống thẻ con). Lỗi ấy vô hại nhưng nó che mất lỗi
thật — console sạch thì lỗi mới hiện ra ngay.

**Web Speech API có mặt trong trình duyệt tự động nhưng TRƠ.** Đo được:
`SpeechRecognition` và `webkitSpeechRecognition` đều tồn tại trong Chromium của
Playwright, nhưng gọi `start()` thì sáu giây sau vẫn không có `onstart`,
`onerror` hay `onend` nào — nhận dạng thật cần dịch vụ của Google, chỉ bản
Chrome chính thức mới có. Kiểm tra bằng `'SpeechRecognition' in window` rồi kết
luận là chạy được thì sai. Cách kiểm luồng: lắp một bộ nghe giả vào chỗ
`window.SpeechRecognition`, phát lại lời một học sinh thật theo nhịp interim →
final, và mô phỏng luôn cú tự ngắt. Thứ KHÔNG kiểm được bằng cách đó là độ
chính xác nhận dạng giọng Việt — phải thử tay trên Chrome thật.

**Chốt chống bấm lặp phải là REF, không phải state.** Đã sập: nút chấm thẻ từ
vựng khoá bằng `useState` + `disabled`, đo lại vẫn ra bốn lượt cho một thẻ —
bốn cú bấm nằm trong cùng một nhịp nên cả bốn đọc state cũ là `false` trước khi
React kịp vẽ lại, mà `disabled` cũng chỉ có hiệu lực sau lần vẽ ấy. Ref đổi
ngay tại chỗ nên cú bấm thứ hai thấy liền; state giữ lại chỉ để làm mờ nút.
Bàn phím cần thêm chốt `e.repeat` vì giữ phím cũng bắn liên tục.

**Đọc–tính–ghi trên cùng một dòng thì phải có `FOR UPDATE`.** `rateCard` trong
`features/vocab/server` đọc lịch ôn, tính khoảng cách mới rồi ghi lại. Không
khoá thì hai request chồng nhau đọc cùng một `reviews_count` rồi cùng ghi đè.
Đây là lỗi IM LẶNG — không ai thấy cho tới khi lịch ôn lệch. `npm run
check:vocab` bắn 10 request cùng lúc để canh: đã thử gỡ `FOR UPDATE` và script
báo hỏng ngay (đếm được 3/10 lượt), nên nó thật sự canh được chứ không phải
một bài test luôn xanh.

## Bẫy đã sập, đừng sập lại

**Ký hiệu chỗ trống phải khớp giữa importer và giao diện.** Đề gốc viết chỗ trống theo
hai kiểu: `7……………` (số rồi dấu chấm) và `10 £ ……` (có ký hiệu tiền tệ chen giữa).
`sentenceForGap` trong `scripts/lib/ielts-doc.ts` và `GAP` trong `ui/GapText.tsx` phải
nhận cùng một tập ký hiệu. Đã hai lần sửa một bên quên bên kia. `PaperQuestion` gọi
thẳng `GapText` thay vì tự so khớp, chính là để khỏi lệch lần nữa.

**Không dùng vùng cuộn lồng nhau nữa.** Cột bài đọc, cột lọc đề và bảng bài làm bên
admin từng tự cuộn trong `div` (`max-h-*` + `overflow-y-auto` + `data-lenis-prevent`).
Đã gỡ hết: chỉ trang cuộn, phần tử con dài bao nhiêu thì cao bấy nhiêu. Lý do gỡ là
Lenis có luật `.lenis.lenis-smooth [data-lenis-prevent] { overflow: clip }` làm vùng
cuộn con mất tư cách vùng cuộn mỗi khi trang đang trôi, phải ghi đè `overflow: auto`
trong `globals.css` mới hết giật — một lớp vá chỉ tồn tại vì có cuộn lồng nhau. Thêm
vùng cuộn mới là mời lại đúng lỗi đó. Ngoại lệ hợp lệ: lớp phủ `fixed` (modal, menu
mobile) — nội dung tràn ra ngoài màn hình thì không với tới được.

**Trang thi Listening không dùng lớp phủ có thanh cuộn riêng.** Đã thử và hỏng: trang
nền vẫn cuộn theo con lăn, và bàn phím không cuộn nổi container lồng nhau (PageDown trơ
ra dù đã focus). Cách hiện tại là giấu phần còn lại của trang bằng `body.exam-mode` rồi
để bài thi cuộn như một trang bình thường.

**Một thẻ `<audio>` duy nhất, đi qua portal.** Nếu để nó bên trong nhánh "màn hướng dẫn"
hoặc "màn thi", lúc chuyển màn React sẽ tháo ra dựng lại và tiếng tắt ngay khi vào bài.

**Đừng đặt trùng `id`.** Thẻ bọc câu hỏi và ô nhập từng cùng mang `id="question-N"`,
khiến `getElementById` trả về nhầm phần tử. Câu điền từ đặt id trên ô nhập, câu trắc
nghiệm đặt trên thẻ bọc.

**DNS của RDS chập chờn.** `ENOTFOUND` khi chạy script là chuyện thường, chạy lại là
được. Đừng đi sửa code vì lỗi này.

**Kiểm tra một đề rồi suy ra cả bộ là sai.** Đã từng sửa giao diện dựa trên Cam 10 Test 1
rồi phát hiện 376/381 câu còn lại có định dạng khác. Quét cả DB trước khi kết luận.

## Nội dung đang thiếu — do nguồn, không phải do code

Nguồn là Google Drive `1wxHB3pxhP3clLBLo1dHrGstxvTP5-Ffk`. Đã kiểm tận file:

- **Cam 11 Reading Test 2, 3, 4**: chỉ có đề, không có đáp án ở bất kỳ đâu. Không nhập
  được, và **không được đoán đáp án**.
- **Giải thích đáp án**: thiếu 1758/6187 câu (đo 25/09/2026, `npm run check:reading`
  in ra từng đề). Phân bố KHÔNG như trực giác — toàn bộ VOL 1–10 và Cam 10 có đủ, còn
  **Cam 12–18, GUIDE, TRAIN 1–2 thì trống sạch**. Cam 11 chỉ thiếu 2/33. Nguyên nhân là
  file đáp án nguồn của mấy bộ kia là key trần, không phải parser bỏ sót.
  (Chú thích cũ ở đây từng ghi "chỉ Cam 10 có, 1078/1269 câu" — sai, đã đo lại.)
- **Audio Listening**: Cam 16 không có file nào; Cam 18 T4 cũng vậy. Vài đề chỉ có một
  phần — những đề đó mang cột `note` và hiện cảnh báo vàng cho học sinh.

Chạy `npm run check:coverage` để xem tình trạng hiện tại thay vì dò lại Drive.

## Hai chỗ chưa nhất quán, biết trước kẻo ngạc nhiên

- **Reading lưu mỗi passage một dòng** (468 dòng, đo 25/09/2026), còn **Listening lưu
  cả bài một dòng**. Thi cả test 60 phút thì ghép ba dòng lúc truy vấn
  (`getReadingPaper`), không đổi schema — ghép được là nhờ id câu hỏi duy nhất toàn cục
  (`cam10-t1-p2-q14`) và số câu đã đánh liền 1→40 sẵn trong dữ liệu. Làm lẻ một passage
  thì band ước lượng từ 13 câu vẫn nhiễu; làm cả test mới đủ 40 câu để quy đổi cho ra hồn.
- **Bảng trong đề Reading đã bị làm phẳng thành câu** lúc nhập, nên không dựng lại được
  đúng bảng như tài liệu gốc. Muốn có thì phải nhập lại toàn bộ.

## Nhập đề

`scripts/import-reading.ts` và `import-listening.ts` chạy theo file spec JSON viết tay,
trỏ tới toạ độ dòng trong Google Doc. `scripts/dump-doc.ts <docId>` in tài liệu kèm số
dòng để lấy toạ độ. Mọi lần importer tự xử lý một chỗ khó — mở rộng ký hiệu, bỏ câu
không nhập được — nó đều in ra một dòng cảnh báo. **Đọc những dòng đó**; lỗi nội dung
không làm gì crash cả.

Đã bỏ qua theo yêu cầu: dạng "Choose TWO letters" và dạng nhìn bản đồ/hình.

## Kiểm thử trải nghiệm

`tools/user-sim/` chứa 10 persona học sinh ảo. Playwright lái trình duyệt sinh ra **sự
thật** (điểm, lỗi HTTP, kích thước phần tử); TinyTroupe đóng vai học sinh sinh ra **ý
kiến**, chỉ dựa trên bằng chứng đó. Nhận xét của persona phải đọc kèm bằng chứng — đã
đo được 3/6 bạn hiểu sai số liệu và đòi sửa thứ vốn đã đúng.

## Thói quen làm việc ở dự án này

- Đo trước khi kết luận. Nhiều lỗi ở đây chỉ hiện ra với thao tác chuột thật
  (`page.mouse.wheel`), gọi hàm bằng code không tái hiện được.
- Chạy `npm run check:*` sau khi đụng vào dữ liệu đề. Lỗi nội dung là lỗi im lặng.
- Viết commit message bằng tiếng Việt, nói **vì sao** chứ không chỉ nói đã đổi gì.
