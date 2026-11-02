# NoSQL: MongoDB, Redis (data types, use case, persistence), khi nào dùng

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- NoSQL không đồng nghĩa không schema; MongoDB document model và Redis data structures có consistency, indexing và persistence semantics riêng.
- MongoDB hợp document/aggregate access pattern khi data cùng lifecycle; embedding vs referencing cân theo update, duplication, document size và query needs.
- Redis là in-memory data structure store thường dùng cache, counters, queues/coordination primitives; memory cost và eviction policy là first-class concerns.
- Redis persistence (RDB/AOF), replication và failover configuration quyết định durability; cache không nên trở thành source of truth ngẫu nhiên.
- Chọn DB theo access patterns, consistency, transactions, operational maturity và backup/recovery—not chỉ theo scale slogan.

## 2. Khái niệm cốt lõi

MongoDB lưu BSON documents trong collections, hỗ trợ indexes, aggregation pipeline, transactions và schema validation. Document modeling nên bám aggregate thường được đọc/cập nhật cùng nhau. Embedding giảm joins/round trips nhưng duplicate data, document growth và concurrent update hotspots; references phù hợp quan hệ chia sẻ/nhiều-nhiều hoặc dữ liệu lớn thay đổi độc lập. MongoDB document size có giới hạn; model không nên embed unbounded arrays.

Redis cung cấp structures như String, Hash, List, Set, Sorted Set, Stream, Bitmap, HyperLogLog và geospatial. Operations/complexity khác nhau; expiration gắn key, eviction dựa maxmemory policy. Redis single-threaded command execution model thường làm latency thấp cho commands ngắn, nhưng slow command/blocking workload ảnh hưởng server; Redis có I/O threads cho một số path/config nhưng không biến mọi command thành parallel.

Persistence: RDB snapshots tạo point-in-time files, có thể mất writes từ snapshot gần nhất; AOF ghi operation log theo fsync policy, durability/size/rewrite trade-offs. Có thể kết hợp. Replication thường async, failover có thể mất acknowledged writes tùy topology/config; không xem Redis primary-replica như strongly consistent distributed DB mặc định. Redis Cluster sharding keyspace và giới hạn multi-key operations theo hash slots.

## 3. Code ví dụ

MongoDB document model cho order với items là aggregate thường được đọc cùng order; dùng unique index cho external idempotency key.

```js
db.orders.createIndex({ tenantId: 1, idempotencyKey: 1 }, { unique: true });

db.orders.insertOne({
	tenantId: 'tenant-42',
	idempotencyKey: 'checkout-abc',
	status: 'pending',
	items: [{ productId: 'p-1', quantity: 2, unitPrice: 12.5 }],
	createdAt: new Date(),
});
```

Ví dụ Redis cache key nên namespace và TTL rõ: `SET product:v3:42 <serialized-value> EX 300`. Dữ liệu nhạy cảm cần auth/ACL, TLS/network isolation và policy không cache công khai.

## 4. Trade-off & Best practices

- MongoDB: model theo read/write access patterns, index query shapes, giới hạn document growth và dùng schema validation/migration discipline.
- Embed data nếu cùng lifecycle/atomic update có lợi; reference khi shared, unbounded hoặc update độc lập. Dùng transactions khi invariant vượt single document nhưng cân latency/cost.
- Redis: đặt maxmemory/eviction policy, TTL, key naming, memory alerts và eviction tests; giới hạn payload/large collections.
- Dùng Redis lock/rate limit/queue primitives chỉ với hiểu biết về lease, fencing, failover và duplicate behavior; correctness-critical coordination có thể cần stronger system.
- Bảo vệ Redis/Mongo bằng authentication, network controls, least privilege, backups và restore drills.
- Chọn persistence/durability rõ theo RPO/RTO; test failover và backup restore, không chỉ replica health.
- Theo dõi hot keys, cardinality/index selectivity, slow commands, memory fragmentation và replication lag.

## 5. Lỗi thường gặp / Pitfalls

- Embed unbounded arrays đến document size/hot document limit.
- Không tạo index cho query patterns rồi collection scan tăng theo data.
- Dùng Redis làm durable queue/cache/source of truth mà không hiểu eviction, persistence và failover loss.
- Chọn `KEYS` trên production keyspace lớn thay vì incremental `SCAN` phù hợp.
- Không đặt TTL/cache invalidation, tạo stale data hoặc memory growth.
- Giả định replica/cluster guarantees linearizable writes hay exactly-once processing.
- Cache key thiếu tenant/locale/permission dimension gây cross-scope data leakage.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. MongoDB embed hay reference?</b></summary>

Embed dữ liệu cùng aggregate/lifecycle và thường đọc cùng nhau; reference khi chia sẻ, unbounded, update độc lập hoặc cần quan hệ/query riêng. Cân document size và consistency.

</details>

<details>
<summary><b>Q2. Redis có phải chỉ là cache?</b></summary>

Không; nó cung cấp data structures, streams, counters và coordination primitives. Nhưng durability/consistency/eviction semantics phải phù hợp use case.

</details>

<details>
<summary><b>Q3. RDB khác AOF?</b></summary>

RDB snapshots compact/restore nhanh nhưng có thể mất writes giữa snapshots; AOF ghi operation log với fsync policy, thường giảm data loss window nhưng có rewrite/storage cost.

</details>

<details>
<summary><b>Q4. Khi nào MongoDB transaction cần thiết?</b></summary>

Khi invariant cần atomicity across documents/collections. Nếu có thể model aggregate trong một document thì atomic single-document writes đơn giản hơn.

</details>

<details>
<summary><b>Q5. Redis lock có luôn an toàn khi failover?</b></summary>

Không tự động. Lease expiry, clock/timeouts, pause và failover có thể tạo concurrent owners; fencing tokens/idempotency hoặc transactional coordination có thể cần thiết.

</details>

## 7. Ứng dụng vào CV

- Thiết kế MongoDB aggregates/indexes cho **[N]** operations/s, giảm query round trips **[A]%** mà không vượt document growth limits.
- Tuning Redis cache/eviction/TTL, giảm p95 read latency **[A]%** và giữ memory dưới **[B] GB** trong failover tests.

## 8. Tài liệu tham khảo

- [MongoDB: Data Modeling](https://www.mongodb.com/docs/manual/data-modeling/)
- [MongoDB: Transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [Redis Documentation](https://redis.io/docs/latest/)
- [Redis Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
