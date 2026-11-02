# Transaction, ACID, isolation levels, locking, deadlock

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Transaction nhóm thao tác thành unit atomic theo database semantics; ACID là atomicity, consistency, isolation, durability.
- Isolation level quyết định anomalies/visibility; tên level không đảm bảo implementation giống nhau giữa engines.
- MVCC tạo snapshots/versions để reader giảm block writer, nhưng vẫn có locks, vacuum/version cleanup và serialization conflicts.
- Deadlock xảy ra khi transaction chờ lock tạo cycle; database thường abort một victim, ứng dụng cần retry toàn transaction có giới hạn.
- Giữ transaction ngắn, lock order nhất quán, có index cho locking predicates và không gọi network trong transaction.

## 2. Khái niệm cốt lõi

Atomicity đảm bảo transaction commit toàn bộ hoặc rollback; consistency là constraints/invariants được bảo toàn; isolation kiểm soát concurrent visibility; durability bảo đảm commit tồn tại theo cấu hình storage/replication. Database constraint là lớp bảo vệ invariant mạnh hơn chỉ validate ở application vì mọi writer cùng chịu kiểm tra.

Isolation anomalies gồm dirty read, non-repeatable read, phantom và write skew. Read Committed thường tạo snapshot mỗi statement; Repeatable Read giữ snapshot transaction nhưng anomaly/phantom semantics tùy engine; Serializable cố đảm bảo tương đương execution tuần tự nhưng có thể abort transaction. PostgreSQL dùng SSI cho Serializable, MySQL/InnoDB có locking/MVCC implementation riêng. Không suy diễn chỉ từ tên isolation level.

MVCC cho phép readers nhìn version phù hợp snapshot trong khi writers tạo version mới. Nó giảm blocking nhưng cần dọn old versions, có thể gây bloat nếu transaction dài giữ snapshot cũ. `SELECT ... FOR UPDATE` khóa rows được chọn để phối hợp read-modify-write; hiệu quả phụ thuộc index/isolation/DB engine và phạm vi rows.

Deadlock: T1 giữ A chờ B, T2 giữ B chờ A. DB phát hiện cycle và rollback victim. Retry cần bắt đúng error code, restart toàn transaction, dùng exponential backoff+jitter và idempotent side effects. Consistent lock ordering, updates theo key order, transaction ngắn và index tốt giảm deadlock. Optimistic concurrency dùng version column/conditional update để phát hiện conflict thay vì khóa lâu.

## 3. Code ví dụ

Pseudo-SQL transfer tiền với row locks và thứ tự khóa ổn định. Cần kiểm tra rows affected và currency/business invariants trong transaction.

```sql
BEGIN;

SELECT id, balance
FROM accounts
WHERE id IN (:from_id, :to_id)
ORDER BY id
FOR UPDATE;

UPDATE accounts
SET balance = balance - :amount
WHERE id = :from_id AND balance >= :amount;

-- Application verifies exactly one source row was updated before crediting.
UPDATE accounts
SET balance = balance + :amount
WHERE id = :to_id;

COMMIT;
```

Thực tế phải rollback nếu debit không update đúng một row; `amount > 0`, account ownership/currency và idempotency key cần được validate. SQL syntax/locking behavior phụ thuộc database.

## 4. Trade-off & Best practices

- Chọn isolation theo invariant và anomaly risk; dùng unique/check/FK constraints thay application check-then-insert race.
- Giữ transaction ngắn, chỉ chứa DB operations; enqueue/send external effects sau commit hoặc dùng outbox.
- Lock rows theo thứ tự thống nhất; index predicate để khóa ít rows hơn và giảm scan/lock footprint.
- Retry deadlock/serialization abort toàn transaction, bounded attempts; không retry partial side effects ngoài transaction.
- Dùng optimistic versioning cho conflict thấp; pessimistic locks khi contention/correctness cần serialization tức thì.
- Theo dõi lock waits, deadlocks, transaction age, replication lag và retry rates.
- Test concurrency trên đúng engine/isolation, không chỉ SQLite/in-memory mock.

## 5. Lỗi thường gặp / Pitfalls

- Nghĩ transaction đơn lẻ ngăn mọi race; isolation default có thể cho anomaly.
- Thực hiện HTTP/email trong transaction, giữ locks lâu và side effect không rollback.
- Catch deadlock rồi retry một statement thay vì transaction logic đầy đủ.
- Dùng `SELECT` rồi update mà không lock/version condition, tạo lost update.
- Transaction dài giữ MVCC snapshots, gây bloat/cleanup pressure.
- Không enforce unique constraint nên concurrent requests tạo duplicates.
- Dùng `FOR UPDATE` trên query không selective/indexed, khóa nhiều rows ngoài ý muốn.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. ACID gồm gì?</b></summary>

Atomicity, Consistency, Isolation, Durability. Mức đảm bảo cụ thể chịu ảnh hưởng engine, configuration và storage/replication setup.

</details>

<details>
<summary><b>Q2. MVCC loại bỏ locks không?</b></summary>

Không. Nó cho readers dùng snapshots để giảm reader-writer blocking, nhưng writes vẫn lock/conflict; version cleanup và serialization vẫn tồn tại.

</details>

<details>
<summary><b>Q3. Deadlock nên được xử lý thế nào?</b></summary>

Phòng bằng lock ordering/index/transaction ngắn; khi DB abort victim, retry toàn transaction có giới hạn/backoff và bảo đảm idempotency.

</details>

<details>
<summary><b>Q4. Pessimistic và optimistic locking khác gì?</b></summary>

Pessimistic khóa resource trước khi mutate; optimistic cho phép chạy rồi kiểm tra version/conflict khi commit. Chọn theo contention và chi phí retry.

</details>

<details>
<summary><b>Q5. Vì sao unique constraint cần thiết?</b></summary>

Application check-then-insert có race giữa transactions. Unique constraint thực thi invariant atomically tại database.

</details>

## 7. Ứng dụng vào CV

- Thiết kế transaction/locking strategy cho **[workflow]**, giảm deadlocks **[A]%** và bảo đảm không phát sinh **[invariant violation]** ở **[N] tx/s**.
- Thay check-then-write bằng constraints/optimistic versioning, giảm duplicate records **[A]%**.

## 8. Tài liệu tham khảo

- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL: Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [MySQL: InnoDB Transaction Isolation](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)
- [MySQL: InnoDB Deadlocks](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html)

