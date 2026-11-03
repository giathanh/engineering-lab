# Concurrency cơ bản: process/thread, async, race condition, deadlock, lock

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Concurrency là nhiều task có tiến độ đan xen; parallelism là thực thi đồng thời trên nhiều core. Có concurrency không đồng nghĩa có parallelism.
- Process có address space riêng; thread chia sẻ memory trong process; async thường dùng event/callback để chờ I/O mà không giữ thread chờ.
- Race condition xảy ra khi kết quả phụ thuộc timing/interleaving; read-modify-write thường không atomic chỉ vì một dòng code.
- Lock/mutex bảo vệ critical section; deadlock thường cần mutual exclusion, hold-and-wait, no preemption và circular wait.
- Dùng giới hạn concurrency, timeout/cancellation, lock ordering và idempotency; synchronization quá rộng giảm throughput và có thể che thiết kế sai.

## 2. Khái niệm cốt lõi

Process là đơn vị isolation của OS với virtual address space riêng; giao tiếp qua IPC như socket, pipe hoặc shared memory. Thread chạy trong process và chia sẻ heap, nên trao đổi rẻ nhưng cần đồng bộ khi nhiều thread truy cập mutable state. Runtime có thể thêm worker thread, event loop hoặc scheduler; chi tiết khác nhau theo ngôn ngữ.

Concurrency mô tả cấu trúc chương trình có nhiều task tiến triển độc lập. Trên một core, scheduler có thể interleave chúng; trên nhiều core, chúng có thể chạy song song. Async I/O không nhất thiết tạo thread: task đăng ký chờ completion và thread tiếp tục làm việc khác. CPU-bound task vẫn cần CPU; muốn parallelism cần worker/process hoặc runtime support.

Race condition là lỗi logic do kết quả phụ thuộc thứ tự thực thi không được đảm bảo. Ví dụ kiểm tra đủ số dư rồi chạy `balance -= amount` là chuỗi đọc–kiểm tra–ghi; bản thân phép `-=` chỉ đọc–tính–ghi; nếu có await/context switch hoặc nhiều thread/process, hai tác vụ có thể cùng đọc số dư cũ. Atomicity của một operation cấp thấp không làm chuỗi nghiệp vụ nhiều bước trở thành transaction.

Mutex/lock cho phép một owner vào critical section; semaphore giới hạn số task đồng thời; condition variable/event hỗ trợ chờ state predicate; message passing giảm chia sẻ mutable state. Distributed systems không thể dựa vào in-process mutex để khóa giữa nhiều instance; cần database transaction/lock, distributed coordination hoặc thiết kế idempotent.

Deadlock thường được phân tích qua bốn điều kiện Coffman: mutual exclusion, hold-and-wait, no preemption và circular wait. Có thể phòng bằng thứ tự acquire lock toàn cục, giữ lock ngắn, tránh I/O khi đang giữ lock, dùng timeout/try-lock hoặc loại bỏ nhu cầu nhiều lock. Timeout giảm treo nhưng không tự sửa tính đúng đắn.

## 3. Code ví dụ

Ví dụ minh họa race trong JavaScript khi hai async operation xen kẽ. JavaScript có một main thread nhưng `await` tạo điểm interleaving; cả hai lần rút có thể đọc cùng số dư.

```js
let balance = 100;

async function withdraw(amount) {
	const observed = balance;
	await Promise.resolve(); // Simulates an asynchronous boundary.
	if (observed >= amount) balance = observed - amount;
}

await Promise.all([withdraw(80), withdraw(80)]);
console.log(balance); // 20: both checks pass in this exact example; one update is lost.
```

Trong ứng dụng thật, sửa tại nơi sở hữu state bằng conditional update, ví dụ SQL `UPDATE accounts SET balance = balance - :amount WHERE id = :id AND balance >= :amount` và kiểm tra affected rows. Nếu còn ghi ledger, ghép update và ledger trong một transaction. In-memory mutex chỉ giải quyết race trong một process, không bảo vệ được invariant giữa nhiều process/instance.

## 4. Trade-off & Best practices

