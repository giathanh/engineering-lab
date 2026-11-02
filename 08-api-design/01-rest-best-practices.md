# REST best practices: naming, status code, versioning, pagination, idempotency

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- REST API thiết kế resource-oriented URLs, HTTP method semantics, status codes và representation contract nhất quán.
- Idempotency liên quan effect của request lặp; `PUT`/`DELETE` có semantics idempotent theo HTTP, `POST` thường cần key cho retry-safe creation/payment.
- Pagination nên có deterministic ordering; cursor/keyset ổn định hơn offset khi dataset lớn/thay đổi liên tục.
- Versioning qua path/header/media type đều có trade-off; ưu tiên backward-compatible additive evolution trước major version.
- API contract gồm validation/errors, auth, rate limits, observability, deprecation và compatibility—not chỉ endpoint naming.

## 2. Khái niệm cốt lõi

Resource URL dùng nouns/relationships (`/orders/{id}/items`), HTTP method biểu đạt intent: GET safe/read, POST create/action, PUT replace, PATCH partial update, DELETE remove. Semantics/idempotency không đồng nghĩa implementation luôn có thể retry mù; timeout có thể xảy ra sau khi server commit. Status codes: 2xx success, 4xx client/request issue, 5xx server/dependency failure; `202 Accepted` nghĩa async processing chưa hoàn tất, `409 Conflict` cho state conflict, `422` thường validation/domain input theo API convention.

Representation nên có schema rõ, timestamps/IDs consistent, enum policy và nullable semantics. Error response nên có stable machine-readable code, message safe, field errors và request/correlation ID; không trả stack/SQL. Validation ở boundary và authorization tại resource/action.

Offset pagination dễ implement nhưng cost tăng với offset lớn và concurrent inserts có thể duplicate/skip rows. Cursor pagination encode stable sort key(s) (e.g. created_at+id), thường dùng keyset condition; opaque cursor không phải auth token. Ordering phải deterministic. Page size có upper bound.

Idempotency key được client gửi cho operation có side effect; server lưu key + request fingerprint + result trong transaction để duplicate requests trả cùng outcome. TTL/ownership/replay conflict semantics cần rõ. Versioning URL dễ vận hành nhưng tạo parallel surfaces; header/media type tinh tế hơn nhưng khó inspect. Deprecation policy cần telemetry consumer, communication và sunset timeline.

## 3. Code ví dụ

Keyset pagination theo cặp `(created_at, id)` để có thứ tự ổn định; cú pháp gần PostgreSQL.

```sql
SELECT id, created_at, total
FROM orders
WHERE (created_at, id) < (:cursor_time, :cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT :page_size;
```

Initial page bỏ điều kiện cursor; index composite `(created_at DESC, id DESC)` phù hợp access pattern. API mã hóa cursor opaque, validate page size và không cho client tùy ý chọn query expressions.

## 4. Trade-off & Best practices

- Dùng nouns, plural resource names, consistent casing; action endpoint chỉ khi operation không map tự nhiên thành CRUD/resource transition.
- Bảo đảm status code và error envelope thống nhất; phân biệt validation, authorization, conflict, rate-limit và dependency failure.
- Ưu tiên additive evolution; version breaking changes có deprecation period và consumer usage telemetry.
- Dùng cursor pagination cho large/changing datasets; offset hợp admin/small collections cần jump-to-page.
- Với retryable side effects, persist idempotency key cùng operation result atomic; detect same key/different payload.
- Đặt limits cho body/page/filter complexity; authorize theo object-level policy, không chỉ route.
- Document examples, auth scopes, errors, pagination and rate limits bằng OpenAPI/contract tests.

## 5. Lỗi thường gặp / Pitfalls

- Retry `POST` sau timeout mà không biết server đã commit, tạo duplicate side effect.
- Pagination không có stable tie-breaker, dẫn records lặp/mất giữa pages.
- Trả HTTP 200 cho mọi lỗi với error string trong body.
- Dùng `PUT` như partial update nhưng document không rõ semantics.
- Expose internal DB schema/stack trace thành API contract.
- Thay field type/remove field trong deploy mà không migration/compatibility phase.
- Idempotency store không atomic với business transaction hoặc thiếu TTL/tenant scope.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Idempotent request nghĩa là gì?</b></summary>

Gửi cùng request nhiều lần có cùng intended effect như một lần. HTTP method semantics hỗ trợ một số trường hợp; side effects như charge cần idempotency key và server-side deduplication.

</details>

<details>
<summary><b>Q2. Khi nào dùng cursor pagination?</b></summary>

Dataset lớn/thay đổi liên tục và cần traversal ổn định; keyset tránh offset scan lớn. Cần stable ordering và cursor validation.

</details>

<details>
<summary><b>Q3. 202 Accepted khác 200?</b></summary>

202 báo request được nhận để xử lý nhưng chưa hoàn tất; response thường cần operation/status URL hoặc callback semantics.

</details>

<details>
<summary><b>Q4. Version API khi nào?</b></summary>

Khi change phá compatibility và không thể migrate theo additive/expand-contract. Versioning cần support/deprecation policy, không chỉ thêm số vào URL.

</details>

<details>
<summary><b>Q5. Idempotency key storage cần đảm bảo gì?</b></summary>

Atomic claim với operation, request fingerprint match, scoped tenant/user, replay result ổn định và retention/expiry rõ.

</details>

## 7. Ứng dụng vào CV

- Chuẩn hóa REST contracts, cursor pagination và idempotency cho **[N]** endpoints, giảm duplicate operations **[A]%**.
- Thiết kế API deprecation/compatibility workflow, migrate **[N]** consumers không downtime và giảm breaking incidents **[B]%**.

## 8. Tài liệu tham khảo

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [Google API Design Guide](https://cloud.google.com/apis/design)
- [Stripe: Idempotent requests](https://docs.stripe.com/api/idempotent_requests)

