# Giả lập học sinh dùng thử web

Bộ công cụ để "cho học sinh ảo" vào làm bài rồi lấy nhận xét, dùng khi muốn tìm chỗ vướng
trước khi đưa cho học viên thật.

## Chia làm hai nửa, và đây là điểm quan trọng nhất

| Nửa | Công cụ | Sinh ra |
|---|---|---|
| Làm bài trên web | Playwright (qua Claude Code) | **Sự thật**: điểm số, lỗi HTTP, kích thước phần tử, cái gì mất khi tải lại |
| Đóng vai học sinh nhận xét | TinyTroupe (Python) | **Ý kiến**: chỗ nào bực, muốn sửa gì trước |

Persona **không tự dùng web**. Nó chỉ được đọc `evidence/run-*.json` — đúng những gì
Playwright quan sát được — rồi phản ứng.

Lý do phải tách như vậy: các nghiên cứu 2026 về LLM đóng vai người dùng đều cho thấy model
rất hay gật gù, hỏi "trang này ổn không" là nó khen, và persona không giữ ổn định qua các
lượt. Nếu để model tự tưởng tượng mình đã dùng web, nó sẽ tả một app không tồn tại. Neo mọi
nhận xét vào bằng chứng đã đo được là cách chặn chuyện đó.

## Chạy

**Nửa 1 — thu bằng chứng.** Bật dev server rồi nhờ Claude Code chạy các kịch bản trong
`personas.json` (trường `scenario`) bằng Playwright, ghi kết quả vào
`evidence/run-<ngày>.json`. Chỉ ghi việc quan sát được, không ghi ý kiến.

**Nửa 2 — lấy nhận xét.**

```bash
pip install -r requirements.txt
export OPENAI_API_KEY=    # TinyTroupe cần model riêng
python feedback.py               # tự lấy file evidence mới nhất
```

Nhận xét ghi ra `evidence/feedback-<ngày>.json` (đã gitignore vì mỗi lần chạy một khác).

## Thứ công cụ này KHÔNG làm được

- **Không nghe được audio.** Chỉ biết file tải về được hay không, không biết tiếng có rõ,
  có đúng bài không.
- **Không đánh giá được độ khó** của đề so với trình độ học sinh thật.
- **Không thay được học viên thật** cho câu hỏi về cảm nhận, thẩm mỹ, mức độ hài lòng.

Dùng nó để tìm *vướng mắc chức năng*. Còn *"học sinh có thích không"* thì phải hỏi người thật.