- Dùng async I/O cho nhiều thao tác network/file; dùng worker/process cho CPU-bound parallelism hoặc isolation. Không tạo thread cho mỗi I/O request nếu runtime đã multiplex.
- Ưu tiên immutable data/message passing để giảm shared mutable state; copy/serialization có chi phí, nên đo payload lớn.
- Giữ critical section ngắn, không gọi network/DB khi đang giữ in-process lock; thống nhất lock ordering và cleanup trong `finally`.
- Giới hạn concurrency bằng semaphore/queue có bounded capacity; overload cần backpressure/reject thay vì queue vô hạn.
- Phân biệt process-local consistency với distributed consistency. DB transaction/unique constraint thường là nơi đúng để bảo vệ invariant tài chính/dữ liệu.
- Thêm timeout, cancellation và deadline propagation; task bị caller hủy mà vẫn chạy tiếp có thể giữ tài nguyên và cập nhật state lỗi thời.
- Test race bằng stress/repeated schedules nhưng không dựa duy nhất vào test may mắn; xác định invariant và dùng primitive atomic/transaction đúng tầng.

## 5. Lỗi thường gặp / Pitfalls

- Đồng nhất concurrency với parallelism hoặc nghĩ `async` làm CPU-bound function chạy nền.
- Cho rằng JavaScript một thread nên không thể có race; async interleaving vẫn gây race logic, và worker/process có shared state/IPC riêng.
- Lock quá rộng làm throughput thấp; lock nhiều resource theo thứ tự khác nhau gây deadlock.
- Giữ lock khi chờ network/DB, khiến contention tăng và failure kéo dài critical section.
- Dùng mutex in-memory để bảo vệ invariant khi service chạy nhiều instance.
- Tăng retry/concurrency khi dependency chậm, tạo queue buildup và cascading failure.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Concurrency khác parallelism thế nào?</b></summary>

Concurrency là nhiều task có thể tiến triển xen kẽ; parallelism là nhiều task thực thi cùng thời điểm trên nhiều execution unit. Một event loop đơn có concurrency nhưng không chạy JS song song trên main thread.

</details>

<details>
<summary><b>Q2. Vì sao async code vẫn có race condition?</b></summary>

Các task có thể interleave tại điểm await/callback; chuỗi đọc-check-ghi không atomic. Kết quả phụ thuộc thứ tự completion dù callback JS chạy từng cái một.

</details>

<details>
<summary><b>Q3. Nêu bốn điều kiện deadlock.</b></summary>

Mutual exclusion, hold-and-wait, no preemption và circular wait. Phá ít nhất một điều kiện, ví dụ lock ordering để ngăn circular wait.

</details>

<details>
<summary><b>Q4. Khi nào dùng mutex, khi nào dùng database transaction?</b></summary>

Mutex cho critical section process-local; transaction/constraint bảo vệ invariant dữ liệu qua nhiều request/process và đảm bảo atomicity tại DB. Chọn theo nơi sở hữu state.

</details>

<details>
<summary><b>Q5. Semaphore khác mutex thế nào?</b></summary>

Mutex thường cho một owner vào critical section tại một thời điểm; semaphore cho phép tối đa N tác vụ dùng resource đồng thời. Semaphore phù hợp giới hạn pool/concurrency.

</details>

<details>
<summary><b>Q6. Làm sao giảm deadlock risk khi có nhiều lock?</b></summary>

Định nghĩa global lock order, giữ lock ngắn, không làm I/O trong critical section, dùng timeout/try-lock khi phù hợp và theo dõi lock wait. Cần xem lại thiết kế nếu phải phối hợp nhiều lock thường xuyên.

</details>

## 7. Ứng dụng vào CV

- Chuyển cập nhật inventory từ read-modify-write sang transaction/conditional update, giảm oversell từ **[A] xuống [B] incident/tháng** ở **[N] req/s**.
- Thiết kế bounded concurrency và backpressure cho **[worker pipeline]**, nâng throughput **[A]%** mà không vượt p95 latency **[B] ms**.

## 8. Tài liệu tham khảo

- [The Art of Multiprocessor Programming (publisher overview)](https://www.elsevier.com/books/the-art-of-multiprocessor-programming/herlihy/978-0-12-415950-1)
- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/)
- [Node.js: Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [PostgreSQL: Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
