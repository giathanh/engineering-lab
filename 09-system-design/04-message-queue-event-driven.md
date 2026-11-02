# Message queue & async: RabbitMQ, Kafka, SQS, event-driven

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Queue/topic tách producer và consumer theo thời gian, hấp thụ burst và hỗ trợ retry; không tự làm business operation exactly-once.
- RabbitMQ thường phù hợp task routing/ack/queue semantics; Kafka là durable partitioned log/stream; SQS là managed queue với visibility/retry semantics.
- Delivery thường at-least-once nên consumer cần idempotency; ordering thường chỉ bảo đảm trong queue/partition scope.
- Transactional outbox giải quyết dual-write DB+broker gap; consumer dedupe/inbox xử lý duplicate events.
- Theo dõi lag/age, throughput, retries, DLQ, poison messages, consumer capacity và schema evolution.

## 2. Khái niệm cốt lõi

Message broker decouples producer from consumer, buffers load và cho phép independent scaling. Queue work thường một consumer group xử lý message; pub/sub fan-out gửi tới nhiều subscribers. Ack/delete semantics quyết định khi message được coi hoàn tất. Visibility timeout (SQS) ẩn message trong processing window; nếu timeout trước ack, message có thể redeliver.

RabbitMQ exchanges/routes messages tới queues, hỗ trợ ack, routing keys, dead-letter, prefetch và queue types. Kafka lưu append-only partitioned log; consumer offsets cho phép replay, partition key quyết định ordering/locality và một consumer trong group xử lý partition tại thời điểm. SQS managed queue giảm broker ops; Standard queue at-least-once/best-effort ordering, FIFO có ordering/dedup constraints. Chọn theo durability, throughput, replay, routing, operational burden và cloud coupling.

Exactly-once end-to-end khó vì database side effect và broker ack không cùng atomic transaction mặc định. Kafka EOS semantics scope cụ thể; external side effects vẫn cần idempotency/outbox. Transactional outbox ghi business row + outbox event trong cùng DB transaction; relay publish rồi đánh dấu, có thể duplicate nên consumer dedupe theo event ID.

## 3. Code ví dụ

Outbox schema ghi cùng transaction với business mutation; relay worker publish `event_id` để consumer idempotent.

```sql
BEGIN;

UPDATE orders SET status = 'paid' WHERE id = :order_id;

INSERT INTO outbox_events (event_id, aggregate_id, event_type, payload, created_at)
VALUES (:event_id, :order_id, 'OrderPaid', :payload, CURRENT_TIMESTAMP);

COMMIT;
```

Relay có thể publish lặp nếu crash sau publish trước mark-sent; consumer lưu processed event IDs/unique constraint cùng side effect trong transaction.

## 4. Trade-off & Best practices

- Dùng queue cho async task có thể retry/buffer; giữ synchronous path cho response cần immediate result.
- Định nghĩa message schema/version, key/ordering, retention, replay policy, max payload và ownership.
- Consumer ack sau side effect durable; idempotency/transaction boundaries ngăn duplicate effects.
- Dùng bounded concurrency/prefetch, backpressure và visibility/processing timeout phù hợp job duration.
- Retry transient errors với delay/backoff; permanent/poison messages vào DLQ có alert/replay runbook.
- Theo dõi age of oldest message/consumer lag, not only queue depth; scale consumer không vượt downstream capacity.
- Theo dõi age of oldest message/consumer lag, not only queue depth; scale consumer không vượt downstream capacity.
- Message retention/replay có thể phát lại event cũ sau deploy hoặc schema change; consumer phải tương thích với historical payloads. Versioning, schema validation và canary consumer giúp kiểm tra tương thích trước khi tăng throughput.
- Outbox/inbox pattern cho DB-to-broker consistency; schema registry/compatibility checks khi nhiều teams consume.

## 5. Lỗi thường gặp / Pitfalls

- Ack trước commit database, mất message khi process crash.
- Side effect thành công nhưng ack thất bại, retry gây charge/email trùng.
- Message không versioned, deployment mới không parse backlog cũ.
- Retry poison message vô hạn, chặn progress hoặc làm queue cost tăng.
- Kafka partition key skew tạo hot partition; không có total order giữa partitions.
- Tăng consumers không cải thiện throughput khi downstream DB đã saturate.
- Dùng DLQ như nơi quên dữ liệu mà không có alerts, retention và replay process.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. RabbitMQ khác Kafka?</b></summary>

RabbitMQ thiên về message routing/queue acknowledgments; Kafka là durable partitioned log với replay/consumer offsets. Chọn theo delivery, replay, ordering, throughput và operations.

</details>

<details>
<summary><b>Q2. At-least-once kéo theo yêu cầu gì?</b></summary>

Consumer phải idempotent/dedupe vì redelivery có thể xảy ra khi crash hoặc ack thất bại sau side effect.

</details>

<details>
<summary><b>Q3. Transactional outbox giải quyết vấn đề nào?</b></summary>

Tránh dual-write gap giữa commit database và publish broker bằng cách ghi event trong cùng DB transaction rồi relay asynchronously.

</details>

<details>
<summary><b>Q4. Ordering Kafka bảo đảm phạm vi nào?</b></summary>

Trong một partition theo offset; không có total ordering tự nhiên giữa partitions. Partition key chọn locality/order entity.

</details>

<details>
<summary><b>Q5. Queue depth hay age metric quan trọng hơn?</b></summary>

Cả hai; age của oldest message phản ánh latency/SLO, depth đo backlog volume. Throughput, retries và processing time giúp giải thích.

</details>

## 7. Ứng dụng vào CV

- Xây transactional outbox/idempotent consumers cho **[N]** event flows, giảm lost/duplicate business events **[A]%**.
- Tuning partitioning/prefetch/concurrency theo downstream capacity, xử lý **[N] msg/s** với p99 lag dưới **[A] giây**.

## 8. Tài liệu tham khảo

- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Transactional Outbox pattern](https://microservices.io/patterns/data/transactional-outbox.html)
