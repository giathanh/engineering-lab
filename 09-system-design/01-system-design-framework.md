# Phương pháp trả lời câu hỏi system design (framework từng bước)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Bắt đầu bằng clarification và scope; không vẽ architecture trước khi hiểu users, scale, latency, consistency và constraints.
- Chuyển yêu cầu thành functional/non-functional requirements, estimates và measurable SLOs.
- Thiết kế API/data model, request flow và high-level components trước; đào sâu bottleneck/risk quan trọng nhất.
- Nêu trade-offs, failure modes, security/operations và evolution path; không có một architecture “đúng” nếu assumptions khác nhau.
- Interview là collaborative reasoning: trình bày assumptions, giữ timebox và điều chỉnh khi interviewer thay constraint.

## 2. Khái niệm cốt lõi

Framework có thể dùng 6 bước:

1. **Clarify**: actors, core use cases, read/write paths, scope exclusions, privacy/tenant boundaries.
2. **Requirements/SLO**: availability, latency p95/p99, durability, freshness, retention, consistency, compliance.
3. **Estimate**: DAU/peak RPS, read/write ratio, payload/storage growth, bandwidth, fan-out. Ước lượng order-of-magnitude, ghi assumptions.
4. **API + data model**: resource/operations, identifiers, access patterns, invariants, idempotency.
5. **Architecture**: request flow, storage/cache/queue, partitioning and scaling boundaries; draw one end-to-end path.
6. **Deep dive/trade-offs**: bottleneck, failure behavior, security, observability, deployment, cost and evolution.

Numbers guide design. Peak RPS can be approximated as daily requests / seconds per day × peak factor; storage as writes/day × average record size × retention × replication/index overhead. Estimates need sanity checks and uncertainty ranges. Avoid false precision from invented numbers.

Architecture diagram should show trust/data boundaries and synchronous vs asynchronous paths. For each dependency ask: timeout? retry? duplicate? unavailable? backpressure? data loss? recovery? Operational requirements are design requirements: backups, restore, alerting, deploy/rollback and on-call ownership.

## 3. Code ví dụ

Example design artifact: API contract for a URL shortener must define idempotency, lookup and expiry semantics before choosing cache/database.

```http
POST /v1/links HTTP/1.1
Host: api.example.test
Idempotency-Key: 6d5f...
Content-Type: application/json

{"url":"https://example.com/article","expiresAt":"2026-12-01T00:00:00Z"}
```

```http
HTTP/1.1 201 Created
Location: https://sho.rt/aB3x
Content-Type: application/json

{"code":"aB3x","shortUrl":"https://sho.rt/aB3x"}
```

Then clarify redirect status, duplicate creation policy, abuse checks, click analytics and expiry cleanup. Those answers change data model, cacheability and async pipeline.

## 4. Trade-off & Best practices

- State assumptions explicitly and ask only questions that can change architecture; proceed with reasonable defaults when interview time is short.
- Start simple, identify scaling pressure using estimates, then evolve a component. Avoid premature microservices/sharding.
- Make one primary design recommendation, then compare alternatives by latency, consistency, complexity, cost and operational risk.
- Keep diagrams legible and narrate request/write/read paths; quantify expected bottleneck and mitigation.
- Separate durable source of truth from cache/search/read models; define consistency and rebuild/reconciliation strategy.
- Include abuse/security (authz, rate limits, input validation, secrets), not only happy-path throughput.
- Reserve time to summarize decisions, failure modes and open assumptions.
- Một câu trả lời có cấu trúc thường thể hiện cả steady state và degraded mode: dependency chậm, zone mất, queue tăng, dữ liệu stale. Nêu cách phát hiện (metrics/alerts), cách giới hạn blast radius và điều kiện phục hồi; chỉ thêm component khi nó xử lý failure mode cụ thể.
- Quản lý bảng/diagram theo thời gian: dành phần đầu cho context, phần giữa cho flow, cuối cùng cho deep dive có chọn lọc. Nếu interviewer thay traffic hoặc consistency requirement, nói rõ component nào đổi và component nào vẫn giữ nguyên.

## 5. Lỗi thường gặp / Pitfalls

- Jump straight to Kafka/Kubernetes before defining requirements.
- Quote exact traffic/storage figures without showing assumptions or peak factors.
- Draw boxes without explaining data ownership, API contracts or failure behavior.
- Claim “horizontal scale” while keeping local session/filesystem/state assumptions.
- Ignore cost, operability, migration and team ownership.
- Over-design for hypothetical scale while missing current bottleneck or consistency requirement.
- Treat CAP as a one-line answer instead of explaining operation-level behavior during partition.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Bạn bắt đầu system design prompt thế nào?</b></summary>

Clarify users/use cases, scope, scale, SLO/consistency and constraints; state assumptions before choosing components.

</details>

<details>
<summary><b>Q2. Ước lượng traffic/storage để làm gì?</b></summary>

Định hướng capacity, partition/cache/queue choices và tìm bottleneck. Dùng order-of-magnitude với peak factor, không tạo precision giả.

</details>

<details>
<summary><b>Q3. Khi nào deep dive một component?</b></summary>

Khi component là bottleneck, consistency/security risk hoặc interviewer yêu cầu. Chọn theo requirements đã xác định.

</details>

<details>
<summary><b>Q4. Làm sao trình bày trade-off tốt?</b></summary>

So sánh theo explicit criteria (latency, consistency, cost, complexity, failure mode), đưa recommendation và nói assumption nào khiến lựa chọn đổi.

</details>

<details>
<summary><b>Q5. Vì sao cần thiết kế failure path?</b></summary>

Dependencies fail thường xuyên hơn architecture diagrams thể hiện; timeout/retry/idempotency/recovery quyết định correctness và cascading failures.

</details>

## 7. Ứng dụng vào CV

- Dẫn dắt design review cho **[system]** với capacity/SLO assumptions, thống nhất trade-offs giữa **[options]** và giảm rework **[A]%**.
- Thiết kế evolution path từ **[baseline]** tới **[scale target]**, đạt **[latency/availability]** với cost **[metric]**.

## 8. Tài liệu tham khảo

- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [Google SRE: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [ByteByteGo: System Design Interview](https://bytebytego.com/)

