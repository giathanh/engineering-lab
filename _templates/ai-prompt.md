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
- Tuân thủ ĐÚNG template markdown bên dưới (đủ 8 section, giữ nguyên thứ tự; module Interview/CV có thể đổi section 7 thành "Áp dụng thực tế").
- Tập trung vào bản chất, cơ chế bên trong, trade-off, kinh nghiệm thực tế; bỏ qua cú pháp cơ bản.
- Ghi rõ phiên bản mục tiêu đã kiểm tra. PHP 8.3, Laravel 11, Node 22, TypeScript 5, React 19, Vue 3.5 là mốc minh họa, không mặc định là phiên bản hiện hành. Đối chiếu tài liệu chính thức cho API/default thay đổi theo phiên bản.
- Code ví dụ phải đúng cú pháp và behavior, ngắn gọn, có comment; ghi đủ dependencies/context hoặc đánh dấu pseudocode. YAML dùng spaces, không dùng tabs. Nêu assumptions và giới hạn của ví dụ.
- Section "Câu hỏi phỏng vấn": 5–10 câu hay gặp thực tế ở level senior, đáp án ngắn gọn, đặt trong thẻ <details>.
- Section "Ứng dụng vào CV": 1–2 khung bullet với placeholders [A]/[N], chỉ điền evidence thật; không bịa metrics/causality. Module Interview/CV dùng bài tập áp dụng thay bullet CV về luyện phỏng vấn.
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
3. Code ví dụ có lỗi không? Kiểm tra syntax, output, boundary/error paths, concurrency và lifecycle; ghi rõ phần nào thực sự đã chạy.
4. Phân biệt guarantees của đặc tả với implementation thường gặp; đối chiếu đáp án với phần giải thích và thêm official source cho thay đổi.
5. Xóa đoạn lặp nguyên văn; không biến mẫu CV hoặc lời khuyên theo context thành đảm bảo kết quả.
Trả về bản đã chỉnh sửa hoàn chỉnh.

<NỘI DUNG BÀI>
```
