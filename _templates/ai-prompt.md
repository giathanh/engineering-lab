# Prompt mẫu giao cho AI viết nội dung

Copy prompt dưới đây, thay `<TÊN BÀI>` và `<MODULE>` (lấy từ README.md), rồi dán nội dung của
[topic-template.md](topic-template.md) vào chỗ `<TEMPLATE>`. Kết quả AI trả về dán đè vào file tương ứng.

---

```
Bạn là Senior Fullstack Engineer (PHP/Laravel, Node.js, React, Vue) kiêm technical interviewer.
Hãy viết bài ôn tập cho chủ đề: "<TÊN BÀI>" thuộc module "<MODULE>".

Đối tượng: developer đang ôn tập để phỏng vấn vị trí Senior.

Yêu cầu:
- Viết bằng tiếng Việt, giữ nguyên thuật ngữ kỹ thuật tiếng Anh.
- Tuân thủ ĐÚNG template markdown bên dưới (đủ 8 section, giữ nguyên thứ tự và tiêu đề).
- Tập trung vào bản chất, cơ chế bên trong, trade-off, kinh nghiệm thực tế; bỏ qua cú pháp cơ bản.
- Code ví dụ dùng phiên bản hiện hành (PHP 8.3+, Laravel 11+, Node 22+, TypeScript 5+, React 19, Vue 3.5+).
- Code ví dụ phải chạy được, ngắn gọn, có comment.
- Section "Câu hỏi phỏng vấn": 5–10 câu hay gặp thực tế ở level senior, đáp án ngắn gọn, đặt trong thẻ <details>.
- Section "Ứng dụng vào CV": 1–2 bullet theo kiểu impact-based (động từ mạnh + việc làm + kết quả có số liệu).
- Độ dài: 800–2000 từ.
- Chỉ trả về nội dung markdown của bài, không thêm lời dẫn.

Template:
<TEMPLATE>
```

---

## Prompt kiểm tra lại (tùy chọn)

```
Hãy review bài ôn tập dưới đây như một senior interviewer khó tính:
1. Có thông tin nào sai hoặc lỗi thời không? Sửa lại.
2. Còn thiếu câu hỏi phỏng vấn quan trọng nào hay gặp không? Bổ sung.
3. Code ví dụ có lỗi không?
Trả về bản đã chỉnh sửa hoàn chỉnh.

<NỘI DUNG BÀI>
```
