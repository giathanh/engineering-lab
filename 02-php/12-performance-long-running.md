# Performance PHP & long-running (Swoole/RoadRunner/FrankenPHP)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Profile trước khi tối ưu: tách CPU, DB, network, serialization, lock wait, memory và queue time; p95/p99 quan trọng hơn một mean đẹp.
- OPcache giảm compile overhead; application cache/query/index/batching thường ảnh hưởng lớn hơn micro-optimization PHP.
- PHP-FPM thường xử lý request bằng worker process; Swoole/Coroutine, RoadRunner và FrankenPHP hỗ trợ long-running worker models với lifecycle khác.
- Long-running process cần request/job state cleanup, reset mutable services, giới hạn memory và xử lý worker recycle.
- Tuning concurrency không giới hạn có thể làm DB/API quá tải; đặt backpressure và benchmark end-to-end.

## 2. Khái niệm cốt lõi

Performance cần xác định mục tiêu: throughput, latency percentile, CPU cost, memory per worker, startup time hay cost per request. Amdahl’s law nhắc rằng tối ưu một phần nhỏ không tạo speedup lớn nếu phần đó chiếm ít tổng latency. Tracing/profiling tách app CPU khỏi DB/network wait; slow query, N+1, payload lớn và queue congestion thường là nguyên nhân chính.

PHP-FPM có process pool; mỗi process phục vụ nhiều request lần lượt, nhưng userland request state được teardown sau mỗi request. Không được đồng nhất request lifecycle với process lifecycle. OPcache tối ưu opcode. Long-running servers giữ bootstrap/application process qua nhiều request: Swoole có event/coroutine runtime và extension ecosystem; RoadRunner dùng Go process manager giao tiếp với PHP workers qua protocol; FrankenPHP tích hợp PHP với Caddy và có worker mode. Laravel Octane có thể chạy trên các runtime được hỗ trợ, nhưng semantics và feature compatibility khác nhau theo runtime/version.

Long-running workers giảm bootstrap overhead và giữ warm resources, nhưng làm lộ static/singleton mutable state, memory leak, resource exhaustion và request context leakage. Coroutine concurrency có thể tăng I/O parallelism nếu libraries/runtime support; blocking call không tương thích có thể chặn worker. “Async runtime” không tự làm mọi dependency non-blocking.

## 3. Code ví dụ

Ví dụ đo elapsed time và peak allocator memory cho một đoạn workload để benchmark có số liệu; chạy CLI bằng PHP 8.3+. Dùng nhiều lần và dữ liệu đại diện trước khi kết luận.

```php
<?php
declare(strict_types=1);

$startedAt = hrtime(true);
$startMemory = memory_get_usage(true);

$total = 0;
for ($value = 1; $value <= 1_000_000; $value++) {
	$total += $value;
}

$elapsedMs = (hrtime(true) - $startedAt) / 1_000_000;
$peakMemory = memory_get_peak_usage(true);
printf(
	"total=%d elapsed=%.2fms start=%dB peak=%dB\n",
	$total,
	$elapsedMs,
	$startMemory,
	$peakMemory,
);
```

Đo benchmark trong process isolated, warm-up nếu cần, lặp nhiều lần và dùng profiler như Xdebug/Blackfire/Tideways tùy môi trường. Không so kết quả CLI với FPM/Octane nếu runtime/configuration khác.

## 4. Trade-off & Best practices

- Tối ưu theo profile và SLO; dùng query plan/index/batching trước micro-optimization syntax.
- Benchmark production-like concurrency, payload, database/network latency và cache hit ratio; kiểm tra p50/p95/p99, error rate và resource headroom.
- Chọn long-running runtime khi bootstrap overhead/throughput có lợi ích đo được và team có năng lực vận hành; cân nhắc extension compatibility, debugging, deployment và worker lifecycle.
- Trong worker, giữ state immutable hoặc request-scoped; reset context, close resource và recycle worker theo memory/requests/time.
- Kiểm tra coroutine safety của DB/HTTP clients; tránh blocking I/O trong coroutine path và đặt timeout/cancellation.
- Đặt concurrency/connection pool phù hợp capacity downstream; queue/backpressure, circuit breaker và rate limit ngăn overload lan truyền.
- Dùng canary/load test trước rollout, có fallback FPM/process mode và dashboard memory per worker, restart rate, event-loop/worker busy time.

