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

**Kiến trúc phân lớp** trong `features/practice`: `domain/` thuần (không React, không
fetch, không `pg`) ← `application/` (hook, không JSX) ← `infrastructure/` (fetch) /
`server/` (SQL) / `ui/` (chỉ vẽ). Giữ hướng phụ thuộc một chiều này.

## Bẫy đã sập, đừng sập lại

**Ký hiệu chỗ trống phải khớp giữa importer và giao diện.** Đề gốc viết chỗ trống theo
hai kiểu: `7……………` (số rồi dấu chấm) và `10 £ ……` (có ký hiệu tiền tệ chen giữa).
`sentenceForGap` trong `scripts/lib/ielts-doc.ts` và `GAP` trong `ui/GapText.tsx` phải
nhận cùng một tập ký hiệu. Đã hai lần sửa một bên quên bên kia. `PaperQuestion` gọi
thẳng `GapText` thay vì tự so khớp, chính là để khỏi lệch lần nữa.

**Lenis phá vùng cuộn lồng nhau.** Thư viện cuộn mượt có luật
`.lenis.lenis-smooth [data-lenis-prevent] { overflow: clip }`, làm cột bài đọc mất tư
cách vùng cuộn mỗi khi trang đang trôi, kéo theo mất vị trí cuộn. `globals.css` ghi đè
lại thành `overflow: auto`. Đừng gỡ.

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
  cả bài một dòng**. Vì vậy chưa làm được đề Reading 60 phút trọn vẹn, và band ước lượng
  từ 13 câu thì nhiễu.
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
