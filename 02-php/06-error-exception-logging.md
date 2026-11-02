# Error/Exception handling, logging

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~8 phút

## 1. Tóm tắt nhanh (TL;DR)

- PHP `Throwable` là root cho `Error` và `Exception`; catch loại lỗi phù hợp, không nuốt `Throwable` rồi trả success giả.
- Dùng exception cho exceptional/control-flow failure có ý nghĩa; validation phổ biến có thể trả result/error collection tùy API.
- Chuyển lỗi tại application/HTTP/CLI boundary thành response/exit code, giữ nguyên nguyên nhân cho diagnostics nhưng không lộ chi tiết nội bộ.
- PSR-3 chuẩn hóa logger API; log có context/correlation ID, redact secrets/PII và chọn level theo hành động vận hành.
- Error handler có thể chuyển PHP warnings thành `ErrorException`, nhưng chỉ với error level nằm trong policy và không thể xử lý mọi fatal/engine condition như exception thông thường.

## 2. Khái niệm cốt lõi

PHP phân biệt `Error` (engine/type/runtime-level failures) và `Exception` (exceptional application/library conditions); cả hai implement `Throwable`. `catch (Throwable)` hữu ích ở process boundary để log/fail gracefully, nhưng catch quá rộng ở business logic dễ che programming errors. Custom exception nên biểu diễn semantic failure ổn định, có `previous` để giữ causal chain khi wrap.

Error handling có nhiều boundary: HTTP request cần status/body; CLI cần stderr/exit code; queue consumer cần retry/dead-letter policy. Ở mỗi boundary, phân loại lỗi: validation/not found thường không retry; transient dependency timeout có thể retry có giới hạn; invariant violation cần alert và thường không retry mù. Không biến mọi throwable thành HTTP 200 hoặc message ack.

Logging khác debugging output. Structured logs nên có timestamp, severity, service/version, correlation/trace ID, operation và context có kiểm soát. PSR-3 định nghĩa method `debug` đến `emergency` và placeholder context; implementation quyết định destination/format. Exception log cần stack/cause ở nơi có đủ context, nhưng client nhận thông báo an toàn. Metrics/traces bổ sung dimension và causal path; log không nên là metric counter duy nhất.

PHP error reporting (`error_reporting`, `display_errors`, `log_errors`) cấu hình môi trường. Production không hiển thị error detail cho user; ghi log bảo vệ. `set_error_handler` có thể chuyển warnings/notices thành `ErrorException` theo mask, nhưng callback không xử lý error levels bị loại và một số fatal/compile errors có lifecycle riêng.

## 3. Code ví dụ

Ví dụ chuyển warning được chọn thành exception trong scope, rồi xử lý ở boundary mà không in chi tiết cho user. Dùng `finally` để phục hồi handler.

```php
<?php
declare(strict_types=1);

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
	if (!(error_reporting() & $severity)) {
		return false;
	}
	throw new ErrorException($message, 0, $severity, $file, $line);
});

try {
	// Run an operation whose warnings should be treated as failures.
	$contents = file_get_contents(__DIR__ . '/required-input.txt');
} catch (ErrorException $exception) {
	error_log(sprintf('Input read failed: %s', $exception->getMessage()));
	http_response_code(500);
	echo 'Unable to process request';
} finally {
	restore_error_handler();
}
```

Framework apps normally centralize conversion/reporting in exception handler and inject PSR-3 logger; avoid calling `error_log` throughout domain code. The example uses built-in facilities so it runs without a logging package.

## 4. Trade-off & Best practices

