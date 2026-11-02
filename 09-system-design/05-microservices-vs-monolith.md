# Microservices vs Monolith (modular monolith), service communication, saga

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Monolith deploy một application unit; modular monolith giữ module boundaries trong một process/deploy, thường là default tốt khi domain/team chưa cần distribution.
- Microservices phân deployment/data/ownership theo business capability, đổi lấy network failures, observability, consistency và operational overhead.
- Service boundary nên theo bounded context/team ownership/data lifecycle, không theo database table hoặc CRUD entity.
- Sync calls đơn giản nhưng tạo latency/coupling; async events giảm temporal coupling nhưng thêm eventual consistency/replay/schema concerns.
- Saga điều phối distributed business transaction bằng forward actions và compensations; compensation không phải database rollback.

## 2. Khái niệm cốt lõi

Monolith có thể scale horizontally nếu stateless/DB capacity đủ; vấn đề chính không phải một deploy artifact mà là coupling, coordination và ownership. Modular monolith dùng modules có public interfaces, dependency rules, internal data ownership và test boundaries; giúp tiến hóa domain mà chưa trả distributed systems tax.

Microservices cho independent deploy/scale/release ownership, fault isolation và technology autonomy; nhưng một user request có thể đi qua nhiều network hops, mỗi dependency thêm timeout/retry/security/telemetry. Distributed data ownership khiến cross-service queries/transactions khó. Shared database across services tạo hidden coupling, dù runtime tách process.

Synchronous REST/gRPC phù hợp khi caller cần immediate result, nhưng chain latency/cascading failure phải quản lý bằng deadlines, circuit breakers, bulkheads. Event-driven async phù hợp decoupled workflows, nhưng consumer cần idempotency, schema compatibility, ordering/replay và observability. Saga choreography dùng events giữa services; orchestration có central coordinator/state machine. Compensating action là business operation mới (refund), có thể fail/không đảo ngược chính xác.

## 3. Code ví dụ

Saga checkout có durable state và idempotency keys; đây là workflow outline, không phải một distributed DB transaction.

```text
OrderCreated -> ReserveInventory -> AuthorizePayment -> ConfirmOrder
	|                  |                  |
	|                  | failure          | failure
	|                  v                  v
	+------------ CancelOrder       ReleaseInventory
						     RefundPayment (if captured)
```

Mỗi step ghi outcome/idempotency key, timeout và retry policy. Compensation chạy theo business semantics; inventory release/refund có thể cần manual review hoặc reconciliation nếu provider không phản hồi rõ.

## 4. Trade-off & Best practices

- Ưu tiên modular monolith cho team/domain nhỏ, deploy coordination thấp và shared transaction cần thiết; tách service khi có independent scaling/ownership/release evidence.
- Chọn boundary theo capability/data ownership, change frequency và team autonomy.
- Mỗi service sở hữu data, expose API/events; tránh shared database schemas làm distributed monolith.
- Thiết kế sync call budgets/deadlines, fallback, circuit breaking và bulkheads; không retry vô hạn.
- Async events versioned, idempotent và observability xuyên correlation IDs; có replay/DLQ strategy.
- Saga state durable, compensation explicit, timeout/reconciliation paths được test.
- Tách service từng bước qua strangler pattern; chuẩn bị deployment, secrets, dashboards, on-call và rollback trước cutover.
- Tách service từng bước qua strangler pattern; chuẩn bị deployment, secrets, dashboards, on-call và rollback trước cutover.
- Trước khi tách, xác định service boundary có transaction/data ownership rõ chưa; nếu mọi request vẫn cần synchronous calls hai chiều và shared tables, việc chuyển process có thể chỉ tăng failure modes. Một module boundary tốt trong monolith là thử nghiệm rẻ cho future extraction.
- Trước khi tách, xác định service boundary có transaction/data ownership rõ chưa; nếu mọi request vẫn cần synchronous calls hai chiều và shared tables, việc chuyển process có thể chỉ tăng failure modes. Một module boundary tốt trong monolith là thử nghiệm rẻ cho future extraction.
- Khi request đi qua services, propagate trace/correlation context và xác định ownership của timeout/retry; caller và callee cùng retry có thể nhân tải. Contract-level tests giúp teams deploy independently mà không cần integration environment khổng lồ cho mọi change.

## 5. Lỗi thường gặp / Pitfalls

- Chia microservice theo technical layer hoặc table, tạo chatty network architecture.
- Shared DB và synchronous calls tạo distributed monolith nhưng khó debug hơn monolith thật.
- Giả định saga compensation luôn restore trạng thái ban đầu.
- Không thiết kế idempotency/reconciliation cho side effects ngoài DB.
- Tách service trước khi có deployment/observability/ownership maturity.
- Đo microservice success bằng service count thay lead time, failure isolation hay scaling needs.
- Không plan data migration, backfill, dual-write consistency và rollback.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Khi nào nên tách microservice?</b></summary>

Khi boundary/ownership rõ và independent deploy/scale/fault isolation có giá trị vượt operational/network consistency cost. Không dựa chỉ vào codebase size.

</details>

<details>
<summary><b>Q2. Modular monolith khác monolith thường?</b></summary>

Nó enforce module boundaries/dependency direction/data ownership dù cùng deploy/process, giúp giảm coupling và giữ khả năng tách sau này.

</details>

<details>
<summary><b>Q3. Saga khác distributed transaction?</b></summary>

Saga gồm local transactions và compensations qua workflow; không có atomic rollback toàn hệ thống như một DB transaction.

</details>

<details>
<summary><b>Q4. Choreography hay orchestration?</b></summary>

Choreography giảm central coordinator nhưng flow phân tán khó trace; orchestration làm state/steps rõ nhưng coordinator cần scale/failover. Chọn theo workflow complexity.

</details>

<details>
<summary><b>Q5. Vì sao shared DB giữa services nguy hiểm?</b></summary>

Schema changes và transactions tạo coupling/coordination hidden; service không sở hữu data độc lập nên deploy autonomy giảm.

</details>

## 7. Ứng dụng vào CV

- Tách **[capability]** theo bounded context bằng strangler migration, deploy độc lập **[N]** times/day và giảm cross-team blocking **[A]%**.
- Thiết kế saga với idempotency/reconciliation cho checkout, giảm orphaned orders **[A]%** qua **[N]** transactions/day.

## 8. Tài liệu tham khảo

- [Martin Fowler: MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html)
- [Martin Fowler: Microservices](https://martinfowler.com/articles/microservices.html)
- [Microservices.io: Saga pattern](https://microservices.io/patterns/data/saga.html)
- [AWS: Strangler Fig pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html)

