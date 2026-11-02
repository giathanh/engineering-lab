# Laravel nâng cao: queue/job, event/listener, cache, scheduler, broadcasting, Octane

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Queue tách công việc chậm khỏi HTTP request; job cần idempotency, timeout/retry policy, observability và dead-letter/failure handling.
- Event/listener tách producer-consumer trong app; event nội bộ không tự cung cấp durability như broker/queue.
- Cache cần key/version, TTL, invalidation và stampede strategy; cache correctness quan trọng hơn hit ratio đơn lẻ.
- Scheduler chạy periodic tasks; dùng overlap prevention/distributed lock khi nhiều scheduler instance cùng hoạt động.
- Broadcasting/WebSocket phát event realtime nhưng client reconnect, authorization và fan-out vẫn cần thiết kế.
- Octane giữ application worker sống lâu; tránh giữ request/user state trong singleton/static và tuân thủ lifecycle reset.

## 2. Khái niệm cốt lõi

Queue job được serialize/dispatch rồi worker xử lý độc lập request. Laravel queue driver có semantics khác nhau; “at least once” behavior có thể dẫn tới job chạy lại nếu worker chết sau side effect nhưng trước acknowledgment. Vì vậy job nên idempotent (idempotency key/unique constraint), có timeout nhỏ hơn visibility/retry window phù hợp, backoff+jitter và failure workflow. `afterCommit` tránh job chạy trước transaction commit; outbox pattern tăng reliability khi cần atomic DB write + publish.

Events giúp mô tả fact đã xảy ra; listener có thể đồng bộ hoặc queued. Tránh event chain khó trace; tên event là domain fact, không phải lệnh mơ hồ. Cache-aside phổ biến: read cache, miss thì query source rồi set TTL. Invalidation khó vì nhiều writer/key versions; cache stampede xảy ra khi nhiều request cùng miss một key nóng. Dùng lock/single-flight, stale-while-revalidate hoặc TTL jitter theo yêu cầu consistency.

Scheduler thường cấu hình command/job định kỳ; nhiều app replica có thể cùng chạy task. `onOneServer` cần shared cache/lock backend; `withoutOverlapping` tránh lần trước chưa xong. Không nên coi scheduler lock là exactly-once; task vẫn cần idempotency và alert cho missed/failed run.

Broadcasting đưa event tới client qua WebSocket provider/channel; authorization channel là boundary bảo mật. Octane giữ worker bootstrapped giữa requests để giảm startup overhead. Laravel reset một số framework state, nhưng object mutable static/singleton tự tạo có thể sống lâu hơn request. Long-running mode thay đổi giả định shared-nothing cổ điển.

## 3. Code ví dụ

Ví dụ job có retry/backoff và transaction-safe dispatch trong Laravel 11. Job phải nhận identifier thay vì serialize model graph lớn khi phù hợp.

```php
<?php
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class RebuildInvoice implements ShouldQueue
{
	use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

	public int $tries = 5;
	public int $timeout = 60;

	public function __construct(public readonly int $invoiceId) {}

	public function backoff(): array
	{
		return [10, 30, 120];
	}

	public function handle(InvoiceService $invoices): void
	{
		$invoices->rebuildIdempotently($this->invoiceId);
	}
}
```

Dispatch từ transaction bằng `RebuildInvoice::dispatch($invoiceId)->afterCommit()` khi worker phụ thuộc dữ liệu vừa ghi. `afterCommit` không bảo đảm publish bền vững: process vẫn có thể chết sau commit trước khi enqueue; dùng transactional outbox nếu cần khép khoảng trống này. Tên API/config có thể phụ thuộc cách queue connection được cấu hình; cần test integration với driver production.

## 4. Trade-off & Best practices

