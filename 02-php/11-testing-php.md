# Testing PHP: PHPUnit/Pest, mocking, feature test

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Unit test kiểm tra behavior nhỏ cô lập; integration test xác nhận database/filesystem/framework boundaries; feature test kiểm tra use case qua HTTP/CLI.
- PHPUnit là nền tảng phổ biến; Pest cung cấp syntax expressive trên PHPUnit ecosystem. Chọn theo team, compatibility và tooling, không chỉ số dòng test.
- Mock external side effects at boundaries; không mock mọi collaborator hoặc ORM method khiến test chỉ xác nhận implementation.
- Test phải kiểm tra behavior/contract, gồm invalid input, authorization, transaction, retry/idempotency và side effects quan trọng.
- Database isolation, cleanup, deterministic time/randomness và teardown resource quyết định độ tin cậy của suite/CI parallelism.

## 2. Khái niệm cốt lõi

Test pyramid là heuristic phân bổ feedback: unit tests nhanh nhiều, integration tests cho các boundary rủi ro, ít end-to-end/feature flows hơn. PHP unit tests có thể chạy PHPUnit hoặc Pest; Pest chạy trên PHPUnit components, nên không nhất thiết là lựa chọn tách biệt hoàn toàn. PHPUnit attributes như `#[Test]`, data providers và assertions hỗ trợ test có cấu trúc.

Mock giả lập interaction/response để isolate unit; stub cung cấp dữ liệu; fake là implementation đơn giản có behavior thật (ví dụ in-memory mail transport). Mocking hợp lý ở network/payment/clock boundary. Với Eloquent/database, integration test với database tương thích thường phát hiện SQL/schema/transaction issue mà mock repository không thể.

Laravel feature tests có thể tạo application, gọi route, authenticate user, assert response/JSON/session/events/queue. `RefreshDatabase` hoặc transaction-based test isolation giữ dữ liệu riêng; SQLite in-memory nhanh nhưng behavior/index/JSON/locking có thể khác MySQL/PostgreSQL production. Test critical queries trên engine tương đồng production.

Test doubles phải xác minh contract chứ không che behavior. Test có thể được chia unit/integration/feature suites theo runtime cost. Parallel testing đòi fixture/unique IDs, database per process và port/resource isolation. Fake clock/environment/config giúp deterministic behavior; cleanup listener, temp files, queues, HTTP servers và static state sau test.

## 3. Code ví dụ

Ví dụ PHPUnit 11 unit test cho pure domain function; chạy với `vendor/bin/phpunit` sau khi cài PHPUnit như dev dependency.

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class TaxCalculator
{
	public function total(float $subtotal, float $rate): float
	{
		if ($subtotal < 0 || $rate < 0) {
			throw new InvalidArgumentException('Values must be non-negative');
		}
		return round($subtotal * (1 + $rate), 2);
	}
}

final class TaxCalculatorTest extends TestCase
{
	#[Test]
	public function it_calculates_total_with_tax(): void
	{
		self::assertSame(110.0, (new TaxCalculator())->total(100.0, 0.1));
	}
}
```

Với Laravel feature test, gọi `$this->postJson('/api/orders', $payload)` rồi assert status/body; fake queue/mail khi chỉ kiểm tra dispatch contract, và giữ integration tests cho worker/DB semantics quan trọng.

## 4. Trade-off & Best practices

- Viết test theo risk/behavior, không theo private methods; khi internal refactor không đổi contract, test không nên cần sửa.
- Unit test pure calculations nhanh; integration test repository/transaction; feature test authorization, validation và response contract.
- Mock external boundary, inject clock/random source; dùng fake implementation nếu interaction semantics cần thật hơn mock expectations.
- Chạy database feature tests trên engine production-compatible cho query/locking-sensitive code; isolate schema/data per suite/worker.
- Dùng data provider cho edge matrix, nhưng giữ test names/assertion dễ hiểu; tránh test mega-case kiểm tra nhiều concern cùng lúc.
- Bảo đảm test async/queue wait đúng completion, không chỉ assert job được dispatch nếu cần xác nhận job handler.
- Đo flakiness và duration; sửa nondeterminism, không tăng retry count để che race.

## 5. Lỗi thường gặp / Pitfalls

- Mock repository trong mọi test nên không phát hiện query sai, migration mismatch hay transaction behavior.
- Assert private implementation calls khiến refactor vô hại phá test.
- Dùng SQLite thay production DB mà bỏ qua dialect/locking/JSON behavior khác nhau.
- Test share static/cache/database state nên phụ thuộc order hoặc fail parallel.
- Quên cleanup temp files, mocks, event listeners hoặc environment, làm test suite nhiễm state.
- Test chỉ happy path, thiếu authorization, validation, duplicate delivery, deadlock/retry và boundary values.
- Dùng `sleep()` để đợi async operation thay vì synchronization/queue assertion có điều kiện.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. PHPUnit và Pest khác nhau thế nào?</b></summary>

PHPUnit cung cấp framework/API truyền thống; Pest thêm syntax expressive trên PHPUnit ecosystem. Cả hai có thể dùng chung concepts; chọn theo maintainability, compatibility và team familiarity.

</details>

<details>
<summary><b>Q2. Khi nào mock, khi nào dùng dependency thật?</b></summary>

Mock side-effect boundary để kiểm tra policy cô lập; dùng database/framework thật trong integration tests cho contract, query, transaction và serialization.

</details>

<details>
<summary><b>Q3. Feature test khác unit test?</b></summary>

Feature test chạy qua nhiều lớp ứng dụng (thường HTTP/CLI + framework/container/database), xác nhận observable use case; unit test tập trung logic nhỏ với setup nhẹ.

</details>

<details>
<summary><b>Q4. Làm sao test queue job?</b></summary>

Tách test dispatch contract (job được enqueue với dữ liệu đúng) khỏi handler behavior; test integration worker/DB cho retry, transaction, idempotency và external effects.

</details>

<details>
<summary><b>Q5. Vì sao coverage cao không bảo đảm test quality?</b></summary>

Coverage chỉ cho biết code đã chạy, không chứng minh assertions bắt lỗi. Cần test meaningful outcomes, boundary và failure modes.

</details>

<details>
<summary><b>Q6. Chuẩn bị test suite cho parallel CI thế nào?</b></summary>

Isolate database/schema per process, tạo unique fixtures, tránh shared ports/files/cache, cleanup deterministic và không phụ thuộc thứ tự chạy.

</details>

## 7. Ứng dụng vào CV

- Xây dựng unit/integration/feature suites cho **[N]** Laravel modules, giảm escaped defects **[A]%** và thời gian feedback CI từ **[B] xuống [C] phút**.
- Thay flaky shared fixtures bằng isolated database/clock fakes, nâng CI pass rate ổn định từ **[A]% lên [B]%**.

## 8. Tài liệu tham khảo

- [PHPUnit 11 documentation](https://docs.phpunit.de/en/11.0/)
- [Pest documentation](https://pestphp.com/docs/installation)
- [Laravel 11: Testing](https://laravel.com/docs/11.x/testing)
- [Laravel 11: Mocking](https://laravel.com/docs/11.x/mocking)

