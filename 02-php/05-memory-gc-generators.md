# Memory management, garbage collection, generators, xử lý file/data lớn

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- PHP values thường dùng reference counting; cycle collector tìm vòng reference không thể thu hồi chỉ bằng refcount.
- Copy-on-write cho phép chia sẻ zval/payload cho đến khi một bên mutate; “gán array” không nhất thiết copy toàn bộ ngay lập tức.
- Generator (`yield`) phát value từng bước, giữ state cần thiết thay vì materialize toàn bộ iterable.
- Xử lý file lớn theo stream/chunk/generator và đặt giới hạn batch; streaming chỉ có ích nếu consumer không giữ mọi result.
- Trong long-running worker, memory có thể tăng do retained references, cache/ORM state, extension allocation hoặc fragmentation; đo RSS/peak và cleanup đúng lifecycle.

## 2. Khái niệm cốt lõi

Zend Engine quản lý zval và heap allocation. Reference counting tăng/giảm theo số tham chiếu; khi count về zero, giá trị có thể được giải phóng. Object/array có thể chứa reference vòng (`A -> B -> A`), khi đó refcount không về zero. Cycle collector phát hiện các candidate cycle để thu hồi; `gc_collect_cycles()` có thể hữu ích trong chẩn đoán/batch, không nên gọi tùy tiện mỗi request.

Copy-on-write giảm copy eager: biến mới có thể chia sẻ backing data cho đến khi một bên thay đổi. Mutation có thể tạo copy và tăng memory/time đột ngột; passing large arrays qua nhiều tầng có thể vẫn rẻ nếu chỉ đọc, nhưng biến đổi có thể kích hoạt copy. `memory_get_usage()`/`memory_get_peak_usage()` cung cấp dữ liệu allocator PHP; RSS của process còn bao gồm native allocations và memory allocator giữ lại.

Generator là stateful iterator tạm dừng tại `yield`, tiếp tục khi consumer yêu cầu phần tử tiếp theo. Nó giảm peak memory khi nguồn có thể đọc tăng dần. Tuy nhiên, nếu consumer gom tất cả vào array, lợi ích mất; generator cũng là one-pass và exceptions phát sinh ở lúc iteration chứ không nhất thiết khi tạo generator.

## 3. Code ví dụ

Ví dụ đọc CSV từng dòng, bỏ qua header và yield record một lượt. Kiểm tra file/error handling nên được bổ sung theo nhu cầu ứng dụng.

```php
<?php
declare(strict_types=1);

function rowsFromCsv(string $path): Generator
{
	$file = new SplFileObject($path, 'r');
	$file->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY);
	$headers = null;

	foreach ($file as $row) {
		if ($row === [null] || $row === false) {
			continue;
		}
		if ($headers === null) {
			$headers = $row;
			continue;
		}
		yield array_combine($headers, $row); // Consumer processes one row at a time.
	}
}

foreach (rowsFromCsv(__DIR__ . '/input.csv') as $row) {
	// Persist/process each row; do not append every row to another array.
}
```

Trong import thực tế, xử lý theo batch có transaction size giới hạn để cân bằng round trips và rollback cost; validate row errors, log row number và có strategy resume/idempotency.

## 4. Trade-off & Best practices

- Dùng generator/stream cho nguồn lớn, lazy computation hoặc pipeline; dùng array khi collection nhỏ, cần random access/reuse nhiều lần.
- Giới hạn batch, statement size và transaction duration; generator không tự giới hạn memory phía consumer/database driver.
- Với ORM, clear/detach identity map hoặc flush/clear theo batch để không giữ toàn bộ model graph.
- Đo peak PHP memory cùng process RSS/container memory; khi PHP usage ổn định mà RSS tăng, kiểm tra native extensions, buffers và allocator fragmentation.
- Trong worker lâu dài, xóa reference lớn sau task, reset request-scoped services/context, giới hạn cache và monitor theo từng job.
- Dùng `gc_status()`/`gc_collect_cycles()` trong profiling để hiểu cycle pressure; không dựa vào GC như substitute cho cleanup ownership.
- Xử lý encoding, delimiter, malformed lines và partial failures rõ ràng khi streaming file từ nguồn ngoài.

## 5. Lỗi thường gặp / Pitfalls

- `iterator_to_array()` trên generator lớn rồi kết luận generator tiết kiệm memory.
- Tạo closure/listener giữ reference tới object graph lớn qua nhiều job.
- Giữ mọi ORM entity trong collection khi import/export, gây memory tăng tuyến tính.
- Gọi `gc_collect_cycles()` quá thường xuyên làm CPU tăng mà không giải quyết reference còn reachable.
- Dựa riêng `memory_get_usage()` để đánh giá process/container memory.
- Xử lý file theo từng dòng nhưng mở transaction cho toàn bộ file, gây lock kéo dài và rollback quá lớn.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Reference counting và cycle collector khác gì?</b></summary>

Refcount thu hồi value khi không còn reference trực tiếp; cycle collector xử lý nhóm object tham chiếu vòng khiến count không về zero dù không còn reachable từ root.

</details>

<details>
<summary><b>Q2. PHP copy-on-write có nghĩa gì?</b></summary>

Giá trị có thể được chia sẻ cho đến khi mutation cần tách bản copy. Đọc/truyền array không nhất thiết copy ngay, nhưng mutation có thể tạo chi phí memory/time đáng kể.

</details>

<details>
<summary><b>Q3. Generator giảm memory trong điều kiện nào?</b></summary>

Khi producer phát từng phần và consumer xử lý/loại bỏ từng phần thay vì giữ tất cả. Driver, ORM, buffering hoặc consumer có thể vẫn materialize dữ liệu.

</details>

<details>
<summary><b>Q4. Vì sao memory của worker dài hạn tăng dù request model?</b></summary>

Worker có thể giữ references qua static/global/cache/listener, extension/native allocation, allocator fragmentation hoặc state chưa reset. Request boundary không tự đảm bảo mọi resource được thu hồi.

</details>

<details>
<summary><b>Q5. `memory_get_usage` có phản ánh RSS không?</b></summary>

Không. Nó phản ánh memory allocator PHP; RSS bao gồm thêm native memory, code, shared libraries và các vùng khác. Cần theo dõi cả hai ở production.

</details>

<details>
<summary><b>Q6. Chọn batch size thế nào?</b></summary>

Benchmark memory, DB round trips, lock duration, retry/rollback cost và throughput. Chọn size có headroom dưới memory/time budget, không tối ưu chỉ một chỉ số.

</details>

## 7. Ứng dụng vào CV

- Chuyển import **[N] triệu** rows sang streaming generator và batch persistence, giảm peak memory từ **[A] GB xuống [B] MB**.
- Tách ORM state theo batch và giới hạn worker cache, giảm OOM/restart **[A]%** trong job kéo dài **[B] giờ**.

## 8. Tài liệu tham khảo

- [PHP: Generators](https://www.php.net/manual/en/language.generators.overview.php)
- [PHP: Garbage Collection](https://www.php.net/manual/en/features.gc.php)
- [PHP: Memory management](https://www.php.net/manual/en/features.gc.refcounting-basics.php)
- [PHP: SplFileObject](https://www.php.net/manual/en/class.splfileobject.php)