- Ném exception khi caller không thể tiếp tục hợp lệ; tránh dùng exception cho branch bình thường xảy ra thường xuyên nếu Result object đơn giản hơn.
- Wrap exception khi thêm abstraction/context nhưng luôn giữ previous/cause; không log cùng một lỗi lặp ở mọi layer.
- Chọn log level theo hành động: error là cần điều tra/failure, warning là bất thường nhưng tiếp tục, info cho lifecycle quan trọng; tránh log mọi request ở info nếu volume lớn.
- Dùng structured context và correlation ID; redact password, token, cookie, payment data và dữ liệu cá nhân theo policy.
- `display_errors=Off`, `log_errors=On` trong production; phân quyền log storage, retention và alerting.
- Retry theo taxonomy, deadline, exponential backoff+jitter và idempotency; đưa exhausted job vào dead-letter hoặc phản hồi lỗi rõ.
- Tạo custom exception hierarchy gọn, ổn định theo domain boundary; không tạo một class cho mọi câu thông báo.

## 5. Lỗi thường gặp / Pitfalls

- Catch `Throwable` rồi bỏ qua hoặc tiếp tục với object/state có thể không hợp lệ.
- Log exception ở mỗi layer, tạo stack trace trùng lặp và chi phí/alert noise.
- Hiển thị stack trace, SQL, file path hoặc credentials cho client.
- Ghi context nhạy cảm vào log hoặc dùng user input chưa sanitize gây log injection.
- Chuyển tất cả warnings thành exceptions toàn cục mà không hiểu thư viện cũ phụ thuộc behavior đó.
- Retry mọi exception, bao gồm validation/business rejection hoặc side effect không idempotent.
- Cấu hình `error_reporting` thấp đến mức warnings quan trọng biến mất khỏi telemetry.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. `Error` và `Exception` khác gì trong PHP?</b></summary>

Cả hai implement `Throwable`; `Error` thường biểu diễn lỗi engine/type, `Exception` là exception class cho application/library conditions. Boundary có thể catch `Throwable`, còn logic nội bộ nên catch loại cụ thể.

</details>

<details>
<summary><b>Q2. Khi nào nên catch `Throwable`?</b></summary>

Ở process/request boundary để ghi nhận và chuyển thành failure response/exit, hoặc cleanup rồi rethrow. Tránh catch rộng trong domain code nếu không thể phục hồi đúng.

</details>

<details>
<summary><b>Q3. Vì sao cần giữ previous exception?</b></summary>

Giữ causal chain khi chuyển lỗi từ tầng thấp sang semantic exception cấp cao, giúp log/debug nguyên nhân mà không làm API contract phụ thuộc exception implementation cụ thể.

</details>

<details>
<summary><b>Q4. PSR-3 giải quyết điều gì?</b></summary>

Chuẩn hóa interface logging và levels/context để application không phụ thuộc trực tiếp một logger implementation. Nó không quy định backend, retention hay redaction policy.

</details>

<details>
<summary><b>Q5. Warning có nên luôn chuyển thành exception?</b></summary>

Không. Chuyển có chọn lọc theo severity/use case; legacy dependency có thể dựa vào warning behavior. Handler không thay thế cấu hình error reporting hay xử lý fatal condition.

</details>

<details>
<summary><b>Q6. Thiết kế retry cho queue job thế nào?</b></summary>

Phân loại transient/permanent, giới hạn attempts/deadline, backoff+jitter, bảo đảm idempotency, ghi metrics và đưa exhausted message vào dead-letter để điều tra.

</details>

## 7. Ứng dụng vào CV

- Chuẩn hóa exception taxonomy, structured logging và correlation IDs trên **[N]** services, giảm MTTR incident từ **[A] xuống [B] phút**.
- Loại bỏ log PII/secret và phân loại retry/dead-letter cho queue, giảm duplicate side effects **[A]%** qua **[B] jobs/ngày**.

## 8. Tài liệu tham khảo

- [PHP: Errors and Exceptions](https://www.php.net/manual/en/language.errors.php)
- [PHP: Error Handling Functions](https://www.php.net/manual/en/ref.errorfunc.php)
- [PSR-3: Logger Interface](https://www.php-fig.org/psr/psr-3/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
