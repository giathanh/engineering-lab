# Scaling DB: replication, sharding, partitioning, connection pool, CAP

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Scale database bắt đầu bằng query/index/schema/profile; thêm replica/shard không sửa query path kém hoặc workload không được kiểm soát.
- Replication tăng read capacity/availability nhưng async lag ảnh hưởng read-after-write; replica không tự chia write load.
- Partitioning chia table lớn theo key/time; sharding phân dữ liệu qua nhiều nodes và tăng application/operations complexity.
- Connection pool giới hạn số kết nối và reuse handshake; tổng pool size của mọi app instances phải dưới DB capacity.
- CAP mô tả trade-off khi network partition; consistency/availability lựa chọn theo semantics, không phải nhãn “SQL vs NoSQL”.

## 2. Khái niệm cốt lõi

Vertical scaling tăng CPU/RAM/IOPS của một node, đơn giản đến giới hạn chi phí/instance. Read replicas copy log/changes từ primary; async replication tạo lag. Routing reads sang replica phù hợp eventual consistency, nhưng read-after-write cần pin về primary hoặc chờ replication position. Failover cần promotion, DNS/connection refresh, fencing để tránh split-brain và recovery plan.

Partitioning chia logical table thành partitions theo range/list/hash. Partition pruning bỏ partitions không liên quan nếu query filter khớp partition key. Nó giúp retention/drop old partitions, index maintenance và đôi khi parallelism, nhưng không nhất thiết làm query nhanh nếu pruning thiếu hoặc partitions quá nhỏ/nhiều. Engine features khác nhau.

Sharding đặt subsets dữ liệu trên node riêng theo shard key. Shard key ảnh hưởng distribution, hot spots, query locality, rebalancing và cross-shard transactions. Hash sharding phân bố đều nhưng range scans khó; range sharding hỗ trợ locality nhưng có hotspot. Directory-based routing linh hoạt nhưng thêm metadata dependency. Resharding cần dual-read/write, backfill và cutover strategy.

Connection pool giữ số connections bounded, reuse them và queue khi hết slots. Pooling giải quyết connection overhead/limit, không tăng DB execution capacity. Oversized pools gây context switching/memory/locks và DB overload. Proxy pools có transaction/session pooling semantics khác nhau; server-side prepared statements/session state cần kiểm tra compatibility.

CAP: khi network partition xảy ra, distributed data system không thể đồng thời guarantee strict consistency và availability cho mọi request; partition tolerance là thực tế phải xử lý. CAP không phải lựa chọn thường trực giữa C/A trong điều kiện bình thường; latency, replication model và operation semantics còn quan trọng.

## 3. Code ví dụ

Ví dụ PostgreSQL range partition theo tháng; production migration cần tạo partitions trước, index/constraints và retention policy phù hợp.

```sql
CREATE TABLE events (
	id BIGINT GENERATED ALWAYS AS IDENTITY,
	occurred_at TIMESTAMPTZ NOT NULL,
	payload JSONB NOT NULL
) PARTITION BY RANGE (occurred_at);

CREATE TABLE events_2026_11
	PARTITION OF events
	FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

SELECT count(*)
FROM events
WHERE occurred_at >= '2026-11-01'
	AND occurred_at < '2026-12-01';
```

Range predicate giúp partition pruning; unique constraints/primary key trên partitioned table có engine-specific restrictions và cần cân nhắc key chứa partition column.

## 4. Trade-off & Best practices

- Tối ưu schema/query/index/connection usage trước scale-out; đo saturation CPU, IO, locks, buffer cache và query latency.
- Replica reads chỉ khi consistency tolerance rõ; metrics lag và fallback/pinning behavior phải có.
- Chọn partition key theo query/retention; tránh quá nhiều tiny partitions hoặc partitioning khi workload chưa cần.
- Chọn shard key để phân phối write/read, giữ query locality và tránh hot tenants; plan cross-shard operations/rebalancing.
- Tính pool budget: app replicas × workers × per-process pool ≤ safe DB/proxy connection capacity, chừa admin/migration headroom.
- Throttle backfills/replication catch-up; theo dõi lag, error rate và resource headroom khi migration.
- Định nghĩa RPO/RTO, backup/PITR, failover fencing và restore drills; replication không thay backup.
- Định nghĩa RPO/RTO, backup/PITR, failover fencing và restore drills; replication không thay backup.

## 5. Lỗi thường gặp / Pitfalls

- Gửi toàn bộ reads sang replica rồi user không thấy write vừa commit.
- Scale app instances làm tổng connection pools vượt DB max connections.
- Dùng partitioning để chữa query không có filter partition key.
- Chọn shard key low-cardinality/skewed, tạo hot shard; cross-shard query/transaction tăng latency.
- Xem async replica như backup; corruption/deletes replicate sang replica.
- Failover không fencing primary cũ, gây split-brain writes.
- Dùng CAP như slogan bỏ qua operation-level consistency và network behavior.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Replica khác partition/shard thế nào?</b></summary>

Replica giữ bản sao dữ liệu để tăng read capacity/availability; partition chia một table thành phần quản lý; shard phân subsets dữ liệu trên nodes để scale storage/write capacity.

</details>

<details>
<summary><b>Q2. Vì sao replica lag tạo read-after-write bug?</b></summary>

Write commit ở primary nhưng asynchronous changes chưa tới replica. Read ngay sau đó trên replica trả snapshot cũ; pin read hoặc consistency token/wait policy có thể giải quyết.

</details>

<details>
<summary><b>Q3. Shard key tốt cần gì?</b></summary>

Phân bố đủ đều, tránh hotspot, hỗ trợ query locality và có kế hoạch rebalancing. Key tối ưu write distribution có thể làm cross-shard reads tốn kém.

</details>

<details>
<summary><b>Q4. Connection pool có thể quá lớn không?</b></summary>

Có. Nhiều concurrent DB sessions tiêu thụ memory/CPU/locks và giảm throughput. Tổng pool của mọi app workers phải được tính theo DB capacity.

</details>

<details>
<summary><b>Q5. Partitioning có luôn tăng tốc?</b></summary>

Không. Cần partition pruning/use case phù hợp; quản lý nhiều partition cũng thêm overhead và operational complexity.

</details>

## 7. Ứng dụng vào CV

- Thiết kế replica routing với read-after-write policy và lag monitoring, tăng read throughput **[A]%** mà không vượt consistency SLO.
- Rebalance shards/partition retention cho **[N] TB** dữ liệu, giảm p95 query latency **[A]%** và giữ RPO **[B]**.

## 8. Tài liệu tham khảo

- [PostgreSQL: Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [PostgreSQL: High Availability](https://www.postgresql.org/docs/current/high-availability.html)
- [AWS: Database sharding](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/sharding.html)
- [CAP Twelve Years Later](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/)