- Queue công việc chậm/không cần response ngay; giữ synchronous path cho validation/critical response. Đặt queue theo workload và giới hạn worker concurrency.
- Job payload nhỏ, chứa ID/version và fetch state mới nhất; thiết kế duplicate delivery/retry an toàn.
- Cache key có namespace/version, TTL rõ; instrument hit/miss/eviction và source latency. Invalidation theo write path hoặc versioning cần được document/test.
- Scheduler dùng distributed cache phù hợp production, command idempotent và có monitoring cho runtime/last success.
- Event nội bộ cho decoupling trong process; queue/broker cho async durable work. Không gọi listener async mà giả định request đã hoàn tất side effect.
- Broadcasting: authorize channel theo user/tenant, tránh broadcast sensitive payload; gửi ID/event summary rồi client fetch resource nếu cần.
- Octane: audit static/singleton state, closures giữ request, mutable config và resource cleanup; test nhiều request liên tiếp trong một worker.

## 5. Lỗi thường gặp / Pitfalls

- Retry job không idempotent khiến charge/email/order bị lặp.
- Dispatch job trước khi transaction commit, worker đọc không thấy row hoặc job fail race.
- Tăng queue worker vượt DB/API capacity, chuyển backlog thành downstream outage.
- Cache dữ liệu tenant/user nhưng key thiếu tenant scope, gây data leakage.
- Scheduler chạy trùng trên nhiều replica hoặc lock backend không shared.
- Broadcast authorization thiếu hoặc gửi toàn bộ model/private data.
- Dùng singleton state trong Octane để lưu user/request context, gây leak giữa request.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Vì sao queue job phải idempotent?</b></summary>

Worker có thể retry hoặc nhận lại message sau crash/timeout. Idempotency bảo đảm thực thi lặp không nhân đôi side effect; dùng unique constraint/key hoặc state transition có điều kiện.

</details>

<details>
<summary><b>Q2. `afterCommit` giải quyết race nào?</b></summary>

Đảm bảo job/listener chỉ được dispatch sau khi DB transaction commit, tránh worker chạy sớm và không thấy row hoặc xử lý dữ liệu sẽ rollback.

</details>

<details>
<summary><b>Q3. Cache invalidation có những chiến lược nào?</b></summary>

TTL, explicit delete, versioned keys, write-through hoặc stale-while-revalidate. Lựa chọn phụ thuộc freshness requirement, write paths và cost của stale data.

</details>

<details>
<summary><b>Q4. `withoutOverlapping` có bảo đảm exactly once?</b></summary>

Không. Nó giảm chạy đồng thời qua lock backend nhưng crash/lease expiry vẫn có thể dẫn đến lần chạy lại. Task cần idempotency và monitoring.

</details>

<details>
<summary><b>Q5. Event khác queued job thế nào?</b></summary>

Event biểu diễn fact và có thể có nhiều listener; job là đơn vị công việc được dispatch. Event listener có thể sync hoặc queue; chỉ queue/broker được cấu hình mới cung cấp async durability semantics.

</details>

<details>
<summary><b>Q6. Rủi ro quan trọng nhất khi dùng Octane?</b></summary>

Process sống lâu khiến mutable state hoặc resource có thể tồn tại qua nhiều request. Không giữ request/user data trong singleton/static và cần test lifecycle/reset.

</details>

## 7. Ứng dụng vào CV

- Thiết kế idempotent queue pipeline cho **[N]** jobs/ngày với bounded retries và after-commit dispatch, giảm xử lý trùng **[A]%**.
- Tuning cache/scheduler/Octane lifecycle, giảm p95 latency **[A]%** và backlog tối đa từ **[B] xuống [C] jobs**.

## 8. Tài liệu tham khảo

- [Laravel 11: Queues](https://laravel.com/docs/11.x/queues)
- [Laravel 11: Events](https://laravel.com/docs/11.x/events)
- [Laravel 11: Cache](https://laravel.com/docs/11.x/cache)
- [Laravel 11: Task Scheduling](https://laravel.com/docs/11.x/scheduling)
- [Laravel Octane](https://laravel.com/docs/11.x/octane)
