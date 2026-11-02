# MySQL vs PostgreSQL – điểm khác biệt

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Cả MySQL/InnoDB và PostgreSQL là relational databases trưởng thành; lựa chọn dựa feature, workload, operations, ecosystem và team expertise.
- PostgreSQL có extensible type/index ecosystem và SQL features phong phú; MySQL/InnoDB phổ biến trong web workloads, có ecosystem managed/hosting rộng.
- Transaction, isolation, locking, JSON, replication và DDL behavior có khác biệt implementation; không port assumptions chỉ dựa ANSI SQL.
- InnoDB tổ chức table theo clustered primary key; PostgreSQL heap table với indexes riêng và MVCC vacuum lifecycle.
- Benchmark cùng schema/data/query/concurrency và test migration/backup/failover trước quyết định.

## 2. Khái niệm cốt lõi

InnoDB là default transactional engine phổ biến của MySQL, dùng clustered index theo primary key; secondary index entries giữ primary key. Primary key rộng làm secondary indexes lớn hơn. PostgreSQL lưu tuples trong heap, indexes riêng; vacuum/autovacuum xử lý dead tuples/MVCC cleanup. Điều này tạo khác biệt về index-only scan, bloat, maintenance và storage layout.

Cả hai hỗ trợ ACID/MVCC nhưng isolation semantics khác. PostgreSQL default Read Committed tạo snapshot mỗi statement; Repeatable Read snapshot transaction có semantics mạnh hơn SQL standard tối thiểu, Serializable dùng SSI. InnoDB Repeatable Read có next-key/gap locks cho một số scans để ngăn phantoms; lock behavior phụ thuộc index/isolation. Cần test race/locking trên target engine.

PostgreSQL hỗ trợ nhiều index types (B-tree, GIN, GiST, BRIN, SP-GiST) và extensibility; `JSONB` lưu binary representation, hỗ trợ operators/indexing. MySQL có JSON type/functions và generated/functional indexes theo phiên bản. “JSON flexible” không thay schema/constraints hoặc relational modeling. DDL transactional/online capabilities khác theo operation/version và managed service.

Replication/failover cũng khác tooling/topology: async replicas có replication lag; read-after-write consistency cần routing policy. Backup/PITR, extensions, connection pooling, managed service support và upgrade path có thể ảnh hưởng lựa chọn nhiều hơn syntax.

## 3. Code ví dụ

Hai DB hỗ trợ JSON nhưng expression/index syntax khác; ví dụ PostgreSQL truy vấn JSONB và GIN index.

```sql
CREATE TABLE events (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	payload JSONB NOT NULL
);

CREATE INDEX idx_events_payload_gin ON events USING GIN (payload);

SELECT id
FROM events
WHERE payload @> '{"type":"invoice.paid"}'::jsonb;
```

Equivalent MySQL query/index có cú pháp và optimizer behavior riêng; tạo benchmark/plan trên engine đích thay vì dùng cùng DDL tưởng tương thích.

## 4. Trade-off & Best practices

- Chọn PostgreSQL khi cần advanced SQL/types/extensions hoặc JSONB/query capabilities; chọn MySQL khi ecosystem/operations/team/managed offerings phù hợp hơn. Đây là tendencies, không luật tuyệt đối.
- Xác định primary key strategy sớm; InnoDB primary key impacts clustered layout và secondary indexes.
- Test isolation/locking, unique constraints, JSON operators, collation/case sensitivity và timezone behavior trên engine thực.
- Dùng migration tooling có engine-specific capabilities; kiểm tra DDL lock/online operation và rollback strategy.
- Thiết kế replica routing theo consistency requirement; replica lag có thể làm user không thấy write vừa commit.
- So sánh managed cost, backup/PITR, extensions, monitoring, failover RTO/RPO và upgrade support.
- Dùng common SQL subset nếu portability cần thiết; chấp nhận database-specific features khi giá trị và ownership rõ.

## 5. Lỗi thường gặp / Pitfalls

- So sánh qua headline performance hoặc benchmark dataset nhỏ, bỏ qua query mix/concurrency.
- Giả định `READ COMMITTED`/`REPEATABLE READ` có cùng anomalies và locks.
- Dùng `SELECT *` JSON payload rồi nghĩ index tự động tối ưu mọi JSON path.
- Migrate MySQL sang PostgreSQL nhưng bỏ qua collation, implicit casts, unsigned types, auto increment/identity, SQL modes và DDL semantics.
- Dùng replica cho read-after-write path mà không tính replication lag.
- Không test restore/upgrade/failover trên platform managed thực tế.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Khác biệt storage quan trọng của InnoDB và PostgreSQL?</b></summary>

InnoDB table thường clustered theo primary key; PostgreSQL giữ heap tuples và separate indexes. Điều này ảnh hưởng secondary index size, vacuum và query plans.

</details>

<details>
<summary><b>Q2. MVCC nghĩa là không cần vacuum/cleanup?</b></summary>

Không. Old versions cần được dọn; PostgreSQL autovacuum và InnoDB purge có role riêng. Transaction dài có thể giữ versions và tăng bloat.

</details>

<details>
<summary><b>Q3. Khi nào dùng JSONB/JSON column?</b></summary>

Khi payload có cấu trúc linh hoạt hoặc extension attributes; data cần relational constraints/joins thường nên normalize. JSON indexing cần expression/operator phù hợp.

</details>

<details>
<summary><b>Q4. Có thể port isolation behavior giữa hai DB?</b></summary>

Không nên giả định. Cùng tên isolation có thể implementation/locking khác; test concurrent transactions và SQL semantics trên target database.

</details>

<details>
<summary><b>Q5. Tiêu chí chọn database ngoài performance?</b></summary>

Operations, backups/PITR, failover, managed service, tooling, extensions, migration/upgrade cost, team expertise và consistency requirements.

</details>

## 7. Ứng dụng vào CV

- Benchmark và chọn **[DB]** theo workload, failover và operations requirements, giảm p95 query latency **[A]%** trong khi đạt RPO **[B]**.
- Migrate **[N]** tables với engine-specific schema/locking strategy, hoàn tất cutover không downtime và không mất dữ liệu.

## 8. Tài liệu tham khảo

- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [MySQL 8.4 Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [PostgreSQL: JSON Types](https://www.postgresql.org/docs/current/datatype-json.html)
- [MySQL: JSON Data Type](https://dev.mysql.com/doc/refman/8.4/en/json.html)

