# Case study: URL shortener, notification system, chat app, e-commerce checkout

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~11 phút

## 1. Tóm tắt nhanh (TL;DR)

- Case studies bắt đầu từ workload/SLO/abuse constraints; component choices theo access patterns và failure behavior.
- URL shortener ưu tiên low-latency key lookup, collision strategy, caching và abuse controls; click analytics thường async.
- Notification system cần preference/consent, channel adapters, retry/dedup và delivery state; “sent” không đồng nghĩa “read”.
- Chat cần connection fan-out, ordering per conversation, persistence/reconnect cursor và online presence semantics.
- E-commerce checkout là saga: reserve inventory, authorize/capture payment, order state machine, idempotency và reconciliation.

## 2. Khái niệm cốt lõi

**URL shortener**: API tạo code từ long URL (random/base62 hoặc ID encoding), unique constraint giải collision; redirect path cache code→destination, status 301/302 theo analytics/update semantics. Abuse detection, phishing/malware scans, custom domains, expiry, tenant quotas và privacy cần tính từ đầu. Click events vào durable queue để analytics không block redirect; dedupe/bot filtering nếu metrics có yêu cầu.

**Notification system**: producer ghi notification intent/outbox, dispatcher fan-out theo user preferences/consent, channel adapters gửi email/SMS/push/in-app. Queue partition by user/campaign, provider rate limits, retries theo error class, dedupe idempotency key và DLQ. Track queued/attempted/delivered/bounced/read khác nhau; provider callbacks có duplicate/out-of-order behavior.

**Chat**: gateway giữ WebSocket connections, auth conversation membership, route message tới conversation partition. Persist trước khi ack; sequence/order per conversation, message IDs/dedupe, offline delivery cursor và reconnect replay. Presence là ephemeral/approximate; unread count và delivery receipts có semantics riêng. Multi-region/fan-out-on-write vs fan-out-on-read là trade-off giữa write amplification và read latency.

**Checkout**: authoritative order state machine; reserve inventory với expiry, authorize payment, confirm, capture hoặc compensate. Idempotency key cho client retries; outbox cho event publish; reconciliation job xử lý trạng thái payment provider không rõ sau timeout. Không hứa exactly-once; thiết kế at-least-once + idempotency và audit trail.

## 3. Code ví dụ

Checkout state machine từ chối transition không hợp lệ thay vì update status tùy tiện.

```ts
type OrderState = 'pending' | 'reserved' | 'paid' | 'cancelled';

const transitions: Record<OrderState, readonly OrderState[]> = {
	pending: ['reserved', 'cancelled'],
	reserved: ['paid', 'cancelled'],
	paid: [],
	cancelled: [],
};

function transition(current: OrderState, next: OrderState): OrderState {
	if (!transitions[current].includes(next)) {
		throw new Error(`Invalid order transition: ${current} -> ${next}`);
	}
	return next;
}
```

DB update nên dùng optimistic version/conditional update hoặc transaction để chống concurrent transitions; side effects dispatch sau commit.

## 4. Trade-off & Best practices

- URL shortener: optimize redirect read path/cache; generation correctness với unique constraint; analytics async và abuse controls.
- Notifications: separate orchestration from providers; honor user preferences, quiet hours, compliance and provider quotas; idempotent delivery intent.
- Chat: partition by conversation, order within partition, persist messages and replay cursor; define delivery vs read states.
- Checkout: durable state machine, reserve/expire inventory, idempotent payment operations, outbox, compensations and reconciliation.
- Định nghĩa SLO per workflow; redirect/chat latency khác notification delivery freshness/checkout correctness.
- Thiết kế privacy/retention, authorization, tenant isolation, rate limits và observability per entity/correlation ID.
- Bắt đầu với simplest viable topology; add partitioning/multi-region/fan-out architecture khi estimates/metrics justify.
- Nêu explicitly các unknowns cần prototype/load test: redirect cache hit ratio, notification provider quotas, chat concurrent connections, inventory contention. Những giả thuyết này quyết định liệu cần sharding, specialized storage hay chỉ index/queue tốt.

## 5. Lỗi thường gặp / Pitfalls

- URL shortener dùng predictable IDs không chống enumeration/abuse, hoặc analytics sync làm redirect chậm.
- Notification retry gửi email/SMS trùng mà không dedupe; không phân biệt provider accepted với delivered.
- Chat ack message trước persistence, mất message khi crash; không hỗ trợ replay sau reconnect.
- Presence coi như strongly consistent, tạo false online/offline khi heartbeat/network partition.
- Checkout giữ DB transaction mở khi gọi payment provider.
- Saga compensation giả định refund/reservation release luôn thành công.
- Không có reconciliation cho provider timeout với outcome unknown.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. URL code collision xử lý thế nào?</b></summary>

Unique constraint tại storage là arbiter; generate code, attempt insert và retry collision có giới hạn. Encoding/collision/guessability requirements ảnh hưởng strategy.

</details>

<details>
<summary><b>Q2. Làm sao ngăn notification duplicate?</b></summary>

Idempotency key cho delivery intent/provider operation, persist state machine và dedupe callbacks; exactly-once qua provider không nên giả định.

</details>

<details>
<summary><b>Q3. Chat ordering đảm bảo ở đâu?</b></summary>

Thường per conversation/partition bằng sequence/serialized writes; global ordering giữa mọi conversations vừa đắt vừa không cần thiết.

</details>

<details>
<summary><b>Q4. Payment timeout có nghĩa payment fail?</b></summary>

Không. Outcome có thể unknown vì request đã xử lý nhưng response mất; query provider/idempotency key và reconciliation trước retry/cancel.

</details>

<details>
<summary><b>Q5. Vì sao checkout dùng saga?</b></summary>

Inventory/payment/order thường thuộc nhiều systems không cùng transaction. Saga điều phối local commits và compensations, chấp nhận eventual consistency.

</details>

## 7. Ứng dụng vào CV

- Thiết kế **[case study system]** đạt **[N]** operations/s với p95 **[A] ms**, SLO **[B]%** và recovery strategy rõ.
- Triển khai idempotency/outbox/reconciliation cho checkout/notifications, giảm duplicate/lost operations **[A]%**.

## 8. Tài liệu tham khảo

- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [Martin Fowler: Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [AWS: Saga pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/saga-pattern.html)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
