# Ghi nhận review tài liệu ôn tập

Ngày review: **02/11/2026**. Phạm vi: **93 bài trong 14 module**, gồm giải thích, ví dụ, pitfalls và đáp án phỏng vấn. Chỉnh trực tiếp các điểm sai, thiếu assumptions, mâu thuẫn với ví dụ hoặc phụ thuộc phiên bản; giữ nội dung phù hợp khi không phát hiện lỗi. Đây là review tài liệu học, không phải security audit một ứng dụng.

## Phạm vi theo module

Cột chỉnh sửa gồm cả sửa kỹ thuật, bổ sung giải thích và xóa bullet lặp; không có nghĩa mọi file chỉnh sửa đều chứa lỗi kỹ thuật.

| Module | Bài đã review | Bài chỉnh sửa |
|---|---:|---:|
| [01-fundamentals](01-fundamentals/) | 7/7 | 7 |
| [02-php](02-php/) | 12/12 | 9 |
| [03-nodejs](03-nodejs/) | 10/10 | 7 |
| [04-javascript-typescript](04-javascript-typescript/) | 6/6 | 3 |
| [05-react](05-react/) | 8/8 | 6 |
| [06-vue](06-vue/) | 7/7 | 6 |
| [07-database](07-database/) | 7/7 | 4 |
| [08-api-design](08-api-design/) | 5/5 | 5 |
| [09-system-design](09-system-design/) | 8/8 | 8 |
| [10-security](10-security/) | 3/3 | 3 |
| [11-testing-quality](11-testing-quality/) | 3/3 | 2 |
| [12-devops-cloud](12-devops-cloud/) | 6/6 | 6 |
| [13-soft-skills-leadership](13-soft-skills-leadership/) | 5/5 | 5 |
| [14-interview-cv](14-interview-cv/) | 6/6 | 6 |

## Các thay đổi đáng chú ý

