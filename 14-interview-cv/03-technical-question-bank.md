# Ngân hàng câu hỏi phỏng vấn kỹ thuật tổng hợp (theo module, có độ khó)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Senior interview đánh giá depth, trade-off, debugging, ownership và communication—not ability to recite definitions.
- Chuẩn bị theo domain/module và project stories; technical bank cần answers có assumptions, alternatives, failure modes và production evidence.
- Clarify prompt trước solution; state invariants/complexity; test edge cases và giải thích trade-offs aloud.
- Câu trả lời mạnh phân biệt “always/usually”, nêu version/workload caveats và biết khi nào cần profile/docs.
- Luyện cả coding, system design, behavioral và debugging; chỉ đọc answers không tạo retrieval skill.

## 2. Khái niệm cốt lõi

Question bank nên có difficulty tiers: fundamentals (complexity, HTTP, types), implementation (transactions, hooks, queue), senior scenarios (incident, migration, scaling, security). Mỗi topic cần: concise definition, mechanism, when/use trade-off, production failure mode, measurement/test approach. Không memorise câu chữ; dùng structured reasoning.

Framework trả lời technical question: clarify context/version; define requirement/invariant; explain mechanism; compare alternatives; identify failure modes/security; describe how to validate/measure. Với coding: restate input/output, edge cases, choose algorithm/data structure, complexity, implement readable code, test examples. Với architecture: requirements/estimates → API/data → components → bottlenecks/failures → trade-offs.

Senior depth thường nằm ở boundaries: DB transaction vs external side effect, cache consistency, Node event loop vs thread pool, React render vs commit, authn vs authz, deployment rollback vs schema. Nếu không nhớ exact API, nói semantics và cách verify thay vì bịa.

### Ma trận câu hỏi theo module

Độ khó dưới đây là gợi ý luyện tập, không phải thang tuyển dụng chuẩn: cơ bản kiểm tra khái niệm, vận dụng yêu cầu giải thích cơ chế, tình huống yêu cầu bảo vệ invariant và xử lý failure.

| Module | Độ khó | Câu hỏi luyện tập | Ý chính cần có trong đáp án |
|---|---|---|---|
| 01 Fundamentals | Cơ bản | Append dynamic array có luôn O(1)? | Worst-case resize O(n), amortized O(1) khi capacity tăng theo cấp số nhân. |
| 02 PHP | Vận dụng | Vì sao singleton đúng ở FPM vẫn có thể lỗi ở Octane? | Userland request state được reset ở FPM, long-running app có thể giữ state qua request; chọn lifetime và cleanup đúng. |
| 03 Node.js | Vận dụng | Promise có đưa CPU loop ra khỏi main thread? | Không; phân biệt microtasks, libuv pool và worker_threads. |
| 04 JS/TS | Vận dụng | as User có validate JSON không? | Không; parse unknown bằng runtime validation rồi mới dùng typed value. |
| 05 React | Vận dụng | Render lại có nghĩa DOM đổi? | Không; phân biệt render, reconciliation, commit và browser paint. |
| 06 Vue | Vận dụng | Observer tạo trong onMounted có thấy node v-if xuất hiện sau không? | Không tự động; theo dõi template ref hoặc tạo sau DOM update, cleanup đúng. |
| 07 Database | Tình huống | Hai request cùng mua sản phẩm cuối cùng, xử lý thế nào? | Conditional UPDATE, kiểm affected rows, transaction với related writes và idempotency; test concurrency. |
| 08 API | Tình huống | Timeout khi charge payment có nên retry? | Outcome unknown; provider idempotency, query status/reconciliation, deadline và giới hạn retry. |
| 09 System Design | Tình huống | DB commit nhưng broker publish thất bại thì sao? | Transactional outbox và relay; redelivery vẫn cần consumer dedupe cùng side effect. |
| 10 Security | Tình huống | UUID và route guard có ngăn IDOR? | Không; server authorize principal–resource–action và tenant cho từng access path. |
| 11 Testing | Vận dụng | Suite mock ORM toàn bộ bỏ sót lỗi gì? | SQL/schema/transaction/locking và driver behavior; bổ sung integration test đúng engine. |
| 12 DevOps | Tình huống | Rollback image sau đổi schema có an toàn? | Chỉ khi schema tương thích; dùng expand-contract, kiểm dữ liệu và kế hoạch roll-forward. |
| 13 Leadership | Tình huống | Dependency gây trễ, báo PO thế nào? | Evidence, assumptions, impact, options và forecast mới; giữ tiêu chuẩn an toàn/chất lượng. |
| 14 Interview/CV | Vận dụng | Không có metric chính xác thì viết CV ra sao? | Dùng outcome/scope hoặc proxy có thể kiểm chứng, phân biệt đóng góp cá nhân/team, không bịa số. |

