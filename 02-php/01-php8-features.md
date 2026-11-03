# PHP 8.x features (types, enums, readonly, match, attributes, fibers, named args, JIT)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- PHP 8.x tăng khả năng diễn đạt contract bằng union/intersection types, enums, readonly properties/classes, attributes và named arguments.
- `match` là expression so sánh strict, trả giá trị và không fall through; khác `switch` ở semantics.
- `readonly` giới hạn việc gán property, không biến object graph lồng nhau thành deep immutable.
- Fibers cung cấp primitive để framework/runtime xây dựng cooperative concurrency; không tự làm code blocking thành parallel.
- JIT có thể giúp một số workload CPU-bound, nhưng web app thường bị giới hạn bởi I/O/DB; benchmark workload thật trước khi bật/tối ưu.

## 2. Khái niệm cốt lõi

PHP 8 cải thiện type system và giảm boilerplate, nhưng type declaration không thay thế validation ở trust boundary. Union type (`A|B`), intersection type (`A&B`) và DNF types mô tả tập giá trị/contract. `mixed`, nullable, `never`, `static` return type và variance giúp API rõ hơn; bật `strict_types=1` ảnh hưởng kiểm tra scalar argument theo file gọi, không biến PHP thành ngôn ngữ có type soundness hoàn toàn.

Enums có thể là pure enum hoặc backed enum (`string`/`int`). Backed enum hữu ích cho domain values có serialization ổn định; không nên để enum thay thế entity có state/lifecycle. `match` dùng so sánh `===` và phải có nhánh khớp tại runtime, nếu không sẽ ném `UnhandledMatchError`. Không bắt buộc có `default`: với enum, liệt kê từng case giúp phát hiện case mới chưa được xử lý; PHP không kiểm tra exhaustiveness lúc compile. Nullsafe operator ngắn gọn cho chain có thể null, nhưng dùng quá sâu dễ che thiếu invariant.

Readonly properties từ PHP 8.1 và readonly classes từ 8.2 giới hạn gán sau initialization; PHP 8.3 thêm `#[\Override]` để kiểm tra method thực sự override parent/interface. Từ PHP 8.3, readonly property có thể được khởi tạo lại trong `__clone()` theo quy tắc riêng; vì vậy không nên mô tả là cấm mọi lần gán lại trong mọi lifecycle. Readonly chỉ shallow: object property có thể tham chiếu object mutable, nhưng không thể gán lại property. Typed class constants từ PHP 8.3 giúp ràng buộc loại constant. Attributes là metadata cấu trúc để framework/reflection đọc, thay vì annotation docblock không được runtime kiểm tra.

Named arguments giúp call site dễ đọc nhưng tên parameter trở thành API compatibility concern. Constructor property promotion giảm boilerplate nhưng không nên làm constructor thành nơi chứa toàn bộ logic. Fibers suspend/resume một call stack cooperative; scheduler hoặc async framework phải tự quản lý I/O và scheduling. JIT biên dịch một số code path thành machine code, song lợi ích phụ thuộc workload và không thay thế OPcache.

## 3. Code ví dụ

Ví dụ dùng enum, readonly DTO, `match`, named arguments và `json_validate` (PHP 8.3+). Lưu thành file PHP và chạy bằng PHP 8.3+.

```php
<?php
declare(strict_types=1);

enum OrderStatus: string
{
	case Pending = 'pending';
	case Paid = 'paid';
	case Cancelled = 'cancelled';
}

final readonly class OrderSummary
{
	public function __construct(
		public int $id,
		public OrderStatus $status,
	) {}
}

function label(OrderStatus $status): string
{
	return match ($status) {
		OrderStatus::Pending => 'Awaiting payment',
		OrderStatus::Paid => 'Complete',
		OrderStatus::Cancelled => 'Cancelled',
	};
}

if (json_validate('{"status":"paid"}')) { // PHP 8.3: validate without decoding.
	$summary = new OrderSummary(status: OrderStatus::Paid, id: 42);
	echo label($summary->status), PHP_EOL;
}
```

## 4. Trade-off & Best practices