- **Fundamentals**: phân biệt O/Ω/Θ, worst-case/expected/amortized; thêm linked list, assumptions cho hash map và giới hạn ECMAScript Map; sửa ví dụ Set.map; làm rõ DP/sliding window với số âm. Sửa registry Strategy nhận nhầm inherited keys, framing/cleanup SSE và ví dụ race có output xác định.
- **PHP**: sửa new self với abstract class, ngoại lệ readonly cloning, lockfile library, PSR-7 mutable body stream, error_reporting/custom handler, copy-on-write và CSV escape/column count. Bổ sung Greeter còn thiếu trong ví dụ Composer. Làm rõ FPM tái sử dụng worker, giới hạn afterCommit và ví dụ tính tiền bằng float chỉ dành cho minh họa.
- **Node.js/JS/TS**: sửa đáp án thứ tự ESM/CJS; bổ sung syntax detection/require(esm) theo mốc Node. Stream copy từ chối ghi đè file có sẵn; parser profile validate locale; allSettled example xử lý cả synchronous throw. Phân biệt structuredClone platform API, object/array spread và strict flags.
- **React/Vue**: sửa online status hook cho SSR/hydration bằng useSyncExternalStore; phân biệt layout/passive effects và ngoại lệ use của React 19; làm rõ Client Component/module boundary. Sửa watch/fetch cancellation/error và ResizeObserver với v-if; ghi mốc Next.js 15 và Nuxt 3.17 cho ví dụ.
- **Database/API/System Design**: sửa tie semantics RANK/DENSE_RANK, output ordering và kiểm tra hai phía chuyển tiền. Làm rõ CAP, keyset không phải snapshot, cache write-through không tự atomic giữa DB/Redis, queue delivery không bảo đảm completion order. Sửa saga compensation, outbox state guard và retry helper. OpenAPI thêm info và sửa YAML; JWT bắt buộc exp/sub và làm rõ key entropy, OAuth state/mix-up/refresh replay.
- **Security**: cập nhật taxonomy theo [OWASP Top 10:2025](https://top10.owasp.org/2025/); phân biệt hashing với khả năng dò password, lựa chọn Argon2id/scrypt/bcrypt và giới hạn bcrypt. Sửa CORS Vary ở cả response không được allowlist, giữ Vary đã có và làm rõ wildcard/credentials.
- **Testing/DevOps**: sửa toàn bộ YAML tabs; workflow image job có checkout riêng và tách job dependency khỏi artifact sharing; SHA tag không được gọi là immutable digest. Nginx khai báo upstream HTTP/keepalive; phân biệt RDS Multi-AZ DB instance/cluster; rebase --continue chỉ dùng khi đang có rebase bị dừng.
- **Leadership/Interview**: phân biệt Definition of Done/Ready và accountabilities/commitments trong Scrum. Thêm ma trận câu hỏi đủ 14 module; đổi section 7 của module Interview/CV thành bài tập áp dụng, bỏ gợi ý đưa số liệu luyện phỏng vấn vào CV. Xóa bullet trùng nguyên văn và sửa hướng dẫn/template để ghi rõ version, context và evidence.

Official sources cho các điểm thay đổi quan trọng được thêm trong phần tham khảo của bài tương ứng. Không xác nhận rằng mọi external link cũ còn truy cập được hoặc mọi phiên bản minh họa còn trong thời hạn hỗ trợ.

## Kiểm chứng đã thực hiện

| Kiểm tra | Kết quả |
|---|---|
| JavaScript syntax bằng node --check | 27 code blocks qua |
| PHP syntax bằng PHP 8.3 CLI -l | 15 code blocks qua |
| TypeScript/script Vue | 10 TS + 6 script Vue parse sau khi strip types; **không phải TypeScript typecheck** |
| JSON/YAML | 1 JSON + 4 YAML parse thành công; YAML dùng spaces |
| Kiểm tra hành vi JavaScript | 13 nhóm qua: frequency/NaN, sliding window/biên/số âm, Strategy inherited keys, race, allSettled synchronous failure, SSE framing/backpressure/close, profile validation, ESM/CJS order, stream copy/same-file protection, retry, Money, state transitions, CORS Vary |
| PHP runtime | Ví dụ PHP features, late static binding, benchmark CLI chạy thành công trên PHP 8.3; CSV quoted/multiline và malformed column count qua |
| SQL window | Top-3/order/tie-break qua SQLite fixture với cú pháp window tương thích; **không phải integration test PostgreSQL/MySQL** |
| Markdown | Đủ 8 section đúng thứ tự và details cân bằng cho 93 bài; kiểm tra link file nội bộ |
| Static site | npm run build sinh đủ 93 bài/14 module; git diff --check |

Các kiểm tra snippet là kiểm tra một lần trong thư mục tạm; không thêm test framework hoặc dependency vào repo. Node thực thi kiểm tra là v26.13.0; mốc Node 22 trong bài được review theo semantics tài liệu, không chạy lại bằng Node 22.

## Giới hạn kiểm chứng

- 9 code blocks JSX/TSX được review tĩnh, chưa compile bằng React/TypeScript toolchain.
- Chưa mount/run ứng dụng Vue/Nuxt/Next/Laravel hoàn chỉnh, chưa chạy PHPUnit/Vitest/Playwright hay provider thanh toán/AWS thật. Script Vue syntax check không thay SFC/template compilation hoặc lifecycle integration test.
- Chưa chạy integration trên PostgreSQL/MySQL/MongoDB/Redis/broker; SQL có application placeholders, schema/context và transaction checks được giải thích trong bài.
- Chưa chạy GitHub Actions, Docker/Kubernetes, nginx -t hoặc Prometheus rule evaluation. YAML parse không xác nhận quyền CI, image build, schema OpenAPI đầy đủ hay cấu hình hạ tầng deploy được.
- Không thực hiện benchmark để xác nhận số liệu CV; mọi [A]/[B]/[N] vẫn là placeholder và cần bằng chứng cá nhân.
