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
npm run migrate          # tạo/cập nhật schema, chạy lại nhiều lần vẫn an toàn
```

Monorepo npm workspaces: `apps/web` (trang chính), `apps/admin` (trang quản trị),
`packages/db` (pool Postgres dùng chung). Cấu hình DB nằm ở `apps/web/.env.local`
(xem `.env.example`). Máy dev đang chạy Windows; các script viết bằng `tsx`.

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
- **Giải thích đáp án**: chỉ Cam 10 có. Cam 12–18 file đáp án là key trần, nên
  1078/1269 câu Reading không có giải thích. Không phải parser bỏ sót.
- **Audio Listening**: Cam 16 không có file nào; Cam 18 T4 cũng vậy. Vài đề chỉ có một
  phần — những đề đó mang cột `note` và hiện cảnh báo vàng cho học sinh.

Chạy `npm run check:coverage` để xem tình trạng hiện tại thay vì dò lại Drive.

## Hai chỗ chưa nhất quán, biết trước kẻo ngạc nhiên

- **Reading lưu mỗi passage một dòng** (99 dòng = 33 đề × 3 passage), còn **Listening lưu
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
