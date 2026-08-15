# thuong-ielts

Trang luyện thi IELTS của cô Hồ Ngọc Thương: giới thiệu khoá học, kết quả học viên, và
mục **Kiểm tra kiến thức** — bộ đề Reading/Listening có bấm giờ, chấm điểm tự động và
quy đổi band.

## Chạy trên máy

**Cần có:** Node.js 20+, một database Postgres.

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # rồi điền thông tin Postgres
npm run migrate                                 # tạo bảng
npm run dev:web                                 # http://localhost:2000
```

`apps/admin` là trang quản trị, chạy bằng `npm run dev:admin`.

## Cấu trúc

Monorepo npm workspaces:

| Thư mục | Nội dung |
|---|---|
| `apps/web` | Trang chính (Next.js App Router) |
| `apps/admin` | Trang quản trị nội dung |
| `packages/db` | Pool kết nối Postgres dùng chung |
| `scripts` | Nhập đề từ Google Docs, migration, script kiểm tra dữ liệu |
| `tools/user-sim` | Bộ giả lập học sinh để dò lỗi trải nghiệm |

## Lệnh hay dùng

```bash
npm run check:reading     # kiểm tra tính hợp lệ của đề đọc trong DB
npm run check:listening   # kiểm tra đề nghe
npm run check:coverage    # thống kê còn thiếu đề nào
npm run build:web         # build production
```

## Dữ liệu đề thi

Nội dung đề nằm hoàn toàn trong Postgres, không có file seed trong repo. Đề được nhập từ
Google Docs bằng các script trong `scripts/`. Chi tiết cách nhập, các quyết định thiết kế
và những chỗ dữ liệu còn thiếu: xem [CLAUDE.md](CLAUDE.md).
