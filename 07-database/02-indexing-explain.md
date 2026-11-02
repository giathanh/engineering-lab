# Index: B-Tree, composite index, covering index, EXPLAIN, slow query

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Index là cấu trúc phụ giúp locate rows nhanh hơn, đổi lại write amplification, storage và cache pressure.
- B-Tree hỗ trợ equality/range/order theo key; composite index phụ thuộc column order và leftmost prefix.
- Covering index chứa đủ columns query cần, có thể giảm table lookups; quá nhiều columns làm index lớn và write chậm.
- `EXPLAIN` cho biết optimizer plan/estimated rows; dùng `EXPLAIN ANALYZE` để so actual runtime/rows, nhưng nó thực thi query.
- Index phải khớp predicate/order/selectivity; low-cardinality index đơn có thể ít hữu ích nhưng vẫn tùy workload/engine.

## 2. Khái niệm cốt lõi

B-Tree giữ keys sorted qua nhiều page, nên point lookup/range scan thường O(log n) navigation cộng số rows/page cần đọc. Database vẫn cần fetch table row nếu index không cover query. Clustered storage (InnoDB primary key) đặt row data theo primary index; secondary indexes chứa primary key nên primary key width ảnh hưởng mọi secondary index. PostgreSQL heap/index architecture khác; không giả định behavior của một engine áp dụng cho engine khác.

Composite index `(tenant_id, status, created_at)` có thể phục vụ predicates theo leftmost prefixes (`tenant_id`, `tenant_id+status`, ...), và ordering/range phù hợp; thường không tối ưu query chỉ lọc `status` nếu không có prefix. Equality columns trước range/order columns là heuristic, nhưng selectivity, joins và optimizer plan quyết định. Sargable predicates giữ indexed column không bị function/cast không tương thích; expression/function indexes có thể hỗ trợ pattern cụ thể.

Index selectivity/cardinality ảnh hưởng cost. Optimizer dùng statistics để chọn scan; stale stats hoặc parameter skew dẫn plan kém. Index-only/covering scan có thể tránh heap lookup khi visibility/engine conditions cho phép. Partial/filtered indexes giới hạn subset (PostgreSQL) hoặc functional indexes theo engine. Unique index vừa tăng tốc lookup vừa enforce integrity.

## 3. Code ví dụ

Query tenant recent orders và index phù hợp, giả định tenant filtering luôn có và order theo thời gian.

```sql
CREATE INDEX idx_orders_tenant_created
	ON orders (tenant_id, created_at DESC, id DESC);

SELECT id, created_at, total
FROM orders
WHERE tenant_id = :tenant_id
	AND created_at >= :from_time
ORDER BY created_at DESC, id DESC
LIMIT 50;
```

Kiểm tra bằng `EXPLAIN (ANALYZE, BUFFERS)` trên PostgreSQL hoặc `EXPLAIN ANALYZE` của MySQL 8. Actual plan phụ thuộc data distribution, indexes, stats và cache state. Không chạy analyze trên query side effects hoặc production load mà không hiểu tác động.

## 4. Trade-off & Best practices

- Bắt đầu từ slow query/traffic và query patterns; thêm index có owner/reason, theo dõi usage và write cost.
- Dùng composite order theo equality filters, range/order và selectivity; xác minh bằng plan thay vì checklist cố định.
- Giữ index nhỏ; include/cover columns chỉ khi giảm table access đáng giá. Mỗi index tăng storage và write maintenance.
- Xem estimated vs actual rows, loops, buffers, sort/temp spills, scans và lock waits. High estimated mismatch gợi ý statistics/cardinality problem.
- Dùng `EXPLAIN ANALYZE` cẩn thận vì nó thực thi statement; DML có thể sửa dữ liệu trừ khi transaction/rollback được quản lý an toàn.
- Thay index lớn bằng online/concurrent migration theo engine, đánh giá lock/disk/replication lag.
- Giữ constraints (PK/FK/unique/check) để data correctness không phụ thuộc application code đơn lẻ.

## 5. Lỗi thường gặp / Pitfalls

- Tạo index mỗi column riêng mà không xét composite query pattern.
- Đặt composite index columns sai thứ tự rồi mong optimizer dùng mọi combination.
- Thêm index cho mọi slow query mà không đo write amplification/storage.
- Dùng function trên indexed column khiến predicate không sargable khi chưa có expression index.
- Đọc `EXPLAIN` estimated rows như actual truth hoặc so sánh plans trên dataset khác nhau.
- Chạy `EXPLAIN ANALYZE` DML trực tiếp trên production.
- Quên index foreign keys/join columns tùy engine/workload hoặc quên unique constraint cho invariant.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. B-Tree index cải thiện query nào?</b></summary>

Equality, range và ordered scans theo key thường có thể dùng B-Tree. Tối ưu cụ thể còn phụ thuộc selectivity, table layout, stats và optimizer.

</details>

<details>
<summary><b>Q2. Leftmost prefix là gì?</b></summary>

Composite index thường hỗ trợ lookup theo các leading columns. Index `(a,b,c)` hỗ trợ patterns bắt đầu bằng `a`, nhưng không nhất thiết query chỉ `b`.

</details>

<details>
<summary><b>Q3. Covering index trade-off?</b></summary>

Query có thể lấy columns từ index mà không fetch table row, giảm I/O; index rộng tăng storage, cache pressure và write cost.

</details>

<details>
<summary><b>Q4. Estimated rows lệch actual nói gì?</b></summary>

Statistics/cardinality assumptions có thể stale hoặc skewed, làm optimizer chọn join/order kém. Cập nhật stats và xem distribution/query parameters.

</details>

<details>
<summary><b>Q5. Vì sao không index mọi column?</b></summary>

Index tiêu tốn disk/cache và phải cập nhật mỗi write; nhiều index có thể làm insert/update chậm và optimizer có nhiều lựa chọn hơn.

</details>

## 7. Ứng dụng vào CV

- Thiết kế composite/covering indexes từ production plans, giảm p95 query latency **[A]%** và CPU database **[B]%**.
- Loại bỏ indexes không sử dụng/duplicate, giảm write latency **[A]%** và storage **[B] GB**.

## 8. Tài liệu tham khảo

- [PostgreSQL: Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [PostgreSQL: EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [MySQL: Optimization and Indexes](https://dev.mysql.com/doc/refman/8.4/en/optimization-indexes.html)
- [Use The Index, Luke](https://use-the-index-luke.com/)