- Dùng type để thể hiện invariant nội bộ; validate input/JSON/DB ở boundary rồi chuyển sang typed domain values.
- Backed enum phù hợp tập giá trị hữu hạn; giữ mapping persistence/serialization rõ và cân nhắc migration khi thêm case.
- Dùng named arguments ở call site cho API ổn định; khi rename parameter public, xem đó là breaking change với callers sử dụng named args.
- Readonly object phù hợp value object/DTO; nếu property chứa mutable object, thiết kế defensive copy hoặc immutable collaborator khi cần deep immutability.
- Attributes hữu ích cho metadata framework; không lạm dụng reflection cho logic có thể compile-time/type-check rõ hơn.
- JIT benchmark với production-like data và profiler; đo p95/p99, CPU, memory chứ không chỉ microbenchmark.
- Fibers dành cho runtime/framework coordination; với ứng dụng thông thường ưu tiên API đồng bộ/asynchronous chính thức của framework.

## 5. Lỗi thường gặp / Pitfalls

- Nghĩ `readonly` đồng nghĩa toàn bộ object graph immutable hoặc có thể serialize/clone tùy ý mà không xét state lồng nhau.
- Bỏ `default` trong `match` rồi bất ngờ `UnhandledMatchError` khi enum/domain thêm case.
- Thay string literal bằng enum nhưng quên boundary tương thích với DB/API cũ.
- Đổi tên parameter public mà không tính named argument callers.
- Dùng JIT như giải pháp tăng tốc mọi request, bỏ qua query, network, serialization và cache.
- Cho rằng Fiber tự tạo parallelism hoặc mọi blocking call sẽ tự suspend.
- Dùng attributes mà không validate metadata/config lúc boot, dẫn tới lỗi runtime muộn.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. `match` khác `switch` thế nào?</b></summary>

`match` là expression trả giá trị, so sánh strict (`===`), không fall through; nếu không nhánh nào khớp (và không có `default`) thì ném `UnhandledMatchError` lúc runtime — PHP không kiểm tra exhaustiveness lúc compile. `switch` có semantics loose comparison và fall-through nếu thiếu `break`.

</details>

<details>
<summary><b>Q2. Readonly class có deep immutable không?</b></summary>

Không. Property bị hạn chế gán lại sau initialization (có quy tắc reinitialization trong __clone từ PHP 8.3), nhưng object được tham chiếu vẫn có thể mutable. Readonly bảo vệ binding/property, không tự đóng băng graph.

</details>

<details>
<summary><b>Q3. Khi nào dùng backed enum?</b></summary>

Khi domain có tập giá trị hữu hạn cần lưu/serialize ổn định. Cần quản lý mapping và migration khi thay đổi case; không dùng enum cho dữ liệu entity mở rộng tùy ý.

</details>

<details>
<summary><b>Q4. Named arguments có ảnh hưởng API không?</b></summary>

Có. Parameter names thành một phần call-site contract; rename có thể phá caller dù positional call vẫn hoạt động. Chỉ expose named-call-friendly API khi có kế hoạch compatibility.

</details>

<details>
<summary><b>Q5. Fibers có làm PHP chạy song song không?</b></summary>

Không tự thân. Fiber là cơ chế suspend/resume cooperative; scheduler/framework quyết định lúc nào chuyển task. Parallelism cần process/thread/runtime hỗ trợ tương ứng.

</details>

<details>
<summary><b>Q6. PHP JIT có luôn tăng tốc ứng dụng web?</b></summary>

Không. Lợi ích thường giới hạn ở CPU-bound PHP code; ứng dụng I/O-bound có thể không cải thiện. Cần benchmark sau OPcache và profile bottleneck thật.

</details>

## 7. Ứng dụng vào CV

- Chuẩn hóa domain values bằng backed enums, readonly DTO và strict contracts trên **[N]** module, giảm lỗi trạng thái không hợp lệ **[A]%**.
- Profile và tối ưu workload CPU-bound trong PHP 8.x, giảm thời gian xử lý batch **[A]%** trên **[N]** records mà không tăng memory vượt **[B] MB**.

## 8. Tài liệu tham khảo

- [PHP: Enumerations](https://www.php.net/manual/en/language.types.enumerations.php)
- [PHP: Readonly properties](https://www.php.net/manual/en/language.oop5.properties.php#language.oop5.properties.readonly-properties)
- [PHP: Match expression](https://www.php.net/manual/en/control-structures.match.php)
- [PHP: Fibers](https://www.php.net/manual/en/language.fibers.php)
- [PHP: JIT configuration](https://www.php.net/manual/en/opcache.configuration.php#ini.opcache.jit)