## 5. Lỗi thường gặp / Pitfalls

- Tối ưu bằng cảm giác hoặc benchmark micro không đại diện production.
- Chuyển sang long-running server mà giữ request data trong static/singleton, gây cross-user leakage.
- Giả định coroutine runtime biến blocking library thành non-blocking.
- Tăng worker/concurrency vượt DB pool capacity, làm latency và error rate tăng.
- Đo `memory_get_usage()` nhưng bỏ qua RSS/native memory/container limit.
- Không test graceful shutdown, worker recycle, deploy overlap hoặc request cancellation.
- So sánh Swoole/RoadRunner/FrankenPHP chỉ theo benchmark framework khác nhau mà không chuẩn hóa environment.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Khi nào long-running PHP runtime đáng dùng?</b></summary>

Khi profile chứng minh bootstrap/request overhead đáng kể hoặc cần concurrency/connection reuse, và ứng dụng có thể đảm bảo state cleanup, compatibility và vận hành worker lifecycle.

</details>

<details>
<summary><b>Q2. Rủi ro khác biệt lớn so với PHP-FPM?</b></summary>

Process giữ state qua nhiều request; mutable singleton/static, memory growth và resource lifecycle có thể gây cross-request bugs. FPM request model thường che một phần rủi ro này.

</details>

<details>
<summary><b>Q3. Swoole, RoadRunner, FrankenPHP khác định hướng nào?</b></summary>

Chúng khác runtime/process management và integration: Swoole cung cấp extension coroutine/server runtime; RoadRunner dùng Go worker manager; FrankenPHP tích hợp Caddy và PHP worker mode. Compatibility/deployment phải kiểm chứng theo app.

</details>

<details>
<summary><b>Q4. Làm sao xử lý memory growth trong worker?</b></summary>

Profile retained state/RSS theo số job, cleanup request-scoped references/resources, giới hạn cache/batch và recycle worker có kiểm soát. Recycle không thay root-cause fix.

</details>

<details>
<summary><b>Q5. Vì sao tăng concurrency có thể làm chậm hệ thống?</b></summary>

Workers tranh chấp CPU/memory hoặc vượt DB/API connection capacity, gây queueing và tail latency. Throughput tối đa phụ thuộc bottleneck và cần bounded concurrency.

</details>

<details>
<summary><b>Q6. Chọn metric nào để đánh giá optimization?</b></summary>

Đo SLO liên quan như p95/p99, throughput, error rate, CPU, RSS, DB wait/queries và queue depth dưới cùng workload. Xác nhận không trade latency lấy lỗi/memory.

</details>

## 7. Ứng dụng vào CV

- Profile và tối ưu **[endpoint/job]** qua SQL/index/batching, giảm p95 từ **[A] ms xuống [B] ms** và tăng throughput **[C]%**.
- Chuyển workload sang long-running workers với state reset, bounded concurrency và recycling, giảm bootstrap cost **[A]%** mà không tăng memory vượt **[B] MB/worker**.

## 8. Tài liệu tham khảo

- [Laravel Octane](https://laravel.com/docs/11.x/octane)
- [OpenSwoole documentation (fork của Swoole; API/extension khác Swoole gốc)](https://openswoole.com/docs)
- [RoadRunner documentation](https://docs.roadrunner.dev/)
- [FrankenPHP documentation](https://frankenphp.dev/docs/)
- [PHP: hrtime](https://www.php.net/manual/en/function.hrtime.php)