## 3. Code ví dụ

Answer outline cho database transaction question.

```text
Invariant: inventory cannot go below zero.
Naive approach: read stock, then update; concurrent requests can both pass.
Approach: conditional UPDATE ... WHERE stock >= quantity, check affected rows,
		  plus transaction/unique constraints for related writes.
Trade-offs: contention and retry/deadlock handling; keep transaction short.
Validation: concurrent integration test on production DB engine; monitor conflicts.
```

## 4. Trade-off & Best practices

- Tập trung job description/domain của target role, nhưng giữ fundamentals transferable.
- Luyện out loud với timeboxes; record yourself để phát hiện câu trả lời dài/mơ hồ.
- Nói assumptions/version (e.g. PHP 8.3, Node 22, React 19); frameworks evolve.
- Dùng project stories để chứng minh theory và ownership; giữ customer/company data confidential.
- Khi interviewer challenge, coi đó là thêm constraint; cập nhật reasoning thay defend answer cũ.
- Không chỉ nêu best practice; giải thích when not to use, failure path và measurement.
- Maintain spaced repetition list cho weak topics; revisit bằng recall, code/diagram, không đọc lại thụ động.
- Với mỗi chủ đề, chuẩn bị một câu trả lời 30 giây, một deep dive 3 phút và một production example; interviewer có thể chọn bất kỳ độ sâu nào. Ghi rõ caveats theo engine/version và link official docs để refresh những chi tiết thay đổi nhanh.

## 5. Lỗi thường gặp / Pitfalls

- Trả lời định nghĩa textbook không gắn problem/production context.
- Absolutes như “JWT always better”/“microservices scale” mà không nêu requirements.
- Nhảy tới solution trước clarification hoặc assumptions.
- Bịa exact version semantics/metrics thay vì nói uncertainty và cách verify.
- Không nói complexity, failure handling hay test approach trong coding answers.
- Nói quá nhiều framework details nhưng không giải thích underlying mechanism.
- Luyện câu hỏi thuộc lòng nhưng không thể thay đổi khi interviewer thêm constraint.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Một hash map lookup luôn O(1)?</b></summary>

Average/expected O(1) theo assumptions về hash distribution; worst-case collisions/resize có thể tệ hơn. Cân memory, key cost và actual runtime.

</details>

<details>
<summary><b>Q2. `async/await` có tạo thread?</b></summary>

Không. Nó biểu diễn Promise continuation; I/O runtime có thể offload, nhưng JS CPU work vẫn chạy trên thread hiện tại trừ worker/process.

</details>

<details>
<summary><b>Q3. Làm sao ngăn N+1 query?</b></summary>

Eager/batch load đúng relation, project đúng columns, theo dõi query count/plan; test trên dataset realistic và tránh tải relation quá lớn.

</details>

<details>
<summary><b>Q4. Cache invalidation chọn thế nào?</b></summary>

TTL/version/event invalidation theo freshness requirement; cache key bao mọi dimension, chống stampede và đo stale age/error.

</details>

<details>
<summary><b>Q5. Retry sau timeout an toàn không?</b></summary>

Chỉ nếu operation idempotent/deduped, error transient, deadline/budget bounded; timeout không chứng minh server chưa commit.

</details>

<details>
<summary><b>Q6. Làm sao thiết kế API pagination?</b></summary>

Stable deterministic ordering, bounded page size; cursor/keyset cho large/changing datasets, offset cho random page access nhỏ.

</details>

<details>
<summary><b>Q7. Làm sao phát hiện performance bottleneck?</b></summary>

Profile/tracing cùng workload và SLO; tách CPU, DB, network, queueing, memory; tối ưu measured cause rồi benchmark regression.

</details>

## 7. Áp dụng thực tế

- Với mỗi module, tự trả lời một câu trong ma trận mà không nhìn ghi chú; ghi lại assumption sai, ví dụ chưa giải thích được và tài liệu cần đọc lại.
- Chuyển câu trả lời thành bằng chứng dự án thật nếu đã có kinh nghiệm tương ứng. Bài mock chỉ là hoạt động luyện tập, không thay kinh nghiệm production.

## 8. Tài liệu tham khảo

- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [MDN Web Docs](https://developer.mozilla.org/)
- [PHP Manual](https://www.php.net/manual/en/)
- [React Learn](https://react.dev/learn)

