# Promise, async/await, error handling, Promise.all/allSettled/race/any

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Promise biểu diễn eventual result; executor chạy đồng bộ, handlers `.then/.catch/.finally` được schedule thành microtask.
- `async` luôn trả Promise; `await` unwrap/rethrow rejection nhưng không tạo thread và không biến CPU work thành non-blocking.
- `Promise.all` fail-fast nhưng không tự cancel task khác; `allSettled` thu mọi outcome; `race` lấy outcome đầu tiên; `any` lấy fulfillment đầu tiên.
- Fan-out cần concurrency limit; `Promise.all` trên mảng lớn có thể gây overload.
- Async error boundary phải `await`/return Promise; fire-and-forget cần handler, deadline và observability.

## 2. Khái niệm cốt lõi

Promise có trạng thái pending, fulfilled hoặc rejected, chỉ settle một lần. Promise resolution procedure adopt Promise/thenable được return. `.then(onFulfilled, onRejected)` tạo Promise mới: return value fulfill chain, throw/rejection reject chain. `.finally()` chạy cleanup nhưng nếu callback ném/return rejected Promise thì có thể thay đổi outcome.

`async function` luôn trả Promise; exception trong body trở thành rejection. `await` tạm dừng continuation tới khi Promise settle, rồi continuation vào microtask; JavaScript thread vẫn xử lý việc khác. Công việc đồng bộ dài trước/sau await vẫn block event loop. Await tuần tự tạo latency nối tiếp nếu tasks độc lập; `Promise.all` khởi động trước rồi chờ đồng thời.

Combinators có semantics khác nhau: `all` resolve khi mọi fulfillment, reject khi một input reject nhưng các promise khác vẫn chạy; `allSettled` trả status/value hoặc reason theo input order; `race` settle theo promise đầu tiên hoàn tất dù fulfilled hay rejected; `any` fulfill theo promise đầu tiên fulfill và chỉ reject `AggregateError` nếu tất cả đều reject. Không combinator nào tự giới hạn concurrency/cancel task.

Cancellation thường truyền qua `AbortSignal` cho APIs hỗ trợ. Timeout bằng `Promise.race` chỉ dừng chờ caller; operation gốc có thể vẫn chạy nếu không nhận signal. Retry cần phân loại lỗi, idempotency, deadline, backoff/jitter. Rejection cần được xử lý ở nơi có thể quyết định retry/respond/log; process-level unhandled handler chỉ là safety net.

## 3. Code ví dụ

Ví dụ gom kết quả thất bại mà không bỏ các request thành công.

```js
async function loadProfiles(ids, fetchProfile) {
	const outcomes = await Promise.allSettled(ids.map((id) => fetchProfile(id)));
	return outcomes.map((outcome, index) => ({
		id: ids[index],
		profile: outcome.status === 'fulfilled' ? outcome.value : null,
		error: outcome.status === 'rejected' ? outcome.reason : null,
	}));
}
```

Với hàng nghìn IDs, không tạo toàn bộ request đồng thời; thêm worker pool/semaphore, batch hoặc queue có giới hạn. `fetchProfile` nên hỗ trợ abort/deadline ở network boundary.

## 4. Trade-off & Best practices

- Dùng `Promise.all` khi mọi result đều cần; `allSettled` khi cần báo cáo từng kết quả; `any` cho fallback replicas; `race` cho timeout chỉ khi underlying task cũng được cancel.
- Return Promise từ function thay vì fire-and-forget ngầm; chỗ khởi chạy background task cần attach `.catch()` và lifecycle ownership.
- Dùng `try/catch` quanh await ở boundary có recovery; giữ error cause/context và rethrow khi không xử lý được.
- Áp dụng concurrency limit và backpressure cho fan-out, tránh làm cạn sockets, rate limits hoặc memory.
- Truyền `AbortSignal` từ request deadline xuống fetch/DB khi API hỗ trợ; cancel công việc không còn giá trị sau client disconnect.
- Retry idempotent transient failures với bounded attempts, jitter và total deadline; không retry validation/auth errors.
- Viết test async luôn await assertion/Promise và kiểm tra cancellation/error paths.

## 5. Lỗi thường gặp / Pitfalls

- `array.forEach(async () => ...)` rồi hàm ngoài return trước callback completion.
- Dùng `Promise.all` tưởng rằng một rejection sẽ cancel phần còn lại.
- Dùng `Promise.race` timeout nhưng request gốc vẫn tiếp tục chạy và tiêu thụ resource.
- Quên return Promise trong `.then`, làm chain không chờ lỗi downstream.
- Bắt lỗi rồi chỉ log, khiến caller nghĩ operation thành công.
- Await tuần tự các task độc lập, tăng latency tổng không cần thiết.
- Fan-out không giới hạn gây thundering herd hoặc rate-limit burst.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Promise executor chạy đồng bộ hay async?</b></summary>

Executor chạy đồng bộ khi Promise được tạo; resolve/reject handlers chạy qua microtask queue.

</details>

<details>
<summary><b>Q2. `Promise.all` fail-fast có cancel task khác không?</b></summary>

Không. Aggregate Promise reject khi một input reject, nhưng các operation khác tiếp tục trừ khi có cancellation như AbortController.

</details>

<details>
<summary><b>Q3. Khác nhau giữa `race` và `any`?</b></summary>

`race` settle theo promise đầu tiên bất kể status; `any` đợi fulfillment đầu tiên và chỉ reject khi tất cả input đều reject.

</details>

<details>
<summary><b>Q4. `await` có block event loop không?</b></summary>

Bản thân await nhường continuation, nhưng synchronous code trước/sau await vẫn chạy trên thread hiện tại và có thể block.

</details>

<details>
<summary><b>Q5. Timeout một Promise đúng cách thế nào?</b></summary>

Dùng API hỗ trợ AbortSignal để hủy operation và truyền deadline; chỉ race với timer thì caller ngừng chờ nhưng operation có thể còn chạy.

</details>

<details>
<summary><b>Q6. Khi nào dùng `allSettled` thay `all`?</b></summary>

Khi cần nhận kết quả từng task dù một số thất bại, ví dụ batch báo lỗi theo từng record. Nếu toàn bộ thành công là invariant, `all` rõ hơn.

</details>

## 7. Ứng dụng vào CV

- Thiết kế bounded concurrent fan-out với cancellation/deadline, giảm thời gian tổng hợp **[N]** upstreams từ **[A] ms xuống [B] ms**.
- Chuẩn hóa retry/error handling cho Promise workflows, giảm unhandled rejections **[A]%** và request timeout **[B]%**.

## 8. Tài liệu tham khảo

- [MDN: Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Node.js: Timers Promises API](https://nodejs.org/api/timers.html#timers-promises-api)
