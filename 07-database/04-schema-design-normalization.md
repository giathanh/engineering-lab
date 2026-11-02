# Normalization vs denormalization, thiết kế schema

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Schema phản ánh entities, relationships, invariants và query patterns; bắt đầu từ domain rules thay vì framework model.
- Normalization giảm duplicate facts và update anomalies; denormalization đổi consistency/write cost lấy read performance hoặc đơn giản query.
- Primary/foreign keys, unique/check constraints enforce data integrity ngay tại database boundary.
- Cardinality (1:1, 1:N, M:N), nullability và lifecycle quyết định table/foreign-key design.
- Denormalize có chủ đích kèm owner, update strategy, reconciliation và observability; không nhân bản dữ liệu tùy tiện.

## 2. Khái niệm cốt lõi

Relational modeling dùng tables/rows, keys và constraints. Normal forms là công cụ tránh anomalies: 1NF yêu cầu atomic values theo model; 2NF/3NF loại partial/transitive dependencies trong các điều kiện tương ứng; thực tế thường ưu tiên schema dễ bảo toàn invariant và query rõ. Tách customer address khỏi orders nếu address hiện tại thay đổi nhưng lịch sử đơn cần snapshot khác nhau là business decision, không chỉ normalization rule.

Một-to-many đặt foreign key ở phía many; many-to-many dùng junction table với composite/unique key để ngăn duplicate relationship, có thể thêm attributes như role/created_at. 1:1 thường dùng shared primary key hoặc unique foreign key. Nullable FK thể hiện optional relationship nhưng NULL semantics cần rõ. Soft delete/history/audit làm thay đổi uniqueness và retention strategy.

Denormalization có thể lưu counter, snapshot, materialized view hoặc read model nhằm giảm joins/compute. Nhưng mỗi copy tạo consistency problem: synchronous transaction, async event, periodic reconciliation hoặc rebuildable projection. Eventual consistency cần consumer hiểu stale window. Data ownership và source of truth phải được nêu rõ.

Schema evolution phải tương thích readers/writers đang deploy: expand (thêm nullable column/table), dual-write/backfill, switch reads, rồi contract (xóa cũ). Migration lớn cần batch, throttling, lock impact và rollback plan. Enum/check constraints và generated columns khác portability giữa DB engines; chọn theo requirements.

## 3. Code ví dụ

DDL cho M:N membership với role và unique constraint bảo vệ invariant. Cú pháp PostgreSQL; giả định bảng users(id BIGINT PRIMARY KEY) đã tồn tại.

```sql
CREATE TABLE teams (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name TEXT NOT NULL
);

CREATE TABLE team_members (
	team_id BIGINT NOT NULL REFERENCES teams(id),
	user_id BIGINT NOT NULL REFERENCES users(id),
	role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
	joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (team_id, user_id)
);

CREATE INDEX idx_team_members_user ON team_members (user_id, team_id);
```

Composite PK ngăn membership trùng và hỗ trợ query theo team; secondary index phục vụ query theo user. Index order dựa workload thực tế.

## 4. Trade-off & Best practices

- Tách facts theo ownership và update frequency; lưu historical snapshot khi nghiệp vụ cần giá trị tại thời điểm transaction.
- Dùng constraints (NOT NULL, FK, unique, check) để bảo vệ invariant trước concurrent writers và scripts ngoài app.
- Chọn natural vs surrogate key theo stability, size và integration; tránh mutable business key làm FK rộng khắp.
- Denormalize khi explain plan/metrics chứng minh bottleneck; document source of truth, consistency lag, rebuild/backfill và reconciliation.
- Thiết kế indexes cùng query access patterns; không thêm indexes trước khi biết read/write distribution.
- Migrations expand-contract cho rolling deploy; code cũ/mới có thể chạy song song trong deploy window.
- Giữ migration deterministic/versioned, test trên dataset/schema lớn gần production, tính lock/disk/replication effects.

## 5. Lỗi thường gặp / Pitfalls

- Lưu comma-separated IDs/JSON array cho quan hệ cần filter/join/constraint, mất referential integrity.
- Denormalize counter mà không atomic update/reconciliation, tạo drift.
- Dùng cascade delete rộng mà không hiểu data retention/audit requirements.
- Đặt nullable vào mọi column để tránh nghĩ về domain invariants.
- Thay column type/rename trực tiếp trong rolling deployment khi old code vẫn chạy.
- Tạo migration lock lâu trên bảng lớn mà không đo/plan online migration.
- Dùng unique constraint thiếu tenant/key columns, hoặc thiếu tenant scope làm cross-tenant collision.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Normalization giải quyết vấn đề gì?</b></summary>

Giảm duplicate facts và insert/update/delete anomalies, làm một nguồn dữ liệu có owner rõ. Đổi lại query có thể cần joins/nhiều round trips.

</details>

<details>
<summary><b>Q2. Khi nào denormalize?</b></summary>

Khi workload/plan chứng minh read cost đáng kể và có consistency/update strategy rõ. Cần chấp nhận stale data hoặc thêm write coordination.

</details>

<details>
<summary><b>Q3. Vì sao cần unique constraint dù đã validate trong app?</b></summary>

Concurrent requests/background jobs bypass check-then-insert timing. Constraint enforce invariant atomically cho mọi writer.

</details>

<details>
<summary><b>Q4. Expand-contract migration gồm bước nào?</b></summary>

Thêm schema tương thích, deploy code đọc/ghi hai dạng khi cần, backfill, chuyển readers, theo dõi rồi xóa schema cũ sau khi không còn consumers.

</details>

<details>
<summary><b>Q5. Chọn composite key order thế nào?</b></summary>

Theo uniqueness/invariants và query patterns (leading predicates/order), size và FK ergonomics; xác nhận bằng execution plan.

</details>

## 7. Ứng dụng vào CV

- Thiết kế normalized core schema và read projections cho **[domain]**, giảm inconsistent records **[A]%** và p95 reporting latency **[B]%**.
- Triển khai expand-contract migration trên bảng **[N] triệu rows** không downtime, duy trì error rate dưới **[A]%**.

## 8. Tài liệu tham khảo

- [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Martin Fowler: Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)
- [Use The Index, Luke: Data Modeling](https://use-the-index-luke.com/sql/data-structure)
- [AWS: Database migration strategies](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-database-migration/)
