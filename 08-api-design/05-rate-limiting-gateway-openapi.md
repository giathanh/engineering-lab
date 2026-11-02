# Rate limiting, API gateway, documentation (OpenAPI)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Rate limiting bảo vệ capacity/fairness; quota key có thể theo user, API key, tenant, route hoặc IP, với spoofing/trust boundary được tính đến.
- Fixed window đơn giản nhưng burst ở biên; sliding window/token bucket cho phép kiểm soát burst/smoothness với state/cost khác nhau.
- Distributed limit cần atomic shared counter/algorithm và policy khi limiter backend lỗi; per-process counters không enforce global quota.
- API gateway xử lý edge concerns như routing, TLS, auth integration, rate limits và observability; không thay domain authorization.
- OpenAPI là contract máy đọc được cho docs/codegen/validation; phải version, lint, test và đồng bộ với runtime behavior.

## 2. Khái niệm cốt lõi

Fixed window đếm requests theo interval, dễ triển khai nhưng client có thể gửi gần 2× limit quanh boundary. Sliding log chính xác nhưng lưu timestamps; sliding counter/window approximation giảm state. Token bucket tích token theo rate tới capacity B, cho phép burst tối đa bucket rồi giới hạn long-term rate; leaky bucket xử lý output đều hơn. Limit dimensions cần reflect cost: endpoint đắt có quota thấp/weighted units.

Distributed API instances cần shared atomic state (Redis script/atomic operation hoặc gateway) để global limits; network latency, hot keys, failover và limiter availability là trade-offs. Fail-open giữ availability nhưng có thể overload; fail-closed bảo vệ dependency nhưng làm API unavailable. Rate-limit response thường dùng HTTP 429 cùng `Retry-After`/rate-limit headers; không tiết lộ internal limits vượt mức cần thiết.

Gateway là reverse proxy/API entry point, có thể centralize TLS termination, routing, authentication, rate limiting, request size/timeouts, transformations, metrics. Gateway thêm hop/latency/config blast radius và không nên tích lũy business logic phức tạp. Identity từ gateway phải được bảo vệ giữa hops; backend vẫn enforce object/tenant authorization.

OpenAPI mô tả paths, operations, parameters, request/response schemas, security schemes và errors. Contract dùng generate docs/clients/servers, mock servers và contract tests. Spec drift xảy ra khi runtime đổi nhưng schema không cập nhật; CI lint/diff breaking changes và integration tests giảm risk.

## 3. Code ví dụ

OpenAPI 3.1 operation với bearer authentication (không khai báo OAuth scope), bounded pagination và response errors.

```yaml
openapi: 3.1.0
info:
  title: Orders API
  version: 1.0.0
paths:
  /v1/orders:
    get:
      operationId: listOrders
      security:
        - bearerAuth: []
      parameters:
        - name: limit
          in: query
          schema: { type: integer, minimum: 1, maximum: 100, default: 25 }
      responses:
        '200':
          description: A page of orders
        '401':
          description: Authentication required
        '429':
          description: Rate limit exceeded
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
```

Thêm schemas cho request/response/errors thực tế; generated client không thay runtime validation hoặc backward-compatibility policy.

## 4. Trade-off & Best practices

- Chọn algorithm theo burst tolerance, fairness, accuracy và distributed state cost; limit theo route cost và tenant plan.
- Trust `X-Forwarded-For` chỉ từ configured proxy hops; IP header do client gửi trực tiếp có thể bị spoof.
- Trả 429 consistent headers/body, monitor rejected requests và bảo vệ limiter backend khỏi hot-key concentration.
- Xác định fail-open/closed theo endpoint criticality; có fallback local emergency limit nếu phù hợp.
- Giữ gateway config versioned, reviewed, staged và có rollback; tránh business branching phức tạp ở edge.
- OpenAPI spec là source/contract có owner; lint, breaking-change diff, examples và consumer contract tests trong CI.
- Giới hạn body, request duration, concurrency và downstream timeout song song với rate limit.

## 5. Lỗi thường gặp / Pitfalls

- Dùng in-memory limiter trên nhiều instances, quota thực tế nhân lên theo replica count.
- Limit chỉ theo IP khi clients dùng NAT/shared proxies hoặc IP header không tin cậy.
- Fixed window tạo boundary bursts làm downstream vẫn quá tải.
- Gateway xác thực token nhưng backend không authorize object ownership.
- Bỏ limiter backend error behavior, gây fail-open outage hoặc fail-closed toàn hệ thống.
- OpenAPI response schema/status không khớp runtime và generated clients.
- Dùng generated API docs như security review hoặc runtime validation.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Token bucket khác fixed window?</b></summary>

Token bucket tích token theo thời gian và cho burst giới hạn capacity; fixed window đếm theo interval và có thể burst ở window boundary.

</details>

<details>
<summary><b>Q2. Vì sao per-process rate limit không đủ?</b></summary>

Mỗi instance giữ counter riêng nên tổng quota tăng theo số replicas và failover/reset ảnh hưởng state. Global limits cần shared atomic store/gateway.

</details>

<details>
<summary><b>Q3. Fail-open hay fail-closed khi limiter lỗi?</b></summary>

Tùy endpoint risk: fail-open giữ availability nhưng có thể quá tải; fail-closed bảo vệ resource nhưng làm API phụ thuộc limiter. Document policy và alert.

</details>

<details>
<summary><b>Q4. API gateway có thay authz service?</b></summary>

Không. Gateway có thể authenticate/routing policy; application/data layer vẫn cần object-level authorization và tenant checks.

</details>

<details>
<summary><b>Q5. Làm sao giảm OpenAPI drift?</b></summary>

Review spec cùng code, lint/schema validation, generated client/contract tests và CI breaking-change detection; assign ownership cho spec.

</details>

## 7. Ứng dụng vào CV

- Triển khai distributed token-bucket limits cho **[N]** tenants, giảm overload **[A]%** trong peak traffic mà vẫn giữ fairness.
- Đưa OpenAPI lint/breaking checks vào CI cho **[N]** services, giảm consumer integration defects **[A]%**.

## 8. Tài liệu tham khảo

- [IETF RFC 6585: 429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Envoy: Global rate limiting](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_features/global_rate_limiting)
- [Google API Design Guide](https://cloud.google.com/apis/design)

- [OpenAPI 3.1.0 Specification](https://spec.openapis.org/oas/v3.1.0)
